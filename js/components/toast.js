let toastRoot;

function ensureRoot() {
  if (toastRoot) return toastRoot;
  toastRoot = document.createElement("div");
  toastRoot.className = "toast-root";
  toastRoot.setAttribute("aria-live", "polite");
  toastRoot.setAttribute("aria-atomic", "true");
  Object.assign(toastRoot.style, {
    position: "fixed",
    right: "1rem",
    bottom: "1rem",
    zIndex: "1200",
    display: "grid",
    gap: "0.5rem",
  });
  document.body.appendChild(toastRoot);
  return toastRoot;
}

export function showToast(message, { timeout = 3200 } = {}) {
  const root = ensureRoot();
  const el = document.createElement("div");
  el.textContent = message;
  Object.assign(el.style, {
    padding: "0.75rem 1rem",
    borderRadius: "0.35rem",
    background: "rgba(12, 21, 38, 0.95)",
    border: "1px solid rgba(126, 184, 212, 0.25)",
    color: "#e8eef6",
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
  });
  root.appendChild(el);
  window.setTimeout(() => el.remove(), timeout);
}
