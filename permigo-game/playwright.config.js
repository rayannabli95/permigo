import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 1,
  // 3 workers max : la suite tape le Supabase de prod avec 2 projets
  // (desktop + mobile) en parallèle — au-delà, les logins dépassent 25 s
  // et produisent des flakes « body.has-chrome timeout » sans rapport
  // avec ce que les tests vérifient.
  workers: 3,
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
