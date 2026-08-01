import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 1,
  // UN SEUL worker. La suite tape le Supabase de PROD avec deux projets
  // (desktop + mobile) qui se connectent aux MÊMES deux comptes de test :
  // en parallèle ils se marchent dessus et la suite invente des échecs.
  // Constaté le 31/07/2026 sur un commit unique et inchangé : 5 échecs à
  // 3 workers, 0 à 1 worker. On a passé la journée à croire à des défauts
  // qui n'existaient pas.
  // Le coût est faible (~3 min 40 contre ~3 min) et une suite qui dit vrai
  // vaut infiniment mieux qu'une suite rapide. À remonter le jour où chaque
  // projet aura SON compte.
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
