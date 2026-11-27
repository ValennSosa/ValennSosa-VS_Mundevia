/**
 * Buscador con sugerencias dinámicas.
 * Etapa 0: estructura y API pública. La lógica completa llega en etapas posteriores.
 */
export function initSearchBox(root, options = {}) {
  if (!root) return null;

  const input = root.querySelector("[data-search-input]");
  const list = root.querySelector("[data-search-suggestions]");

  if (!input || !list) return null;

  const onQuery = typeof options.onQuery === "function" ? options.onQuery : async () => [];

  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", list.id || "search-suggestions");
  list.hidden = true;

  input.addEventListener("input", async () => {
    const query = input.value.trim();
    if (query.length < 2) {
      list.innerHTML = "";
      list.hidden = true;
      return;
    }

    const results = await onQuery(query);
    // Placeholder visual hasta conectar datos reales
    list.innerHTML =
      results.length > 0
        ? results
            .map(
              (item) =>
                `<li role="option"><a href="${item.href}">${item.label}</a></li>`
            )
            .join("")
        : `<li class="u-text-muted">Escribí para buscar destinos…</li>`;
    list.hidden = false;
  });

  return { input, list };
}
