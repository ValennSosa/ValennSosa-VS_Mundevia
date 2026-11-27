/**
 * Mapa del explorador (Leaflet), solo en explorador.html.
 *
 * Teselas: Esri World Dark Gray Canvas, servicio público World_Dark_Gray_Base.
 * https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer
 * No pide clave. Esri lo ofrece como fondo neutro para contenido temático.
 * Cobertura mundial hasta el nivel 10; en varias regiones llega al 16.
 * Atribución publicada por el servicio:
 * Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS user community.
 * OpenStreetMap sigue bajo ODbL: https://www.openstreetmap.org/copyright
 * Ficha del mapa: https://goto.arcgisonline.com/maps/World_Dark_Gray_Base
 */
import { destinationHref } from "../config.js";
import { getImage } from "../data/destinations.js";

const TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const TILE_ATTRIBUTION =
  'Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, and the GIS user community';
const CLUSTER_PX = 34;
const instances = new WeakMap();

export async function initMap(container, { destinations = [] } = {}) {
  if (!container) return null;
  instances.get(container)?.destroy();

  const canvas = container.querySelector("[data-map-canvas]");
  const status = container.querySelector("[data-map-status]");
  const empty = container.querySelector("[data-map-empty]");
  if (!canvas) return null;

  container.dataset.mapState = "loading";
  if (status) {
    status.hidden = false;
    status.classList.remove("u-sr-only");
    status.textContent = "Preparando el mapa…";
  }

  let L;
  try {
    L = await import("../../node_modules/leaflet/dist/leaflet-src.esm.js");
  } catch (error) {
    console.error(error);
    showFailure(container, status, "No se pudo cargar el mapa.");
    return noop();
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const map = L.map(canvas, {
    minZoom: 2,
    maxZoom: 10,
    zoomControl: true,
    scrollWheelZoom: true,
    worldCopyJump: true,
    zoomAnimation: !reduced,
    fadeAnimation: !reduced,
    markerZoomAnimation: !reduced,
  });

  const tiles = L.tileLayer(TILE_URL, {
    attribution: TILE_ATTRIBUTION,
    maxZoom: 16,
    maxNativeZoom: 10,
  });
  tiles.addTo(map);

  const group = L.layerGroup().addTo(map);
  const api = createController({ L, map, tiles, group, canvas, container, status, empty, reduced, destinations });
  instances.set(container, api);
  return api;
}

function createController({ L, map, tiles, group, container, status, empty, reduced, destinations }) {
  let current = withCoords(destinations);
  let knownTotal = current.length;
  let markerIndex = new Map();
  let disposed = false;
  let redrawing = false;
  let selectedId = null;
  let tileErrors = 0;
  let fittedKey = "";
  let currentKey = "";

  const ResetControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const button = L.DomUtil.create("button", "map__reset");
      button.type = "button";
      button.textContent = "Vista global";
      button.setAttribute("aria-label", "Recuperar la vista global de los destinos");
      L.DomEvent.disableClickPropagation(button);
      L.DomEvent.on(button, "click", (event) => {
        L.DomEvent.stop(event);
        fitCurrent(true);
      });
      return button;
    },
  });
  map.addControl(new ResetControl());

  function draw() {
    if (disposed) return;
    const keep = selectedId;
    redrawing = true;
    group.clearLayers();
    markerIndex = new Map();
    const clusters = clusterDestinations(L, map, current);
    clusters.forEach((items) => {
      if (items.length === 1) {
        const marker = L.marker(latLngOf(items[0]), {
          icon: pinIcon(L),
          title: items[0].name,
          keyboard: true,
          alt: items[0].name,
        });
        marker.bindPopup(popupHtml(items[0]), { className: "map-popup", maxWidth: 260, autoPanPadding: [28, 28] });
        marker.on("popupopen", () => {
          selectedId = items[0].id;
          marker.getElement()?.classList.add("is-selected");
        });
        marker.on("popupclose", () => {
          if (!redrawing && selectedId === items[0].id) selectedId = null;
          marker.getElement()?.classList.remove("is-selected");
        });
        marker.addTo(group);
        markerIndex.set(items[0].id, marker);
        return;
      }
      const marker = L.marker(clusterCenter(items), {
        icon: clusterIcon(L, items.length),
        title: `${items.length} destinos cercanos`,
        keyboard: true,
        alt: `${items.length} destinos cercanos`,
      });
      marker.on("click", () => openCluster(items, marker));
      marker.addTo(group);
      items.forEach((item) => markerIndex.set(item.id, marker));
    });
    redrawing = false;
    selectedId = keep;
    container.dataset.markerCount = String(current.length);
    container.dataset.clusterCount = String(clusters.filter((items) => items.length > 1).length);
    if (empty) empty.hidden = current.length > 0;
    restoreSelection();
  }

  function restoreSelection() {
    if (!selectedId) return;
    const marker = markerIndex.get(selectedId);
    if (!marker) return;
    const grouped = current.filter((item) => markerIndex.get(item.id) === marker);
    if (grouped.length !== 1) return;
    marker.openPopup();
    marker.getElement()?.classList.add("is-selected");
  }

  function openCluster(items, marker) {
    const bounds = L.latLngBounds(items.map((item) => latLngOf(item)));
    const stillTight = map.getZoom() >= 8 && bounds.getNorthEast().distanceTo(bounds.getSouthWest()) < 80000;
    if (stillTight) {
      marker.bindPopup(clusterPopupHtml(items), { className: "map-popup", maxWidth: 260 }).openPopup();
      return;
    }
    map.fitBounds(bounds, { padding: [42, 42], maxZoom: 9, animate: !reduced });
  }

  function fitCurrent(force) {
    const key = current.map((item) => item.id).join("|");
    if (!force && key === fittedKey) return;
    fittedKey = key;
    if (!current.length) {
      map.setView([18, 8], 2, { animate: !reduced });
      return;
    }
    if (current.length === 1) {
      map.setView(latLngOf(current[0]), 5, { animate: !reduced });
      return;
    }
    const bounds = L.latLngBounds(current.map((item) => latLngOf(item)));
    const wide = current.length >= knownTotal && knownTotal > 1;
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: wide ? 3 : 5, animate: !reduced });
  }

  function setDestinations(list, { fit = true, total = knownTotal } = {}) {
    if (disposed) return;
    knownTotal = total || knownTotal;
    const next = withCoords(list);
    if (selectedId && !next.some((item) => item.id === selectedId)) selectedId = null;
    const key = next.map((item) => item.id).join("|");
    if (key === currentKey) {
      if (fit) fitCurrent(false);
      announce();
      return;
    }
    currentKey = key;
    current = next;
    draw();
    if (fit) fitCurrent(false);
    else fittedKey = key;
    announce();
  }

  function focus(id) {
    if (disposed) return;
    const destination = current.find((item) => item.id === id);
    if (!destination) return;
    selectedId = id;
    const targetZoom = Math.max(map.getZoom(), 7);
    document.getElementById("mapa")?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "center",
    });
    const finish = () => {
      draw();
      const marker = markerIndex.get(id);
      if (!marker) return;
      const grouped = current.filter((item) => markerIndex.get(item.id) === marker);
      if (grouped.length > 1) openCluster(grouped, marker);
    };
    const target = L.latLng(latLngOf(destination));
    const alreadyThere = map.getZoom() >= targetZoom && map.getCenter().distanceTo(target) < 2000;
    if (reduced || alreadyThere) {
      map.setView(target, targetZoom, { animate: false });
      finish();
      return;
    }
    map.once("moveend", finish);
    map.flyTo(target, targetZoom, { duration: 0.65 });
  }

  function announce() {
    if (!status || container.dataset.mapState !== "ready") return;
    status.textContent = current.length
      ? `${current.length} destino${current.length === 1 ? "" : "s"} en el mapa.`
      : "Ningún destino coincide con los filtros.";
  }

  function onZoom() {
    if (!disposed) draw();
  }

  function onTilesReady() {
    if (disposed || container.dataset.mapState === "error") return;
    container.dataset.mapState = "ready";
    if (status) {
      status.classList.add("u-sr-only");
      announce();
    }
  }

  function onTileError() {
    tileErrors += 1;
    if (tileErrors > 2 && status) {
      status.hidden = false;
      status.classList.remove("u-sr-only");
      status.textContent = "No se pudo cargar el fondo del mapa. Los destinos siguen en la lista.";
      container.dataset.mapState = "error";
    }
  }

  map.on("zoomend", onZoom);
  tiles.on("load", onTilesReady);
  tiles.on("tileerror", onTileError);
  map.setView([18, 8], 2);
  draw();
  currentKey = current.map((item) => item.id).join("|");
  fitCurrent(true);
  requestAnimationFrame(() => {
    if (disposed) return;
    map.invalidateSize();
    fitCurrent(true);
  });

  const resizeObserver = new ResizeObserver(() => {
    if (!disposed) map.invalidateSize();
  });
  resizeObserver.observe(canvas);

  function destroy() {
    if (disposed) return;
    disposed = true;
    resizeObserver.disconnect();
    map.off("zoomend", onZoom);
    tiles.off("load", onTilesReady);
    tiles.off("tileerror", onTileError);
    map.remove();
    if (instances.get(container)?.destroy === destroy) instances.delete(container);
  }

  return {
    setDestinations,
    focus,
    resetView() {
      fitCurrent(true);
    },
    destroy,
  };
}

