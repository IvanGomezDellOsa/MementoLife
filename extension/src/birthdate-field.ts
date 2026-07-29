/**
 * birthdate-field.ts — el campo de fecha de nacimiento, en tres controles.
 *
 * ── Por qué no `<input type="date">` ──────────────────────────────────────────────
 *
 * El control nativo muestra el formato según el idioma del NAVEGADOR, no el de la página.
 * Con Chrome en inglés aparece "mm/dd/yyyy" aunque la extensión esté en español, y ahí el
 * usuario no sabe si el primer número es el mes o el día. Peor todavía para una fecha de
 * nacimiento, donde el año está décadas atrás: el calendario emergente obliga a navegar
 * cientos de meses hacia atrás.
 *
 * Tres controles resuelven las dos cosas:
 *
 *   · el mes es una LISTA con los nombres del mes, generados con Intl en el idioma activo,
 *     así que la ambigüedad mm/dd desaparece por completo;
 *   · el año se escribe directo, sin navegar nada;
 *   · el orden de los campos sigue la convención del idioma (día-mes-año en español,
 *     mes-día-año en inglés).
 *
 * Los tres son controles nativos, así que funcionan con teclado y con lector de pantalla
 * sin una línea de JS de accesibilidad.
 */

import { t } from "./core/i18n.js";
import type { Locale } from "./core/tokens.js";
import { intlTag } from "./core/format.js";
import { checkBirthDate } from "./core/birthdate.js";
import type { BirthDateCheck } from "./core/birthdate.js";
import type { CalendarDate } from "./core/lifemath.js";

export interface BirthDateField {
  readonly element: HTMLElement;
  /**
   * Valida contra el calendario real y contra el rango que la grilla puede dibujar, y
   * devuelve el motivo si falla. La validacion vive en core/birthdate.ts para que el
   * onboarding y la pagina de opciones no puedan divergir.
   */
  check(today: CalendarDate): BirthDateCheck;
  setValue(iso: string | null): void;
  focus(): void;
}

/** Nombres de mes en el idioma activo. Generados, no escritos a mano. */
function monthNames(locale: Locale): string[] {
  const format = new Intl.DateTimeFormat(intlTag(locale), {
    month: "long",
    timeZone: "UTC",
  });
  return Array.from({ length: 12 }, (_, i) =>
    format.format(new Date(Date.UTC(2024, i, 1))),
  );
}

export function createBirthDateField(locale: Locale, onEnter: () => void): BirthDateField {
  const wrapper = document.createElement("div");
  wrapper.className = "birthdate";

  const day = document.createElement("input");
  day.type = "text";
  day.inputMode = "numeric";
  day.id = "birth-day";
  day.className = "birthdate-day";
  day.maxLength = 2;
  day.autocomplete = "off";
  day.placeholder = t(locale, "dayShort");
  day.setAttribute("aria-label", t(locale, "dayLabel"));

  const month = document.createElement("select");
  month.id = "birth-month";
  month.className = "birthdate-month";
  month.setAttribute("aria-label", t(locale, "monthLabel"));
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = t(locale, "monthPlaceholder");
  month.append(empty);
  monthNames(locale).forEach((name, index) => {
    const option = document.createElement("option");
    option.value = String(index + 1);
    option.textContent = name;
    month.append(option);
  });

  const year = document.createElement("input");
  year.type = "text";
  year.inputMode = "numeric";
  year.id = "birth-year";
  year.className = "birthdate-year";
  year.maxLength = 4;
  year.autocomplete = "off";
  year.placeholder = t(locale, "yearShort");
  year.setAttribute("aria-label", t(locale, "yearLabel"));

  // El orden sigue la convencion del idioma: dia-mes-anio en todos salvo ingles, que va
  // mes-dia-anio ("July 28, 1990" contra "28 de julio de 1990").
  wrapper.append(...(locale === "en" ? [month, day, year] : [day, month, year]));

  const digitsOnly = (input: HTMLInputElement): void => {
    input.addEventListener("input", () => {
      const clean = input.value.replace(/\D/g, "");
      if (clean !== input.value) input.value = clean;
    });
  };
  digitsOnly(day);
  digitsOnly(year);

  // Enter confirma desde cualquiera de los tres.
  const confirmOnEnter = (event: KeyboardEvent): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      onEnter();
    }
  };
  day.addEventListener("keydown", confirmOnEnter);
  month.addEventListener("keydown", confirmOnEnter);
  year.addEventListener("keydown", confirmOnEnter);

  // Al completar el dia salta al mes: es lo que uno espera de un campo de dos digitos.
  day.addEventListener("input", () => {
    if (day.value.length === 2) month.focus();
  });
  month.addEventListener("change", () => {
    if (month.value !== "" && year.value === "") year.focus();
  });

  return {
    element: wrapper,
    check(todayDate: CalendarDate): BirthDateCheck {
      return checkBirthDate(
        { day: day.value, month: month.value, year: year.value },
        todayDate,
      );
    },
    setValue(iso: string | null): void {
      const match = iso === null ? null : /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
      if (match === null) {
        day.value = "";
        month.value = "";
        year.value = "";
        return;
      }
      year.value = match[1] ?? "";
      month.value = String(Number(match[2]));
      day.value = String(Number(match[3]));
    },
    focus(): void {
      (locale === "en" ? month : day).focus();
    },
  };
}
