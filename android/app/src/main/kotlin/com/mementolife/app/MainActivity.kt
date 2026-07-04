package com.mementolife.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatDelegate
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
import androidx.core.os.LocaleListCompat
import com.mementolife.app.data.AppLocale
import com.mementolife.app.data.UserPreferencesRepository
import com.mementolife.app.render.Theme
import com.mementolife.app.ui.battery.BatteryHelpScreen
import com.mementolife.app.ui.onboarding.OnboardingScreen
import com.mementolife.app.ui.settings.SettingsScreen
import com.mementolife.app.ui.theme.MementoLifeTheme
import com.mementolife.app.work.WallpaperUpdateWorker
import kotlinx.coroutines.launch

private enum class SubScreen { SETTINGS, BATTERY_HELP }

class MainActivity : ComponentActivity() {

    private lateinit var preferencesRepository: UserPreferencesRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        preferencesRepository = UserPreferencesRepository(applicationContext)

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
                            initialLocale = currentPrefs.locale,
                            initialTheme = currentPrefs.theme,
                            initialView = currentPrefs.view,
                            onConfirm = { locale, birthDate, theme, view ->
                                scope.launch {
                                    preferencesRepository.setLocale(locale)
                                    preferencesRepository.setTheme(theme)
                                    preferencesRepository.setView(view)
                                    preferencesRepository.setBirthDate(birthDate)
                                    applyLocale(locale)
                                    WallpaperUpdateWorker.schedulePeriodic(applicationContext)
                                    WallpaperUpdateWorker.requestImmediateUpdate(applicationContext)
                                }
                            },
                        )
                        subScreen == SubScreen.BATTERY_HELP -> BatteryHelpScreen(
                            onBack = { subScreen = SubScreen.SETTINGS },
                        )
                        else -> SettingsScreen(
                            preferences = currentPrefs,
                            onLocaleChange = { locale ->
                                scope.launch {
                                    preferencesRepository.setLocale(locale)
                                    applyLocale(locale)
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
                        )
                    }
                }
            }
        }
    }

    private fun applyLocale(locale: AppLocale) {
        val tag = if (locale == AppLocale.ES) "es" else "en"
        AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
    }
}
