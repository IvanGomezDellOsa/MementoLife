package com.mementolife.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class EfemerideEntry(
    val month: Int,
    val day: Int,
    val year: Int,
    @SerialName("text_es") val textEs: String? = null,
    @SerialName("text_en") val textEn: String? = null,
    val category: String,
)

enum class AppLocale { ES, EN }

class EfemerideRepository(private val entries: List<EfemerideEntry>) {

    fun textFor(month: Int, day: Int, locale: AppLocale): String? {
        val entry = entries.firstOrNull { it.month == month && it.day == day } ?: return null
        return when (locale) {
            AppLocale.ES -> entry.textEs
            AppLocale.EN -> entry.textEn
        }
    }

    companion object {
        private val json = Json { ignoreUnknownKeys = true }

        fun parse(source: String): EfemerideRepository =
            EfemerideRepository(json.decodeFromString(source))
    }
}
