/**
 * onboarding.ts — el unico formulario del producto: la fecha de nacimiento.
 *
 * Se dibuja sobre la columna tipografica, en el lugar donde despues van a ir el pie y la
 * efemeride, asi que el usuario ve exactamente que espacio va a ocupar su dato. Detras, la
 * grilla ya esta dibujada entera en estado "futuro": se ve lo que se va a obtener antes de
 * dar nada (plan 6.4).
 *
 * SIN AUTOFOCO, y no es un olvido. La documentacion oficial es explicita: las pestanas
 * nuevas le dan el foco de teclado a la barra de direcciones y no hay que pelearlo. Robarle
 * el foco rompe el caso de uso dominante —abrir una pestana para escribir una URL— asi que
 * el bloque se diseña como un objetivo de CLIC evidente: etiqueta, campo y boton a tamano
 * comodo. Una vez que el usuario hace clic en el campo, Enter confirma.
 */

import { t } from "./core/i18n.js";
import type { Locale } from "./core/tokens.js";
import type { LayoutResult } from "./core/layout.js";
import { daysFromCivil } from "./core/lifemath.js";
import { parseBirthDate } from "./prefs.js";

export interface OnboardingHandlers {
  readonly onSubmit: (birthDate: string) => void;
}

/** Fecha de hoy en horario LOCAL, para acotar el campo. */
function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function mount(
  container: HTMLElement,
  locale: Locale,
  handlers: OnboardingHandlers,
): void {
  container.innerHTML = "";

  const heading = document.createElement("p");
  heading.className = "onboarding-heading";
  heading.textContent = t(locale, "onboardingHeading");

  const body = document.createElement("p");
  body.className = "onboarding-body";
  body.textContent = t(locale, "onboardingBody");

  const field = document.createElement("div");
  field.className = "onboarding-field";

  const input = document.createElement("input");
  input.type = "date";
  input.id = "birth-date";
  input.max = todayIso();
  input.setAttribute("aria-label", t(locale, "birthDateLabel"));

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = t(locale, "onboardingCta");

  const error = document.createElement("p");
  error.className = "onboarding-error";
  error.setAttribute("role", "alert");

  field.append(input, button);
  container.append(heading, body, field, error);

  const submit = (): void => {
    const value = input.value;
    const parsed = parseBirthDate(value === "" ? null : value);
    const isPast = parsed !== null && daysFromCivil(parsed) < daysFromCivil(parseBirthDate(todayIso()) ?? parsed);
    if (parsed === null || !isPast) {
      error.textContent = t(locale, "birthDateInvalid");
      input.focus();
      return;
    }
    error.textContent = "";
    handlers.onSubmit(value);
  };

  button.addEventListener("click", submit);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  });
}

/** Ubica el bloque sobre la columna tipografica del layout vigente. */
export function position(container: HTMLElement, layout: LayoutResult): void {
  const { column, grid } = layout;
  const width = Math.max(240, column.widthPx);

  container.style.width = `${width}px`;
  if (column.anchor === "middle") {
    container.style.left = `${column.x - width / 2}px`;
    container.style.textAlign = "center";
    // En composicion A la grilla esta centrada y el bloque va debajo.
    container.style.top = `${grid.originY + grid.heightPx + 28}px`;
  } else {
    container.style.left = `${column.x}px`;
    container.style.textAlign = "left";
    // En composicion B ocupa la mitad inferior de la columna, donde iran pie y efemeride.
    container.style.top = `${grid.originY + grid.heightPx * 0.52}px`;
  }
}
