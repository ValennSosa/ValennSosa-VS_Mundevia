import { initSearchBox } from "../components/searchBox.js";
import { searchDestinations } from "../services/search.js";
import { initGlobe } from "../viz/globe.js";
import {
  getCatalogMeta,
  getDestinations,
  getFeaturedDestinations,
  getPopularDestinations,
} from "../data/destinations.js";
import { createDestinationCard } from "../components/destinationCard.js";
import { uniqueValues } from "../services/filters.js";
import { ROUTES, destinationHref } from "../config.js";

export async function initHomePage() {
  const searchRoot = document.querySelector("[data-search-root]");
  initSearchBox(searchRoot, {
    onQuery: (query) => searchDestinations(query),
  });

  const globeSlot = document.querySelector("[data-globe]");
  let destinations = [];
  try {
    destinations = await getDestinations();
  } catch (error) {
    console.error(error);
  }
  await initGlobe(globeSlot, { destinations });

  await renderHomeCollections();
  renderContinents(destinations);
  renderCuriosity(destinations);
}

async function renderHomeCollections() {
  const featuredRoot = document.querySelector("[data-home-featured]");
  const popularRoot = document.querySelector("[data-home-popular]");
  if (!featuredRoot && !popularRoot) return;

  try {
    const [meta, featured, popular] = await Promise.all([
      getCatalogMeta(),
      getFeaturedDestinations(3),
      getPopularDestinations(6),
    ]);
    const labels = meta.typeLabels || {};

    if (featuredRoot) {
      featuredRoot.innerHTML = "";
      featured.forEach((destination, index) => {
        const card = createDestinationCard(destination, {
          labels,
          variant: index === 0 ? "featured" : "editorial",
        });
        card.setAttribute("data-aos", "fade-up");
        featuredRoot.appendChild(card);
      });
    }

    if (popularRoot) {
      popularRoot.innerHTML = "";
      popular.forEach((destination) => {
        const card = createDestinationCard(destination, { labels });
        card.setAttribute("data-aos", "fade-up");
        popularRoot.appendChild(card);
      });
    }
  } catch (error) {
    console.error(error);
  }
}

function renderContinents(destinations) {
  const root = document.querySelector("[data-home-continents]");
  if (!root || !destinations.length) return;

  const continents = uniqueValues(destinations, "continent");
  root.innerHTML = continents
    .map((continent) => {
      const count = destinations.filter((d) => d.continent === continent).length;
      return `
        <a class="continent-tile" href="${ROUTES.explorer}?continente=${encodeURIComponent(continent)}">
          <span class="continent-tile__name">${continent}</span>
          <span class="continent-tile__count">${count} destino${count === 1 ? "" : "s"}</span>
        </a>
      `;
    })
    .join("");
}

function renderCuriosity(destinations) {
  const root = document.querySelector("[data-home-curiosity]");
  if (!root || !destinations.length) return;

  const withCuriosity = destinations.filter((d) => d.curiosities?.length);
  if (!withCuriosity.length) return;

  const pick = withCuriosity[Math.floor(Math.random() * withCuriosity.length)];
  const curiosity = pick.curiosities[0];

  root.innerHTML = `
    <p class="curiosity__eyebrow">Dato curioso</p>
    <blockquote class="curiosity__quote">“${escapeHtml(curiosity)}”</blockquote>
    <p class="curiosity__source">
      <a href="${destinationHref(pick.id)}">${escapeHtml(pick.name)}</a>
      · ${escapeHtml(pick.country)}
    </p>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
