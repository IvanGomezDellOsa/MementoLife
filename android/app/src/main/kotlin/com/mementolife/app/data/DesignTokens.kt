package com.mementolife.app.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * Espejo tipado de render-core/design-tokens.json. Los nombres de campo
 * calzan exactos con el JSON; cualquier valor nuevo se agrega ahí primero.
 */
@Serializable
data class DesignTokens(
    val canvas: Canvas,
    val colors: Colors,
    val typography: Typography,
    val grid: Grid,
) {
    @Serializable
    data class Canvas(val widthPx: Double, val heightPx: Double)

    @Serializable
    data class ThemedColor(val dark: String, val light: String)

    @Serializable
    data class ThemedOpacity(val dark: Double, val light: Double)

    @Serializable
    data class Colors(val background: ThemedColor, val ink: ThemedColor)

    @Serializable
    data class Typography(
        val fontFamily: String,
        val footer: Footer,
        val efemeride: Efemeride,
    ) {
        @Serializable
        data class Footer(
            val sizePx: Double,
            val letterSpacingPx: Double,
            val opacity: Double,
            val baselineFromGridAreaBottomPx: Double,
        )

        @Serializable
        data class Efemeride(
            val sizePx: Double,
            val lineHeightMultiplier: Double,
            val marginSidePx: Double,
            val marginBottomPx: Double,
            val opacity: ThemedOpacity,
        )
    }

    @Serializable
    data class Grid(
        val areaTopPx: Double,
        val areaWidthPx: Double,
        val areaHeightPx: Double,
        val footerReservedPx: Double,
        val usefulWidthPx: Double,
        val marginSidePx: Double,
        val weeks: Variant,
        val months: Variant,
        val opacity: OpacityBlock,
    ) {
        @Serializable
        data class Variant(
            val columns: Int,
            val dotRadiusPx: Double,
            val bandEveryRows: Int,
            val bandGapPx: Double,
            val currentRingRadiusPx: Double,
            val currentRingStrokePx: Double,
        )

        @Serializable
        data class OpacityBlock(val past: ThemedOpacity, val future: ThemedOpacity)
    }

    companion object {
        private val json = Json { ignoreUnknownKeys = true }

        fun parse(source: String): DesignTokens = json.decodeFromString(source)
    }
}
