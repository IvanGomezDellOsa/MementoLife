#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
verify-font-coverage.py — comprueba que Fraunces-subset.woff2 cubre TODOS los glifos que
la extension puede llegar a dibujar. No asume nada: abre el .woff2 realmente commiteado,
lee su cmap y lo compara contra el conjunto exacto.

Distingue dos fallas que se ven iguales en pantalla pero tienen causas opuestas:

  A. El caracter esta en Fraunces pero NO en el subset -> bug del subset. Sale con codigo 1.
  B. El caracter no esta en Fraunces, punto -> ningun subset puede arreglarlo. Es un choque
     entre el contenido y la tipografia. Los ya conocidos estan en KNOWN_MISSING_FROM_FONT
     y solo se avisan; uno nuevo hace fallar el script, para que nadie lo descubra en
     produccion un dia puntual del anio.

Uso:  python scripts/verify-font-coverage.py
Requiere:  python -m pip install fonttools brotli
"""

import json
import sys
from pathlib import Path

try:
    from fontTools.ttLib import TTFont
except ImportError:
    sys.exit("verify-font-coverage: falta fonttools. Instalar con: python -m pip install fonttools brotli")

EXTENSION_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = EXTENSION_DIR.parent

CHARSET_FILE = EXTENSION_DIR / "scripts" / "font-charset.txt"
SUBSET_FILE = EXTENSION_DIR / "assets" / "fonts" / "Fraunces-subset.woff2"
SOURCE_FILE = REPO_ROOT / "docs" / "design-handoff" / "fonts" / "Fraunces.ttf"

# Caracteres que la Fraunces del handoff NO tiene y que igual aparecen en el contenido.
# Cada uno es una decision aceptada conscientemente, no un descuido.
#
# Vacio a proposito: el unico hueco que habia era U+2153 (⅓), en la efemeride del 20 de
# junio ("33⅓ revoluciones por minuto"). Fraunces no trae el glifo —624 glifos, ninguna
# fraccion vulgar— asi que ningun subset podia arreglarlo: ese dia el navegador caia a una
# fuente de sistema para ese unico caracter. Se resolvio en el contenido, cambiando "33⅓"
# por "33 1/3" en los dos idiomas. No es regenerar ni retraducir el dataset: es corregir un
# caracter que la tipografia del proyecto no puede dibujar.
#
# Si algun dia aparece otro hueco, este set vuelve a tener sentido: se agrega ahi el
# codepoint con su justificacion y el script pasa de fallar a avisar.
KNOWN_MISSING_FROM_FONT: set[int] = set()

# Objetivo de tamano del plan (5.5).
SIZE_TARGET_KB = 80


def load_charset() -> str:
    if not CHARSET_FILE.exists():
        sys.exit(f"verify-font-coverage: falta {CHARSET_FILE.name}. Correr primero: node scripts/font-charset.ts")
    return CHARSET_FILE.read_text(encoding="utf-8")


def codepoints_of(font_path: Path) -> set:
    if not font_path.exists():
        sys.exit(f"verify-font-coverage: no encuentro {font_path}. Correr primero: bash scripts/subset-font.sh")
    return set(TTFont(str(font_path)).getBestCmap().keys())


def dataset_codepoints() -> set:
    """Los codepoints de las 732 entradas, leidos de la fuente de verdad."""
    out = set()
    for name, key in (("es.json", "text_es"), ("en.json", "text_en")):
        entries = json.loads((REPO_ROOT / "content" / "efemerides" / name).read_text(encoding="utf-8"))
        for entry in entries:
            for ch in entry.get(key, ""):
                out.add(ord(ch))
    return out


def fmt(cp: int) -> str:
    return f"U+{cp:04X} {chr(cp)!r}"


def main() -> int:
    charset = load_charset()
    required = {ord(ch) for ch in charset}
    subset = codepoints_of(SUBSET_FILE)
    source = codepoints_of(SOURCE_FILE)
    dataset = dataset_codepoints()

    failed = False

    # --- A. Regresiones del subset -------------------------------------------------
    droppable = required & source
    dropped = sorted(droppable - subset)
    if dropped:
        failed = True
        print(f"FALLA: {len(dropped)} caracteres estan en Fraunces pero el subset los perdio:")
        for cp in dropped:
            print(f"   {fmt(cp)}")
    else:
        print(f"OK  subset: cubre los {len(droppable)} caracteres requeridos que Fraunces tiene.")

    # --- B. Huecos de la propia tipografia ----------------------------------------
    absent = sorted(required - source)
    unexpected = [cp for cp in absent if cp not in KNOWN_MISSING_FROM_FONT]
    known = [cp for cp in absent if cp in KNOWN_MISSING_FROM_FONT]

    if unexpected:
        failed = True
        print(f"FALLA: {len(unexpected)} caracteres NO existen en Fraunces y no estan documentados:")
        for cp in unexpected:
            print(f"   {fmt(cp)}  <- agregarlo a KNOWN_MISSING_FROM_FONT o sacarlo del charset")
    for cp in known:
        print(f"AVISO  {fmt(cp)} no existe en Fraunces (hueco conocido y aceptado).")

    # --- C. La comprobacion que pide el gate de E0: las 732 entradas ---------------
    dataset_uncovered = sorted(dataset - subset)
    dataset_real_failures = [cp for cp in dataset_uncovered if cp not in KNOWN_MISSING_FROM_FONT]
    if dataset_real_failures:
        failed = True
        print(f"FALLA: {len(dataset_real_failures)} glifos del dataset no quedan cubiertos:")
        for cp in dataset_real_failures:
            print(f"   {fmt(cp)}")
    else:
        print(
            f"OK  dataset: los {len(dataset)} codepoints distintos de las 732 entradas "
            f"quedan cubiertos ({len(dataset_uncovered)} hueco(s) conocido(s))."
        )

    # --- D. Tamano ------------------------------------------------------------------
    size_kb = SUBSET_FILE.stat().st_size / 1024
    status = "OK " if size_kb < SIZE_TARGET_KB else "AVISO"
    print(f"{status} tamano: {size_kb:.1f} KB (objetivo del plan 5.5: < {SIZE_TARGET_KB} KB)")

    # --- E. Ejes variables que sobrevivieron ---------------------------------------
    font = TTFont(str(SUBSET_FILE))
    if "fvar" in font:
        axes = ", ".join(
            f"{a.axisTag}={a.minValue}..{a.maxValue}" for a in font["fvar"].axes
        )
        print(f"OK  ejes variables en el subset: {axes}")
        if any(a.axisTag == "opsz" for a in font["fvar"].axes):
            print("AVISO  el eje opsz sobrevivio: font-optical-sizing puede alterar las formas (riesgo 10.1).")
    else:
        print("OK  sin ejes variables (fuente estatica).")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
