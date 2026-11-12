/**
 * Filtros por continente, país y categoría.
 * Etapa 0: helpers preparados para el explorador.
 */
export function filterDestinations(destinations = [], { continent, country, category } = {}) {
  return destinations.filter((d) => {
    if (continent && d.continent !== continent) return false;
    if (country && d.country !== country) return false;
    if (category && d.type !== category) return false;
    return true;
  });
}

export function uniqueValues(destinations = [], key) {
  return [...new Set(destinations.map((d) => d[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
}
