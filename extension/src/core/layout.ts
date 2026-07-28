/**
 * layout.ts — composición editorial.
 *
 * ── Qué cambió, y por qué ─────────────────────────────────────────────────────────
 *
 * 1. SE ELIMINÓ EL RELOJ. En una pantalla de bloqueo el reloj es la razón por la que mirás
 *    la pantalla; en una pestaña nueva es redundante —el sistema ya muestra la hora— y a
 *    78 px se llevaba toda la jerarquía sin decir nada. Su lugar lo ocupa el porcentaje,
 *    que es el dato que este producto existe para mostrar.
 *
 * 2. LA COLUMNA ES UN BLOQUE, NO DOS ISLAS. Antes había fecha y reloj arriba, pie y
 *    efeméride abajo, con ~400 px de vacío en el medio que crecía con la pantalla. Ahora
 *    las cuatro piezas forman un bloque que se centra contra la grilla, y el aire queda
 *    como margen en vez de como agujero.
 *
 * 3. EL FILETE separa el dato del contenido sin agregar una sola palabra.
 *
 * Hay una sola composición. La anterior tenía dos (B apaisada y A centrada) porque la
 * grilla tenía un aspecto fijo y en pantallas verticales no entraba; con la geometría
 * dirigida por la celda la grilla se adapta sola, así que el segundo régimen sobra.
 */

import { geometry, metricsFor } from "./geometry.js";
import type { GridGeometry, GridMetrics } from "./geometry.js";
import { LAYOUT, RESPONSIVE, TYPE, clamp } from "./tokens.js";
import type { Theme } from "./tokens.js";
import { futureOpacity, pastOpacity } from "./tokens.js";
import { wrapText } from "./text.js";

export type TextRole = "date" | "hero" | "sub" | "efemeride";

export interface Viewport {
  readonly widthPx: number;
  readonly heightPx: number;
}

export interface TextLine {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly sizePx: number;
  readonly weight: number;
  readonly opacity: number;
  readonly letterSpacingPx: number;
  readonly role: TextRole;
}

/** El filete que separa el dato de la efeméride. */
export interface Rule {
  readonly x: number;
  readonly y: number;
  readonly widthPx: number;
  readonly opacity: number;
}

export interface LayoutInput {
  readonly viewport: Viewport;
  readonly theme: Theme;
  readonly lifeYears: number;
  readonly dateText: string;
  /** "42 %". Cadena vacía mientras no haya fecha de nacimiento. */
  readonly heroText: string;
  /** "semana 1742 de 4160". */
  readonly subText: string;
  readonly efemerideText: string | null;
}

export interface LayoutResult {
  readonly grid: {
    readonly originX: number;
    readonly originY: number;
    readonly geometry: GridGeometry;
    readonly metrics: GridMetrics;
  };
  readonly lines: readonly TextLine[];
  readonly rule: Rule | null;
  /** Columna tipográfica, para que el onboarding se ubique encima. */
  readonly column: { readonly x: number; readonly widthPx: number };
  readonly pastOpacity: number;
  readonly futureOpacity: number;
  /** Escala tipográfica aplicada. 1 = lienzo de referencia. */
  readonly typeScale: number;
}

const REFERENCE_HEIGHT =
  LAYOUT.canvas.refHeightPx - 2 * LAYOUT.canvas.refHeightPx * LAYOUT.marginRatio.vertical;

