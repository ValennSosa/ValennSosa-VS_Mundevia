/**
 * Galería de ficha de destino con créditos.
 */
export function renderGallery(container, images = []) {
  if (!container) return;

  const normalized = (images || []).map((entry) =>
    typeof entry === "string" ? { url: entry, alt: "Imagen del destino", credit: "" } : entry
  );

  if (!normalized.length) {
    container.innerHTML = `<div class="placeholder-panel"><p class="u-mb-0">Sin imágenes disponibles para este destino.</p></div>`;
    return;
  }

  const [hero, ...rest] = normalized;

  container.innerHTML = `
    <figure class="destination-gallery__hero">
      <img src="${hero.url}" alt="${escapeAttr(hero.alt || "Imagen principal")}" width="1200" height="750" fetchpriority="high">
      ${creditHtml(hero)}
    </figure>
    ${
      rest.length
        ? `<div class="destination-gallery__thumbs">
            ${rest
              .map(
                (img) => `
              <figure>
                <img src="${img.url}" alt="${escapeAttr(img.alt || "Imagen del destino")}" loading="lazy" width="640" height="400">
                ${creditHtml(img)}
              </figure>`
              )
              .join("")}
          </div>`
        : ""
    }
  `;
}

function creditHtml(image) {
  if (!image.credit && !image.source && !image.license) return "";
  const label = [image.credit, image.source, image.license].filter(Boolean).join(" · ");
  const inner = image.licenseUrl
    ? `<a href="${escapeAttr(image.licenseUrl)}" rel="noopener noreferrer">${escapeHtml(label)}</a>`
    : escapeHtml(label);
  return `<figcaption class="destination-gallery__credit">Foto: ${inner}</figcaption>`;
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
