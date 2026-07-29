/**
 * build.ts — arma el paquete instalable y, con --zip, el ZIP de la tienda.
 *
 * Salida en `build/`:
 *
 *   build/          <- se carga con "Cargar descomprimida" en chrome://extensions
 *   build.zip       <- lo que se sube a la tienda
 *
 * REQUISITO DURO: `manifest.json` va en la RAIZ del ZIP, no dentro de una carpeta
 * (RESTRICCIONES-CHROME-WEB-STORE.md 4.5). Un ZIP con el manifest adentro de un directorio
 * se rechaza al subirlo.
 *
 * No hay bundler ni minificacion, a proposito: la politica prohibe ofuscar y pide
 * explicitamente "enviar el codigo tal como fue escrito" (3.8). El codigo publicado ES el
 * codigo del repo, lo que ademas acorta la revision.
 *
 * `npm run build`  ·  `npm run build -- --zip`
 */

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const EXTENSION_DIR = resolve(import.meta.dirname, "..");
const DIST = join(EXTENSION_DIR, "dist");
const SRC = join(EXTENSION_DIR, "src");
const BUILD = join(EXTENSION_DIR, "build");
const ZIP = join(EXTENSION_DIR, "build.zip");

const wantsZip = process.argv.includes("--zip");

function fail(message: string): never {
  console.error(`build: ${message}`);
  process.exit(1);
}

/** Copia recursiva de todo lo de dist/ menos los .d.ts, que no son codigo ejecutable. */
function copyCompiled(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const source = join(from, entry);
    const target = join(to, entry);
    if (statSync(source).isDirectory()) {
      copyCompiled(source, target);
    } else if (entry.endsWith(".js")) {
      copyFileSync(source, target);
    }
  }
}

/**
 * theme-boot.ts se carga a proposito como <script> CLASICO (sin type="module"): tiene que
 * correr antes del primer paint, y un modulo ES es diferido por definicion. Pero el archivo
 * no tiene ningun import/export propio, y con isolatedModules:true tsc le agrega un
 * `export {};` al final para marcarlo como modulo de todos modos. Ese `export` es sintaxis
 * de modulo dentro de un script clasico, y el navegador lo rechaza con "Unexpected token
 * 'export'" — rompe la pagina entera, en silencio salvo por la consola.
 *
 * Se lo saca despues de compilar, en vez de sacarle isolatedModules a todo el proyecto:
 * es la unica pieza que necesita ser un script clasico, y la regla que exige verificarlo es
 * el propio caso de uso, no una opcion global del compilador.
 */
function stripModuleMarker(file: string): void {
  const before = readFileSync(file, "utf8");
  const after = before.replace(/\n?export\s*\{\s*\}\s*;?\s*$/, "\n");
  if (after === before) {
    fail(`theme-boot.js no tenia el marcador de modulo esperado — revisar si tsc cambio de comportamiento`);
  }
  // El chequeo va sobre el codigo sin comentarios: el propio comentario del archivo explica
  // por que no debe haber import/export, y esas palabras en prosa no cuentan como sintaxis.
  const withoutComments = after.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  if (/^\s*(import|export)\b/m.test(withoutComments)) {
    fail(`theme-boot.js sigue teniendo sintaxis de modulo despues de limpiarlo: se rompe como <script> clasico`);
  }
  writeFileSync(file, after, "utf8");
}

/** Todo lo que no compila tsc: HTML, CSS, manifest, locales. */
function copyStatic(): void {
  for (const file of ["newtab.html", "newtab.css", "options.html", "options.css", "manifest.json"]) {
    const source = join(SRC, file);
    if (!existsSync(source)) fail(`falta ${file} en src/`);
    copyFileSync(source, join(BUILD, file));
  }
  cpSync(join(SRC, "_locales"), join(BUILD, "_locales"), { recursive: true });
  // Los .json de assets/ no viajan: Fraunces-metrics.json es insumo de build (ya esta
  // horneado en data/font-metrics.js) y en el paquete solo seria peso muerto que la
  // revision de la tienda tiene que mirar.
  cpSync(join(EXTENSION_DIR, "assets"), join(BUILD, "assets"), {
    recursive: true,
    filter: (source) => !source.endsWith(".json"),
  });
}

