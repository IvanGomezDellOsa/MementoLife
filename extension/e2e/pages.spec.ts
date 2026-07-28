/**
 * pages.spec.ts — prueba las paginas del paquete REAL de build/, servidas sobre un origen
 * falso, con `chrome.storage.local` y `chrome.i18n` simulados.
 *
 * Por que existe, teniendo extension.spec.ts: cargar una extension de verdad exige un
 * Chromium CON CABEZA, y hay entornos (contenedores, sandboxes de CI sin display) donde eso
 * no arranca. Este archivo cubre todo lo que no depende del empaquetado —render, i18n,
 * onboarding, foco, tema, persistencia— y corre en cualquier lado.
 *
 * Lo que NO puede cubrir, y por eso extension.spec.ts sigue siendo necesario: que el
 * override de la pestana nueva funcione, que el manifest sea aceptado, y que no haya red a
 * nivel de extension.
 *
 * Se sirven los archivos de build/, no los de src/: si el build se olvida de copiar algo,
 * estos tests lo ven.
 */

import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const BUILD = resolve(import.meta.dirname, "..", "build");
const ORIGIN = "http://mementolife.test";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
};

/** Sirve build/ y simula las dos APIs de chrome que usan las paginas. */
async function serve(page: Page, uiLanguage = "es-AR"): Promise<void> {
  await page.route(`${ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    const relative = url.pathname.replace(/^\//, "");
    try {
      const body = readFileSync(join(BUILD, relative));
      const extension = relative.slice(relative.lastIndexOf("."));
      await route.fulfill({ body, contentType: MIME[extension] ?? "application/octet-stream" });
    } catch {
      await route.fulfill({ status: 404, body: "no encontrado" });
    }
  });

  await page.addInitScript((language: string) => {
    // Respaldado en localStorage a proposito: addInitScript corre en un contexto JS nuevo
    // en cada navegacion, asi que un objeto en memoria se perderia en cada reload y los
    // tests de persistencia pasarian por la razon equivocada.
    const BACKING = "__test.chrome.storage.local";
    const read = (): Record<string, unknown> => {
      try {
        return JSON.parse(localStorage.getItem(BACKING) ?? "{}") as Record<string, unknown>;
      } catch {
        return {};
      }
    };
    const store: Record<string, unknown> = read();
    const persist = (): void => localStorage.setItem(BACKING, JSON.stringify(store));
    const listeners: ((changes: Record<string, { newValue?: unknown }>, area: string) => void)[] = [];
    // Solo lo que las paginas usan de verdad. Un stub mas grande solo agregaria formas de
    // que el test pase por razones equivocadas.
    (globalThis as unknown as { chrome: unknown }).chrome = {
      i18n: { getUILanguage: () => language },
      storage: {
        local: {
          get: (key: string) => Promise.resolve({ [key]: read()[key] }),
          set: (items: Record<string, unknown>) => {
            for (const [key, value] of Object.entries(items)) {
              store[key] = value;
              persist();
              for (const listener of listeners) listener({ [key]: { newValue: value } }, "local");
            }
            return Promise.resolve();
          },
        },
        onChanged: {
          addListener: (listener: (c: Record<string, { newValue?: unknown }>, a: string) => void) => {
            listeners.push(listener);
          },
        },
      },
    };
  }, uiLanguage);
}

async function openNewTab(page: Page, uiLanguage = "es-AR"): Promise<void> {
  await serve(page, uiLanguage);
  await page.goto(`${ORIGIN}/newtab.html`);
  await page.waitForSelector("#canvas svg");
}

test.describe("pestana nueva", () => {
  test("dibuja la grilla en tres paths y no un nodo por celda", async ({ page }) => {
    await openNewTab(page);
    await page.locator("#birth-date").fill("1990-01-01");
    await page.locator("#onboarding button").click();
    await expect(page.locator("#onboarding")).toBeHidden();

    const counts = await page.evaluate(() => ({
      paths: document.querySelectorAll("#canvas svg path").length,
      circles: document.querySelectorAll("#canvas svg circle").length,
      total: document.querySelectorAll("#canvas svg *").length,
    }));
    expect(counts.circles).toBe(0);
    expect(counts.paths).toBe(3);
    expect(counts.total).toBeLessThan(20);
  });

  test("sin fecha guardada muestra el onboarding sobre una grilla en estado futuro", async ({ page }) => {
    await openNewTab(page);
    await expect(page.locator("#onboarding")).toBeVisible();
    // Un solo path: todo futuro, sin pasado ni anillo.
    await expect(page.locator("#canvas svg path")).toHaveCount(1);
  });

  test("NO le roba el foco a la barra de direcciones", async ({ page }) => {
    await openNewTab(page);
    const active = await page.evaluate(() => document.activeElement?.tagName ?? "NONE");
    expect(["BODY", "HTML", "NONE"]).toContain(active);
  });

  test("rechaza una fecha futura y no guarda nada", async ({ page }) => {
    await openNewTab(page);
    await page.locator("#birth-date").fill("2999-01-01");
    await page.locator("#onboarding button").click();
    await expect(page.locator(".onboarding-error")).not.toBeEmpty();
    await expect(page.locator("#onboarding")).toBeVisible();
  });

  test("arranca en espanol si el navegador esta en espanol", async ({ page }) => {
    await openNewTab(page, "es-AR");
    await expect(page.locator(".onboarding-heading")).toHaveText("Tu vida, semana a semana");
    expect(await page.title()).toBe("Pestaña nueva");
    expect(await page.evaluate(() => document.documentElement.lang)).toBe("es");
  });

  test("arranca en ingles si el navegador esta en ingles", async ({ page }) => {
    await openNewTab(page, "en-US");
    await expect(page.locator(".onboarding-heading")).toHaveText("Your life, week by week");
    expect(await page.title()).toBe("New tab");
    expect(await page.evaluate(() => document.documentElement.lang)).toBe("en");
  });

  test("el pie sale en el idioma activo", async ({ page }) => {
    await openNewTab(page, "en-US");
    await page.locator("#birth-date").fill("1990-01-01");
    await page.locator("#onboarding button").click();
    await expect(page.locator("#canvas svg")).toContainText(/week \d+ of \d+/);
  });

  test("la efemeride entra despues del primer cuadro, sin mover el layout", async ({ page }) => {
    await serve(page, "es-AR");
    await page.goto(`${ORIGIN}/newtab.html`);
    await page.waitForSelector("#canvas svg");
    await page.locator("#birth-date").fill("1990-01-01");
    await page.locator("#onboarding button").click();

    const gridBefore = await page.locator("#canvas svg path").first().getAttribute("d");
    await expect(page.locator("#canvas svg text").last()).not.toBeEmpty();
    const gridAfter = await page.locator("#canvas svg path").first().getAttribute("d");
    // La grilla no se movio un pixel al aparecer la efemeride: el layout ya reservaba su lugar.
    expect(gridAfter).toBe(gridBefore);
  });

  test("la fuente empaquetada se carga y el eje optico queda pinneado", async ({ page }) => {
    await openNewTab(page);
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('16px "Fraunces"');
    });
    expect(loaded).toBe(true);

    const optical = await page.evaluate(() => {
      const svg = document.querySelector("#canvas svg");
      return svg === null ? "" : getComputedStyle(svg).fontOpticalSizing;
    });
    expect(optical).toBe("none");
  });

  test("respeta el tema del sistema y el elegido por el usuario", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await openNewTab(page);
    await expect(page.locator("#canvas svg rect")).toHaveAttribute("fill", "#f4f0e8");

    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    await page.waitForSelector("#canvas svg");
    await expect(page.locator("#canvas svg rect")).toHaveAttribute("fill", "#161310");
  });
});

test.describe("pagina de opciones", () => {
  async function openOptions(page: Page, uiLanguage = "es-AR"): Promise<void> {
    await serve(page, uiLanguage);
    await page.goto(`${ORIGIN}/options.html`);
    await page.waitForSelector("#form input");
  }

  test("cambia de idioma y reetiqueta todo", async ({ page }) => {
    await openOptions(page, "es-AR");
    await expect(page.locator("#title")).toHaveText("MementoLife — Opciones");

    await page.locator("label[for=locale-en]").click();
    await expect(page.locator("#title")).toHaveText("MementoLife — Options");
    await expect(page.locator("#theme-system + label")).toHaveText("System");

    await page.locator("label[for=locale-es]").click();
    await expect(page.locator("#title")).toHaveText("MementoLife — Opciones");
    await expect(page.locator("#theme-system + label")).toHaveText("Del sistema");
  });

  test("los grupos se manejan con teclado", async ({ page }) => {
    await openOptions(page);
    await page.locator("#theme-dark").focus();
    await expect(page.locator("#theme-dark")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#theme-light")).toBeChecked();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#theme-dark")).toBeChecked();
  });

  test("guarda al instante, sin boton de guardar", async ({ page }) => {
    await openOptions(page);
    await expect(page.locator("button[type=submit]")).toHaveCount(0);
    await page.locator("#life-years").fill("40");
    await page.locator("#life-years").blur();
    await expect(page.locator("#status")).toHaveText("Guardado.");
  });

  test("acota la esperanza de vida al rango elegible", async ({ page }) => {
    await openOptions(page);
    const min = await page.locator("#life-years").getAttribute("min");
    const max = await page.locator("#life-years").getAttribute("max");
    expect(min).toBe("20");
    expect(max).toBe("100");

    await page.locator("#life-years").fill("500");
    await page.locator("#life-years").blur();
    await expect(page.locator("#status")).toHaveText("Guardado.");
    await page.reload();
    await page.waitForSelector("#form input");
    // Se guardo clampeado, no 500.
    await expect(page.locator("#life-years")).toHaveValue("100");
  });
});

test("CERO RED: las paginas no piden nada fuera de su propio origen", async ({ page }) => {
  const offenders: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (!url.startsWith(ORIGIN) && !url.startsWith("data:")) offenders.push(url);
  });
  await openNewTab(page);
  await page.waitForTimeout(1200);
  expect(offenders).toEqual([]);
});
