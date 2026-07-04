package com.mementolife.app.render

import android.graphics.Paint
import android.graphics.Typeface
import com.mementolife.app.data.DesignTokens
import com.mementolife.app.data.EfemerideEntry
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * Diagnóstico temporal: cuántas de las 366 efemérides envuelven a más
 * líneas de las que caben entre el fin de la grilla y el margen inferior,
 * con el ancho/tamaño de fuente actuales. Se borra después de decidir
 * cómo tratar el desborde (no es parte de la suite permanente).
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class EfemerideLengthDiagnosticTest {

    private fun resource(name: String): String =
        checkNotNull(javaClass.classLoader.getResourceAsStream(name)) { "recurso no encontrado: $name" }
            .bufferedReader().readText()

    @Test
    fun `mide cuantas efemerides desbordan el espacio disponible`() {
        val tokens = DesignTokens.parse(resource("design-tokens.json"))
        val typeface = Typeface.Builder(File("src/main/assets/fonts/Fraunces.ttf")).build()
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            textSize = tokens.typography.efemeride.sizePx.toFloat()
            this.typeface = typeface
        }
        val maxWidth = (tokens.canvas.widthPx - 2 * tokens.typography.efemeride.marginSidePx).toFloat()
        val lineHeight = tokens.typography.efemeride.sizePx * tokens.typography.efemeride.lineHeightMultiplier
        val availableHeight = tokens.canvas.heightPx - tokens.typography.efemeride.marginBottomPx -
            (tokens.grid.areaTopPx + tokens.grid.areaHeightPx)
        val safeLines = availableHeight / lineHeight

        fun wrap(text: String): Int {
            val words = text.split(" ")
            var lines = 1
            var current = StringBuilder()
            for (word in words) {
                val candidate = if (current.isEmpty()) word else "$current $word"
                if (current.isEmpty() || paint.measureText(candidate) <= maxWidth) {
                    current = StringBuilder(candidate)
                } else {
                    lines++
                    current = StringBuilder(word)
                }
            }
            return lines
        }

        println("DIAG run 3 ${System.nanoTime()}")
        println("DIAG espacio seguro: ${safeLines} lineas (${availableHeight}px util / ${lineHeight}px por linea)")

        val esEntries = Json { ignoreUnknownKeys = true }
            .decodeFromString<List<EfemerideEntry>>(resource("es.json"))
        val esOverflowing = esEntries.filter { wrap(it.textEs ?: "") > safeLines }
        println("DIAG es: ${esEntries.size} entradas, exceden: ${esOverflowing.size}")
        esOverflowing.take(10).forEach {
            println("DIAG es desborda (${wrap(it.textEs ?: "")} lineas): ${it.month}/${it.day} -> ${it.textEs}")
        }

        val enEntries = Json { ignoreUnknownKeys = true }
            .decodeFromString<List<EfemerideEntry>>(resource("en.json"))
        val enOverflowing = enEntries.filter { wrap(it.textEn ?: "") > safeLines }
        println("DIAG en: ${enEntries.size} entradas, exceden: ${enOverflowing.size}")
        enOverflowing.take(10).forEach {
            println("DIAG en desborda (${wrap(it.textEn ?: "")} lineas): ${it.month}/${it.day} -> ${it.textEn}")
        }
    }
}
