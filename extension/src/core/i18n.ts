/**
 * i18n.ts — strings de la interfaz, es/en.
 *
 * No se usa chrome.i18n para la UI: toma el idioma del NAVEGADOR y no admite override, y
 * la restriccion del proyecto exige que el usuario pueda elegir (plan 6.5). chrome.i18n
 * queda solo para el nombre y la descripcion de la ficha de la tienda.
 *
 * El tipo se deriva de las claves del espanol, asi que si falta una traduccion en ingles
 * es un error de compilacion y no un texto en blanco en produccion.
 */

import type { Locale } from "./tokens.js";

const ES = {
  optionsTitle: "MementoLife — Opciones",
  newTabTitle: "Pestaña nueva",

  birthDateLabel: "Fecha de nacimiento",
  birthDateHint: "Se guarda solo en este equipo.",
  birthDateInvalid: "Revisá la fecha: tiene que ser anterior a hoy.",
  save: "Guardar",

  onboardingHeading: "Tu vida, semana a semana",
  onboardingBody: "Poné tu fecha de nacimiento para ver la grilla.",
  onboardingCta: "Empezar",

  lifeYearsLabel: "Esperanza de vida",
  lifeYearsUnit: "años",
  lifeYearsHint: "Entre 40 y 100.",

  themeLabel: "Tema",
  themeDark: "Oscuro",
  themeLight: "Claro",
  themeSystem: "Del sistema",

  viewLabel: "Vista",
  viewWeeks: "Semanas",
  viewMonths: "Meses",

  efemerideLabel: "Efeméride del día",
  efemerideOn: "Mostrar",
  efemerideOff: "Ocultar",

  localeLabel: "Idioma",
  localeEs: "Español",
  localeEn: "Inglés",

  savedNotice: "Guardado.",
} as const;

/** El tipo sale del español: agregar una clave allá obliga a traducirla acá. */
type Strings = { readonly [K in keyof typeof ES]: string };

const EN: Strings = {
  optionsTitle: "MementoLife — Options",
  newTabTitle: "New tab",

  birthDateLabel: "Date of birth",
  birthDateHint: "Stored on this device only.",
  birthDateInvalid: "Check the date: it must be in the past.",
  save: "Save",

  onboardingHeading: "Your life, week by week",
  onboardingBody: "Enter your date of birth to see the grid.",
  onboardingCta: "Get started",

  lifeYearsLabel: "Life expectancy",
  lifeYearsUnit: "years",
  lifeYearsHint: "Between 40 and 100.",

  themeLabel: "Theme",
  themeDark: "Dark",
  themeLight: "Light",
  themeSystem: "System",

  viewLabel: "View",
  viewWeeks: "Weeks",
  viewMonths: "Months",

  efemerideLabel: "Fact of the day",
  efemerideOn: "Show",
  efemerideOff: "Hide",

  localeLabel: "Language",
  localeEs: "Spanish",
  localeEn: "English",

  savedNotice: "Saved.",
};

export type StringKey = keyof typeof ES;

export function strings(locale: Locale): Strings {
  return locale === "es" ? ES : EN;
}

export function t(locale: Locale, key: StringKey): string {
  return strings(locale)[key];
}
