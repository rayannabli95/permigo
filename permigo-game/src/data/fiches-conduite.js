// ═══════════════════════════════════════════════════════════════
// Données statiques — FICHES DE RÉVISION DE CONDUITE (pas le code).
// Générées depuis docs/fiches-conduite/fiches/*.md (enrichies du vécu
// de vrais moniteurs). Décisions de méthode = docs/fiches-conduite/ARBITRAGES.md.
// Pas de Supabase → modifiable sans migration.
// Chaque entrée : { code, titre, monde, competence, resume10s[3], methode[],
//                   pourquoi, erreur, bva|null,
//                   questions[{q,reponse,explication}], sources[] }
// resume10s = « En 10 secondes », 3 lignes écrites À LA MAIN (jamais générées
// depuis le texte : paraphraser une règle de conduite, c'est en inventer une).
// Français uniquement, cf. le bloc de rendu dans revision-conduite.js.
// ═══════════════════════════════════════════════════════════════
import monde1 from "./fiches/monde-1.json";
import monde2 from "./fiches/monde-2.json";
import monde3 from "./fiches/monde-3.json";
import monde4 from "./fiches/monde-4.json";

export const FICHES = [...monde1, ...monde2, ...monde3, ...monde4];

export const MONDES = [
  { n: 1, nom: "Maniement du véhicule", sous: "Prendre en main la voiture" },
  { n: 2, nom: "Circulation", sous: "Rouler en conditions normales" },
  {
    n: 3,
    nom: "Conditions difficiles",
    sous: "Nuit, météo, partage de la route",
  },
  { n: 4, nom: "Conduite autonome", sous: "Seul, sûr, économique" },
];

export function getFiche(code) {
  return FICHES.find((f) => f.code === code) || null;
}

export function fichesByMonde(n) {
  return FICHES.filter((f) => f.monde === n);
}
