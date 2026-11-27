import { DATA_PATHS } from "../config.js";

let cache = null;
let metaCache = null;

export async function loadCatalog() {
  if (cache && metaCache) {
    return { meta: metaCache, destinations: cache };
  }

  const response = await fetch(DATA_PATHS.destinations);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el catálogo (${response.status})`);
  }

  const payload = await response.json();
  cache = Array.isArray(payload.destinations) ? payload.destinations : [];
  metaCache = payload.meta || {};
  return { meta: metaCache, destinations: cache };
}

export async function getDestinations() {
  const { destinations } = await loadCatalog();
  return destinations;
}

export async function getCatalogMeta() {
  const { meta } = await loadCatalog();
  return meta;
}

export async function getDestinationById(id) {
  const list = await getDestinations();
  return list.find((item) => item.id === id) || null;
}

export async function getFeaturedDestinations(limit = 4) {
  const list = await getDestinations();
  return [...list]
    .filter((d) => d.featured)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, limit);
}

export async function getPopularDestinations(limit = 6) {
  const list = await getDestinations();
  return [...list].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, limit);
}

const GENERIC_TAGS = new Set(["unesco", "patrimonio"]);

export async function getRelatedDestinations(destination, limit = 3) {
  if (!destination) return [];
  const list = await getDestinations();
  const tags = new Set(destination.tags || []);

  return list
    .filter((d) => d.id !== destination.id)
    .map((d) => {
      const sameRegion =
        d.continent === destination.continent || d.country === destination.country;
      if (!sameRegion) return { d, score: 0 };

      let score = 1;
      if (d.continent === destination.continent) score += 3;
      if (d.country === destination.country) score += 3;
      if (d.type === destination.type) score += 2;
      (d.tags || []).forEach((tag) => {
        if (tags.has(tag) && !GENERIC_TAGS.has(tag)) score += 2;
      });
      return { d, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (b.d.popularity || 0) - (a.d.popularity || 0))
    .slice(0, limit)
    .map((item) => item.d);
}

export function getImage(destination, index = 0) {
  const entry = destination?.images?.[index];
  if (!entry) return null;
  if (typeof entry === "string") {
    return { url: entry, alt: destination.name, credit: "", source: "", license: "" };
  }
  return entry;
}

export function clearDestinationsCache() {
  cache = null;
  metaCache = null;
}
