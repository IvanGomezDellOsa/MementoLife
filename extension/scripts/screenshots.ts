/**
 * screenshots.ts — captura PNG del render a viewport REAL (no escalado).
 *
 * Es lo que hace falta para juzgar el diseno de verdad: la pagina de preview muestra las
 * tarjetas encogidas dentro de una grilla, y a esa escala un punto de 3,4 px se ve como no
 * se va a ver nunca. Aca cada captura sale al tamano exacto del viewport que dice.
 *
 * Sirve para dos cosas: el gate visual de E1 y, con --store, las capturas 1280x800 que
 * pide la ficha de la tienda (RESTRICCIONES-CHROME-WEB-STORE.md 4.12).
 *
 * `npm run shots`
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { render } from "../dist/core/render.js";
import { efemerideFor } from "../dist/core/efemerides.js";
import { EFEMERIDES as ES } from "../dist/data/efemerides.es.js";
import { EFEMERIDES as EN } from "../dist/data/efemerides.en.js";
import type { Locale, Theme } from "../dist/core/tokens.js";

const EXTENSION_DIR = resolve(import.meta.dirname, "..");
const OUT_DIR = join(EXTENSION_DIR, "preview", "shots");

const TODAY = { year: 2023, month: 7, day: 2 };
const BIRTH = { year: 1990, month: 1, day: 1 };

interface Shot {
  readonly name: string;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly theme: Theme;
  readonly locale: Locale;
  readonly lifeYears: number;
  readonly efemeride: boolean;
  readonly onboarding?: boolean;
}

const SHOTS: readonly Shot[] = [
  // Las 2 variantes que quedan: dark y light. La vista de meses se elimino.
  { name: "variante-dark", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { name: "variante-light", widthPx: 1440, heightPx: 720, theme: "light", locale: "es", lifeYears: 80, efemeride: true },
  { name: "variante-dark-en", widthPx: 1440, heightPx: 720, theme: "dark", locale: "en", lifeYears: 80, efemeride: true },
  { name: "variante-light-en", widthPx: 1440, heightPx: 720, theme: "light", locale: "en", lifeYears: 80, efemeride: true },

  // Los tres tamanos que pide la revision de diseno.
  { name: "real-1280x720", widthPx: 1280, heightPx: 720, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { name: "real-1920x950", widthPx: 1920, heightPx: 950, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { name: "real-2560x1300", widthPx: 2560, heightPx: 1300, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },

  // Portatil con zoom del sistema y tablets.
  { name: "real-1536x730-win125", widthPx: 1536, heightPx: 730, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { name: "real-1366x640", widthPx: 1366, heightPx: 640, theme: "light", locale: "es", lifeYears: 80, efemeride: true },
  { name: "tablet-810x1080-compA", widthPx: 810, heightPx: 1080, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { name: "tablet-768x1024-compA", widthPx: 768, heightPx: 1024, theme: "light", locale: "en", lifeYears: 80, efemeride: true },


  // Extremos y estados.
  { name: "rango-lifeYears-20", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 20, efemeride: true },
  { name: "rango-lifeYears-30", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 30, efemeride: true },
  { name: "rango-lifeYears-40", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 40, efemeride: true },
  { name: "rango-lifeYears-60", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 60, efemeride: true },
  { name: "rango-lifeYears-100", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 100, efemeride: true },
  { name: "rango-lifeYears-20-light", widthPx: 1440, heightPx: 720, theme: "light", locale: "es", lifeYears: 20, efemeride: true },
  { name: "estado-sin-efemeride", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 80, efemeride: false },
  { name: "estado-onboarding", widthPx: 1440, heightPx: 720, theme: "dark", locale: "es", lifeYears: 80, efemeride: true, onboarding: true },
  { name: "estado-ventana-baja", widthPx: 1440, heightPx: 400, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },

  // Ficha de la tienda: 1280x800 exacto.
  { name: "store-1280x800-es", widthPx: 1280, heightPx: 800, theme: "dark", locale: "es", lifeYears: 80, efemeride: true },
  { name: "store-1280x800-en", widthPx: 1280, heightPx: 800, theme: "light", locale: "en", lifeYears: 80, efemeride: true },
];

function pageHtml(shot: Shot, fontBase64: string): string {
  const result = render({
    theme: shot.theme,
    locale: shot.locale,
    lifeYears: shot.lifeYears,
    birthDate: shot.onboarding === true ? null : BIRTH,
    today: TODAY,
    hour: 7,
    minute: 41,
    efemerideText: shot.efemeride ? efemerideFor(shot.locale === "es" ? ES : EN, TODAY) : null,
    viewport: { widthPx: shot.widthPx, heightPx: shot.heightPx },
  });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face{font-family:"Fraunces";src:url("data:font/woff2;base64,${fontBase64}") format("woff2");font-weight:300 400;font-display:block}
html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden}
svg{display:block;width:100vw;height:100vh;font-optical-sizing:none}
</style></head><body>${result.svg}</body></html>`;
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const fontBase64 = readFileSync(join(EXTENSION_DIR, "assets", "fonts", "Fraunces-subset.woff2")).toString("base64");

  const browser = await chromium.launch();
  const summary: string[] = [];

  for (const shot of SHOTS) {
    const page = await browser.newPage({
      viewport: { width: shot.widthPx, height: shot.heightPx },
      deviceScaleFactor: 1,
    });
    const html = pageHtml(shot, fontBase64);
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const file = join(OUT_DIR, `${shot.name}.png`);
    await page.screenshot({ path: file });
    await page.close();
    summary.push(`${shot.name} (${shot.widthPx}x${shot.heightPx})`);
  }

  await browser.close();
  writeFileSync(join(OUT_DIR, "INDEX.txt"), summary.join("\n"), "utf8");
  console.log(`screenshots: ${SHOTS.length} capturas -> ${OUT_DIR}`);
}

await main();
