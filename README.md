# VS Mundévia

Explorá el mundo sin tener un destino en mente. VS Mundévia es una experiencia web de descubrimiento geográfico y cultural: países, paisajes, tradiciones y curiosidades en una interfaz visual pensada para generar curiosidad.

**Autora:** Valentina Sosa

> Proyecto frontend de portfolio. Los destinos son reales; la plataforma es una experiencia editorial ficticia de exploración.

## Qué podés hacer

- **Entrar por curiosidad** desde la portada, con un globo interactivo y destinos destacados.
- **Buscar** lugares mientras escribís, con sugerencias en tiempo real.
- **Explorar el mapa** y filtrar por continente, país o categoría.
- **Abrir fichas** de cada destino: ubicación, clima, cultura, gastronomía, tradiciones y curiosidades.
- **Dejarte sorprender** con un destino al azar.
- **Guardar favoritos** y **comparar** hasta tres lugares lado a lado.

El catálogo incluye más de 30 destinos repartidos por el mundo, con información verificable e imágenes atribuidas.

## Recorrido del sitio

| Página | Para qué sirve |
|--------|----------------|
| Inicio | Presentación, globo 3D y acceso rápido a la exploración |
| Explorador | Mapa, listado y filtros combinables |
| Destino | Ficha completa y compartible de un lugar |
| Sorpréndeme | Descubrimiento aleatorio |
| Favoritos | Lugares guardados en el navegador |
| Comparar | Hasta tres destinos en paralelo |

Las fichas se comparten con un enlace del tipo `destino.html?id=nombre-del-lugar`.

## Enfoque técnico (resumen)

Sitio multi-página en HTML, estilos con Sass y Bootstrap 5.3, lógica en JavaScript modular. Visualizaciones con Three.js (globo) y Leaflet (mapa). Los datos viven en JSON local; favoritos y comparación se guardan en el navegador (`localStorage`). Sin backend.

## Cómo probarlo en local

Necesitás Node.js 18+ y npm.

```bash
npm install
npm start
```

Abrí [http://localhost:3000](http://localhost:3000). Conviene usar el servidor local: el sitio no está pensado para abrirse como archivo suelto en el navegador.

Para recompilar estilos:

```bash
npm run sass
# o, mientras editás:
npm run sass:watch
```

## Créditos

© 2026 VS Mundévia · Valentina Sosa.

Proyecto inspirado en la exploración del mundo, la diversidad cultural y el descubrimiento de lugares, paisajes y tradiciones.

Las fotografías respetan la atribución de cada autor, archivo y licencia en las fichas y en el catálogo.
