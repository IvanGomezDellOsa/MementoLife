/**
 * Snapshots SVG — el gate de regresion visual (plan 8.2).
 *
 * Reemplazan a los goldens PNG de Robolectric. Son mejores para esto por tres razones:
 * son texto, asi que salen identicos en cualquier sistema operativo (sin antialiasing ni
 * umbrales de tolerancia); el diff de un PR muestra exactamente que coordenada se movio, y
 * no un porcentaje de pixeles distintos; y no hacen falta 13 archivos binarios en el repo.
 *
 * Si un cambio de diseno es intencional, se actualizan con `vitest -u` y se revisan a ojo
 * en el diff antes de commitear.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { render } from "../src/core/render.js";
import { efemerideFor } from "../src/core/efemerides.js";
import { EFEMERIDES as ES } from "../src/data/efemerides.es.js";
import { EFEMERIDES as EN } from "../src/data/efemerides.en.js";
import type { Locale, Theme, View } from "../src/core/tokens.js";

interface Fixture {
  readonly id: string;
  readonly note?: string;
  readonly view: View;
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

describe("snapshots SVG por fixture", () => {
  it("cubre los 15 fixtures del repo", () => {
    expect(fixtures).toHaveLength(15);
  });

  for (const fixture of fixtures) {
    it(fixture.id, async () => {
      const today = parseDate(fixture.today);
      const table = fixture.locale === "es" ? ES : EN;
      const result = render({
        view: fixture.view,
        theme: fixture.theme,
        locale: fixture.locale,
        lifeYears: fixture.lifeYears,
        birthDate: parseDate(fixture.birthDate),
        today,
        hour: HOUR,
        minute: MINUTE,
        efemerideText: fixture.efemerideEnabled ? efemerideFor(table, today) : null,
        viewport: fixture.viewport,
      });

      // Una etiqueta por linea hace el diff legible: si se mueve una coordenada, el diff
      // marca esa linea y no un bloque de 40 KB.
      const pretty = result.svg.replace(/></g, ">\n<");
      await expect(pretty).toMatchFileSnapshot(`./snapshots/${fixture.id}.svg`);
    });
  }
});

describe("propiedades que valen para todos los fixtures", () => {
  for (const fixture of fixtures) {
    it(`${fixture.id}: el DOM queda en pocos nodos, no uno por celda`, () => {
      const today = parseDate(fixture.today);
      const result = render({
        view: fixture.view,
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
      const elements = result.svg.match(/<(rect|path|text)\b/g) ?? [];
      // 1 fondo + hasta 3 paths + unas pocas lineas de texto. Nunca miles.
      expect(elements.length).toBeLessThan(20);
      expect(result.svg).not.toMatch(/<circle/);
    });
  }
});
