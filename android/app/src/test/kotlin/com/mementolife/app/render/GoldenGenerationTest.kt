package com.mementolife.app.render

import android.graphics.Bitmap
import android.graphics.Typeface
import com.mementolife.app.data.AppLocale
import com.mementolife.app.data.DesignTokens
import com.mementolife.app.data.EfemerideRepository
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File
import java.io.FileOutputStream
import java.time.LocalDate

/**
 * Genera los PNG de los 12 fixtures canónicos en build/golden-output/ para
 * revisión visual (plan §5, gate de F1). No compara contra render-core/golden/
 * todavía: ese baseline se arma a mano una vez aprobados estos renders.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class GoldenGenerationTest {

    @Serializable
    private data class FixtureCase(
        val id: String,
        val note: String? = null,
        val view: String,
        val theme: String,
        val locale: String,
        val birthDate: String,
        val today: String,
        val lifeYears: Int,
        val efemerideEnabled: Boolean,
    )

    @Serializable
    private data class FixturesFile(val fixtures: List<FixtureCase>)

    private fun resource(name: String): String =
        checkNotNull(javaClass.classLoader.getResourceAsStream(name)) { "recurso no encontrado: $name" }
            .bufferedReader().readText()

    @Test
    fun `genera los PNG de los fixtures canonicos`() {
        val tokens = DesignTokens.parse(resource("design-tokens.json"))
        val repositories = mapOf(
            AppLocale.ES to EfemerideRepository.parse(resource("es.json")),
            AppLocale.EN to EfemerideRepository.parse(resource("en.json")),
        )
        val fixtures = Json { ignoreUnknownKeys = true }
            .decodeFromString(FixturesFile.serializer(), resource("fixtures.json"))
            .fixtures

        val outputDir = File("build/golden-output").apply { mkdirs() }
        // Instancia por defecto de la fuente variable (sin fijar eje 'wght' todavía):
        // si el peso no calza con la referencia, lo revela esta misma revisión visual.
        val fontFile = File("src/main/assets/fonts/Fraunces.ttf")
        val typeface = Typeface.Builder(fontFile).build()
        val renderer = WallpaperRenderer(tokens, typeface)

        for (fixture in fixtures) {
            val birthDate = LocalDate.parse(fixture.birthDate)
            val today = LocalDate.parse(fixture.today)
            val locale = if (fixture.locale == "es") AppLocale.ES else AppLocale.EN

            val request = RenderRequest(
                view = if (fixture.view == "weeks") GridView.WEEKS else GridView.MONTHS,
                theme = if (fixture.theme == "dark") Theme.DARK else Theme.LIGHT,
                locale = locale,
                birthDate = birthDate,
                today = today,
                lifeYears = fixture.lifeYears,
                efemerideEnabled = fixture.efemerideEnabled,
                efemerideText = repositories.getValue(locale).textFor(today.monthValue, today.dayOfMonth, locale),
            )

            val bitmap = renderer.render(request, tokens.canvas.widthPx.toInt(), tokens.canvas.heightPx.toInt())
            FileOutputStream(File(outputDir, "${fixture.id}.png")).use { out ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            }

            // Muestra a resolución nativa de dispositivo (plan §5) para verificar el escalado.
            if (fixture.id == "base_weeks_dark_es") {
                val hiRes = renderer.render(request, 1179, 2556)
                FileOutputStream(File(outputDir, "${fixture.id}_1179x2556.png")).use { out ->
                    hiRes.compress(Bitmap.CompressFormat.PNG, 100, out)
                }
            }
        }
    }
}
