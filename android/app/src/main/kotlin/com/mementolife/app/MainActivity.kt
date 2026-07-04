package com.mementolife.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.mementolife.app.data.AppLocale
import com.mementolife.app.data.UserPreferencesRepository
import com.mementolife.app.render.Theme
import com.mementolife.app.ui.battery.BatteryHelpScreen
import com.mementolife.app.ui.onboarding.OnboardingScreen
import com.mementolife.app.ui.preview.PreviewScreen
import com.mementolife.app.ui.settings.SettingsScreen
import com.mementolife.app.ui.strings.UiStrings
import com.mementolife.app.ui.theme.MementoLifeTheme
import com.mementolife.app.work.WallpaperApplier
import com.mementolife.app.work.WallpaperUpdateWorker
import kotlinx.coroutines.launch
import java.util.Locale

private enum class SubScreen { SETTINGS, BATTERY_HELP, PREVIEW }

// El idioma de la UI vive en DataStore (prefs.locale) y se lee directo con
// UiStrings.of(...) en cada composable: no hay AppCompatDelegate ni
// Activity.recreate() de por medio (esa combinación crasheaba al cambiar de
// idioma, reportado en Xiaomi Redmi Note 11), así que ComponentActivity alcanza.
class MainActivity : ComponentActivity() {

    private lateinit var preferencesRepository: UserPreferencesRepository
    private lateinit var wallpaperApplier: WallpaperApplier

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        preferencesRepository = UserPreferencesRepository(applicationContext)
        wallpaperApplier = WallpaperApplier.create(applicationContext, preferencesRepository)

        setContent {
            val prefs by preferencesRepository.preferences.collectAsState(initial = null)
            var subScreen by remember { mutableStateOf(SubScreen.SETTINGS) }
            val scope = rememberCoroutineScope()

            MementoLifeTheme(darkTheme = prefs?.theme?.let { it == Theme.DARK } ?: isSystemInDarkTheme()) {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    val currentPrefs = prefs
                    when {
                        currentPrefs == null -> Unit
                        currentPrefs.birthDate == null -> OnboardingScreen(
                            strings = UiStrings.of(deviceLocale()),
                            onConfirm = { birthDate ->
                                scope.launch {
                                    // Idioma y tema se detectan del dispositivo (sin popup);
                                    // vista queda en el default (semanas), editable en settings.
                                    preferencesRepository.setLocale(deviceLocale())
                                    preferencesRepository.setTheme(if (isSystemDark()) Theme.DARK else Theme.LIGHT)
                                    preferencesRepository.setBirthDate(birthDate)
                                    WallpaperUpdateWorker.schedulePeriodic(applicationContext)
                                    WallpaperUpdateWorker.requestImmediateUpdate(applicationContext)
                                }
                            },
                        )
                        subScreen == SubScreen.BATTERY_HELP -> {
                            // El back del sistema vuelve a settings en vez de cerrar la app.
                            BackHandler { subScreen = SubScreen.SETTINGS }
                            BatteryHelpScreen(
                                strings = UiStrings.of(currentPrefs.locale),
                                onBack = { subScreen = SubScreen.SETTINGS },
                            )
                        }
                        subScreen == SubScreen.PREVIEW -> {
                            BackHandler { subScreen = SubScreen.SETTINGS }
                            PreviewScreen(
                                strings = UiStrings.of(currentPrefs.locale),
                                renderPreview = { wallpaperApplier.renderPreview() },
                                onBack = { subScreen = SubScreen.SETTINGS },
                            )
                        }
                        else -> SettingsScreen(
                            strings = UiStrings.of(currentPrefs.locale),
                            preferences = currentPrefs,
                            onLocaleChange = { locale ->
                                scope.launch {
                                    preferencesRepository.setLocale(locale)
                                    WallpaperUpdateWorker.requestImmediateUpdate(applicationContext)
                                }
                            },
                            onThemeChange = { theme ->
                                scope.launch {
                                    preferencesRepository.setTheme(theme)
                                    WallpaperUpdateWorker.requestImmediateUpdate(applicationContext)
                                }
                            },
                            onViewChange = { view ->
                                scope.launch {
                                    preferencesRepository.setView(view)
                                    WallpaperUpdateWorker.requestImmediateUpdate(applicationContext)
                                }
                            },
                            onBirthDateChange = { birthDate ->
                                scope.launch {
                                    preferencesRepository.setBirthDate(birthDate)
                                    WallpaperUpdateWorker.requestImmediateUpdate(applicationContext)
                                }
                            },
                            onLifeYearsChange = { years ->
                                scope.launch {
                                    preferencesRepository.setLifeYears(years)
                                    WallpaperUpdateWorker.requestImmediateUpdate(applicationContext)
                                }
                            },
                            onEfemerideEnabledChange = { enabled ->
                                scope.launch {
                                    preferencesRepository.setEfemerideEnabled(enabled)
                                    WallpaperUpdateWorker.requestImmediateUpdate(applicationContext)
                                }
                            },
                            onOpenBatteryHelp = { subScreen = SubScreen.BATTERY_HELP },
                            onOpenPreview = { subScreen = SubScreen.PREVIEW },
                            onApplyNow = { WallpaperUpdateWorker.applyNowAndAwaitResult(applicationContext) },
                        )
                    }
                }
            }
        }
    }

    private fun deviceLocale(): AppLocale =
        if (Locale.getDefault().language == "es") AppLocale.ES else AppLocale.EN

    private fun isSystemDark(): Boolean =
        (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
            android.content.res.Configuration.UI_MODE_NIGHT_YES
}
