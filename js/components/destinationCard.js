import { destinationHref } from "../config.js";
import { getImage } from "../data/destinations.js";

const TYPE_FALLBACK = {
  ciudad: "Ciudad",
  natural: "Naturaleza",
  historico: "Sitio histórico",
  cultural: "Cultural",
  arquitectonico: "Arquitectura",
  costa: "Costa",
  montana: "Montaña",
};

/**
 * Pieza editorial de destino (no card genérica de dashboard).
 */
export function createDestinationCard(destination, { labels = {}, variant = "editorial" } = {}) {
  const article = document.createElement("article");
  article.className =
    variant === "featured" ? "spot spot--featured" : variant === "compact" ? "spot spot--compact" : "spot";

  const href = destinationHref(destination.id);
  const image = getImage(destination, 0);
  const type = labels[destination.type] || TYPE_FALLBACK[destination.type] || destination.type;
  const meta = [destination.country, destination.continent].filter(Boolean).join(" · ");

  article.innerHTML = `
    <a class="spot__link" href="${href}">
      <div class="spot__media">
        ${
          image
            ? `<img src="${image.url}" alt="${escapeAttr(image.alt || destination.name)}" loading="lazy" width="960" height="640">`
            : `<div class="spot__placeholder" aria-hidden="true"></div>`
        }
      </div>
      <div class="spot__body">
        <p class="spot__eyebrow">${escapeHtml(type)}</p>
        <h3 class="spot__title">${escapeHtml(destination.name || "Destino")}</h3>
        <p class="spot__meta">${escapeHtml(meta)}</p>
        <p class="spot__excerpt">${escapeHtml(trimText(destination.description || "", 140))}</p>
      </div>
    </a>
  `;

  return article;
}

export function createDestinationRow(destination, { labels = {}, onLocate } = {}) {
  const row = document.createElement("article");
  row.className = "spot-row";
  row.dataset.destinationId = destination.id;

  const image = getImage(destination, 0);
  const type = labels[destination.type] || TYPE_FALLBACK[destination.type] || destination.type;

  row.innerHTML = `
    <a class="spot-row__link" href="${destinationHref(destination.id)}">
      <div class="spot-row__media">
        ${
          image
            ? `<img src="${image.url}" alt="${escapeAttr(image.alt || destination.name)}" loading="lazy" width="240" height="160">`
            : ""
        }
      </div>
      <div class="spot-row__body">
        <p class="spot__eyebrow">${escapeHtml(type)}</p>
        <h3 class="spot-row__title">${escapeHtml(destination.name)}</h3>
        <p class="spot__meta">${escapeHtml(`${destination.city} · ${destination.country} · ${destination.continent}`)}</p>
      </div>
    </a>
    ${
      onLocate
        ? `<button class="spot-row__locate" type="button">En el mapa</button>`
        : ""
    }
  `;

  if (onLocate) {
    const button = row.querySelector(".spot-row__locate");
    button.setAttribute("aria-label", `Ver ${destination.name} en el mapa`);
    button.addEventListener("click", () => onLocate(destination));
  }

  return row;
}

function trimText(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
