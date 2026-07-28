/**
 * visual.spec.ts — comparacion de PNG contra goldens, con pixelmatch.
 *
 * Es la capa (a) del plan 8.3, y es DELIBERADAMENTE la mas debil de las tres. El gate real
 * de fidelidad son los snapshots de tests/snapshots/: son texto, salen identicos en
 * cualquier sistema operativo y no tienen umbrales. Esta capa agrega lo unico que el texto
 * no puede dar — que el navegador rasterice lo que uno cree — a cambio de ser sensible al
 * antialiasing y al motor de fuentes.
 *
 * Por eso los goldens se generan SOLO en Linux (plan 10.5): un PNG hecho en Windows y
 * comparado en el runner de CI difiere por el rasterizador, no por el diseno, y eso
 * convierte el test en ruido. En cualquier otra plataforma la suite se salta sola.
 *
 * Para generar o actualizar los goldens, en Linux:
 *   npm run build && UPDATE_GOLDEN=1 npx playwright test e2e/visual.spec.ts
 */

import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const BUILD = resolve(import.meta.dirname, "..", "build");
const GOLDEN_DIR = join(import.meta.dirname, "golden");
const ORIGIN = "http://mementolife.test";

/** Umbral del plan 8.3: menos del 0,5 % de pixeles distintos. */
const MAX_DIFF_FRACTION = 0.005;

const UPDATE = process.env["UPDATE_GOLDEN"] === "1";

interface Case {
  readonly name: string;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly locale: "es" | "en";
  readonly scheme: "dark" | "light";
  readonly lifeYears: number;
}

/** Pocos casos y bien elegidos: cada uno cubre un camino distinto del layout. */
const CASES: readonly Case[] = [
  { name: "referencia-dark-es", widthPx: 1440, heightPx: 720, locale: "es", scheme: "dark", lifeYears: 80 },
  { name: "referencia-light-en", widthPx: 1440, heightPx: 720, locale: "en", scheme: "light", lifeYears: 80 },
  { name: "b-encogida-1280x720", widthPx: 1280, heightPx: 720, locale: "es", scheme: "dark", lifeYears: 80 },
  { name: "composicion-a-810x1080", widthPx: 810, heightPx: 1080, locale: "es", scheme: "dark", lifeYears: 80 },
  { name: "ventana-baja-1440x400", widthPx: 1440, heightPx: 400, locale: "es", scheme: "dark", lifeYears: 80 },
  { name: "lifeyears-20", widthPx: 1440, heightPx: 720, locale: "es", scheme: "dark", lifeYears: 20 },
  { name: "lifeyears-100", widthPx: 1440, heightPx: 720, locale: "es", scheme: "dark", lifeYears: 100 },
];

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
};

async function prepare(page: Page, testCase: Case): Promise<void> {
  await page.route(`${ORIGIN}/**`, async (route) => {
    const relative = new URL(route.request().url()).pathname.replace(/^\//, "");
    try {
      await route.fulfill({
        body: readFileSync(join(BUILD, relative)),
        contentType: MIME[relative.slice(relative.lastIndexOf("."))] ?? "application/octet-stream",
      });
    } catch {
      await route.fulfill({ status: 404, body: "no encontrado" });
    }
  });

  // Preferencias fijas y fecha congelada: sin esto el reloj y la efemeride cambiarian el
  // PNG en cada corrida y el golden no serviria de nada.
  await page.addInitScript(
    (config: { locale: string; lifeYears: number }) => {
      const prefs = {
        birthDate: "1990-01-01",
        lifeYears: config.lifeYears,
        theme: "system",
        locale: config.locale,
        efemeride: true,
      };
      localStorage.setItem("mementolife.prefs.v1", JSON.stringify(prefs));
      (globalThis as unknown as { chrome: unknown }).chrome = {
        i18n: { getUILanguage: () => config.locale },
        storage: {
          local: {
            get: (key: string) => Promise.resolve({ [key]: prefs }),
            set: () => Promise.resolve(),
          },
          onChanged: { addListener: () => undefined },
        },
      };
      // Reloj congelado en la hora del handoff.
      const Fixed = class extends Date {
        constructor(...args: unknown[]) {
          if (args.length === 0) super("2023-07-02T07:41:00");
          else super(...(args as []));
        }
        static override now(): number {
          return new Date("2023-07-02T07:41:00").getTime();
        }
      };
      globalThis.Date = Fixed as unknown as DateConstructor;
    },
    { locale: testCase.locale, lifeYears: testCase.lifeYears },
  );
}

test.describe("goldens PNG", () => {
  test.skip(
    process.platform !== "linux",
    "los goldens se generan y comparan solo en Linux: en otra plataforma el rasterizador " +
      "produce diferencias que no son de diseno (plan 10.5)",
  );

  for (const testCase of CASES) {
    test(testCase.name, async ({ page }) => {
      await page.setViewportSize({ width: testCase.widthPx, height: testCase.heightPx });
      await page.emulateMedia({ colorScheme: testCase.scheme });
      await prepare(page, testCase);

      await page.goto(`${ORIGIN}/newtab.html`);
      await page.waitForSelector("#canvas svg");
      await page.evaluate(() => document.fonts.ready);
      // Margen para que entre la efemeride del import() dinamico.
      await page.waitForTimeout(600);

      const actual = await page.screenshot();
      const goldenPath = join(GOLDEN_DIR, `${testCase.name}.png`);

      if (UPDATE || !existsSync(goldenPath)) {
        mkdirSync(GOLDEN_DIR, { recursive: true });
        writeFileSync(goldenPath, actual);
        test.info().annotations.push({
          type: "golden",
          description: `escrito ${testCase.name}.png — revisarlo a ojo antes de commitear`,
        });
        return;
      }

      const expected = PNG.sync.read(readFileSync(goldenPath));
      const current = PNG.sync.read(actual);
      expect(
        { width: current.width, height: current.height },
        "el golden tiene otro tamano: regenerarlo",
      ).toEqual({ width: expected.width, height: expected.height });

      const diff = new PNG({ width: expected.width, height: expected.height });
      const differing = pixelmatch(
        expected.data,
        current.data,
        diff.data,
        expected.width,
        expected.height,
        { threshold: 0.1 },
      );
      const fraction = differing / (expected.width * expected.height);

      if (fraction > MAX_DIFF_FRACTION) {
        const diffPath = join(GOLDEN_DIR, `${testCase.name}.diff.png`);
        writeFileSync(diffPath, PNG.sync.write(diff));
        await test.info().attach("diff", { path: diffPath, contentType: "image/png" });
      }

      expect(
        fraction,
        `${(fraction * 100).toFixed(3)} % de pixeles distintos (maximo ${MAX_DIFF_FRACTION * 100} %)`,
      ).toBeLessThanOrEqual(MAX_DIFF_FRACTION);
    });
  }
});
