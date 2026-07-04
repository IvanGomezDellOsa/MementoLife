package com.mementolife.app.ui.battery

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings

/**
 * Deep-links a las pantallas de autoinicio / batería sin restricciones (plan §10.1).
 * Son dos pantallas DISTINTAS en Xiaomi/MIUI (autoinicio vive en la app de
 * seguridad; batería sin restricciones en los ajustes del sistema) — antes un
 * solo botón decía "ajustes de batería" pero abría autoinicio, lo cual confundía.
 * Los intents de autoinicio de OEM no son API pública: son best-effort y caen
 * al siguiente si no resuelven.
 */
object BatteryOptimizationHelper {

    private val oemAutostartIntents: List<Intent> = listOf(
        Intent().setClassName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"),
        Intent().setClassName("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"),
        Intent().setClassName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"),
        Intent().setClassName("com.samsung.android.lool", "com.samsung.android.sm.ui.battery.BatteryActivity"),
    )

    fun openAutostartSettings(context: Context) {
        for (intent in oemAutostartIntents) {
            if (tryStart(context, intent)) return
        }
        tryStart(context, appDetailsIntent(context))
    }

    /**
     * Lista del sistema de optimización de batería por app (sin el permiso especial
     * `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, escrutado por la política de Play).
     */
    fun openUnrestrictedBatterySettings(context: Context) {
        if (tryStart(context, Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATIONS_SETTINGS))) return
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
