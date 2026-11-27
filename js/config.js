/**
 * Configuración global de VS Mundévia (id técnico: vs-mundevia).
 * Las URLs de imágenes viven en data/*.json — no dispersarlas en componentes.
 */
export const APP_NAME = "VS Mundévia";
export const APP_ID = "vs-mundevia";

export const ROUTES = {
  home: "index.html",
  explorer: "explorador.html",
  destination: "destino.html",
  surprise: "sorprendeme.html",
  compare: "comparar.html",
  favorites: "favoritos.html",
};

/** Formato compartible de una ficha: destino.html?id=<slug>. */
export function destinationHref(id) {
  return `${ROUTES.destination}?id=${encodeURIComponent(id || "")}`;
}

export const DATA_PATHS = {
  destinations: "./data/destinations.json",
};

export const STORAGE_KEYS = {
  favorites: "vs-mundevia:favorites",
  compare: "vs-mundevia:compare",
};

/** Carga diferida: Three.js y Leaflet solo en páginas que lo declaren. */
export const LAZY_LIBS = {
  three: false,
  leaflet: false,
};
