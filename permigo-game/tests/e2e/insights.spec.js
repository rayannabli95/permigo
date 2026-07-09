/**
 * E2E — Enseignant : page Stats (ex-Insights)
 *
 * La page a été refondue en 6 blocs-questions (plus de héro validations,
 * plus de bento, plus d'onglets Avancent/En pause) :
 *   1. À faire maintenant (.st-act)         4. Révisions élèves (.st-chart, 7 .st-col)
 *   2. Prêts pour l'examen (.st-gauge)      5. Ta réussite à l'examen (.st-proof ou amorçage)
 *   3. Silencieux 14 j (.st-sil-n)          6. Portefeuille (.st-pf-n ×4)
 * Lignes élèves .st-row[data-eleve-id] → navigation #/livret/:id.
 * Pied de page hygiène de saisie (.st-foot).
 *
 * Compte test : enseignant@test.fr / Autopilot2025!
 */
import { test, expect } from "@playwright/test";
import { ENSEIGNANT } from "./_creds.js";

const EMAIL = ENSEIGNANT.email;
const PWD = ENSEIGNANT.pwd;

async function loginAsEnseignant(page) {
  // Réduire les animations et marquer cookies + tuto guidés comme vus :
  // sinon l'overlay du tour (gt-root) peut intercepter les clics.
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
    await page.waitForSelector(".st-page", { timeout: 4_000 });
  }).toPass({ timeout: 25_000 });
  // Laisser le squelette laisser place au contenu (1er bloc rendu)
  await page.waitForSelector(".st-act, .st-card", { timeout: 15_000 });
}

test.describe("Stats enseignant", () => {
  test("page stats se charge sans erreur", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await loginAsEnseignant(page);
    await goToInsights(page);

    await expect(page.locator(".st-page")).toBeVisible({ timeout: 10_000 });
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("sw.js"),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("les 6 blocs-questions sont présents dans l'ordre", async ({ page }) => {
    await loginAsEnseignant(page);
    await goToInsights(page);

    const labels = await page.locator(".st-sec-lbl").allTextContents();
    expect(labels.length).toBe(6);
    expect(labels[0]).toMatch(/faire maintenant/i);
    expect(labels[1]).toMatch(/proches de l'examen/i);
    expect(labels[2]).toMatch(/silencieux/i);
    expect(labels[3]).toMatch(/révisions/i);
    expect(labels[4]).toMatch(/réussite/i);
    expect(labels[5]).toMatch(/portefeuille/i);

    // Pied de page hygiène de saisie toujours présent
    await expect(page.locator(".st-foot")).toBeVisible();
  });

  test("révisions : 7 colonnes, chacune avec son chiffre (ou état vide légitime)", async ({
    page,
  }) => {
    await loginAsEnseignant(page);
    await goToInsights(page);

    const hasChart = await page
      .locator(".st-chart")
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (!hasChart) {
      // 0 réviseur cette semaine → état vide légitime
      await expect(page.locator(".st-empty").first()).toBeVisible();
      return;
    }
    await expect(page.locator(".st-col")).toHaveCount(7);
    // Règle de la refonte : jamais une barre sans son chiffre
    const nums = await page.locator(".st-col-n").allTextContents();
    expect(nums.length).toBe(7);
    nums.forEach((n) => expect(n.trim()).toMatch(/^\d+$/));
    // Le dernier jour est marqué « auj. »
    await expect(page.locator(".st-col-day.auj")).toHaveText("auj.");
  });

  test("portefeuille : 4 tranches dont la somme = total affiché", async ({
    page,
  }) => {
    await loginAsEnseignant(page);
    await goToInsights(page);

    const counts = await page.locator(".st-pf-n").allTextContents();
    expect(counts.length).toBe(4);
    const somme = counts
      .map((c) => parseInt(c.trim(), 10))
      .reduce((a, b) => a + (Number.isNaN(b) ? 0 : b), 0);

    const totalTxt = await page.locator(".st-pf-intro b").textContent();
    const total = parseInt(totalTxt.trim(), 10);
    expect(somme).toBe(total);
  });

  test("clic sur une ligne élève → navigation vers son livret", async ({
    page,
  }) => {
    await loginAsEnseignant(page);
    await goToInsights(page);

    const eleveRow = page.locator(".st-row[data-eleve-id]").first();
    if (!(await eleveRow.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, "Aucune ligne élève dans les données de test");
      return;
    }

    const eleveId = await eleveRow.getAttribute("data-eleve-id");
    // Clic en DOM direct (pattern projet : évite les flakes d'animation)
    await eleveRow.evaluate((el) => el.click());

    await page.waitForFunction((id) => location.hash.includes(id), eleveId, {
      timeout: 5_000,
    });
    expect(page.url()).toContain("livret");
  });
});
