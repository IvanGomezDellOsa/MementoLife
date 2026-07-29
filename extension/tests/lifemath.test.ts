import { describe, expect, it } from "vitest";
import {
  currentIndex,
  daysFromCivil,
  percentText,
  unitText,
  isLeapYear,
  lifeStats,
  percentLived,
  totalUnits,
  yearsLived,
} from "../src/core/lifemath.js";

describe("aritmetica de fechas", () => {
  it("daysFromCivil coincide con la cuenta real de dias", () => {
    expect(daysFromCivil({ year: 1970, month: 1, day: 1 })).toBe(0);
    expect(daysFromCivil({ year: 1970, month: 1, day: 2 })).toBe(1);
    expect(daysFromCivil({ year: 1969, month: 12, day: 31 })).toBe(-1);
    // 2000 fue bisiesto (divisible por 400); 1900 no (divisible por 100 y no por 400).
    expect(daysFromCivil({ year: 2000, month: 3, day: 1 }) - daysFromCivil({ year: 2000, month: 2, day: 28 })).toBe(2);
  });

  it("no depende del huso horario del equipo", () => {
    // El bug clasico: new Date("1990-01-01") es medianoche UTC y en America/Argentina
    // devuelve el 31/12/1989. Aca la fecha es una estructura, no un instante.
    const viaStruct = daysFromCivil({ year: 1990, month: 1, day: 1 });
    const viaUtc = Math.round(Date.UTC(1990, 0, 1) / 86_400_000);
    expect(viaStruct).toBe(viaUtc);
  });

  it("isLeapYear sigue la regla gregoriana completa", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
  });
});

describe("celdas vividas", () => {
  it("caso base del handoff: 1990-01-01 a 2023-07-02", () => {
    const lived = yearsLived({ year: 1990, month: 1, day: 1 }, { year: 2023, month: 7, day: 2 });
    expect(lived).toBeCloseTo(33.5, 1);
    expect(currentIndex(lived, 80)).toBe(Math.floor(lived * 52));
  });

  it("clampea cuando los bisiestos empujan yearsLived por encima de lifeYears", () => {
    // Fixture edge_lifeYears_40: cumple exactamente 40, pero los dias bisiestos acumulados
    // hacen que la division por 365,2425 de un pelo mas de 40.
    const lived = yearsLived({ year: 2000, month: 6, day: 10 }, { year: 2040, month: 6, day: 10 });
    expect(lived).toBeGreaterThan(40);
    const index = currentIndex(lived, 40);
    expect(index).toBe(totalUnits(40) - 1);
    expect(index).toBe(2079);
  });

  it("nunca devuelve un indice negativo", () => {
    expect(currentIndex(-5, 80)).toBe(0);
  });

  it("el porcentaje queda acotado a 0..100", () => {
    expect(percentLived(0, 80)).toBe(0);
    expect(percentLived(200, 80)).toBe(100);
    expect(percentLived(40, 80)).toBe(50);
  });
});

describe("textos del bloque de dato", () => {
  const stats = lifeStats({ year: 1990, month: 1, day: 1 }, { year: 2023, month: 7, day: 2 }, 80);

  it("el porcentaje es el titular", () => {
    expect(percentText(stats)).toBe("42 %");
  });

  it("el subtitulo va en el idioma activo", () => {
    expect(unitText("es", stats)).toBe("semana 1742 de 4160");
    expect(unitText("en", stats)).toBe("week 1742 of 4160");
    expect(unitText("fr", stats)).toBe("semaine 1742 sur 4160");
    expect(unitText("pt", stats)).toBe("semana 1742 de 4160");
    expect(unitText("it", stats)).toBe("settimana 1742 di 4160");
    expect(unitText("de", stats)).toBe("Woche 1742 von 4160");
  });
});
