/**
 * i18n.ts — strings de la interfaz, en los 6 idiomas soportados.
 *
 * No se usa chrome.i18n para la UI: toma el idioma del NAVEGADOR y no admite override, y
 * la restriccion del proyecto exige que el usuario pueda elegir (plan 6.5). chrome.i18n
 * queda solo para el nombre y la descripcion de la ficha de la tienda.
 *
 * El tipo se deriva de las claves del espanol, asi que si falta una traduccion en otro
 * idioma es un error de compilacion y no un texto en blanco en produccion.
 */

import type { Locale } from "./tokens.js";

const ES = {
  optionsTitle: "MementoLife — Opciones",
  openOptions: "Opciones",
  newTabTitle: "Pestaña nueva",

  birthDateLabel: "Fecha de nacimiento",
  dayLabel: "Día",
  dayShort: "DD",
  monthLabel: "Mes",
  monthPlaceholder: "Mes",
  yearLabel: "Año",
  yearShort: "AAAA",
  birthDateInvalid: "Revisá la fecha: tiene que ser anterior a hoy.",
  save: "Guardar",

  onboardingHeading: "Tu vida, semana a semana",
  onboardingBody: "Poné tu fecha de nacimiento para ver la grilla.",
  onboardingCta: "Empezar",

  lifeYearsLabel: "Esperanza de vida",
  lifeYearsUnit: "años",
  lifeYearsHint: "Entre 20 y 100.",

  themeLabel: "Tema",
  themeDark: "Oscuro",
  themeLight: "Claro",
  themeSystem: "Del sistema",

  efemerideLabel: "Efeméride del día",
  efemerideOn: "Mostrar",
  efemerideOff: "Ocultar",

  localeLabel: "Idioma",
  localeEs: "Español",
  localeEn: "Inglés",
  localeFr: "Francés",
  localePt: "Portugués",
  localeIt: "Italiano",
  localeDe: "Alemán",

  savedNotice: "Guardado.",
} as const;

/** El tipo sale del español: agregar una clave allá obliga a traducirla en todos los idiomas. */
type Strings = { readonly [K in keyof typeof ES]: string };

const EN: Strings = {
  optionsTitle: "MementoLife — Options",
  openOptions: "Options",
  newTabTitle: "New tab",

  birthDateLabel: "Date of birth",
  dayLabel: "Day",
  dayShort: "DD",
  monthLabel: "Month",
  monthPlaceholder: "Month",
  yearLabel: "Year",
  yearShort: "YYYY",
  birthDateInvalid: "Check the date: it must be in the past.",
  save: "Save",

  onboardingHeading: "Your life, week by week",
  onboardingBody: "Enter your date of birth to see the grid.",
  onboardingCta: "Get started",

  lifeYearsLabel: "Life expectancy",
  lifeYearsUnit: "years",
  lifeYearsHint: "Between 20 and 100.",

  themeLabel: "Theme",
  themeDark: "Dark",
  themeLight: "Light",
  themeSystem: "System",

  efemerideLabel: "Fact of the day",
  efemerideOn: "Show",
  efemerideOff: "Hide",

  localeLabel: "Language",
  localeEs: "Spanish",
  localeEn: "English",
  localeFr: "French",
  localePt: "Portuguese",
  localeIt: "Italian",
  localeDe: "German",

  savedNotice: "Saved.",
};

const FR: Strings = {
  optionsTitle: "MementoLife — Options",
  openOptions: "Options",
  newTabTitle: "Nouvel onglet",

  birthDateLabel: "Date de naissance",
  dayLabel: "Jour",
  dayShort: "JJ",
  monthLabel: "Mois",
  monthPlaceholder: "Mois",
  yearLabel: "Année",
  yearShort: "AAAA",
  birthDateInvalid: "Vérifiez la date : elle doit être antérieure à aujourd'hui.",
  save: "Enregistrer",

  onboardingHeading: "Votre vie, semaine après semaine",
  onboardingBody: "Entrez votre date de naissance pour voir la grille.",
  onboardingCta: "Commencer",

  lifeYearsLabel: "Espérance de vie",
  lifeYearsUnit: "ans",
  lifeYearsHint: "Entre 20 et 100.",

  themeLabel: "Thème",
  themeDark: "Sombre",
  themeLight: "Clair",
  themeSystem: "Système",

  efemerideLabel: "Fait du jour",
  efemerideOn: "Afficher",
  efemerideOff: "Masquer",

  localeLabel: "Langue",
  localeEs: "Espagnol",
  localeEn: "Anglais",
  localeFr: "Français",
  localePt: "Portugais",
  localeIt: "Italien",
  localeDe: "Allemand",

  savedNotice: "Enregistré.",
};

