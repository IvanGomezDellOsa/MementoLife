[Español](README.md) | [English](README.en.md)

<p align="center">
  <img src="extension/brand/hourglass.png" alt="" width="120">
</p>

<h1 align="center">MementoLife</h1>

<p align="center">
  Cada pestaña nueva, tu vida entera dibujada como una grilla de semanas.<br>
  Sin cuentas, sin red, nada sale de tu equipo.
</p>

---

Cada punto es una semana. Las que ya viviste están llenas; las que faltan, apenas insinuadas.
Un anillo vacío marca la semana en la que estás ahora.

No hay frases motivacionales, ni recordatorios, ni nada que hacer. Sólo la forma de tu vida,
cada vez que abrís una pestaña.

## Qué hace

- Se configura una sola vez: tu fecha de nacimiento.
- Esperanza de vida ajustable entre 20 y 100 años.
- Tema claro y oscuro, o el del sistema.
- Bilingüe español/inglés en toda la interfaz, no sólo en el contenido.
- Una efeméride histórica por día, que se puede apagar.

## Privacidad

**La extensión no se conecta a internet. Nunca.** Ni siquiera para las tipografías: la fuente
viaja dentro del paquete. Hay una prueba automatizada que falla si aparece cualquier petición
de red, y el build rechaza el paquete si encuentra una URL remota.

Tu fecha de nacimiento se guarda con `chrome.storage.local` —almacenamiento local— y
deliberadamente **no** con `chrome.storage.sync`, que la enviaría a los servidores de Google
a través de tu cuenta.

Pide **un solo permiso**: `storage`. Sin `host_permissions`, sin service worker, sin content
scripts. No puede ver ninguna página que visites.

Detalle completo en [PRIVACY.md](PRIVACY.md).

## Instalar

Todavía no está publicada en la Chrome Web Store. Mientras tanto:

```bash
cd extension && npm ci && npm run build
```

Después, en `chrome://extensions`: activar **Modo de desarrollador** → **Cargar
descomprimida** → elegir `extension/build`.

> En ventanas de incógnito, Chrome **no permite** que ninguna extensión reemplace la pestaña
> nueva. Es una restricción de la plataforma y está documentada; no se intenta sortear.

## Cómo está hecho

TypeScript sin framework y sin bundler en el artefacto final. El código publicado **es** el
código del repo: no hay minificación ni ofuscación, que es además lo que la política de la
tienda pide explícitamente.

```
extension/src/core/     lógica pura: sin DOM, sin chrome.*, sin leer el reloj
extension/src/          las páginas: newtab, opciones, preferencias
render-core/            design-tokens.json — única fuente de verdad de diseño
content/efemerides/     las 366 efemérides, en español e inglés
```

El core es puro a propósito: la fecha entra siempre como parámetro. Eso es lo que permite que
los tests sean deterministas y que el gate de regresión visual sea texto y no píxeles.

Un detalle de rendimiento que vale la pena: la grilla son 4160 puntos, pero el DOM tiene
**7 nodos**. Se acumulan tres `<path>` —pasado, futuro y anillo— en vez de emitir un elemento
por celda. Medido: 1,30 ms contra 10,00 ms, y 594 veces menos nodos.

## Desarrollo

```bash
npm run typecheck   # tsc estricto, sin any
npm test            # 263 unitarios + snapshots
npm run e2e         # Playwright sobre el paquete construido
npm run build       # paquete instalable en build/
npm run shots       # capturas a viewport real
```

## Historia del proyecto

MementoLife empezó como una app Android que ponía la grilla en la pantalla de bloqueo. Se
completó y funcionaba, pero se topó con una limitación de plataforma insalvable: **MIUI y
One UI ignoran en silencio** los intentos de actualizar sólo la pantalla de bloqueo
(`WallpaperManager.setBitmap(..., FLAG_LOCK)` no falla, simplemente no hace nada).

En vez de romper una decisión de diseño del proyecto, se cambió de plataforma. El código
Android está congelado en el tag `android-v1-final`.

## Licencia

MIT.
