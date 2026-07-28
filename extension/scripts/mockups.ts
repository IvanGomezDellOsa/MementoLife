/**
 * mockups.ts — exploración de diseño. NO es código de producción y no lo importa nadie
 * del paquete: compone el SVG a mano para poder salirse de los tokens y probar cosas que
 * hoy no existen.
 *
 * Se corre con `npm run mockups` y escribe en preview/mockups/.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { cellCenter, geometry, BOX_ASPECT, BOX_UNIT_UNITS } from "../dist/core/geometry.js";
import { wrapText } from "../dist/core/text.js";

const EXT = resolve(import.meta.dirname, "..");
const OUT = join(EXT, "preview", "mockups");

const W = 1920;
const H = 950;
const LIFE = 80;
const LIVED = 33.498292230504387;
const CURRENT = Math.floor(LIVED * 52);

const DATE_ES = "domingo, 2 de julio";
const STAT_PCT = "42 %";
const STAT_SUB = "semana 1742 de 4160";
const STAT_FLAT = "42 % · semana 1742 de 4160";
const EFEM =
  "2 de julio, 1937 — La aviadora Amelia Earhart desapareció sobre el océano Pacífico durante su intento de vuelo alrededor del mundo.";

interface Palette {
  readonly bg: string;
  readonly ink: string;
  /** Color de los puntos. Puede diferir de la tinta del texto. */
  readonly dot: string;
  readonly past: number;
  readonly future: number;
}

const BONE: Palette = { bg: "#161310", ink: "#eae3d4", dot: "#eae3d4", past: 0.9, future: 0.21 };
const SAND: Palette = { bg: "#161310", ink: "#eae3d4", dot: "#cdbfa4", past: 0.95, future: 0.24 };
const SAND_DEEP: Palette = { bg: "#161310", ink: "#e3dccc", dot: "#b5a68c", past: 1.0, future: 0.28 };
const AMBER: Palette = { bg: "#161310", ink: "#e6ded0", dot: "#c9a87c", past: 0.95, future: 0.26 };
/* Claro: el punto se despega de la tinta del texto igual que en oscuro. */
const SAND_LIGHT: Palette = { bg: "#f4f0e8", ink: "#2b2721", dot: "#5e5243", past: 0.9, future: 0.26 };

function circle(x: number, y: number, r: number): string {
  const rr = r.toFixed(2);
  return `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${rr} ${rr} 0 1 0 ${(2 * r).toFixed(2)} 0a${rr} ${rr} 0 1 0 ${(-2 * r).toFixed(2)} 0`;
}

/** Dibuja la grilla transpuesta en una caja, con radio y anillo parametrizables. */
function grid(
  x0: number,
  y0: number,
  heightPx: number,
  p: Palette,
  dotUnits = 1.55,
  ringUnits = 2.45,
): string {
  const g = geometry(LIFE);
  const k = heightPx / BOX_UNIT_UNITS;
  const past: string[] = [];
  const future: string[] = [];
  const ring: string[] = [];
  for (let i = 0; i < g.totalCells; i += 1) {
    const c = cellCenter(g, i);
    const x = x0 + c.alongYear * k;
    const y = y0 + c.alongUnit * k;
    if (i === CURRENT) ring.push(circle(x, y, ringUnits * k));
    else (i < CURRENT ? past : future).push(circle(x, y, dotUnits * k));
  }
  return (
    `<path d="${past.join("")}" fill="${p.dot}" opacity="${p.past}"/>` +
    `<path d="${future.join("")}" fill="${p.dot}" opacity="${p.future}"/>` +
    `<path d="${ring.join("")}" fill="none" stroke="${p.ink}" stroke-width="${(1.1 * k).toFixed(2)}"/>`
  );
}

interface TextOptions {
  readonly size: number;
  readonly weight?: number;
  readonly opacity?: number;
  readonly anchor?: "start" | "middle";
  readonly ls?: number;
  readonly fill?: string;
}

