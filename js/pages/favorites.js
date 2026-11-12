import { getFavoriteIds } from "../services/favorites.js";

export function initFavoritesPage() {
  const status = document.querySelector("[data-favorites-status]");
  const ids = getFavoriteIds();

  if (status) {
    status.textContent = ids.length
      ? `Tenés ${ids.length} favorito(s) guardado(s) en localStorage.`
      : "Todavía no hay favoritos. Se podrán guardar desde cada ficha.";
  }
}
