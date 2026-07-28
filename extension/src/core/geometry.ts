/**
 * geometry.ts — la caja de grilla mide SIEMPRE 466 x 326 unidades de diseno.
 *
 * Es el hallazgo que ordena todo el rediseno apaisado (plan 5.1): la grilla no se rediseña
 * cuando cambia lifeYears, se TRANSPONE y se multiplica por un unico factor k. Todos los
 * ratios internos del handoff se conservan por construccion, no por disciplina — y por eso
 * el test parametrizado sobre todo el rango es el gate de verdad.
 *
 * Nomenclatura, que es donde es facil perderse: "eje de unidad" son las 52 semanas del
 * anio (fijo); "eje de anios" es el que crece con lifeYears. En retrato el eje de unidad
 * era horizontal; en apaisado es vertical. La matematica no cambia, solo que eje se dibuja
 * en que direccion.
 *
 * ── La banda de decada es PROPORCIONAL, no fija ──────────────────────────────────────
 *
 * En el handoff la banda media 4 unidades fijas, porque el unico caso real era lifeYears
 * = 80. Con un valor bajo eso se rompe: en 40, el paso del eje de anios se duplica a 11,35
 * unidades (20,33 px en pantalla) y la banda se queda en 4 (7,17 px). El resultado es que
 * la separacion de decada es MAS CHICA que el espacio normal entre columnas y las decadas
 * dejan de poder contarse — la grilla se lee como columnas uniformes.
 *
 * La solucion es hacer que la banda sea una fraccion constante del paso, con la fraccion
 * derivada del propio caso aprobado (4 / 5,475 = 0,7306). Eso deja lifeYears = 80 exacto
 * al pixel y arregla todo el resto del rango. Despejando:
 *
 *   paso = (466 - bandas x banda) / anios       y      banda = ratio x paso
 *   =>  paso = 466 / (anios + bandas x ratio)
 */

import { GRID, T, UNITS_PER_YEAR } from "./tokens.js";

/** Lado largo de la caja (eje de anios), en unidades de diseno. */
export const BOX_YEAR_UNITS = T.landscape.gridBox.yearAxisUnits;
/** Lado corto de la caja (eje de unidad), en unidades de diseno. */
export const BOX_UNIT_UNITS = T.landscape.gridBox.unitAxisUnits;
/** 466 / 326 = 1,42945. Se deriva, no se lee: el token "aspect" es documentacion. */
export const BOX_ASPECT = BOX_YEAR_UNITS / BOX_UNIT_UNITS;

function bandCountFor(yearCount: number): number {
  return yearCount > 1 ? Math.floor((yearCount - 1) / GRID.bandEveryRows) : 0;
}

/**
 * Fraccion del paso que ocupa la banda. Se deriva del caso de referencia en vez de
 * guardarse redondeada, por la misma razon que los margenes: un decimal cortado hace que
 * el lienzo aprobado deje de reproducirse exacto.
 */
const BAND_GAP_RATIO = (() => {
  const reference = T.landscape.gridBox.referenceLifeYears;
  const bands = bandCountFor(reference);
  const referencePitch = (BOX_YEAR_UNITS - bands * GRID.bandGapPx) / reference;
  return GRID.bandGapPx / referencePitch;
})();

export interface GridGeometry {
  /** Celdas del eje de unidad: 52. Fijo. */
  readonly unitCount: number;
  /** Celdas del eje de anios. Igual a lifeYears. */
  readonly yearCount: number;
  /** Total de celdas dibujadas. */
  readonly totalCells: number;
  /** Paso del eje de anios, en unidades de diseno. */
  readonly yearPitch: number;
  /** Paso del eje de unidad, en unidades de diseno. */
  readonly unitPitch: number;
  /** Cada cuantas celdas del eje de anios entra una banda de aire. */
  readonly bandEvery: number;
  /** Ancho de la banda, en unidades de diseno. Proporcional al paso. */
  readonly bandGap: number;
  /** Cuantas bandas entran. */
  readonly bandCount: number;
}

export function geometry(lifeYears: number): GridGeometry {
  const unitCount = GRID.columns;
  const totalCells = lifeYears * UNITS_PER_YEAR;
  const yearCount = Math.ceil(totalCells / unitCount);
  const bandCount = bandCountFor(yearCount);

  // Despeje de la ecuacion del encabezado: mantiene la caja en 466 exactas.
  const yearPitch = BOX_YEAR_UNITS / (yearCount + bandCount * BAND_GAP_RATIO);

  return {
    unitCount,
    yearCount,
    totalCells,
    yearPitch,
    unitPitch: BOX_UNIT_UNITS / unitCount,
    bandEvery: GRID.bandEveryRows,
    bandGap: yearPitch * BAND_GAP_RATIO,
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
