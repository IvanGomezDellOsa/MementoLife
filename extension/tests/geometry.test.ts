/**
 * El invariante que ordena todo el rediseno apaisado: la caja de grilla mide SIEMPRE
 * 466 x 326 unidades de diseno, en las 2 vistas y para cualquier lifeYears del rango.
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
import type { View } from "../src/core/tokens.js";

const VIEWS: readonly View[] = ["weeks", "months"];
const LIFE_YEARS = Array.from({ length: 61 }, (_, i) => 40 + i); // 40..100 inclusive

describe("invariante de la caja de grilla", () => {
  it("cubre los 122 casos del gate (2 vistas x 61 valores de lifeYears)", () => {
    expect(VIEWS.length * LIFE_YEARS.length).toBe(122);
  });

  for (const view of VIEWS) {
    for (const lifeYears of LIFE_YEARS) {
      it(`${view} / lifeYears=${lifeYears} -> caja ${BOX_YEAR_UNITS} x ${BOX_UNIT_UNITS}`, () => {
        const g = geometry(view, lifeYears);
        expect(yearAxisSpan(g)).toBeCloseTo(BOX_YEAR_UNITS, 10);
        expect(unitAxisSpan(g)).toBeCloseTo(BOX_UNIT_UNITS, 10);
      });
    }
  }
});

describe("geometria derivada", () => {
  it("reproduce los pasos del handoff en el caso base de semanas", () => {
    const g = geometry("weeks", 80);
    expect(g.unitCount).toBe(52);
    expect(g.yearCount).toBe(80);
    expect(g.totalCells).toBe(4160);
    expect(g.bandCount).toBe(7);
    expect(g.yearPitch).toBeCloseTo(5.475, 3); // (466 - 7*4) / 80
    expect(g.unitPitch).toBeCloseTo(6.269, 3); // 326 / 52
  });

  it("reproduce los pasos del handoff en el caso base de meses", () => {
    const g = geometry("months", 80);
    expect(g.unitCount).toBe(24);
    expect(g.yearCount).toBe(40);
    expect(g.totalCells).toBe(960);
    expect(g.bandCount).toBe(7);
    expect(g.yearPitch).toBeCloseTo(10.6, 3); // (466 - 7*6) / 40
    expect(g.unitPitch).toBeCloseTo(13.583, 3); // 326 / 24
  });

  it("el aspecto se deriva de la caja, no se lee de un token suelto", () => {
    expect(BOX_ASPECT).toBeCloseTo(466 / 326, 12);
    expect(BOX_ASPECT).toBeCloseTo(1.4294, 4);
  });

  it("ninguna celda se sale de la caja, en ningun caso del rango", () => {
    for (const view of VIEWS) {
      for (const lifeYears of LIFE_YEARS) {
        const g = geometry(view, lifeYears);
        for (const index of [0, Math.floor(g.totalCells / 2), g.totalCells - 1]) {
          const { alongYear, alongUnit } = cellCenter(g, index);
          expect(alongYear).toBeGreaterThanOrEqual(0);
          expect(alongYear).toBeLessThanOrEqual(BOX_YEAR_UNITS);
          expect(alongUnit).toBeGreaterThanOrEqual(0);
          expect(alongUnit).toBeLessThanOrEqual(BOX_UNIT_UNITS);
        }
      }
    }
  });
});
