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
     * Pide la excepción directo para MementoLife (no la lista genérica de todas las
     * apps, que era donde caía antes — reportado por Ivan). `ACTION_IGNORE_BATTERY_
     * OPTIMIZATION_SETTINGS` sin datos abre esa lista general; con `ACTION_REQUEST_
     * IGNORE_BATTERY_OPTIMIZATIONS` + `package:` el sistema apunta directo a esta
     * app. Requiere declarar el permiso especial en el manifest — justificado acá:
     * el propósito central de la app es trabajo en segundo plano (plan §6.2).
     */
    fun openUnrestrictedBatterySettings(context: Context) {
        val direct = Intent(
            Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
            Uri.parse("package:${context.packageName}"),
        )
        if (tryStart(context, direct)) return
        if (tryStart(context, Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))) return
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
