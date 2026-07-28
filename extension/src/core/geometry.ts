/**
 * geometry.ts — la geometría de la grilla, dirigida por la CELDA.
 *
 * ── Por qué cambió respecto de la v1 ──────────────────────────────────────────────
 *
 * El handoff de teléfono definía una caja fija de 466 × 326 unidades y sacaba de ahí el
 * tamaño de celda. En una pantalla apaisada eso producía dos defectos:
 *
 *   1. Las celdas quedaban más angostas que altas (12,94 × 14,82 px a 1920×950), y el
 *      hueco horizontal entre puntos caía a 3,96 px sobre puntos de 9 px. A esa proporción
 *      una trama regular deja de leerse como puntos y empieza a centellear.
 *   2. Con lifeYears bajo era peor: la caja seguía midiendo lo mismo pero con menos
 *      columnas, así que las celdas se estiraban hasta parecer rayas verticales.
 *
 * Ahora se elige la celda y la caja es la consecuencia. La celda sale cuadrada, que es lo
 * que reparte el aire por igual en los dos ejes, y con lifeYears bajo la grilla simplemente
 * queda más angosta en vez de deformarse. Los dos defectos desaparecen con el mismo cambio.
 *
 * El invariante viejo ("la caja mide siempre 466 × 326") se reemplaza por dos más fuertes,
 * que son los que los tests verifican:
 *
 *   · la celda conserva su relación de aspecto para cualquier lifeYears del rango;
 *   · la grilla entra siempre en el espacio disponible, sin recortarse.
 */

import { CELL, T, WEEKS_PER_YEAR } from "./tokens.js";

export interface GridGeometry {
  /** Celdas del eje vertical: las 52 semanas del año. Fijo. */
  readonly weekCount: number;
  /** Celdas del eje horizontal: un año por columna. */
  readonly yearCount: number;
  readonly totalCells: number;
  /** Cada cuántos años entra una banda de aire. */
  readonly bandEvery: number;
  readonly bandCount: number;
}

/** Cuántas celdas hay y cómo se agrupan. No depende del tamaño en pantalla. */
export function geometry(lifeYears: number): GridGeometry {
  const bandEvery = T.grid.bandEveryYears;
  return {
    weekCount: WEEKS_PER_YEAR,
    yearCount: lifeYears,
    totalCells: lifeYears * WEEKS_PER_YEAR,
    bandEvery,
    bandCount: lifeYears > 1 ? Math.floor((lifeYears - 1) / bandEvery) : 0,
  };
}

/** Medidas en píxeles de la grilla, una vez que se sabe cuánto espacio hay. */
export interface GridMetrics {
  /** Paso horizontal (un año) en px. */
  readonly yearPitch: number;
  /** Paso vertical (una semana) en px. */
  readonly weekPitch: number;
  /** Ancho de la banda de década en px. */
  readonly bandGap: number;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly dotRadius: number;
  readonly ringRadius: number;
  readonly ringStroke: number;
  /** Aire libre entre dos puntos contiguos en horizontal. El número que importaba. */
  readonly gapPx: number;
}

/**
 * Ajusta la grilla al espacio disponible conservando la celda cuadrada.
 *
 * Primero manda el alto: 52 semanas tienen que entrar sí o sí. Si con ese paso la grilla
 * se pasa de ancho, se reduce todo en bloque — nunca se deforma la celda.
 */
export function metricsFor(g: GridGeometry, availWidthPx: number, availHeightPx: number): GridMetrics {
  let weekPitch = availHeightPx / g.weekCount;
  let yearPitch = weekPitch * CELL.aspect;

  let widthPx = g.yearCount * yearPitch + g.bandCount * yearPitch * CELL.bandGapRatio;
  if (widthPx > availWidthPx && widthPx > 0) {
    const scale = availWidthPx / widthPx;
    weekPitch *= scale;
    yearPitch *= scale;
    widthPx = availWidthPx;
  }

  const dotRadius = (yearPitch * CELL.dotDiameterRatio) / 2;
  return {
    yearPitch,
    weekPitch,
    bandGap: yearPitch * CELL.bandGapRatio,
    widthPx,
    heightPx: g.weekCount * weekPitch,
    dotRadius,
    ringRadius: dotRadius * CELL.ringRadiusRatio,
    ringStroke: dotRadius * CELL.ringStrokeRatio,
    gapPx: yearPitch - 2 * dotRadius,
  };
}

/** Centro de una celda, en píxeles y relativo al origen de la grilla. */
export function cellCenter(
  g: GridGeometry,
  m: GridMetrics,
  index: number,
): { readonly x: number; readonly y: number } {
  const year = Math.floor(index / g.weekCount);
  const week = index % g.weekCount;
  return {
    x: year * m.yearPitch + Math.floor(year / g.bandEvery) * m.bandGap + m.yearPitch / 2,
    y: week * m.weekPitch + m.weekPitch / 2,
  };
}
