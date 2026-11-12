/**
 * Mapa Leaflet — carga diferida.
 * Etapa 0: stub. Se implementa en la Etapa 3 solo en explorador.html.
 */
export async function initMap(container, { destinations = [] } = {}) {
  if (!container) return null;

  container.innerHTML = `
    <div class="map__fallback" role="region" aria-label="Mapa interactivo (próximamente)">
      <p>
        El mapa Leaflet se cargará aquí de forma diferida.<br>
        También podrás filtrar por continente, país y categoría, y usar la lista accesible.
      </p>
    </div>
  `;

  return { markerCount: destinations.length, destroy() {} };
}
