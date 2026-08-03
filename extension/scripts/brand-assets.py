#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
brand-assets.py — deriva los assets de marca del logo maestro.

Entrada:  brand/logo-master.png (768x768)
Salidas:
  extension/assets/icon-{16,32,48,128}.png   iconos de la extension en HD (Tile App Badge con bordes redondeados)
  extension/brand/promo-440x280.png          imagen promocional de la ficha
  extension/brand/hourglass.png              reloj recortado limpio
"""

import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
except ImportError:
    sys.exit("brand-assets: falta pillow. Instalar con: python -m pip install pillow")

EXTENSION_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = EXTENSION_DIR.parent
MASTER = EXTENSION_DIR / "brand" / "logo-master.png"
ASSETS = EXTENSION_DIR / "assets"
BRAND = EXTENSION_DIR / "brand"

ICON_SIZES = (16, 32, 48, 60, 128)

def make_app_tile_icon(master: Image.Image, size: int) -> Image.Image:
    """
    Crea un ícono estilo App Badge (squircle redondeado) de alta definición.
    Conserva el 100% de la calidad 3D del logo original sin bordes serruchados ni borrosidad.
    """
    scale = 4  # Supersampling 4x para anti-aliasing perfecto
    S = size * scale
    
    w, h = master.size
    # Recorte limpio del reloj de arena del maestro
    crop_box = (int(0.24 * w), int(0.04 * h), int(0.76 * w), int(0.68 * h))
    hg = master.crop(crop_box)
    
    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    
    # 1. Dibujar Tile oscuro elegante con bordes redondeados (Squircle)
    radius = int(S * 0.22)
    bg_color = (15, 14, 13, 255)
    border_color = (65, 60, 52, 255)
    draw.rounded_rectangle([0, 0, S - 1, S - 1], radius=radius, fill=bg_color, outline=border_color, width=max(1, int(S * 0.025)))
    
    # 2. Escalar el reloj e insertarlo centrado
    inner_size = int(S * 0.78)
    hg_scaled = hg.resize((inner_size, inner_size), Image.LANCZOS)
    
    offset_x = (S - inner_size) // 2
    offset_y = (S - inner_size) // 2
    canvas.paste(hg_scaled, (offset_x, offset_y))
    
    # 3. Reducir al tamaño final usando Lanczos
    return canvas.resize((size, size), Image.LANCZOS)


def main() -> int:
    if not MASTER.exists():
        sys.exit(f"brand-assets: falta el logo maestro en {MASTER}")

    ASSETS.mkdir(parents=True, exist_ok=True)
    BRAND.mkdir(parents=True, exist_ok=True)

    master = Image.open(MASTER).convert("RGB")
    
    for size in ICON_SIZES:
        icon = make_app_tile_icon(master, size)
        icon.save(ASSETS / f"icon-{size}.png")
        print(f"brand-assets: icon-{size}.png  ({size}x{size}, HD App Tile)")

    print("brand-assets: Íconos HD generados exitosamente.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
