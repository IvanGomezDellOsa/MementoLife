package com.mementolife.app.render

import com.mementolife.app.data.AppLocale
import com.mementolife.app.data.DesignTokens
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.time.LocalDate

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class WallpaperRendererTest {

    private fun resource(name: String): String =
        checkNotNull(javaClass.classLoader.getResourceAsStream(name)) { "recurso no encontrado: $name" }
            .bufferedReader().readText()

    private val tokens = DesignTokens.parse(resource("design-tokens.json"))

    private fun request(theme: Theme, efemerideEnabled: Boolean = false) = RenderRequest(
        view = GridView.WEEKS,
        theme = theme,
        locale = AppLocale.ES,
        birthDate = LocalDate.of(1990, 1, 1),
        today = LocalDate.of(2023, 7, 2),
        lifeYears = 80,
        efemerideEnabled = efemerideEnabled,
        efemerideText = null,
    )

    @Test
    fun `el bitmap respeta el ancho y alto pedidos`() {
        val bitmap = WallpaperRenderer(tokens).render(request(Theme.DARK), 1179, 2556)
        assertEquals(1179, bitmap.width)
        assertEquals(2556, bitmap.height)
    }

    @Test
    fun `el fondo dark es el color de tokens, sin escalar`() {
        val bitmap = WallpaperRenderer(tokens).render(request(Theme.DARK), 360, 780)
        // Esquina superior izquierda: fuera del área de grilla, debe ser el fondo puro.
        assertEquals(0xFF161310.toInt(), bitmap.getPixel(2, 2))
    }

    @Test
    fun `el fondo light es el color de tokens`() {
        val bitmap = WallpaperRenderer(tokens).render(request(Theme.LIGHT), 360, 780)
        assertEquals(0xFFF4F0E8.toInt(), bitmap.getPixel(2, 2))
    }

    @Test
    fun `sin efemeride el bloque inferior no se dibuja`() {
        val withEfemeride = WallpaperRenderer(tokens).render(
            request(Theme.DARK, efemerideEnabled = true).copy(efemerideText = "20 de julio, 1969 — texto de prueba."),
            360,
            780,
        )
        val withoutEfemeride = WallpaperRenderer(tokens).render(request(Theme.DARK, efemerideEnabled = false), 360, 780)

        // Franja bajo la grilla y el pie (que terminan en y=700 aprox): solo la efeméride pinta ahí.
        val backgroundColor = 0xFF161310.toInt()
        assertEquals(false, hasNonBackgroundPixel(withoutEfemeride, yRange = 702..779, backgroundColor))
        assertEquals(true, hasNonBackgroundPixel(withEfemeride, yRange = 702..779, backgroundColor))
    }

    private fun hasNonBackgroundPixel(bitmap: android.graphics.Bitmap, yRange: IntRange, backgroundColor: Int): Boolean {
        for (y in yRange) {
            for (x in 0 until bitmap.width) {
                if (bitmap.getPixel(x, y) != backgroundColor) return true
            }
        }
        return false
    }
}
