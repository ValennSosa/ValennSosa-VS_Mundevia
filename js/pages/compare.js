import { loadCatalog, getImage } from "../data/destinations.js";
import { destinationHref, ROUTES } from "../config.js";
import { typeLabel } from "../services/filters.js";
import { searchDestinations } from "../services/search.js";
import { initSearchBox } from "../components/searchBox.js";
import { showToast } from "../components/toast.js";
import {
  COMPARE_EVENT,
  addCompareId,
  clearCompare,
  getCompareIds,
  removeCompareId,
  replaceCompareId,
  retainKnownCompare,
} from "../services/compare.js";

const STORAGE_TOAST = "No se pudo guardar la comparación en este navegador.";

export async function initComparePage() {
  const status = document.querySelector("[data-compare-status]");
  const selectionRoot = document.querySelector("[data-compare-selection]");
  const boardRoot = document.querySelector("[data-compare-board]");
  const confirmButton = document.querySelector("[data-compare-confirm]");
  const clearButton = document.querySelector("[data-compare-clear]");
  const searchRoot = document.querySelector("[data-search-root]");
  if (!selectionRoot || !boardRoot || !searchRoot) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let catalog = [];
  let labels = {};
  let catalogReady = false;
  let loadError = false;
  let confirmed = false;
  let replaceId = null;
  let applying = false;

  const knownIds = () => new Set(catalog.map((item) => item.id));

  const visibleIds = () => {
    if (!catalogReady) return [];
    const known = knownIds();
    return getCompareIds().filter((id) => known.has(id));
  };

  const destinationsFor = (ids) =>
    ids.map((id) => catalog.find((item) => item.id === id)).filter(Boolean);

  const handleResult = (result) => {
    if (!result.ok && result.reason === "storage") showToast(STORAGE_TOAST);
    else if (!result.ok && result.reason === "duplicate") {
      showToast("Ese destino ya está en la comparación.");
    } else if (!result.ok && result.reason === "full") {
      showToast("Podés comparar hasta tres destinos. Quitá uno o usá Cambiar.");
    } else if (!result.ok && result.reason === "invalid") {
      showToast("No se pudo actualizar la comparación.");
    }

    if (result.ok && (result.reason === "replaced" || result.reason === "same")) replaceId = null;
    if (visibleIds().length < 2) confirmed = false;
    render();
  };

  const mutate = (action) => {
    applying = true;
    let result;
    try {
      result = action();
    } finally {
      applying = false;
    }
    handleResult(result);
  };

  const render = () => {
    const ids = visibleIds();
    const selected = destinationsFor(ids);
    renderStatus(selected);
    renderSelection(selected);
    renderBoard(selected);
    if (confirmButton) confirmButton.disabled = ids.length < 2;
    if (clearButton) clearButton.disabled = ids.length === 0;
  };

  const renderStatus = (selected) => {
    if (!status) return;
    if (loadError) {
      status.textContent = "No se pudo leer el catálogo.";
      return;
    }
    if (replaceId) {
      const current = selected.find((item) => item.id === replaceId);
      status.textContent = current
        ? `Reemplazando a ${current.name}. La próxima elección ocupa su lugar.`
        : "Elegí el destino que ocupa el lugar marcado.";
      return;
    }
    if (!selected.length) {
      status.textContent = "Buscá por nombre o país y elegí de dos a tres destinos.";
      return;
    }
    if (selected.length === 1) {
      status.textContent = "Falta al menos un destino más para comparar.";
      return;
    }
    if (!confirmed) {
      status.textContent =
        selected.length === 2
          ? "Ya podés comparar estos destinos. Si querés, sumá un tercero."
          : "Ya podés comparar estos tres destinos.";
      return;
    }
    status.textContent = `Comparando ${listNames(selected)}.`;
  };

  const renderSelection = (selected) => {
    selectionRoot.replaceChildren();
    if (loadError) {
      const panel = document.createElement("div");
      panel.className = "compare-empty";
      const text = document.createElement("p");
      text.textContent = "No llegamos a leer los destinos. Podés seguir desde el explorador.";
      const link = document.createElement("a");
      link.className = "btn btn--ghost";
      link.href = ROUTES.explorer;
      link.textContent = "Ir al explorador";
      panel.append(text, link);
      selectionRoot.append(panel);
      return;
    }
    if (!selected.length) {
      const empty = document.createElement("p");
      empty.className = "compare-empty";
      empty.textContent = "Todavía no elegiste destinos.";
      selectionRoot.append(empty);
      return;
    }

    const list = document.createElement("ul");
    list.className = "compare-picks";
    selected.forEach((destination) => list.append(createPick(destination)));
    selectionRoot.append(list);
  };

  const createPick = (destination) => {
    const item = document.createElement("li");
    item.className = "compare-pick";
    item.dataset.compareId = destination.id;
    if (destination.id === replaceId) item.classList.add("is-replacing");

    const image = getImage(destination, 0);
    if (image?.url) {
      const photo = document.createElement("img");
      photo.className = "compare-pick__photo";
      photo.src = image.url;
      photo.alt = "";
      photo.width = 640;
      photo.height = 426;
      photo.loading = "lazy";
      item.append(photo);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "compare-pick__photo compare-pick__photo--empty";
      fallback.setAttribute("aria-hidden", "true");
      item.append(fallback);
    }

    const name = document.createElement("p");
    name.className = "compare-pick__name";
    name.textContent = destination.name;

    const meta = document.createElement("p");
    meta.className = "compare-pick__meta";
    meta.textContent = [destination.country, destination.continent].filter(Boolean).join(" · ");

    const actions = document.createElement("div");
    actions.className = "compare-pick__actions";

    const change = document.createElement("button");
    change.type = "button";
    change.className = "btn btn--ghost compare-pick__button";
    change.textContent = "Cambiar";
    change.setAttribute("aria-pressed", destination.id === replaceId ? "true" : "false");
    change.setAttribute("aria-label", `Cambiar ${destination.name}`);
    change.addEventListener("click", () => {
      replaceId = replaceId === destination.id ? null : destination.id;
      render();
      if (replaceId) document.querySelector("#compare-query")?.focus();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn--ghost compare-pick__button";
    remove.textContent = "Quitar";
    remove.setAttribute("aria-label", `Quitar ${destination.name} de la comparación`);
    remove.addEventListener("click", () => {
      if (replaceId === destination.id) replaceId = null;
      mutate(() => removeCompareId(destination.id));
    });

    actions.append(change, remove);
    item.append(name, meta, actions);
    return item;
  };

  const renderBoard = (selected) => {
    boardRoot.replaceChildren();
    if (!confirmed || selected.length < 2) {
      boardRoot.hidden = true;
      return;
    }
    boardRoot.hidden = false;
    boardRoot.append(createBoard(selected));
  };

  const createBoard = (selected) => {
    const wrap = document.createElement("div");
    wrap.className = "compare-board";

    const bar = document.createElement("div");
    bar.className = "compare-board__bar";
    const heading = document.createElement("h2");
    heading.className = "compare-board__title";
    heading.textContent = "Comparación";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "btn btn--ghost compare-pick__button";
    edit.textContent = "Modificar selección";
    edit.addEventListener("click", () => {
      const picker = document.querySelector(".compare-picker");
      picker?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
      document.querySelector("#compare-query")?.focus();
    });
    bar.append(heading, edit);

    const hint = document.createElement("p");
    hint.className = "compare-scroll-hint";
    hint.textContent = "Deslizá en horizontal. Los atributos quedan fijos a la izquierda.";

    const scroller = document.createElement("div");
    scroller.className = "compare-scroll";
    scroller.tabIndex = 0;
    scroller.setAttribute("role", "region");
    scroller.setAttribute("aria-label", "Tabla comparativa");

    const table = document.createElement("table");
    table.className = "compare-table";
    table.dataset.compareIds = selected.map((item) => item.id).join(",");

    const caption = document.createElement("caption");
    caption.className = "u-sr-only";
    caption.textContent = `Comparación de ${listNames(selected)}`;
    table.append(caption);

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const corner = document.createElement("th");
    corner.scope = "col";
    corner.textContent = "Atributo";
    headRow.append(corner);
    selected.forEach((destination) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = destination.name;
      headRow.append(th);
    });
    thead.append(headRow);

    const tbody = document.createElement("tbody");
    appendNodeRow(
      tbody,
      "Fotografía",
      selected.map((destination) => createPhoto(destination))
    );
    appendValueRow(tbody, "País", selected.map((destination) => destination.country || "Sin dato"), true);
    appendValueRow(
      tbody,
      "Continente",
      selected.map((destination) => destination.continent || "Sin dato"),
      true
    );
    appendValueRow(
      tbody,
      "Categoría",
      selected.map((destination) => typeLabel(destination.type, labels) || "Sin dato"),
      true
    );
    appendValueRow(
      tbody,
      "Descripción",
      selected.map((destination) => destination.description || "Sin descripción"),
      false
    );
    appendValueRow(tbody, "Coordenadas", selected.map((destination) => formatCoords(destination)), false);
    appendNodeRow(
      tbody,
      "Ficha",
      selected.map((destination) => {
        const link = document.createElement("a");
        link.className = "btn btn--ghost compare-pick__button";
        link.href = destinationHref(destination.id);
        link.textContent = "Ver destino";
        link.setAttribute("aria-label", `Ver la ficha de ${destination.name}`);
        return link;
      })
    );

    table.append(thead, tbody);
    scroller.append(table);
    wrap.append(bar, hint, scroller);
    return wrap;
  };

  const searchApi = initSearchBox(searchRoot, {
    onQuery: async (query) => {
      try {
        const results = await searchDestinations(query);
        const selected = new Set(visibleIds());
        return results.filter((item) => !selected.has(item.id));
      } catch {
        return [];
      }
    },
    onSelect: (item) => {
      if (!item?.id) return;
      if (replaceId) mutate(() => replaceCompareId(replaceId, item.id));
      else mutate(() => addCompareId(item.id));
      searchApi?.clear();
    },
  });

  confirmButton?.addEventListener("click", () => {
    if (visibleIds().length < 2) return;
    confirmed = true;
    render();
    boardRoot.querySelector(".compare-scroll")?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "nearest",
    });
  });

  clearButton?.addEventListener("click", () => {
    replaceId = null;
    mutate(() => clearCompare());
  });

  window.addEventListener(COMPARE_EVENT, () => {
    if (applying) return;
    const ids = visibleIds();
    confirmed = ids.length >= 2;
    if (replaceId && !ids.includes(replaceId)) replaceId = null;
    render();
  });

  try {
    const { destinations, meta } = await loadCatalog();
    catalog = destinations;
    labels = meta.typeLabels || {};
    catalogReady = true;
    applying = true;
    try {
      retainKnownCompare(destinations.map((item) => item.id));
    } finally {
      applying = false;
    }
    confirmed = visibleIds().length >= 2;
  } catch (error) {
    console.error(error);
    loadError = true;
    const input = searchRoot.querySelector("[data-search-input]");
    if (input) input.disabled = true;
  }

  render();
}

