// Test manuel du circuit Quiz éclair : moniteur (livret) → send_flash_quiz
// → élève (hub Réviser « 1 en attente »). Contexte NEUF (pas le profil MCP).
// Usage : node scripts/test-flash-circuit.cjs — à supprimer après la PR si inutile.
const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // ── Connexion moniteur (mêmes étapes que les specs e2e : champs-pièges
  // anti-bot à NE PAS remplir → on cible les champs visibles du formulaire)
  await page.goto("http://localhost:5173/#/login");
  await page.waitForSelector("#lg-email", { timeout: 12000 });
  await page.fill("#lg-email", "enseignant@test.fr");
  await page.fill("#lg-pwd", "Autopilot2025!");
  await page.click("#lg-submit");
  await page.waitForSelector("body.has-chrome", { timeout: 25000 });
  console.log("moniteur connecté");

  // ── Ouvre le livret de l'élève ciblé (argv[2]), sinon le 1er de la liste
  let eleveId = process.argv[2] || null;
  if (!eleveId) {
    await page.goto("http://localhost:5173/#/mes-eleves");
    await page.waitForTimeout(2500);
    const card = page.locator("[data-eleve-id]").first();
    if (await card.count()) eleveId = await card.getAttribute("data-eleve-id");
  }
  if (!eleveId) throw new Error("aucun élève dans Mes élèves");
  await page.goto(`http://localhost:5173/#/livret/${eleveId}`);
  await page.waitForSelector(".fqs-card", { timeout: 15000 });
  console.log("bloc Quiz éclair présent sur le livret");

  // Tuto guidé éventuel (contexte neuf) : on le passe pour libérer les clics
  for (let i = 0; i < 3; i++) {
    const skip = page.locator(".gt-skip");
    if (await skip.count()) { await skip.first().click(); await page.waitForTimeout(400); }
  }

  // ── Envoi d'un quiz éclair C2f
  await page.locator(".fqs-sel").selectOption("C2f");
  await page.locator(".fqs-send").click();
  await page.waitForFunction(
    () => {
      const t = document.querySelector(".fqs-feedback")?.textContent || "";
      return t.length > 2 && !t.includes("Envoi…");
    },
    { timeout: 20000 },
  );
  const fb = await page.locator(".fqs-feedback").textContent();
  console.log("feedback envoi :", fb.trim());

  await browser.close();
  process.exit(fb.includes("Envoyé") ? 0 : 1);
})().catch((e) => {
  console.error("ECHEC :", e.message);
  process.exit(1);
});
