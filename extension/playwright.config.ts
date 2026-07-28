import { defineConfig } from "@playwright/test";

/**
 * Los e2e corren sobre build/, o sea sobre el paquete real que se instala, no sobre src/.
 *
 * Dos suites, a proposito:
 *
 *   pages.spec.ts      — sirve build/ sobre un origen falso con chrome.* simulado. Corre en
 *                        cualquier entorno y cubre render, i18n, onboarding, foco y tema.
 *   extension.spec.ts  — carga la extension DE VERDAD. Exige Chromium con cabeza, asi que
 *                        se salta sola donde no hay display. Es la que valida el manifest,
 *                        el override de la pestana nueva y la ausencia de red real.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: process.env["CI"] === "true" ? "line" : "list",
  timeout: 30_000,
  use: {
    viewport: { width: 1440, height: 720 },
  },
});
