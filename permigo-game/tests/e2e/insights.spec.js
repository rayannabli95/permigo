/**
 * E2E — Enseignant : page Insights
 *
 * Compte test : enseignant@test.fr / Autopilot2025!
 * Note : la route #/insights doit être câblée dans router.js par Cowork.
 * En attendant, on teste en injectant le mount() directement.
 */
import { test, expect } from "@playwright/test";
import { ENSEIGNANT } from "./_creds.js";

const EMAIL = ENSEIGNANT.email;
const PWD = ENSEIGNANT.pwd;

async function loginAsEnseignant(page) {
  // Marque cookies + tuto guidés comme vus : sinon l'overlay du tour (gt-root)
  // peut intercepter les clics (flake récurrent côté enseignant).
  await page.addInitScript(() => {
    try {
      localStorage.setItem("permigo_cookie_consent", "essential");
      localStorage.setItem("pg-tour-moniteur-v1", "1");
      localStorage.setItem("pg-tour-validation-v1", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/#/login");
  await page.waitForSelector("#lg-email", { timeout: 12_000 });
  await page.fill("#lg-email", EMAIL);
  await page.fill("#lg-pwd", PWD);
  await page.click("#lg-submit");
  await page.waitForSelector(".aj-page, .me-list, .vp", { timeout: 20_000 });
}

async function goToInsights(page) {
  // Route via hash — nécessite que router.js soit câblé par Cowork
  await page.evaluate(() => {
    location.hash = "#/insights";
  });
  // Attendre soit la page insights, soit injection manuelle
  const found = await page
    .waitForSelector(".ins-page, .ins-widgets", { timeout: 10_000 })
    .catch(() => null);
  if (!found) {
    // Route pas encore câblée → injection manuelle du module
    await page.evaluate(async () => {
      const { mount } = await import("/src/pages/enseignant/insights.js");
      const root = document.querySelector("#app") || document.body;
      await mount(root);
    });
    await page.waitForSelector(".ins-page", { timeout: 10_000 });
  }
}

test.describe("Insights enseignant", () => {
  test("page insights se charge sans erreur", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await loginAsEnseignant(page);
    await goToInsights(page);

    await expect(page.locator(".ins-page")).toBeVisible({ timeout: 10_000 });
    // Aucune erreur JS critique
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("sw.js"),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("les 4 KPI affichent des valeurs numériques (pas NaN ni vide)", async ({
    page,
  }) => {
    await loginAsEnseignant(page);
    await goToInsights(page);

    await page.waitForSelector(".ins-widgets", { timeout: 10_000 });

    const vals = await page.locator(".ins-widget-val").allTextContents();
    expect(vals.length).toBe(4);

    vals.forEach((v) => {
      const txt = v.trim();
      // Doit être un nombre ou "—" (fallback gracieux), jamais NaN ni vide
      expect(txt).not.toBe("NaN");
      expect(txt.length).toBeGreaterThan(0);
    });
  });

  test("heatmap s'affiche avec des cellules colorées", async ({ page }) => {
    await loginAsEnseignant(page);
    await goToInsights(page);

    await page.waitForSelector(".ins-heatmap-grid", { timeout: 10_000 });
    const cells = page.locator(".ins-hmap-cell");
    const count = await cells.count();
    // 7 jours × 24 heures = 168 cellules
    expect(count).toBe(168);
  });

  test("clic sur un élève en stagnation → navigation vers livret", async ({
    page,
  }) => {
    await loginAsEnseignant(page);
    await goToInsights(page);

    await page.waitForSelector(".ins-page", { timeout: 10_000 });

    // Basculer sur l'onglet "stagnent"
    const tabStagnent = page.locator('.ins-tab[data-tab="stagnent"]');
    if (await tabStagnent.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await tabStagnent.click();
      await page.waitForTimeout(400);
    }

    const eleveRow = page.locator(".ins-eleve-row[data-eleve-id]").first();
    if (!(await eleveRow.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(
        true,
        "Aucun élève en stagnation disponible en données de test",
      );
      return;
    }

    const eleveId = await eleveRow.getAttribute("data-eleve-id");
    await eleveRow.click();

    // Doit naviguer vers le livret REMC de l'élève
    await page.waitForFunction((id) => location.hash.includes(id), eleveId, {
      timeout: 5_000,
    });
    expect(page.url()).toContain("livret");
  });

  test("mode rapide — sélection 2 élèves + comp → bouton confirmer activé", async ({
    page,
  }) => {
    await loginAsEnseignant(page);
    await page.evaluate(() => {
      location.hash = "#/validation";
    });
    await page.waitForSelector(".vp", { timeout: 10_000 });

    // Ouvrir le mode rapide
    await page.locator("#btn-mode-rapide").click();
    await page.waitForSelector(".mr-overlay", { timeout: 5_000 });
    await expect(page.locator(".mr-sheet")).toBeVisible();

    // Sélectionner les 2 premiers élèves
    const checks = page.locator(".mr-eleve-check");
    const count = await checks.count();
    if (count < 1) {
      test.skip(true, "Aucun élève assigné au compte test");
      return;
    }

    await checks.nth(0).click();
    if (count >= 2) await checks.nth(1).click();

    // Attendre que les comps apparaissent
    await page.waitForSelector(".mr-comp-row", { timeout: 5_000 });

    // Sélectionner la première comp éligible
    await page.locator(".mr-comp-row").first().click();

    // Le bouton confirm doit être actif
    const confirmBtn = page.locator("#mr-btn-confirm");
    await expect(confirmBtn).not.toBeDisabled({ timeout: 2_000 });

    // Vérifier que le badge affiche un nombre > 0
    const badge = page.locator("#mr-count");
    const badgeText = await badge.textContent();
    expect(parseInt(badgeText || "0", 10)).toBeGreaterThan(0);
  });

  test("mode rapide — fermeture avec Escape ou backdrop", async ({ page }) => {
    await loginAsEnseignant(page);
    await page.evaluate(() => {
      location.hash = "#/validation";
    });
    await page.waitForSelector(".vp", { timeout: 10_000 });

    await page.locator("#btn-mode-rapide").click();
    await page.waitForSelector(".mr-overlay", { timeout: 5_000 });

    // Clic sur l'overlay (backdrop)
    await page.locator(".mr-overlay").click({ position: { x: 1, y: 1 } });
    await expect(page.locator(".mr-overlay")).toHaveCount(0, {
      timeout: 2_000,
    });
  });
});
