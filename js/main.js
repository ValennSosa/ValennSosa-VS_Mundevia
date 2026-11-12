import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";

function initAOS() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.AOS) {
    window.AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 60,
    });
  }
}

function detectPage() {
  const file = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (file === "" || file === "index.html") return "home";
  if (file.includes("explorador")) return "explorer";
  if (file.includes("destino")) return "destination";
  if (file.includes("sorprendeme")) return "surprise";
  if (file.includes("comparar")) return "compare";
  if (file.includes("favoritos")) return "favorites";
  return "unknown";
}

async function bootPage(page) {
  switch (page) {
    case "home": {
      const { initHomePage } = await import("./pages/home.js");
      await initHomePage();
      break;
    }
    case "explorer": {
      const { initExplorerPage } = await import("./pages/explorer.js");
      await initExplorerPage();
      break;
    }
    case "destination": {
      const { initDestinationPage } = await import("./pages/destination.js");
      await initDestinationPage();
      break;
    }
    case "surprise": {
      const { initSurprisePage } = await import("./pages/surprise.js");
      initSurprisePage();
      break;
    }
    case "compare": {
      const { initComparePage } = await import("./pages/compare.js");
      initComparePage();
      break;
    }
    case "favorites": {
      const { initFavoritesPage } = await import("./pages/favorites.js");
      initFavoritesPage();
      break;
    }
    default:
      break;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  renderNavbar(document.querySelector("[data-app-header]"));
  renderFooter(document.querySelector("[data-app-footer]"));
  initAOS();
  await bootPage(detectPage());
});
