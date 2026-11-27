import { STORAGE_KEYS } from "../config.js";

export const FAVORITES_EVENT = "vs-mundevia:favorites-change";

let storageBound = false;

function sanitize(value) {
  if (!Array.isArray(value)) return [];
  const ids = [];
  const seen = new Set();
  value.forEach((item) => {
    if (typeof item !== "string") return;
    const id = item.trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  });
  return ids;
}

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.favorites);
    if (!raw) return [];
    return sanitize(JSON.parse(raw));
  } catch {
    return [];
  }
}

function write(ids) {
  const clean = sanitize(ids);
  try {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(clean));
    return { ok: true, ids: clean };
  } catch {
    return { ok: false, ids: read() };
  }
}

function notify(ids) {
  window.dispatchEvent(
    new CustomEvent(FAVORITES_EVENT, {
      detail: { ids: [...ids] },
    })
  );
}

function bindStorage() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEYS.favorites) return;
    notify(read());
  });
}

bindStorage();

export function getFavoriteIds() {
  return read();
}

export function isFavorite(id) {
  if (typeof id !== "string" || !id.trim()) return false;
  return read().includes(id.trim());
}

export function toggleFavorite(id) {
  const cleanId = typeof id === "string" ? id.trim() : "";
  const current = read();
  if (!cleanId) return { ok: false, active: false, ids: current };

  const active = current.includes(cleanId);
  const next = active ? current.filter((item) => item !== cleanId) : [...current, cleanId];
  const saved = write(next);
  if (!saved.ok) return { ok: false, active, ids: current };

  notify(saved.ids);
  return { ok: true, active: !active, ids: saved.ids };
}

/**
 * Quita ids que ya no existen en el catálogo.
 * Si la escritura falla, la clave queda como estaba y la página igual puede ocultarlos.
 */
export function retainKnownFavorites(validIds) {
  const valid = new Set(Array.isArray(validIds) ? validIds : []);
  const current = read();
  const next = current.filter((id) => valid.has(id));
  if (next.length === current.length) return { ok: true, ids: current, changed: false };

  const saved = write(next);
  if (saved.ok) notify(saved.ids);
  return { ok: saved.ok, ids: saved.ok ? saved.ids : current, changed: saved.ok };
}
