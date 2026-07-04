/**
 * E2E — Enseignant : page Stats (ex-Insights)
 *
 * La page a été refondue (design premium indigo raccord dashboard) :
 *   - hero validations (.ins-hero-big) + bento 3 tuiles (.ins-bt-val)
 *   - graphe activité 7 jours (.ins-bars, remplace l'ancienne heatmap 168 cellules)
 *   - onglets « Avancent » / « En pause » (.ins-tab[data-tab=pause],
 *     remplace l'ancien onglet « stagnent »)
 *   - lignes élèves .ins-prog-row[data-eleve-id] → navigation #/livret/:id
 *
 * NB : l'ancien « mode rapide » de la page validation (#btn-mode-rapide,
 * .mr-overlay) a été SUPPRIMÉ du produit — ses tests ont été retirés.
 *
 * Compte test : enseignant@test.fr / Autopilot2025!
 */
import { test, expect } from "@playwright/test";
import { ENSEIGNANT } from "./_creds.js";

const EMAIL = ENSEIGNANT.email;
const PWD = ENSEIGNANT.pwd;

async function loginAsEnseignant(page) {
  // Réduire les animations (les tuiles bento ont des animations d'entrée) et
  // marquer cookies + tuto guidés comme vus : sinon l'overlay du tour (gt-root)
  // peut intercepter les clics (flake récurrent côté enseignant).
  await page.emulateMedia({ reducedMotion: "reduce" });
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
  await page.waitForSelector(".aj-page, .me-page, .vs", { timeout: 20_000 });
  // afterLogin() pose body.has-chrome en dernier : attendre ce signal avant
  // toute navigation hash (sinon le boot écrase le hash posé trop tôt).
  await page.waitForSelector("body.has-chrome", { timeout: 20_000 });
}

async function goToInsights(page) {
  // Le boot post-login peut écraser un hash posé trop tôt → on re-pose le
  // hash et on re-vérifie jusqu'à ce que la page stats soit montée.
  await expect(async () => {
    await page.evaluate(() => {
      location.hash = "#/insights";
    });
    await page.waitForSelector(".ins-page", { timeout: 4_000 });
  }).toPass({ timeout: 25_000 });
  // Laisser le squelette laisser place au contenu (hero rendu)
  await page.waitForSelector(".ins-hero", { timeout: 15_000 });
}

test.describe("Stats enseignant", () => {
  test("page stats se charge sans erreur", async ({ page }) => {
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

  test("hero + bento : 4 valeurs numériques (pas NaN ni vide)", async ({
    page,
  }) => {
    await loginAsEnseignant(page);
    await goToInsights(page);

    // Hero : compteur de validations de la période
    const heroVal = (await page.locator(".ins-hero-big").textContent()).trim();
    expect(heroVal).toMatch(/^\d+$/);

    // Bento : 3 tuiles (actifs / en approche / à relancer)
    const vals = await page.locator(".ins-bt-val").allTextContents();
    expect(vals.length).toBe(3);
    vals.forEach((v) => {
      const txt = v.trim();
      expect(txt).not.toBe("NaN");
      expect(txt).toMatch(/^\d+$/);
    });
  });

  test("activité 7 jours : graphe à 7 colonnes (ou état vide légitime)", async ({
    page,
  }) => {
    await loginAsEnseignant(page);
    await goToInsights(page);

    // La heatmap 7×24 a été remplacée par un graphe en barres sur 7 jours.
    // Si aucune validation sur la période → état vide .ins-empty (légitime).
    const hasBars = await page
      .locator(".ins-bars")
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (!hasBars) {
      await expect(page.locator(".ins-empty").first()).toBeVisible();
      return;
    }
    await expect(page.locator(".ins-bar-col")).toHaveCount(7);
  });

  test("clic sur un élève en pause → navigation vers son livret", async ({
    page,
  }) => {
    await loginAsEnseignant(page);
    await goToInsights(page);

    // Basculer sur l'onglet « En pause » (ex-« stagnent »)
    const tabPause = page.locator('.ins-tab[data-tab="pause"]');
    await expect(tabPause).toBeVisible({ timeout: 5_000 });
    await tabPause.click();
    await page.waitForTimeout(400);

    const eleveRow = page
      .locator("#ins-eleves-list .ins-prog-row[data-eleve-id]")
      .first();
    if (!(await eleveRow.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, "Aucun élève en pause dans les données de test");
      return;
    }

    const eleveId = await eleveRow.getAttribute("data-eleve-id");
    // Clic en DOM direct : les lignes ont une animation d'entrée en cascade
    await eleveRow.evaluate((el) => el.click());

    // Doit naviguer vers le livret REMC de l'élève
    await page.waitForFunction((id) => location.hash.includes(id), eleveId, {
      timeout: 5_000,
    });
    expect(page.url()).toContain("livret");
  });
});
