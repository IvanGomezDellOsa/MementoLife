package com.mementolife.app.ui.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.mementolife.app.ui.common.BirthDatePickerDialog
import com.mementolife.app.ui.strings.UiStrings
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

/**
 * Única pantalla del primer arranque: solo pide la fecha de nacimiento, lo único
 * que no se puede inferir del dispositivo. Idioma y tema se detectan solos
 * (ver MainActivity.deviceLocale/systemDark); vista arranca en semanas y se
 * cambia después en Configuración — así el onboarding es un solo campo.
 */
@Composable
fun OnboardingScreen(strings: UiStrings, onConfirm: (birthDate: LocalDate) -> Unit) {
    var birthDate by remember { mutableStateOf<LocalDate?>(null) }
    var showDatePicker by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(20.dp),
            ) {
                Text(strings.onboardingTitle, style = MaterialTheme.typography.headlineSmall)
                Text(
                    strings.onboardingSubtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                )
                OutlinedButton(onClick = { showDatePicker = true }, modifier = Modifier.fillMaxWidth()) {
                    val label = birthDate?.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM))
                        ?: strings.birthDatePlaceholder
                    Text(label)
                }
                Button(
                    onClick = { birthDate?.let(onConfirm) },
                    enabled = birthDate != null,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(strings.onboardingConfirm)
                }
            }
        }
    }

    if (showDatePicker) {
        BirthDatePickerDialog(
            initialDate = birthDate,
            strings = strings,
            onDismiss = { showDatePicker = false },
            onConfirm = {
                birthDate = it
                showDatePicker = false
            },
        )
    }
}
