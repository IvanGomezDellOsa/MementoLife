package com.mementolife.app.work

import android.app.WallpaperManager
import android.content.Context
import android.os.Build
import android.view.WindowManager
import com.mementolife.app.data.AppLocale
import com.mementolife.app.data.DesignTokens
import com.mementolife.app.data.EfemerideRepository
import com.mementolife.app.data.UserPreferencesRepository
import com.mementolife.app.render.RenderRequest
import com.mementolife.app.render.WallpaperRenderer
import kotlinx.coroutines.flow.first
import java.time.LocalDate

/**
 * Re-renderiza y fija el fondo de bloqueo cuando la fecha cambió (plan §6.2/§6.3).
 * Idempotente: si ya se aplicó hoy, no hace nada salvo que se fuerce.
 */
class WallpaperApplier(
    private val context: Context,
    private val preferencesRepository: UserPreferencesRepository,
    private val designTokens: DesignTokens,
    private val efemerideRepositories: Map<AppLocale, EfemerideRepository>,
    private val typeface: android.graphics.Typeface?,
) {

    suspend fun applyIfNeeded(force: Boolean = false) {
        val prefs = preferencesRepository.preferences.first()
        val birthDate = prefs.birthDate ?: return
        val today = LocalDate.now()
        if (!force && prefs.lastAppliedDate == today) return

        val (widthPx, heightPx) = screenSizePx()
        val request = RenderRequest(
            view = prefs.view,
            theme = prefs.theme,
            locale = prefs.locale,
            birthDate = birthDate,
            today = today,
            lifeYears = prefs.lifeYears,
            efemerideEnabled = prefs.efemerideEnabled,
            efemerideText = efemerideRepositories.getValue(prefs.locale)
                .textFor(today.monthValue, today.dayOfMonth, prefs.locale),
        )

        val bitmap = WallpaperRenderer(designTokens, typeface).render(request, widthPx, heightPx)
        WallpaperManager.getInstance(context).setBitmap(bitmap, null, true, WallpaperManager.FLAG_LOCK)
        preferencesRepository.setLastAppliedDate(today)
    }

    private fun screenSizePx(): Pair<Int, Int> {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            // maximumWindowMetrics (no current): esto corre en background con el
            // application context, sin ventana; para un wallpaper lo que importa
            // es el display físico completo.
            val bounds = windowManager.maximumWindowMetrics.bounds
            return bounds.width() to bounds.height()
        }
        val metrics = context.resources.displayMetrics
        return metrics.widthPixels to metrics.heightPixels
    }
}
