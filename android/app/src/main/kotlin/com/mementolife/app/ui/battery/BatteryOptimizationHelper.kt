package com.mementolife.app.ui.battery

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings

/**
 * Deep-links a las pantallas de exención de batería / autoinicio (plan §10.1).
 * Los intents de autostart de OEM no son API pública: son best-effort y varían
 * por ROM/versión, por eso cada intento cae al siguiente si no resuelve.
 * Evita `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` a propósito: exige declarar un
 * permiso especial escrutado por la política de Play; el detalle de la app
 * (con su sección de batería) logra lo mismo sin ese costo.
 */
object BatteryOptimizationHelper {

    private val oemAutostartIntents: List<Intent> = listOf(
        Intent().setClassName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"),
        Intent().setClassName("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"),
        Intent().setClassName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"),
        Intent().setClassName("com.samsung.android.lool", "com.samsung.android.sm.ui.battery.BatteryActivity"),
    )

    fun openBatterySettings(context: Context) {
        for (intent in oemAutostartIntents) {
            if (tryStart(context, intent)) return
        }
        tryStart(context, appDetailsIntent(context))
    }

    private fun appDetailsIntent(context: Context) = Intent(
        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
        Uri.fromParts("package", context.packageName, null),
    )

    private fun tryStart(context: Context, intent: Intent): Boolean = try {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        true
    } catch (error: ActivityNotFoundException) {
        false
    } catch (error: SecurityException) {
        false
    }
}