function withCoords(list) {
  return (list || []).filter((item) => Number.isFinite(item?.coords?.lat) && Number.isFinite(item?.coords?.lng));
}

function latLngOf(destination) {
  return [destination.coords.lat, destination.coords.lng];
}

function clusterCenter(items) {
  const lat = items.reduce((sum, item) => sum + item.coords.lat, 0) / items.length;
  const lng = items.reduce((sum, item) => sum + item.coords.lng, 0) / items.length;
  return [lat, lng];
}

function clusterDestinations(L, map, destinations) {
  const items = destinations.map((destination) => ({
    destination,
    point: map.latLngToLayerPoint(latLngOf(destination)),
  }));
  const groups = items.map((item) => [item]);
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < groups.length; i += 1) {
      for (let j = i + 1; j < groups.length; j += 1) {
        if (!groupsNear(groups[i], groups[j])) continue;
        groups[i].push(...groups[j]);
        groups.splice(j, 1);
        merged = true;
        break;
      }
      if (merged) break;
    }
  }
  return groups.map((group) => group.map((item) => item.destination));
}

function groupsNear(a, b) {
  return a.some((left) => b.some((right) => {
    const dx = left.point.x - right.point.x;
    const dy = left.point.y - right.point.y;
    return dx * dx + dy * dy <= CLUSTER_PX * CLUSTER_PX;
  }));
}

