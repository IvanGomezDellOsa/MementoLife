package com.mementolife.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Misma paleta que render-core/design-tokens.json (fondo/tinta), para que la
// app de configuración se sienta continua con el wallpaper que produce.
private val DarkColors = darkColorScheme(
    background = Color(0xFF161310),
    surface = Color(0xFF161310),
    onBackground = Color(0xFFEAE3D4),
    onSurface = Color(0xFFEAE3D4),
    primary = Color(0xFFEAE3D4),
    onPrimary = Color(0xFF161310),
)

private val LightColors = lightColorScheme(
    background = Color(0xFFF4F0E8),
    surface = Color(0xFFF4F0E8),
    onBackground = Color(0xFF2B2721),
    onSurface = Color(0xFF2B2721),
    primary = Color(0xFF2B2721),
    onPrimary = Color(0xFFF4F0E8),
)

@Composable
fun MementoLifeTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
