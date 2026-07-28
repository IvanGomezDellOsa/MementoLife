/**
 * grid.ts — port de gridFinal() del reference.html, transpuesto.
 *
 * La tecnica del original se conserva entera y es la razon de que esto rinda: en vez de
 * emitir un <circle> por celda, se acumulan TRES cadenas de path — pasado, futuro y
 * anillo — y se emiten tres <path>. Con lifeYears=100 en semanas son 5200 celdas; a un
 * elemento por celda el DOM de la pestana nueva tendria 5200 nodos y se notaria al abrir.
 * Asi tiene 3.
 *
 * Cada punto es un path circular de dos arcos (M ... a ... a ...), igual que el original.
 *
 * Toda coordenada sale con toFixed(2): dos decimales alcanzan de sobra a cualquier escala
 * real y eliminan el ruido de coma flotante, que es lo que hace que los snapshots SVG
 * sirvan como gate de regresion en cualquier sistema operativo.
 */

import { cellCenter, geometry } from "./geometry.js";
import type { GridGeometry } from "./geometry.js";
import { gridVariant } from "./tokens.js";
import type { View } from "./tokens.js";

export interface GridPathsOptions {
  readonly view: View;
  readonly lifeYears: number;
  /**
   * Celda actual. `null` dibuja la grilla entera en estado futuro y sin anillo: es el
   * estado de onboarding, donde el usuario ve que va a obtener antes de dar su fecha
   * (plan 6.4).
   */
  readonly currentIndex: number | null;
  /** Origen de la caja en el lienzo. */
  readonly originX: number;
  readonly originY: number;
  /** Factor unico de escala: alto de la caja en px / 326. */
  readonly k: number;
  /** true = anios en horizontal (apaisado). false = orientacion del handoff. */
  readonly transposed: boolean;
}

export interface GridPaths {
  /** Path acumulado de las celdas ya vividas. */
  readonly past: string;
  /** Path acumulado de las celdas por vivir. */
  readonly future: string;
  /** Path del anillo de la celda actual. Vacio si currentIndex es null. */
  readonly ring: string;
  /** Radio del punto en px, ya escalado. Util para el informe de diseno. */
  readonly dotRadius: number;
  /** Grosor del anillo en px, ya escalado. */
  readonly ringStroke: number;
  readonly geometry: GridGeometry;
}

function circlePath(x: number, y: number, r: number): string {
  const rr = r.toFixed(2);
  const d = (2 * r).toFixed(2);
  const nd = (-2 * r).toFixed(2);
  return `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${rr} ${rr} 0 1 0 ${d} 0a${rr} ${rr} 0 1 0 ${nd} 0`;
}

export function gridPaths(options: GridPathsOptions): GridPaths {
  const { view, lifeYears, currentIndex, originX, originY, k, transposed } = options;
  const variant = gridVariant(view);
  const g = geometry(view, lifeYears);

  const dotRadius = variant.dotRadiusPx * k;
  const ringRadius = variant.currentRingRadiusPx * k;
  const ringStroke = variant.currentRingStrokePx * k;

  const past: string[] = [];
  const future: string[] = [];
  const ring: string[] = [];

  for (let i = 0; i < g.totalCells; i += 1) {
    const { alongYear, alongUnit } = cellCenter(g, i);
    // La transposicion es literalmente esta linea: que eje va a x y cual a y.
    const x = originX + (transposed ? alongYear : alongUnit) * k;
    const y = originY + (transposed ? alongUnit : alongYear) * k;

    if (currentIndex !== null && i === currentIndex) {
      ring.push(circlePath(x, y, ringRadius));
    } else if (currentIndex !== null && i < currentIndex) {
      past.push(circlePath(x, y, dotRadius));
    } else {
      future.push(circlePath(x, y, dotRadius));
    }
  }

  return {
    past: past.join(""),
    future: future.join(""),
    ring: ring.join(""),
    dotRadius,
    ringStroke,
    geometry: g,
  };
}

/** Ancho en px de la caja de grilla para un k dado, segun este transpuesta o no. */
export function gridPixelSize(
  k: number,
  transposed: boolean,
  boxYearUnits: number,
  boxUnitUnits: number,
): { readonly width: number; readonly height: number } {
  return transposed
    ? { width: boxYearUnits * k, height: boxUnitUnits * k }
    : { width: boxUnitUnits * k, height: boxYearUnits * k };
}
