/**
 * Snapshots — el gate de regresion visual (plan 8.2), en formato digest.
 *
 * El plan pedia snapshotear el SVG entero, con el argumento de que "el diff de un PR
 * muestra exactamente que coordenada se movio". En la practica eso no se cumplia: el path
 * del pasado son 4160 circulos en UNA sola linea de 250 KB, asi que el diff mostraba una
 * linea cambiada e ilegible. Doce archivos asi eran 2,7 MB de los 3 MB del repo.
 *
 * El digest conserva la fuerza de regresion y recupera el beneficio que se buscaba:
 *
 *   - un hash por path detecta CUALQUIER cambio de coordenada, hasta el ultimo decimal;
 *   - el conteo de celdas por estado dice si lo que cambio fue el reparto pasado/futuro;
 *   - la primera y la ultima celda de cada path acotan donde empezo a moverse;
 *   - la geometria (origen, k, radio) y cada linea de texto van en claro, que es lo que
 *     uno realmente quiere leer en un diff.
 *
 * Resultado: ~2 KB por fixture en vez de 250 KB, y un diff que se entiende.
 *
 * Si un cambio de diseno es intencional, se actualizan con `vitest -u` y se revisan en el
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
import type { Locale, Theme } from "../src/core/tokens.js";

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

// Hora fija: la del handoff. El reloj real no entra en el snapshot, obviamente.
const HOUR = 7;
const MINUTE = 41;

function renderFixture(fixture: Fixture): RenderResult {
  const today = parseDate(fixture.today);
  return render({
    theme: fixture.theme,
    locale: fixture.locale,
    lifeYears: fixture.lifeYears,
    birthDate: parseDate(fixture.birthDate),
    today,
    hour: HOUR,
    minute: MINUTE,
    efemerideText: fixture.efemerideEnabled
      ? efemerideFor(fixture.locale === "es" ? ES : EN, today)
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

function firstCell(path: string): string {
  const parts = path.split("M");
  return parts.length > 1 ? `M${parts[1] ?? ""}` : "—";
}

function lastCell(path: string): string {
  const parts = path.split("M");
  return parts.length > 1 ? `M${parts[parts.length - 1] ?? ""}` : "—";
}

function describePath(name: string, path: string): string {
  if (path === "") return `  ${name.padEnd(7)} vacio`;
  return [
    `  ${name.padEnd(7)} celdas=${String(cellCount(path)).padEnd(5)} sha=${sha(path)}`,
    `          primera ${firstCell(path)}`,
    `          ultima  ${lastCell(path)}`,
  ].join("\n");
}

function digest(fixture: Fixture, result: RenderResult): string {
  const g = result.layout.grid;
  const geo = result.paths.geometry;
  const lines = result.layout.lines
    .filter((line) => line.text !== "")
    .map(
      (line) =>
        `  ${line.role.padEnd(9)} x=${line.x.toFixed(2).padStart(8)} y=${line.y.toFixed(2).padStart(8)}` +
        ` size=${line.sizePx.toFixed(2).padStart(6)} peso=${line.weight} op=${line.opacity}` +
        ` anchor=${line.anchor}${line.letterSpacingPx !== 0 ? ` ls=${line.letterSpacingPx.toFixed(2)}` : ""}` +
        `\n            "${line.text}"`,
    );

  const elements = (result.svg.match(/<(rect|path|text)\b/g) ?? []).length;

  return `fixture      ${fixture.id}
viewport     ${fixture.viewport.widthPx} x ${fixture.viewport.heightPx}
tema         ${fixture.theme}   idioma ${fixture.locale}   lifeYears ${fixture.lifeYears}
composicion  ${result.layout.composition}
typeScale    ${result.layout.typeScale.toFixed(6)}

grilla
  origen     ${g.originX.toFixed(2)}, ${g.originY.toFixed(2)}
  tamano     ${g.widthPx.toFixed(2)} x ${g.heightPx.toFixed(2)}
  k          ${g.k.toFixed(6)}
  punto r    ${result.dotRadius.toFixed(2)}
  anillo w   ${result.paths.ringStroke.toFixed(2)}
  celdas     ${geo.totalCells} (${geo.yearCount} anios x ${geo.unitCount} semanas)
  paso anio  ${geo.yearPitch.toFixed(4)} u
  banda      ${geo.bandGap.toFixed(4)} u x ${geo.bandCount}

paths
${describePath("pasado", result.paths.past)}
${describePath("futuro", result.paths.future)}
${describePath("anillo", result.paths.ring)}

textos
${lines.join("\n")}

svg          ${elements} elementos, ${result.svg.length} caracteres
svg sha      ${sha(result.svg)}
`;
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
      // 1 fondo + hasta 3 paths + unas pocas lineas de texto. Nunca miles.
      expect(elements.length).toBeLessThan(20);
      expect(result.svg).not.toMatch(/<circle/);
    });

    it(`${fixture.id}: todas las celdas quedan repartidas entre pasado, futuro y anillo`, () => {
      const result = renderFixture(fixture);
      const total =
        cellCount(result.paths.past) + cellCount(result.paths.future) + cellCount(result.paths.ring);
      expect(total).toBe(result.paths.geometry.totalCells);
    });
  }
});
