package com.mementolife.app.work

import com.mementolife.app.data.AppLocale
import com.mementolife.app.data.DesignTokens
import com.mementolife.app.data.EfemerideRepository
import com.mementolife.app.data.UserPreferencesRepository
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.time.LocalDate
import java.util.UUID

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class WallpaperApplierTest {

    private fun resource(name: String): String =
        checkNotNull(javaClass.classLoader.getResourceAsStream(name)) { "recurso no encontrado: $name" }
            .bufferedReader().readText()

    // Nombre de store único por test: UserPreferencesRepository ya no comparte
    // una única instancia de DataStore por proceso (ver su comentario de clase).
    private fun newPrefsRepository() =
        UserPreferencesRepository(RuntimeEnvironment.getApplication(), storeName = "test_${UUID.randomUUID()}")

    private fun newApplier(prefsRepository: UserPreferencesRepository): WallpaperApplier {
        val tokens = DesignTokens.parse(resource("design-tokens.json"))
        val repositories = mapOf(
            AppLocale.ES to EfemerideRepository.parse(resource("es.json")),
            AppLocale.EN to EfemerideRepository.parse(resource("en.json")),
        )
        return WallpaperApplier(RuntimeEnvironment.getApplication(), prefsRepository, tokens, repositories, typeface = null)
    }

    @Test
    fun `sin fecha de nacimiento no actualiza el estado`() = runBlocking {
        val prefsRepository = newPrefsRepository()
        newApplier(prefsRepository).applyIfNeeded()
        assertEquals(null, prefsRepository.preferences.first().lastAppliedDate)
    }

    @Test
    fun `con fecha de nacimiento renderiza y guarda la fecha de hoy`() = runBlocking {
        val prefsRepository = newPrefsRepository()
        prefsRepository.setBirthDate(LocalDate.of(1990, 1, 1))

        newApplier(prefsRepository).applyIfNeeded()

        assertEquals(LocalDate.now(), prefsRepository.preferences.first().lastAppliedDate)
    }

    @Test
    fun `llamar dos veces el mismo dia no rompe la idempotencia`() = runBlocking {
        val prefsRepository = newPrefsRepository()
        prefsRepository.setBirthDate(LocalDate.of(1990, 1, 1))
        val applier = newApplier(prefsRepository)

        applier.applyIfNeeded()
        applier.applyIfNeeded() // segunda llamada el mismo día: debe ser un no-op silencioso

        assertEquals(LocalDate.now(), prefsRepository.preferences.first().lastAppliedDate)
    }
}
