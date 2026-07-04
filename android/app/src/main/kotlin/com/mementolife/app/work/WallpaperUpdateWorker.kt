package com.mementolife.app.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.mementolife.app.data.AssetSources
import com.mementolife.app.data.UserPreferencesRepository
import kotlinx.coroutines.CancellationException
import java.util.concurrent.TimeUnit

/**
 * Chequeo periódico cada 6 h (plan §6.2, decisión cerrada): el worker es casi
 * gratis cuando la fecha no cambió y solo renderiza cuando corresponde, así
 * que lógicamente el fondo se actualiza una vez por día, lo antes posible tras
 * la medianoche dentro de esas 4 ventanas.
 */
class WallpaperUpdateWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            val tokens = AssetSources.loadDesignTokens(applicationContext)
            val efemerideRepositories = AssetSources.loadEfemerideRepositories(applicationContext)
            val typeface = AssetSources.loadFrauncesTypeface(applicationContext)
            val preferencesRepository = UserPreferencesRepository(applicationContext)
            val applier = WallpaperApplier(applicationContext, preferencesRepository, tokens, efemerideRepositories, typeface)
            applier.applyIfNeeded(force = inputData.getBoolean(KEY_FORCE, false))
            Result.success()
        } catch (cancellation: CancellationException) {
            // La cancelación del worker (p. ej. REPLACE de un update inmediato por
            // otro) no es un error: debe propagarse, no convertirse en retry.
            throw cancellation
        } catch (error: Exception) {
            // Reintentos acotados: ante un error persistente no tiene sentido
            // insistir con backoff infinito — la próxima ventana del periódico
            // de 6 h ya es la siguiente oportunidad natural.
            if (runAttemptCount < MAX_RUN_ATTEMPTS - 1) Result.retry() else Result.failure()
        }
    }

    companion object {
        private const val PERIODIC_WORK_NAME = "wallpaper_update_periodic"
        private const val IMMEDIATE_WORK_NAME = "wallpaper_update_immediate"
        private const val KEY_FORCE = "force"
        private const val MAX_RUN_ATTEMPTS = 3

        fun schedulePeriodic(context: Context) {
            val request = PeriodicWorkRequestBuilder<WallpaperUpdateWorker>(6, TimeUnit.HOURS).build()
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(PERIODIC_WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request)
        }

        /** Re-render inmediato: cambios de configuración (§6.1) o el primer render tras el onboarding. */
        fun requestImmediateUpdate(context: Context, force: Boolean = true) {
            val request = OneTimeWorkRequestBuilder<WallpaperUpdateWorker>()
                .setInputData(workDataOf(KEY_FORCE to force))
                .build()
            WorkManager.getInstance(context)
                .enqueueUniqueWork(IMMEDIATE_WORK_NAME, ExistingWorkPolicy.REPLACE, request)
        }
    }
}
