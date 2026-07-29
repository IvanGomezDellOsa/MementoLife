/**
 * tokens.ts — vista tipada sobre design-tokens.json.
 *
 * Es la unica puerta de entrada a los valores de diseno. El resto del core no importa
 * `DESIGN_TOKENS` directo: pide por nombre. Asi un token que cambia de lugar rompe en un
 * solo archivo, y no hay forma de colar un numero magico sin que se note.
 */

import { DESIGN_TOKENS } from "../data/tokens.js";

export type Theme = "dark" | "light";
export type Locale = "es" | "en" | "fr" | "pt" | "it" | "de";

/** Todos los idiomas soportados, en el orden en que se listan en el selector. */
export const LOCALES: readonly Locale[] = ["es", "en", "fr", "pt", "it", "de"];

export const T = DESIGN_TOKENS;

/** Semanas por anio. Es calendario, no diseno, pero vive en tokens porque define la grilla. */
export const WEEKS_PER_YEAR = T.grid.weeksPerYear;

export const CELL = T.grid.cell;
export const LAYOUT = T.layout;
export const TYPE = T.typography;
export const RESPONSIVE = T.responsive;
export const LIFE_YEARS = T.lifeYears;

export function background(theme: Theme): string {
  return theme === "dark" ? T.colors.background.dark : T.colors.background.light;
}

export function ink(theme: Theme): string {
  return theme === "dark" ? T.colors.ink.dark : T.colors.ink.light;
}

/**
 * Color de los puntos. Deliberadamente distinto de la tinta del texto: con el mismo
 * near-blanco la grilla centelleaba, y ademas competia con el texto en jerarquia.
 */
export function dot(theme: Theme): string {
  return theme === "dark" ? T.colors.dot.dark : T.colors.dot.light;
}

export function pastOpacity(theme: Theme): number {
  return theme === "dark" ? T.grid.opacity.past.dark : T.grid.opacity.past.light;
}

export function futureOpacity(theme: Theme): number {
  return theme === "dark" ? T.grid.opacity.future.dark : T.grid.opacity.future.light;
}

export function clampLifeYears(value: number): number {
  return Math.min(LIFE_YEARS.max, Math.max(LIFE_YEARS.min, Math.round(value)));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
