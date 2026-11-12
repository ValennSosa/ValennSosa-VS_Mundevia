import { getDestinations } from "../data/destinations.js";
import { ROUTES } from "../config.js";

/**
 * Búsqueda por país, ciudad, continente, tipo y características.
 * Etapa 0: API lista; se conecta al UI en etapas siguientes.
 */
export async function searchDestinations(query = "") {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const destinations = await getDestinations();

  return destinations
    .filter((d) => {
      const haystack = [
        d.name,
        d.city,
        d.country,
        d.continent,
        d.type,
        ...(d.tags || []),
        ...(d.languages || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, 8)
    .map((d) => ({
      id: d.id,
      label: `${d.name} · ${d.country}`,
      href: `${ROUTES.destination}?id=${encodeURIComponent(d.id)}`,
    }));
}
