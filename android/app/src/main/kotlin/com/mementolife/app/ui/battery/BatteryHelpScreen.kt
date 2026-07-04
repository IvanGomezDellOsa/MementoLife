package com.mementolife.app.ui.battery

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.mementolife.app.R

@Composable
fun BatteryHelpScreen(onBack: () -> Unit) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Text(stringResource(R.string.battery_help_title))
        Text(stringResource(R.string.battery_help_body))
        Button(onClick = { BatteryOptimizationHelper.openBatterySettings(context) }) {
            Text(stringResource(R.string.battery_help_open_settings_button))
        }
        TextButton(onClick = onBack) {
            Text(stringResource(R.string.battery_help_back))
        }
    }
}
