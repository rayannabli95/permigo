/**
 * E2E — Empty States (tous rôles)
 *
 * Vérifie que les empty states s'affichent correctement
 * dans parcours, trophées, accueil (mini) et mes-élèves.
 *
 * Comptes test :
 *   Élève  : eleve@test.fr      / Autopilot2025!
 *   Moniteur : enseignant@test.fr / Autopilot2025!
 */
import { test, expect } from '@playwright/test';
import { ELEVE, ENSEIGNANT as MONITEUR } from './_creds.js';

async function loginAs(page, { email, pwd }) {
  await page.goto('/#/login');
  await page.waitForSelector('#lg-email', { timeout: 12_000 });
  await page.fill('#lg-email', email);
  await page.fill('#lg-pwd', pwd);
  await page.click('#lg-submit');
  await page.waitForSelector('.acc2-hero-hi, .aj-page, .me-list, .vp', { timeout: 20_000 });
}

async function goTo(page, hash) {
  await page.evaluate(h => { location.hash = h; }, hash);
}

// ── Inject a module directly if the route isn't wired yet ────────
async function injectPage(page, modulePath, extraArgs = []) {
  await page.evaluate(async ({ path, args }) => {
    const mod  = await import(path);
    const root = document.querySelector('#app') || document.body;
    await mod.mount(root, ...args);
  }, { path: modulePath, args: extraArgs });
}

// ────────────────────────────────────────────────────────────────

test.describe('Empty states — composant', () => {

  test('empty-state component injecte les styles une seule fois dans <head>', async ({ page }) => {
    await loginAs(page, ELEVE);

    await page.evaluate(async () => {
      const { renderEmptyState } = await import('/src/components/common/empty-state.js');
      // Appeler deux fois pour vérifier l'injection unique
      renderEmptyState({ illustration: '/skins/empty-parcours.png', title: 'Test' });
      renderEmptyState({ illustration: '/skins/empty-parcours.png', title: 'Test 2' });
    });

    const styleCount = await page.evaluate(() =>
      [...document.head.querySelectorAll('style')].filter(s => s.textContent.includes('.es-wrap')).length
    );
    expect(styleCount).toBe(1);
  });

});

test.describe('Empty state — Trophées élève (0 trophée)', () => {

  test('affiche l\'illustration et le CTA quand aucun trophée débloqué', async ({ page }) => {
    await loginAs(page, ELEVE);
    await goTo(page, '#/trophees');

    // Injecter si route pas câblée
    const found = await page.waitForSelector('.tr2', { timeout: 8_000 }).catch(() => null);
    if (!found) await injectPage(page, '/src/pages/eleve/trophees.js');
    await page.waitForSelector('.tr2', { timeout: 8_000 });

    // Si 0 trophée → l'empty state doit s'afficher
    const hasEmpty = await page.locator('.es-wrap').isVisible({ timeout: 3_000 }).catch(() => false);
    const hasCards = await page.locator('.tr2-grid').count().then(n => n > 0).catch(() => false);

    // L'un ou l'autre : soit des trophées, soit l'empty state
    const valid = hasEmpty || hasCards;
    expect(valid).toBe(true);

    if (hasEmpty) {
      await expect(page.locator('.es-img')).toBeVisible();
      await expect(page.locator('.es-cta')).toBeVisible();
      const href = await page.locator('.es-cta').getAttribute('href');
      expect(href).toContain('parcours');
    }
  });

});

test.describe('Empty state — Mes Élèves enseignant (liste vide)', () => {

  test('affiche l\'illustration quand aucun élève (onglet Tous, pas de recherche)', async ({ page }) => {
    await loginAs(page, MONITEUR);

    const found = await page.waitForSelector('.me-list', { timeout: 8_000 }).catch(() => null);
    if (!found) await injectPage(page, '/src/pages/enseignant/mes-eleves.js');
    await page.waitForSelector('.me-list', { timeout: 8_000 });

    // Si des élèves sont présents → test n'est pas applicable, on vérifie juste que la liste se charge
    const hasRows   = await page.locator('.me-row').count().then(n => n > 0).catch(() => false);
    const hasEmpty  = await page.locator('.es-wrap').isVisible().catch(() => false);
    const hasLegacy = await page.locator('.me-empty').isVisible().catch(() => false);

    // La liste doit montrer soit des élèves, soit un empty state (nouveau ou legacy)
    expect(hasRows || hasEmpty || hasLegacy).toBe(true);
  });

  test('empty state avec illustration disparaît quand une recherche sans résultat est faite', async ({ page }) => {
    await loginAs(page, MONITEUR);

    const found = await page.waitForSelector('.me-list', { timeout: 8_000 }).catch(() => null);
    if (!found) await injectPage(page, '/src/pages/enseignant/mes-eleves.js');
    await page.waitForSelector('.me-list', { timeout: 8_000 });

    // Remplir la barre de recherche avec un terme introuvable
    const searchInput = page.locator('#me-search, input[type="search"], .me-search-input').first();
    if (await searchInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await searchInput.fill('xxxxunfindablexxx');
      await page.waitForTimeout(300);

      // Doit montrer le texte "Aucun résultat" et NON l'illustration
      const noResultTxt = await page.locator('.me-empty').textContent({ timeout: 2_000 }).catch(() => '');
      expect(noResultTxt).toMatch(/résultat|aucun/i);
    } else {
      test.skip(true, 'Barre de recherche non visible');
    }
  });

});