function text(x: number, y: number, content: string, o: TextOptions, p: Palette): string {
  const esc = content.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const ls = o.ls === undefined ? "" : ` letter-spacing="${o.ls}"`;
  return (
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${o.size}" font-weight="${o.weight ?? 400}" ` +
    `fill="${o.fill ?? p.ink}" opacity="${o.opacity ?? 1}" text-anchor="${o.anchor ?? "start"}"${ls}>${esc}</text>`
  );
}

function frame(inner: string, p: Palette): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Fraunces">` +
    `<rect width="${W}" height="${H}" fill="${p.bg}"/>${inner}</svg>`
  );
}

/* ── P0 · Actual, para comparar ────────────────────────────────────────────── */
function p0(p: Palette): string {
  const vM = 89.7;
  const hM = 117.3;
  const gh = H - 2 * vM;
  const gw = gh * BOX_ASPECT;
  const gx = W - hM - gw;
  const s = gh / 584;
  let out = grid(gx, vM, gh, p);
  out += text(hM, vM + 15 * s, DATE_ES, { size: 16 * s, opacity: 0.68 }, p);
  out += text(hM, vM + 105 * s, "14:27", { size: 78 * s, weight: 300 }, p);
  const lines = wrapText(EFEM, 380, 12.5 * s);
  const lh = 12.5 * s * 1.55;
  const first = vM + gh - (lines.length - 1) * lh;
  lines.forEach((l, i) => (out += text(hM, first + i * lh, l, { size: 12.5 * s, opacity: 0.48 }, p)));
  out += text(hM, first - 40 * s, STAT_FLAT, { size: 11.5 * s, opacity: 0.55, ls: 1.4 * s }, p);
  return out;
}

/* ── P1 · Sin reloj. El dato es el protagonista y la columna es UN bloque ──── */
function p1(p: Palette): string {
  const vM = 89.7;
  const hM = 117.3;
  const gh = H - 2 * vM;
  const gw = gh * BOX_ASPECT;
  const gx = W - hM - gw;
  let out = grid(gx, vM, gh, p);

  const colW = 380;
  // El bloque entero se centra contra la grilla, en vez de partirse en dos islas.
  const lines = wrapText(EFEM, colW, 13);
  const lh = 13 * 1.62;
  const blockH = 20 + 104 + 30 + 26 + 1 + 26 + lines.length * lh;
  let y = vM + (gh - blockH) / 2 + 16;

  out += text(hM, y, DATE_ES, { size: 15, opacity: 0.5, ls: 0.2 }, p);
  y += 104;
  out += text(hM, y, STAT_PCT, { size: 104, weight: 300 }, p);
  y += 30;
  out += text(hM, y, STAT_SUB, { size: 13, opacity: 0.5, ls: 1.3 }, p);
  y += 40;
  // Filete: separa el dato del contenido sin agregar una palabra.
  out += `<rect x="${hM}" y="${y.toFixed(1)}" width="${colW}" height="1" fill="${p.ink}" opacity="0.13"/>`;
  y += 34;
  lines.forEach((l, i) => (out += text(hM, y + i * lh, l, { size: 13, opacity: 0.46 }, p)));
  return out;
}

/* ── P2 · Espécimen centrado. La grilla como lámina ────────────────────────── */
function p2(p: Palette): string {
  const vM = 104;
  const topType = 54;
  const bottomType = 96;
  const gh = H - 2 * vM - topType - bottomType;
  const gw = gh * BOX_ASPECT;
  const gx = (W - gw) / 2;
  const gy = vM + topType;
  let out = grid(gx, gy, gh, p);

  const cx = W / 2;
  out += text(cx, gy - 26, DATE_ES, { size: 15, opacity: 0.5, anchor: "middle", ls: 0.2 }, p);
  out += text(cx, gy + gh + 44, STAT_FLAT, { size: 14, opacity: 0.62, anchor: "middle", ls: 1.6 }, p);
  const lines = wrapText(EFEM, 860, 12.5);
  const lh = 12.5 * 1.6;
  lines.forEach(
    (l, i) => (out += text(cx, gy + gh + 84 + i * lh, l, { size: 12.5, opacity: 0.42, anchor: "middle" }, p)),
  );
  return out;
}

