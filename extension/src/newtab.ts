/**
 * newtab.ts — la pestana nueva.
 *
 * Objetivo duro: first contentful paint por debajo de 50 ms, verificado en CI. Todo lo que
 * sigue esta ordenado por eso.
 *
 * ARRANQUE EN DOS PASOS (plan 6.2):
 *
 *   1. Sincrono, sin esperar nada: se lee la cache de preferencias de localStorage y se
 *      dibuja la grilla, el reloj, la fecha y el pie. Los tokens entran por import estatico,
 *      asi que en este punto no hay ninguna espera.
 *   2. Despues: la efemeride, por import() dinamico del modulo del idioma activo (~45 KB
 *      desde disco). Es el elemento de menor prioridad visual, asi que no bloquea nada — y
 *      como el layout reserva su lugar desde el primer cuadro, al aparecer no mueve nada.
 *
 * En paralelo se resuelve chrome.storage.local, que es la fuente de verdad, y si difiere de
 * la cache se redibuja.
 */

import { render } from "./core/render.js";
import type { RenderResult } from "./core/render.js";
import { efemerideFor } from "./core/efemerides.js";
import { t } from "./core/i18n.js";
import type { Locale } from "./core/tokens.js";
import { load, onChanged, parseBirthDate, readCache, resolveTheme, save } from "./prefs.js";
import type { Prefs } from "./prefs.js";
import { mount as mountOnboarding, position as positionOnboarding } from "./onboarding.js";
import { requireElement } from "./dom.js";

const canvas = requireElement("canvas");
const onboardingEl = requireElement("onboarding");
const settingsButton = requireElement("settings");

/** Tablas de efemerides ya cargadas, por idioma. El import() se hace una sola vez. */
const tables = new Map<Locale, readonly string[]>();

let prefs: Prefs = readCache();
let lastRenderedDay = "";

/** Fecha LOCAL. El core no lee el reloj: se le pasa como parametro. */
function today(): { year: number; month: number; day: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

function draw(): RenderResult {
  const now = today();
  const theme = resolveTheme(prefs.theme);
  const birthDate = parseBirthDate(prefs.birthDate);
  const table = tables.get(prefs.locale);

  const efemerideText =
    prefs.efemeride && table !== undefined ? efemerideFor(table, now) : null;

  const result = render({
    theme,
    locale: prefs.locale,
    lifeYears: prefs.lifeYears,
    birthDate,
    today: now,
    efemerideText,
    viewport: { widthPx: window.innerWidth, heightPx: window.innerHeight },
  });

  canvas.innerHTML = result.svg;
  document.documentElement.dataset["theme"] = theme;
  document.title = t(prefs.locale, "newTabTitle");
  document.documentElement.lang = prefs.locale;
  settingsButton.title = t(prefs.locale, "openOptions");
  settingsButton.setAttribute("aria-label", t(prefs.locale, "openOptions"));
  lastRenderedDay = `${now.year}-${now.month}-${now.day}`;

  if (birthDate === null) {
    onboardingEl.hidden = false;
    mountOnboarding(onboardingEl, prefs.locale, {
      onSubmit: (value) => {
        prefs = { ...prefs, birthDate: value };
        draw();
        void save({ birthDate: value });
      },
    });
    positionOnboarding(onboardingEl, result.layout);
  } else {
    onboardingEl.hidden = true;
  }

  return result;
}

/** Un import() dinamico por idioma: rutas literales, para que el bundler-menos build igual pueda resolverlas. */
const EFEMERIDES_IMPORTS: { readonly [K in Locale]: () => Promise<{ EFEMERIDES: readonly string[] }> } = {
  es: () => import("./data/efemerides.es.js"),
  en: () => import("./data/efemerides.en.js"),
  fr: () => import("./data/efemerides.fr.js"),
  pt: () => import("./data/efemerides.pt.js"),
  it: () => import("./data/efemerides.it.js"),
  de: () => import("./data/efemerides.de.js"),
};

/** Carga la tabla del idioma activo y redibuja. Es el paso 2 del arranque. */
async function loadEfemerides(locale: Locale): Promise<void> {
  if (!prefs.efemeride || tables.has(locale)) return;
  const module = await EFEMERIDES_IMPORTS[locale]();
  tables.set(locale, module.EFEMERIDES);
  if (prefs.locale === locale) draw();
}

/**
 * Sin reloj en pantalla ya no hace falta un tick por minuto para redibujar digitos, pero si
 * hay que detectar el cruce de medianoche: cambia la celda actual, el porcentaje y la
 * efemeride. Se chequea cada minuto, alineado al borde, y solo se redibuja si cambio el dia.
 */
function scheduleDayCheck(): void {
  const delay = 60_000 - (Date.now() % 60_000);
  window.setTimeout(() => {
    const now = today();
    const day = `${now.year}-${now.month}-${now.day}`;
    if (day !== lastRenderedDay) {
      draw();
      if (prefs.efemeride) void loadEfemerides(prefs.locale);
    }
    scheduleDayCheck();
  }, delay);
}

function start(): void {
  settingsButton.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Paso 1: primer cuadro con lo que hay en cache. Sin await, sin red, sin esperas.
  draw();

  // Paso 2: la efemeride.
  void loadEfemerides(prefs.locale);

  // La fuente de verdad, en paralelo. Solo redibuja si difiere de la cache.
  void load().then((stored) => {
    const changed = JSON.stringify(stored) !== JSON.stringify(prefs);
    prefs = stored;
    if (changed) {
      draw();
      void loadEfemerides(prefs.locale);
    }
  });

  // Cambios hechos en la pagina de opciones o en otra pestana abierta.
  onChanged((next) => {
    prefs = next;
    draw();
    void loadEfemerides(prefs.locale);
  });

  // El tema del sistema puede cambiar mientras la pestana esta abierta.
  window
    .matchMedia("(prefers-color-scheme: light)")
    .addEventListener("change", () => {
      if (prefs.theme === "system") draw();
    });

  let resizeHandle = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeHandle);
    resizeHandle = window.setTimeout(draw, 80);
  });

  scheduleDayCheck();
}

start();
