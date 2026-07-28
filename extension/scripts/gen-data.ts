/**
 * gen-data.ts — convierte los JSON de fuente de verdad en modulos TS.
 *
 *   content/efemerides/es.json     -> src/data/efemerides.es.ts
 *   content/efemerides/en.json     -> src/data/efemerides.en.ts
 *   render-core/design-tokens.json -> src/data/tokens.ts
 *
 * Es el unico paso de "build" real del proyecto (plan 2.1). `src/data/` esta en
 * .gitignore: los JSON no se duplican a mano.
 *
 * El script NO asume que los datos esten bien: valida los invariantes documentados en
 * docs/DATASET-EFEMERIDES.md y aborta con codigo != 0 si alguno se rompe. Una efemeride
 * faltante seria un dia del anio sin texto, y eso tiene que romper el build, no el render.
 *
 * Se corre con `node scripts/gen-data.ts` (Node >= 22.6 hace type-stripping nativo, asi
 * que no hace falta ningun runner como dependencia).
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const SCRIPT_DIR = import.meta.dirname;
const EXTENSION_DIR = resolve(SCRIPT_DIR, "..");
const REPO_ROOT = resolve(EXTENSION_DIR, "..");
const OUT_DIR = join(EXTENSION_DIR, "src", "data");

/** Dias por mes en un anio bisiesto. El dataset cubre el 29/2, asi que la referencia es bisiesta. */
const LEAP_MONTH_LENGTHS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
const DAYS_IN_LEAP_YEAR = 366;

type Locale = "es" | "en";

interface EfemerideEntry {
  readonly month: number;
  readonly day: number;
  readonly year: number;
  readonly text_es?: string;
  readonly text_en?: string;
  readonly category: string;
}

const BANNER = `// ARCHIVO GENERADO por scripts/gen-data.ts — NO EDITAR A MANO.
// Fuente de verdad: los JSON de content/ y render-core/. Regenerar con \`npm run gen:data\`.
`;

function fail(message: string): never {
  console.error(`gen-data: ${message}`);
  process.exit(1);
}

function readJson<T>(relativePath: string): T {
  const absolute = join(REPO_ROOT, relativePath);
  try {
    return JSON.parse(readFileSync(absolute, "utf8")) as T;
  } catch (error) {
    fail(`no se pudo leer ${relativePath}: ${String(error)}`);
  }
}

/**
 * Indice 0..365 de una fecha dentro de un anio bisiesto. Es el orden en el que se emite
 * el array plano: buscar la efemeride del dia es un acceso directo, sin recorrer 366
 * entradas ni cargar las claves month/day en el paquete.
 */
function leapYearDayIndex(month: number, day: number): number {
  let index = 0;
  for (let m = 0; m < month - 1; m += 1) {
    index += LEAP_MONTH_LENGTHS[m] ?? 0;
  }
  return index + day - 1;
}

/**
 * Valida los invariantes del dataset y devuelve los 366 textos en orden de anio bisiesto.
 * Falla si hay huecos, duplicados, fechas fuera de calendario o textos vacios.
 */
function buildEfemerideTable(entries: readonly EfemerideEntry[], locale: Locale): string[] {
  if (entries.length !== DAYS_IN_LEAP_YEAR) {
    fail(`${locale}.json tiene ${entries.length} entradas, se esperaban ${DAYS_IN_LEAP_YEAR}`);
  }

  const table = new Array<string | undefined>(DAYS_IN_LEAP_YEAR).fill(undefined);

  for (const entry of entries) {
    const monthLength = LEAP_MONTH_LENGTHS[entry.month - 1];
    if (monthLength === undefined || entry.day < 1 || entry.day > monthLength) {
      fail(`${locale}.json: fecha fuera de calendario ${entry.month}/${entry.day}`);
    }

    const text = locale === "es" ? entry.text_es : entry.text_en;
    if (text === undefined || text.trim() === "") {
      fail(`${locale}.json: texto vacio en ${entry.month}/${entry.day}`);
    }

    const index = leapYearDayIndex(entry.month, entry.day);
    if (table[index] !== undefined) {
      fail(`${locale}.json: fecha duplicada ${entry.month}/${entry.day}`);
    }
    table[index] = text;
  }

  const missing = table.findIndex((value) => value === undefined);
  if (missing !== -1) {
    fail(`${locale}.json: falta la efemeride del indice ${missing} del anio bisiesto`);
  }

  return table as string[];
}

