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
    title: "Bienvenue sur ton parcours !",
    text: "Voici ta carte d'apprentissage du permis. Suis la route, étape par étape.",
  },
  {
    mascot: "/skins/mascot-point.png",
    extra: "/skins/drapeau.png",
    title: "Suis tes compétences",
    text: "Chaque étape de la carte = une compétence REMC à valider avec ton moniteur.",
  },
  {
    mascot: "/skins/mascot-celebrate.png",
    extra: "/skins/chest-open.png",
    title: "Débloque des récompenses",
    text: "Avance pour gagner des coffres, des skins de voiture et personnaliser ton profil.",
  },
  {
    mascot: "/skins/mascot-celebrate.png",
    extra: "/skins/couronne.png",
    title: "Grimpe dans la ligue",
    text: "Mesure-toi aux autres élèves de ton auto-école et vise le haut du classement.",
  },
];

const tuto = createTuto({
  storageKey: "permigo-parcours-tuto-v1",
  slides: SLIDES,
  ariaLabel: "Présentation du parcours",
  trackPrefix: "parcours_tuto",
});

export function showParcoursTuto() {
  tuto.show();
}

// À appeler au montage du parcours : affiche le tuto si jamais vu.
export function maybeShowParcoursTuto() {
  tuto.maybeShow();
}
