/**
 * layout.ts — composicion del lienzo: donde va la grilla y donde va cada texto.
 *
 * DOS DESVIACIONES DEL PLAN, ambas deliberadas y ambas por el mismo motivo: el plan 5.7.5
 * define un unico breakpoint duro ("si no entra, salta a composicion A") y eso produce un
 * salto feo justo en las pantallas mas comunes del publico objetivo.
 *
 *   1. B DEGRADA EN VEZ DE SALTAR. La regla literal del plan hace que 1280x720 caiga a
 *      composicion A: 834,80 + 89,2 + 280 = 1204,00 > 1123,55 de ancho util. Pero si en
 *      vez de saltar se le permite a la grilla encoger un poco (manteniendo el aspecto),
 *      B entra comodo: grilla 754x528, que es el 90 % del alto disponible, con puntos de
 *      3,08 px contra los 3,40 de la referencia. Saltar a A ahi era tirar una composicion
 *      que funcionaba. Lo mismo pasa en 1366x768 y en portatiles con Windows al 125 %,
 *      que es exactamente el caso que hay que cubrir.
 *
 *      A entra recien cuando encoger deja de alcanzar: cuando la grilla bajaria del 62 %
 *      del alto disponible (minGridHeightRatioB). Ahi B ya no es "la grilla usando todo el
 *      alto", que era su razon de ser, y A centrada se lee mejor.
 *
 *   2. A SE ACOTA POR ALTO ADEMAS DE POR ANCHO. El plan dice "composicion A con la grilla
 *      ajustada al ancho en lugar del alto". Ajustada solo al ancho, en 1280x660 la grilla
 *      pediria 786 px de alto sobre 660 de viewport y se cortaria — y el plan 5.7.6 dice
 *      que la grilla nunca se recorta. Se ajusta por la restriccion que mande de las dos.
 *
 * El resultado practico: B cubre de escritorio a portatil con zoom; A cubre tablets en
 * vertical y ventanas a media pantalla. Nada se recorta en ningun tamano.
 */

import { BOX_ASPECT, BOX_UNIT_UNITS } from "./geometry.js";
import { T } from "./tokens.js";
import { wrapText } from "./text.js";

export type Composition = "A" | "B";
export type TextAnchor = "start" | "middle";

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
  readonly anchor: TextAnchor;
  readonly letterSpacingPx: number;
  /** Etiqueta para tests y depuracion; no se dibuja. */
  readonly role: "date" | "time" | "footer" | "efemeride";
}

export interface LayoutBox {
  readonly originX: number;
  readonly originY: number;
  readonly widthPx: number;
  readonly heightPx: number;
  /** Factor unico de escala de la grilla: alto de la caja / 326. */
  readonly k: number;
}

export interface LayoutInput {
  readonly viewport: Viewport;
  readonly dateText: string;
  readonly timeText: string;
  readonly footerText: string;
  /** null = efemeride apagada o sin dato. */
  readonly efemerideText: string | null;
}

export interface LayoutResult {
  readonly composition: Composition;
  readonly grid: LayoutBox;
  readonly lines: readonly TextLine[];
  readonly showFooter: boolean;
  readonly showEfemeride: boolean;
  /** Escala tipografica respecto de la referencia. 1 = lienzo 1440x720. */
  readonly typeScale: number;
}

const L = T.landscape;
const R = L.responsive;
const A = L.compositionA;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Alto de la caja de grilla en el lienzo de referencia: 720 - 68 - 68. */
const REFERENCE_GRID_HEIGHT = L.canvas.refHeightPx - L.layout.marginTopPx - L.layout.marginBottomPx;

/** Ancho de la caja de grilla en el lienzo de referencia. */
const REFERENCE_GRID_WIDTH = REFERENCE_GRID_HEIGHT * BOX_ASPECT;

// Los tres valores que siguen se DERIVAN del lienzo de referencia en vez de guardarse
// como decimales redondeados. Guardar "0.094444" hacia que 1440x720 —el lienzo con el que
// se aprobo el diseno— no se reprodujera exacto: los margenes daban 67,99968 en vez de 68.
// Derivandolos, la referencia sale clavada y ademas desaparecen tres tokens que eran una
// segunda fuente de verdad de algo que ya estaba en los margenes.

