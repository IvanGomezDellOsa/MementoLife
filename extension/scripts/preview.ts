/**
 * preview.ts — genera preview/index.html, una pagina estatica con las 4 variantes y una
 * bateria de viewports reales, para comparar a ojo contra landscape-options.html.
 *
 * La pagina es autocontenida: la fuente va embebida como data URI, asi que se abre con
 * doble clic (file://) y no pide nada por red. Es el mismo principio que la extension.
 *
 * Se corre con `npm run preview` (compila primero, porque importa desde dist/).
 */

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { render } from "../dist/core/render.js";
import { efemerideFor } from "../dist/core/efemerides.js";
import { EFEMERIDES as ES } from "../dist/data/efemerides.es.js";
import { EFEMERIDES as EN } from "../dist/data/efemerides.en.js";
import type { Locale, Theme } from "../dist/core/tokens.js";

const EXTENSION_DIR = resolve(import.meta.dirname, "..");
const OUT_DIR = join(EXTENSION_DIR, "preview");

const TODAY = { year: 2023, month: 7, day: 2 };
const BIRTH = { year: 1990, month: 1, day: 1 };

interface Card {
  readonly title: string;
  readonly subtitle: string;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly theme: Theme;
  readonly locale: Locale;
  readonly lifeYears: number;
  readonly efemeride: boolean;
}

