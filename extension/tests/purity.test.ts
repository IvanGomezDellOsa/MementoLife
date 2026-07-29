/**
 * El core tiene que seguir siendo puro: sin DOM, sin chrome.*, sin leer el reloj.
 *
 * Es la regla que hace testeable todo lo demas — si un dia alguien mete un `document.` o
 * un `new Date()` en core/, los snapshots dejan de ser deterministicos y el gate de
 * regresion se vuelve mentira. Mejor que falle un test a que se descubra en un diff raro.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CORE_DIR = join(import.meta.dirname, "..", "src", "core");
const files = readdirSync(CORE_DIR).filter((name) => name.endsWith(".ts"));

/** Quita comentarios de bloque y de linea: las menciones en prosa no cuentan. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

const FORBIDDEN: readonly { readonly pattern: RegExp; readonly why: string }[] = [
  { pattern: /\bdocument\s*\./, why: "el core no puede tocar el DOM" },
  { pattern: /\bwindow\s*\./, why: "el core no puede tocar window" },
  { pattern: /\bchrome\s*\./, why: "el core no puede usar las APIs de extension" },
  { pattern: /\blocalStorage\b/, why: "el core no persiste nada" },
  { pattern: /\bnew\s+Date\s*\(\s*\)/, why: "el core no lee el reloj: la fecha entra como parametro" },
  { pattern: /\bDate\s*\.\s*now\s*\(/, why: "el core no lee el reloj" },
  { pattern: /\bMath\s*\.\s*random\s*\(/, why: "el core tiene que ser determinista" },
  { pattern: /\bfetch\s*\(/, why: "cero red, nunca" },
  { pattern: /\bXMLHttpRequest\b/, why: "cero red, nunca" },
];

describe("pureza del core", () => {
  it("encuentra los modulos del core", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const file of files) {
    const code = stripComments(readFileSync(join(CORE_DIR, file), "utf8"));
    for (const { pattern, why } of FORBIDDEN) {
      it(`${file} — ${why}`, () => {
        expect(pattern.test(code)).toBe(false);
      });
    }
  }
});

describe("el render es reproducible", () => {
  it("la misma entrada da exactamente la misma cadena", async () => {
    const { render } = await import("../src/core/render.js");
    const request = {
      theme: "dark",
      locale: "es",
      lifeYears: 80,
      birthDate: { year: 1990, month: 1, day: 1 },
      today: { year: 2023, month: 7, day: 2 },
      efemerideText: "una efemeride cualquiera",
      viewport: { widthPx: 1440, heightPx: 720 },
    } as const;
    expect(render(request).svg).toBe(render(request).svg);
  });
});
