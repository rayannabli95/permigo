import { defineConfig, devices } from "@playwright/test";

// Port réglable par `PERMIGO_E2E_PORT`, 5173 par défaut.
//
// Pourquoi : `reuseExistingServer` est à `true`. Si un serveur de dev traîne
// déjà sur 5173, Playwright le RÉUTILISE, quel que soit le dossier d'où il a
// été lancé. On croit alors tester sa branche et on teste le code d'un autre
// dossier. Ça produit des rouges ET des verts également mensongers.
// Depuis un worktree : `PERMIGO_E2E_PORT=5180 npm run test`.
const PORT = process.env.PERMIGO_E2E_PORT || "5173";
const BASE = `http://localhost:${PORT}`;

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
    baseURL: BASE,
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
    command: `vite --port ${PORT} --strictPort`,
    url: BASE,
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
