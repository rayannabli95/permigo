// ═══════════════════════════════════════════════════════════════
// Tuto parcours élève — carrousel d'intro (4 slides) guidé par la mascotte.
// S'affiche au 1er passage sur le parcours (localStorage), re-consultable
// via le bouton « ? ». Implémenté via le carrousel générique intro-tuto.
// ═══════════════════════════════════════════════════════════════
import { createTuto } from "@/components/eleve/intro-tuto.js";

const SLIDES = [
  {
    mascot: "/skins/mascot-hello.png",
    extra: "/skins/avatars/permigo-badge-icon.png",
    title: "Ta route vers le permis",
    text: "Un cours clair, étape par étape.",
  },
  {
    mascot: "/skins/mascot-point.png",
    extra: "/skins/drapeau.png",
    title: "Valide avec ton moniteur",
    text: "Chaque étape = une compétence. Ton moniteur confirme en séance.",
  },
  {
    mascot: "/skins/mascot-celebrate.png",
    extra: "/skins/chest-open.png",
    title: "Gagne des coffres",
    text: "Avance et débloque des récompenses pour personnaliser ton profil.",
  },
];

const tuto = createTuto({
  storageKey: "permigo-parcours-tuto-v1",
  slides: SLIDES,
  ariaLabel: "Ton parcours",
  trackPrefix: "parcours_tuto",
});

export function showParcoursTuto() {
  tuto.show();
}

// À appeler au montage du parcours : affiche le tuto si jamais vu.
export function maybeShowParcoursTuto() {
  tuto.maybeShow();
}
