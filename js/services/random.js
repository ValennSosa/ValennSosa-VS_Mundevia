import { getDestinations } from "../data/destinations.js";

/**
 * Selección aleatoria de destino ("Sorpréndeme").
 */
export async function pickRandomDestination(excludeId = null) {
  const list = await getDestinations();
  if (!list.length) return null;

  const pool = excludeId ? list.filter((d) => d.id !== excludeId) : list;
  const source = pool.length ? pool : list;
  const index = Math.floor(Math.random() * source.length);
  return source[index];
}
