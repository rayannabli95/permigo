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
    navigate("#/revision-conduite");
    return;
  }
  mountPremiumQuiz(root, {
    questions,
    title: "Trouve la faute",
    onExit: () => navigate("#/revision-conduite"),
  });
}
