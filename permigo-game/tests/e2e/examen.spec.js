/**
 * E2E — Page "Mon examen B" (élève)
 *
 * Compte test : eleve@test.fr / Autopilot2025!
 * Note : la route #/examen doit être câblée dans router.js par Cowork.
 * En attendant, on teste en injectant le mount() directement.
 */
import { test, expect } from '@playwright/test';
import { ELEVE } from './_creds.js';

const EMAIL = ELEVE.email;
const PWD   = ELEVE.pwd;

const LS_KEY_DATE    = 'permigo:exam_date';
const LS_KEY_REVISED = 'permigo:has_revised';

async function loginAsEleve(page) {
  await page.goto('/#/login');
  await page.waitForSelector('#lg-email', { timeout: 12_000 });
  await page.fill('#lg-email', EMAIL);
  await page.fill('#lg-pwd', PWD);
  await page.click('#lg-submit');
  await page.waitForSelector('.acc, [data-page]', { timeout: 20_000 });
}

async function goToExamen(page) {
  await page.evaluate(() => { location.hash = '#/examen'; });
  const found = await page.waitForSelector('.exam', { timeout: 8_000 }).catch(() => null);
  if (!found) {
    await page.evaluate(async () => {
      const { mount } = await import('/src/pages/eleve/examen.js');
      const root = document.querySelector('#app') || document.body;
      await mount(root);
    });
    await page.waitForSelector('.exam', { timeout: 10_000 });
  }
}

test.describe('Page Examen élève', () => {

  test('la page se charge sans erreur JS critique', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await loginAsEleve(page);
    await goToExamen(page);

    await expect(page.locator('.exam')).toBeVisible({ timeout: 10_000 });

    const critical = errors.filter(e =>
      !e.includes('favicon') && !e.includes('sw.js')
    );
    expect(critical).toHaveLength(0);
  });

  test('countdown : sans date → affiche le CTA "Choisir ma date"', async ({ page }) => {
    await loginAsEleve(page);

    // Effacer la date si elle existe
    await page.evaluate(key => localStorage.removeItem(key), LS_KEY_DATE);

    await goToExamen(page);
    await page.waitForSelector('.exam', { timeout: 10_000 });

    // Doit afficher le bouton "Choisir ma date" et non les tuiles
    await expect(page.locator('.exam-choose-btn')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.exam-countdown-tiles')).toHaveCount(0);
  });

  test('countdown : avec date future → affiche les 3 tuiles (jours/heures/min)', async ({ page }) => {
    await loginAsEleve(page);

    // Forcer une date dans le futur (+30j)
    const future = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    await page.evaluate(({ key, val }) => localStorage.setItem(key, val), { key: LS_KEY_DATE, val: future });

    await goToExamen(page);
    await page.waitForSelector('.exam-countdown-tiles', { timeout: 10_000 });

    const tiles = page.locator('.exam-tile');
    await expect(tiles).toHaveCount(3);

    // Chaque tuile doit afficher un nombre valide (≥ 0)
    const nums = await page.locator('.exam-tile-num').allTextContents();
    nums.forEach(n => {
      expect(parseInt(n.trim(), 10)).toBeGreaterThanOrEqual(0);
    });
  });

  test('checklist : 5 lignes affichées, aucun NaN', async ({ page }) => {
    await loginAsEleve(page);
    await goToExamen(page);

    await page.waitForSelector('.exam-checklist', { timeout: 10_000 });
    const rows = page.locator('.exam-check-row');
    await expect(rows).toHaveCount(5);

    const badges = await page.locator('.exam-check-badge').allTextContents();
    badges.forEach(b => {
      expect(b.trim()).not.toBe('NaN');
      expect(b.trim().length).toBeGreaterThan(0);
    });
  });

  test('saisir et enregistrer une date → countdown se rafraîchit', async ({ page }) => {
    await loginAsEleve(page);
    await page.evaluate(key => localStorage.removeItem(key), LS_KEY_DATE);

    await goToExamen(page);
    await page.waitForSelector('.exam-choose-btn', { timeout: 10_000 });

    // Cliquer sur "Choisir ma date" → révèle le champ
    await page.locator('.exam-choose-btn').click();
    await page.waitForSelector('.exam-date-input-wrap.open', { timeout: 3_000 });

    // Saisir une date future
    const future = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
    await page.locator('#exam-date-input').fill(future);
    await page.locator('#exam-date-save').click();

    // Après enregistrement, les tuiles countdown doivent s'afficher
    await page.waitForSelector('.exam-countdown-tiles', { timeout: 5_000 });
    const tiles = await page.locator('.exam-tile').count();
    expect(tiles).toBe(3);
  });

});
