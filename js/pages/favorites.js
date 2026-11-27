import { getCatalogMeta, getDestinations } from "../data/destinations.js";
import { createDestinationCard } from "../components/destinationCard.js";
import { FAVORITES_EVENT, getFavoriteIds, retainKnownFavorites } from "../services/favorites.js";
import { ROUTES } from "../config.js";

export async function initFavoritesPage() {
  const status = document.querySelector("[data-favorites-status]");
  const list = document.querySelector("[data-favorites-list]");
  if (!list) return;

  let labels = {};
  let catalog = [];

  const render = () => {
    const saved = new Set(getFavoriteIds());
    const visible = catalog
      .filter((destination) => saved.has(destination.id))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    list.replaceChildren();

    if (!visible.length) {
      list.append(emptyCollection());
      if (status) status.textContent = "Todavía no guardaste destinos.";
      return;
    }

    const rail = document.createElement("div");
    rail.className = "spot-rail";
    visible.forEach((destination) => {
      rail.append(createDestinationCard(destination, { labels }));
    });
    list.append(rail);
    if (status) {
      status.textContent = `${visible.length} destino${visible.length === 1 ? "" : "s"} guardado${
        visible.length === 1 ? "" : "s"
      }.`;
    }
  };

  try {
    const [meta, destinations] = await Promise.all([getCatalogMeta(), getDestinations()]);
    labels = meta.typeLabels || {};
    catalog = destinations;
    retainKnownFavorites(destinations.map((destination) => destination.id));
  } catch (error) {
    console.error(error);
    list.replaceChildren(loadError());
    if (status) status.textContent = "No se pudo leer el catálogo.";
    return;
  }

  render();
  window.addEventListener(FAVORITES_EVENT, render);
}

function emptyCollection() {
  const box = document.createElement("div");
  box.className = "empty-state";
  box.setAttribute("role", "status");
  box.innerHTML = `
    <h2 class="empty-state__title">Tu colección está vacía</h2>
    <p>Guardá un destino desde el catálogo o desde su ficha. Va a quedar en este navegador.</p>
    <a class="btn btn--primary" href="${ROUTES.explorer}">Explorar destinos</a>
  `;
  return box;
}

function loadError() {
  const box = document.createElement("div");
  box.className = "empty-state";
  box.setAttribute("role", "status");
  box.innerHTML = `
    <h2 class="empty-state__title">No se pudieron mostrar los favoritos</h2>
    <p>El catálogo no cargó. Podés volver al explorador y reintentar.</p>
    <a class="btn btn--primary" href="${ROUTES.explorer}">Ir al explorador</a>
  `;
  return box;
}
