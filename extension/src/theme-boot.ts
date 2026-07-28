/**
 * theme-boot.ts — pinta el fondo correcto ANTES de que se dibuje el primer cuadro.
 *
 * Es un <script> clasico, sin `type="module"` y sin defer, en el <head>: bloquea el parseo
 * durante el microsegundo que tarda y por eso corre antes del primer paint. Un modulo ES
 * no sirve para esto porque es diferido por definicion, y ahi el navegador ya puede haber
 * pintado el fondo equivocado.
 *
 * El <style> inline de newtab.html ya cubre el caso "el tema elegido coincide con el del
 * sistema", que es el default. Este script cubre el otro: el usuario eligio dark teniendo
 * el sistema en light, o al reves. Sin el, esos usuarios ven un flash del color contrario
 * en cada pestana nueva.
 *
 * A proposito NO importa nada: asi el archivo compilado no tiene `import`/`export` y es un
 * script clasico valido. Duplica la clave de cache de prefs.ts, que es el precio de que
 * esto corra antes que cualquier modulo.
 */

(function bootTheme(): void {
  try {
    const raw = localStorage.getItem("mementolife.prefs.v1");
    if (raw === null) return;
    const theme: unknown = (JSON.parse(raw) as { theme?: unknown }).theme;
    if (theme === "dark" || theme === "light") {
      document.documentElement.dataset["theme"] = theme;
    }
  } catch {
    // Sin cache o JSON roto: manda el <style> con prefers-color-scheme. No se rompe nada.
  }
})();
