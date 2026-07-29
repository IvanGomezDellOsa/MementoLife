/**
 * format.ts — la fecha como cadena.
 *
 * El core no lee el reloj: la fecha y la hora entran como parametros. Lo que si hace es
 * construir un Date a partir de esos parametros para pasarselo a Intl, siempre en UTC.
 * Es determinista y no depende del huso del equipo — que es lo que hace que los snapshots
 * sirvan de gate.
 */

import type { CalendarDate } from "./lifemath.js";
import type { Locale } from "./tokens.js";

/** Tag de Intl para cada idioma soportado. */
const INTL_TAG: { readonly [K in Locale]: string } = {
  es: "es-ES",
  en: "en-US",
  fr: "fr-FR",
  pt: "pt-PT",
  it: "it-IT",
  de: "de-DE",
};

export function intlTag(locale: Locale): string {
  return INTL_TAG[locale];
}

/**
 * "miércoles, 2 de julio" / "Wednesday, July 2". Sin anio, como en la referencia.
 */
export function formatDate(date: CalendarDate, locale: Locale): string {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day));
  return new Intl.DateTimeFormat(intlTag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(utc);
}

