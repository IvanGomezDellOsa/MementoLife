/**
 * efemerides.ts — seleccion de la efemeride del dia.
 *
 * El dataset viene como array plano de 366 cadenas en orden de anio bisiesto, asi que
 * elegir la del dia es una cuenta y un acceso por indice: no hay busqueda ni claves
 * month/day en el paquete (plan 10.6).
 */

import { isLeapYear } from "./lifemath.js";
import type { CalendarDate } from "./lifemath.js";

/** Dias por mes en un anio bisiesto: el dataset cubre el 29/2, asi que la referencia es bisiesta. */
const LEAP_MONTH_LENGTHS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/** Suma acumulada, precalculada: evita el bucle en cada render. */
const CUMULATIVE: readonly number[] = LEAP_MONTH_LENGTHS.reduce<number[]>(
  (acc, length, index) => {
    acc.push((acc[index] ?? 0) + length);
    return acc;
  },
  [0],
);

export const DAYS_IN_LEAP_YEAR = 366;

/** Indice 0..365 de una fecha dentro de un anio bisiesto. */
export function leapYearDayIndex(month: number, day: number): number {
  return (CUMULATIVE[month - 1] ?? 0) + day - 1;
}

/**
 * Efemeride del dia, o null si no corresponde mostrar ninguna.
 *
 * El unico caso que devuelve null con un dataset completo es el 29 de febrero en un anio
 * no bisiesto — que no puede darse, porque esa fecha no existe fuera de los bisiestos. La
 * comprobacion queda igual: si algun dia la fecha llega mal armada desde afuera del core,
 * es mejor no dibujar la efemeride que dibujar la de otro dia.
 */
export function efemerideFor(table: readonly string[], date: CalendarDate): string | null {
  if (date.month === 2 && date.day === 29 && !isLeapYear(date.year)) return null;
  const index = leapYearDayIndex(date.month, date.day);
  if (index < 0 || index >= table.length) return null;
  return table[index] ?? null;
}
