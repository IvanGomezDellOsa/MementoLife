/**
 * La validacion de la fecha de nacimiento, que antes no existia como tal: opciones aceptaba
 * cualquier cosa y descartaba en silencio lo que no podia guardar.
 *
 * Cada caso comprueba el MOTIVO, no solo que falle: la razon de ser del modulo es poder
 * decirle al usuario que corregir.
 */

import { describe, expect, it } from "vitest";
import { checkBirthDate, completedYears, daysInMonth } from "../src/core/birthdate.js";
import { LIFE_YEARS } from "../src/core/tokens.js";

const TODAY = { year: 2026, month: 7, day: 29 };

function check(day: string, month: string, year: string) {
  return checkBirthDate({ day, month, year }, TODAY);
}

describe("dias por mes", () => {
  it("conoce los meses cortos y largos", () => {
    expect(daysInMonth(1, 2023)).toBe(31);
    expect(daysInMonth(4, 2023)).toBe(30);
    expect(daysInMonth(2, 2023)).toBe(28);
  });

  it("febrero tiene 29 en bisiesto", () => {
    expect(daysInMonth(2, 2024)).toBe(29);
    expect(daysInMonth(2, 2000)).toBe(29);
    expect(daysInMonth(2, 1900)).toBe(28);
  });
});

describe("anios cumplidos", () => {
  it("no cuenta el cumpleanos que todavia no llego", () => {
    expect(completedYears({ year: 2000, month: 12, day: 31 }, TODAY)).toBe(25);
    expect(completedYears({ year: 2000, month: 1, day: 1 }, TODAY)).toBe(26);
  });

  it("el dia exacto del cumpleanos ya cuenta", () => {
    expect(completedYears({ year: 2000, month: 7, day: 29 }, TODAY)).toBe(26);
    expect(completedYears({ year: 2000, month: 7, day: 30 }, TODAY)).toBe(25);
  });
});

describe("fechas validas", () => {
  it("acepta una fecha normal y la normaliza a ISO", () => {
    const result = check("5", "3", "1990");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe("1990-03-05");
      expect(result.date).toEqual({ year: 1990, month: 3, day: 5 });
    }
  });

  it("acepta el 29 de febrero de un anio bisiesto", () => {
    expect(check("29", "2", "2024").ok).toBe(true);
  });

  it("acepta el limite exacto de edad, que es el dia del cumpleanos", () => {
    // Cumple exactamente 100 hoy. El calculo con decimales lo rechazaba por 100,0008.
    const result = check("29", "7", String(TODAY.year - LIFE_YEARS.max));
    expect(result.ok).toBe(true);
  });
});

describe("campos sin completar", () => {
  it.each([
    ["sin dia", "", "3", "1990"],
    ["sin mes", "5", "", "1990"],
    ["sin anio", "5", "3", ""],
    ["anio de dos digitos", "5", "3", "90"],
    ["anio de tres digitos", "5", "3", "199"],
  ])("%s da incomplete", (_name, day, month, year) => {
    const result = check(day, month, year);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem).toBe("incomplete");
  });
});

describe("fechas que no existen", () => {
  it.each([
    ["31 de febrero", "31", "2", "1990"],
    ["29 de febrero en anio no bisiesto", "29", "2", "2023"],
    ["31 de abril", "31", "4", "1990"],
    ["mes 13", "5", "13", "1990"],
    ["dia 0", "0", "3", "1990"],
  ])("%s da impossible", (_name, day, month, year) => {
    const result = check(day, month, year);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem).toBe("impossible");
  });
});

describe("fechas futuras", () => {
  it.each([
    ["hoy mismo", "29", "7", "2026"],
    ["manana", "30", "7", "2026"],
    ["el mes que viene", "5", "8", "2026"],
    ["el anio que viene", "5", "3", "2027"],
  ])("%s da future", (_name, day, month, year) => {
    const result = check(day, month, year);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem).toBe("future");
  });

  it("ayer si es valido", () => {
    expect(check("28", "7", "2026").ok).toBe(true);
  });
});

describe("fechas demasiado viejas", () => {
  it("rechaza pasarse por un dia del maximo que la grilla dibuja", () => {
    // Un dia antes de cumplir 100 hace exactamente un anio: ya tiene 100 cumplidos + 1 dia.
    const result = check("28", "7", String(TODAY.year - LIFE_YEARS.max - 1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem).toBe("tooOld");
  });

  it("rechaza una fecha absurdamente vieja", () => {
    const result = check("1", "1", "1000");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem).toBe("tooOld");
  });
});
