import { getCatalogMeta, getDestinations } from "../data/destinations.js";
import { filterDestinations, uniqueValues, typeLabel } from "../services/filters.js";
import { createDestinationRow } from "../components/destinationCard.js";
import { initSearchBox } from "../components/searchBox.js";
import { searchDestinations } from "../services/search.js";
import { initMap } from "../viz/map.js";

export async function initExplorerPage() {
  const mapSlot = document.querySelector("[data-map]");
  // Leaflet se carga de forma diferida en la Etapa 3.
  await initMap(mapSlot, { destinations: [] });

  const listRoot = document.querySelector("[data-explorer-list]");
  const status = document.querySelector("[data-explorer-status]");
  const continentSelect = document.querySelector("[data-filter-continent]");
  const countrySelect = document.querySelector("[data-filter-country]");
  const categorySelect = document.querySelector("[data-filter-category]");
  const clearBtn = document.querySelector("[data-filters-clear]");
  const searchRoot = document.querySelector("[data-search-root]");

  if (!listRoot) return;

  let destinations = [];
  let labels = {};
  let query = "";

  try {
    const [meta, data] = await Promise.all([getCatalogMeta(), getDestinations()]);
    destinations = data;
    labels = meta.typeLabels || {};
  } catch (error) {
    console.error(error);
    if (status) status.textContent = "No se pudo cargar el catálogo.";
    return;
  }

  populateSelect(continentSelect, uniqueValues(destinations, "continent"), "Todos los continentes");
  populateSelect(categorySelect, uniqueValues(destinations, "type"), "Todas las categorías", (value) =>
    typeLabel(value, labels)
  );
  refreshCountries();

  const params = new URLSearchParams(window.location.search);
  if (params.get("continente") && continentSelect) {
    continentSelect.value = params.get("continente");
  }
  if (params.get("pais") && countrySelect) {
    countrySelect.value = params.get("pais");
  }
  if (params.get("categoria") && categorySelect) {
    categorySelect.value = params.get("categoria");
  }
  if (params.get("q")) {
    query = params.get("q");
  }

  initSearchBox(searchRoot, {
    onQuery: (value) => searchDestinations(value),
    onClear: () => {
      query = "";
      render();
    },
    onSelect: (item) => {
      window.location.href = item.href;
    },
  });

  if (query && searchRoot) {
    const input = searchRoot.querySelector("[data-search-input]");
    if (input) input.value = query;
  }

  const onFilterChange = () => {
    refreshCountries();
    render();
  };

  continentSelect?.addEventListener("change", onFilterChange);
  countrySelect?.addEventListener("change", render);
  categorySelect?.addEventListener("change", render);

  clearBtn?.addEventListener("click", () => {
    if (continentSelect) continentSelect.value = "";
    if (countrySelect) countrySelect.value = "";
    if (categorySelect) categorySelect.value = "";
    query = "";
    const input = searchRoot?.querySelector("[data-search-input]");
    if (input) input.value = "";
    searchRoot?.querySelector("[data-search-clear]")?.setAttribute("hidden", "");
    refreshCountries();
    render();
  });

  // Búsqueda textual también alimenta el listado (además de sugerencias).
  searchRoot?.querySelector("[data-search-input]")?.addEventListener("input", (event) => {
    query = event.target.value.trim();
    window.clearTimeout(searchRoot._listTimer);
    searchRoot._listTimer = window.setTimeout(render, 180);
  });

  render();

  function refreshCountries() {
    const continent = continentSelect?.value || "";
    const pool = continent ? destinations.filter((d) => d.continent === continent) : destinations;
    const current = countrySelect?.value || "";
    populateSelect(countrySelect, uniqueValues(pool, "country"), "Todos los países");
    if (current && uniqueValues(pool, "country").includes(current) && countrySelect) {
      countrySelect.value = current;
    }
  }

  function render() {
    const filtered = filterDestinations(destinations, {
      continent: continentSelect?.value || "",
      country: countrySelect?.value || "",
      category: categorySelect?.value || "",
      query,
    }).sort((a, b) => a.name.localeCompare(b.name, "es"));

    listRoot.innerHTML = "";

    if (!filtered.length) {
      listRoot.innerHTML = `
        <div class="empty-state" role="status">
          <h2 class="empty-state__title">Sin resultados</h2>
          <p>No encontramos destinos con esa combinación de búsqueda y filtros. Probá limpiar los filtros o usar otro término.</p>
        </div>
      `;
      if (status) status.textContent = "0 destinos";
      return;
    }

    filtered.forEach((destination, index) => {
      const row = createDestinationRow(destination, { labels });
      if (index < 8) row.setAttribute("data-aos", "fade-up");
      listRoot.appendChild(row);
    });

    if (status) {
      status.textContent = `${filtered.length} destino${filtered.length === 1 ? "" : "s"}`;
    }

    if (window.AOS) window.AOS.refreshHard?.() || window.AOS.refresh();
  }
}

function populateSelect(select, values, placeholder, labelFn = (v) => v) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>`;
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = labelFn(value);
    select.appendChild(option);
  });
  if (values.includes(current)) select.value = current;
}
