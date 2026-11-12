import { STORAGE_KEYS } from "../config.js";

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.compare);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 2) : [];
  } catch {
    return [];
  }
}

function write(ids) {
  localStorage.setItem(STORAGE_KEYS.compare, JSON.stringify(ids.slice(0, 2)));
}

export function getCompareIds() {
  return read();
}

export function setCompareSlot(index, id) {
  const ids = read();
  ids[index] = id;
  write(ids.filter(Boolean));
  return getCompareIds();
}

export function clearCompare() {
  write([]);
}
