import { initSearchBox } from "../components/searchBox.js";
import { searchDestinations } from "../services/search.js";
import { initGlobe } from "../viz/globe.js";

export async function initHomePage() {
  const searchRoot = document.querySelector("[data-search-root]");
  initSearchBox(searchRoot, {
    onQuery: (query) => searchDestinations(query),
  });

  const globeSlot = document.querySelector("[data-globe]");
  // Three.js se importará aquí de forma dinámica en la Etapa 2.
  await initGlobe(globeSlot, { destinations: [] });
}
