/**
 * text.ts — medicion y corte de linea sin DOM.
 *
 * Usa la tabla de anchos de avance extraida del .woff2 realmente empaquetado
 * (scripts/extract-metrics.py). Sirve para dos cosas:
 *
 *   1. Cortar la efemeride en lineas que entren de verdad en la columna tipografica. La
 *      comparativa de diseno estimaba el ancho como "tamano x 0,47"; el ancho real de una
 *      "n" en Fraunces es 0,620 em, asi que esa estimacion se quedaba corta y las lineas
 *      se pasaban del ancho disponible.
 *   2. Saber cuanto mide el pie y la fecha, para poder detectar desbordes.
 *
 * Es una funcion pura sobre una tabla constante: el navegador no mide nada en el arranque
 * y los snapshots SVG salen identicos en cualquier equipo.
 */

import { FONT_METRICS } from "../data/font-metrics.js";

const WIDTHS = FONT_METRICS.widths as Readonly<Record<string, number>>;
const UNITS_PER_EM = FONT_METRICS.unitsPerEm;
const FALLBACK = FONT_METRICS.fallbackWidth;

/** Ancho de un caracter en em. Los que Fraunces no tiene caen a la mediana de la tabla. */
function charWidthEm(char: string): number {
  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) return 0;
  return (WIDTHS[String(codePoint)] ?? FALLBACK) / UNITS_PER_EM;
}

/**
 * Ancho de un texto en px. Interno: el unico consumidor es wrapText.
 *
 * `letterSpacing` se suma una vez por caracter, que es como lo aplica SVG/CSS: tambien
 * despues del ultimo. Importa para el pie, que lleva 1,4 px de tracking.
 */
function measureText(text: string, fontSizePx: number, letterSpacingPx = 0): number {
  let em = 0;
  let count = 0;
  for (const char of text) {
    em += charWidthEm(char);
    count += 1;
  }
  return em * fontSizePx + count * letterSpacingPx;
}

/**
 * Corta el texto en lineas que no superen maxWidthPx.
 *
 * Corta por espacios. Una palabra sola mas ancha que la caja se deja desbordar en vez de
 * partirla: partir palabras en un bloque de 2-3 lineas se lee peor que un desborde que en
 * la practica no ocurre — la palabra mas larga del dataset entra holgada en la columna
 * minima de 280 px.
 */
export function wrapText(
  text: string,
  maxWidthPx: number,
  fontSizePx: number,
  letterSpacingPx = 0,
): string[] {
  const words = text.split(" ").filter((word) => word.length > 0);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current === "" ? word : `${current} ${word}`;
    if (current !== "" && measureText(candidate, fontSizePx, letterSpacingPx) > maxWidthPx) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current !== "") lines.push(current);
  return lines;
}

/** Escapa lo minimo indispensable para que un texto sea contenido valido de <text>. */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