const PT: Strings = {
  optionsTitle: "MementoLife — Opções",
  openOptions: "Opções",
  newTabTitle: "Nova guia",

  birthDateLabel: "Data de nascimento",
  dayLabel: "Dia",
  dayShort: "DD",
  monthLabel: "Mês",
  monthPlaceholder: "Mês",
  yearLabel: "Ano",
  yearShort: "AAAA",
  birthDateInvalid: "Verifique a data: precisa ser anterior a hoje.",
  save: "Salvar",

  onboardingHeading: "Sua vida, semana a semana",
  onboardingBody: "Informe sua data de nascimento para ver a grade.",
  onboardingCta: "Começar",

  lifeYearsLabel: "Expectativa de vida",
  lifeYearsUnit: "anos",
  lifeYearsHint: "Entre 20 e 100.",

  themeLabel: "Tema",
  themeDark: "Escuro",
  themeLight: "Claro",
  themeSystem: "Do sistema",

  efemerideLabel: "Fato do dia",
  efemerideOn: "Mostrar",
  efemerideOff: "Ocultar",

  localeLabel: "Idioma",
  localeEs: "Espanhol",
  localeEn: "Inglês",
  localeFr: "Francês",
  localePt: "Português",
  localeIt: "Italiano",
  localeDe: "Alemão",

  savedNotice: "Salvo.",
};

const IT: Strings = {
  optionsTitle: "MementoLife — Opzioni",
  openOptions: "Opzioni",
  newTabTitle: "Nuova scheda",

  birthDateLabel: "Data di nascita",
  dayLabel: "Giorno",
  dayShort: "GG",
  monthLabel: "Mese",
  monthPlaceholder: "Mese",
  yearLabel: "Anno",
  yearShort: "AAAA",
  birthDateInvalid: "Controlla la data: deve essere precedente a oggi.",
  save: "Salva",

  onboardingHeading: "La tua vita, settimana per settimana",
  onboardingBody: "Inserisci la tua data di nascita per vedere la griglia.",
  onboardingCta: "Inizia",

  lifeYearsLabel: "Aspettativa di vita",
  lifeYearsUnit: "anni",
  lifeYearsHint: "Tra 20 e 100.",

  themeLabel: "Tema",
  themeDark: "Scuro",
  themeLight: "Chiaro",
  themeSystem: "Di sistema",

  efemerideLabel: "Fatto del giorno",
  efemerideOn: "Mostra",
  efemerideOff: "Nascondi",

  localeLabel: "Lingua",
  localeEs: "Spagnolo",
  localeEn: "Inglese",
  localeFr: "Francese",
  localePt: "Portoghese",
  localeIt: "Italiano",
  localeDe: "Tedesco",

  savedNotice: "Salvato.",
};

const DE: Strings = {
  optionsTitle: "MementoLife — Einstellungen",
  openOptions: "Einstellungen",
  newTabTitle: "Neuer Tab",

  birthDateLabel: "Geburtsdatum",
  dayLabel: "Tag",
  dayShort: "TT",
  monthLabel: "Monat",
  monthPlaceholder: "Monat",
  yearLabel: "Jahr",
  yearShort: "JJJJ",
  birthDateInvalid: "Prüfe das Datum: es muss in der Vergangenheit liegen.",
  save: "Speichern",

  onboardingHeading: "Dein Leben, Woche für Woche",
  onboardingBody: "Gib dein Geburtsdatum ein, um das Raster zu sehen.",
  onboardingCta: "Loslegen",

  lifeYearsLabel: "Lebenserwartung",
  lifeYearsUnit: "Jahre",
  lifeYearsHint: "Zwischen 20 und 100.",

  themeLabel: "Design",
  themeDark: "Dunkel",
  themeLight: "Hell",
  themeSystem: "System",

  efemerideLabel: "Ereignis des Tages",
  efemerideOn: "Anzeigen",
  efemerideOff: "Ausblenden",

  localeLabel: "Sprache",
  localeEs: "Spanisch",
  localeEn: "Englisch",
  localeFr: "Französisch",
  localePt: "Portugiesisch",
  localeIt: "Italienisch",
  localeDe: "Deutsch",

  savedNotice: "Gespeichert.",
};

export type StringKey = keyof typeof ES;

const TABLES: { readonly [K in Locale]: Strings } = {
  es: ES,
  en: EN,
  fr: FR,
  pt: PT,
  it: IT,
  de: DE,
};

function strings(locale: Locale): Strings {
  return TABLES[locale];
}

export function t(locale: Locale, key: StringKey): string {
  return strings(locale)[key];
}
