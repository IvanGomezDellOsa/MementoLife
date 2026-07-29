/**
 * prefs.ts — preferencias del usuario.
 *
 * `chrome.storage.local` es la FUENTE DE VERDAD. `localStorage` es solo una cache de
 * arranque, y existe por una razon concreta: `chrome.storage` es asincrono, asi que sin
 * cache la pestana nueva pintaria un primer cuadro con los valores por defecto y despues
 * saltaria a los del usuario. Eso se ve como un parpadeo, varias veces por dia, para
 * siempre.
 *
 * El plan (6.2) proponia cachear solo el tema. Se cachea el objeto entero: pesa ~100 bytes,
 * evita tambien el salto de la grilla (no solo el del fondo) y no cambia el perfil de
 * privacidad — localStorage de una pagina chrome-extension:// vive en el mismo perfil local
 * que chrome.storage.local y tampoco se sincroniza con ninguna cuenta.
 *
 * NO se usa `storage.sync` a proposito: mandaria la fecha de nacimiento a los servidores de
 * Google via la cuenta del usuario, en contra del "100 % en el equipo" del proyecto (6.6).
 */

import { LIFE_YEARS, LOCALES, clampLifeYears } from "./core/tokens.js";
import type { Locale, Theme } from "./core/tokens.js";

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** "system" sigue a prefers-color-scheme; es el valor por defecto. */
export type ThemePref = Theme | "system";

export interface Prefs {
  /** "YYYY-MM-DD", o null mientras el usuario no la haya puesto. */
  readonly birthDate: string | null;
  readonly lifeYears: number;
  readonly theme: ThemePref;
  readonly locale: Locale;
  readonly efemeride: boolean;
}

const STORAGE_KEY = "prefs";
const CACHE_KEY = "mementolife.prefs.v1";

/** Idioma inicial: el del navegador, como pide el plan 6.4. Despues es elegible. */
function detectLocale(): Locale {
  try {
    const lang = chrome.i18n.getUILanguage().toLowerCase().slice(0, 2);
    return isLocale(lang) ? lang : "en";
  } catch {
    return "en";
  }
}

export function defaultPrefs(): Prefs {
  return {
    birthDate: null,
    lifeYears: LIFE_YEARS.default,
    theme: "system",
    locale: detectLocale(),
    efemeride: true,
  };
}

/** Normaliza cualquier cosa que venga de storage o de la cache. Nunca tira. */
function normalize(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (typeof raw !== "object" || raw === null) return base;
  const value = raw as Partial<Record<keyof Prefs, unknown>>;

  const birthDate =
    typeof value.birthDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.birthDate)
      ? value.birthDate
      : null;

  return {
    birthDate,
    lifeYears:
      typeof value.lifeYears === "number" && Number.isFinite(value.lifeYears)
        ? clampLifeYears(value.lifeYears)
        : base.lifeYears,
    theme:
      value.theme === "dark" || value.theme === "light" || value.theme === "system"
        ? value.theme
        : base.theme,
    locale: isLocale(value.locale) ? value.locale : base.locale,
    efemeride: typeof value.efemeride === "boolean" ? value.efemeride : base.efemeride,
  };
}

/**
 * Lectura SINCRONA de la cache. Es lo primero que corre en la pestana nueva.
 * Si no hay cache todavia, devuelve los valores por defecto.
 */
export function readCache(): Prefs {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw === null ? defaultPrefs() : normalize(JSON.parse(raw));
  } catch {
    return defaultPrefs();
  }
}

function writeCache(prefs: Prefs): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(prefs));
  } catch {
    // Cuota llena o localStorage deshabilitado: la cache es opcional, no se rompe nada.
  }
}

/** Lectura de la fuente de verdad. Reconcilia la cache de paso. */
export async function load(): Promise<Prefs> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const prefs = normalize(stored[STORAGE_KEY]);
  writeCache(prefs);
  return prefs;
}

export async function save(patch: Partial<Prefs>): Promise<Prefs> {
  const current = await load();
  const next = normalize({ ...current, ...patch });
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  writeCache(next);
  return next;
}

/** Avisa cuando las preferencias cambian en otra pestana o en la pagina de opciones. */
export function onChanged(listener: (prefs: Prefs) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const change = changes[STORAGE_KEY];
    if (change === undefined) return;
    const prefs = normalize(change.newValue);
    writeCache(prefs);
    listener(prefs);
  });
}

/** Resuelve "system" contra prefers-color-scheme. */
export function resolveTheme(theme: ThemePref): Theme {
  if (theme !== "system") return theme;
  return globalThis.matchMedia?.("(prefers-color-scheme: light)").matches === true ? "light" : "dark";
}

/** "1990-01-01" -> {year, month, day}, o null si no parsea a una fecha real. */
export function parseBirthDate(iso: string | null): { year: number; month: number; day: number } | null {
  if (iso === null) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}
