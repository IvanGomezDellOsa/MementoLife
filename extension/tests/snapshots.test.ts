/**
 * Snapshots — el gate de regresión visual, en formato digest.
 *
 * Snapshotear el SVG entero pesaba 250 KB por fixture y el diff era ilegible: el path del
 * pasado son miles de círculos en una sola línea. El digest conserva la detección —un hash
 * por path cambia con cualquier coordenada— y pone en claro lo que uno realmente quiere
 * leer en un diff: geometría, colores, opacidades y cada línea de texto.
 *
 * Si un cambio de diseño es intencional, se actualizan con `vitest -u` y se revisan en el
 * diff antes de commitear.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { render } from "../src/core/render.js";
import type { RenderResult } from "../src/core/render.js";
import { efemerideFor } from "../src/core/efemerides.js";
import { EFEMERIDES as ES } from "../src/data/efemerides.es.js";
import { EFEMERIDES as EN } from "../src/data/efemerides.en.js";
import { EFEMERIDES as FR } from "../src/data/efemerides.fr.js";
import { EFEMERIDES as PT } from "../src/data/efemerides.pt.js";
import { EFEMERIDES as IT } from "../src/data/efemerides.it.js";
import { EFEMERIDES as DE } from "../src/data/efemerides.de.js";
import type { Locale, Theme } from "../src/core/tokens.js";

const EFEMERIDE_TABLES: { readonly [K in Locale]: readonly string[] } = {
  es: ES,
  en: EN,
  fr: FR,
  pt: PT,
  it: IT,
  de: DE,
};

interface Fixture {
  readonly id: string;
  readonly note?: string;
  readonly theme: Theme;
  readonly locale: Locale;
  readonly birthDate: string;
  readonly today: string;
  readonly lifeYears: number;
  readonly efemerideEnabled: boolean;
  readonly viewport: { readonly widthPx: number; readonly heightPx: number };
}

const fixtures: readonly Fixture[] = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "..", "render-core", "fixtures.json"), "utf8"),
).fixtures;

/** "1990-01-01" -> {year, month, day}. Sin Date, para no arrastrar husos horarios. */
function parseDate(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year: year ?? 0, month: month ?? 1, day: day ?? 1 };
}

function renderFixture(fixture: Fixture): RenderResult {
  const today = parseDate(fixture.today);
  return render({
    theme: fixture.theme,
    locale: fixture.locale,
    lifeYears: fixture.lifeYears,
    birthDate: parseDate(fixture.birthDate),
    today,
    efemerideText: fixture.efemerideEnabled
      ? efemerideFor(EFEMERIDE_TABLES[fixture.locale], today)
      : null,
    viewport: fixture.viewport,
  });
}

