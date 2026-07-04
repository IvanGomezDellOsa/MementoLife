package com.mementolife.app.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/**
 * Paleta propia de la app (chrome de configuración), deliberadamente distinta de
 * `render-core/design-tokens.json`: esos tokens son la fuente de verdad del
 * WALLPAPER, pixel-perfect y cerrada; la app que lo configura puede — y debe —
 * tener su propia identidad. Siempre oscura: la elección de tema en Settings es
 * para el fondo de bloqueo que se genera, no para esta UI.
 */
private val DarkColors = darkColorScheme(
    background = Color(0xFF14120F),
    surface = Color(0xFF1C1916),
    surfaceVariant = Color(0xFF262220),
    onBackground = Color(0xFFECE4D8),
    onSurface = Color(0xFFECE4D8),
    onSurfaceVariant = Color(0xFFC9BEB1),
    primary = Color(0xFF8FADA3),
    onPrimary = Color(0xFF0D2320),
    primaryContainer = Color(0xFF253B36),
    onPrimaryContainer = Color(0xFFCFE4DE),
    secondary = Color(0xFFA8998A),
    onSecondary = Color(0xFF1F1912),
    outline = Color(0xFF4A443C),
    error = Color(0xFFE5484D),
    onError = Color(0xFF2A0A0C),
)

private val AppShapes = Shapes(
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(24.dp),
)

@Composable
fun MementoLifeTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = DarkColors, shapes = AppShapes, content = content)
}
