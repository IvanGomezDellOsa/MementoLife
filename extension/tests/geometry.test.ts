/**
 * Los dos invariantes de la geometria nueva. Reemplazan al viejo "la caja mide siempre
 * 466 x 326", que era la causa de las celdas estiradas y del centelleo:
 *
 *   1. La celda conserva su relacion de aspecto para cualquier lifeYears del rango.
 *   2. La grilla entra siempre en el espacio disponible, sin recortarse.
 *
 * El primero es mas fuerte que el anterior: antes se garantizaba el tamano de la CAJA y la
 * celda quedaba librada a la suerte; ahora se garantiza la CELDA, que es lo que se ve.
 */

import { describe, expect, it } from "vitest";
import { cellCenter, geometry, metricsFor } from "../src/core/geometry.js";
import { CELL, LIFE_YEARS, WEEKS_PER_YEAR, T } from "../src/core/tokens.js";

const RANGE = Array.from(
  { length: LIFE_YEARS.max - LIFE_YEARS.min + 1 },
  (_, i) => LIFE_YEARS.min + i,
);

/** Espacios realistas: de una ventana chica a un monitor grande. */
const SPACES: readonly { w: number; h: number }[] = [
  { w: 600, h: 400 },
  { w: 900, h: 520 },
  { w: 1173, h: 771 },
  { w: 1500, h: 900 },
  { w: 2100, h: 1100 },
];

describe("conteo de celdas", () => {
  it("una columna por anio, 52 filas siempre", () => {
    const g = geometry(80);
    expect(g.weekCount).toBe(WEEKS_PER_YEAR);
    expect(g.yearCount).toBe(80);
    expect(g.totalCells).toBe(4160);
    expect(g.bandCount).toBe(7);
  });

  it("la banda de decada aparece cada 10 anios", () => {
    expect(geometry(20).bandCount).toBe(1);
    expect(geometry(40).bandCount).toBe(3);
    expect(geometry(100).bandCount).toBe(9);
    expect(geometry(80).bandEvery).toBe(T.grid.bandEveryYears);
  });
});

describe("INVARIANTE 1 — la celda conserva su aspecto", () => {
  for (const lifeYears of RANGE) {
    it(`lifeYears=${lifeYears}`, () => {
      for (const space of SPACES) {
        const g = geometry(lifeYears);
        const m = metricsFor(g, space.w, space.h);
        expect(m.yearPitch / m.weekPitch).toBeCloseTo(CELL.aspect, 9);
      }
    });
  }
});

describe("INVARIANTE 2 — la grilla nunca se recorta", () => {
  it(`entra en el espacio disponible en ${RANGE.length * SPACES.length} combinaciones`, () => {
    const offenders: string[] = [];
    for (const lifeYears of RANGE) {
      for (const space of SPACES) {
        const g = geometry(lifeYears);
        const m = metricsFor(g, space.w, space.h);
        if (m.widthPx > space.w + 0.001 || m.heightPx > space.h + 0.001 || m.widthPx <= 0) {
          offenders.push(
            `${lifeYears} anios en ${space.w}x${space.h}: ${m.widthPx.toFixed(1)}x${m.heightPx.toFixed(1)}`,
          );
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("ninguna celda cae fuera de la caja", () => {
    for (const lifeYears of RANGE) {
      const g = geometry(lifeYears);
      const m = metricsFor(g, 1173, 771);
      for (const index of [0, Math.floor(g.totalCells / 2), g.totalCells - 1]) {
        const c = cellCenter(g, m, index);
        expect(c.x).toBeGreaterThanOrEqual(0);
        expect(c.x).toBeLessThanOrEqual(m.widthPx);
        expect(c.y).toBeGreaterThanOrEqual(0);
        expect(c.y).toBeLessThanOrEqual(m.heightPx);
      }
    }
  });
});

describe("aire entre puntos", () => {
  it("el hueco es siempre positivo y proporcional al paso", () => {
    for (const lifeYears of RANGE) {
      const g = geometry(lifeYears);
      const m = metricsFor(g, 1173, 771);
      expect(m.gapPx).toBeGreaterThan(0);
      expect(m.gapPx / m.yearPitch).toBeCloseTo(1 - CELL.dotDiameterRatio, 9);
    }
  });

  it("la banda de decada supera al aire normal entre columnas, en todo el rango", () => {
    for (const lifeYears of RANGE) {
      const g = geometry(lifeYears);
      if (g.bandCount === 0) continue;
      const m = metricsFor(g, 1173, 771);
      expect(m.bandGap).toBeGreaterThan(m.gapPx);
    }
  });

  it("a 1920x950 el hueco supera los 7 px, que es el objetivo del rediseno", () => {
    const g = geometry(80);
    const m = metricsFor(g, 1173, 771);
    expect(m.gapPx).toBeGreaterThan(7);
  });
});
