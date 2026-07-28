/**
 * render.ts — arma el SVG completo. Es la unica funcion que el resto de la extension
 * necesita llamar.
 *
 * Puro de punta a punta: misma entrada, misma cadena de salida, en cualquier equipo. Eso
 * es lo que permite que los snapshots SVG reemplacen a los goldens PNG como gate de
 * regresion — es texto, no pixeles, asi que no hay antialiasing ni umbrales de tolerancia,
 * y el diff de un PR muestra exactamente que coordenada se movio.
 */

import { formatDate, formatTime } from "./format.js";
import { gridPaths } from "./grid.js";
import type { GridPaths } from "./grid.js";
import { lifeStats } from "./lifemath.js";
import type { CalendarDate, LifeStats } from "./lifemath.js";
import { footerText } from "./lifemath.js";
import { resolveLayout } from "./layout.js";
import type { LayoutResult, TextLine, Viewport } from "./layout.js";
import { escapeXml } from "./text.js";
import { background, futureOpacity, ink, pastOpacity } from "./tokens.js";
import type { Locale, Theme } from "./tokens.js";

export interface RenderRequest {
  readonly theme: Theme;
  readonly locale: Locale;
  readonly lifeYears: number;
  /** null = todavia no hay fecha de nacimiento: grilla entera en estado futuro (plan 6.4). */
  readonly birthDate: CalendarDate | null;
  readonly today: CalendarDate;
  readonly hour: number;
  readonly minute: number;
  readonly efemerideText: string | null;
  readonly viewport: Viewport;
}

export interface RenderResult {
  readonly svg: string;
  readonly layout: LayoutResult;
  readonly stats: LifeStats | null;
  /** Radio del punto en px. Lo consume el informe de diseno. */
  readonly dotRadius: number;
  /** Los tres paths acumulados. Lo consume el digest de snapshot. */
  readonly paths: GridPaths;
}

function n(value: number): string {
  return value.toFixed(2);
}

function textElement(line: TextLine, inkColor: string): string {
  const spacing = line.letterSpacingPx !== 0 ? ` letter-spacing="${n(line.letterSpacingPx)}"` : "";
  return (
    `<text x="${n(line.x)}" y="${n(line.y)}" font-size="${n(line.sizePx)}" ` +
    `font-weight="${line.weight}" fill="${inkColor}" opacity="${line.opacity}" ` +
    `text-anchor="${line.anchor}"${spacing}>${escapeXml(line.text)}</text>`
  );
}

export function render(request: RenderRequest): RenderResult {
  const { theme, locale, lifeYears, birthDate, today, viewport } = request;

  const stats = birthDate === null ? null : lifeStats(birthDate, today, lifeYears);

  const layout = resolveLayout({
    viewport,
    theme,
    dateText: formatDate(today, locale),
    timeText: formatTime(request.hour, request.minute),
    // Sin fecha de nacimiento no hay pie que mostrar: el bloque de onboarding ocupa ese lugar.
    footerText: stats === null ? "" : footerText(locale, stats),
    efemerideText: request.efemerideText,
  });

  const paths = gridPaths({
    lifeYears,
    currentIndex: stats === null ? null : stats.currentIndex,
    originX: layout.grid.originX,
    originY: layout.grid.originY,
    k: layout.grid.k,
    transposed: true,
  });

  const inkColor = ink(theme);
  const parts: string[] = [
    `<rect width="${n(viewport.widthPx)}" height="${n(viewport.heightPx)}" fill="${background(theme)}"/>`,
  ];

  // Tres <path> acumulados, no un elemento por celda: con lifeYears=100 en semanas eso es
  // 3 nodos en vez de 5200.
  if (paths.past !== "") {
    parts.push(`<path d="${paths.past}" fill="${inkColor}" opacity="${pastOpacity(theme)}"/>`);
  }
  if (paths.future !== "") {
    parts.push(`<path d="${paths.future}" fill="${inkColor}" opacity="${futureOpacity(theme)}"/>`);
  }
  if (paths.ring !== "") {
    parts.push(
      `<path d="${paths.ring}" fill="none" stroke="${inkColor}" stroke-width="${n(paths.ringStroke)}"/>`,
    );
  }

  for (const line of layout.lines) {
    if (line.text === "") continue;
    parts.push(textElement(line, inkColor));
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(viewport.widthPx)} ${n(viewport.heightPx)}" ` +
    `width="100%" height="100%" font-family="Fraunces" style="display:block">${parts.join("")}</svg>`;

  return { svg, layout, stats, dotRadius: paths.dotRadius, paths };
}
