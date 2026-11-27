/**
 * Globo 3D de la portada.
 * Three.js se importa solo si WebGL está disponible.
 * La textura local y su licencia están en assets/textures/ATRIBUCION.txt.
 */
import { destinationHref, ROUTES } from "../config.js";

const EARTH_TEXTURE = "./assets/textures/earth-day.jpg";
const EARTH_RADIUS = 1;
const instances = new WeakMap();

export async function initGlobe(container, { destinations = [] } = {}) {
  if (!container) return null;

  instances.get(container)?.destroy();

  container.removeAttribute("aria-hidden");
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", "Globo terráqueo interactivo");

  if (!webglAvailable()) {
    showFallback(container, "Este navegador no puede mostrar el globo 3D.");
    return idleApi();
  }

  let THREE;
  let OrbitControls;
  try {
    THREE = await import("three");
    ({ OrbitControls } = await import("../../node_modules/three/examples/jsm/controls/OrbitControls.js"));
  } catch (error) {
    console.error(error);
    showFallback(container, "No se pudo cargar el visor 3D.");
    return idleApi();
  }

  try {
    const api = await mountGlobe(THREE, OrbitControls, container, destinations);
    instances.set(container, api);
    return api;
  } catch (error) {
    console.error(error);
    showFallback(container, "No se pudo preparar el globo.");
    return idleApi();
  }
}

function idleApi() {
  return { markerCount: 0, destroy() {} };
}

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return Boolean(context);
  } catch {
    return false;
  }
}

function showFallback(container, message) {
  container.removeAttribute("aria-describedby");
  container.dataset.globeState = "error";
  container.dataset.markerCount = "0";
  container.innerHTML = `
    <div class="globe__fallback">
      <p>${escapeHtml(message)} El catálogo sigue disponible para recorrer los destinos.</p>
      <p><a class="btn btn--ghost" href="${ROUTES.explorer}">Abrir el catálogo</a></p>
    </div>
  `;
}

