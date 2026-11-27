/**
 * Globo 3D (Three.js) — carga diferida.
 * Etapa 0: stub. Se implementa en la Etapa 2 solo en index.html.
 */
export async function initGlobe(container, { destinations = [] } = {}) {
  if (!container) return null;

  container.innerHTML = `
    <div class="globe__fallback" role="region" aria-label="Globo interactivo (próximamente)">
      <p>
        El globo 3D se cargará aquí de forma diferida.<br>
        Mientras tanto, explorá destinos desde el menú o el mapa.
      </p>
    </div>
  `;

  // Hotspots solo para featured — se cableará con Three.js más adelante.
  const featured = destinations.filter((d) => d.featured);
  return { featuredCount: featured.length, destroy() {} };
}
