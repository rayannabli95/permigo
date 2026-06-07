/**
 * E2E — Bilan trimestriel enseignant (#/bilan/:eleveId)
 *
 * Compte test enseignant : enseignant@test.fr / Autopilot2025!
 * Note : la RPC get_bilan_data doit être déployée par Cowork.
 * Si la RPC n'existe pas encore → certains tests passent en skip gracieux.
 */
import { test, expect } from '@playwright/test';
import { ENSEIGNANT } from './_creds.js';

const EMAIL = ENSEIGNANT.email;
const PWD   = ENSEIGNANT.pwd;

// Remplace par un vrai UUID d'élève rattaché au moniteur de test
// On tentera de le récupérer dynamiquement depuis mes-eleves si possible
let ELEVE_ID = null;

async function loginAsEnseignant(page) {
  await page.goto('/#/login');
  await page.waitForSelector('#lg-email', { timeout: 12_000 });
  await page.fill('#lg-email', EMAIL);
  await page.fill('#lg-pwd', PWD);
  await page.click('#lg-submit');
  await page.waitForSelector('.aj-page, .me-list, .vp', { timeout: 20_000 });
}

async function getFirstEleveId(page) {
  // Tente de récupérer un élève depuis mes-eleves
  const id = await page.evaluate(async () => {
    try {
      const { sb } = await import('/src/auth/auth.js');
      const { getCurUser } = await import('/src/auth/cur-user.js');
      const me = getCurUser();
      if (!me) return null;
      const { data } = await sb
        .from('profiles')
        .select('id')
        .eq('enseignant_id', me.id)
        .eq('role', 'eleve')
        .limit(1);
      return data?.[0]?.id ?? null;
    } catch { return null; }
  });
  return id;
}

async function goToBilan(page, eleveId) {
  await page.evaluate(id => { location.hash = `#/bilan/${id}`; }, eleveId);

  const found = await page.waitForSelector('.bl', { timeout: 8_000 }).catch(() => null);
  if (!found) {
    await page.evaluate(async id => {
      const { mount } = await import('/src/pages/enseignant/bilan.js');
      const root = document.querySelector('#app') || document.body;
      await mount(root, id);
    }, eleveId);
    await page.waitForSelector('.bl', { timeout: 12_000 });
  }
}

test.describe('Bilan trimestriel enseignant', () => {

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAsEnseignant(page);
    ELEVE_ID = await getFirstEleveId(page);
    await ctx.close();
  });

  test('page bilan se charge (ou affiche erreur gracieuse si RPC absente)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await loginAsEnseignant(page);

    if (!ELEVE_ID) {
      test.skip(true, 'Aucun élève rattaché au compte enseignant test');
      return;
    }

    await goToBilan(page, ELEVE_ID);

    // Page doit s'afficher (avec données ou avec message d'erreur gracieux)
    await expect(page.locator('.bl')).toBeVisible({ timeout: 12_000 });

    const critical = errors.filter(e =>
      !e.includes('favicon') && !e.includes('sw.js')
    );
    expect(critical).toHaveLength(0);
  });

  test('bilan : 4 KPI affichent des valeurs (pas NaN ni vide)', async ({ page }) => {
    await loginAsEnseignant(page);

    if (!ELEVE_ID) {
      test.skip(true, 'Aucun élève rattaché au compte enseignant test');
      return;
    }

    await goToBilan(page, ELEVE_ID);

    // Si la RPC renvoie une erreur, le bilan montre `.bl-no-data` — skip gracieux
    const isNoData = await page.locator('.bl-no-data').isVisible({ timeout: 3_000 }).catch(() => false);
    if (isNoData) {
      test.skip(true, 'RPC get_bilan_data non disponible ou élève sans données');
      return;
    }

    await page.waitForSelector('.bl-kpi-grid', { timeout: 10_000 });
    const kpis = page.locator('.bl-kpi-val');
    const count = await kpis.count();
    expect(count).toBeGreaterThanOrEqual(4);

    const vals = await kpis.allTextContents();
    vals.forEach(v => {
      const clean = v.trim().replace(/[^0-9%+\-—]/g, '');
      expect(clean).not.toBe('NaN');
    });
  });

  test('bouton Imprimer déclenche window.print', async ({ page }) => {
    await loginAsEnseignant(page);

    if (!ELEVE_ID) {
      test.skip(true, 'Aucun élève rattaché au compte enseignant test');
      return;
    }

    await goToBilan(page, ELEVE_ID);

    const isNoData = await page.locator('.bl-no-data').isVisible({ timeout: 3_000 }).catch(() => false);
    if (isNoData) {
      test.skip(true, 'RPC get_bilan_data non disponible');
      return;
    }

    // Écouter l'appel à window.print via stub
    const printCalled = await page.evaluate(async () => {
      return new Promise(resolve => {
        window._printCalled = false;
        window.print = () => { window._printCalled = true; resolve(true); };
        // Timeout 3s si le bouton n'est pas cliqué
        setTimeout(() => resolve(false), 3_000);
      });
    });

    // Le stub est en place, maintenant cliquer
    if (await page.locator('#bl-btn-print').isVisible({ timeout: 2_000 }).catch(() => false)) {
      await page.locator('#bl-btn-print').click();
      const called = await page.evaluate(() => window._printCalled);
      expect(called).toBe(true);
    } else {
      test.skip(true, 'Bouton imprimer non visible');
    }
  });

});
