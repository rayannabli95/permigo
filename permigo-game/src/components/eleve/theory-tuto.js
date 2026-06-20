// ═══════════════════════════════════════════════════════════════
// Tuto Ligue Révision — 3 slides. 1er passage sur l'onglet Révision,
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
    title: "Révise à ton rythme",
    text: "Sans leçon, sans attente. Quelques questions par jour suffisent.",
  },
  {
    mascot: "/skins/mascot-point.png",
    extra: "/skins/drapeau.png",
    title: "Gagne des points",
    text: `Quiz réussi = ${THEORY_PTS.quiz} pt. Examen blanc = ${THEORY_PTS.exam} pts. Plus tu révises, plus tu montes.`,
  },
  {
    mascot: "/skins/mascot-celebrate.png",
    extra: "/skins/couronne.png",
    title: "Prouve que tu es prêt",
    text: `Atteins « ${TOP_LEAGUE.name} » — ton moniteur le voit en temps réel.`,
  },
];

const tuto = createTuto({
  storageKey: "permigo-theory-tuto-v1",
  slides: SLIDES,
  ariaLabel: "Ligue Révision",
  trackPrefix: "theory_tuto",
  lastCta: "Faire un quiz",
  onDone: () => navigate("/parcours"),
});

export function showTheoryTuto() {
  tuto.show();
}

// À appeler à l'arrivée sur l'onglet Révision : affiche le tuto si jamais vu.
export function maybeShowTheoryTuto() {
  tuto.maybeShow();
}
