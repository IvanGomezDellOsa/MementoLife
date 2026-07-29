/**
 * Los invariantes del dataset documentados en docs/DATASET-EFEMERIDES.md, convertidos en
 * gate. Reemplazan a los print() de comprobacion del generador de Python eliminado.
 */

import { describe, expect, it } from "vitest";
import { DAYS_IN_LEAP_YEAR, efemerideFor, leapYearDayIndex } from "../src/core/efemerides.js";
import { EFEMERIDES as ES } from "../src/data/efemerides.es.js";
import { EFEMERIDES as EN } from "../src/data/efemerides.en.js";
import { EFEMERIDES as FR } from "../src/data/efemerides.fr.js";
import { EFEMERIDES as PT } from "../src/data/efemerides.pt.js";
import { EFEMERIDES as IT } from "../src/data/efemerides.it.js";
import { EFEMERIDES as DE } from "../src/data/efemerides.de.js";

/** El patron con el que arranca el texto del dia 1 de cada mes, por idioma. */
const FIRST_OF_MONTH_PATTERN: Record<string, RegExp> = {
  es: /^1 de /,
  en: / 1, /,
  fr: /^1er /,
  pt: /^1 de /,
  it: /^1° /,
  de: /^1\. /,
};

const LEAP_MONTH_LENGTHS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

describe("indice de dia del anio bisiesto", () => {
  it("mapea los bordes conocidos", () => {
    expect(leapYearDayIndex(1, 1)).toBe(0);
    expect(leapYearDayIndex(2, 29)).toBe(59);
    expect(leapYearDayIndex(3, 1)).toBe(60);
    expect(leapYearDayIndex(12, 31)).toBe(365);
  });

  it("es una biyeccion sobre los 366 dias", () => {
    const seen = new Set<number>();
    for (let month = 1; month <= 12; month += 1) {
      for (let day = 1; day <= (LEAP_MONTH_LENGTHS[month - 1] ?? 0); day += 1) {
        seen.add(leapYearDayIndex(month, day));
      }
    }
    expect(seen.size).toBe(DAYS_IN_LEAP_YEAR);
    expect(Math.min(...seen)).toBe(0);
    expect(Math.max(...seen)).toBe(365);
  });
});

describe.each([
  ["es", ES],
  ["en", EN],
  ["fr", FR],
  ["pt", PT],
  ["it", IT],
  ["de", DE],
])("dataset %s", (_locale, table) => {
  it("tiene 366 entradas", () => {
    expect(table).toHaveLength(DAYS_IN_LEAP_YEAR);
  });

  it("no tiene textos vacios", () => {
    expect(table.filter((text) => text.trim() === "")).toHaveLength(0);
  });

  it("devuelve una efemeride para todos los dias de un anio bisiesto", () => {
    for (let month = 1; month <= 12; month += 1) {
      for (let day = 1; day <= (LEAP_MONTH_LENGTHS[month - 1] ?? 0); day += 1) {
        expect(efemerideFor(table, { year: 2024, month, day })).toBeTruthy();
      }
    }
  });

  it("el 29 de febrero solo aparece en anios bisiestos", () => {
    expect(efemerideFor(table, { year: 2024, month: 2, day: 29 })).toBeTruthy();
    expect(efemerideFor(table, { year: 2023, month: 2, day: 29 })).toBeNull();
  });
});

describe("alineacion entre idiomas", () => {
  it.each([
    ["en", EN],
    ["fr", FR],
    ["pt", PT],
    ["it", IT],
    ["de", DE],
  ])("%s describe el mismo dia que es en el mismo indice", (locale, table) => {
    expect(table).toHaveLength(ES.length);
    // El texto arranca con la fecha formateada; el numero de dia tiene que coincidir.
    const pattern = FIRST_OF_MONTH_PATTERN[locale] as RegExp;
    for (let month = 1; month <= 12; month += 1) {
      const index = leapYearDayIndex(month, 1);
      expect(ES[index]).toMatch(/^1 de /);
      expect(table[index]).toMatch(pattern);
    }
  });
});
