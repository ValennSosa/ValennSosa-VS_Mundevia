import { getCatalogMeta, getDestinationById, getRelatedDestinations } from "../data/destinations.js";
import { renderGallery } from "../components/gallery.js";
import { createDestinationCard } from "../components/destinationCard.js";
import { typeLabel } from "../services/filters.js";
import { ROUTES } from "../config.js";
import { createFavoriteButton } from "../components/favoriteButton.js";

/**
 * Fichas compartibles vía ?id=
 */
export async function initDestinationPage() {
  const root = document.querySelector("[data-destination-root]");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    root.innerHTML = emptyState(
      "Elegí un destino",
      "Abrí una ficha desde el explorador, el buscador o un enlace compartido con el formato destino.html?id=slug."
    );
    return;
  }

  try {
    const [destination, meta] = await Promise.all([getDestinationById(id), getCatalogMeta()]);
    if (!destination) {
      root.innerHTML = emptyState(
        "Destino no encontrado",
        `No hay un lugar con el identificador “${id}”. Probá otra búsqueda en el explorador.`,
        ROUTES.explorer
      );
      return;
    }

    const labels = meta.typeLabels || {};
    const related = await getRelatedDestinations(destination, 3);
    renderDestination(root, destination, { labels, related });
    updateDocumentMeta(destination);
  } catch (error) {
    console.error(error);
    root.innerHTML = emptyState(
      "No pudimos cargar la ficha",
      "Revisá tu conexión o volvé a intentar en unos segundos."
    );
  }
}

function renderDestination(root, destination, { labels, related }) {
  const category = typeLabel(destination.type, labels);
  const coords = destination.coords
    ? `${destination.coords.lat.toFixed(4)}, ${destination.coords.lng.toFixed(4)}${
        destination.coords.note ? ` · ${destination.coords.note}` : ""
      }`
    : "No disponible";

  root.innerHTML = `
    <header class="destination-hero">
      <div class="u-container destination-hero__grid">
        <div>
          <p class="page-header__eyebrow">${escapeHtml(category)} · ${escapeHtml(destination.continent)}</p>
          <h1 class="page-header__title" data-destination-title>${escapeHtml(destination.name)}</h1>
          <p class="page-header__lead">${escapeHtml(destination.description)}</p>
          <p class="destination-meta">
            <span>${escapeHtml(destination.city)}</span>
            <span>${escapeHtml(destination.country)}</span>
            <span>${escapeHtml(coords)}</span>
          </p>
          <div class="hero__actions destination-hero__actions">
            <button class="btn btn--ghost" type="button" data-share-link>Copiar enlace</button>
            <a class="btn btn--ghost" href="${ROUTES.explorer}">Explorar catálogo</a>
            <a class="btn btn--primary" href="${ROUTES.surprise}">Sorpréndeme</a>
          </div>
          <p class="u-text-muted share-feedback" data-share-feedback hidden></p>
        </div>
      </div>
    </header>

    <section class="section section--tight">
      <div class="u-container u-stack-lg">
        <div class="destination-gallery" data-destination-gallery></div>

        <div class="destination-prose" data-aos="fade-up">
          <article class="prose-block">
            <h2>Cultura</h2>
            <p>${escapeHtml(destination.culture)}</p>
          </article>
          <article class="prose-block">
            <h2>Tradiciones</h2>
            <p>${escapeHtml(destination.traditions)}</p>
          </article>
          <article class="prose-block">
            <h2>Gastronomía</h2>
            <p>${escapeHtml(destination.gastronomy)}</p>
          </article>
        </div>

        <div class="destination-facts" data-aos="fade-up">
          <article class="fact">
            <h2 class="fact__label">Clima</h2>
            <p class="fact__value">${escapeHtml(destination.climate)}</p>
          </article>
          <article class="fact">
            <h2 class="fact__label">Mejor época</h2>
            <p class="fact__value">${escapeHtml(destination.bestSeason)}</p>
          </article>
          <article class="fact">
            <h2 class="fact__label">Idiomas</h2>
            <p class="fact__value">${escapeHtml((destination.languages || []).filter(Boolean).join(", ") || "Sin dato publicado")}</p>
          </article>
          <article class="fact">
            <h2 class="fact__label">Moneda</h2>
            <p class="fact__value">${escapeHtml(formatCurrency(destination.currency))}</p>
          </article>
        </div>

        <section class="curiosities" aria-labelledby="curiosities-title" data-aos="fade-up">
          <h2 id="curiosities-title">Curiosidades</h2>
          <ul>
            ${(destination.curiosities || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
          <p class="destination-tags">
            ${(destination.tags || [])
              .map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`)
              .join("")}
          </p>
        </section>

        <section class="related" aria-labelledby="related-title" data-aos="fade-up">
          <div class="section-heading">
            <h2 id="related-title">Seguí explorando</h2>
            <p class="u-text-muted">Destinos relacionados por región, categoría o etiquetas.</p>
          </div>
          <div class="spot-rail" data-related-list></div>
        </section>
      </div>
    </section>
  `;

  renderGallery(root.querySelector("[data-destination-gallery]"), destination.images || []);
  root.querySelector(".destination-hero__actions")?.append(createFavoriteButton(destination));

  const relatedList = root.querySelector("[data-related-list]");
  if (relatedList) {
    if (!related.length) {
      relatedList.innerHTML = `<p class="u-text-muted">No hay sugerencias relacionadas por ahora.</p>`;
    } else {
      related.forEach((item) => relatedList.appendChild(createDestinationCard(item, { labels })));
    }
  }

  const shareBtn = root.querySelector("[data-share-link]");
  const feedback = root.querySelector("[data-share-feedback]");
  shareBtn?.addEventListener("click", async () => {
    const directory = window.location.pathname.replace(/[^/]*$/, "");
    const url = `${window.location.origin}${directory}${ROUTES.destination}?id=${encodeURIComponent(destination.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      if (feedback) {
        feedback.hidden = false;
        feedback.textContent = "Enlace copiado. Ya podés compartirlo.";
      }
    } catch {
      if (feedback) {
        feedback.hidden = false;
        feedback.textContent = `Copiá este enlace: ${url}`;
      }
    }
  });
}

function updateDocumentMeta(destination) {
  document.title = `${destination.name} · VS Mundévia`;
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute("content", destination.description.slice(0, 160));
  }
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", `${destination.name} · VS Mundévia`);
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) ogDescription.setAttribute("content", destination.description.slice(0, 160));
}

function formatCurrency(currency) {
  if (!currency?.name) return "No disponible";
  if (!currency.code || currency.code === "—") return currency.name;
  return `${currency.name} (${currency.code})`;
}

function emptyState(title, text, href = ROUTES.explorer) {
  return `
    <div class="u-container page-header">
      <p class="page-header__eyebrow">Ficha de destino</p>
      <h1 class="page-header__title">${escapeHtml(title)}</h1>
      <p class="page-header__lead">${escapeHtml(text)}</p>
      <a class="btn btn--primary" href="${href}">Ir al explorador</a>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
