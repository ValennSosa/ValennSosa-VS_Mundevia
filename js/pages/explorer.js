import { initMap } from "../viz/map.js";

export async function initExplorerPage() {
  const mapSlot = document.querySelector("[data-map]");
  // Leaflet se importará aquí de forma dinámica en la Etapa 3.
  await initMap(mapSlot, { destinations: [] });
}
