package com.mementolife.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStoreFile
import com.mementolife.app.render.GridView
import com.mementolife.app.render.Theme
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.LocalDate

const val DEFAULT_LIFE_YEARS = 80
const val MIN_LIFE_YEARS = 40
const val MAX_LIFE_YEARS = 100

data class UserPreferences(
    val birthDate: LocalDate?,
    val lifeYears: Int,
    val theme: Theme,
    val view: GridView,
    val locale: AppLocale,
    val efemerideEnabled: Boolean,
    val lastAppliedDate: LocalDate?,
)

/**
 * Persiste la personalización del usuario (plan §6.1/§6.4) — sin base de datos, solo DataStore.
 *
 * Crea su propio [DataStore] por instancia en vez de usar el delegado singleton de
 * `preferencesDataStore(name=...)`: ese delegado cachea una única instancia por proceso
 * sin importar el [Context] recibido, lo que en tests (o en cualquier escenario con más
 * de un repositorio en el mismo proceso) filtra estado entre instancias. [storeName]
 * permite que cada test use un archivo propio; la app real usa siempre el default.
 */
class UserPreferencesRepository(
    private val context: Context,
    storeName: String = "mementolife_prefs",
) {
    private val dataStore: DataStore<Preferences> = PreferenceDataStoreFactory.create(
        produceFile = { context.preferencesDataStoreFile(storeName) },
    )

    private object Keys {
        val BIRTH_DATE = stringPreferencesKey("birth_date")
        val LIFE_YEARS = intPreferencesKey("life_years")
        val THEME = stringPreferencesKey("theme")
        val VIEW = stringPreferencesKey("view")
        val LOCALE = stringPreferencesKey("locale")
        val EFEMERIDE_ENABLED = booleanPreferencesKey("efemeride_enabled")
        val LAST_APPLIED_DATE = stringPreferencesKey("last_applied_date")
    }

    val preferences: Flow<UserPreferences> = dataStore.data.map { prefs ->
        UserPreferences(
            birthDate = prefs[Keys.BIRTH_DATE]?.let(LocalDate::parse),
            lifeYears = prefs[Keys.LIFE_YEARS] ?: DEFAULT_LIFE_YEARS,
            theme = prefs[Keys.THEME]?.let(Theme::valueOf) ?: Theme.DARK,
            view = prefs[Keys.VIEW]?.let(GridView::valueOf) ?: GridView.WEEKS,
            locale = prefs[Keys.LOCALE]?.let(AppLocale::valueOf) ?: AppLocale.ES,
            efemerideEnabled = prefs[Keys.EFEMERIDE_ENABLED] ?: true,
            lastAppliedDate = prefs[Keys.LAST_APPLIED_DATE]?.let(LocalDate::parse),
        )
    }

    suspend fun setBirthDate(date: LocalDate) {
        dataStore.edit { it[Keys.BIRTH_DATE] = date.toString() }
    }

    suspend fun setLifeYears(years: Int) {
        dataStore.edit { it[Keys.LIFE_YEARS] = years.coerceIn(MIN_LIFE_YEARS, MAX_LIFE_YEARS) }
    }

    suspend fun setTheme(theme: Theme) {
        dataStore.edit { it[Keys.THEME] = theme.name }
    }

    suspend fun setView(view: GridView) {
        dataStore.edit { it[Keys.VIEW] = view.name }
    }

    suspend fun setLocale(locale: AppLocale) {
        dataStore.edit { it[Keys.LOCALE] = locale.name }
    }

    suspend fun setEfemerideEnabled(enabled: Boolean) {
        dataStore.edit { it[Keys.EFEMERIDE_ENABLED] = enabled }
    }

    suspend fun setLastAppliedDate(date: LocalDate) {
        dataStore.edit { it[Keys.LAST_APPLIED_DATE] = date.toString() }
    }
}
