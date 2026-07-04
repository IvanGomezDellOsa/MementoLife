package com.mementolife.app.data

import android.content.Context
import android.graphics.Typeface

/** Carga de tokens y efemérides desde assets/ (copiados en build desde render-core/ y content/). */
object AssetSources {

    fun loadDesignTokens(context: Context): DesignTokens =
        DesignTokens.parse(context.assets.open("render-core/design-tokens.json").bufferedReader().use { it.readText() })

    fun loadEfemerideRepositories(context: Context): Map<AppLocale, EfemerideRepository> = mapOf(
        AppLocale.ES to EfemerideRepository.parse(context.assets.open("efemerides/es.json").bufferedReader().use { it.readText() }),
        AppLocale.EN to EfemerideRepository.parse(context.assets.open("efemerides/en.json").bufferedReader().use { it.readText() }),
    )

    fun loadFrauncesTypeface(context: Context): Typeface =
        Typeface.createFromAsset(context.assets, "fonts/Fraunces.ttf")
}
