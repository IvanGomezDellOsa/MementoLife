/**
 * birthdate.ts — validacion de la fecha de nacimiento, pura y compartida.
 *
 * Existe porque la misma fecha se carga desde DOS lugares —el onboarding de la pestana
 * nueva y la pagina de opciones— y cada uno validaba distinto: el onboarding rechazaba
 * fechas futuras, y opciones no validaba nada. Una fecha imposible simplemente no se
 * guardaba, en silencio: el usuario escribia el 31 de febrero, salia del campo, y no pasaba
 * nada ni se explicaba por que.
 *
 * Devuelve el MOTIVO del rechazo, no un booleano. Un unico "revisa la fecha" no distingue
 * entre un campo sin completar, un 31 de febrero, el anio que viene, y una fecha tan vieja
 * que la grilla no la puede dibujar — y son cuatro correcciones distintas.
 *
 * Puro: la fecha de hoy entra como parametro, igual que en el resto del core.
 */

import { isLeapYear } from "./lifemath.js";
import type { CalendarDate } from "./lifemath.js";
import { LIFE_YEARS } from "./tokens.js";

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export type BirthDateProblem =
  /** Falta completar alguno de los tres campos. No es un error del usuario: esta a mitad de camino. */
  | "incomplete"
  /** Los tres campos estan llenos pero no forman una fecha real (31/2, mes 13). */
  | "impossible"
  /** Es una fecha real, pero todavia no paso. */
  | "future"
  /** Es una fecha pasada, pero mas vieja que la vida mas larga que la grilla puede dibujar. */
  | "tooOld";

/** Los tres campos tal como estan escritos, sin interpretar. */
export interface BirthDateParts {
  readonly day: string;
  readonly month: string;
  readonly year: string;
}

export type BirthDateCheck =
  | { readonly ok: true; readonly iso: string; readonly date: CalendarDate }
  | { readonly ok: false; readonly problem: BirthDateProblem };

export function daysInMonth(month: number, year: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return MONTH_LENGTHS[month - 1] ?? 31;
}

/**
 * Anios cumplidos, en entero exacto.
 *
 * No se deriva de `yearsLived()`, que devuelve decimales sobre un anio medio de 365,2425
 * dias: ahi los bisiestos acumulados hacen que alguien que cumple 100 hoy de 100,0008, y el
 * limite lo rechazaria el dia exacto de su cumpleanos. Contar anios de calendario no tiene
 * ese error.
 */
export function completedYears(birthDate: CalendarDate, today: CalendarDate): number {
  const hadBirthdayThisYear =
    today.month > birthDate.month ||
    (today.month === birthDate.month && today.day >= birthDate.day);
  return today.year - birthDate.year - (hadBirthdayThisYear ? 0 : 1);
}

function isAllDigits(text: string): boolean {
  return text.length > 0 && /^\d+$/.test(text);
}

export function checkBirthDate(parts: BirthDateParts, today: CalendarDate): BirthDateCheck {
  const { day, month, year } = parts;

  // El anio se exige de 4 digitos: con 2 no se sabe si "26" es 1926 o 2026, y adivinarlo
  // seria elegir por el usuario en el unico dato que el producto le pide.
  if (day === "" || month === "" || year.length !== 4) {
    return { ok: false, problem: "incomplete" };
  }
  if (!isAllDigits(day) || !isAllDigits(month) || !isAllDigits(year)) {
    return { ok: false, problem: "impossible" };
  }

  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  if (m < 1 || m > 12) return { ok: false, problem: "impossible" };
  if (d < 1 || d > daysInMonth(m, y)) return { ok: false, problem: "impossible" };

  const date: CalendarDate = { year: y, month: m, day: d };

  // Igual o posterior a hoy: nacer hoy da una grilla de cero semanas, que no dice nada.
  if (y > today.year || (y === today.year && (m > today.month || (m === today.month && d >= today.day)))) {
    return { ok: false, problem: "future" };
  }

  if (completedYears(date, today) > LIFE_YEARS.max) {
    return { ok: false, problem: "tooOld" };
  }

  const iso = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { ok: true, iso, date };
}
