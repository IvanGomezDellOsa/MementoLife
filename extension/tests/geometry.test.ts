/**
 * El invariante que ordena todo el rediseno apaisado: la caja de grilla mide SIEMPRE
 * 466 x 326 unidades de diseno, para cualquier lifeYears del rango.
 *
 * Si esto se rompe, se rompio la premisa entera del plan 5.1 — que la grilla no se
 * rediseña sino que se transpone y se multiplica por un unico factor k — y todos los
 * ratios del handoff dejan de conservarse solos.
 */

import { describe, expect, it } from "vitest";
import {
  BOX_ASPECT,
  BOX_UNIT_UNITS,
  BOX_YEAR_UNITS,
  cellCenter,
  geometry,
  unitAxisSpan,
  yearAxisSpan,
} from "../src/core/geometry.js";
import { LIFE_YEARS } from "../src/core/tokens.js";

const RANGE = Array.from(
  { length: LIFE_YEARS.max - LIFE_YEARS.min + 1 },
  (_, i) => LIFE_YEARS.min + i,
);

describe("invariante de la caja de grilla", () => {
  it(`cubre todo el rango elegible (${LIFE_YEARS.min}..${LIFE_YEARS.max})`, () => {
    expect(RANGE).toHaveLength(81);
  });

  for (const lifeYears of RANGE) {
    it(`lifeYears=${lifeYears} -> caja ${BOX_YEAR_UNITS} x ${BOX_UNIT_UNITS}`, () => {
      const g = geometry(lifeYears);
      expect(yearAxisSpan(g)).toBeCloseTo(BOX_YEAR_UNITS, 9);
      expect(unitAxisSpan(g)).toBeCloseTo(BOX_UNIT_UNITS, 9);
    });
  }
});

describe("geometria derivada", () => {
  it("reproduce exactamente el caso aprobado del handoff", () => {
    const g = geometry(80);
    expect(g.unitCount).toBe(52);
    expect(g.yearCount).toBe(80);
    expect(g.totalCells).toBe(4160);
    expect(g.bandCount).toBe(7);
    expect(g.yearPitch).toBeCloseTo(5.475, 6); // (466 - 7*4) / 80
    expect(g.bandGap).toBeCloseTo(4, 6); // la banda proporcional NO mueve el caso aprobado
    expect(g.unitPitch).toBeCloseTo(6.269, 3); // 326 / 52
  });

  it("el aspecto se deriva de la caja, no se lee de un token suelto", () => {
    expect(BOX_ASPECT).toBeCloseTo(466 / 326, 12);
    expect(BOX_ASPECT).toBeCloseTo(1.4294, 4);
  });

  it("ninguna celda se sale de la caja en todo el rango", () => {
    for (const lifeYears of RANGE) {
      const g = geometry(lifeYears);
      for (const index of [0, Math.floor(g.totalCells / 2), g.totalCells - 1]) {
        const { alongYear, alongUnit } = cellCenter(g, index);
        expect(alongYear).toBeGreaterThanOrEqual(0);
        expect(alongYear).toBeLessThanOrEqual(BOX_YEAR_UNITS);
        expect(alongUnit).toBeGreaterThanOrEqual(0);
        expect(alongUnit).toBeLessThanOrEqual(BOX_UNIT_UNITS);
      }
    }
  });
});

/**
 * El bug que motivo la banda proporcional: con banda fija, un lifeYears bajo dejaba la
 * separacion de decada MAS CHICA que el aire normal entre columnas, y las decadas no se
 * podian contar. Ahora la banda tiene que ser siempre mayor que el hueco entre dos puntos
 * contiguos del eje de anios, en todo el rango.
 */
describe("la banda de decada se lee en todo el rango", () => {
  for (const lifeYears of RANGE) {
    const g = geometry(lifeYears);
    if (g.bandCount === 0) continue;
    it(`lifeYears=${lifeYears}: la banda supera el aire normal entre columnas`, () => {
      expect(g.bandGap).toBeGreaterThan(g.yearPitch * 0.7);
    });
  }

  it("mantiene la proporcion constante en todo el rango", () => {
    const ratios = RANGE.map((y) => {
      const g = geometry(y);
      return g.bandGap / g.yearPitch;
    });
    const first = ratios[0] ?? 0;
    for (const ratio of ratios) expect(ratio).toBeCloseTo(first, 9);
    expect(first).toBeCloseTo(4 / 5.475, 6);
  });
});
