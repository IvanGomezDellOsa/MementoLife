package com.mementolife.app.data

import org.junit.Assert.assertEquals
import org.junit.Test

class DesignTokensTest {

    private fun load() = DesignTokens.parse(
        checkNotNull(javaClass.classLoader.getResourceAsStream("design-tokens.json"))
            .bufferedReader().readText(),
    )

    @Test
    fun `parsea el canvas de referencia 360x780`() {
        val tokens = load()
        assertEquals(360.0, tokens.canvas.widthPx, 0.0)
        assertEquals(780.0, tokens.canvas.heightPx, 0.0)
    }

    @Test
    fun `parsea colores de fondo y tinta`() {
        val tokens = load()
        assertEquals("#161310", tokens.colors.background.dark)
        assertEquals("#f4f0e8", tokens.colors.background.light)
        assertEquals("#eae3d4", tokens.colors.ink.dark)
        assertEquals("#2b2721", tokens.colors.ink.light)
    }

    @Test
    fun `parsea radios y anillos de semanas y meses`() {
        val tokens = load()
        assertEquals(1.9, tokens.grid.weeks.dotRadiusPx, 0.0)
        assertEquals(2.95, tokens.grid.weeks.currentRingRadiusPx, 0.0)
        assertEquals(3.2, tokens.grid.months.dotRadiusPx, 0.0)
        assertEquals(4.6, tokens.grid.months.currentRingRadiusPx, 0.0)
    }

    @Test
    fun `parsea opacidad de efemeride distinta por tema`() {
        val tokens = load()
        assertEquals(0.48, tokens.typography.efemeride.opacity.dark, 0.0)
        assertEquals(0.55, tokens.typography.efemeride.opacity.light, 0.0)
    }
}
