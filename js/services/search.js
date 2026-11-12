import { getDestinations } from "../data/destinations.js";
import { destinationHref } from "../config.js";

function matchesQuery(destination, q) {
  const fields = [
    destination.name,
    destination.city,
    destination.country,
    destination.continent,
    destination.type,
    ...(destination.tags || []),
    ...(destination.languages || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return fields.includes(q);
}

/**
 * Búsqueda por nombre, ciudad, país, continente, categorías y etiquetas.
 */
export async function searchDestinations(query = "", { limit = 8 } = {}) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const destinations = await getDestinations();

  return destinations
    .filter((d) => matchesQuery(d, q))
    .sort((a, b) => {
      const aName = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bName = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      return aName - bName || (b.popularity || 0) - (a.popularity || 0);
    })
    .slice(0, limit)
    .map((d) => ({
      id: d.id,
      label: `${d.name} · ${d.city}`,
      meta: `${d.country} · ${d.continent}`,
      type: d.type,
      href: destinationHref(d.id),
    }));
}
