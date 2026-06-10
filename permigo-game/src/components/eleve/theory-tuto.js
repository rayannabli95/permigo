// ═══════════════════════════════════════════════════════════════
// Tuto Ligue théorique — 3 slides. 1er passage sur l'onglet Théorie,
// re-consultable via le « ? » du hero. Textes DÉRIVÉS du barème
// (theory-league.js) — aucun chiffre en dur ici.
// ═══════════════════════════════════════════════════════════════
import { createTuto } from "@/components/eleve/intro-tuto.js";
import { navigate } from "@/router.js";
import { THEORY_PTS, THEORY_LEAGUES } from "@/utils/theory-league.js";

const TOP_LEAGUE = THEORY_LEAGUES[THEORY_LEAGUES.length - 1];

const SLIDES = [
  {
    mascot: "/skins/mascot-hello.png",
    extra: "/skins/avatars/permigo-badge-icon.png",
    title: "La ligue théorique",
    text: "Ici, tu progresses seul, chez toi, à ton rythme — sans attendre ta prochaine leçon.",
  },
  {
    mascot: "/skins/mascot-point.png",
    extra: "/skins/drapeau.png",
    title: "Comment monter ?",
    text: `Réussis le quiz d'une compétence (+${THEORY_PTS.quiz} pt) et les parcours d'examen (+${THEORY_PTS.exam} pts). Chaque compétence maîtrisée compte une seule fois.`,
  },
  {
    mascot: "/skins/mascot-celebrate.png",
    extra: "/skins/couronne.png",
    title: "Vise le haut",
    text: `Atteins « ${TOP_LEAGUE.name} » : tu sauras que tu es prêt pour l'examen — et ton moniteur le verra aussi.`,
  },
];

const tuto = createTuto({
  storageKey: "permigo-theory-tuto-v1",
  slides: SLIDES,
  ariaLabel: "Présentation de la ligue théorique",
  trackPrefix: "theory_tuto",
  lastCta: "Faire un quiz",
  onDone: () => navigate("/parcours"),
});

export function showTheoryTuto() {
  tuto.show();
}

// À appeler à l'arrivée sur l'onglet Théorie : affiche le tuto si jamais vu.
export function maybeShowTheoryTuto() {
  tuto.maybeShow();
}