/** Margen vertical como fraccion del alto: 68 / 720. */
const VERTICAL_MARGIN_RATIO = L.layout.marginTopPx / L.canvas.refHeightPx;

/** Margen horizontal como fraccion del ancho: 88 / 1440. */
const HORIZONTAL_MARGIN_RATIO = L.layout.marginRightPx / L.canvas.refWidthPx;

/** Aire entre la columna tipografica y la grilla, tal como queda en la referencia. */
const GUTTER_PX =
  L.canvas.refWidthPx -
  L.layout.marginLeftPx -
  L.layout.marginRightPx -
  REFERENCE_GRID_WIDTH -
  L.layout.typeColumnWidthPx;

export function resolveLayout(input: LayoutInput): LayoutResult {
  const { widthPx: vw, heightPx: vh } = input.viewport;

  const vMargin = clamp(vh * VERTICAL_MARGIN_RATIO, R.verticalMarginMinPx, R.verticalMarginMaxPx);
  const hMargin = clamp(vw * HORIZONTAL_MARGIN_RATIO, R.horizontalMarginMinPx, R.horizontalMarginMaxPx);
  const availW = Math.max(0, vw - 2 * hMargin);
  const availH = Math.max(0, vh - 2 * vMargin);

  // Plan 5.7.6: en ventanas bajas cae primero la efemeride y despues el pie. La grilla
  // nunca se recorta, es lo ultimo que se toca.
  const showEfemeride = input.efemerideText !== null && vh >= R.hideEfemerideBelowVhPx;
  const showFooter = vh >= R.hideFooterBelowVhPx;

  // Ancho natural de B: la grilla toma todo el alto disponible.
  const naturalGridWidth = availH * BOX_ASPECT;
  const needsForTypeColumn = GUTTER_PX + R.typeColumnMinPx;

  if (naturalGridWidth + needsForTypeColumn <= availW) {
    return compositionB(input, { vMargin, hMargin, availW, availH, gridHeight: availH, showFooter, showEfemeride });
  }

  // No entra a alto completo: se encoge la grilla conservando el aspecto.
  const shrunkWidth = availW - needsForTypeColumn;
  const shrunkHeight = shrunkWidth / BOX_ASPECT;

  if (shrunkWidth > 0 && shrunkHeight >= availH * R.minGridHeightRatioB) {
    return compositionB(input, { vMargin, hMargin, availW, availH, gridHeight: shrunkHeight, showFooter, showEfemeride });
  }

  return compositionA(input, { vMargin, hMargin, availW, availH, showFooter, showEfemeride });
}

interface Frame {
  readonly vMargin: number;
  readonly hMargin: number;
  readonly availW: number;
  readonly availH: number;
  readonly showFooter: boolean;
  readonly showEfemeride: boolean;
}

interface FrameB extends Frame {
  readonly gridHeight: number;
}

