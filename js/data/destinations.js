import { DATA_PATHS } from "../config.js";

let cache = null;

/**
 * Carga y cachea el catálogo local JSON.
 * Etapa 0: estructura lista; el dataset completo llega en la Etapa 1.
 */
export async function getDestinations() {
  if (cache) return cache;

  const response = await fetch(DATA_PATHS.destinations);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el catálogo (${response.status})`);
  }

  const payload = await response.json();
  cache = Array.isArray(payload.destinations) ? payload.destinations : [];
  return cache;
}

export async function getDestinationById(id) {
  const list = await getDestinations();
  return list.find((item) => item.id === id) || null;
}

export function clearDestinationsCache() {
  cache = null;
}
