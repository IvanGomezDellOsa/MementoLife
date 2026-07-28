/**
 * geometry.ts — la caja de grilla mide SIEMPRE 466 x 326 unidades de diseno.
 *
 * Es el hallazgo que ordena todo el rediseno apaisado (plan 5.1). En el handoff:
 *   semanas: 80 filas x 5,475 + 7 bandas x 4 = 466  ·  52 columnas x 6,269 = 326
 *   meses:   40 filas x 10,6  + 7 bandas x 6 = 466  ·  24 columnas x 13,583 = 326
 *
 * Cuando lifeYears cambia, el paso del eje de anios se readapta para que la caja siga
 * midiendo lo mismo. O sea: la grilla no se rediseña, se TRANSPONE y se multiplica por un
 * unico factor k. Todos los ratios internos del handoff se conservan por construccion, no
 * por disciplina — y por eso el test parametrizado de 122 casos es el gate de verdad.
 *
 * Nomenclatura, que es donde es facil perderse: "eje de unidad" son las 52 semanas o los
 * 24 meses (fijo); "eje de anios" es el que crece con lifeYears. En retrato el eje de
 * unidad era horizontal; en apaisado es vertical. La matematica no cambia, solo que eje
 * se dibuja en que direccion.
 */

import { T, gridVariant, unitsPerYear } from "./tokens.js";
import type { View } from "./tokens.js";

/** Lado largo de la caja (eje de anios), en unidades de diseno. */
export const BOX_YEAR_UNITS = T.landscape.gridBox.yearAxisUnits;
/** Lado corto de la caja (eje de unidad), en unidades de diseno. */
export const BOX_UNIT_UNITS = T.landscape.gridBox.unitAxisUnits;
/** 466 / 326 = 1,42945. Se deriva, no se lee: el token "aspect" es documentacion. */
export const BOX_ASPECT = BOX_YEAR_UNITS / BOX_UNIT_UNITS;

export interface GridGeometry {
  /** Celdas del eje de unidad: 52 o 24. Fijo. */
  readonly unitCount: number;
  /** Celdas del eje de anios. Crece con lifeYears. */
  readonly yearCount: number;
  /** Total de celdas dibujadas. */
  readonly totalCells: number;
  /** Paso del eje de anios, en unidades de diseno. */
  readonly yearPitch: number;
  /** Paso del eje de unidad, en unidades de diseno. */
  readonly unitPitch: number;
  /** Cada cuantas celdas del eje de anios entra una banda de aire. */
  readonly bandEvery: number;
  /** Ancho de la banda de aire, en unidades de diseno. */
  readonly bandGap: number;
  /** Cuantas bandas entran. */
  readonly bandCount: number;
}

export function geometry(view: View, lifeYears: number): GridGeometry {
  const variant = gridVariant(view);
  const unitCount = variant.columns;
  const totalCells = lifeYears * unitsPerYear(view);
  const yearCount = Math.ceil(totalCells / unitCount);
  const bandEvery = variant.bandEveryRows;
  const bandGap = variant.bandGapPx;
  const bandCount = yearCount > 1 ? Math.floor((yearCount - 1) / bandEvery) : 0;

  return {
    unitCount,
    yearCount,
    totalCells,
    // El paso se despeja para que filas x paso + bandas = 466 exacto. Esta es la linea
    // que mantiene el invariante para cualquier lifeYears.
    yearPitch: (BOX_YEAR_UNITS - bandCount * bandGap) / yearCount,
    unitPitch: BOX_UNIT_UNITS / unitCount,
    bandEvery,
    bandGap,
    bandCount,
  };
}

/** Extension real ocupada por la grilla en el eje de anios. Debe dar 466 siempre. */
export function yearAxisSpan(g: GridGeometry): number {
  return g.yearCount * g.yearPitch + g.bandCount * g.bandGap;
}

/** Extension real ocupada por la grilla en el eje de unidad. Debe dar 326 siempre. */
export function unitAxisSpan(g: GridGeometry): number {
  return g.unitCount * g.unitPitch;
}

/** Centro de una celda dentro de la caja, en unidades de diseno y sin transponer aun. */
export function cellCenter(
  g: GridGeometry,
  index: number,
): { readonly alongYear: number; readonly alongUnit: number } {
  const yearStep = Math.floor(index / g.unitCount);
  return {
    alongYear: yearStep * g.yearPitch + Math.floor(yearStep / g.bandEvery) * g.bandGap + g.yearPitch / 2,
    alongUnit: (index % g.unitCount) * g.unitPitch + g.unitPitch / 2,
  };
}