/* ── P3 · A sangre. La grilla ocupa casi todo y el texto se retira a un pie ── */
function p3(p: Palette): string {
  const vM = 62;
  const bottom = 74;
  const gh = H - vM - bottom - 34;
  const gw = gh * BOX_ASPECT;
  const gx = (W - gw) / 2;
  let out = grid(gx, vM, gh, p);

  const baseline = H - 40;
  out += text(gx, baseline, DATE_ES, { size: 13.5, opacity: 0.46 }, p);
  out += text(gx + gw, baseline, STAT_FLAT, { size: 13.5, opacity: 0.62, anchor: "middle", ls: 1.4 }, p);
  return out;
}

/* ── F2 · Igual que P1 pero conservando el reloj como dato terciario ───────── */
function withClock(p: Palette): string {
  const vM = 89.7;
  const hM = 117.3;
  const gh = H - 2 * vM;
  const gw = gh * BOX_ASPECT;
  const gx = W - hM - gw;
  let out = grid(gx, vM, gh, p);
  const colW = 380;
  const lines = wrapText(EFEM, colW, 13);
  const lh = 13 * 1.62;
  const blockH = 20 + 104 + 30 + 26 + 1 + 26 + lines.length * lh;
  let y = vM + (gh - blockH) / 2 + 16;
  // Fecha y hora en la MISMA linea: la hora deja de ser un titular y pasa a ser un dato.
  out += text(hM, y, DATE_ES, { size: 15, opacity: 0.5, ls: 0.2 }, p);
  out += text(hM + colW, y, "14:27", { size: 15, opacity: 0.5, anchor: "middle", ls: 0.4 }, p);
  y += 104;
  out += text(hM, y, STAT_PCT, { size: 104, weight: 300 }, p);
  y += 30;
  out += text(hM, y, STAT_SUB, { size: 13, opacity: 0.5, ls: 1.3 }, p);
  y += 40;
  out += `<rect x="${hM}" y="${y.toFixed(1)}" width="${colW}" height="1" fill="${p.ink}" opacity="0.13"/>`;
  y += 34;
  lines.forEach((l, i) => (out += text(hM, y + i * lh, l, { size: 13, opacity: 0.46 }, p)));
  return out;
}

/* ── P4 · Editorial con la grilla mas aireada todavia (punto 1.35) ─────────── */
function p4(p: Palette): string {
  const vM = 89.7;
  const hM = 117.3;
  const gh = H - 2 * vM;
  const gw = gh * BOX_ASPECT;
  const gx = W - hM - gw;
  let out = grid(gx, vM, gh, p, 1.35, 2.3);

  const colW = 380;
  const lines = wrapText(EFEM, colW, 13);
  const lh = 13 * 1.62;
  const blockH = 20 + 104 + 30 + 26 + 1 + 26 + lines.length * lh;
  let y = vM + (gh - blockH) / 2 + 16;
  out += text(hM, y, DATE_ES, { size: 15, opacity: 0.5, ls: 0.2 }, p);
  y += 104;
  out += text(hM, y, STAT_PCT, { size: 104, weight: 300 }, p);
  y += 30;
  out += text(hM, y, STAT_SUB, { size: 13, opacity: 0.5, ls: 1.3 }, p);
  y += 40;
  out += `<rect x="${hM}" y="${y.toFixed(1)}" width="${colW}" height="1" fill="${p.ink}" opacity="0.13"/>`;
  y += 34;
  lines.forEach((l, i) => (out += text(hM, y + i * lh, l, { size: 13, opacity: 0.46 }, p)));
  return out;
}


/* ══════════════════════════════════════════════════════════════════════════════
 * RONDA 2 — geometria dirigida por la CELDA, no por la caja.
 *
 * Hoy la caja mide 466x326 unidades fijas y el tamano de celda sale de ahi. Eso hace dos
 * cosas malas: en apaisado las celdas quedan mas angostas que altas (12,94 x 14,82 px), y
 * con lifeYears bajo se estiran hasta parecer rayas.
 *
 * Aca se invierte: se elige el tamano de celda y la caja es la consecuencia. La celda sale
 * cuadrada, que es lo que da mas aire horizontal —justo donde hoy falta— y de paso usa el
 * espacio libre que quedaba entre la columna y la grilla.
 * ══════════════════════════════════════════════════════════════════════════════ */

