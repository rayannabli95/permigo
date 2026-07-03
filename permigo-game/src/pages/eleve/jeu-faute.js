// ═══════════════════════════════════════════════════════════════
// Élève — « Trouve la faute » : repère l'action qui est une faute
// éliminatoire parmi 3. Réutilise le composant premium-quiz (pick 1/3).
// Contenu : src/data/jeu-faute.json. 100% front, 0 DB.
// ═══════════════════════════════════════════════════════════════
import { navigate } from "@/router.js";
import { track } from "@/services/analytics.js";
import { mountPremiumQuiz } from "@/components/eleve/premium-quiz.js";
import { jeuFauteSession } from "@/data/quiz-conduite.js";

export async function mount(root) {
  track("page_view", { page: "jeu-faute" });
  const questions = jeuFauteSession(8);
  if (!questions.length) {
    // État vide explicite plutôt qu'une redirection muette (cul-de-sac invisible)
    root.innerHTML = `
<div style="min-height:60dvh;display:flex;align-items:center;justify-content:center;padding:24px">
  <div style="text-align:center;max-width:300px">
    <div style="font-size:40px;margin-bottom:12px" aria-hidden="true">🧐</div>
    <div style="font:700 17px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:6px">Pas encore de fautes à revoir</div>
    <p style="font:500 13.5px/1.5 'Inter',sans-serif;color:var(--mu);margin-bottom:18px">Le mini-jeu se nourrit des fiches de conduite. Commence par en lire une !</p>
    <button id="jf-empty-cta" style="min-height:44px;padding:12px 20px;border:0;border-radius:14px;background:var(--a);color:var(--a-ink);font:600 14px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer">Voir les fiches de conduite</button>
  </div>
</div>`;
    root
      .querySelector("#jf-empty-cta")
      ?.addEventListener("click", () => navigate("#/revision-conduite"));
    return;
  }
  mountPremiumQuiz(root, {
    questions,
    title: "Trouve la faute",
    onExit: () => navigate("#/revision-conduite"),
  });
}
