/**
 * tokens.ts — vista tipada sobre design-tokens.json.
 *
 * Es la unica puerta de entrada a los valores de diseno. El resto del core no importa
 * `DESIGN_TOKENS` directo: pide por nombre. Asi un token que cambia de lugar rompe en un
 * solo archivo, y no hay forma de colar un numero magico sin que se note (regla 6).
 */

import { DESIGN_TOKENS } from "../data/tokens.js";

export type Theme = "dark" | "light";
export type View = "weeks" | "months";
export type Locale = "es" | "en";

export const T = DESIGN_TOKENS;

/** Variante de grilla: columnas del eje de unidad, radios, bandas. Invariantes de medio. */
export function gridVariant(view: View): typeof DESIGN_TOKENS.grid.weeks | typeof DESIGN_TOKENS.grid.months {
  return view === "weeks" ? T.grid.weeks : T.grid.months;
}

export function background(theme: Theme): string {
  return theme === "dark" ? T.colors.background.dark : T.colors.background.light;
}

export function ink(theme: Theme): string {
  return theme === "dark" ? T.colors.ink.dark : T.colors.ink.light;
}

export function pastOpacity(theme: Theme): number {
  return theme === "dark" ? T.grid.opacity.past.dark : T.grid.opacity.past.light;
}

export function futureOpacity(theme: Theme): number {
  return theme === "dark" ? T.grid.opacity.future.dark : T.grid.opacity.future.light;
}

export function efemerideOpacity(theme: Theme): number {
  return theme === "dark" ? T.typography.efemeride.opacity.dark : T.typography.efemeride.opacity.light;
}

/** Unidades por anio segun la vista. 52 semanas o 12 meses; no sale de tokens porque es calendario. */
export function unitsPerYear(view: View): number {
  return view === "weeks" ? 52 : 12;
}
