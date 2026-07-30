import { expect, test } from "@playwright/test";

// Le labo est un prototype local, mais ses deux décors sont la brique sur
// laquelle on ajoutera les compétences suivantes : on vérifie que les deux
// parcours vont jusqu'au bout, sans erreur console.

test.describe("Le labo de la conduite", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  function suivreErreurs(page) {
    const erreurs = [];
    page.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
    page.on("pageerror", (e) => erreurs.push(String(e)));
    return erreurs;
  }

  test("décor cockpit : repérer puis refaire le geste", async ({ page }) => {
    const erreurs = suivreErreurs(page);
    await page.goto("/lab/labo?preset=angle-mort");

    await expect(page.locator('[data-ecran="intro"]')).toBeVisible();
    await page.getByRole("button", { name: "Commencer" }).click();

    // Les trois zones doivent être repérées avant de pouvoir continuer.
    const pret = page.getByRole("button", { name: "Je suis prêt" });
    await expect(pret).toBeDisabled();
    for (const z of ["retroInterieur", "retroExterieur", "angleMort"]) {
      await page.locator(`[data-repere="${z}"]`).click();
    }
    await expect(pret).toBeEnabled();
    await pret.click();

    // Une zone hors séquence ne valide rien et affiche l'aide.
    await page.locator('[data-sequence="angleMort"]').click();
    await expect(page.locator(".lb-retour-info.a-de-l-aide")).toBeVisible();

    for (const z of ["retroInterieur", "retroExterieur", "angleMort"]) {
      await page.locator(`[data-sequence="${z}"]`).click();
    }
    await page.getByRole("button", { name: "Comprendre le geste" }).click();
    await expect(page.locator(".lb-mot strong")).toHaveText("angle mort");

    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByRole("button", { name: "Terminer" }).click();
    await expect(page.locator('[data-ecran="fin"]')).toBeVisible();

    expect(erreurs).toEqual([]);
  });

  test("décor vue de dessus : désigner qui a la priorité", async ({ page }) => {
    const erreurs = suivreErreurs(page);
    await page.goto("/lab/labo?preset=priorite-a-droite");

    await page.getByRole("button", { name: "Commencer" }).click();
    await expect(page.locator('[data-ecran="decider"]')).toBeVisible();

    // Le décor vient du moteur isométrique de « En situation ».
    await expect(page.locator(".lb-plateau svg.sit-svg")).toBeVisible();

    const suite = page.getByRole("button", { name: "Comprendre le geste" });
    await expect(suite).toBeDisabled();
    await page.locator('[data-hit="v1"]').click({ force: true });
    await expect(suite).toBeEnabled();

    // Halo doré sur le véhicule prioritaire une fois la réponse trouvée.
    await expect(page.locator(".lb-plateau .sit-halo")).toBeAttached();

    expect(erreurs).toEqual([]);
  });

  test("la langue change le contenu et l'interface", async ({ page }) => {
    await page.goto("/lab/labo?preset=angle-mort");
    await page.getByRole("button", { name: "العربية" }).click();
    await expect(page.locator("#lb-titre")).toHaveAttribute("dir", "rtl");
    // L'app reste LTR : seul le bloc de texte passe en RTL.
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });
});