async function mountGlobe(THREE, OrbitControls, container, destinations) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = window.matchMedia("(max-width: 767px)").matches;
  const markersData = destinations.filter(hasCoordinates);

  container.dataset.motion = reduced ? "reduced" : "full";
  container.dataset.globeState = "loading";
  container.innerHTML = `
    <div class="globe">
      <p class="globe__status" role="status">Preparando el globo…</p>
      <div class="globe__stage">
        <canvas class="globe__canvas" aria-hidden="true"></canvas>
      </div>
      <article class="globe__card" data-globe-card hidden></article>
      <p class="globe__hint" id="globe-hint">
        Arrastrá para girar. Usá la rueda o un pellizco para acercar. Elegí un punto para ver el destino.
      </p>
      <p class="globe__credit">
        <a href="https://commons.wikimedia.org/wiki/File:Land_ocean_ice_2048.jpg">Blue Marble</a>
        · NASA / Reto Stöckli y Robert Simmon ·
        <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.es">CC BY-SA 3.0</a>
      </p>
    </div>
  `;
  container.setAttribute("aria-describedby", "globe-hint");

  const canvas = container.querySelector(".globe__canvas");
  const status = container.querySelector(".globe__status");
  const card = container.querySelector("[data-globe-card]");
  const pixelCap = small ? 1.25 : 1.6;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !small,
    powerPreference: small ? "low-power" : "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelCap));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.08, 90);
  camera.position.set(0.2, 0.42, 2.9);

  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = !reduced;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.7;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.55;
  controls.minDistance = 1.58;
  controls.maxDistance = 4.6;
  controls.minPolarAngle = 0.28;
  controls.maxPolarAngle = Math.PI - 0.28;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x9eb0c8, 0.62));
  scene.add(new THREE.HemisphereLight(0xd5e4f2, 0x2a2118, 0.38));
  const sun = new THREE.DirectionalLight(0xfff3df, 2.35);
  sun.position.set(4.6, 1.8, 3.1);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x7eb8d4, 0.42);
  rim.position.set(-4.2, -0.6, -2.4);
  scene.add(rim);

  const stars = createStars(THREE, small ? 160 : 340);
  scene.add(stars);

  let texture;
  try {
    texture = await loadTexture(THREE, EARTH_TEXTURE);
  } catch (error) {
    controls.dispose();
    stars.geometry.dispose();
    stars.material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    throw error;
  }
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const segments = small ? [48, 32] : [64, 48];
  const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, segments[0], segments[1]);
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.94,
    metalness: 0.02,
  });
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  const atmosphere = createAtmosphere(THREE);
  scene.add(atmosphere);

  const markerTexture = createMarkerTexture(THREE);
  const markerMaterial = new THREE.SpriteMaterial({
    map: markerTexture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const markers = markersData.map((destination) => {
    const sprite = new THREE.Sprite(markerMaterial);
    const scale = destination.featured ? 0.105 : 0.078;
    sprite.position.copy(latLngToVector3(THREE, destination.coords.lat, destination.coords.lng, EARTH_RADIUS + 0.02));
    sprite.scale.setScalar(scale);
    sprite.userData = { destination, baseScale: scale };
    sprite.renderOrder = 3;
    scene.add(sprite);
    return sprite;
  });

  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const disposables = [earthGeometry, earthMaterial, texture, markerTexture, markerMaterial, atmosphere.geometry, atmosphere.material, stars.geometry, stars.material];

  let disposed = false;
  let raf = 0;
  let running = false;
  let onScreen = true;
  let idleUntil = 0;
  let resumeTimer = 0;
  let pressed = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let lockedId = "";
  let selected = null;
  let cardKey = "";

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelCap));
    renderer.setSize(width, height, false);
    requestRender();
  }

  function requestRender() {
    if (disposed || running) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function frame(now) {
    running = false;
    if (disposed) return;

    const delta = Math.min(clock.getDelta(), 0.05);
    const allowSpin = !reduced && !document.hidden && onScreen && performance.now() > idleUntil;
    controls.autoRotate = allowSpin;
    controls.update(delta);
    updateMarkers(now);
    renderer.render(scene, camera);
    if (!disposed && allowSpin) requestRender();
  }

  function pauseAutoRotate() {
    idleUntil = performance.now() + 2200;
    window.clearTimeout(resumeTimer);
    if (reduced) return;
    resumeTimer = window.setTimeout(() => {
      idleUntil = 0;
      requestRender();
    }, 2300);
  }

  function updateMarkers(now) {
    const cam = camera.position;
    markers.forEach((marker) => {
      const facing = marker.position.dot(cam) > 0.08;
      marker.visible = facing;
      const base = marker.userData.baseScale;
      if (marker === selected && facing && !reduced) {
        const pulse = 1 + Math.sin(now * 0.004) * 0.14;
        marker.scale.setScalar(base * pulse);
      } else {
        marker.scale.setScalar(base);
      }
    });
  }

  function project(marker) {
    const vector = marker.position.clone().project(camera);
    const rect = canvas.getBoundingClientRect();
    return {
      x: (vector.x * 0.5 + 0.5) * rect.width,
      y: (-vector.y * 0.5 + 0.5) * rect.height,
    };
  }

  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return [];
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const visible = markers.filter((marker) => marker.visible);
    const hits = raycaster.intersectObjects(visible, false);
    if (!hits.length) return [];

    const primary = hits[0].object;
    const origin = project(primary);
    const threshold = Math.max(28, rect.width * 0.045);
    const nearby = visible
      .filter((marker) => marker !== primary)
      .map((marker) => {
        const point = project(marker);
        return { marker, distance: Math.hypot(point.x - origin.x, point.y - origin.y) };
      })
      .filter((item) => item.distance <= threshold)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4)
      .map((item) => item.marker);

    return [primary, ...nearby];
  }

  function showCard(group, mode) {
    if (!group.length) {
      clearCard();
      return;
    }
    const key = `${mode}:${group.map((marker) => marker.userData.destination.id).join("|")}`;
    selected = group[0];
    lockedId = mode === "locked" ? selected.userData.destination.id : "";
    if (key === cardKey && !card.hidden) return;
    cardKey = key;
    const primary = selected.userData.destination;
    const extras = group.slice(1).map((marker) => marker.userData.destination);
    card.hidden = false;
    card.innerHTML = `
      <button class="globe__card-close" type="button" data-globe-close aria-label="Cerrar destino">×</button>
      <p class="globe__card-kicker">${escapeHtml(primary.continent)}</p>
      <h2 class="globe__card-title" id="globe-card-title">${escapeHtml(primary.name)}</h2>
      <p class="globe__card-meta">${escapeHtml(primary.country)}</p>
      <a class="globe__card-link" href="${destinationHref(primary.id)}">Ver ficha</a>
      ${
        extras.length
          ? `<ul class="globe__card-alts" aria-label="Destinos cercanos">
              ${extras
                .map(
                  (item) =>
                    `<li><a href="${destinationHref(item.id)}">${escapeHtml(item.name)} · ${escapeHtml(item.country)}</a></li>`
                )
                .join("")}
            </ul>`
          : ""
      }
    `;
    card.setAttribute("aria-labelledby", "globe-card-title");
    canvas.style.cursor = "pointer";
  }

  function clearCard() {
    selected = null;
    lockedId = "";
    cardKey = "";
    card.hidden = true;
    card.innerHTML = "";
    canvas.style.cursor = "grab";
  }

  function onPointerDown(event) {
    pressed = true;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;
    window.clearTimeout(resumeTimer);
    idleUntil = performance.now() + 1000 * 60;
  }

  function onPointerMove(event) {
    if (pressed) {
      if (Math.hypot(event.clientX - startX, event.clientY - startY) > 8) moved = true;
      return;
    }
    if (event.pointerType !== "mouse") return;
    const group = pick(event.clientX, event.clientY);
    canvas.style.cursor = group.length ? "pointer" : "grab";
  }

  function onPointerUp(event) {
    if (!pressed) return;
    const wasClick = !moved;
    pressed = false;
    pauseAutoRotate();
    if (!wasClick || !event.target || !canvas.contains(event.target)) return;
    const group = pick(event.clientX, event.clientY);
    if (!group.length) {
      clearCard();
      return;
    }
    showCard(group, "locked");
    requestRender();
  }

  function onCardClick(event) {
    if (event.target.closest("[data-globe-close]")) {
      clearCard();
      requestRender();
    }
  }

  function onKeyDown(event) {
    if (event.key === "Escape" && !card.hidden) {
      clearCard();
      requestRender();
    }
  }

  function onVisibility() {
    if (!document.hidden) {
      clock.getDelta();
      requestRender();
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersectionObserver = new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    if (onScreen) requestRender();
  });
  intersectionObserver.observe(container);

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  card.addEventListener("click", onCardClick);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("visibilitychange", onVisibility);
  controls.addEventListener("start", () => {
    window.clearTimeout(resumeTimer);
    idleUntil = performance.now() + 1000 * 60;
  });
  controls.addEventListener("end", () => {
    pauseAutoRotate();
    requestRender();
  });
  controls.addEventListener("change", () => requestRender());

  status.textContent = markers.length
    ? `${markers.length} destinos marcados en el globo.`
    : "El globo está listo, sin destinos para marcar.";
  status.classList.add("u-sr-only");
  container.dataset.globeState = "ready";
  container.dataset.markerCount = String(markers.length);
  canvas.style.cursor = "grab";
  resize();
  requestRender();

  function destroy() {
    if (disposed) return;
    disposed = true;
    window.clearTimeout(resumeTimer);
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    card.removeEventListener("click", onCardClick);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("visibilitychange", onVisibility);
    controls.dispose();
    disposables.forEach((item) => item.dispose?.());
    markers.forEach((marker) => scene.remove(marker));
    renderer.dispose();
    renderer.forceContextLoss();
    if (instances.get(container) === api) instances.delete(container);
  }

  const api = { markerCount: markers.length, destroy };
  return api;
}

function hasCoordinates(destination) {
  const lat = destination?.coords?.lat;
  const lng = destination?.coords?.lng;
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function latLngToVector3(THREE, lat, lng, radius) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function loadTexture(THREE, url) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, resolve, undefined, () => {
      reject(new Error(`No se pudo cargar la textura ${url}`));
    });
  });
}

function createAtmosphere(THREE) {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {},
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float rim = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.15);
        gl_FragColor = vec4(0.49, 0.72, 0.83, 1.0) * rim;
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.12, 48, 32), material);
  mesh.renderOrder = 1;
  return mesh;
}

function createStars(THREE, count) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = 16 + Math.random() * 28;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi);
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xe7eef6,
    size: 1.15,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
}

function createMarkerTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  const glow = context.createRadialGradient(32, 32, 1, 32, 32, 30);
  glow.addColorStop(0, "rgba(255, 248, 230, 1)");
  glow.addColorStop(0.14, "rgba(224, 199, 146, 0.98)");
  glow.addColorStop(0.24, "rgba(201, 168, 106, 0.55)");
  glow.addColorStop(0.42, "rgba(201, 168, 106, 0.12)");
  glow.addColorStop(1, "rgba(201, 168, 106, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
