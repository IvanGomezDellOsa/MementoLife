/**
 * today.ts — la fecha de HOY en horario local.
 *
 * Vive fuera de core/ a proposito: el core no lee el reloj, y purity.test.ts lo verifica. El
 * unico lugar que puede mirarlo es la capa de pagina, y entonces conviene que sea UNO solo:
 * antes newtab y onboarding lo calculaban por separado y era cuestion de tiempo que uno
 * usara UTC y el otro local, con un dia de diferencia segun la hora.
 */

import type { CalendarDate } from "./core/lifemath.js";

export function today(): CalendarDate {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}
