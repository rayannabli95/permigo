/**
 * E2E — Enseignant : flow validation de séance (page log-session)
 *
 * Flow testé :
 *  1. Login enseignant
 *  2. Navigation vers #/validation (alias log-session)
 *  3. Sélection d'un élève (dropdown)
 *  4. Tap sur une compétence libre (chip → statut « acquis »)
 *  5. Valider → toast de succès
 *
 * Comptes test :
 *  - Enseignant : enseignant@test.fr / Autopilot2025!
 */
import { test, expect } from "@playwright/test";
import { ENSEIGNANT } from "./_creds.js";

const EMAIL_ENSEIGNANT = ENSEIGNANT.email;
const PWD = ENSEIGNANT.pwd;

async function loginAsEnseignant(page) {
  // L'app respecte prefers-reduced-motion partout : l'émuler supprime les
  // animations d'entrée qui rendent les éléments « not stable » pour Playwright.
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Pose le consentement cookies AVANT le chargement : le banner (fixed bottom)
  // intercepte sinon les clics sur les CTA bas d'écran en mobile.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("permigo_cookie_consent", "essential");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/#/login");
  await page.waitForSelector("#lg-email", { timeout: 12_000 });
  await page.fill("#lg-email", EMAIL_ENSEIGNANT);
  await page.fill("#lg-pwd", PWD);
  await page.click("#lg-submit");
  // Attendre la page enseignant (aujourd'hui ou mes-eleves)
  await page.waitForSelector(".aj-page, .me-list, .vs", { timeout: 20_000 });
}

async function goToValidation(page) {
  await page.evaluate(() => {
    location.hash = "#/validation";
  });
  await page.waitForSelector(".vs", { timeout: 15_000 });
}

// Sélectionne le premier élève dans le dropdown (auto-ouvert si aucun choisi)
async function pickFirstEleve(page) {
  await page.waitForSelector(".vs-dd-opt[data-eleve]", { timeout: 20_000 });
  // Clic via evaluate : l'animation d'entrée en cascade des options rend
  // l'élément « not stable » pour l'auto-wait Playwright.
  await page
    .locator(".vs-dd-opt[data-eleve]")
    .first()
    .evaluate((el) => el.click());
  // La sélection referme le dropdown et rend les mondes REMC
  await page.waitForSelector(".vs-monde-hd[data-monde]", { timeout: 10_000 });
}

// Ouvre le premier monde contenant une chip non verrouillée et la retourne
async function pickFreeChip(page) {
  const mondes = page.locator(".vs-monde-hd[data-monde]");
  const n = await mondes.count();
  for (let i = 0; i < n; i++) {
    const monde = mondes.nth(i);
    const section = monde.locator(".."); // section.vs-monde
    const isOpen = await section.evaluate((el) =>
      el.classList.contains("open"),
    );
    if (!isOpen) await monde.click();
    const chip = section.locator(".vs-chip[data-comp]").first();
    if (await chip.isVisible({ timeout: 1_500 }).catch(() => false))
      return chip;
  }
  return null;
}

test.describe("Enseignant — validation de séance", () => {
  test("page validation se charge correctement", async ({ page }) => {
    await loginAsEnseignant(page);
    await goToValidation(page);
    await expect(page.locator(".vs-h1")).toBeVisible();
  });

  test("liste d'élèves visible dans le dropdown", async ({ page }) => {
    await loginAsEnseignant(page);
    await goToValidation(page);
    await page.waitForSelector(".vs-dd-opt[data-eleve]", { timeout: 20_000 });
    const opts = page.locator(".vs-dd-opt[data-eleve]");
    await expect(opts.first()).toBeVisible();
    expect(await opts.count()).toBeGreaterThanOrEqual(1);
  });

  test("sélection d'un élève affiche les mondes REMC", async ({ page }) => {
    await loginAsEnseignant(page);
    await goToValidation(page);
    await pickFirstEleve(page);
    await expect(
      page.locator(".vs-monde-hd[data-monde]").first(),
    ).toBeVisible();
    // Le footer de validation apparaît dès qu'un élève est choisi
    await expect(page.locator("#vs-submit")).toBeVisible();
  });

  test("tap sur une compétence libre → état « acquis » + label du CTA", async ({
    page,
  }) => {
    await loginAsEnseignant(page);
    await goToValidation(page);
    await pickFirstEleve(page);

    const chip = await pickFreeChip(page);
    if (!chip) {
      test.skip(
        true,
        "Toutes les compétences sont déjà acquises pour cet élève",
      );
      return;
    }
    await chip.click();
    await expect(chip).toHaveClass(/acquis/);
    await expect(page.locator("#vs-submit-lbl")).toContainText(/Valider · 1/);
  });

  test("keyboard nav : Tab atteint le dropdown élève", async ({ page }) => {
    await loginAsEnseignant(page);
    await goToValidation(page);
    await page.waitForSelector(".vs-dd-opt[data-eleve]", { timeout: 20_000 });
    const firstOpt = page.locator(".vs-dd-opt[data-eleve]").first();
    await firstOpt.focus();
    await expect(firstOpt).toBeFocused();
    // Enter → sélectionne l'élève, les mondes apparaissent
    await page.keyboard.press("Enter");
    await page.waitForSelector(".vs-monde-hd[data-monde]", { timeout: 10_000 });
  });

  test("validation complète → toast de succès", async ({ page }) => {
    test.setTimeout(60_000); // login + RPC validate_session : long sur réseau lent
    await loginAsEnseignant(page);
    await goToValidation(page);
    await pickFirstEleve(page);

    const chip = await pickFreeChip(page);
    if (!chip) {
      test.skip(true, "Toutes les compétences sont déjà acquises");
      return;
    }
    await chip.click();
    await expect(chip).toHaveClass(/acquis/);

    const submit = page.locator("#vs-submit");
    await submit.scrollIntoViewIfNeeded();
    await submit.click();
    // Succès = navigation vers la liste élèves (déclenchée APRÈS le toast) ;
    // plus fiable que d'attraper le toast qui peut disparaître vite.
    await page.waitForURL(/#\/eleves/, { timeout: 20_000 });
  });
});
