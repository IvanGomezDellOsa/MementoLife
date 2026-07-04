package com.mementolife.app.work

import android.app.WallpaperManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Typeface
import android.os.Build
import android.view.WindowManager
import com.mementolife.app.data.AppLocale
import com.mementolife.app.data.AssetSources
import com.mementolife.app.data.DesignTokens
import com.mementolife.app.data.EfemerideRepository
import com.mementolife.app.data.UserPreferences
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
    private val typeface: Typeface?,
) {

    suspend fun applyIfNeeded(force: Boolean = false) {
        val prefs = preferencesRepository.preferences.first()
        val birthDate = prefs.birthDate ?: return
        val today = LocalDate.now()
        if (!force && prefs.lastAppliedDate == today) return

        val bitmap = render(prefs, birthDate, today)
        WallpaperManager.getInstance(context).setBitmap(bitmap, null, true, wallpaperFlags())
        preferencesRepository.setLastAppliedDate(today)
    }

    /**
     * Xiaomi/MIUI y Samsung/One UI ignoran en silencio `setBitmap(..., FLAG_LOCK)` —
     * no tiran excepción, simplemente no aplican nada (confirmado: es una restricción
     * de fabricante documentada por el propio soporte de Xiaomi, no un bug nuestro ni
     * algo resoluble con otro flag o permiso). En esos fabricantes se aplica también
     * a la pantalla de inicio (única forma de que el fondo cambie de verdad); en el
     * resto de los dispositivos se respeta "solo bloqueo" (plan §6.3).
     */
    private fun wallpaperFlags(): Int {
        val manufacturer = Build.MANUFACTURER.lowercase()
        val restrictsLockOnly = manufacturer == "xiaomi" || manufacturer == "samsung"
        return if (restrictsLockOnly) {
            WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
        } else {
            WallpaperManager.FLAG_LOCK
        }
    }

    /** Renderiza sin tocar WallpaperManager: para la vista previa en la app. */
    suspend fun renderPreview(): Bitmap? {
        val prefs = preferencesRepository.preferences.first()
        val birthDate = prefs.birthDate ?: return null
        return render(prefs, birthDate, LocalDate.now())
    }

    private fun render(prefs: UserPreferences, birthDate: LocalDate, today: LocalDate): Bitmap {
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
        return WallpaperRenderer(designTokens, typeface).render(request, widthPx, heightPx)
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

    companion object {
        /** Arma el applier cargando tokens/efemérides/tipografía desde assets (un solo lugar, sin duplicar en cada caller). */
        fun create(context: Context, preferencesRepository: UserPreferencesRepository): WallpaperApplier {
            val tokens = AssetSources.loadDesignTokens(context)
            val efemerideRepositories = AssetSources.loadEfemerideRepositories(context)
            val typeface = AssetSources.loadFrauncesTypeface(context)
            return WallpaperApplier(context, preferencesRepository, tokens, efemerideRepositories, typeface)
        }
    }
}