function pinIcon(L) {
  return L.divIcon({
    className: "map-pin",
    html: '<span class="map-pin__dot"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

function clusterIcon(L, count) {
  return L.divIcon({
    className: "map-cluster",
    html: `<span>${count}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function popupHtml(destination) {
  const image = getImage(destination, 0);
  const credit = [image?.credit, image?.license].filter(Boolean).join(" · ");
  return `
    <article class="map-card">
      ${
        image
          ? `<img class="map-card__image" src="${escapeAttr(image.url)}" alt="${escapeAttr(image.alt || destination.name)}" width="320" height="180" loading="lazy">`
          : ""
      }
      ${credit ? `<p class="map-card__credit">${escapeHtml(credit)}</p>` : ""}
      <p class="map-card__kicker">${escapeHtml(destination.continent || "")}</p>
      <h2 class="map-card__title">${escapeHtml(destination.name || "")}</h2>
      <p class="map-card__meta">${escapeHtml(destination.country || "")}</p>
      <a class="map-card__link" href="${destinationHref(destination.id)}">Ver destino</a>
    </article>
  `;
}

function clusterPopupHtml(items) {
  return `
    <div class="map-card">
      <p class="map-card__kicker">${items.length} destinos cercanos</p>
      <ul class="map-card__list">
        ${items
          .map(
            (item) =>
              `<li><a href="${destinationHref(item.id)}">${escapeHtml(item.name)} · ${escapeHtml(item.country)}</a></li>`
          )
          .join("")}
      </ul>
    </div>
  `;
}

function showFailure(container, status, message) {
  container.dataset.mapState = "error";
  container.dataset.markerCount = "0";
  if (status) {
    status.hidden = false;
    status.classList.remove("u-sr-only");
    status.textContent = `${message} La lista de destinos sigue disponible.`;
  }
}

function noop() {
  return { setDestinations() {}, focus() {}, resetView() {}, destroy() {} };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
