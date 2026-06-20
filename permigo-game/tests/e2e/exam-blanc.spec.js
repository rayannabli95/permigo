/**
 * E2E — Examen blanc (exam-blanc) — flux parcours.
 *
 * FILET DE SÉCURITÉ posé AVANT la fusion des 4 boucles quiz d'exam-blanc.
 * Vérifie le cycle complet d'un parcours de révision :
 *   sélection → question → réponse → feedback → question suivante → résultats.
 * À relancer APRÈS le refactor pour garantir l'iso-comportement.
 *
 * Les parcours par thème ne sont PAS verrouillés (seul l'examen officiel l'est),
 * donc le compte test élève peut les jouer sans déblocage.
 *
 * Compte test : eleve@test.fr
 */
import { test, expect } from "@playwright/test";
import { ELEVE } from "./_creds.js";

async function loginAsEleve(page) {
  // Pré-accepte le consentement cookies : sinon la bannière (fixée en bas)
  // recouvre le bouton « Question suivante » et bloque les clics.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("permigo_cookie_consent", "all");
    } catch {
      /* noop */
    }
  });
  await page.goto("/#/login");
  await page.waitForSelector("#lg-email", { timeout: 12_000 });
  await page.fill("#lg-email", ELEVE.email);
  await page.fill("#lg-pwd", ELEVE.pwd);
  await page.click("#lg-submit");
  await page.waitForSelector(".acc2-hero-hi", { timeout: 20_000 });
}

test.describe("Examen blanc — parcours", () => {
  test("écran de sélection : titre + cartes parcours", async ({ page }) => {
    await loginAsEleve(page);
    await page.evaluate(() => {
      location.hash = "#/exam-blanc";
    });
    await expect(page.locator(".exb-sel-title")).toBeVisible({
      timeout: 15_000,
    });
    expect(await page.locator(".exb-pcard").count()).toBeGreaterThan(0);
  });

  test("flux parcours : question → réponse → feedback → suivant → résultats", async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await loginAsEleve(page);
    await page.evaluate(() => {
      location.hash = "#/exam-blanc";
    });
    await page.waitForSelector(".exb-pcard", { timeout: 15_000 });

    // Lance le premier parcours
    await page.locator(".exb-pcard").first().click();

    // Première question rendue par le moteur
    await expect(page.locator(".exb-choice").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator(".exb-qnum")).toContainText("Question 1");

    // Répond jusqu'à l'écran de résultats (15 questions + garde-fou)
    let reachedResults = false;
    for (let i = 0; i < 16; i++) {
      if (
        await page
          .locator(".exb-results")
          .isVisible()
          .catch(() => false)
      ) {
        reachedResults = true;
        break;
      }
      // Sélectionne la 1re réponse → feedback → suivant
      await page.locator(".exb-choice").first().click();
      await expect(page.locator(".exb-feedback")).toBeVisible({
        timeout: 5_000,
      });
      const next = page.locator(".exb-next-btn");
      await expect(next).toBeVisible({ timeout: 5_000 });
      await next.click();
      await page.waitForTimeout(400); // transition de question
    }

    expect(reachedResults).toBe(true);
    await expect(page.locator(".exb-results")).toBeVisible();
    expect(errors).toEqual([]);
  });
});
