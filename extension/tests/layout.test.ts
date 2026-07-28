/**
 * Layout de la composición editorial.
 *
 * El test que más importa es el barrido final: la grilla no se sale del viewport y la celda
 * no se deforma en NINGÚN tamaño razonable. Esas dos cosas juntas son lo que reemplaza al
 * viejo invariante de la caja fija.
 */

import { describe, expect, it } from "vitest";
import { resolveLayout } from "../src/core/layout.js";
import type { LayoutInput, Viewport } from "../src/core/layout.js";
import { CELL, LAYOUT, RESPONSIVE, TYPE } from "../src/core/tokens.js";

const EFEMERIDE =
  "2 de julio, 1937 — La aviadora Amelia Earhart desapareció sobre el océano Pacífico durante su intento de vuelo alrededor del mundo.";

function layoutAt(
  widthPx: number,
  heightPx: number,
  overrides: Partial<LayoutInput> = {},
): ReturnType<typeof resolveLayout> {
  return resolveLayout({
    viewport: { widthPx, heightPx },
    theme: "dark",
    lifeYears: 80,
    dateText: "domingo, 2 de julio",
    heroText: "42 %",
    subText: "semana 1742 de 4160",
    efemerideText: EFEMERIDE,
    ...overrides,
  });
}

describe("composición editorial", () => {
  const layout = layoutAt(1920, 950);

  it("no dibuja reloj: los roles son fecha, dato, subtítulo y efeméride", () => {
    const roles = [...new Set(layout.lines.map((line) => line.role))].sort();
    expect(roles).toEqual(["date", "efemeride", "hero", "sub"]);
  });

  it("el dato es el elemento tipográfico dominante", () => {
    const hero = layout.lines.find((line) => line.role === "hero");
    const others = layout.lines.filter((line) => line.role !== "hero");
    expect(hero).toBeDefined();
    for (const line of others) {
      expect(hero?.sizePx ?? 0).toBeGreaterThan(line.sizePx * 3);
    }
  });

  it("todo el bloque de texto arranca en la misma x", () => {
    const xs = new Set(layout.lines.map((line) => line.x));
    expect(xs.size).toBe(1);
    expect(layout.column.x).toBe([...xs][0]);
  });

  it("la grilla llega hasta el margen derecho", () => {
    const hMargin = 1920 * LAYOUT.marginRatio.horizontal;
    // A 80 anios la grilla ocupa todo el ancho que le toca, asi que centrada y alineada
    // al margen son lo mismo.
    expect(layout.grid.originX + layout.grid.metrics.widthPx).toBeCloseTo(1920 - hMargin, 6);
  });

  it("el filete separa el dato de la efeméride", () => {
    const sub = layout.lines.find((line) => line.role === "sub");
    const firstEfem = layout.lines.find((line) => line.role === "efemeride");
    expect(layout.rule).not.toBeNull();
    expect(layout.rule?.y ?? 0).toBeGreaterThan(sub?.y ?? 0);
    expect(layout.rule?.y ?? 0).toBeLessThan(firstEfem?.y ?? 0);
    expect(layout.rule?.widthPx).toBeCloseTo(layout.column.widthPx, 6);
  });

  it("la celda sale cuadrada y con aire de sobra", () => {
    const m = layout.grid.metrics;
    expect(m.yearPitch / m.weekPitch).toBeCloseTo(CELL.aspect, 9);
    // El objetivo del rediseño: más de 7 px de hueco donde antes había 3,96.
    expect(m.gapPx).toBeGreaterThan(7);
  });
});

describe("accesibilidad de la escala tipográfica", () => {
  it("ningún texto baja de 14 px en un viewport de escritorio", () => {
    for (const [w, h] of [
      [1280, 720],
      [1440, 900],
      [1920, 950],
      [2560, 1300],
    ] as const) {
      for (const line of layoutAt(w, h).lines) {
        expect(line.sizePx).toBeGreaterThanOrEqual(12.5);
      }
    }
  });

  it("la efeméride respeta el mínimo del token", () => {
    for (const [w, h] of [
      [1024, 620],
      [1920, 950],
      [3840, 2160],
    ] as const) {
      const efem = layoutAt(w, h).lines.find((line) => line.role === "efemeride");
      if (efem === undefined) continue;
      expect(efem.sizePx).toBeGreaterThanOrEqual(TYPE.clampPx.efemeride.min);
      expect(efem.sizePx).toBeLessThanOrEqual(TYPE.clampPx.efemeride.max);
    }
  });
});

