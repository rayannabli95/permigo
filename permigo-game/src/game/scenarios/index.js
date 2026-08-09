// Le catalogue des situations. Une situation, c'est CE FICHIER et rien
// d'autre : le moteur (src/game/runner.js) sait déjà monter un carrefour,
// y faire circuler du trafic et observer ce que l'élève fait.
//
// L'ordre est l'ordre de jeu : on ouvre sur la priorité à droite, qui est la
// règle la plus mal comprise, et on termine sur le cycliste, qui demande de
// tenir un écart tout en roulant.

import prioriteDroite from "./priorite-droite.js";
import stop from "./stop.js";
import cedeLePassage from "./cede-le-passage.js";
import feuRouge from "./feu-rouge.js";
import pieton from "./pieton.js";
import cycliste from "./cycliste.js";

export const SITUATIONS = [
  prioriteDroite,
  stop,
  cedeLePassage,
  feuRouge,
  pieton,
  cycliste,
];

export const parId = (id) =>
  SITUATIONS.find((s) => s.id === id) || SITUATIONS[0];

// Les textes de fin communs à toutes les situations. Une situation ne
// redéfinit que ce qui lui est PROPRE : sans ce socle, chaque fichier
// recopiait les mêmes six phrases et elles finissaient par diverger.
export const RETOURS_COMMUNS = {
  collision: "Le choc. Il fallait laisser passer.",
  trop_vite:
    "Tu arrives trop vite. Sans visibilité, un carrefour se prend au pas.",
  hors_route: "Tu as quitté la route.",
  trop_long: "Tu es resté sur place. Une fois la voie libre, tu repars.",
  pas_regarde_droite:
    "Tu n'as pas tourné la tête à droite. C'est de là que vient le danger.",
  pas_regarde_gauche:
    "Tu n'as pas tourné la tête à gauche. C'est de là que vient le danger.",
  feu_rouge:
    "Tu es passé au rouge. Le feu orange aussi veut dire stop quand tu peux t'arrêter.",
  pas_cede_pieton: "Un piéton était engagé. Il passe avant toi, toujours.",
  trop_pres:
    "Tu es passé trop près. En ville il faut un mètre, hors agglomération un mètre cinquante.",
  pas_arrete:
    "Tu ne t'es pas arrêté. Au stop, les roues s'arrêtent de tourner.",
  refus_priorite: "Tu es passé devant quelqu'un qui avait la priorité.",
};

// Le titre de la carte de fin, selon ce que le moteur a vu.
export const TITRES_FAUTE = {
  collision: "Tu l'as percuté",
  refus_priorite: "Tu es passé devant",
  pas_cede_pieton: "Tu n'as pas laissé passer le piéton",
  feu_rouge: "Tu es passé au rouge",
  trop_pres: "Tu es passé trop près",
  pas_regarde_droite: "Tu n'as pas regardé à droite",
  pas_regarde_gauche: "Tu n'as pas regardé à gauche",
  trop_vite: "Tu arrives trop vite",
  pas_arrete: "Tu ne t'es pas arrêté",
  trop_long: "Tu es resté sur place",
  hors_route: "Tu as quitté la route",
};
