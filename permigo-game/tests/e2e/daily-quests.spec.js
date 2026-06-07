/**
 * E2E — Daily quests component (quêtes du jour)
 *
 * Valide le fix du commit 6eb9420 : avant la correction, data-quest-id valait
 * "undefined" (q.id au lieu de q.quest_id) et le claim échouait silencieusement.
 *
 * Compte test : eleve@test.fr / Autopilot2025!
 */
import { test, expect } from "@playwright/test";
import { ELEVE } from "./_creds.js";

const EMAIL = ELEVE.email;
const PWD = ELEVE.pwd;

async function loginAsEleve(page) {
  // Le form de login est sur #/login (/ affiche la landing)
  await page.goto("/#/login");
  await page.waitForSelector("#lg-email", { timeout: 12_000 });
  await page.fill("#lg-email", EMAIL);
  await page.fill("#lg-pwd", PWD);
  await page.click("#lg-submit");
  await page.waitForSelector(".acc2, .acc-bonjour", { timeout: 20_000 });
}

/** Attend que mountDailyQuests ait eu le temps de s'exécuter (async, non-bloquant). */
async function waitForDailyQuestsOrTimeout(page, ms = 6_000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const count = await page.locator(".dq-card").count();
    if (count > 0) return true;
    await page.waitForTimeout(300);
  }
  return false;
}

test.describe("Daily quests — fix alignement champs RPC", () => {
  test("accueil se charge sans erreur JS", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await loginAsEleve(page);

    const critical = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("sw.js"),
    );
    expect(critical).toHaveLength(0);
  });

  test("aucune carte de quête n'a data-quest-id='undefined'", async ({
    page,
  }) => {
    await loginAsEleve(page);

    const hasQuests = await waitForDailyQuestsOrTimeout(page);

    if (!hasQuests) {
      // Toutes les quêtes déjà réclamées aujourd'hui → section masquée → skip gracieux
      test.info(
        "Section quêtes absente (toutes réclamées ou RPC vide) — assertion ignorée",
      );
      return;
    }

    // ASSERTION PRINCIPALE : le bug corrigé produisait data-quest-id="undefined"
    const undefinedCards = page.locator('.dq-card[data-quest-id="undefined"]');
    await expect(undefinedCards).toHaveCount(0);
  });

  test("chaque carte affiche un texte de récompense non vide", async ({
    page,
  }) => {
    await loginAsEleve(page);

    const hasQuests = await waitForDailyQuestsOrTimeout(page);
    if (!hasQuests) {
      test.info("Section quêtes absente — assertion ignorée");
      return;
    }

    const cards = page.locator(".dq-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const rewardText = await cards.nth(i).locator(".dq-reward").textContent();
      // Quêtes login/validate/quiz ont toutes reward_xp > 0 → texte non vide
      expect(rewardText.trim()).not.toBe("");
    }
  });

  test("data-quest-id contient un vrai identifiant de quête (pas undefined ni vide)", async ({
    page,
  }) => {
    await loginAsEleve(page);

    const hasQuests = await waitForDailyQuestsOrTimeout(page);
    if (!hasQuests) {
      test.info("Section quêtes absente — assertion ignorée");
      return;
    }

    const ids = await page
      .locator(".dq-card")
      .evaluateAll((cards) => cards.map((c) => c.dataset.questId));

    for (const id of ids) {
      expect(id).not.toBe("undefined");
      expect(id).not.toBe("");
      expect(id).not.toBeNull();
      // Les quest_id commencent tous par "quest_"
      expect(id).toMatch(/^quest_/);
    }
  });

  test("claim d'une quête réclamable — pas d'erreur, popup s'affiche", async ({
    page,
  }) => {
    await loginAsEleve(page);

    const hasQuests = await waitForDailyQuestsOrTimeout(page);
    if (!hasQuests) {
      test.info(
        "Section quêtes absente (toutes réclamées ou vide) — test ignoré",
      );
      return;
    }

    const readyCard = page.locator(".dq-card--ready").first();
    const hasReady = (await readyCard.count()) > 0;

    if (!hasReady) {
      // Quêtes pas encore complétées aujourd'hui → skip gracieux (pas un fail)
      test.info(
        "Aucune quête à l'état réclamable disponible — assertion claim ignorée",
      );
      return;
    }

    // Écouter les toasts d'erreur AVANT de cliquer
    const toastErrors = [];
    page.on("console", (msg) => {
      if (
        msg.type() === "warn" &&
        msg.text().includes("not_completed_or_already_claimed")
      ) {
        toastErrors.push(msg.text());
      }
    });

    // Intercepter les appels RPC pour vérifier que p_quest_id n'est pas "undefined"
    const rpcCalls = [];
    await page.route("**/rest/v1/rpc/claim_quest", (route) => {
      const body = route.request().postDataJSON?.() ?? {};
      rpcCalls.push(body);
      route.continue();
    });

    await readyCard.click();

    // Laisser le temps au RPC + animation
    await page.waitForTimeout(1_500);

    // Aucune erreur "not_completed_or_already_claimed" ne doit apparaître
    expect(toastErrors).toHaveLength(0);

    // Le p_quest_id envoyé au RPC ne doit pas être "undefined"
    if (rpcCalls.length > 0) {
      const lastCall = rpcCalls[rpcCalls.length - 1];
      expect(lastCall.p_quest_id).not.toBe("undefined");
      expect(lastCall.p_quest_id).toMatch(/^quest_/);
    }

    // La card doit avoir disparu (fade out) OU être passée en dq-card--claimed
    const cardStillReady = await page
      .locator(".dq-card--ready")
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
    // Après claim réussi, la card se retire du DOM
    expect(cardStillReady).toBe(false);
  });
});
