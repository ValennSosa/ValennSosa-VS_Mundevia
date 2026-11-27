import { FAVORITES_EVENT, isFavorite, toggleFavorite } from "../services/favorites.js";
import { showToast } from "./toast.js";

let listening = false;

function paint(button) {
  const id = button.dataset.favoriteId || "";
  const name = button.dataset.favoriteName || "este destino";
  const active = isFavorite(id);
  button.setAttribute("aria-pressed", active ? "true" : "false");
  button.classList.toggle("is-active", active);
  button.textContent = active ? "Guardado" : "Guardar";
  button.setAttribute(
    "aria-label",
    active ? `Quitar ${name} de favoritos` : `Guardar ${name} en favoritos`
  );
}

function ensureListener() {
  if (listening) return;
  listening = true;
  window.addEventListener(FAVORITES_EVENT, () => {
    document.querySelectorAll("[data-favorite-id]").forEach((button) => paint(button));
  });
}

export function createFavoriteButton(destination, { overlay = false } = {}) {
  ensureListener();

  const button = document.createElement("button");
  button.type = "button";
  button.className = overlay ? "fav-toggle fav-toggle--overlay" : "fav-toggle";
  button.dataset.favoriteId = destination?.id || "";
  button.dataset.favoriteName = destination?.name || "este destino";
  paint(button);

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = toggleFavorite(destination?.id);
    if (!result.ok) {
      showToast("No se pudo guardar el favorito en este navegador.");
    }
    paint(button);
  });

  return button;
}
