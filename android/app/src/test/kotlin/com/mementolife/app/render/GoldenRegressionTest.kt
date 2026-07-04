package com.mementolife.app.render

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Typeface
import com.mementolife.app.data.AppLocale
import com.mementolife.app.data.DesignTokens
import com.mementolife.app.data.EfemerideRepository
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File
import java.time.LocalDate

/**
 * Regresión visual permanente (plan §5): re-renderiza los 12 fixtures y los
 * compara contra el baseline aprobado en render-core/golden/. Si un cambio
 * de diseño es intencional, hay que regenerar los goldens (ver
 * GoldenGenerationTest) y volver a aprobarlos a ojo antes de actualizarlos.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class GoldenRegressionTest {

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

    private fun goldenBitmap(id: String): Bitmap {
        val stream = checkNotNull(javaClass.classLoader.getResourceAsStream("golden/$id.png")) {
            "golden no encontrado para $id: correr GoldenGenerationTest, revisarlo a ojo y copiarlo a render-core/golden/"
        }
        return BitmapFactory.decodeStream(stream)
    }

    /** Fracción de píxeles cuyo canal difiere en más de [tolerance] respecto del golden. */
    private fun diffFraction(actual: Bitmap, expected: Bitmap, tolerance: Int = 4): Double {
        require(actual.width == expected.width && actual.height == expected.height) {
            "tamaños distintos: ${actual.width}x${actual.height} vs ${expected.width}x${expected.height}"
        }
        var different = 0
        val total = actual.width * actual.height
        for (y in 0 until actual.height) {
            for (x in 0 until actual.width) {
                val a = actual.getPixel(x, y)
                val e = expected.getPixel(x, y)
                val closeEnough = kotlin.math.abs(Color.alpha(a) - Color.alpha(e)) <= tolerance &&
                    kotlin.math.abs(Color.red(a) - Color.red(e)) <= tolerance &&
                    kotlin.math.abs(Color.green(a) - Color.green(e)) <= tolerance &&
                    kotlin.math.abs(Color.blue(a) - Color.blue(e)) <= tolerance
                if (!closeEnough) different++
            }
        }
        return different.toDouble() / total
    }

    @Test
    fun `los 12 fixtures no se desvian mas de 0,5 porciento respecto del golden aprobado`() {
        val tokens = DesignTokens.parse(resource("design-tokens.json"))
        val repositories = mapOf(
            AppLocale.ES to EfemerideRepository.parse(resource("es.json")),
            AppLocale.EN to EfemerideRepository.parse(resource("en.json")),
        )
        val fixtures = Json { ignoreUnknownKeys = true }
            .decodeFromString(FixturesFile.serializer(), resource("fixtures.json"))
            .fixtures

        val typeface = Typeface.Builder(File("src/main/assets/fonts/Fraunces.ttf")).build()
        val renderer = WallpaperRenderer(tokens, typeface)

        for (fixture in fixtures) {
            val locale = if (fixture.locale == "es") AppLocale.ES else AppLocale.EN
            val today = LocalDate.parse(fixture.today)
            val request = RenderRequest(
                view = if (fixture.view == "weeks") GridView.WEEKS else GridView.MONTHS,
                theme = if (fixture.theme == "dark") Theme.DARK else Theme.LIGHT,
                locale = locale,
                birthDate = LocalDate.parse(fixture.birthDate),
                today = today,
                lifeYears = fixture.lifeYears,
                efemerideEnabled = fixture.efemerideEnabled,
                efemerideText = repositories.getValue(locale).textFor(today.monthValue, today.dayOfMonth, locale),
            )

            val actual = renderer.render(request, tokens.canvas.widthPx.toInt(), tokens.canvas.heightPx.toInt())
            val expected = goldenBitmap(fixture.id)
            val fraction = diffFraction(actual, expected)
            assertTrue(
                "${fixture.id}: ${"%.3f".format(fraction * 100)}% de píxeles distintos (máximo 0.5%)",
                fraction <= 0.005,
            )
        }
    }
}
