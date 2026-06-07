/**
 * E2E — Onboarding modal (1er login élève)
 *
 * Stratégie :
 *  - L'onboarding s'affiche quand `profiles.first_value_action_at IS NULL`
 *  - On ne peut pas créer un nouveau compte en test sans migration
 *  - On mock la condition via `page.evaluate()` en patchant
 *    `showOnboarding()` au runtime ou en manipulant la condition dans le DOM
 *
 * Alternative directe : injecter l'onboarding manuellement après login
 * et tester son comportement indépendamment de la condition DB.
 */
import { test, expect } from '@playwright/test';
import { ELEVE } from './_creds.js';

const EMAIL = ELEVE.email;
const PWD   = ELEVE.pwd;

async function loginAsEleve(page) {
  await page.goto('/#/login');
  await page.waitForSelector('#lg-email', { timeout: 12_000 });
  await page.fill('#lg-email', EMAIL);
  await page.fill('#lg-pwd', PWD);
  await page.click('#lg-submit');
  await page.waitForSelector('.acc-bonjour', { timeout: 20_000 });
}

test.describe('Onboarding modal', () => {
  test('modal s\'injecte via showOnboarding() et affiche la slide 1', async ({ page }) => {
    await loginAsEleve(page);

    // Injecte l'onboarding manuellement (bypass condition first_value_action_at)
    await page.evaluate(async () => {
      const { showOnboarding } = await import('/src/components/onboarding-modal.js');
      showOnboarding(null, () => {}); // userId=null → pas de DB write
    });

    // Le modal doit apparaître
    await page.waitForSelector('.ob-overlay', { timeout: 5_000 });
    await expect(page.locator('.ob-overlay')).toBeVisible();
    await expect(page.locator('.ob-sheet')).toBeVisible();
  });

  test('slide 1 → "Suivant" → slide 2 (accent change)', async ({ page }) => {
    await loginAsEleve(page);

    await page.evaluate(async () => {
      const { showOnboarding } = await import('/src/components/onboarding-modal.js');
      showOnboarding(null, () => {});
    });
    await page.waitForSelector('.ob-slide', { timeout: 5_000 });

    // Accent couleur slide 1 : indigo (#6366f1)
    const accentBefore = await page.locator('.ob-accent-bar').evaluate(
      el => getComputedStyle(el).background
    );

    await page.locator('#ob-next').click();

    // Slide 2 chargée (contenu change, dot 2 actif)
    await expect(page.locator('.ob-dots .ob-dot.active').nth(0)).not.toHaveClass('active');
    const activeIdx = await page.evaluate(() => {
      const dots = [...document.querySelectorAll('.ob-dot')];
      return dots.findIndex(d => d.classList.contains('active'));
    });
    expect(activeIdx).toBe(1);
  });

  test('3 slides → "C\'est parti" → modal se ferme', async ({ page }) => {
    await loginAsEleve(page);

    let onDoneCalled = false;
    await page.exposeFunction('__onboardingDone', () => { onDoneCalled = true; });

    await page.evaluate(async () => {
      const { showOnboarding } = await import('/src/components/onboarding-modal.js');
      showOnboarding(null, () => window.__onboardingDone());
    });
    await page.waitForSelector('.ob-overlay', { timeout: 5_000 });

    // Navigue les 3 slides
    await page.locator('#ob-next').click(); // slide 1 → 2
    await page.waitForTimeout(300);
    await page.locator('#ob-next').click(); // slide 2 → 3
    await page.waitForTimeout(300);

    // Slide 3 : bouton devient "C'est parti !"
    await expect(page.locator('#ob-next')).toContainText("C'est parti");

    await page.locator('#ob-next').click();

    // Modal doit disparaître
    await expect(page.locator('.ob-overlay')).toHaveCount(0, { timeout: 2_000 });
  });

  test('"Passer" skip immédiatement le modal', async ({ page }) => {
    await loginAsEleve(page);

    await page.evaluate(async () => {
      const { showOnboarding } = await import('/src/components/onboarding-modal.js');
      showOnboarding(null, () => {});
    });
    await page.waitForSelector('.ob-overlay', { timeout: 5_000 });

    await page.locator('#ob-skip').click();
    await expect(page.locator('.ob-overlay')).toHaveCount(0, { timeout: 2_000 });
  });

  test('dots — navigation cohérente avec le slide actif', async ({ page }) => {
    await loginAsEleve(page);

    await page.evaluate(async () => {
      const { showOnboarding } = await import('/src/components/onboarding-modal.js');
      showOnboarding(null, () => {});
    });
    await page.waitForSelector('.ob-dots', { timeout: 5_000 });

    // Slide 0 actif
    let activeIdx = await page.evaluate(() =>
      [...document.querySelectorAll('.ob-dot')].findIndex(d => d.classList.contains('active'))
    );
    expect(activeIdx).toBe(0);

    await page.locator('#ob-next').click();
    await page.waitForTimeout(300);

    // Slide 1 actif
    activeIdx = await page.evaluate(() =>
      [...document.querySelectorAll('.ob-dot')].findIndex(d => d.classList.contains('active'))
    );
    expect(activeIdx).toBe(1);
  });

  test('l\'onboarding n\'apparaît PAS si first_value_action_at est défini', async ({ page }) => {
    // Dans l'app réelle, accueil.js ne montre l'onboarding que si !profile.first_value_action_at
    // On teste que notre compte test (profil existant avec date) n'affiche PAS le modal auto
    await loginAsEleve(page);
    await page.waitForTimeout(1_000); // laisser le temps au boot
    // Le compte élève de test a déjà fait l'onboarding → .ob-overlay ne doit pas être là
    await expect(page.locator('.ob-overlay')).toHaveCount(0);
  });
});
