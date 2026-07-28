import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // El core es puro: no necesita jsdom ni ningun entorno de navegador.
    environment: "node",
  },
});
