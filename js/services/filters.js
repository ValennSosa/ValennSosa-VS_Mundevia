export function filterDestinations(
  destinations = [],
  { continent = "", country = "", category = "", query = "" } = {}
) {
  const q = query.trim().toLowerCase();

  return destinations.filter((d) => {
    if (continent && d.continent !== continent) return false;
    if (country && d.country !== country) return false;
    if (category && d.type !== category) return false;

    if (q) {
      const haystack = [
        d.name,
        d.city,
        d.country,
        d.continent,
        d.type,
        ...(d.tags || []),
        ...(d.languages || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

export function uniqueValues(destinations = [], key) {
  return [...new Set(destinations.map((d) => d[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

export function typeLabel(type, labels = {}) {
  return labels[type] || type;
}