interface CellOptions {
  /** Ancho de celda / alto de celda. 1 = cuadrada. */
  readonly cellAspect: number;
  /** Diametro del punto como fraccion del paso. 0,494 es el ratio actual. */
  readonly dotRatio: number;
  /** Cada cuantos anios entra una banda de aire. */
  readonly bandEvery: number;
  /** Banda como fraccion del paso horizontal. */
  readonly bandRatio: number;
}

function cellGrid(
  availX: number,
  availY: number,
  availW: number,
  availH: number,
  p: Palette,
  o: CellOptions,
): { svg: string; width: number; height: number; pitch: number; gap: number } {
  const rows = 52;
  const cols = LIFE;
  const bands = Math.floor((cols - 1) / o.bandEvery);

  let vp = availH / rows;
  let hp = vp * o.cellAspect;
  let width = cols * hp + bands * hp * o.bandRatio;
  if (width > availW) {
    const scale = availW / width;
    vp *= scale;
    hp *= scale;
    width = availW;
  }
  const band = hp * o.bandRatio;
  const height = rows * vp;
  const r = (hp * o.dotRatio) / 2;
  const x0 = availX;
  const y0 = availY + (availH - height) / 2;

  const past: string[] = [];
  const future: string[] = [];
  const ring: string[] = [];
  for (let i = 0; i < cols * rows; i += 1) {
    const year = Math.floor(i / rows);
    const week = i % rows;
    const x = x0 + year * hp + Math.floor(year / o.bandEvery) * band + hp / 2;
    const y = y0 + week * vp + vp / 2;
    if (i === CURRENT) ring.push(circle(x, y, r * 1.58));
    else (i < CURRENT ? past : future).push(circle(x, y, r));
  }
  return {
    svg:
      `<path d="${past.join("")}" fill="${p.dot}" opacity="${p.past}"/>` +
      `<path d="${future.join("")}" fill="${p.dot}" opacity="${p.future}"/>` +
      `<path d="${ring.join("")}" fill="none" stroke="${p.ink}" stroke-width="${(r * 0.72).toFixed(2)}"/>`,
    width,
    height,
    pitch: hp,
    gap: hp - 2 * r,
  };
}

/** Composicion editorial aprobada + geometria de celda. */
function editorial(p: Palette, o: CellOptions): string {
  const vM = 89.7;
  const hM = 117.3;
  const colW = 380;
  const gutter = 92;
  const availH = H - 2 * vM;
  const availW = W - 2 * hM - colW - gutter;
  const g = cellGrid(hM + colW + gutter, vM, availW, availH, p, o);

  let out = g.svg;
  const lines = wrapText(EFEM, colW, 13);
  const lh = 13 * 1.62;
  const blockH = 20 + 104 + 30 + 26 + 1 + 26 + lines.length * lh;
  let y = vM + (availH - blockH) / 2 + 16;
  out += text(hM, y, DATE_ES, { size: 15, opacity: 0.5, ls: 0.2 }, p);
  y += 104;
  out += text(hM, y, STAT_PCT, { size: 104, weight: 300 }, p);
  y += 30;
  out += text(hM, y, STAT_SUB, { size: 13, opacity: 0.5, ls: 1.3 }, p);
  y += 40;
  out += `<rect x="${hM}" y="${y.toFixed(1)}" width="${colW}" height="1" fill="${p.ink}" opacity="0.13"/>`;
  y += 34;
  lines.forEach((l, i) => (out += text(hM, y + i * lh, l, { size: 13, opacity: 0.46 }, p)));
  console.log(
    `    paso ${g.pitch.toFixed(2)} px · hueco ${g.gap.toFixed(2)} px · caja ${g.width.toFixed(0)}x${g.height.toFixed(0)}`,
  );
  return out;
}

