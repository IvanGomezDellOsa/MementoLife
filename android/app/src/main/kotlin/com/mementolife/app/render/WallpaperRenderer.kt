package com.mementolife.app.render

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import com.mementolife.app.data.AppLocale
import com.mementolife.app.data.DesignTokens
import java.time.LocalDate
import kotlin.math.roundToInt

enum class Theme { DARK, LIGHT }

data class RenderRequest(
    val view: GridView,
    val theme: Theme,
    val locale: AppLocale,
    val birthDate: LocalDate,
    val today: LocalDate,
    val lifeYears: Int,
    val efemerideEnabled: Boolean,
    val efemerideText: String?,
)

/**
 * Dibuja el fondo de bloqueo sobre un Bitmap a resolución real. No dibuja
 * fecha ni hora (decisión cerrada, plan §5): esa franja queda como espacio
 * negativo para el reloj del sistema.
 */
class WallpaperRenderer(
    private val tokens: DesignTokens,
    private val typeface: Typeface? = null,
) {

    fun render(request: RenderRequest, widthPx: Int, heightPx: Int): Bitmap {
        val bitmap = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        val backgroundColor = themedColor(tokens.colors.background, request.theme)
        val inkColor = themedColor(tokens.colors.ink, request.theme)
        canvas.drawColor(backgroundColor)

        val scale = minOf(
            widthPx / tokens.canvas.widthPx,
            heightPx / tokens.canvas.heightPx,
        ).toFloat()
        val offsetX = (widthPx - tokens.canvas.widthPx.toFloat() * scale) / 2f
        val offsetY = (heightPx - tokens.canvas.heightPx.toFloat() * scale) / 2f

        canvas.save()
        canvas.translate(offsetX, offsetY)
        canvas.scale(scale, scale)

        val yearsLived = LifeGridMath.yearsLived(request.birthDate, request.today)
        val totalUnits = LifeGridMath.totalUnits(request.view, request.lifeYears)
        val rows = LifeGridMath.rows(request.view, request.lifeYears)
        val currentIndex = LifeGridMath.currentIndex(request.view, yearsLived, request.lifeYears)

        drawGrid(canvas, request.view, totalUnits, rows, currentIndex, inkColor, request.theme)
        drawFooter(canvas, request, currentIndex, totalUnits, yearsLived, inkColor)

        val efemerideText = request.efemerideText
        if (request.efemerideEnabled && !efemerideText.isNullOrBlank()) {
            drawEfemeride(canvas, efemerideText, inkColor, request.theme)
        }

        canvas.restore()
        return bitmap
    }

    private fun drawGrid(
        canvas: Canvas,
        view: GridView,
        totalUnits: Int,
        rows: Int,
        currentIndex: Int,
        inkColor: Int,
        theme: Theme,
    ) {
        val grid = tokens.grid
        val variant = if (view == GridView.WEEKS) grid.weeks else grid.months
        val usableHeight = grid.areaHeightPx - grid.footerReservedPx
        val bandGaps = if (rows > 1) (rows - 1) / variant.bandEveryRows else 0
        val cellHeight = (usableHeight - bandGaps * variant.bandGapPx) / rows
        val cellWidth = grid.usefulWidthPx / variant.columns

        val pastOpacity = themedOpacity(grid.opacity.past, theme)
        val futureOpacity = themedOpacity(grid.opacity.future, theme)

        val pastPaint = fillPaint(inkColor, pastOpacity)
        val futurePaint = fillPaint(inkColor, futureOpacity)
        val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = inkColor
            alpha = 255
            style = Paint.Style.STROKE
            strokeWidth = variant.currentRingStrokePx.toFloat()
        }

        for (i in 0 until totalUnits) {
            val column = i % variant.columns
            val row = i / variant.columns
            val cx = (grid.marginSidePx + column * cellWidth + cellWidth / 2).toFloat()
            val cy = (
                grid.areaTopPx +
                    row * cellHeight +
                    (row / variant.bandEveryRows) * variant.bandGapPx +
                    cellHeight / 2
                ).toFloat()
            when {
                i == currentIndex -> canvas.drawCircle(cx, cy, variant.currentRingRadiusPx.toFloat(), ringPaint)
                i < currentIndex -> canvas.drawCircle(cx, cy, variant.dotRadiusPx.toFloat(), pastPaint)
                else -> canvas.drawCircle(cx, cy, variant.dotRadiusPx.toFloat(), futurePaint)
            }
        }
    }

    private fun drawFooter(
        canvas: Canvas,
        request: RenderRequest,
        currentIndex: Int,
        totalUnits: Int,
        yearsLived: Double,
        inkColor: Int,
    ) {
        val footer = tokens.typography.footer
        val percent = LifeGridMath.percentLived(yearsLived, request.lifeYears)
        val text = LifeGridMath.footerText(
            view = request.view,
            locale = request.locale,
            currentNumber = currentIndex + 1,
            total = totalUnits,
            percent = percent,
        )

        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = inkColor
            alpha = (footer.opacity * 255).roundToInt()
            textSize = footer.sizePx.toFloat()
            letterSpacing = (footer.letterSpacingPx / footer.sizePx).toFloat()
            textAlign = Paint.Align.CENTER
            typeface = this@WallpaperRenderer.typeface
        }

        val x = (tokens.grid.areaWidthPx / 2).toFloat()
        val y = (tokens.grid.areaTopPx + tokens.grid.areaHeightPx - footer.baselineFromGridAreaBottomPx).toFloat()
        canvas.drawText(text, x, y, paint)
    }

    private fun drawEfemeride(canvas: Canvas, text: String, inkColor: Int, theme: Theme) {
        val efemeride = tokens.typography.efemeride
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = inkColor
            alpha = (themedOpacity(efemeride.opacity, theme) * 255).roundToInt()
            textSize = efemeride.sizePx.toFloat()
            typeface = this@WallpaperRenderer.typeface
        }

        val maxWidth = (tokens.canvas.widthPx - 2 * efemeride.marginSidePx).toInt()
        val layout = StaticLayout.Builder
            .obtain(text, 0, text.length, paint, maxWidth)
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setLineSpacing(0f, efemeride.lineHeightMultiplier.toFloat())
            .build()

        canvas.save()
        canvas.translate(
            efemeride.marginSidePx.toFloat(),
            (tokens.canvas.heightPx - efemeride.marginBottomPx).toFloat() - layout.height,
        )
        layout.draw(canvas)
        canvas.restore()
    }

    private fun fillPaint(color: Int, opacity: Double) = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        alpha = (opacity * 255).roundToInt()
        style = Paint.Style.FILL
    }

    private fun themedColor(pair: DesignTokens.ThemedColor, theme: Theme): Int =
        Color.parseColor(if (theme == Theme.DARK) pair.dark else pair.light)

    private fun themedOpacity(pair: DesignTokens.ThemedOpacity, theme: Theme): Double =
        if (theme == Theme.DARK) pair.dark else pair.light
}
