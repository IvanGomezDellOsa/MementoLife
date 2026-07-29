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

import { BIRTH_DATE_PROBLEM_KEY, t, tf } from "./core/i18n.js";
import { LIFE_YEARS } from "./core/tokens.js";
import type { Locale } from "./core/tokens.js";
import type { LayoutResult } from "./core/layout.js";
import { createBirthDateField } from "./birthdate-field.js";
import { today } from "./today.js";

export interface OnboardingHandlers {
  readonly onSubmit: (birthDate: string) => void;
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

  const row = document.createElement("div");
  row.className = "onboarding-field";

  const field = createBirthDateField(locale, () => submit());

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = t(locale, "onboardingCta");

  const error = document.createElement("p");
  error.className = "onboarding-error";
  error.setAttribute("role", "alert");

  row.append(field.element, button);
  container.append(heading, body, row, error);

  // Aca SI se avisa de "incomplete": el usuario apreto el boton, o sea que dio la carga por
  // terminada. En opciones no, porque ahi el commit tambien salta al recorrer los campos.
  const submit = (): void => {
    const result = field.check(today());
    if (!result.ok) {
      error.textContent = tf(locale, BIRTH_DATE_PROBLEM_KEY[result.problem], {
        max: LIFE_YEARS.max,
      });
      field.focus();
      return;
    }
    error.textContent = "";
    handlers.onSubmit(result.iso);
  };

  button.addEventListener("click", submit);
}

/**
 * Ubica el bloque en el hueco que el layout reservo para el.
 *
 * Antes se posicionaba a ojo, como una fraccion del alto de la grilla, y se dibujaba encima
 * de la fecha. Ahora el lugar lo calcula el layout —que es el unico que sabe donde termina
 * cada texto— y aca solo se aplica.
 */
export function position(container: HTMLElement, layout: LayoutResult): void {
  const { slot } = layout;
  container.style.left = `${slot.x}px`;
  container.style.top = `${slot.y}px`;
  container.style.width = `${slot.widthPx}px`;
}
