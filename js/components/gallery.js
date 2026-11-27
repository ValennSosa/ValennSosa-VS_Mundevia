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
  const parts = [];
  if (image.credit) {
    parts.push(image.authorUrl ? externalLink(image.authorUrl, image.credit) : escapeHtml(image.credit));
  }
  const fileUrl = commonsFileUrl(image.file);
  if (image.source) {
    parts.push(fileUrl && /wikimedia commons/i.test(image.source) ? externalLink(fileUrl, image.source) : escapeHtml(image.source));
  }
  if (image.license) {
    const licenseUrl = licensePageUrl(image.licenseUrl);
    parts.push(licenseUrl ? externalLink(licenseUrl, image.license) : escapeHtml(image.license));
  }
  return `<figcaption class="destination-gallery__credit">Foto: ${parts.join(" · ")}</figcaption>`;
}

function externalLink(href, label) {
  return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
}

function commonsFileUrl(file) {
  if (!file || !file.startsWith("File:")) return "";
  return `https://commons.wikimedia.org/wiki/${encodeURI(file.replaceAll(" ", "_"))}`;
}

function licensePageUrl(url) {
  if (!url) return "";
  const absolute = url.startsWith("http://") ? `https://${url.slice("http://".length)}` : url;
  if (/commons\.wikimedia\.org\/wiki\/Commons:Licensing/i.test(absolute)) return "";
  return absolute;
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
