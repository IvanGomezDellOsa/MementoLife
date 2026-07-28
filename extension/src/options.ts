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
import { LIFE_YEARS } from "./core/tokens.js";
import type { Locale } from "./core/tokens.js";
import { load, resolveTheme, save } from "./prefs.js";
import { requireElement } from "./dom.js";
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

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function build(): void {
  title.textContent = t(prefs.locale, "optionsTitle");
  document.title = t(prefs.locale, "optionsTitle");
  form.innerHTML = "";

  const birth = document.createElement("input");
  birth.type = "date";
  birth.id = "birth-date";
  birth.max = todayIso();
  birth.value = prefs.birthDate ?? "";
  birth.addEventListener("change", () => {
    if (birth.value !== "") void update({ birthDate: birth.value });
  });
  form.append(field("birthDateLabel", birth));

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

  form.append(
    segmented<Locale>(
      "locale",
      "localeLabel",
      [
        { value: "es", labelKey: "localeEs" },
        { value: "en", labelKey: "localeEn" },
      ],
      prefs.locale,
      (value) => void update({ locale: value }),
    ),
  );
}

async function start(): Promise<void> {
  prefs = await load();
  applyTheme();
  build();
}

void start();
