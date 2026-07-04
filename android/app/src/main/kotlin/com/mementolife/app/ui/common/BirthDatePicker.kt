package com.mementolife.app.ui.common

import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DisplayMode
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SelectableDates
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import com.mementolife.app.ui.strings.UiStrings
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

/**
 * Selector de fecha de nacimiento. Arranca en modo texto (`DisplayMode.Input`), no
 * calendario: tocar mes a mes hasta llegar a un año de nacimiento de hace décadas
 * era el problema de UX reportado — escribir la fecha es directo. El propio
 * DatePicker deja pasar a modo calendario con el ícono de la esquina si se prefiere.
 * No permite fechas futuras (plan §6.1).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BirthDatePickerDialog(
    initialDate: LocalDate?,
    strings: UiStrings,
    onDismiss: () -> Unit,
    onConfirm: (LocalDate) -> Unit,
) {
    val todayMillis = LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
    val state = rememberDatePickerState(
        initialSelectedDateMillis = initialDate?.atStartOfDay(ZoneOffset.UTC)?.toInstant()?.toEpochMilli(),
        initialDisplayMode = DisplayMode.Input,
        selectableDates = object : SelectableDates {
            override fun isSelectableDate(utcTimeMillis: Long): Boolean = utcTimeMillis <= todayMillis
            override fun isSelectableYear(year: Int): Boolean = year <= LocalDate.now().year
        },
    )
    DatePickerDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = {
                state.selectedDateMillis?.let { millis ->
                    onConfirm(Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate())
                }
            }) { Text(strings.datePickerConfirm) }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(strings.datePickerCancel) }
        },
    ) {
        DatePicker(state = state)
    }
}
