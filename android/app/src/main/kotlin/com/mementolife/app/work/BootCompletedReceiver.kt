package com.mementolife.app.work

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Re-encola el worker periódico tras un reinicio (plan §6.2): sin esto, WorkManager no revive solo. */
class BootCompletedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        WallpaperUpdateWorker.schedulePeriodic(context)
        WallpaperUpdateWorker.requestImmediateUpdate(context, force = false)
    }
}
