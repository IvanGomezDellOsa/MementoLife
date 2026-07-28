/**
 * lifemath.ts — cuantas celdas van llenas, cual es la actual, que dice el pie.
 *
 * Las reglas son las del plan 5.6, heredadas sin cambios de la v1: son la definicion del
 * producto, no un detalle de la plataforma anterior.
 *
 * La fecha entra como CalendarDate, no como Date. Es a proposito: `new Date("1990-01-01")`
 * es medianoche UTC, asi que en cualquier huso al oeste de Greenwich el usuario veria el
 * dia anterior — un error de una celda que aparece y desaparece segun la hora. Con
 * ano/mes/dia explicitos y aritmetica de dias propia, el core no tiene husos horarios.
 */

import { UNITS_PER_YEAR } from "./tokens.js";
import type { Locale } from "./tokens.js";

/** Fecha civil, sin hora ni huso. Es lo unico que el core entiende como "fecha". */
export interface CalendarDate {
  readonly year: number;
  readonly month: number; // 1..12
  readonly day: number; // 1..31
}

/** Anio medio del calendario gregoriano. Cerrado en el plan 5.6. */
const DAYS_PER_YEAR = 365.2425;

export interface LifeStats {
  /** Anios vividos en decimal, p. ej. 33.5. */
  readonly yearsLived: number;
  /** Total de celdas de la grilla: lifeYears x 52. */
  readonly totalUnits: number;
  /** Indice 0-based de la celda actual (la del anillo vacio), ya clampeado. */
  readonly currentIndex: number;
  /** Numero que se muestra al usuario: currentIndex + 1. */
  readonly currentNumber: number;
  /** Porcentaje vivido, entero, acotado a 0..100. */
  readonly percent: number;
}

/**
 * Dias desde una epoca fija, algoritmo de calendario civil (Howard Hinnant). Puro,
 * exacto para todo el rango util y sin depender de Date ni del huso del equipo.
 */
export function daysFromCivil({ year, month, day }: CalendarDate): number {
  const y = year - (month <= 2 ? 1 : 0);
  const era = Math.floor((y >= 0 ? y : y - 399) / 400);
  const yoe = y - era * 400;
  const mp = (month + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function yearsLived(birthDate: CalendarDate, today: CalendarDate): number {
  return (daysFromCivil(today) - daysFromCivil(birthDate)) / DAYS_PER_YEAR;
}

/**
 * Indice de la celda actual. El clamp no es defensivo porque si: con un cumpleanos
 * "redondo" los dias bisiestos acumulados hacen que yearsLived supere lifeYears (p. ej.
 * 40.0008 para alguien que cumple exactamente 40), y sin clamp el anillo se dibujaria
 * fuera de la grilla. Es el caso del fixture edge_lifeYears_40.
 */
export function currentIndex(yearsLivedValue: number, lifeYears: number): number {
  const raw = Math.floor(yearsLivedValue * UNITS_PER_YEAR);
  const lastValid = totalUnits(lifeYears) - 1;
  return Math.max(0, Math.min(raw, lastValid));
}

export function totalUnits(lifeYears: number): number {
  return lifeYears * UNITS_PER_YEAR;
}

export function percentLived(yearsLivedValue: number, lifeYears: number): number {
  return Math.max(0, Math.min(100, Math.round((yearsLivedValue / lifeYears) * 100)));
}

export function lifeStats(
  birthDate: CalendarDate,
  today: CalendarDate,
  lifeYears: number,
): LifeStats {
  const lived = yearsLived(birthDate, today);
  const total = totalUnits(lifeYears);
  const index = currentIndex(lived, lifeYears);
  return {
    yearsLived: lived,
    totalUnits: total,
    currentIndex: index,
    currentNumber: index + 1,
    percent: percentLived(lived, lifeYears),
  };
}

/**
 * Pie: "{n} % · semana X de Y" / "{n} % · week X of Y". El espacio antes del % y la
 * ausencia de "vivido"/"lived" vienen del handoff; no son un descuido de formato.
 */
export function footerText(locale: Locale, stats: LifeStats): string {
  const unit = locale === "es" ? "semana" : "week";
  const joiner = locale === "es" ? "de" : "of";
  return `${stats.percent} % · ${unit} ${stats.currentNumber} ${joiner} ${stats.totalUnits}`;
}