function appendValueRow(tbody, label, values, highlight) {
  const mask = highlight ? differenceMask(values) : values.map(() => false);
  const tr = document.createElement("tr");
  const th = document.createElement("th");
  th.scope = "row";
  th.textContent = label;
  tr.append(th);
  values.forEach((value, index) => {
    const cell = document.createElement("td");
    if (mask[index]) cell.classList.add("is-different");
    cell.dataset.field = fieldKey(label);
    cell.textContent = value;
    tr.append(cell);
  });
  tbody.append(tr);
}

function appendNodeRow(tbody, label, nodes) {
  const tr = document.createElement("tr");
  const th = document.createElement("th");
  th.scope = "row";
  th.textContent = label;
  tr.append(th);
  nodes.forEach((node) => {
    const cell = document.createElement("td");
    cell.dataset.field = fieldKey(label);
    cell.append(node);
    tr.append(cell);
  });
  tbody.append(tr);
}

function createPhoto(destination) {
  const figure = document.createElement("figure");
  figure.className = "compare-photo";
  const image = getImage(destination, 0);
  if (image?.url) {
    const photo = document.createElement("img");
    photo.className = "compare-photo__img";
    photo.src = image.url;
    photo.alt = image.alt || destination.name;
    photo.width = 960;
    photo.height = 640;
    photo.loading = "lazy";
    figure.append(photo);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "compare-photo__img compare-photo__img--empty";
    fallback.setAttribute("aria-hidden", "true");
    figure.append(fallback);
  }
  figure.append(createCredit(image));
  return figure;
}

