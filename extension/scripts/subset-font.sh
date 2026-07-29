#!/usr/bin/env bash
#
# subset-font.sh — produce assets/fonts/Fraunces-subset.woff2 a partir de la Fraunces
# variable del handoff. Se corre A MANO y el .woff2 resultante SE COMMITEA: no es parte
# del build, porque MV3 prohibe codigo remoto y la fuente tiene que viajar en el paquete.
#
# Requisitos (solo para correr este script; NO son dependencias del producto):
#   python -m pip install fonttools brotli
#
# Que hace, en dos pasos:
#
#   1. INSTANCIA los ejes que no usamos, con varLib.instancer:
#        opsz=9   -> es el default del eje Y la coordenada de las 6 instancias nombradas
#                    de la fuente (Thin/Light/Regular/SemiBold/Bold/Black, todas opsz=9).
#                    O sea: fijar opsz en 9 es exactamente lo que reference.html recibia
#                    de Google Fonts al pedir `wght@300;400`. Esto cierra el riesgo 10.1
#                    del plan de forma estructural: sin eje opsz en el archivo, ninguna
#                    heuristica de `font-optical-sizing` puede cambiar las formas.
#        SOFT=0   -> default
#        WONK=1   -> default
#        wght=300:400 -> se conserva como eje variable, acotado al rango que usa el
#                    diseno (300 para el reloj, 400 para todo lo demas). Un solo archivo
#                    en vez de dos estaticas.
#
#   2. SUBSETEA al conjunto exacto de scripts/font-charset.txt, generado por
#      font-charset.ts desde el dataset + Intl + la UI. No se subsetea por rangos
#      ("latin", "latin-ext") porque eso seria adivinar.
#
# Despues de correrlo, verificar SIEMPRE con:
#   python scripts/verify-font-coverage.py
#
set -euo pipefail

cd "$(dirname "$0")/.."

# Copia versionada, no docs/design-handoff/fonts/ (esa carpeta es local y no se sube).
SRC="brand/fonts/Fraunces-source.ttf"
INSTANCED="$(mktemp -t fraunces-instanced-XXXXXX).ttf"
OUT_DIR="assets/fonts"
OUT="$OUT_DIR/Fraunces-subset.woff2"

trap 'rm -f "$INSTANCED"' EXIT

if [ ! -f "$SRC" ]; then
  echo "subset-font: no encuentro la fuente de origen en $SRC" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "subset-font: 1/3 generando el conjunto de caracteres..."
node scripts/font-charset.ts

echo "subset-font: 2/3 instanciando ejes (opsz=9, SOFT=0, WONK=1, wght=300:400)..."
python -m fontTools.varLib.instancer "$SRC" \
  opsz=9 SOFT=0 WONK=1 wght=300:400 \
  --output "$INSTANCED"

echo "subset-font: 3/3 subseteando a woff2..."
python -m fontTools.subset "$INSTANCED" \
  --text-file=scripts/font-charset.txt \
  --flavor=woff2 \
  --output-file="$OUT" \
  --layout-features='kern,liga,calt,ccmp,locl,mark,mkmk' \
  --name-IDs='' \
  --no-hinting \
  --desubroutinize \
  --drop-tables+=DSIG

echo "subset-font: extrayendo anchos de avance para el corte de linea..."
python scripts/extract-metrics.py

SRC_KB=$(( $(wc -c < "$SRC") / 1024 ))
OUT_KB=$(( $(wc -c < "$OUT") / 1024 ))
echo "subset-font: listo — $SRC_KB KB -> $OUT_KB KB  ($OUT)"
echo "subset-font: verificar cobertura con  python scripts/verify-font-coverage.py"
