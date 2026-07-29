/**
 * options.ts — panel de opciones embebido.
 *
 * Los campos se arman en JS en vez de escribirse en el HTML por una razon concreta: asi las
 * etiquetas salen del mismo diccionario tipado que usa la pestana nueva. Si estuvieran en
 * el HTML habria dos fuentes de texto y la traduccion se desincronizaria en silencio.
 *
 * Cada cambio guarda al instante — no hay boton "Guardar". El listener de
 * chrome.storage.onChanged de newtab.ts redibuja las pestanas nuevas ya abiertas.
 *
 * Accesibilidad: los grupos de opciones son <input type="radio"> reales dentro de un
 * <fieldset> con <legend>. Se recorren con Tab, se cambian con las flechas y los lee un
 * lector de pantalla, todo sin JS de teclado propio.
 */

import { t } from "./core/i18n.js";
import type { StringKey } from "./core/i18n.js";
import { LIFE_YEARS, LOCALES } from "./core/tokens.js";
import type { Locale } from "./core/tokens.js";
import { load, resolveTheme, save } from "./prefs.js";
import { requireElement } from "./dom.js";
import { createBirthDateField } from "./birthdate-field.js";
import type { Prefs, ThemePref } from "./prefs.js";

const form = requireElement("form");
const title = requireElement("title");
const status = requireElement("status");

let prefs: Prefs;
let statusHandle = 0;

function announceSaved(locale: Locale): void {
  status.textContent = t(locale, "savedNotice");
  window.clearTimeout(statusHandle);
  statusHandle = window.setTimeout(() => {
    status.textContent = "";
  }, 1600);
}

async function update(patch: Partial<Prefs>): Promise<void> {
  prefs = await save(patch);
  applyTheme();
  announceSaved(prefs.locale);
  // El idioma cambia todas las etiquetas, asi que hay que rearmar el formulario.
  if ("locale" in patch) build();
}

function applyTheme(): void {
  document.documentElement.dataset["theme"] = resolveTheme(prefs.theme);
  document.documentElement.lang = prefs.locale;
}

function field(
  labelKey: StringKey,
  control: HTMLElement,
  hintKey?: StringKey,
  unitKey?: StringKey,
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "field";

  const label = document.createElement("label");
  label.textContent =
    unitKey === undefined
      ? t(prefs.locale, labelKey)
      : `${t(prefs.locale, labelKey)} (${t(prefs.locale, unitKey)})`;
  if (control.id !== "") label.htmlFor = control.id;

  wrapper.append(label, control);

  if (hintKey !== undefined) {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = t(prefs.locale, hintKey);
    wrapper.append(hint);
  }
  return wrapper;
}

interface Choice<T extends string> {
  readonly value: T;
  readonly labelKey: StringKey;
}

/** Etiqueta del nombre de cada idioma, en el diccionario del idioma activo. */
const LOCALE_NAME_KEY: { readonly [K in Locale]: StringKey } = {
  es: "localeEs",
  en: "localeEn",
  fr: "localeFr",
  pt: "localePt",
  it: "localeIt",
  de: "localeDe",
};

/**
 * <select> nativo. El picker de idioma dejo de ser un segmented control (2 opciones) al
 * pasar a 6: en fila se hubiera envuelto en dos lineas desparejas, y un <select> es el
 * control nativo pensado para una lista larga de una sola eleccion.
 */
function localeSelect(current: Locale, onPick: (value: Locale) => void): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "field";

  const label = document.createElement("label");
  label.textContent = t(prefs.locale, "localeLabel");
  label.htmlFor = "locale";

  const select = document.createElement("select");
  select.id = "locale";
  select.className = "field-select";
  for (const value of LOCALES) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = t(prefs.locale, LOCALE_NAME_KEY[value]);
    option.selected = value === current;
    select.append(option);
  }
  select.addEventListener("change", () => {
    onPick(select.value as Locale);
  });

  wrapper.append(label, select);
  return wrapper;
}

function segmented<T extends string>(
  name: string,
  legendKey: StringKey,
  choices: readonly Choice<T>[],
  current: T,
  onPick: (value: T) => void,
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "field";

  const group = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent = t(prefs.locale, legendKey);

  const row = document.createElement("div");
  row.className = "segmented";

  for (const choice of choices) {
    const id = `${name}-${choice.value}`;
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.id = id;
    input.value = choice.value;
    input.checked = choice.value === current;
    input.addEventListener("change", () => {
      if (input.checked) onPick(choice.value);
    });

    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = t(prefs.locale, choice.labelKey);

    row.append(input, label);
  }

  group.append(legend, row);
  wrapper.append(group);
  return wrapper;
}

function build(): void {
  title.textContent = t(prefs.locale, "optionsTitle");
  document.title = t(prefs.locale, "optionsTitle");
  form.innerHTML = "";

  const birth = createBirthDateField(prefs.locale, () => commitBirthDate());
  birth.setValue(prefs.birthDate);
  const commitBirthDate = (): void => {
    const value = birth.value();
    if (value !== null && value !== prefs.birthDate) void update({ birthDate: value });
  };
  // Cada control avisa por su cuenta: no hay boton de guardar en ningun lado.
  birth.element.addEventListener("change", commitBirthDate);
  birth.element.addEventListener("blur", commitBirthDate, true);
  form.append(field("birthDateLabel", birth.element));

  const life = document.createElement("input");
  life.type = "number";
  life.id = "life-years";
  life.min = String(LIFE_YEARS.min);
  life.max = String(LIFE_YEARS.max);
  life.step = "1";
  life.value = String(prefs.lifeYears);
  life.addEventListener("change", () => {
    const value = Number(life.value);
    if (Number.isFinite(value)) void update({ lifeYears: value });
  });
  form.append(field("lifeYearsLabel", life, "lifeYearsHint", "lifeYearsUnit"));

  form.append(
    segmented<ThemePref>(
      "theme",
      "themeLabel",
      [
        { value: "system", labelKey: "themeSystem" },
        { value: "dark", labelKey: "themeDark" },
        { value: "light", labelKey: "themeLight" },
      ],
      prefs.theme,
      (value) => void update({ theme: value }),
    ),
  );

  form.append(
    segmented(
      "efemeride",
      "efemerideLabel",
      [
        { value: "on", labelKey: "efemerideOn" },
        { value: "off", labelKey: "efemerideOff" },
      ],
      prefs.efemeride ? "on" : "off",
      (value) => void update({ efemeride: value === "on" }),
    ),
  );

  form.append(localeSelect(prefs.locale, (value) => void update({ locale: value })));
}

async function start(): Promise<void> {
  prefs = await load();
  applyTheme();
  build();
}

void start();
