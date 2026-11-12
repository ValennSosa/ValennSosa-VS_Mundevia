# VS Mundévia

Explorador digital del mundo: turismo, cultura y geografía en una experiencia frontend inmersiva.

**Autora:** Valentina Sosa · Identificador técnico: `vs-mundevia`

> Etapa 0 — Scaffold inicial. Sin catálogo completo ni visualizaciones 3D/mapa aún.

## Stack

- HTML5 semántico (multi-página)
- Bootstrap 5.3
- Sass modular (`@use` → `styles/style.css`)
- JavaScript ES Modules
- AOS (animaciones al scroll)
- Three.js (globo, carga diferida — etapas siguientes)
- Leaflet (mapa, carga diferida — etapas siguientes)
- Datos locales JSON + `localStorage` (favoritos / comparar)

## Requisitos

- Node.js 18+
- npm

## Comandos

```bash
# Instalar dependencias
npm install

# Compilar Sass una vez
npm run sass

# Vigilar cambios de Sass
npm run sass:watch

# Servir el sitio en http://localhost:3000
npm start

# Durante el desarrollo (dos terminales)
npm run sass:watch
npm start
```

> Abrí el proyecto con un servidor local (`npm start`). Los ES Modules y las rutas a `node_modules` no funcionan bien abriendo el HTML como `file://`.

## Estructura

```text
├── index.html / explorador.html / destino.html
├── sorprendeme.html / comparar.html / favoritos.html
├── scss/                  # partials + main.scss
├── styles/style.css       # CSS compilado
├── js/                    # ES Modules (components, services, pages, viz)
├── data/destinations.json # catálogo (URLs de imagen centralizadas)
└── assets/                # imágenes, texturas e íconos futuros
```

## Roles de visualización

| Vista | Tecnología | Rol |
|-------|------------|-----|
| Home | Three.js (próx.) | Curiosidad + hotspots de destinos destacados |
| Explorador | Leaflet (próx.) | Navegación geográfica, filtros y marcadores |

## Próximas etapas

1. Catálogo JSON (≥30 destinos) + fichas + buscador
2. Globo 3D con hotspots featured
3. Mapa Leaflet + filtros
4. Sorpréndeme + Favoritos
5. Comparador + SEO/a11y/performance

## Créditos

© 2026 VS Mundévia · Valentina Sosa.

Proyecto ficticio inspirado en la exploración del mundo, la diversidad cultural y el descubrimiento de lugares, paisajes y tradiciones.

Las fotografías externas (Unsplash/Pexels) respetarán la atribución de cada fuente cuando se cargue el catálogo.
