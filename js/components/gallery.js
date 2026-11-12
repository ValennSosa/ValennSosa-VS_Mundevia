/**
 * Galería de ficha de destino.
 * Etapa 0: stub estructural.
 */
export function renderGallery(container, images = []) {
  if (!container) return;

  if (!images.length) {
    container.innerHTML = `<div class="placeholder-panel"><p class="u-mb-0">La galería se cargará con el catálogo de destinos.</p></div>`;
    return;
  }

  container.innerHTML = images
    .map(
      (src, index) => `
      <figure>
        <img src="${src}" alt="Imagen ${index + 1} del destino" loading="lazy" width="800" height="500">
      </figure>
    `
    )
    .join("");
}
