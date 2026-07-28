/**
 * Layout y responsive. El test que mas importa es el ultimo: la grilla no se sale del
 * viewport en NINGUN tamano razonable, que es la promesa del plan 5.7.6.
 */

import { describe, expect, it } from "vitest";
import { resolveLayout } from "../src/core/layout.js";
import type { Viewport } from "../src/core/layout.js";
import { BOX_ASPECT } from "../src/core/geometry.js";
import { T } from "../src/core/tokens.js";

const EFEMERIDE =
  "2 de julio, 1937 — La aviadora Amelia Earhart desapareció sobre el océano Pacífico durante su intento de vuelo alrededor del mundo.";

function layoutAt(widthPx: number, heightPx: number, efemeride: string | null = EFEMERIDE) {
  return resolveLayout({
    viewport: { widthPx, heightPx },
    dateText: "miércoles, 2 de julio",
    timeText: "07:41",
    footerText: "42 % · semana 1742 de 4160",
    efemerideText: efemeride,
  });
}

describe("lienzo de referencia 1440x720", () => {
  const layout = layoutAt(1440, 720);

  it("usa composicion B", () => {
    expect(layout.composition).toBe("B");
  });

  it("reproduce los valores del plan 5.3", () => {
    // Alto 584 = 720 - 68 - 68, ancho = 584 * 466/326, k = 584/326.
    expect(layout.grid.heightPx).toBeCloseTo(584, 6);
    expect(layout.grid.widthPx).toBeCloseTo(584 * BOX_ASPECT, 6);
    expect(layout.grid.widthPx).toBeCloseTo(834.8, 1);
    expect(layout.grid.k).toBeCloseTo(1.7914, 4);
    expect(layout.typeScale).toBeCloseTo(1, 9);
  });

  it("ancla la grilla al margen derecho y al superior", () => {
    expect(layout.grid.originY).toBeCloseTo(68, 6);
    expect(layout.grid.originX + layout.grid.widthPx).toBeCloseTo(1440 - 88, 6);
    expect(layout.grid.originX).toBeCloseTo(517.2, 1);
  });

  it("la columna tipografica queda en 340 px, como el handoff", () => {
    const starts = layout.lines.map((line) => line.x);
    expect(new Set(starts).size).toBe(1);
    expect(starts[0]).toBeCloseTo(88, 6);
  });

  it("el ultimo baseline de la efemeride cae en el borde inferior de la grilla", () => {
    const efem = layout.lines.filter((line) => line.role === "efemeride");
    expect(efem.length).toBeGreaterThan(1);
    expect(efem[efem.length - 1]?.y).toBeCloseTo(652, 6);
  });

  it("el pie queda 40 px por encima de la primera linea de la efemeride", () => {
    const efem = layout.lines.filter((line) => line.role === "efemeride");
    const footer = layout.lines.find((line) => line.role === "footer");
    expect(footer?.y).toBeCloseTo((efem[0]?.y ?? 0) - 40, 6);
  });
});

describe("efemeride apagada", () => {
  it("el pie se ancla al borde inferior de la grilla y nada mas se mueve", () => {
    const on = layoutAt(1440, 720);
    const off = layoutAt(1440, 720, null);

    expect(off.lines.some((line) => line.role === "efemeride")).toBe(false);
    expect(off.lines.find((line) => line.role === "footer")?.y).toBeCloseTo(652, 6);
    // La grilla, la fecha y la hora no se corren un pixel.
    expect(off.grid).toEqual(on.grid);
    for (const role of ["date", "time"] as const) {
      expect(off.lines.find((l) => l.role === role)?.y).toBeCloseTo(
        on.lines.find((l) => l.role === role)?.y ?? -1,
        6,
      );
    }
  });
});

