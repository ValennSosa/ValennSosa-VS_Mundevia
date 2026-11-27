import { ROUTES } from "../config.js";

const NAV_ITEMS = [
  { href: `${ROUTES.explorer}#catalogo`, label: "Explorar", id: "catalog", current: "location" },
  { href: `${ROUTES.explorer}#mapa`, label: "Mapa", id: "map", current: "location" },
  { href: ROUTES.surprise, label: "Sorpréndeme", id: "surprise", current: "page" },
  { href: ROUTES.compare, label: "Comparar", id: "compare", current: "page" },
  { href: ROUTES.favorites, label: "Favoritos", id: "favorites", current: "page" },
];

function currentPageFile() {
  return (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
}

function activeNavId() {
  const file = currentPageFile();
  if (file.includes("explorador")) return window.location.hash === "#mapa" ? "map" : "catalog";
  if (file.includes("sorprendeme")) return "surprise";
  if (file.includes("comparar")) return "compare";
  if (file.includes("favoritos")) return "favorites";
  return "";
}

export function renderNavbar(target) {
  if (!target) return;

  const active = activeNavId();

  target.innerHTML = `
    <header class="site-header" data-navbar>
      <nav class="site-nav" aria-label="Principal">
        <a class="brand" href="${ROUTES.home}">
          <span class="brand__mark">VS&nbsp;Mundévia</span>
          <span class="brand__tag">Exploración</span>
        </a>
        <button
          class="nav-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="primary-menu"
          data-nav-toggle
        >
          <span class="u-sr-only">Abrir menú</span>
          <span aria-hidden="true">☰</span>
        </button>
        <div class="nav-menu" id="primary-menu" data-nav-menu>
          ${NAV_ITEMS.map(
            (item) => `
              <a
                class="nav-link${active === item.id ? " is-active" : ""}"
                href="${item.href}"
                data-nav-id="${item.id}"
                data-nav-current="${item.current}"
                ${active === item.id ? `aria-current="${item.current}"` : ""}
              >${item.label}</a>
            `
          ).join("")}
        </div>
      </nav>
    </header>
  `;

  const toggle = target.querySelector("[data-nav-toggle]");
  const menu = target.querySelector("[data-nav-menu]");

  const applyActive = () => {
    const current = activeNavId();
    menu?.querySelectorAll("[data-nav-id]").forEach((link) => {
      const on = link.dataset.navId === current;
      link.classList.toggle("is-active", on);
      if (on) link.setAttribute("aria-current", link.dataset.navCurrent || "page");
      else link.removeAttribute("aria-current");
    });
  };

  menu?.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
    });
  });

  window.addEventListener("hashchange", applyActive);

  toggle?.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".u-sr-only").textContent = open ? "Cerrar menú" : "Abrir menú";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu?.classList.contains("is-open")) {
      menu.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
      toggle?.focus();
    }
  });
}
