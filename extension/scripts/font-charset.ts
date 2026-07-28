/**
 * font-charset.ts — calcula el conjunto EXACTO de caracteres que la extension puede llegar
 * a dibujar, y lo escribe en scripts/font-charset.txt para que lo consuma pyftsubset.
 *
 * Existe porque subsetear "latin + latin-ext a ojo" es una apuesta. El conjunto se deriva
 * de tres fuentes, ninguna asumida:
 *
 *   1. Los 732 textos del dataset (366 es + 366 en), leidos de content/efemerides/.
 *   2. Los nombres de dia y mes que produce Intl en es y en, GENERADOS con Intl, no
 *      escritos a mano: es lo que el navegador va a pedirle a la fuente en tiempo real.
 *   3. Un set explicito de UI y de formato.
 *
 * El punto 3 no es opcional: ":" (reloj 07:41), "%" y "·" (pie "42 % · semana 1743 de 4160")
 * NO aparecen en ninguna de las 732 entradas. Un subset hecho solo con el dataset dejaria
 * el reloj sin dos puntos.
 *
 * Se corre con `node scripts/font-charset.ts`; subset-font.sh lo invoca antes de subsetear.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SCRIPT_DIR = import.meta.dirname;
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const OUT_FILE = join(SCRIPT_DIR, "font-charset.txt");

interface EfemerideEntry {
  readonly text_es?: string;
  readonly text_en?: string;
}

/**
 * ASCII imprimible completo. Son ~95 glifos y cubre de una vez digitos, ":", "%",
 * parentesis, comillas rectas y todo lo que la UI de opciones pueda necesitar sin
 * tener que adivinarlo pieza por pieza.
 */
const ASCII_PRINTABLE = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) =>
  String.fromCodePoint(0x20 + i),
).join("");

/**
 * Extras que no son ASCII y que el producto usa o puede usar:
 *  - acentos y enes del espanol, en ambas cajas
 *  - signos de apertura ¿ ¡ (la UI en espanol de E2 los va a usar)
 *  - · separador del pie · — guion largo del dataset · – guion medio
 *  - comillas tipograficas y puntos suspensivos, por si un texto de UI los trae
 *  - ° y º, habituales en fechas y unidades
 */
const UI_EXTRAS = "áéíóúüñÁÉÍÓÚÜÑ¿¡·—–…“”‘’«»°º";

function readEntries(file: string): readonly EfemerideEntry[] {
  return JSON.parse(readFileSync(join(REPO_ROOT, file), "utf8")) as EfemerideEntry[];
}

/** Nombres de dia y mes tal como los va a pedir Intl en runtime (plan 5.4). */
function intlDateVocabulary(): string {
  let out = "";
  for (const locale of ["es", "en"]) {
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" });
    const month = new Intl.DateTimeFormat(locale, { month: "long" });
    const full = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    // 2024 es bisiesto: 12 meses y los 7 dias de la semana quedan cubiertos.
    for (let m = 0; m < 12; m += 1) {
      const date = new Date(Date.UTC(2024, m, 1));
      out += month.format(date) + full.format(date);
    }
    for (let d = 0; d < 7; d += 1) {
      out += weekday.format(new Date(Date.UTC(2024, 0, 7 + d)));
    }
  }
  return out;
}

function main(): void {
  const chars = new Set<string>();
  const add = (text: string): void => {
    for (const ch of text) chars.add(ch);
  };

  add(ASCII_PRINTABLE);
  add(UI_EXTRAS);

  const intlChars = intlDateVocabulary();
  add(intlChars);

  let datasetCount = 0;
  for (const entry of readEntries("content/efemerides/es.json")) {
    if (entry.text_es !== undefined) {
      add(entry.text_es);
      datasetCount += 1;
    }
  }
  for (const entry of readEntries("content/efemerides/en.json")) {
    if (entry.text_en !== undefined) {
      add(entry.text_en);
      datasetCount += 1;
    }
  }

  // Orden por codepoint: el archivo es determinista, asi que un cambio real en el
  // conjunto se ve como diff en el PR.
  const sorted = [...chars].sort((a, b) => (a.codePointAt(0) ?? 0) - (b.codePointAt(0) ?? 0));
  writeFileSync(OUT_FILE, sorted.join(""), "utf8");

  console.log(
    `font-charset: ${sorted.length} caracteres (${datasetCount} textos del dataset + Intl es/en + UI)`,
  );
}

main();
