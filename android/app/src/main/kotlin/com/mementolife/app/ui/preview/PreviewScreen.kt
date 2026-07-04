package com.mementolife.app.ui.preview

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.unit.dp
import com.mementolife.app.ui.strings.UiStrings

/** Renderiza el mismo bitmap que se aplica al lock screen, pero solo lo muestra en pantalla. */
@Composable
fun PreviewScreen(strings: UiStrings, renderPreview: suspend () -> Bitmap?, onBack: () -> Unit) {
    var bitmap by remember { mutableStateOf<Bitmap?>(null) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        bitmap = renderPreview()
        loaded = true
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(strings.previewTitle, style = MaterialTheme.typography.titleLarge)
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            val current = bitmap
            when {
                current != null -> Image(bitmap = current.asImageBitmap(), contentDescription = null)
                loaded -> Text(strings.applyError)
                else -> CircularProgressIndicator()
            }
        }
        TextButton(onClick = onBack) { Text(strings.back) }
    }
}
