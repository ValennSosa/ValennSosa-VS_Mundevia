import { getDestinationById } from "../data/destinations.js";
import { renderGallery } from "../components/gallery.js";

/**
 * Fichas compartibles vía ?id=
 */
export async function initDestinationPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const status = document.querySelector("[data-destination-status]");
  const gallery = document.querySelector("[data-destination-gallery]");

  if (!id) {
    if (status) {
      status.textContent =
        "Elegí un destino desde el mapa, el buscador o Sorpréndeme. Las fichas usan enlaces directos (?id=).";
    }
    renderGallery(gallery, []);
    return;
  }

  try {
    const destination = await getDestinationById(id);
    if (!destination) {
      if (status) status.textContent = `No encontramos el destino “${id}”.`;
      return;
    }
    if (status) status.textContent = `Destino: ${destination.name}`;
    renderGallery(gallery, destination.images || []);
    document.title = `${destination.name} · VS Mundévia`;
  } catch {
    if (status) status.textContent = "El catálogo aún no está disponible (próxima etapa).";
  }
}
