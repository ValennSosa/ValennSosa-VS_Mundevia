import { initSearchBox } from "../components/searchBox.js";
import { searchDestinations } from "../services/search.js";

export function initComparePage() {
  const status = document.querySelector("[data-compare-status]");
  if (status) {
    status.textContent =
      "El comparador usará el buscador con sugerencias para elegir dos destinos.";
  }

  document.querySelectorAll("[data-search-root]").forEach((root) => {
    initSearchBox(root, { onQuery: (query) => searchDestinations(query) });
  });
}