function compositionB(input: LayoutInput, frame: FrameB): LayoutResult {
  const { vMargin, hMargin, availW, availH, gridHeight, showFooter, showEfemeride } = frame;
  const { widthPx: vw } = input.viewport;

  const gridWidth = gridHeight * BOX_ASPECT;
  const k = gridHeight / BOX_UNIT_UNITS;
  const typeScale = gridHeight / REFERENCE_GRID_HEIGHT;

  // La grilla queda pegada al margen derecho. Si encogio, se centra verticalmente para no
  // dejar todo el aire junto abajo.
  const gridRight = vw - hMargin;
  const originX = gridRight - gridWidth;
  const originY = vMargin + (availH - gridHeight) / 2;
  const gridTop = originY;
  const gridBottom = originY + gridHeight;

  const typeColWidth = clamp(
    availW - gridWidth - GUTTER_PX,
    R.typeColumnMinPx,
    R.typeColumnMaxPx,
  );
  const colX = hMargin;

  const dateSize = clamp(L.typography.date.sizePx * typeScale, R.fontClampPx.date.min, R.fontClampPx.date.max);
  const timeSize = clamp(L.typography.time.sizePx * typeScale, R.fontClampPx.time.min, R.fontClampPx.time.max);
  const footerSize = clamp(L.typography.footer.sizePx * typeScale, R.fontClampPx.footer.min, R.fontClampPx.footer.max);
  const efemSize = clamp(L.typography.efemeride.sizePx * typeScale, R.fontClampPx.efemeride.min, R.fontClampPx.efemeride.max);

  const lines: TextLine[] = [
    {
      x: colX,
      y: gridTop + L.typography.date.baselineFromGridTopPx * typeScale,
      text: input.dateText,
      sizePx: dateSize,
      weight: L.typography.date.weight,
      opacity: L.typography.date.opacity,
      anchor: "start",
      letterSpacingPx: 0,
      role: "date",
    },
    {
      x: colX,
      y: gridTop + L.typography.time.baselineFromGridTopPx * typeScale,
      text: input.timeText,
      sizePx: timeSize,
      weight: L.typography.time.weight,
      opacity: L.typography.time.opacity,
      anchor: "start",
      letterSpacingPx: 0,
      role: "time",
    },
  ];

  // El bloque de efemeride crece HACIA ARRIBA desde el borde inferior de la grilla: el
  // ultimo baseline cae exactamente en gridBottom, sin importar cuantas lineas salgan.
  const efemLineHeight = efemSize * L.typography.efemeride.lineHeightMultiplier;
  const efemLines =
    showEfemeride && input.efemerideText !== null
      ? wrapText(input.efemerideText, typeColWidth, efemSize)
      : [];
  const efemFirstBaseline = gridBottom - (efemLines.length - 1) * efemLineHeight;

  efemLines.forEach((line, index) => {
    lines.push({
      x: colX,
      y: efemFirstBaseline + index * efemLineHeight,
      text: line,
      sizePx: efemSize,
      weight: L.typography.efemeride.weight,
      opacity: 0, // lo completa el renderer segun el tema
      anchor: "start",
      letterSpacingPx: 0,
      role: "efemeride",
    });
  });

  if (showFooter) {
    // Con la efemeride apagada el pie se ancla directo al borde inferior de la grilla y
    // nada mas se mueve (plan 5.3).
    const footerY =
      efemLines.length > 0
        ? efemFirstBaseline - L.typography.footer.gapAboveEfemeridePx * typeScale
        : gridBottom;
    lines.push({
      x: colX,
      y: footerY,
      text: input.footerText,
      sizePx: footerSize,
      weight: L.typography.footer.weight,
      opacity: L.typography.footer.opacity,
      anchor: "start",
      letterSpacingPx: L.typography.footer.letterSpacingPx * typeScale,
      role: "footer",
    });
  }

  return {
    composition: "B",
    grid: { originX, originY, widthPx: gridWidth, heightPx: gridHeight, k },
    lines,
    showFooter,
    showEfemeride: efemLines.length > 0,
    typeScale,
  };
}

