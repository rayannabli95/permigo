/**
 * E2E — Onboarding élève « une page » (src/pages/onboarding/index.js)
 *
 * L'ancien modal 3 slides (components/onboarding-modal.js, showOnboarding)
 * a été REMPLACÉ par une page verticale unique, zéro swipe :
 *   hero « Salut {prenom} » + sections avatar/couleur, rappels, A2HS,
 *   barre de progression remplie au scroll, CTA collé en bas, bouton Passer.
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

test.describe("Onboarding élève — page unique", () => {
  test("la page se monte : hero, sections numérotées, CTA et Passer", async ({
    page,
  }) => {
    await loginAsEleve(page);
    await mountOnboarding(page);

    await expect(page.locator(".ob")).toBeVisible();
    // Hero personnalisé
    await expect(page.locator("#ob-h1")).toBeVisible();
    await expect(page.locator("#ob-h1")).toContainText(/Salut/);
    // Au moins 2 sections (avatar + rappels ; A2HS conditionnelle)
    expect(await page.locator(".ob-section").count()).toBeGreaterThanOrEqual(2);
    // CTA principal + bouton Passer
    await expect(page.locator("#ob-cta")).toBeVisible();
    await expect(page.locator("#ob-skip")).toBeVisible();
    // Barre de progression accessible
    await expect(page.locator(".ob-prog")).toHaveAttribute(
      "role",
      "progressbar",
    );
  });

  test("choisir un avatar met à jour la sélection (radiogroup)", async ({
    page,
  }) => {
    await loginAsEleve(page);
    await mountOnboarding(page);

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

  test("la barre de progression se remplit au scroll", async ({ page }) => {
    await loginAsEleve(page);
    await mountOnboarding(page);

    const before = await page.locator(".ob-prog").getAttribute("aria-valuenow");

    // Scroller le conteneur interne jusqu'en bas
    await page.evaluate(() => {
      const el = document.querySelector("#ob-scroll");
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event("scroll"));
    });
    await page.waitForTimeout(300);

    const after = await page.locator(".ob-prog").getAttribute("aria-valuenow");
    expect(parseInt(after, 10)).toBeGreaterThan(parseInt(before || "0", 10));
    // En bas de page → 100 %
    expect(parseInt(after, 10)).toBe(100);
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
