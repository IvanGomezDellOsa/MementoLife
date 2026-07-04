package com.mementolife.app.ui.battery

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.mementolife.app.ui.strings.UiStrings

@Composable
fun BatteryHelpScreen(strings: UiStrings, onBack: () -> Unit) {
    val context = LocalContext.current

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(strings.batteryHelpTitle, style = MaterialTheme.typography.titleLarge)
        Text(strings.batteryHelpBody, style = MaterialTheme.typography.bodyMedium)
        Text(strings.batteryHelpLowUsage, style = MaterialTheme.typography.bodySmall)

        Button(onClick = { BatteryOptimizationHelper.openAutostartSettings(context) }) {
            Text(strings.autostartButton)
        }
        OutlinedButton(onClick = { BatteryOptimizationHelper.openUnrestrictedBatterySettings(context) }) {
            Text(strings.unrestrictedBatteryButton)
        }

        Text(strings.miuiTip, style = MaterialTheme.typography.bodySmall)

        TextButton(onClick = onBack) { Text(strings.back) }
    }
}
