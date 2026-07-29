/**
 * store-shots.ts — capturas crudas para la ficha de la tienda (1280×800).
 *
 * Produce el material de entrada que `store-compose.py` combina en los 4 assets finales
 * (oscuro, claro, opciones, efeméride). Se separa en dos pasos porque cada uno necesita una
 * herramienta distinta: esto renderiza con un navegador de verdad (Playwright, sobre el
 * paquete construido en `build/`), y el recorte/composición final es más simple con Pillow.
 *
 * `npm run store-shots` (compila y sirve `build/`, así que corre después de `npm run build`)
 */

import { mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";

const EXTENSION_DIR = resolve(import.meta.dirname, "..");
const BUILD = join(EXTENSION_DIR, "build");
const OUT_DIR = join(EXTENSION_DIR, "brand", "store-raw");
const ORIGIN = "http://mementolife.test";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
};

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  async function route(page: Awaited<ReturnType<typeof browser.newPage>>): Promise<void> {
    await page.route(`${ORIGIN}/**`, async (r) => {
      const relative = new URL(r.request().url()).pathname.replace(/^\//, "");
      try {
        const body = readFileSync(join(BUILD, relative));
        await r.fulfill({
          body,
          contentType: MIME[relative.slice(relative.lastIndexOf("."))] ?? "application/octet-stream",
        });
      } catch {
        await r.fulfill({ status: 404, body: "no encontrado" });
      }
    });
  }

  async function seed(
    page: Awaited<ReturnType<typeof browser.newPage>>,
    locale: string,
    lifeYears = 80,
  ): Promise<void> {
    await page.addInitScript(
      ({ l, y }: { l: string; y: number }) => {
        const prefs = {
          birthDate: "1990-01-01",
          lifeYears: y,
          theme: "system",
          locale: l,
          efemeride: true,
        };
        localStorage.setItem("mementolife.prefs.v1", JSON.stringify(prefs));
        (globalThis as unknown as { chrome: unknown }).chrome = {
          i18n: { getUILanguage: () => l },
          runtime: { openOptionsPage: () => undefined },
          storage: {
            local: {
              get: (key: string) => Promise.resolve({ [key]: prefs }),
              set: () => Promise.resolve(),
            },
            onChanged: { addListener: () => undefined },
          },
        };
      },
      { l: locale, y: lifeYears },
    );
  }

  // 2 de julio, 1937: la fecha del handoff, con una efeméride larga que ejercita las 3 líneas.
  const FIXED_DATE = new Date("2023-07-02T12:00:00");

  async function withFixedClock(page: Awaited<ReturnType<typeof browser.newPage>>): Promise<void> {
    await page.addInitScript((iso: string) => {
      const fixed = new Date(iso).getTime();
      const RealDate = Date;
      class FixedDate extends RealDate {
        constructor() {
          super(fixed);
        }
        static override now(): number {
          return fixed;
        }
      }
      globalThis.Date = FixedDate as unknown as DateConstructor;
    }, FIXED_DATE.toISOString());
  }

  // 1) Pantalla completa, oscuro, español.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: "dark" });
    await route(page);
    await seed(page, "es");
    await withFixedClock(page);
    await page.goto(`${ORIGIN}/newtab.html`);
    await page.waitForSelector("#canvas svg");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT_DIR, "full-dark.png") });
    await page.close();
  }

  // 2) Pantalla completa, claro, inglés.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: "light" });
    await route(page);
    await seed(page, "en");
    await withFixedClock(page);
    await page.goto(`${ORIGIN}/newtab.html`);
    await page.waitForSelector("#canvas svg");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT_DIR, "full-light.png") });
    await page.close();
  }

  // 3) El panel de opciones, real, recortado a su propio tamaño (no estirado a 1280x800:
  //    eso se compone después, sobre el fondo de la pestaña nueva).
  {
    const page = await browser.newPage({ viewport: { width: 500, height: 700 }, colorScheme: "dark" });
    await route(page);
    await seed(page, "es");
    await page.goto(`${ORIGIN}/options.html`);
    await page.waitForSelector("#form input");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.locator(".sheet").screenshot({ path: join(OUT_DIR, "options-panel.png") });
    await page.close();
  }

  await browser.close();
  console.log(`store-shots: crudos listos en ${OUT_DIR}`);
}

await main();
