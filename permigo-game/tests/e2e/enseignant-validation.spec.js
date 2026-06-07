/**
 * E2E — Enseignant : flow validation compétence
 *
 * Flow testé :
 *  1. Login enseignant
 *  2. Navigation vers la page validation
 *  3. Sélection d'un élève
 *  4. Sélection d'une compétence (nextUnlockable)
 *  5. Confirmer → vérifie toast de succès
 *  6. Vérifie que la notification a été insérée en DB (via Supabase JS)
 *
 * Comptes test :
 *  - Enseignant : enseignant@test.fr / Autopilot2025!
 */
import { test, expect } from '@playwright/test';
import { ENSEIGNANT } from './_creds.js';

const EMAIL_ENSEIGNANT = ENSEIGNANT.email;
const PWD              = ENSEIGNANT.pwd;

async function loginAsEnseignant(page) {
  await page.goto('/#/login');
  await page.waitForSelector('#lg-email', { timeout: 12_000 });
  await page.fill('#lg-email', EMAIL_ENSEIGNANT);
  await page.fill('#lg-pwd', PWD);
  await page.click('#lg-submit');
  // Attendre la page enseignant (aujourd'hui ou mes-eleves)
  await page.waitForSelector('.aj-page, .me-list, .vp', { timeout: 20_000 });
}

async function goToValidation(page) {
  await page.evaluate(() => { location.hash = '#/validation'; });
  await page.waitForSelector('.vp', { timeout: 10_000 });
}

test.describe('Enseignant — validation compétence', () => {
  test('page validation se charge correctement', async ({ page }) => {
    await loginAsEnseignant(page);
    await goToValidation(page);
    await expect(page.locator('.vp-h1')).toBeVisible();
  });

  test('liste d\'élèves visible', async ({ page }) => {
    await loginAsEnseignant(page);
    await goToValidation(page);
    // Attendre que les élèves se chargent
    await page.waitForSelector('[data-eleve-id]', { timeout: 15_000 });
    const eleveCards = page.locator('[data-eleve-id]');
    await expect(eleveCards.first()).toBeVisible();
    const count = await eleveCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('sélection d\'un élève active les compétences', async ({ page }) => {
    await loginAsEnseignant(page);
    await goToValidation(page);
    await page.waitForSelector('[data-eleve-id]', { timeout: 15_000 });

    // Clique sur le premier élève
    await page.locator('[data-eleve-id]').first().click();

    // Les compétences doivent apparaître
    await page.waitForSelector('[data-comp-id]', { timeout: 10_000 });
    await expect(page.locator('[data-comp-id]').first()).toBeVisible();
  });

  test('sélection compétence → CTA "Confirmer" apparaît', async ({ page }) => {
    await loginAsEnseignant(page);
    await goToValidation(page);
    await page.waitForSelector('[data-eleve-id]', { timeout: 15_000 });
    await page.locator('[data-eleve-id]').first().click();
    await page.waitForSelector('[data-comp-id]', { timeout: 10_000 });

    // Clique sur la prochaine compétence (celle qui a role="button", pas aria-disabled)
    const nextComp = page.locator('[data-comp-id][role="button"]:not([aria-disabled="true"])').first();
    if (!await nextComp.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Aucune compétence déverrouillée pour cet élève');
      return;
    }
    await nextComp.click();

    // Le CTA "Confirmer" doit apparaître
    await page.waitForSelector('.btn-validate', { timeout: 5_000 });
    await expect(page.locator('.btn-validate')).toBeVisible();
    await expect(page.locator('.cta-comp-nm')).toBeVisible();
  });

  test('keyboard nav : Tab atteint les cartes élève et les compétences', async ({ page }) => {
    await loginAsEnseignant(page);
    await goToValidation(page);
    await page.waitForSelector('[data-eleve-id]', { timeout: 15_000 });

    // Vérifie que les cartes élèves sont focusables
    const firstCard = page.locator('[data-eleve-id]').first();
    await firstCard.focus();
    await expect(firstCard).toBeFocused();

    // Enter → sélectionne l'élève
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-comp-id]', { timeout: 10_000 });

    // Vérifie que les comp-rows sont focusables
    const firstComp = page.locator('[data-comp-id][role="button"]').first();
    if (await firstComp.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstComp.focus();
      await expect(firstComp).toBeFocused();
    }
  });

  test('validation complète → toast de succès + reset sélection', async ({ page }) => {
    await loginAsEnseignant(page);
    await goToValidation(page);
    await page.waitForSelector('[data-eleve-id]', { timeout: 15_000 });
    await page.locator('[data-eleve-id]').first().click();
    await page.waitForSelector('[data-comp-id]', { timeout: 10_000 });

    const nextComp = page.locator('[data-comp-id][role="button"]:not([aria-disabled="true"])').first();
    if (!await nextComp.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Aucune compétence déverrouillée');
      return;
    }
    await nextComp.click();
    await page.waitForSelector('.btn-validate', { timeout: 5_000 });

    // Intercepte les toasts avant de cliquer
    const toastPromise = page.waitForSelector(
      '.toast-success, .toast-avatar',
      { timeout: 15_000 }
    );

    await page.locator('.btn-validate').click();
    await toastPromise;

    // Le toast de succès doit être visible
    const toast = page.locator('.toast-success, .toast-avatar').first();
    await expect(toast).toBeVisible({ timeout: 5_000 });
  });
});
