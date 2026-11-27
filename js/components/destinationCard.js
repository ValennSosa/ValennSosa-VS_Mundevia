import { ROUTES } from "../config.js";

/**
 * Card reutilizable de destino.
 * Etapa 0: helper listo; se usará cuando exista el catálogo JSON.
 */
export function createDestinationCard(destination) {
  const article = document.createElement("article");
  article.className = "card-destination";

  const href = `${ROUTES.destination}?id=${encodeURIComponent(destination.id || "")}`;
  const image = destination.images?.[0] || "";
  const meta = [destination.country, destination.continent].filter(Boolean).join(" · ");

  article.innerHTML = `
    <div class="card-destination__media">
      ${
        image
          ? `<img src="${image}" alt="${destination.name || "Destino"}" loading="lazy" width="640" height="400">`
          : ""
      }
    </div>
    <h3 class="card-destination__title">
      <a href="${href}">${destination.name || "Destino"}</a>
    </h3>
    <p class="card-destination__meta">${meta}</p>
  `;

  return article;
}
