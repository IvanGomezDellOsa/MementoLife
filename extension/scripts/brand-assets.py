#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
brand-assets.py — deriva los assets de marca del logo maestro.

Entrada:  brand/logo-master.png  (1254x1254, reloj de arena + logotipo, fondo negro solido)
Salidas:
  extension/assets/icon-{16,32,48,128}.png   iconos de la extension, FONDO TRANSPARENTE
  extension/brand/promo-440x280.png          imagen promocional de la ficha (obligatoria)
  extension/brand/logo-1254.png              el maestro, para el README y la ficha

Dos cosas que la guia oficial exige y que el logo original no cumple
(RESTRICCIONES-CHROME-WEB-STORE.md 4.8):

  1. FONDO TRANSPARENTE. El original viene sobre negro solido, o sea un cuadrado oscuro que
     desaparece sobre fondos oscuros. Aca se recorta el reloj de arena y se convierte el
     negro de fondo en alfa.
  2. OBRA A 96x96 DENTRO DE 128x128, con 16 px de aire por lado.

Ademas se le agrega un HALO calido muy sutil detras del reloj. No es decoracion: el metal
del reloj es oscuro y sobre un fondo oscuro se pierde, y la guia pide explicitamente que el
icono funcione sobre fondos claros Y oscuros. El halo lo despega de los dos.

Requiere:  python -m pip install pillow
Se corre a mano; los PNG resultantes se commitean.
"""

import sys
from pathlib import Path

try:
    from PIL import Image, ImageEnhance, ImageFilter
except ImportError:
    sys.exit("brand-assets: falta pillow. Instalar con: python -m pip install pillow")

EXTENSION_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = EXTENSION_DIR.parent
MASTER = EXTENSION_DIR / "brand" / "logo-master.png"
ASSETS = EXTENSION_DIR / "assets"
BRAND = EXTENSION_DIR / "brand"

ICON_SIZES = (16, 32, 48, 128)

# Recorte del reloj de arena dentro del maestro, en fracciones del lado. El logotipo queda
# afuera a proposito: a 16 px es una mancha.
CROP = (0.30, 0.09, 0.70, 0.68)

# Umbrales de la conversion a alfa. Por debajo de FLOOR es fondo; por encima de CEIL es
# obra opaca. En el medio se interpola, que es lo que conserva el vidrio del reloj.
ALPHA_FLOOR = 10
ALPHA_CEIL = 46


def hourglass_rgba() -> Image.Image:
    master = Image.open(MASTER).convert("RGB")
    w, h = master.size
    box = (int(CROP[0] * w), int(CROP[1] * h), int(CROP[2] * w), int(CROP[3] * h))
    crop = master.crop(box)

    # El fondo es negro casi puro; la obra tiene luz. La luminancia sirve de mascara.
    luminance = crop.convert("L")
    alpha = luminance.point(
        lambda v: 0 if v <= ALPHA_FLOOR else min(255, int((v - ALPHA_FLOOR) * 255 / (ALPHA_CEIL - ALPHA_FLOOR)))
    )
    out = crop.convert("RGBA")
    out.putalpha(alpha)
    return out


def with_halo(art: Image.Image, size: int) -> Image.Image:
    """Lienzo cuadrado con la obra centrada, 16/128 de aire, y un halo calido detras."""
    padding = round(size * 16 / 128)
    inner = size - 2 * padding

    scaled = art.copy()
    scaled.thumbnail((inner, inner), Image.LANCZOS)

    # A 16 y 32 px no queda detalle: lo unico que se lee es la silueta, y el metal oscuro
    # del reloj se pierde sobre fondo oscuro. Se levanta el brillo para esos tamanos.
    if size <= 48:
        boost = 1.9 if size <= 16 else 1.5 if size <= 32 else 1.25
        rgb = ImageEnhance.Brightness(scaled.convert("RGB")).enhance(boost)
        rgb = ImageEnhance.Contrast(rgb).enhance(1.15)
        lifted = rgb.convert("RGBA")
        lifted.putalpha(scaled.getchannel("A"))
        scaled = lifted

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # Halo: la silueta de la obra, desenfocada y en tono arena. Le da un borde que se ve
    # tanto sobre blanco como sobre negro.
    halo_source = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ox = (size - scaled.width) // 2
    oy = (size - scaled.height) // 2
    halo_source.paste(scaled, (ox, oy), scaled)
    # El halo pesa mas cuanto mas chico es el icono: es lo unico que lo despega del fondo
    # cuando ya no queda detalle.
    blur = max(0.8, size / 30)
    strength = 2.6 if size <= 16 else 2.1 if size <= 32 else 1.6
    ceiling = 235 if size <= 32 else 200
    halo = halo_source.filter(ImageFilter.GaussianBlur(blur))
    tint = Image.new("RGBA", (size, size), (207, 193, 166, 0))
    tint.putalpha(halo.getchannel("A").point(lambda v: min(ceiling, int(v * strength))))
    canvas.alpha_composite(tint)
    canvas.alpha_composite(halo_source)
    return canvas


def promo(art: Image.Image) -> Image.Image:
    """440x280 con el fondo del producto. La guia pide 440x280 exactos."""
    canvas = Image.new("RGB", (440, 280), (15, 14, 13))
    scaled = art.copy()
    scaled.thumbnail((196, 196), Image.LANCZOS)
    canvas.paste(scaled, (46, (280 - scaled.height) // 2), scaled)

    master = Image.open(MASTER).convert("RGB")
    w, h = master.size
    # La franja del logotipo, para que la promo diga el nombre sin volver a componerlo.
    word = master.crop((int(0.08 * w), int(0.63 * h), int(0.92 * w), int(0.90 * h)))
    word.thumbnail((252, 252), Image.LANCZOS)
    canvas.paste(word, (270, (280 - word.height) // 2))
    return canvas


def main() -> int:
    if not MASTER.exists():
        sys.exit(f"brand-assets: falta el logo maestro en {MASTER}")

    ASSETS.mkdir(parents=True, exist_ok=True)
    BRAND.mkdir(parents=True, exist_ok=True)

    art = hourglass_rgba()
    for size in ICON_SIZES:
        icon = with_halo(art, size)
        icon.save(ASSETS / f"icon-{size}.png")
        print(f"brand-assets: icon-{size}.png  ({size}x{size}, alfa)")

    promo(art).save(BRAND / "promo-440x280.png")
    print("brand-assets: promo-440x280.png")

    art.save(BRAND / "hourglass.png")
    print("brand-assets: hourglass.png (reloj recortado con alfa, para el README)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
