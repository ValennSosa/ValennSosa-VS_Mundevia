import { STORAGE_KEYS } from "../config.js";

export const COMPARE_EVENT = "vs-mundevia:compare-change";
export const COMPARE_MAX = 3;

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
  return ids.slice(0, COMPARE_MAX);
}

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.compare);
    if (!raw) return [];
    return sanitize(JSON.parse(raw));
  } catch {
    return [];
  }
}

function write(ids) {
  const clean = sanitize(ids);
  try {
    localStorage.setItem(STORAGE_KEYS.compare, JSON.stringify(clean));
    return { ok: true, ids: clean };
  } catch {
    return { ok: false, ids: read() };
  }
}

function notify(ids) {
  window.dispatchEvent(
    new CustomEvent(COMPARE_EVENT, {
      detail: { ids: [...ids] },
    })
  );
}

function bindStorage() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEYS.compare) return;
    notify(read());
  });
}

bindStorage();

export function getCompareIds() {
  return read();
}

export function addCompareId(id) {
  const cleanId = typeof id === "string" ? id.trim() : "";
  const current = read();
  if (!cleanId) return { ok: false, reason: "invalid", ids: current };
  if (current.includes(cleanId)) return { ok: false, reason: "duplicate", ids: current };
  if (current.length >= COMPARE_MAX) return { ok: false, reason: "full", ids: current };

  const saved = write([...current, cleanId]);
  if (!saved.ok) return { ok: false, reason: "storage", ids: current };
  notify(saved.ids);
  return { ok: true, reason: "added", ids: saved.ids };
}

export function removeCompareId(id) {
  const cleanId = typeof id === "string" ? id.trim() : "";
  const current = read();
  if (!cleanId || !current.includes(cleanId)) return { ok: false, reason: "missing", ids: current };

  const saved = write(current.filter((item) => item !== cleanId));
  if (!saved.ok) return { ok: false, reason: "storage", ids: current };
  notify(saved.ids);
  return { ok: true, reason: "removed", ids: saved.ids };
}

/**
 * Sustituye un id por otro en el mismo índice.
 * El resto de la lista no se mueve.
 */
export function replaceCompareId(currentId, nextId) {
  const from = typeof currentId === "string" ? currentId.trim() : "";
  const to = typeof nextId === "string" ? nextId.trim() : "";
  const current = read();
  const index = current.indexOf(from);
  if (!from || !to || index < 0) return { ok: false, reason: "invalid", ids: current };
  if (from === to) return { ok: true, reason: "same", ids: current };
  if (current.includes(to)) return { ok: false, reason: "duplicate", ids: current };

  const next = current.slice();
  next[index] = to;
  const saved = write(next);
  if (!saved.ok) return { ok: false, reason: "storage", ids: current };
  notify(saved.ids);
  return { ok: true, reason: "replaced", ids: saved.ids };
}

export function clearCompare() {
  const current = read();
  const saved = write([]);
  if (!saved.ok) return { ok: false, reason: "storage", ids: current };
  notify(saved.ids);
  return { ok: true, reason: "cleared", ids: saved.ids };
}

/**
 * Quita ids que ya no existen en el catálogo, conservando el orden.
 * Si la escritura falla, la clave queda como estaba y la página puede ocultarlos.
 */
export function retainKnownCompare(validIds) {
  const valid = new Set(Array.isArray(validIds) ? validIds : []);
  const current = read();
  const next = current.filter((id) => valid.has(id));
  if (next.length === current.length) return { ok: true, ids: current, changed: false };

  const saved = write(next);
  if (saved.ok) notify(saved.ids);
  return { ok: saved.ok, ids: saved.ok ? saved.ids : current, changed: saved.ok };
}
