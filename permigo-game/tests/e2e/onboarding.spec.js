/**
 * E2E — Onboarding élève « écrans mascotte » (src/pages/onboarding/index.js)
 *
 * Tour en étapes plein écran, une seule décision par écran : accueil,
 * « Ton style » (avatar + couleur), rappels du soir, A2HS (conditionnelle).
 * Chaque étape a sa propre pose de mascotte. La barre de progression avance
 * à chaque étape, plus au scroll (l'ancienne page unique a été remplacée).
 *
 * Stratégie :
 *  - Le gating réel (profiles.first_value_action_at IS NULL + flag
 *    localStorage absent) est inatteignable avec le compte test → on monte
 *    la page directement via import du module après login.
 *  - finish() écrit en DB (PATCH profiles + RPC unlock_chest) : ces appels
 *    sont neutralisés par interception réseau pour ne pas muter le compte test.
 */
import { test, expect } from "@playwright/test";
import { ELEVE } from "./_creds.js";

const EMAIL = ELEVE.email;
const PWD = ELEVE.pwd;

async function loginAsEleve(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("permigo_cookie_consent", "essential");
      localStorage.setItem("pg-tour-eleve-v1", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/#/login");
  await page.waitForSelector("#lg-email", { timeout: 12_000 });
  await page.fill("#lg-email", EMAIL);
  await page.fill("#lg-pwd", PWD);
  await page.click("#lg-submit");
  // 25 s : sous forte charge (suite complète en parallèle), le boot
  // post-login peut dépasser les 20 s.
  await page.waitForSelector("body.has-chrome", { timeout: 25_000 });
}

// Neutralise les écritures de finish() : PATCH profiles + RPC unlock_chest.
// Le compte test ne doit pas être muté (first_value_action_at, avatar…).
async function blockFinishWrites(page) {
  await page.route("**/rest/v1/profiles**", (route) => {
    if (route.request().method() === "PATCH") {
      return route.fulfill({ status: 204, body: "" });
    }
    return route.continue();
  });
  await page.route("**/rest/v1/rpc/unlock_chest", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    }),
  );
}

// Monte la page onboarding directement (bypass du gating main.js).
// Dans un conteneur DÉDIÉ (pas #app) : les rendus async de l'accueil
// (quêtes, coffre…) peuvent réécrire #app après l'injection et effacer
// la page montée (flake prouvé en mobile).
async function mountOnboarding(page) {
  await page.evaluate(async () => {
    const { mount } = await import("/src/pages/onboarding/index.js");
    let root = document.querySelector("#e2e-ob-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "e2e-ob-root";
      document.body.appendChild(root);
    }
    await mount(root);
  });
  await page.waitForSelector(".ob", { timeout: 10_000 });
}

test.describe("Onboarding élève — écrans mascotte", () => {
  test("la page se monte : étape d'accueil, CTA et Passer", async ({
    page,
  }) => {
    await loginAsEleve(page);
    await mountOnboarding(page);

    await expect(page.locator(".ob")).toBeVisible();
    // Étape d'accueil affichée en premier
    await expect(page.locator("#ob-h1-intro")).toBeVisible();
    await expect(page.locator("#ob-h1-intro")).toContainText(/Salut/);
    // Au moins 3 étapes (accueil + style + rappels ; A2HS conditionnelle)
    expect(await page.locator(".ob-scr").count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator("#ob-cta")).toBeVisible();
    await expect(page.locator("#ob-skip")).toBeVisible();
    // Barre de progression accessible
    await expect(page.locator(".ob-prog")).toHaveAttribute(
      "role",
      "progressbar",
    );
  });

  test("« Continuer » avance d'une étape à la fois et la progression grimpe", async ({
    page,
  }) => {
    await loginAsEleve(page);
    await mountOnboarding(page);

    const before = await page.locator(".ob-prog").getAttribute("aria-valuenow");

    await page.locator("#ob-cta").evaluate((el) => el.click());

    await expect(page.locator('.ob-scr[data-key="avatar"]')).toBeVisible();
    await expect(page.locator('.ob-scr[data-key="intro"]')).toBeHidden();

    const after = await page.locator(".ob-prog").getAttribute("aria-valuenow");
    expect(parseInt(after, 10)).toBeGreaterThan(parseInt(before || "0", 10));
  });

  test("choisir un avatar met à jour la sélection (radiogroup)", async ({
    page,
  }) => {
    await loginAsEleve(page);
    await mountOnboarding(page);

    // Avancer jusqu'à l'étape « Ton style »
    await page.locator("#ob-cta").evaluate((el) => el.click());
    await expect(page.locator('.ob-scr[data-key="avatar"]')).toBeVisible();

    const avatars = page.locator("#ob-av-grid .ob-av");
    const count = await avatars.count();
    expect(count).toBeGreaterThan(1);

    // Sélectionner le 2e avatar (clic DOM direct : animations d'entrée)
    await avatars.nth(1).evaluate((el) => el.click());

    await expect(avatars.nth(1)).toHaveAttribute("aria-checked", "true");
    await expect(avatars.nth(1)).toHaveClass(/sel/);
    // Un seul avatar sélectionné à la fois
    expect(
      await page.locator('#ob-av-grid .ob-av[aria-checked="true"]').count(),
    ).toBe(1);
  });

  test("parcourir toutes les étapes amène la progression à 100 %", async ({
    page,
  }) => {
    await loginAsEleve(page);
    await mountOnboarding(page);

    const total = await page.locator(".ob-scr").count();
    // S'arrête sur la DERNIÈRE étape (sans la finir : total - 1 clics).
    for (let i = 0; i < total - 1; i++) {
      await page.locator("#ob-cta").evaluate((el) => el.click());
      await page.waitForTimeout(80);
    }

    const pct = await page.locator(".ob-prog").getAttribute("aria-valuenow");
    expect(parseInt(pct, 10)).toBe(100);
  });

  test("« Passer » termine l'onboarding : flag posé + retour à l'accueil", async ({
    page,
  }) => {
    await loginAsEleve(page);
    await blockFinishWrites(page);
    await mountOnboarding(page);

    await page.locator("#ob-skip").evaluate((el) => el.click());

    // finish() pose le flag puis recharge sur #/ — attendre le re-boot
    await page.waitForSelector("body.has-chrome", { timeout: 25_000 });
    await expect(page.locator(".ob")).toHaveCount(0);

    const flag = await page.evaluate(() =>
      localStorage.getItem("permigo_eleve_onboarding_done"),
    );
    expect(flag).toBe("1");
  });

  test("l'onboarding n'apparaît PAS au boot pour un compte déjà passé par le flow", async ({
    page,
  }) => {
    // main.js ne monte l'onboarding que si first_value_action_at est NULL
    // ET que le flag localStorage est absent. Le compte test a déjà fait
    // son onboarding → la page .ob ne doit jamais apparaître au boot.
    await loginAsEleve(page);
    await page.waitForTimeout(1_000); // laisser le temps au boot
    await expect(page.locator(".ob")).toHaveCount(0);
  });
});
