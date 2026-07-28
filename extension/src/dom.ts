/**
 * dom.ts — un solo helper, para no repetir la comprobacion de null en cada pagina.
 *
 * Si falta un contenedor es un error de programacion (el HTML y el TS se commitean juntos),
 * asi que lo correcto es fallar fuerte y no seguir con un null que se propaga.
 */

export function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`falta el elemento #${id} en el HTML`);
  return element;
}
