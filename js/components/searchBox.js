/**
 * Buscador con sugerencias dinámicas, teclado y limpieza.
 */
export function initSearchBox(root, options = {}) {
  if (!root) return null;

  const input = root.querySelector("[data-search-input]");
  const list = root.querySelector("[data-search-suggestions]");
  const clearBtn = root.querySelector("[data-search-clear]");

  if (!input || !list) return null;

  const onQuery = typeof options.onQuery === "function" ? options.onQuery : async () => [];
  const onSelect = typeof options.onSelect === "function" ? options.onSelect : null;
  const minChars = options.minChars ?? 2;

  let activeIndex = -1;
  let currentItems = [];

  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", list.id || "search-suggestions");
  input.setAttribute("aria-expanded", "false");
  list.hidden = true;

  const syncClear = () => {
    if (!clearBtn) return;
    clearBtn.hidden = input.value.trim().length === 0;
  };

  const closeList = () => {
    list.hidden = true;
    list.innerHTML = "";
    input.setAttribute("aria-expanded", "false");
    activeIndex = -1;
    currentItems = [];
  };

  const render = (results, query) => {
    currentItems = results;
    activeIndex = -1;

    if (!results.length) {
      list.innerHTML = `<li class="search-suggest__empty" role="presentation">Sin resultados para “${escapeHtml(
        query
      )}”.</li>`;
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      return;
    }

    list.innerHTML = results
      .map(
        (item, index) => `
        <li role="option" id="${list.id || "search-suggestions"}-opt-${index}" data-index="${index}">
          <a class="search-suggest__link" href="${item.href}" data-id="${item.id}">
            <span class="search-suggest__label">${escapeHtml(item.label)}</span>
            <span class="search-suggest__meta">${escapeHtml(item.meta || "")}</span>
          </a>
        </li>`
      )
      .join("");

    list.hidden = false;
    input.setAttribute("aria-expanded", "true");

    list.querySelectorAll("a").forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        if (!onSelect) return;
        event.preventDefault();
        const id = anchor.getAttribute("data-id");
        const item = currentItems.find((entry) => entry.id === id);
        if (item) onSelect(item);
      });
    });
  };

  const runQuery = async () => {
    const query = input.value.trim();
    syncClear();

    if (query.length < minChars) {
      closeList();
      return;
    }

    const results = await onQuery(query);
    render(results, query);
  };

  const moveActive = (delta) => {
    if (!currentItems.length) return;
    const optionsEls = [...list.querySelectorAll('[role="option"]')];
    activeIndex = (activeIndex + delta + optionsEls.length) % optionsEls.length;
    optionsEls.forEach((el, i) => el.classList.toggle("is-active", i === activeIndex));
    input.setAttribute("aria-activedescendant", optionsEls[activeIndex]?.id || "");
  };

  input.addEventListener("input", () => {
    window.clearTimeout(input._searchTimer);
    input._searchTimer = window.setTimeout(runQuery, 160);
  });

  input.addEventListener("keydown", (event) => {
    if (list.hidden) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const link = list.querySelectorAll("a")[activeIndex];
      link?.click();
    } else if (event.key === "Escape") {
      closeList();
    }
  });

  clearBtn?.addEventListener("click", () => {
    input.value = "";
    syncClear();
    closeList();
    input.focus();
    options.onClear?.();
  });

  document.addEventListener("click", (event) => {
    if (!root.contains(event.target)) closeList();
  });

  syncClear();

  return {
    input,
    list,
    clear: () => {
      input.value = "";
      syncClear();
      closeList();
    },
    setQuery: (value) => {
      input.value = value;
      syncClear();
      runQuery();
    },
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
