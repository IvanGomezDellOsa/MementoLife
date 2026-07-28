/**
 * tokens.ts — vista tipada sobre design-tokens.json.
 *
 * Es la unica puerta de entrada a los valores de diseno. El resto del core no importa
 * `DESIGN_TOKENS` directo: pide por nombre. Asi un token que cambia de lugar rompe en un
 * solo archivo, y no hay forma de colar un numero magico sin que se note (regla 6).
 */

import { DESIGN_TOKENS } from "../data/tokens.js";

export type Theme = "dark" | "light";
export type Locale = "es" | "en";

export const T = DESIGN_TOKENS;

/**
 * Parametros de la grilla: columnas del eje de unidad, radios, banda de decada.
 *
 * Hay una sola vista, semanas. La de meses existia porque en la pantalla de un telefono
 * 4160 puntos no entraban con peso suficiente; en un monitor entran de sobra, asi que se
 * elimino junto con la plataforma que la justificaba.
 */
export const GRID = T.grid.weeks;

/** Semanas por anio. Es calendario, no diseno, por eso no sale de tokens. */
export const UNITS_PER_YEAR = 52;

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

/** Rango elegible de esperanza de vida. */
export const LIFE_YEARS = T.landscape.lifeYears;

export function clampLifeYears(value: number): number {
  return Math.min(LIFE_YEARS.max, Math.max(LIFE_YEARS.min, Math.round(value)));
}