/** Verifica que ambos idiomas describan las mismas fechas y anios, entrada por entrada. */
function assertLocalesAligned(es: readonly EfemerideEntry[], en: readonly EfemerideEntry[]): void {
  if (es.length !== en.length) {
    fail(`es.json (${es.length}) y en.json (${en.length}) tienen distinta cantidad de entradas`);
  }
  for (let i = 0; i < es.length; i += 1) {
    const a = es[i];
    const b = en[i];
    if (a === undefined || b === undefined) continue;
    if (a.month !== b.month || a.day !== b.day || a.year !== b.year) {
      fail(
        `desalineados en el indice ${i}: es ${a.month}/${a.day}/${a.year} vs en ${b.month}/${b.day}/${b.year}`,
      );
    }
  }
}

function emitEfemerides(locale: Locale, table: readonly string[]): void {
  const lines = table.map((text) => `  ${JSON.stringify(text)},`).join("\n");
  const source = `${BANNER}
/**
 * Las 366 efemerides en ${locale === "es" ? "espanol" : "ingles"}, en orden de anio bisiesto
 * (1 de enero = 0, 29 de febrero = 59, 31 de diciembre = 365). El texto ya trae la fecha
 * formateada como prefijo: el renderer lo dibuja tal cual.
 *
 * Array plano a proposito (plan 10.6): sin claves month/day, este modulo es lo mas chico
 * posible, que importa porque entra por import() dinamico despues del primer paint.
 */
export const EFEMERIDES: readonly string[] = [
${lines}
];
`;
  writeFileSync(join(OUT_DIR, `efemerides.${locale}.ts`), source, "utf8");
}

function emitFontMetrics(): void {
  const raw = readFileSync(
    join(EXTENSION_DIR, "assets", "fonts", "Fraunces-metrics.json"),
    "utf8",
  );
  const source = `${BANNER}
/**
 * Anchos de avance de Fraunces-subset.woff2 a wght=400, en unidades de em.
 * Los produce scripts/extract-metrics.py desde el .woff2 realmente empaquetado.
 *
 * Existen para que el corte de linea de la efemeride sea exacto sin tocar el DOM: el core
 * mide con esta tabla, devuelve las lineas ya cortadas y el navegador solo dibuja. Es lo
 * que hace que los snapshots SVG sean deterministicos.
 */
export const FONT_METRICS = ${raw.trim()} as const;
`;
  writeFileSync(join(OUT_DIR, "font-metrics.ts"), source, "utf8");
}

function emitTokens(tokens: unknown): void {
  const source = `${BANNER}
/**
 * Espejo de render-core/design-tokens.json. \`as const\` hace que cada numero quede como
 * tipo literal, asi que un token mal escrito en el core es un error de compilacion.
 *
 * Los tipos y los accesores viven en src/core/tokens.ts, que es codigo escrito a mano.
 */
export const DESIGN_TOKENS = ${JSON.stringify(tokens, null, 2)} as const;
`;
  writeFileSync(join(OUT_DIR, "tokens.ts"), source, "utf8");
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  const es = readJson<EfemerideEntry[]>("content/efemerides/es.json");
  const en = readJson<EfemerideEntry[]>("content/efemerides/en.json");
  assertLocalesAligned(es, en);

  const tableEs = buildEfemerideTable(es, "es");
  const tableEn = buildEfemerideTable(en, "en");
  emitEfemerides("es", tableEs);
  emitEfemerides("en", tableEn);

  const tokens = readJson<unknown>("render-core/design-tokens.json");
  emitTokens(tokens);
  emitFontMetrics();

  console.log(
    `gen-data: OK — ${tableEs.length} efemerides es, ${tableEn.length} en, tokens y metricas en src/data/`,
  );
}

main();
