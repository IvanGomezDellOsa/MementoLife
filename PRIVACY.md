# Política de privacidad — MementoLife

*Última actualización: 28 de julio de 2026 · [English version](PRIVACY.en.md)*

## Resumen

**MementoLife no recolecta, transmite ni comparte ningún dato.** No hay servidores, no hay
cuentas, no hay analítica y no hay red. La extensión funciona por completo dentro de tu
navegador.

## Qué datos maneja la extensión

Para dibujar la grilla, MementoLife necesita que le indiques:

| Dato | Para qué | Dónde vive |
|---|---|---|
| Fecha de nacimiento | Calcular qué semanas ya viviste | Sólo en tu equipo |
| Esperanza de vida (20–100) | Cuántas semanas tiene la grilla | Sólo en tu equipo |
| Tema, idioma, efeméride sí/no | Preferencias de visualización | Sólo en tu equipo |

Todo esto se guarda con `chrome.storage.local`, que es almacenamiento **local del
navegador**. Deliberadamente **no** se usa `chrome.storage.sync`, porque eso enviaría tu
fecha de nacimiento a los servidores de Google a través de tu cuenta.

Consecuencia asumida: si instalás la extensión en otra computadora, tenés que volver a
poner la fecha. Es el precio de que el dato no salga de tu equipo.

## Qué NO hace la extensión

- No se conecta a internet. **Nunca.** Ni siquiera para tipografías: la fuente viaja dentro
  del paquete. Hay una prueba automatizada que falla si aparece cualquier petición de red.
- No usa analítica, telemetría ni reporte de errores.
- No pide cuentas ni credenciales.
- No lee tu historial, tus marcadores, tus pestañas ni el contenido de ninguna página.
- No muestra publicidad ni contenido patrocinado.
- No altera tu buscador ni tus resultados de búsqueda.

## Permisos

La extensión pide **un solo permiso**:

- **`storage`** — para guardar localmente tu fecha de nacimiento, tu esperanza de vida y tus
  preferencias de tema, idioma y efeméride. Nada más.

No pide `host_permissions`, no tiene service worker, no inyecta scripts en ninguna página y
no puede ver ningún sitio que visites.

## Cómo borrar tus datos

Desinstalar la extensión elimina todo lo que guardó. También podés borrar la fecha desde la
página de opciones en cualquier momento. Como nada salió nunca de tu equipo, no hay nada más
que pedirnos que borremos.

## Contenido

Las 366 efemérides históricas viajan dentro del paquete. No se descargan ni se actualizan
por red, y no dependen de ningún servicio externo.

## Cambios

Si esta política cambiara, la versión nueva quedará en este mismo archivo, dentro del
repositorio público del proyecto, con su fecha.

## Contacto

Repositorio: https://github.com/IvanGomezDellOsa/MementoLife
