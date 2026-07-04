package com.mementolife.app

import android.app.Application
import com.mementolife.app.work.WallpaperUpdateWorker

class MementoLifeApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Idempotente (ExistingPeriodicWorkPolicy.KEEP): re-asegura el periódico en
        // cada arranque de proceso (p. ej. tras actualizar la app), sin duplicarlo.
        // Si todavía no hay fecha de nacimiento, el worker es un no-op (ver WallpaperApplier).
        WallpaperUpdateWorker.schedulePeriodic(this)
    }
}
