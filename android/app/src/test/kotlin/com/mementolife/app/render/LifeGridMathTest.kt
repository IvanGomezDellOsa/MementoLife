package com.mementolife.app.render

import com.mementolife.app.data.AppLocale
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

class LifeGridMathTest {

    @Test
    fun `yearsLived matches days over days-per-year`() {
        val birth = LocalDate.of(1990, 1, 1)
        val today = LocalDate.of(2023, 7, 2)
        assertEquals(33.4983, LifeGridMath.yearsLived(birth, today), 0.0001)
    }

    @Test
    fun `yearsLived is zero on the birthday itself`() {
        val birth = LocalDate.of(1990, 1, 1)
        assertEquals(0.0, LifeGridMath.yearsLived(birth, birth), 0.0)
    }

    @Test
    fun `weeks totals and rows use lifeYears directly, 52 columnas fijas`() {
        assertEquals(4160, LifeGridMath.totalUnits(GridView.WEEKS, 80))
        assertEquals(80, LifeGridMath.rows(GridView.WEEKS, 80))
        assertEquals(2080, LifeGridMath.totalUnits(GridView.WEEKS, 40))
        assertEquals(40, LifeGridMath.rows(GridView.WEEKS, 40))
    }

    @Test
    fun `months rows redondean hacia arriba con 24 columnas fijas`() {
        assertEquals(960, LifeGridMath.totalUnits(GridView.MONTHS, 80))
        assertEquals(40, LifeGridMath.rows(GridView.MONTHS, 80))
        // 41 años -> 492 meses -> 21 filas (504 celdas de grilla, últimas 12 sin dibujar)
        assertEquals(492, LifeGridMath.totalUnits(GridView.MONTHS, 41))
        assertEquals(21, LifeGridMath.rows(GridView.MONTHS, 41))
    }

    @Test
    fun `currentIndex semanas caso base del handoff`() {
        val yearsLived = LifeGridMath.yearsLived(LocalDate.of(1990, 1, 1), LocalDate.of(2023, 7, 2))
        assertEquals(1741, LifeGridMath.currentIndex(GridView.WEEKS, yearsLived, 80))
    }

    @Test
    fun `currentIndex meses caso base del handoff`() {
        val yearsLived = LifeGridMath.yearsLived(LocalDate.of(1990, 1, 1), LocalDate.of(2023, 7, 2))
        assertEquals(401, LifeGridMath.currentIndex(GridView.MONTHS, yearsLived, 80))
    }

    @Test
    fun `currentIndex es cero el dia del cumpleanos`() {
        val birth = LocalDate.of(1990, 1, 1)
        assertEquals(0, LifeGridMath.currentIndex(GridView.WEEKS, LifeGridMath.yearsLived(birth, birth), 80))
        assertEquals(0, LifeGridMath.currentIndex(GridView.MONTHS, LifeGridMath.yearsLived(birth, birth), 80))
    }

    @Test
    fun `currentIndex se clampea cuando yearsLived supera lifeYears por dias bisiestos`() {
        // 2000-06-10 -> 2040-06-10: 40 años de calendario exactos, pero 14610 dias / 365.2425 > 40.0
        val yearsLived = LifeGridMath.yearsLived(LocalDate.of(2000, 6, 10), LocalDate.of(2040, 6, 10))
        assertTrue(yearsLived > 40.0)
        assertEquals(2079, LifeGridMath.currentIndex(GridView.WEEKS, yearsLived, 40))
    }

    @Test
    fun `percentLived redondea y se clampea a 0-100`() {
        val yearsLived = LifeGridMath.yearsLived(LocalDate.of(1990, 1, 1), LocalDate.of(2023, 7, 2))
        assertEquals(42, LifeGridMath.percentLived(yearsLived, 80))
        assertEquals(100, LifeGridMath.percentLived(50.0, 40))
        assertEquals(0, LifeGridMath.percentLived(0.0, 80))
    }

    @Test
    fun `footerText en espanol para semanas y meses`() {
        assertEquals(
            "42 % · semana 1742 de 4160",
            LifeGridMath.footerText(GridView.WEEKS, AppLocale.ES, 1742, 4160, 42),
        )
        assertEquals(
            "42 % · mes 402 de 960",
            LifeGridMath.footerText(GridView.MONTHS, AppLocale.ES, 402, 960, 42),
        )
    }

    @Test
    fun `footerText en ingles para semanas y meses`() {
        assertEquals(
            "42 % · week 1742 of 4160",
            LifeGridMath.footerText(GridView.WEEKS, AppLocale.EN, 1742, 4160, 42),
        )
        assertEquals(
            "42 % · month 402 of 960",
            LifeGridMath.footerText(GridView.MONTHS, AppLocale.EN, 402, 960, 42),
        )
    }
}
