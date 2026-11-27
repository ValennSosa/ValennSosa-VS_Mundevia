import { ROUTES } from "../config.js";

const NAV_ITEMS = [
  { href: ROUTES.home, label: "Explorar", id: "home" },
  { href: ROUTES.explorer, label: "Mapa", id: "explorer" },
  { href: ROUTES.surprise, label: "Sorpréndeme", id: "surprise" },
  { href: ROUTES.compare, label: "Comparar", id: "compare" },
  { href: ROUTES.favorites, label: "Favoritos", id: "favorites" },
];

function currentPageId() {
  const file = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (file === "" || file === "index.html") return "home";
  if (file.includes("explorador")) return "explorer";
  if (file.includes("destino")) return "destination";
  if (file.includes("sorprendeme")) return "surprise";
  if (file.includes("comparar")) return "compare";
  if (file.includes("favoritos")) return "favorites";
  return "";
}

export function renderNavbar(target) {
  if (!target) return;

  const active = currentPageId();

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
                ${active === item.id ? 'aria-current="page"' : ""}
              >${item.label}</a>
            `
          ).join("")}
        </div>
      </nav>
    </header>
  `;

  const toggle = target.querySelector("[data-nav-toggle]");
  const menu = target.querySelector("[data-nav-menu]");

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
