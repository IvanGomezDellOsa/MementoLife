package com.mementolife.app.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class EfemerideRepositoryTest {

    private fun loadEs() = EfemerideRepository.parse(
        checkNotNull(javaClass.classLoader.getResourceAsStream("es.json")).bufferedReader().readText(),
    )

    private fun loadEn() = EfemerideRepository.parse(
        checkNotNull(javaClass.classLoader.getResourceAsStream("en.json")).bufferedReader().readText(),
    )

    @Test
    fun `el dataset incluye la efemeride del 29 de febrero`() {
        val repo = loadEs()
        assertNotNull(repo.textFor(2, 29, AppLocale.ES))
    }

    @Test
    fun `texto en espanol e ingles para el mismo dia difiere de idioma`() {
        val es = loadEs().textFor(1, 1, AppLocale.ES)
        val en = loadEn().textFor(1, 1, AppLocale.EN)
        assertNotNull(es)
        assertNotNull(en)
        assertTrue(es!!.startsWith("1 de enero"))
        assertTrue(en!!.startsWith("January 1"))
    }

    @Test
    fun `fecha inexistente devuelve null`() {
        val repo = loadEs()
        assertNull(repo.textFor(13, 1, AppLocale.ES))
    }
}
