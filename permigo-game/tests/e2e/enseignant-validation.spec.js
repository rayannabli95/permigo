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
  // + marque les tuto guidés comme vus : sinon l'overlay du tour (gt-root)
  // intercepte les clics sur les chips de validation (flake récurrent).
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
  await page.fill("#lg-email", EMAIL_ENSEIGNANT);
  await page.fill("#lg-pwd", PWD);
  await page.click("#lg-submit");
  // Attendre la page enseignant (aujourd'hui ou mes-eleves)
  await page.waitForSelector(".aj-page, .me-list, .vs", { timeout: 20_000 });
  // afterLogin() force le hash sur "#/" en différé (setTimeout 600ms) et pose
  // body.has-chrome en dernier : naviguer avant = se faire écraser le hash.
  await page.waitForSelector("body.has-chrome", { timeout: 20_000 });
}

async function goToValidation(page) {
  // Le boot post-login peut écraser un hash posé trop tôt → on re-pose le
  // hash et on re-vérifie jusqu'à ce que la page validation soit montée.
  await expect(async () => {
    await page.evaluate(() => {
      location.hash = "#/validation";
    });
    await page.waitForSelector(".vs", { timeout: 4_000 });
  }).toPass({ timeout: 25_000 });
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

// Ouvre les mondes un à un jusqu'à trouver une chip non verrouillée.
// ⚠️ Cliquer un monde re-render TOUTE la page (render() complet) : il faut
// re-query après chaque clic, jamais garder un handle d'avant.
async function pickFreeChip(page) {
  const n = await page.locator(".vs-monde-hd[data-monde]").count();
  for (let i = 0; i < n; i++) {
    const hd = page.locator(".vs-monde-hd[data-monde]").nth(i);
    if ((await hd.getAttribute("aria-expanded")) !== "true") {
      await hd.evaluate((el) => el.click());
    }
    const chip = page.locator(".vs-monde.open .vs-chip[data-comp]").first();
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
    test.setTimeout(90_000); // login + RPC validate_session : long sur réseau lent (marge anti-flake)
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
    // Succès = l'écran de confirmation s'affiche (RPC validate_session OK).
    // L'app ne redirige PAS auto : elle montre un écran de succès avec un CTA
    // « Voir mes élèves ». On l'attend, puis on suit le CTA vers la liste.
    const done = page.locator("#vs-success-done");
    await expect(done).toBeVisible({ timeout: 30_000 });
    await done.click();
    await page.waitForURL(/#\/eleves/, { timeout: 20_000 });
  });
});
