package com.mementolife.app.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.mementolife.app.R
import com.mementolife.app.data.AppLocale
import com.mementolife.app.data.MAX_LIFE_YEARS
import com.mementolife.app.data.MIN_LIFE_YEARS
import com.mementolife.app.data.UserPreferences
import com.mementolife.app.render.GridView
import com.mementolife.app.render.Theme
import com.mementolife.app.ui.common.BirthDatePickerDialog
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    preferences: UserPreferences,
    onLocaleChange: (AppLocale) -> Unit,
    onThemeChange: (Theme) -> Unit,
    onViewChange: (GridView) -> Unit,
    onBirthDateChange: (java.time.LocalDate) -> Unit,
    onLifeYearsChange: (Int) -> Unit,
    onEfemerideEnabledChange: (Boolean) -> Unit,
    onOpenBatteryHelp: () -> Unit,
) {
    var showDatePicker by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Text(stringResource(R.string.settings_title))

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(stringResource(R.string.onboarding_language_label))
            SingleChoiceSegmentedButtonRow {
                SegmentedButton(
                    selected = preferences.locale == AppLocale.ES,
                    onClick = { onLocaleChange(AppLocale.ES) },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                ) { Text(stringResource(R.string.language_es)) }
                SegmentedButton(
                    selected = preferences.locale == AppLocale.EN,
                    onClick = { onLocaleChange(AppLocale.EN) },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                ) { Text(stringResource(R.string.language_en)) }
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(stringResource(R.string.onboarding_birth_date_label))
            OutlinedButton(onClick = { showDatePicker = true }) {
                val label = preferences.birthDate?.format(
                    DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)
                        .withLocale(Locale(preferences.locale.name.lowercase())),
                ) ?: stringResource(R.string.onboarding_birth_date_button)
                Text(label)
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(stringResource(R.string.onboarding_theme_label))
            SingleChoiceSegmentedButtonRow {
                SegmentedButton(
                    selected = preferences.theme == Theme.DARK,
                    onClick = { onThemeChange(Theme.DARK) },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                ) { Text(stringResource(R.string.theme_dark)) }
                SegmentedButton(
                    selected = preferences.theme == Theme.LIGHT,
                    onClick = { onThemeChange(Theme.LIGHT) },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                ) { Text(stringResource(R.string.theme_light)) }
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(stringResource(R.string.onboarding_view_label))
            SingleChoiceSegmentedButtonRow {
                SegmentedButton(
                    selected = preferences.view == GridView.WEEKS,
                    onClick = { onViewChange(GridView.WEEKS) },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                ) { Text(stringResource(R.string.view_weeks)) }
                SegmentedButton(
                    selected = preferences.view == GridView.MONTHS,
                    onClick = { onViewChange(GridView.MONTHS) },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                ) { Text(stringResource(R.string.view_months)) }
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            // Estado local durante el arrastre: recién al soltar se persiste y se
            // re-renderiza el wallpaper (un render por gesto, no uno por pixel).
            var sliderYears by remember(preferences.lifeYears) { mutableStateOf(preferences.lifeYears) }
            Text(stringResource(R.string.settings_life_expectancy_label, sliderYears))
            Slider(
                value = sliderYears.toFloat(),
                onValueChange = { sliderYears = it.roundToInt() },
                onValueChangeFinished = { onLifeYearsChange(sliderYears) },
                valueRange = MIN_LIFE_YEARS.toFloat()..MAX_LIFE_YEARS.toFloat(),
                steps = MAX_LIFE_YEARS - MIN_LIFE_YEARS - 1,
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(stringResource(R.string.settings_efemeride_label))
            Switch(checked = preferences.efemerideEnabled, onCheckedChange = onEfemerideEnabledChange)
        }

        TextButton(onClick = onOpenBatteryHelp) {
            Text(stringResource(R.string.settings_battery_help_button))
        }
    }

    if (showDatePicker) {
        BirthDatePickerDialog(
            initialDate = preferences.birthDate,
            onDismiss = { showDatePicker = false },
            onConfirm = {
                onBirthDateChange(it)
                showDatePicker = false
            },
        )
    }
}
