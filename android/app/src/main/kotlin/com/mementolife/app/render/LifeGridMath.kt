package com.mementolife.app.render

import com.mementolife.app.data.AppLocale
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.floor
import kotlin.math.min
import kotlin.math.roundToInt

enum class GridView { WEEKS, MONTHS }

/** Reglas de cálculo cerradas en el plan (§5) y verificadas contra reference.html. */
object LifeGridMath {
    private const val DAYS_PER_YEAR = 365.2425
    private const val WEEKS_PER_YEAR = 52
    private const val MONTHS_PER_YEAR = 12
    private const val MONTHS_COLUMNS = 24

    fun yearsLived(birthDate: LocalDate, today: LocalDate): Double =
        ChronoUnit.DAYS.between(birthDate, today) / DAYS_PER_YEAR

    fun totalUnits(view: GridView, lifeYears: Int): Int = when (view) {
        GridView.WEEKS -> lifeYears * WEEKS_PER_YEAR
        GridView.MONTHS -> lifeYears * MONTHS_PER_YEAR
    }

    /** Filas de la grilla: semanas usa lifeYears filas exactas; meses redondea hacia arriba (24 columnas fijas). */
    fun rows(view: GridView, lifeYears: Int): Int = when (view) {
        GridView.WEEKS -> lifeYears
        GridView.MONTHS -> {
            val totalMonths = lifeYears * MONTHS_PER_YEAR
            (totalMonths + MONTHS_COLUMNS - 1) / MONTHS_COLUMNS
        }
    }

    /**
     * Índice (0-based) de la celda "actual" (el anillo vacío). Clampeado al último índice
     * válido: yearsLived puede superar lifeYears por los días bisiestos en cumpleaños redondos.
     */
    fun currentIndex(view: GridView, yearsLived: Double, lifeYears: Int): Int {
        val unitsPerYear = when (view) {
            GridView.WEEKS -> WEEKS_PER_YEAR
            GridView.MONTHS -> MONTHS_PER_YEAR
        }
        val raw = floor(yearsLived * unitsPerYear).toInt()
        val lastValid = totalUnits(view, lifeYears) - 1
        return min(raw, lastValid).coerceAtLeast(0)
    }

    fun percentLived(yearsLived: Double, lifeYears: Int): Int =
        (yearsLived / lifeYears * 100).roundToInt().coerceIn(0, 100)

    /**
     * "{n} % · semana X de Y" / "{n} % · week X of Y" (ídem "mes"/"month").
     * Con espacio antes del signo %, como en reference.html; sin "vivido"/"lived"
     * (decisión del gate F0).
     */
    fun footerText(view: GridView, locale: AppLocale, currentNumber: Int, total: Int, percent: Int): String {
        val unit = when (view to locale) {
            GridView.WEEKS to AppLocale.ES -> "semana"
            GridView.WEEKS to AppLocale.EN -> "week"
            GridView.MONTHS to AppLocale.ES -> "mes"
            GridView.MONTHS to AppLocale.EN -> "month"
            else -> error("combinación no soportada")
        }
        return when (locale) {
            AppLocale.ES -> "$percent % · $unit $currentNumber de $total"
            AppLocale.EN -> "$percent % · $unit $currentNumber of $total"
        }
    }
}
