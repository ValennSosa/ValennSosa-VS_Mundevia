import { getCatalogMeta, getImage } from "../data/destinations.js";
import { destinationHref } from "../config.js";
import { typeLabel } from "../services/filters.js";
import { pickRandomDestination } from "../services/random.js";
import { createFavoriteButton } from "../components/favoriteButton.js";

export async function initSurprisePage() {
  const status = document.querySelector("[data-surprise-status]");
  const stage = document.querySelector("[data-surprise-stage]");
  const fallback = document.querySelector("[data-surprise-fallback]");
  const nextButton = document.querySelector("[data-surprise-next]");
  if (!stage || !nextButton) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let currentId = null;
  let labels = {};
  let busy = false;

  const announce = (message) => {
    if (status) status.textContent = message;
  };

  const showFallback = (title, text) => {
    stage.hidden = true;
    nextButton.disabled = true;
    if (fallback) {
      fallback.hidden = false;
      const heading = fallback.querySelector("[data-surprise-fallback-title]");
      const copy = fallback.querySelector("[data-surprise-fallback-text]");
      if (heading) heading.textContent = title;
      if (copy) copy.textContent = text;
    }
    announce(title);
  };

  const fill = (destination) => {
    const image = getImage(destination, 0);
    const photo = stage.querySelector("[data-surprise-image]");
    const credit = stage.querySelector("[data-surprise-credit]");
    const kicker = stage.querySelector("[data-surprise-kicker]");
    const title = stage.querySelector("[data-surprise-title]");
    const meta = stage.querySelector("[data-surprise-meta]");
    const text = stage.querySelector("[data-surprise-text]");
    const link = stage.querySelector("[data-surprise-link]");
    const save = stage.querySelector("[data-surprise-save]");

    if (photo) {
      if (image?.url) {
        photo.hidden = false;
        photo.src = image.url;
        photo.alt = image.alt || destination.name;
      } else {
        photo.removeAttribute("src");
        photo.alt = "";
        photo.hidden = true;
      }
    }

    if (credit) {
      credit.replaceChildren();
      const parts = [image?.credit, image?.license].filter(Boolean);
      if (parts.length) {
        credit.textContent = parts.join(" · ");
        if (image?.licenseUrl) {
          const anchor = document.createElement("a");
          anchor.href = image.licenseUrl;
          anchor.textContent = image.license || "Licencia";
          credit.replaceChildren();
          if (image.credit) {
            credit.append(`${image.credit} · `);
          }
          credit.append(anchor);
        }
      }
      credit.hidden = credit.childNodes.length === 0 && !credit.textContent;
    }

    if (kicker) kicker.textContent = typeLabel(destination.type, labels);
    if (title) title.textContent = destination.name;
    if (meta) meta.textContent = [destination.country, destination.continent].filter(Boolean).join(" · ");
    if (text) text.textContent = destination.description || "";
    if (link) link.href = destinationHref(destination.id);
    if (save) save.replaceChildren(createFavoriteButton(destination));

    stage.hidden = false;
    if (fallback) fallback.hidden = true;
    nextButton.disabled = false;
    announce(`Destino elegido: ${destination.name}, ${destination.country}.`);
  };

  const reveal = async (destination, animate) => {
    if (animate && !reduced && !stage.hidden) {
      stage.classList.add("is-leaving");
      await wait(240);
    }
    fill(destination);
    stage.classList.remove("is-leaving");
  };

  const loadNext = async (animate) => {
    if (busy) return;
    busy = true;
    nextButton.disabled = true;
    try {
      const destination = await pickRandomDestination(currentId);
      if (!destination) {
        showFallback(
          "No hay destinos para mostrar",
          "El catálogo no tiene lugares disponibles en este momento."
        );
        return;
      }
      currentId = destination.id;
      await reveal(destination, animate);
    } catch (error) {
      console.error(error);
      showFallback(
        "No se pudo elegir un destino",
        "No llegamos a leer el catálogo. Podés seguir explorando el listado."
      );
    } finally {
      busy = false;
      if (!stage.hidden) nextButton.disabled = false;
    }
  };

  nextButton.addEventListener("click", () => {
    loadNext(true);
  });

  try {
    const meta = await getCatalogMeta();
    labels = meta.typeLabels || {};
  } catch (error) {
    console.error(error);
    showFallback(
      "No se pudo elegir un destino",
      "No llegamos a leer el catálogo. Podés seguir explorando el listado."
    );
    return;
  }

  announce("Buscando un destino…");
  await loadNext(false);
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