describe("degradacion de B (desviacion documentada del plan 5.7.5)", () => {
  it("1280x720 se queda en B encogiendo la grilla, en vez de saltar a A", () => {
    const layout = layoutAt(1280, 720);
    expect(layout.composition).toBe("B");
    // Encogio respecto del alto disponible, pero sigue dominando la composicion.
    expect(layout.grid.heightPx).toBeLessThan(584);
    expect(layout.grid.heightPx / (720 - 2 * 68)).toBeGreaterThan(T.landscape.responsive.minGridHeightRatioB);
  });

  it("un portatil 1080p con Windows al 125 % entra a alto completo", () => {
    const layout = layoutAt(1536, 730);
    expect(layout.composition).toBe("B");
    expect(layout.grid.heightPx).toBeCloseTo(730 - 2 * (730 * 0.094444), 0);
  });

  it("una tablet en vertical pasa a composicion A", () => {
    expect(layoutAt(810, 1080).composition).toBe("A");
    expect(layoutAt(768, 1024).composition).toBe("A");
  });

  it("A centra la grilla", () => {
    const layout = layoutAt(810, 1080);
    expect(layout.grid.originX + layout.grid.widthPx / 2).toBeCloseTo(810 / 2, 6);
    expect(layout.lines.every((line) => line.anchor === "middle")).toBe(true);
  });
});

describe("ventanas bajas (plan 5.7.6)", () => {
  it("con vh < 420 se oculta la efemeride y queda el pie", () => {
    const layout = layoutAt(1440, 400);
    expect(layout.showEfemeride).toBe(false);
    expect(layout.showFooter).toBe(true);
    expect(layout.lines.some((line) => line.role === "efemeride")).toBe(false);
  });

  it("mas abajo todavia tambien se oculta el pie", () => {
    const layout = layoutAt(1440, 320);
    expect(layout.showEfemeride).toBe(false);
    expect(layout.showFooter).toBe(false);
  });
});

describe("la grilla nunca se recorta", () => {
  const viewports: readonly Viewport[] = (() => {
    const out: Viewport[] = [];
    for (let w = 480; w <= 3840; w += 64) {
      for (const h of [320, 400, 540, 600, 640, 660, 720, 730, 800, 950, 1024, 1080, 1300, 1600]) {
        out.push({ widthPx: w, heightPx: h });
      }
    }
    return out;
  })();

  it(`se mantiene dentro del viewport en ${viewports.length} tamanos`, () => {
    const offenders: string[] = [];
    for (const viewport of viewports) {
      const layout = layoutAt(viewport.widthPx, viewport.heightPx);
      const g = layout.grid;
      const fits =
        g.originX >= -0.5 &&
        g.originY >= -0.5 &&
        g.originX + g.widthPx <= viewport.widthPx + 0.5 &&
        g.originY + g.heightPx <= viewport.heightPx + 0.5 &&
        g.widthPx > 0 &&
        g.heightPx > 0;
      if (!fits) {
        offenders.push(
          `${viewport.widthPx}x${viewport.heightPx} (${layout.composition}): ` +
            `${g.originX.toFixed(1)},${g.originY.toFixed(1)} ${g.widthPx.toFixed(1)}x${g.heightPx.toFixed(1)}`,
        );
      }
    }
    expect(offenders).toEqual([]);
  });

  it("conserva el aspecto 466:326 en todos esos tamanos", () => {
    for (const viewport of viewports) {
      const g = layoutAt(viewport.widthPx, viewport.heightPx).grid;
      expect(g.widthPx / g.heightPx).toBeCloseTo(BOX_ASPECT, 6);
    }
  });
});

describe("tipografia responsive", () => {
  it("respeta los clamps de los tokens en los extremos", () => {
    for (const [w, h] of [
      [640, 400],
      [1440, 720],
      [3840, 2160],
    ] as const) {
      const layout = layoutAt(w, h);
      const time = layout.lines.find((line) => line.role === "time");
      const date = layout.lines.find((line) => line.role === "date");
      expect(time?.sizePx).toBeGreaterThanOrEqual(T.landscape.responsive.fontClampPx.time.min);
      expect(time?.sizePx).toBeLessThanOrEqual(T.landscape.responsive.fontClampPx.time.max);
      expect(date?.sizePx).toBeGreaterThanOrEqual(T.landscape.responsive.fontClampPx.date.min);
      expect(date?.sizePx).toBeLessThanOrEqual(T.landscape.responsive.fontClampPx.date.max);
    }
  });
});
