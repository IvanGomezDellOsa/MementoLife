#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
store-compose.py — combina los crudos de store-shots.ts en los 4 assets finales de la
ficha (1280x800, esquinas rectas, a sangre, sin relleno alrededor).

Entrada:  extension/brand/store-raw/{full-dark,full-light,options-panel}.png
Salida:   extension/brand/store/{1-dark,2-light,3-opciones,4-efemeride}.png

Por que dos pasos (TS + Python) en vez de uno: el render necesita un navegador de verdad
(Playwright), y el recorte/composicion final es mas simple con Pillow que reimplementado en
el navegador. Es la misma division que brand-assets.py.

Requiere:  python -m pip install pillow
"""

import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    sys.exit("store-compose: falta pillow. Instalar con: python -m pip install pillow")

EXTENSION_DIR = Path(__file__).resolve().parent.parent
RAW = EXTENSION_DIR / "brand" / "store-raw"
OUT = EXTENSION_DIR / "brand" / "store"

CANVAS = (1280, 800)
BG_DARK = (15, 14, 13)  # #0f0e0d, igual al token de fondo oscuro

# Caja de la columna de texto (fecha, dato, subtitulo, filete, efemeride) a 1280x800, tema
# oscuro, calculada con core/layout.ts resolveLayout(). Con margen para que no se pegue el
# texto al borde del recorte.
TEXT_COLUMN_BOX = (54, 244, 456, 526)  # x0, y0, x1, y1


def require(path: Path) -> Image.Image:
    if not path.exists():
        sys.exit(f"store-compose: falta {path}. Correr primero: npm run store-shots")
    return Image.open(path)


def save_flat(img: Image.Image, name: str) -> None:
    """Fuerza RGB (sin alfa): la guia pide 'sin transparencia' en las capturas de la ficha."""
    OUT.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(OUT / name)
    print(f"store-compose: {name}")


def shot_full(name_in: str, name_out: str) -> None:
    """Las pantallas completas ya salen a 1280x800: se copian tal cual."""
    save_flat(require(RAW / name_in), name_out)


def shot_options() -> None:
    """El panel de opciones, compuesto sobre el fondo real de la pestana nueva, arriba a la
    derecha — que es donde aparece de verdad al hacer clic en el icono de la extension."""
    bg = require(RAW / "full-dark.png").convert("RGB")
    panel = require(RAW / "options-panel.png").convert("RGB")

    canvas = bg.copy()

    margin_top, margin_right = 56, 64
    px = CANVAS[0] - margin_right - panel.width
    py = margin_top

    # Sombra: un rectangulo negro desenfocado detras del panel. Chrome dibuja una sombra
    # real cuando abre el popup; esto es una version honesta de lo mismo, no decoracion.
    shadow_layer = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    pad = 10
    shadow_draw.rectangle(
        [px - pad, py - pad, px + panel.width + pad, py + panel.height + pad],
        fill=(0, 0, 0, 150),
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(18))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shadow_layer).convert("RGB")

    canvas.paste(panel, (px, py))
    save_flat(canvas, "3-opciones.png")


def shot_efemeride() -> None:
    """Recorte ampliado de la columna de texto: a 1280x800 en miniatura de la ficha, 14,5 px
    de la efemeride real es ilegible. Se recorta y se escala, sobre el mismo color de fondo,
    asi que sigue leyendose como una sangria y no como un recuadro pegado encima."""
    full = require(RAW / "full-dark.png").convert("RGB")
    crop = full.crop(TEXT_COLUMN_BOX)

    target_height = 680
    scale = target_height / crop.height
    scaled = crop.resize((round(crop.width * scale), target_height), Image.LANCZOS)

    canvas = Image.new("RGB", CANVAS, BG_DARK)
    x = (CANVAS[0] - scaled.width) // 2
    y = (CANVAS[1] - scaled.height) // 2
    canvas.paste(scaled, (x, y))
    save_flat(canvas, "4-efemeride.png")


def main() -> int:
    shot_full("full-dark.png", "1-dark.png")
    shot_full("full-light.png", "2-light.png")
    shot_options()
    shot_efemeride()
    return 0


if __name__ == "__main__":
    sys.exit(main())