function compositionA(input: LayoutInput, frame: Frame): LayoutResult {
  const { vMargin, availW, availH, showFooter, showEfemeride } = frame;
  const { widthPx: vw } = input.viewport;

  // La escala tipografica de A sale del alto disponible, no del tamano final de la grilla:
  // asi no hay circularidad (las fuentes definen cuanto alto le queda a la grilla).
  const typeScale = availH / REFERENCE_GRID_HEIGHT;

  const dateSize = clamp(A.typography.date.sizePx * typeScale, R.fontClampPx.date.min, R.fontClampPx.date.max);
  const timeSize = clamp(A.typography.time.sizePx * typeScale, R.fontClampPx.time.min, R.fontClampPx.time.max);
  const footerSize = clamp(A.typography.footer.sizePx * typeScale, R.fontClampPx.footer.min, R.fontClampPx.footer.max);
  const efemSize = clamp(A.typography.efemeride.sizePx * typeScale, R.fontClampPx.efemeride.min, R.fontClampPx.efemeride.max);

  const centerX = vw / 2;
  const efemMaxWidth = Math.min(A.efemerideMaxWidthPx * typeScale, availW);
  const efemLineHeight = efemSize * L.typography.efemeride.lineHeightMultiplier;
  const efemLines =
    showEfemeride && input.efemerideText !== null
      ? wrapText(input.efemerideText, efemMaxWidth, efemSize)
      : [];

  // Se arma la pila en coordenadas relativas al borde superior de la grilla (gridTop = 0)
  // y recien al final se centra verticalmente el bloque entero.
  //
  // Anclar la pila al margen superior, que es lo que sale de trasladar los offsets del
  // lienzo de referencia, deja la composicion pesada arriba: cuando la grilla queda
  // limitada por el ANCHO —que es el caso normal en una tablet en vertical— sobra alto sin
  // usar y todo el aire se acumula abajo. En 810x1080 eran ~145 px de banda muerta.
  const dateOffset = (A.dateBaselineFromTopPx - A.gridTopFromTopPx) * typeScale;
  const timeOffset = (A.timeBaselineFromTopPx - A.gridTopFromTopPx) * typeScale;

  // Altura aproximada de mayusculas y de descendentes: alcanza para centrar un bloque.
  const capHeight = 0.72;
  const descender = 0.24;

  const aboveGrid = -dateOffset + dateSize * capHeight;
  const belowGrid =
    (showFooter ? A.footerGapBelowGridPx * typeScale + footerSize : 0) +
    (efemLines.length > 0
      ? A.efemerideGapBelowFooterPx * typeScale + efemSize + (efemLines.length - 1) * efemLineHeight
      : 0) +
    efemSize * descender;

  const gridAvailH = Math.max(0, availH - aboveGrid - belowGrid);

  // La correccion del plan: se respeta la restriccion que mande de las dos, para que la
  // grilla no se recorte nunca.
  const gridWidth = Math.min(availW, gridAvailH * BOX_ASPECT);
  const gridHeight = gridWidth / BOX_ASPECT;
  const k = gridHeight / BOX_UNIT_UNITS;

  const contentHeight = aboveGrid + gridHeight + belowGrid;
  const gridTop = vMargin + (availH - contentHeight) / 2 + aboveGrid;

  const dateBaseline = gridTop + dateOffset;
  const timeBaseline = gridTop + timeOffset;
  const originX = centerX - gridWidth / 2;
  const originY = gridTop;
  const gridBottom = originY + gridHeight;

  const lines: TextLine[] = [
    {
      x: centerX,
      y: dateBaseline,
      text: input.dateText,
      sizePx: dateSize,
      weight: L.typography.date.weight,
      opacity: L.typography.date.opacity,
      anchor: "middle",
      letterSpacingPx: 0,
      role: "date",
    },
    {
      x: centerX,
      y: timeBaseline,
      text: input.timeText,
      sizePx: timeSize,
      weight: L.typography.time.weight,
      opacity: L.typography.time.opacity,
      anchor: "middle",
      letterSpacingPx: 0,
      role: "time",
    },
  ];

  let cursorY = gridBottom;
  if (showFooter) {
    cursorY += A.footerGapBelowGridPx * typeScale + footerSize;
    lines.push({
      x: centerX,
      y: cursorY,
      text: input.footerText,
      sizePx: footerSize,
      weight: L.typography.footer.weight,
      opacity: L.typography.footer.opacity,
      anchor: "middle",
      letterSpacingPx: L.typography.footer.letterSpacingPx * typeScale,
      role: "footer",
    });
  }

  if (efemLines.length > 0) {
    const firstBaseline = cursorY + A.efemerideGapBelowFooterPx * typeScale + efemSize;
    efemLines.forEach((line, index) => {
      lines.push({
        x: centerX,
        y: firstBaseline + index * efemLineHeight,
        text: line,
        sizePx: efemSize,
        weight: L.typography.efemeride.weight,
        opacity: 0, // lo completa el renderer segun el tema
        anchor: "middle",
        letterSpacingPx: 0,
        role: "efemeride",
      });
    });
  }

  return {
    composition: "A",
    grid: { originX, originY, widthPx: gridWidth, heightPx: gridHeight, k },
    lines,
    showFooter,
    showEfemeride: efemLines.length > 0,
    typeScale,
  };
}