/** Las 2 variantes que quedan (dark/light), en el lienzo de referencia. */
const VARIANTS: readonly Card[] = [
  { title: "Dark · ES", subtitle: "lienzo de referencia 1440x720", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { title: "Light · ES", subtitle: "", widthPx: 1440, heightPx: 720, theme: "light", locale: "es", lifeYears: 80, efemeride: true },
  { title: "Dark · EN", subtitle: "", widthPx: 1440, heightPx: 720, theme: "dark", locale: "en", lifeYears: 80, efemeride: true },
  { title: "Light · EN", subtitle: "", widthPx: 1440, heightPx: 720, theme: "light", locale: "en", lifeYears: 80, efemeride: true },
];

/** Viewports reales, que es donde se decide si el responsive sirve o no. */
const VIEWPORTS: readonly Card[] = [
  { title: "1920 x 950", subtitle: "monitor FHD, ventana maximizada", widthPx: 1920, heightPx: 950, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { title: "1536 x 730", subtitle: "portatil 1080p con Windows al 125 %", widthPx: 1536, heightPx: 730, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { title: "1366 x 640", subtitle: "portatil comun", widthPx: 1366, heightPx: 640, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { title: "1280 x 720", subtitle: "el caso que el plan mandaba a composicion A", widthPx: 1280, heightPx: 720, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { title: "2560 x 1300", subtitle: "monitor QHD", widthPx: 2560, heightPx: 1300, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { title: "1180 x 820", subtitle: "tablet apaisada", widthPx: 1180, heightPx: 820, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { title: "810 x 1080", subtitle: "tablet vertical — composicion A", widthPx: 810, heightPx: 1080, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { title: "768 x 1024", subtitle: "tablet vertical chica — composicion A", widthPx: 768, heightPx: 1024, theme: "light", locale: "en", lifeYears: 80, efemeride: true },
  { title: "1440 x 400", subtitle: "ventana baja — se oculta la efemeride", widthPx: 1440, heightPx: 400, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
];

/** Todo el rango de esperanza de vida, que es donde la banda de decada se pone a prueba. */
const EDGES: readonly Card[] = [
  { title: "lifeYears = 20", subtitle: "minimo del rango nuevo, para mirar a corto plazo", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 20, efemeride: true },
  { title: "lifeYears = 30", subtitle: "", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 30, efemeride: true },
  { title: "lifeYears = 40", subtitle: "el caso donde la banda fija desaparecia", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 40, efemeride: true },
  { title: "lifeYears = 60", subtitle: "", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 60, efemeride: true },
  { title: "lifeYears = 100", subtitle: "maximo: el paso mas comprimido", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 100, efemeride: true },
  { title: "Sin efemeride", subtitle: "el pie se ancla al borde inferior y nada mas se mueve", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 80, efemeride: false },
  { title: "Onboarding", subtitle: "sin fecha de nacimiento: grilla entera en estado futuro", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
];

function cardHtml(card: Card, onboarding = false): string {
  const result = render({
    theme: card.theme,
    locale: card.locale,
    lifeYears: card.lifeYears,
    birthDate: onboarding ? null : BIRTH,
    today: TODAY,
    hour: 7,
    minute: 41,
    efemerideText: card.efemeride ? efemerideFor(card.locale === "es" ? ES : EN, TODAY) : null,
    viewport: { widthPx: card.widthPx, heightPx: card.heightPx },
  });
  const g = result.layout.grid;
  const meta =
    `composicion ${result.layout.composition} · caja ${g.widthPx.toFixed(0)}x${g.heightPx.toFixed(0)} · ` +
    `k = ${g.k.toFixed(3)} · r punto = ${result.dotRadius.toFixed(2)} px · ` +
    `${(result.svg.match(/<(rect|path|text)\b/g) ?? []).length} nodos SVG`;

  return `<figure class="card">
  <figcaption><b>${card.title}</b>${card.subtitle ? ` — ${card.subtitle}` : ""}</figcaption>
  <div class="frame" style="aspect-ratio:${card.widthPx}/${card.heightPx}">${result.svg}</div>
  <p class="meta">${meta}</p>
</figure>`;
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  const fontBase64 = readFileSync(join(EXTENSION_DIR, "assets", "fonts", "Fraunces-subset.woff2")).toString("base64");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>MementoLife — revision visual del motor de render</title>
<style>
  @font-face {
    font-family: "Fraunces";
    src: url("data:font/woff2;base64,${fontBase64}") format("woff2");
    font-weight: 300 400;
    font-display: block;
  }
  /* El eje opsz se instancio fuera del archivo, pero se pinea igual: cuesta cero y deja
     el comportamiento explicito. */
  svg { font-optical-sizing: none; }

  :root { --ui: system-ui, -apple-system, "Segoe UI", sans-serif; }
  body { margin: 0; background: #d9d6ce; color: #2b2721; font-family: var(--ui); padding: 28px 32px 64px; }
  h1 { font: 600 16px var(--ui); margin: 0 0 6px; }
  h2 { font: 600 13px var(--ui); margin: 34px 0 10px; text-transform: uppercase; letter-spacing: .07em; color: #5b544a; border-bottom: 1px solid #bdb8ad; padding-bottom: 6px; }
  p.sub { font: 400 12.5px/1.55 var(--ui); color: #5b544a; margin: 0 0 8px; max-width: 820px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(520px, 1fr)); gap: 22px; }
  .card { margin: 0; }
  figcaption { font: 500 12px var(--ui); color: #2b2721; margin-bottom: 6px; }
  .frame { width: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 3px 14px rgba(0,0,0,.18); }
  .frame svg { display: block; width: 100%; height: 100%; }
  .meta { font: 400 11px/1.5 ui-monospace, monospace; color: #6b6459; margin: 7px 0 0; }
</style>
</head>
<body>
<h1>MementoLife — revision visual del motor de render (E1)</h1>
<p class="sub">Generado por <code>scripts/preview.ts</code> desde el mismo core que usa la extension.
Comparar contra <code>docs/design-handoff/landscape-options.html</code>, opcion B.
La fuente va embebida: la pagina no pide nada por red.</p>

<h2>Las 2 variantes (dark / light) en los 2 idiomas — 1440 x 720</h2>
<div class="grid">
${VARIANTS.map((card) => cardHtml(card)).join("\n")}
</div>

<h2>Viewports reales</h2>
<p class="sub">Composicion B degrada encogiendo la grilla en vez de saltar a A. A toma el relevo solo
cuando la grilla bajaria del 62 % del alto disponible, que en la practica son las tablets en vertical.</p>
<div class="grid">
${VIEWPORTS.map((card) => cardHtml(card)).join("\n")}
</div>

<h2>Rango de esperanza de vida y estados</h2>
<p class="sub">La banda de decada es proporcional al paso del eje de anios, asi que se lee igual de bien
en todo el rango. Con banda fija, de 40 para abajo dejaba de poder contarse.</p>
<div class="grid">
${EDGES.map((card, index) => cardHtml(card, index === EDGES.length - 1)).join("\n")}
</div>
</body>
</html>
`;

  const outFile = join(OUT_DIR, "index.html");
  writeFileSync(outFile, html, "utf8");
  console.log(`preview: ${VARIANTS.length + VIEWPORTS.length + EDGES.length} tarjetas -> ${outFile}`);
}

main();