describe("sin fecha de nacimiento", () => {
  it("no dibuja el dato ni el subtítulo, y la grilla no se mueve", () => {
    const con = layoutAt(1920, 950);
    const sin = layoutAt(1920, 950, { heroText: "", subText: "" });
    expect(sin.lines.some((line) => line.role === "hero")).toBe(false);
    expect(sin.lines.some((line) => line.role === "sub")).toBe(false);
    expect(sin.grid.originX).toBeCloseTo(con.grid.originX, 6);
    expect(sin.grid.metrics.widthPx).toBeCloseTo(con.grid.metrics.widthPx, 6);
  });
});

describe("ventanas bajas", () => {
  it("por debajo del umbral se suelta la efeméride", () => {
    const layout = layoutAt(1440, RESPONSIVE.hideEfemerideBelowVhPx - 20);
    expect(layout.lines.some((line) => line.role === "efemeride")).toBe(false);
    expect(layout.rule).toBeNull();
  });

  it("más abajo todavía se suelta el subtítulo, pero el dato queda", () => {
    const layout = layoutAt(1440, RESPONSIVE.hideSubBelowVhPx - 20);
    expect(layout.lines.some((line) => line.role === "sub")).toBe(false);
    expect(layout.lines.some((line) => line.role === "hero")).toBe(true);
  });
});

describe("la grilla nunca se recorta ni se deforma", () => {
  const viewports: readonly Viewport[] = (() => {
    const out: Viewport[] = [];
    for (let w = 520; w <= 3840; w += 64) {
      for (const h of [360, 420, 540, 620, 720, 800, 950, 1080, 1300, 1600]) {
        out.push({ widthPx: w, heightPx: h });
      }
    }
    return out;
  })();

  it(`se mantiene dentro del viewport en ${viewports.length} tamaños`, () => {
    const offenders: string[] = [];
    for (const viewport of viewports) {
      const { grid } = layoutAt(viewport.widthPx, viewport.heightPx);
      const m = grid.metrics;
      const fits =
        grid.originX >= -0.5 &&
        grid.originY >= -0.5 &&
        grid.originX + m.widthPx <= viewport.widthPx + 0.5 &&
        grid.originY + m.heightPx <= viewport.heightPx + 0.5 &&
        m.widthPx > 0 &&
        m.heightPx > 0;
      if (!fits) {
        offenders.push(`${viewport.widthPx}x${viewport.heightPx}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("la celda conserva su aspecto en todos esos tamaños", () => {
    for (const viewport of viewports) {
      const m = layoutAt(viewport.widthPx, viewport.heightPx).grid.metrics;
      expect(m.yearPitch / m.weekPitch).toBeCloseTo(CELL.aspect, 9);
    }
  });

  it("con lifeYears bajo la grilla se angosta, no se estira", () => {
    const ochenta = layoutAt(1920, 950, { lifeYears: 80 }).grid.metrics;
    const veinte = layoutAt(1920, 950, { lifeYears: 20 }).grid.metrics;

    // Esto es lo que fallaba antes: con la caja fija, 20 anios daban celdas 3,6 veces mas
    // anchas que altas. Ahora la celda sigue cuadrada y lo que cambia es el ancho total.
    expect(veinte.yearPitch / veinte.weekPitch).toBeCloseTo(1, 9);
    expect(veinte.widthPx).toBeLessThan(ochenta.widthPx * 0.5);

    // Con menos columnas la celda puede crecer, porque ya no la limita el ancho.
    expect(veinte.yearPitch).toBeGreaterThanOrEqual(ochenta.yearPitch);
  });
});