function createCredit(image) {
  const credit = document.createElement("figcaption");
  credit.className = "compare-photo__credit";
  if (!image?.credit && !image?.license) {
    credit.textContent = "Sin crédito de imagen";
    return credit;
  }
  credit.append("Foto: ");
  if (image.credit) credit.append(document.createTextNode(image.credit));
  if (image.credit && (image.license || image.licenseUrl)) credit.append(" · ");
  if (image.licenseUrl) {
    const link = document.createElement("a");
    link.href = image.licenseUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = image.license || "Licencia";
    credit.append(link);
  } else if (image.license) {
    credit.append(document.createTextNode(image.license));
  }
  return credit;
}

function differenceMask(values) {
  if (values.length < 2) return values.map(() => false);
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  if (counts.size <= 1) return values.map(() => false);
  const max = Math.max(...counts.values());
  if (max === 1) return values.map(() => true);
  return values.map((value) => counts.get(value) < max);
}

function formatCoords(destination) {
  const lat = destination.coords?.lat;
  const lng = destination.coords?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return "Sin coordenadas";
  const latitude = `${Math.abs(lat)}° ${lat >= 0 ? "N" : "S"}`;
  const longitude = `${Math.abs(lng)}° ${lng >= 0 ? "E" : "O"}`;
  return `${latitude}, ${longitude}`;
}

function listNames(destinations) {
  const names = destinations.map((item) => item.name).filter(Boolean);
  if (names.length <= 1) return names[0] || "";
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

function fieldKey(label) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