function sha(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

/** Cada celda arranca con "M"; contarlas es contar celdas. */
function cellCount(path: string): number {
  return path === "" ? 0 : path.split("M").length - 1;
}

function edgeCell(path: string, which: "first" | "last"): string {
  const parts = path.split("M");
  if (parts.length < 2) return "-";
  return `M${(which === "first" ? parts[1] : parts[parts.length - 1]) ?? ""}`;
}

function describePath(name: string, path: string): string {
  if (path === "") return `  ${name.padEnd(7)} vacio`;
  return [
    `  ${name.padEnd(7)} celdas=${String(cellCount(path)).padEnd(5)} sha=${sha(path)}`,
    `          primera ${edgeCell(path, "first")}`,
    `          ultima  ${edgeCell(path, "last")}`,
  ].join("\n");
}

function digest(fixture: Fixture, result: RenderResult): string {
  const { originX, originY, geometry: g, metrics: m } = result.layout.grid;
  const layout = result.layout;

  const textBlock = layout.lines
    .filter((line) => line.text !== "")
    .map((line) => {
      const ls = line.letterSpacingPx !== 0 ? ` ls=${line.letterSpacingPx.toFixed(2)}` : "";
      return (
        `  ${line.role.padEnd(9)} x=${line.x.toFixed(2).padStart(8)} y=${line.y.toFixed(2).padStart(8)}` +
        ` size=${line.sizePx.toFixed(2).padStart(6)} peso=${line.weight} op=${line.opacity}${ls}\n` +
        `            "${line.text}"`
      );
    })
    .join("\n");

  const elements = (result.svg.match(/<(rect|path|text)\b/g) ?? []).length;
  const aspect = (m.yearPitch / m.weekPitch).toFixed(4);
  const rule =
    layout.rule === null ? "no" : `y ${layout.rule.y.toFixed(2)} op ${layout.rule.opacity}`;

  return [
    `fixture      ${fixture.id}`,
    `viewport     ${fixture.viewport.widthPx} x ${fixture.viewport.heightPx}`,
    `tema         ${fixture.theme}   idioma ${fixture.locale}   lifeYears ${fixture.lifeYears}`,
    `typeScale    ${layout.typeScale.toFixed(6)}`,
    ``,
    `grilla`,
    `  origen     ${originX.toFixed(2)}, ${originY.toFixed(2)}`,
    `  tamano     ${m.widthPx.toFixed(2)} x ${m.heightPx.toFixed(2)}`,
    `  celda      ${m.yearPitch.toFixed(4)} x ${m.weekPitch.toFixed(4)}  (aspecto ${aspect})`,
    `  hueco      ${m.gapPx.toFixed(2)} px`,
    `  punto r    ${m.dotRadius.toFixed(2)}`,
    `  anillo     r ${m.ringRadius.toFixed(2)} trazo ${m.ringStroke.toFixed(2)}`,
    `  celdas     ${g.totalCells} (${g.yearCount} anios x ${g.weekCount} semanas)`,
    `  banda      ${m.bandGap.toFixed(2)} px x ${g.bandCount}`,
    `  opacidad   pasado ${layout.pastOpacity} futuro ${layout.futureOpacity}`,
    ``,
    `columna      x ${layout.column.x.toFixed(2)} ancho ${layout.column.widthPx.toFixed(2)}`,
    `filete       ${rule}`,
    ``,
    `paths`,
    describePath("pasado", result.paths.past),
    describePath("futuro", result.paths.future),
    describePath("anillo", result.paths.ring),
    ``,
    `textos`,
    textBlock,
    ``,
    `svg          ${elements} elementos, ${result.svg.length} caracteres`,
    `svg sha      ${sha(result.svg)}`,
    ``,
  ].join("\n");
}

describe("snapshots por fixture", () => {
  it("cubre los 12 fixtures del repo", () => {
    expect(fixtures).toHaveLength(12);
  });

  for (const fixture of fixtures) {
    it(fixture.id, async () => {
      await expect(digest(fixture, renderFixture(fixture))).toMatchFileSnapshot(
        `./snapshots/${fixture.id}.txt`,
      );
    });
  }
});

describe("propiedades que valen para todos los fixtures", () => {
  for (const fixture of fixtures) {
    it(`${fixture.id}: el DOM queda en pocos nodos, no uno por celda`, () => {
      const result = renderFixture(fixture);
      const elements = result.svg.match(/<(rect|path|text)\b/g) ?? [];
      expect(elements.length).toBeLessThan(20);
      expect(result.svg).not.toMatch(/<circle/);
    });

    it(`${fixture.id}: todas las celdas quedan repartidas entre pasado, futuro y anillo`, () => {
      const result = renderFixture(fixture);
      const total =
        cellCount(result.paths.past) + cellCount(result.paths.future) + cellCount(result.paths.ring);
      expect(total).toBe(result.layout.grid.geometry.totalCells);
    });

    it(`${fixture.id}: la grilla entra en el viewport`, () => {
      const result = renderFixture(fixture);
      const { originX, originY, metrics } = result.layout.grid;
      expect(originX).toBeGreaterThanOrEqual(-0.5);
      expect(originY).toBeGreaterThanOrEqual(-0.5);
      expect(originX + metrics.widthPx).toBeLessThanOrEqual(fixture.viewport.widthPx + 0.5);
      expect(originY + metrics.heightPx).toBeLessThanOrEqual(fixture.viewport.heightPx + 0.5);
    });
  }
});