const CUADRADA: CellOptions = { cellAspect: 1, dotRatio: 0.494, bandEvery: 10, bandRatio: 0.73 };
const CUADRADA_AIRE: CellOptions = { cellAspect: 1, dotRatio: 0.44, bandEvery: 10, bandRatio: 0.8 };
const LUSTRO: CellOptions = { cellAspect: 1, dotRatio: 0.46, bandEvery: 5, bandRatio: 0.62 };

const FONDO_CALIDO: Palette = { bg: "#161310", ink: "#eae3d4", dot: "#cdbfa4", past: 0.95, future: 0.24 };
const FONDO_PROFUNDO: Palette = { bg: "#121110", ink: "#ece5d8", dot: "#cdbfa4", past: 0.95, future: 0.26 };
const FONDO_NEUTRO: Palette = { bg: "#0f0e0d", ink: "#ece5d8", dot: "#cfc1a6", past: 0.95, future: 0.27 };
const FONDO_FRIO: Palette = { bg: "#0d0d0f", ink: "#e8e6e0", dot: "#bfb6a4", past: 0.95, future: 0.27 };

const VARIANTS: readonly { name: string; svg: string }[] = [
  { name: "P0-actual", svg: frame(p0(BONE), BONE) },
  { name: "P1-editorial-sin-reloj", svg: frame(p1(BONE), BONE) },
  { name: "P2-especimen-centrado", svg: frame(p2(BONE), BONE) },
  { name: "P3-a-sangre", svg: frame(p3(BONE), BONE) },
  { name: "P4-editorial-mas-aire", svg: frame(p4(BONE), BONE) },
  { name: "C1-editorial-arena", svg: frame(p1(SAND), SAND) },
  { name: "C2-editorial-arena-media", svg: frame(p1(SAND_DEEP), SAND_DEEP) },
  { name: "C3-editorial-ambar", svg: frame(p1(AMBER), AMBER) },
  { name: "F1-PROPUESTA-dark", svg: frame(p1(SAND), SAND) },
  { name: "F2-PROPUESTA-con-reloj", svg: frame(withClock(SAND), SAND) },
  { name: "F3-PROPUESTA-light", svg: frame(p1(SAND_LIGHT), SAND_LIGHT) },

  // Ronda 2
  { name: "G1-celda-cuadrada", svg: frame(editorial(FONDO_CALIDO, CUADRADA), FONDO_CALIDO) },
  { name: "G2-celda-cuadrada-mas-aire", svg: frame(editorial(FONDO_CALIDO, CUADRADA_AIRE), FONDO_CALIDO) },
  { name: "G3-banda-cada-5", svg: frame(editorial(FONDO_CALIDO, LUSTRO), FONDO_CALIDO) },
  { name: "H1-fondo-calido-actual", svg: frame(editorial(FONDO_CALIDO, CUADRADA_AIRE), FONDO_CALIDO) },
  { name: "H2-fondo-profundo", svg: frame(editorial(FONDO_PROFUNDO, CUADRADA_AIRE), FONDO_PROFUNDO) },
  { name: "H3-fondo-casi-neutro", svg: frame(editorial(FONDO_NEUTRO, CUADRADA_AIRE), FONDO_NEUTRO) },
  { name: "H4-fondo-frio", svg: frame(editorial(FONDO_FRIO, CUADRADA_AIRE), FONDO_FRIO) },
];

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const font = readFileSync(join(EXT, "assets", "fonts", "Fraunces-subset.woff2")).toString("base64");
  const browser = await chromium.launch();

  for (const variant of VARIANTS) {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await page.setContent(
      `<!DOCTYPE html><html><head><style>
       @font-face{font-family:"Fraunces";src:url("data:font/woff2;base64,${font}") format("woff2");font-weight:300 400;font-display:block}
       html,body{margin:0;height:100%;overflow:hidden}
       svg{display:block;width:100vw;height:100vh;font-optical-sizing:none}
       </style></head><body>${variant.svg}</body></html>`,
      { waitUntil: "load" },
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(OUT, `${variant.name}.png`) });
    await page.close();
    writeFileSync(join(OUT, `${variant.name}.svg`), variant.svg, "utf8");
  }

  await browser.close();
  console.log(`mockups: ${VARIANTS.length} variantes -> preview/mockups/`);
}

await main();
