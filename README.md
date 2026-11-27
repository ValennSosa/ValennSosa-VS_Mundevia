# VS Mundévia

Explorador digital del mundo: turismo, cultura y geografía en una experiencia frontend inmersiva.

**Autora:** Valentina Sosa · Identificador técnico: `vs-mundevia`

> Etapa 1 — Catálogo JSON (≥30 destinos), fichas dinámicas (`?id=`), buscador con sugerencias y filtros en el Explorador. Globo 3D y Leaflet pendientes.

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

## URLs de las fichas

La ficha se resuelve con `URLSearchParams` y el formato `destino.html?id=<slug>`. Ese es el enlace que generan el inicio, el explorador, el buscador, los destinos relacionados y el botón de copiar.

`serve` 14, usado por `npm start`, trae `cleanUrls` activado si no hay configuración. En ese modo responde `301` de `/destino.html` a `/destino` y la redirección no arrastra `?id=`. No es un fallo del JavaScript: la consulta se pierde antes de que la página cargue. `serve.json` deja `cleanUrls` en `false`, igual que un hosting de archivos estáticos como GitHub Pages, donde `destino.html?id=machu-picchu` se entrega tal cual.

Para comprobarlo con el servidor ya reiniciado:

- `http://localhost:3000/destino.html?id=machu-picchu` abre Machu Picchu y la dirección conserva `?id=`.
- `http://localhost:3000/destino.html?id=no-existe` muestra el estado de destino no encontrado.
- `http://localhost:3000/destino.html` pide elegir un destino.

Si el navegador ya abrió el sitio cuando `cleanUrls` estaba activo, puede guardar el `301` permanente de `destino.html` hacia `/destino`. Una recarga forzada o una ventana privada vuelve a solicitar `destino.html?id=`. `/destino` sin extensión responde 404, igual que en GitHub Pages.

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

## Etapa 1 (lista)

- Catálogo en `data/destinations.json` (33 destinos)
- Fichas dinámicas compartibles: `destino.html?id=<slug>`
- Buscador con sugerencias (home + explorador)
- Filtros combinables por continente, país y categoría
- Listado editorial accesible (sin Leaflet todavía)

## Próximas etapas

2. Globo 3D con hotspots featured
3. Mapa Leaflet + filtros en mapa
4. Sorpréndeme + Favoritos
5. Comparador + SEO/a11y/performance

## Créditos

© 2026 VS Mundévia · Valentina Sosa.

Proyecto ficticio inspirado en la exploración del mundo, la diversidad cultural y el descubrimiento de lugares, paisajes y tradiciones.

Las fotografías externas (Unsplash/Pexels) respetarán la atribución de cada fuente cuando se cargue el catálogo.
