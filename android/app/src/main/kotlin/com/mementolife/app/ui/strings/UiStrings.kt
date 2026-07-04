package com.mementolife.app.ui.strings

import com.mementolife.app.data.AppLocale

/**
 * Catálogo bilingüe propio, NO `strings.xml`/`stringResource()`: cambiar de idioma
 * solo actualiza `prefs.locale` y Compose recompone al toque — nada de
 * `AppCompatDelegate.setApplicationLocales` ni `Activity.recreate()`, que era la
 * causa del crash al tocar el selector de idioma (reportado en Xiaomi Redmi Note 11).
 */
data class UiStrings(
    val onboardingTitle: String,
    val onboardingSubtitle: String,
    val birthDateLabel: String,
    val birthDatePlaceholder: String,
    val onboardingConfirm: String,

    val settingsTitle: String,
    val languageLabel: String,
    val languageCaption: String,
    val languageEs: String,
    val languageEn: String,
    val themeLabel: String,
    val themeCaption: String,
    val themeDark: String,
    val themeLight: String,
    val viewLabel: String,
    val viewCaption: String,
    val viewWeeks: String,
    val viewMonths: String,
    val birthDateSettingCaption: String,
    val lifeExpectancyCaption: String,
    val efemerideLabel: String,
    val efemerideCaption: String,

    val previewButton: String,
    val previewTitle: String,
    val applyButton: String,
    val applySuccess: String,
    val applyError: String,
    val batteryHelpButton: String,

    val batteryHelpTitle: String,
    val batteryHelpBody: String,
    val batteryHelpLowUsage: String,
    val autostartButton: String,
    val unrestrictedBatteryButton: String,
    val dualScreenNote: String,

    val back: String,
    val datePickerConfirm: String,
    val datePickerCancel: String,
) {
    fun lifeExpectancyLabel(years: Int): String = "$lifeExpectancyCaption: $years"

    companion object {
        fun of(locale: AppLocale): UiStrings = if (locale == AppLocale.ES) ES else EN

        private val ES = UiStrings(
            onboardingTitle = "MementoLife",
            onboardingSubtitle = "Tu vida, semana a semana.",
            birthDateLabel = "Fecha de nacimiento",
            birthDatePlaceholder = "Elegir fecha",
            onboardingConfirm = "Empezar",

            settingsTitle = "Configuración",
            languageLabel = "Idioma",
            languageCaption = "De la interfaz y la efeméride",
            languageEs = "Español",
            languageEn = "Inglés",
            themeLabel = "Tema",
            themeCaption = "Colores del fondo de bloqueo",
            themeDark = "Oscuro",
            themeLight = "Claro",
            viewLabel = "Vista",
            viewCaption = "Unidad de la grilla",
            viewWeeks = "Semanas",
            viewMonths = "Meses",
            birthDateSettingCaption = "Base del cálculo de la grilla",
            lifeExpectancyCaption = "Esperanza de vida",
            efemerideLabel = "Efeméride del día",
            efemerideCaption = "Un dato corto debajo de la grilla",

            previewButton = "Vista previa",
            previewTitle = "Vista previa",
            applyButton = "Aplicar fondo de bloqueo",
            applySuccess = "Fondo actualizado",
            applyError = "No se pudo aplicar. Probá la ayuda de batería.",
            batteryHelpButton = "¿No se actualiza?",

            batteryHelpTitle = "Mantené el fondo actualizado",
            batteryHelpBody = "Algunos celulares (Xiaomi, Huawei, Samsung) restringen las apps en segundo plano.",
            batteryHelpLowUsage = "Tranquilo: el consumo es mínimo, solo se actualiza una vez al día.",
            autostartButton = "Permitir inicio automático",
            unrestrictedBatteryButton = "Batería sin restricciones",
            dualScreenNote = "En Xiaomi y Samsung, el sistema no permite actualizar solo la pantalla de bloqueo: MementoLife actualiza bloqueo e inicio juntos en esos celulares.",

            back = "Volver",
            datePickerConfirm = "Aceptar",
            datePickerCancel = "Cancelar",
        )

        private val EN = UiStrings(
            onboardingTitle = "MementoLife",
            onboardingSubtitle = "Your life, week by week.",
            birthDateLabel = "Date of birth",
            birthDatePlaceholder = "Pick a date",
            onboardingConfirm = "Start",

            settingsTitle = "Settings",
            languageLabel = "Language",
            languageCaption = "Interface and daily fact",
            languageEs = "Spanish",
            languageEn = "English",
            themeLabel = "Theme",
            themeCaption = "Lock screen colors",
            themeDark = "Dark",
            themeLight = "Light",
            viewLabel = "View",
            viewCaption = "Grid unit",
            viewWeeks = "Weeks",
            viewMonths = "Months",
            birthDateSettingCaption = "Basis for the grid math",
            lifeExpectancyCaption = "Life expectancy",
            efemerideLabel = "Daily fact",
            efemerideCaption = "A short fact under the grid",

            previewButton = "Preview",
            previewTitle = "Preview",
            applyButton = "Apply lock screen",
            applySuccess = "Wallpaper updated",
            applyError = "Couldn't apply it. Try the battery help.",
            batteryHelpButton = "Not updating?",

            batteryHelpTitle = "Keep the wallpaper updating",
            batteryHelpBody = "Some phones (Xiaomi, Huawei, Samsung) restrict background apps.",
            batteryHelpLowUsage = "Don't worry — battery use is minimal, it only updates once a day.",
            autostartButton = "Allow auto-start",
            unrestrictedBatteryButton = "Unrestricted battery",
            dualScreenNote = "On Xiaomi and Samsung, the system won't let apps update only the lock screen: MementoLife updates lock and home together on those phones.",

            back = "Back",
            datePickerConfirm = "OK",
            datePickerCancel = "Cancel",
        )
    }
}