export function resolveLayout(input: LayoutInput): LayoutResult {
  const { widthPx: vw, heightPx: vh } = input.viewport;

  const vMargin = clamp(
    vh * LAYOUT.marginRatio.vertical,
    LAYOUT.marginClampPx.verticalMin,
    LAYOUT.marginClampPx.verticalMax,
  );
  const hMargin = clamp(
    vw * LAYOUT.marginRatio.horizontal,
    LAYOUT.marginClampPx.horizontalMin,
    LAYOUT.marginClampPx.horizontalMax,
  );

  const availH = Math.max(0, vh - 2 * vMargin);
  const availW = Math.max(0, vw - 2 * hMargin);

  // La escala tipográfica sale del alto disponible, que es lo que gobierna la grilla.
  const typeScale = availH / REFERENCE_HEIGHT;
  const size = (base: number, limits: { min: number; max: number }): number =>
    clamp(base * typeScale, limits.min, limits.max);

  const dateSize = size(TYPE.date.sizePx, TYPE.clampPx.date);
  const heroSize = size(TYPE.hero.sizePx, TYPE.clampPx.hero);
  const subSize = size(TYPE.sub.sizePx, TYPE.clampPx.sub);
  const efemSize = size(TYPE.efemeride.sizePx, TYPE.clampPx.efemeride);

  // La columna crece con la pantalla pero acotada: pasada cierta medida, una línea larga se
  // vuelve difícil de seguir.
  const gutter = LAYOUT.gutterPx * typeScale;
  const idealColumn = clamp(LAYOUT.columnWidthPx * typeScale, LAYOUT.columnMinPx, LAYOUT.columnMaxPx);

  // La grilla tiene derecho a un mínimo del ancho: sin esto, en una ventana angosta la
  // columna se lo comía entero y la grilla quedaba en cero.
  const columnCeiling = availW - gutter - availW * LAYOUT.minGridWidthRatio;
  const columnW = Math.min(idealColumn, Math.max(0, columnCeiling));

  // Si ni siquiera entra una columna legible, las dos piezas se apilan en vez de convivir.
  const stacked = columnW < LAYOUT.columnMinPx;

  const showEfemeride = input.efemerideText !== null && vh >= RESPONSIVE.hideEfemerideBelowVhPx;
  const showSub = input.subText !== "" && vh >= RESPONSIVE.hideSubBelowVhPx;

  const g = geometry(input.lifeYears);
  const textWidth = stacked ? availW : columnW;

  const lines: TextLine[] = [];
  const efemLines = showEfemeride && input.efemerideText !== null
    ? wrapText(input.efemerideText, textWidth, efemSize)
    : [];
  const efemLineHeight = efemSize * TYPE.efemeride.lineHeightMultiplier;

  // Alto del bloque, para centrarlo contra la grilla.
  const heroGapAbove = TYPE.hero.gapAbovePx * typeScale;
  const heroGapBelow = TYPE.hero.gapBelowPx * typeScale;
  const ruleGapAbove = TYPE.rule.gapAbovePx * typeScale;
  const ruleGapBelow = TYPE.rule.gapBelowPx * typeScale;

  const blockHeight =
    heroGapAbove +
    heroSize +
    (showSub ? heroGapBelow + subSize : 0) +
    (efemLines.length > 0 ? ruleGapAbove + 1 + ruleGapBelow + efemLines.length * efemLineHeight : 0);

  // La grilla se queda con lo que sobra: a la derecha de la columna, o abajo si se apila.
  const gridAvailW = stacked ? availW : Math.max(0, availW - columnW - gutter);
  const gridAvailH = stacked ? Math.max(0, availH - blockHeight - gutter) : availH;
  const m = metricsFor(g, gridAvailW, gridAvailH);

  // Centrada en el espacio que le toca. Con lifeYears alto ocupa todo y el centrado es
  // indistinguible de alinear al margen; con lifeYears bajo evita que quede varada.
  const gridLeft = stacked ? hMargin : hMargin + columnW + gutter;
  const originX = gridLeft + (gridAvailW - m.widthPx) / 2;
  const originY = stacked
    ? vMargin + blockHeight + gutter + (gridAvailH - m.heightPx) / 2
    : vMargin + (availH - m.heightPx) / 2;

  const colX = hMargin;
  let y = (stacked ? vMargin : originY + (m.heightPx - blockHeight) / 2) + dateSize * 1.1;

  lines.push({
    x: colX,
    y,
    text: input.dateText,
    sizePx: dateSize,
    weight: TYPE.date.weight,
    opacity: TYPE.date.opacity,
    letterSpacingPx: TYPE.date.letterSpacingPx * typeScale,
    role: "date",
  });

  y += heroSize;
  if (input.heroText !== "") {
    lines.push({
      x: colX,
      y,
      text: input.heroText,
      sizePx: heroSize,
      weight: TYPE.hero.weight,
      opacity: TYPE.hero.opacity,
      letterSpacingPx: 0,
      role: "hero",
    });
  }

  if (showSub) {
    y += heroGapBelow;
    lines.push({
      x: colX,
      y,
      text: input.subText,
      sizePx: subSize,
      weight: TYPE.sub.weight,
      opacity: TYPE.sub.opacity,
      letterSpacingPx: TYPE.sub.letterSpacingPx * typeScale,
      role: "sub",
    });
  }

  let rule: Rule | null = null;
  if (efemLines.length > 0) {
    y += ruleGapAbove;
    rule = { x: colX, y, widthPx: textWidth, opacity: TYPE.rule.opacity };
    y += ruleGapBelow;
    efemLines.forEach((line, index) => {
      lines.push({
        x: colX,
        y: y + index * efemLineHeight,
        text: line,
        sizePx: efemSize,
        weight: TYPE.efemeride.weight,
        opacity: TYPE.efemeride.opacity,
        letterSpacingPx: 0,
        role: "efemeride",
      });
    });
  }

  return {
    grid: { originX, originY, geometry: g, metrics: m },
    lines,
    rule,
    column: { x: colX, widthPx: textWidth },
    pastOpacity: pastOpacity(input.theme),
    futureOpacity: futureOpacity(input.theme),
    typeScale,
  };
}
