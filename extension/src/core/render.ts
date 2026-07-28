/**
 * render.ts — arma el SVG completo. Es la unica funcion que el resto de la extension llama.
 *
 * Puro de punta a punta: misma entrada, misma cadena de salida, en cualquier equipo. Eso es
 * lo que permite que los snapshots reemplacen a los goldens PNG como gate de regresion.
 */

import { formatDate } from "./format.js";
import { gridPaths } from "./grid.js";
import type { GridPaths } from "./grid.js";
import { lifeStats, percentText, unitText } from "./lifemath.js";
import type { CalendarDate, LifeStats } from "./lifemath.js";
import { resolveLayout } from "./layout.js";
import type { LayoutResult, TextLine, Viewport } from "./layout.js";
import { escapeXml } from "./text.js";
import { T, background, dot, ink } from "./tokens.js";
import type { Locale, Theme } from "./tokens.js";

export interface RenderRequest {
  readonly theme: Theme;
  readonly locale: Locale;
  readonly lifeYears: number;
  /** null = todavia no hay fecha de nacimiento: grilla entera en estado futuro. */
  readonly birthDate: CalendarDate | null;
  readonly today: CalendarDate;
  readonly efemerideText: string | null;
  readonly viewport: Viewport;
}

export interface RenderResult {
  readonly svg: string;
  readonly layout: LayoutResult;
  readonly stats: LifeStats | null;
  readonly paths: GridPaths;
}

function n(value: number): string {
  return value.toFixed(2);
}

function textElement(line: TextLine, inkColor: string): string {
  const spacing = line.letterSpacingPx !== 0 ? ` letter-spacing="${n(line.letterSpacingPx)}"` : "";
  return (
    `<text x="${n(line.x)}" y="${n(line.y)}" font-size="${n(line.sizePx)}" ` +
    `font-weight="${line.weight}" fill="${inkColor}" opacity="${line.opacity}"${spacing}>` +
    `${escapeXml(line.text)}</text>`
  );
}

export function render(request: RenderRequest): RenderResult {
  const { theme, locale, lifeYears, birthDate, today, viewport } = request;

  const stats = birthDate === null ? null : lifeStats(birthDate, today, lifeYears);

  const layout = resolveLayout({
    viewport,
    theme,
    lifeYears,
    dateText: formatDate(today, locale),
    heroText: stats === null ? "" : percentText(stats),
    subText: stats === null ? "" : unitText(locale, stats),
    efemerideText: request.efemerideText,
  });

  const paths = gridPaths({
    geometry: layout.grid.geometry,
    metrics: layout.grid.metrics,
    currentIndex: stats === null ? null : stats.currentIndex,
    originX: layout.grid.originX,
    originY: layout.grid.originY,
  });

  const inkColor = ink(theme);
  const dotColor = dot(theme);
  const parts: string[] = [
    `<rect width="${n(viewport.widthPx)}" height="${n(viewport.heightPx)}" fill="${background(theme)}"/>`,
  ];

  // Tres <path> acumulados, no un elemento por celda.
  if (paths.past !== "") {
    parts.push(`<path d="${paths.past}" fill="${dotColor}" opacity="${layout.pastOpacity}"/>`);
  }
  if (paths.future !== "") {
    parts.push(`<path d="${paths.future}" fill="${dotColor}" opacity="${layout.futureOpacity}"/>`);
  }
  if (paths.ring !== "") {
    parts.push(
      `<path d="${paths.ring}" fill="none" stroke="${inkColor}" ` +
        `stroke-width="${n(layout.grid.metrics.ringStroke)}"/>`,
    );
  }

  if (layout.rule !== null) {
    const r = layout.rule;
    parts.push(
      `<rect x="${n(r.x)}" y="${n(r.y)}" width="${n(r.widthPx)}" height="1" ` +
        `fill="${inkColor}" opacity="${r.opacity}"/>`,
    );
  }

  for (const line of layout.lines) {
    if (line.text === "") continue;
    parts.push(textElement(line, inkColor));
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(viewport.widthPx)} ${n(viewport.heightPx)}" ` +
    `width="100%" height="100%" font-family="${T.typography.fontFamily}" style="display:block">` +
    `${parts.join("")}</svg>`;

  return { svg, layout, stats, paths };
}