/**
 * Comprobaciones que evitan un rechazo de la tienda. Es mas barato fallar aca que
 * descubrirlo despues de subir: los metadatos del manifest no se pueden editar en el
 * dashboard, hay que subir version nueva (4.2).
 */
function verifyManifest(): void {
  const raw = readFileSync(join(BUILD, "manifest.json"), "utf8");

  if (/^\s*\/\//m.test(raw) || raw.includes("/*")) {
    fail("manifest.json tiene comentarios: JSON estricto o 'Cannot parse the manifest' al subir");
  }

  const manifest = JSON.parse(raw) as {
    manifest_version: number;
    permissions?: string[];
    host_permissions?: string[];
    background?: unknown;
    content_scripts?: unknown;
    icons?: Record<string, string>;
  };

  if (manifest.manifest_version !== 3) fail("el manifest tiene que ser MV3");
  if (manifest.host_permissions !== undefined) fail("no puede haber host_permissions");
  if (manifest.background !== undefined) fail("no puede haber service worker");
  if (manifest.content_scripts !== undefined) fail("no puede haber content scripts");

  const permissions = manifest.permissions ?? [];
  if (permissions.length !== 1 || permissions[0] !== "storage") {
    fail(`el unico permiso permitido es "storage", hay: ${JSON.stringify(permissions)}`);
  }

  for (const [size, path] of Object.entries(manifest.icons ?? {})) {
    if (!existsSync(join(BUILD, path))) fail(`falta el icono de ${size} px: ${path}`);
  }

  for (const [locale, limit] of [["en", 132], ["es", 132]] as const) {
    const messages = JSON.parse(
      readFileSync(join(BUILD, "_locales", locale, "messages.json"), "utf8"),
    ) as Record<string, { message: string }>;
    const description = messages["extDesc"]?.message ?? "";
    if (description.length > limit) {
      fail(`la descripcion en ${locale} tiene ${description.length} caracteres, el maximo es ${limit}`);
    }
    console.log(`build: descripcion ${locale} = ${description.length}/${limit} caracteres`);
  }
}

/** Ningun archivo del paquete puede pedir nada por red. */
function verifyNoRemoteCode(): void {
  const offenders: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
        continue;
      }
      if (!/\.(js|html|css|json)$/.test(entry)) continue;
      const text = readFileSync(path, "utf8");
      for (const pattern of [/https?:\/\/(?!www\.w3\.org)/, /\bfetch\s*\(/, /XMLHttpRequest/]) {
        if (pattern.test(text)) offenders.push(`${entry}: ${pattern.source}`);
      }
    }
  };
  walk(BUILD);
  if (offenders.length > 0) {
    fail(`hay referencias remotas en el paquete:\n  ${offenders.join("\n  ")}`);
  }
}

function directorySize(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);
    total += stats.isDirectory() ? directorySize(path) : stats.size;
  }
  return total;
}

function main(): void {
  if (!existsSync(DIST)) fail("falta dist/. Correr primero: npm run build:ts");

  rmSync(BUILD, { recursive: true, force: true });
  rmSync(ZIP, { force: true });
  mkdirSync(BUILD, { recursive: true });

  copyCompiled(DIST, BUILD);
  stripModuleMarker(join(BUILD, "theme-boot.js"));
  copyStatic();
  verifyManifest();
  verifyNoRemoteCode();

  if (!existsSync(join(BUILD, "manifest.json"))) fail("manifest.json no quedo en la raiz");

  console.log(`build: paquete en build/ (${(directorySize(BUILD) / 1024).toFixed(1)} KB)`);

  if (wantsZip) {
    // -j no: hay subdirectorios. Se comprime DESDE build/ para que el manifest quede en
    // la raiz del zip y no bajo "build/".
    try {
      execFileSync(
        "powershell",
        ["-NoProfile", "-Command", `Compress-Archive -Path '${BUILD}\\*' -DestinationPath '${ZIP}' -Force`],
        { stdio: "inherit" },
      );
    } catch {
      execFileSync("zip", ["-r", "-q", ZIP, "."], { cwd: BUILD, stdio: "inherit" });
    }
    const zipKb = statSync(ZIP).size / 1024;
    console.log(`build: ZIP en build.zip (${zipKb.toFixed(1)} KB), manifest.json en la raiz`);
  }

}

main();
