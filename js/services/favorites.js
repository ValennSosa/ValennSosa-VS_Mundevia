import { STORAGE_KEYS } from "../config.js";

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.favorites);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(ids) {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(ids));
}

export function getFavoriteIds() {
  return read();
}

export function isFavorite(id) {
  return read().includes(id);
}

export function addFavorite(id) {
  const ids = read();
  if (!ids.includes(id)) {
    ids.push(id);
    write(ids);
  }
  return ids;
}

export function removeFavorite(id) {
  const ids = read().filter((item) => item !== id);
  write(ids);
  return ids;
}

export function toggleFavorite(id) {
  return isFavorite(id) ? removeFavorite(id) : addFavorite(id);
}
