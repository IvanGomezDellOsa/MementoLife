/**
 * icons.ts — genera los iconos de la extension.
 *
 * El simbolo es el ANILLO VACIO, que en el diseno marca la semana actual. Es el unico
 * elemento del producto que sigue siendo legible a 16 px: la grilla entera se convierte en
 * una mancha, y el anillo sigue leyendose como un anillo.
 *
 * Dos requisitos de la guia oficial que condicionan el dibujo
 * (RESTRICCIONES-CHROME-WEB-STORE.md 4.8):
 *
 *   1. FONDO TRANSPARENTE. El plan proponia el anillo sobre #161310, o sea un cuadrado
 *      oscuro; la guia exige que el icono funcione sobre fondo claro Y oscuro.
 *   2. La obra va a 96x96 dentro de un lienzo de 128x128, con 16 px de aire transparente
 *      por lado. Las medidas de abajo son proporciones de eso, no numeros sueltos.
 *
 * Para que ande en los dos fondos el trazo NO usa la tinta del tema (que es casi blanca en
 * dark y casi negra en light, y por lo tanto invisible en el contrario) sino un tono medio
 * calido de la misma familia. Es la unica pieza del proyecto que no sale de los tokens, y
 * es a proposito: no se dibuja sobre el fondo del producto.
 *
 * `npm run icons`
 */

import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";

const OUT_DIR = join(resolve(import.meta.dirname, ".."), "assets");

const SIZES = [16, 32, 48, 128] as const;

/** Tono medio calido: se lee sobre #f4f0e8 y sobre #161310. */
const RING = "#9a8b74";

/** Proporciones sobre el lienzo de 128: obra de 96 (radio 48) con 16 de aire. */
const CANVAS = 128;
const PADDING = 16;
const OUTER = (CANVAS - 2 * PADDING) / 2;
/** Trazo grueso para que a 16 px el anillo no se cierre visualmente. */
const STROKE = 13;
const RADIUS = OUTER - STROKE / 2;

function iconSvg(): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}">` +
    `<circle cx="${CANVAS / 2}" cy="${CANVAS / 2}" r="${RADIUS}" fill="none" stroke="${RING}" stroke-width="${STROKE}"/>` +
    `</svg>`
  );
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const svg = iconSvg();

  for (const size of SIZES) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<!DOCTYPE html><html><head><style>
       html,body{margin:0;padding:0;background:transparent}
       svg{display:block;width:${size}px;height:${size}px}
       </style></head><body>${svg}</body></html>`,
      { waitUntil: "load" },
    );
    await page.screenshot({
      path: join(OUT_DIR, `icon-${size}.png`),
      omitBackground: true,
    });
    await page.close();
  }

  await browser.close();
  console.log(`icons: ${SIZES.join(", ")} px con fondo transparente -> assets/`);
}

await main();
