import { ROUTES } from "../config.js";

export function renderFooter(target) {
  if (!target) return;

  target.innerHTML = `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <div>
          <div class="site-footer__brand">VS&nbsp;Mundévia</div>
          <p class="site-footer__text">
            Un explorador digital del mundo: curiosidad, cultura y geografía en una sola experiencia.
          </p>
        </div>
        <div>
          <h2 class="site-footer__title">Explorar</h2>
          <ul class="site-footer__list">
            <li><a href="${ROUTES.home}">Inicio</a></li>
            <li><a href="${ROUTES.explorer}#mapa">Mapa global</a></li>
            <li><a href="${ROUTES.surprise}">Sorpréndeme</a></li>
          </ul>
        </div>
        <div>
          <h2 class="site-footer__title">Tu viaje</h2>
          <ul class="site-footer__list">
            <li><a href="${ROUTES.compare}">Comparar destinos</a></li>
            <li><a href="${ROUTES.favorites}">Favoritos</a></li>
            <li><a href="${ROUTES.explorer}#catalogo">Fichas de destino</a></li>
          </ul>
        </div>
      </div>
      <div class="site-footer__copy">
        <p>© 2026 VS Mundévia · Valentina Sosa.</p>
        <p>
          Proyecto ficticio inspirado en la exploración del mundo, la diversidad cultural
          y el descubrimiento de lugares, paisajes y tradiciones.
        </p>
      </div>
    </footer>
  `;
}
