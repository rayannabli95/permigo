// La mission du Mode Pilote s'ouvre AVANT les questions, et le code REMC ne
// s'affiche jamais à l'élève.
//
// Le compte de test a 31/31 compétences validées par le moniteur : on répond
// une liste vide sur `validations` pour retrouver l'état « pas encore
// acquise », sinon l'écran de certification est muré.
import { test, expect } from "@playwright/test";
import { ELEVE } from "./_creds.js";

async function connecte(page) {
  await page.route(/\/rest\/v1\/(self_)?validations/, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        })
      : route.continue(),
  );
  await page.goto("/#/login");
  await page.fill("#lg-email", ELEVE.email);
  await page.fill("#lg-pwd", ELEVE.pwd);
  await page.click("#lg-submit");
  await page.waitForSelector("body.has-chrome", { timeout: 30000 });
}

/** La boîte n'est demandée qu'une fois par compte : l'écran peut ne pas venir. */
async function passeLaBoite(page) {
  const choix = page.locator('[data-boite="manuelle"]');
  if (await choix.isVisible({ timeout: 2500 }).catch(() => false)) {
    await choix.click();
  }
}

test.describe("Mode Pilote — la mission avant les questions", () => {
  test("la scène s'ouvre et la bonne zone valide l'étape", async ({ page }) => {
    await connecte(page);
    await page.goto("/#/valider-seul/C1a");
    await page.click("#vs-start-quiz");
    await passeLaBoite(page);

    await expect(page.locator(".mp-scene")).toBeVisible({ timeout: 15000 });
    // Le code REMC est une CLÉ d'entrée, jamais un texte affiché.
    await expect(page.locator(".mp-play")).not.toContainText("C1a");

    await page.click('.mp-hotspot[data-reponse="left-stalk"]');
    await expect(page.locator(".mp-feedback-success")).toBeVisible();
    // Le devoir dans la vraie voiture est la ligne qui fait le pont.
    await expect(page.locator(".mp-transfer")).toBeVisible();
    await expect(page.locator("[data-suite]")).toBeVisible();
  });

  test("une compétence sans mission garde le quiz seul", async ({ page }) => {
    await connecte(page);
    await page.goto("/#/valider-seul/C1b");
    await page.click("#vs-start-quiz");
    await passeLaBoite(page);
    await expect(page.locator(".mp-scene")).toHaveCount(0);
  });
});
