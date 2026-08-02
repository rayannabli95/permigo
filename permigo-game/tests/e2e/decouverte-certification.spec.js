// Le compte découverte doit pouvoir CERTIFIER les trois sous-compétences
// gratuites, et seulement celles-là.
//
// Pourquoi ce test existe : la certification a longtemps été absente de la
// liste des routes de découverte. Résultat, un compte gratuit ne pouvait
// valider AUCUNE compétence : il traversait les fiches et les scènes, puis
// tapait le mur au moment de prouver ce qu'il avait appris. La décision de
// Rayan a toujours été trois compétences, pas zéro.
//
// Le mur est « fail-closed » : une route non listée est murée par défaut. Ce
// test vérifie les deux côtés, l'ouverture ET la fermeture, parce qu'ouvrir la
// certification sans filtrer son paramètre ouvrirait les 31 compétences.
import { test, expect } from "@playwright/test";

test.describe("Mode découverte — la porte de la certification", () => {
  test("les trois compétences gratuites passent, les autres sont murées", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const verdicts = await page.evaluate(async () => {
      const { isDiscoveryAllowedRoute, FREE_SUBS } =
        await import("/src/utils/free-tier.js");
      return {
        gratuites: FREE_SUBS.map((c) =>
          isDiscoveryAllowedRoute("valider-seul", c),
        ),
        payantes: ["C1d", "C1i", "C2f", "C3a", "C4g"].map((c) =>
          isDiscoveryAllowedRoute("valider-seul", c),
        ),
        sansCode: isDiscoveryAllowedRoute("valider-seul", null),
        // Une route de découverte ordinaire ne doit pas être filtrée par son
        // paramètre : elle reste ouverte quoi qu'il arrive.
        reviser: isDiscoveryAllowedRoute("reviser", null),
        // Et une surface premium reste murée.
        recompenses: isDiscoveryAllowedRoute("recompenses", null),
      };
    });

    expect(verdicts.gratuites).toEqual([true, true, true]);
    expect(verdicts.payantes).toEqual([false, false, false, false, false]);
    expect(verdicts.sansCode).toBe(false);
    expect(verdicts.reviser).toBe(true);
    expect(verdicts.recompenses).toBe(false);
  });
});
