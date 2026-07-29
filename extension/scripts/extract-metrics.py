#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract-metrics.py — vuelca los anchos de avance de Fraunces-subset.woff2 a
assets/fonts/Fraunces-metrics.json (commiteado, lo consume gen-data.ts).

Por que existe: el core tiene que ser puro (sin DOM), pero la efemeride es un bloque de
texto que hay que cortar en lineas. Sin medir, la unica salida es estimar el ancho por
"tamano * 0.47" como hacia la comparativa de diseno — y una estimacion o deja el bloque
corto o lo desborda de la columna. Con la tabla de anchos real, el corte de linea es
exacto Y sigue siendo una funcion pura: los snapshots SVG son deterministicos y el
navegador no tiene que medir nada en el arranque.

Los anchos se leen a wght=400, que es el peso de la efemeride, del pie y de la fecha.
El porcentaje (300) no se corta nunca en lineas, asi que no necesita tabla.

Requiere:  python -m pip install fonttools brotli
"""

import json
import sys
from pathlib import Path

try:
    from fontTools.ttLib import TTFont
except ImportError:
    sys.exit("extract-metrics: falta fonttools. Instalar con: python -m pip install fonttools brotli")

EXTENSION_DIR = Path(__file__).resolve().parent.parent
SUBSET = EXTENSION_DIR / "assets" / "fonts" / "Fraunces-subset.woff2"
OUT = EXTENSION_DIR / "assets" / "fonts" / "Fraunces-metrics.json"


def main() -> int:
    if not SUBSET.exists():
        sys.exit(f"extract-metrics: no encuentro {SUBSET}. Correr primero: bash scripts/subset-font.sh")

    font = TTFont(str(SUBSET))
    units_per_em = font["head"].unitsPerEm
    hmtx = font["hmtx"]
    cmap = font.getBestCmap()

    widths = {}
    for codepoint, glyph_name in sorted(cmap.items()):
        advance, _ = hmtx[glyph_name]
        widths[str(codepoint)] = advance

    # Ancho de reemplazo para cualquier caracter que no este en la tabla (p. ej. el ⅓ que
    # Fraunces no tiene y que el navegador resuelve con una fuente de sistema). Se usa la
    # mediana, que es mucho mejor estimador que el ancho de "espacio" o el maximo.
    ordered = sorted(widths.values())
    fallback = ordered[len(ordered) // 2] if ordered else units_per_em // 2

    OUT.write_text(
        json.dumps(
            {
                "unitsPerEm": units_per_em,
                "weight": 400,
                "fallbackWidth": fallback,
                "widths": widths,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"extract-metrics: {len(widths)} anchos a wght=400, unitsPerEm={units_per_em} -> {OUT.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
