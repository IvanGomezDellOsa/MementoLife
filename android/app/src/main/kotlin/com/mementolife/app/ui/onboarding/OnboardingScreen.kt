package com.mementolife.app.ui.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.mementolife.app.R
import com.mementolife.app.data.AppLocale
import com.mementolife.app.render.GridView
import com.mementolife.app.render.Theme
import com.mementolife.app.ui.common.BirthDatePickerDialog
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnboardingScreen(
    initialLocale: AppLocale,
    initialTheme: Theme,
    initialView: GridView,
    onConfirm: (locale: AppLocale, birthDate: LocalDate, theme: Theme, view: GridView) -> Unit,
) {
    var locale by remember { mutableStateOf(initialLocale) }
    var theme by remember { mutableStateOf(initialTheme) }
    var view by remember { mutableStateOf(initialView) }
    var birthDate by remember { mutableStateOf<LocalDate?>(null) }
    var showDatePicker by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Text(stringResource(R.string.onboarding_title))
        Text(stringResource(R.string.onboarding_subtitle))

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(stringResource(R.string.onboarding_language_label))
            SingleChoiceSegmentedButtonRow {
                SegmentedButton(
                    selected = locale == AppLocale.ES,
                    onClick = { locale = AppLocale.ES },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                ) { Text(stringResource(R.string.language_es)) }
                SegmentedButton(
                    selected = locale == AppLocale.EN,
                    onClick = { locale = AppLocale.EN },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                ) { Text(stringResource(R.string.language_en)) }
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(stringResource(R.string.onboarding_birth_date_label))
            OutlinedButton(onClick = { showDatePicker = true }) {
                val label = birthDate?.format(
                    DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)
                        .withLocale(Locale(locale.name.lowercase())),
                ) ?: stringResource(R.string.onboarding_birth_date_button)
                Text(label)
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(stringResource(R.string.onboarding_theme_label))
            SingleChoiceSegmentedButtonRow {
                SegmentedButton(
                    selected = theme == Theme.DARK,
                    onClick = { theme = Theme.DARK },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                ) { Text(stringResource(R.string.theme_dark)) }
                SegmentedButton(
                    selected = theme == Theme.LIGHT,
                    onClick = { theme = Theme.LIGHT },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                ) { Text(stringResource(R.string.theme_light)) }
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(stringResource(R.string.onboarding_view_label))
            SingleChoiceSegmentedButtonRow {
                SegmentedButton(
                    selected = view == GridView.WEEKS,
                    onClick = { view = GridView.WEEKS },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                ) { Text(stringResource(R.string.view_weeks)) }
                SegmentedButton(
                    selected = view == GridView.MONTHS,
                    onClick = { view = GridView.MONTHS },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                ) { Text(stringResource(R.string.view_months)) }
            }
        }

        Button(
            onClick = { birthDate?.let { onConfirm(locale, it, theme, view) } },
            enabled = birthDate != null,
        ) {
            Text(stringResource(R.string.onboarding_confirm_button), textAlign = TextAlign.Center)
        }
    }

    if (showDatePicker) {
        BirthDatePickerDialog(
            initialDate = birthDate,
            onDismiss = { showDatePicker = false },
            onConfirm = {
                birthDate = it
                showDatePicker = false
            },
        )
    }
}
