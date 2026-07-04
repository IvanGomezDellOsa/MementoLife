package com.mementolife.app.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cake
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Timeline
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.Wallpaper
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mementolife.app.data.AppLocale
import com.mementolife.app.data.MAX_LIFE_YEARS
import com.mementolife.app.data.MIN_LIFE_YEARS
import com.mementolife.app.data.UserPreferences
import com.mementolife.app.render.GridView
import com.mementolife.app.render.Theme
import com.mementolife.app.ui.common.BirthDatePickerDialog
import com.mementolife.app.ui.strings.UiStrings
import com.mementolife.app.work.ApplyOutcome
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    strings: UiStrings,
    preferences: UserPreferences,
    onLocaleChange: (AppLocale) -> Unit,
    onThemeChange: (Theme) -> Unit,
    onViewChange: (GridView) -> Unit,
    onBirthDateChange: (LocalDate) -> Unit,
    onLifeYearsChange: (Int) -> Unit,
    onEfemerideEnabledChange: (Boolean) -> Unit,
    onOpenBatteryHelp: () -> Unit,
    onOpenPreview: () -> Unit,
    onApplyNow: suspend () -> ApplyOutcome,
) {
    var showDatePicker by remember { mutableStateOf(false) }
    var applying by remember { mutableStateOf(false) }
    var applyResult by remember { mutableStateOf<ApplyOutcome?>(null) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            strings.settingsTitle,
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.primary,
        )

        SettingCard(Icons.Filled.Language, strings.languageLabel, strings.languageCaption) {
            SingleChoiceSegmentedButtonRow {
                SegmentedButton(
                    selected = preferences.locale == AppLocale.ES,
                    onClick = { onLocaleChange(AppLocale.ES) },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                ) { Text(strings.languageEs) }
                SegmentedButton(
                    selected = preferences.locale == AppLocale.EN,
                    onClick = { onLocaleChange(AppLocale.EN) },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                ) { Text(strings.languageEn) }
            }
        }

        SettingCard(Icons.Filled.DarkMode, strings.themeLabel, strings.themeCaption) {
            SingleChoiceSegmentedButtonRow {
                SegmentedButton(
                    selected = preferences.theme == Theme.DARK,
                    onClick = { onThemeChange(Theme.DARK) },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                ) { Text(strings.themeDark) }
                SegmentedButton(
                    selected = preferences.theme == Theme.LIGHT,
                    onClick = { onThemeChange(Theme.LIGHT) },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                ) { Text(strings.themeLight) }
            }
        }

        SettingCard(Icons.Filled.GridView, strings.viewLabel, strings.viewCaption) {
            SingleChoiceSegmentedButtonRow {
                SegmentedButton(
                    selected = preferences.view == GridView.WEEKS,
                    onClick = { onViewChange(GridView.WEEKS) },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                ) { Text(strings.viewWeeks) }
                SegmentedButton(
                    selected = preferences.view == GridView.MONTHS,
                    onClick = { onViewChange(GridView.MONTHS) },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                ) { Text(strings.viewMonths) }
            }
        }

        SettingCard(Icons.Filled.Cake, strings.birthDateLabel, strings.birthDateSettingCaption) {
            OutlinedButton(onClick = { showDatePicker = true }) {
                val label = preferences.birthDate?.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM))
                    ?: strings.birthDatePlaceholder
                Text(label)
            }
        }

        SettingCard(Icons.Filled.Timeline, strings.lifeExpectancyLabel(preferences.lifeYears), "") {
            // Estado local durante el arrastre: recién al soltar se persiste y se
            // re-renderiza el wallpaper (un render por gesto, no uno por pixel).
            var sliderYears by remember(preferences.lifeYears) { mutableStateOf(preferences.lifeYears) }
            Slider(
                value = sliderYears.toFloat(),
                onValueChange = { sliderYears = it.roundToInt() },
                onValueChangeFinished = { onLifeYearsChange(sliderYears) },
                valueRange = MIN_LIFE_YEARS.toFloat()..MAX_LIFE_YEARS.toFloat(),
                steps = MAX_LIFE_YEARS - MIN_LIFE_YEARS - 1,
            )
        }

        SettingCard(Icons.Filled.Info, strings.efemerideLabel, strings.efemerideCaption) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Switch(checked = preferences.efemerideEnabled, onCheckedChange = onEfemerideEnabledChange)
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            OutlinedButton(onClick = onOpenPreview, modifier = Modifier.fillMaxWidth().weight(1f)) {
                Icon(Icons.Filled.Visibility, contentDescription = null, modifier = Modifier.size(18.dp))
                Text(" " + strings.previewButton)
            }
            Button(
                onClick = {
                    applying = true
                    applyResult = null
                    scope.launch {
                        applyResult = onApplyNow()
                        applying = false
                    }
                },
                enabled = !applying,
                modifier = Modifier.fillMaxWidth().weight(1f),
            ) {
                if (applying) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp))
                } else {
                    Icon(Icons.Filled.Wallpaper, contentDescription = null, modifier = Modifier.size(18.dp))
                    Text(" " + strings.applyButton)
                }
            }
        }
        applyResult?.let { outcome ->
            val (text, color) = when (outcome) {
                ApplyOutcome.SUCCESS -> strings.applySuccess to MaterialTheme.colorScheme.primary
                ApplyOutcome.FAILURE -> strings.applyError to MaterialTheme.colorScheme.error
                ApplyOutcome.TIMEOUT -> strings.applyTimeout to MaterialTheme.colorScheme.onSurfaceVariant
            }
            Text(text, color = color, style = MaterialTheme.typography.bodySmall)
        }

        TextButton(onClick = onOpenBatteryHelp) {
            Text(strings.batteryHelpButton)
        }
    }

    if (showDatePicker) {
        BirthDatePickerDialog(
            initialDate = preferences.birthDate,
            strings = strings,
            onDismiss = { showDatePicker = false },
            onConfirm = {
                onBirthDateChange(it)
                showDatePicker = false
            },
        )
    }
}

@Composable
private fun SettingCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    caption: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Icon(icon, contentDescription = null)
                Column {
                    Text(label, style = MaterialTheme.typography.titleMedium)
                    if (caption.isNotEmpty()) {
                        Text(caption, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            content()
        }
    }
}
