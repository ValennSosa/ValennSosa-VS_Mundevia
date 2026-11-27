import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const out = ".vercel-out";
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const files = [
  "index.html",
  "explorador.html",
  "destino.html",
  "favoritos.html",
  "comparar.html",
  "sorprendeme.html",
  "sitemap.xml",
  "robots.txt",
];

for (const file of files) {
  cpSync(file, join(out, file));
}

cpSync("js", join(out, "js"), { recursive: true });
cpSync("styles", join(out, "styles"), { recursive: true });
cpSync("data", join(out, "data"), { recursive: true });

if (existsSync("assets")) {
  cpSync("assets", join(out, "assets"), { recursive: true });
}

cpSync("node_modules/bootstrap/dist", join(out, "node_modules/bootstrap/dist"), { recursive: true });
cpSync("node_modules/aos/dist", join(out, "node_modules/aos/dist"), { recursive: true });

mkdirSync(join(out, "node_modules/three/build"), { recursive: true });
mkdirSync(join(out, "node_modules/three/examples/jsm/controls"), { recursive: true });
cpSync(
  "node_modules/three/build/three.module.js",
  join(out, "node_modules/three/build/three.module.js")
);
cpSync(
  "node_modules/three/examples/jsm/controls/OrbitControls.js",
  join(out, "node_modules/three/examples/jsm/controls/OrbitControls.js")
);
