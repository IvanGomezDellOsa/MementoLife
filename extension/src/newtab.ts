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

/** Tablas de efemerides ya cargadas, por idioma. El import() se hace una sola vez. */
const tables = new Map<Locale, readonly string[]>();

let prefs: Prefs = readCache();
let lastRenderedDay = "";

/** Fecha y hora LOCALES. El core no lee el reloj: se le pasan como parametros. */
function nowParts(): {
  today: { year: number; month: number; day: number };
  hour: number;
  minute: number;
} {
  const now = new Date();
  return {
    today: { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() },
    hour: now.getHours(),
    minute: now.getMinutes(),
  };
}

function draw(): RenderResult {
  const { today, hour, minute } = nowParts();
  const theme = resolveTheme(prefs.theme);
  const birthDate = parseBirthDate(prefs.birthDate);
  const table = tables.get(prefs.locale);

  const efemerideText =
    prefs.efemeride && table !== undefined ? efemerideFor(table, today) : null;

  const result = render({
    theme,
    locale: prefs.locale,
    lifeYears: prefs.lifeYears,
    birthDate,
    today,
    hour,
    minute,
    efemerideText,
    viewport: { widthPx: window.innerWidth, heightPx: window.innerHeight },
  });

  canvas.innerHTML = result.svg;
  document.documentElement.dataset["theme"] = theme;
  document.title = t(prefs.locale, "newTabTitle");
  document.documentElement.lang = prefs.locale;
  lastRenderedDay = `${today.year}-${today.month}-${today.day}`;

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

/** Carga la tabla del idioma activo y redibuja. Es el paso 2 del arranque. */
async function loadEfemerides(locale: Locale): Promise<void> {
  if (!prefs.efemeride || tables.has(locale)) return;
  const module =
    locale === "es"
      ? await import("./data/efemerides.es.js")
      : await import("./data/efemerides.en.js");
  tables.set(locale, module.EFEMERIDES);
  if (prefs.locale === locale) draw();
}

/**
 * Tick alineado al borde de minuto. Se reprograma en cada vuelta en vez de usar
 * setInterval: con setInterval el reloj se va corriendo respecto del minuto real, y a la
 * larga el cambio de digito se ve tarde.
 */
function scheduleMinuteTick(): void {
  const delay = 60_000 - (Date.now() % 60_000);
  window.setTimeout(() => {
    const { today } = nowParts();
    const day = `${today.year}-${today.month}-${today.day}`;
    // Cruce de medianoche con la pestana abierta: cambia la celda actual, el pie y la
    // efemeride, asi que se redibuja todo y no solo el reloj.
    draw();
    if (day !== lastRenderedDay && prefs.efemeride) void loadEfemerides(prefs.locale);
    scheduleMinuteTick();
  }, delay);
}

function start(): void {
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

  scheduleMinuteTick();
}

start();
