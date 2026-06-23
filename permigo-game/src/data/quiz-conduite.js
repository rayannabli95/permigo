// ═══════════════════════════════════════════════════════════════
// Questions QCM de CONDUITE (alignées sur les compétences REMC).
// Générées depuis les fiches (src/data/fiches/monde-*.quiz.json).
// Consommé par le composant premium-quiz. Pas de DB.
// Chaque entrée : { code, q, options[3], correct (index), explication }
// ═══════════════════════════════════════════════════════════════
import monde1 from "./fiches/monde-1.quiz.json";
import monde2 from "./fiches/monde-2.quiz.json";
import monde3 from "./fiches/monde-3.quiz.json";
import monde4 from "./fiches/monde-4.quiz.json";
import jeuFaute from "./jeu-faute.json";

export const QUIZ_CONDUITE = [...monde1, ...monde2, ...monde3, ...monde4];

export function quizByCode(code) {
  return QUIZ_CONDUITE.filter((q) => q.code === code);
}

// Jeu « Trouve la faute » : mappe les scénarios vers le format du quizz premium
// (la « bonne réponse » = l'action qui est la faute éliminatoire).
export function jeuFauteSession(n = 8) {
  return [...jeuFaute]
    .sort(() => Math.random() - 0.5)
    .slice(0, n)
    .map((x) => ({
      q: x.scene,
      options: x.options,
      correct: x.faute_index,
      explication: x.explication,
    }));
}
