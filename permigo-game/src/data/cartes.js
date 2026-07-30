// ═══════════════════════════════════════════════════════════════
// Cartes de compétence — collection « Monument Valley » de l'élève
//
// 31 cartes illustrées (style low-poly Monument Valley), une par
// sous-compétence REMC. On dérive la liste directement de `remc.js`
// pour garder UNE seule source de vérité : chaque carte reprend le
// libellé et le monde de sa compétence, l'image vit dans
// `public/cartes/<compId minuscule>.webp`.
//
// Une carte se DÉBLOQUE quand l'élève certifie la compétence
// correspondante (cf. valider-seul.js → certify()).
// ═══════════════════════════════════════════════════════════════
import { REMC } from "@/data/remc.js";

// Palette d'ambiance par monde — sert au halo/dos de carte verrouillée
// (aligné sur les univers REMC : C1 or, C2 vert-bleu, C3 violet nuit, C4 or).
const WORLD_TINT = {
  C1: "#f0a93f",
  C2: "#22c55e",
  C3: "#8b5cf6",
  C4: "#eab308",
};

// Rareté par monde : plus on avance dans le parcours, plus la carte est
// rare et désirable (cadre + reflet plus intenses). C1 commune → C4 légendaire.
const WORLD_RARITY = {
  C1: { key: "commune", label: "Commune", color: "#9fb0c3" },
  C2: { key: "rare", label: "Rare", color: "#3ba3f0" },
  C3: { key: "epique", label: "Épique", color: "#b06bff" },
  C4: { key: "legendaire", label: "Légendaire", color: "#ffcf5a" },
};

/**
 * @typedef {{
 *   id: string,        // compId, ex "C1a"
 *   n: string,         // nom de la compétence
 *   img: string,       // chemin de l'illustration
 *   cat: string,       // "C1".."C4"
 *   catName: string,   // "Maîtrise du véhicule"
 *   tname: string,     // nom ludique du monde ("Premiers Tours de Roues")
 *   tint: string,      // couleur d'ambiance du monde
 *   idx: number        // position 1..31 dans la collection
 * }} Carte
 */

/** @type {Carte[]} — ordonnées C1a → C4g (1 à 31). */
export const CARTES = REMC.flatMap((cat) =>
  cat.subs.map((s) => ({
    id: s.c,
    n: s.n,
    img: `/cartes/${s.c.toLowerCase()}.webp`,
    cat: cat.id,
    catName: cat.name,
    tname: cat.tname,
    tint: WORLD_TINT[cat.id] || "#f0a93f",
    rarity: WORLD_RARITY[cat.id] || WORLD_RARITY.C1,
  })),
).map((c, i) => ({ ...c, idx: i + 1 }));

/** Nombre total de cartes (doit valoir 31). */
export const CARTES_TOTAL = CARTES.length;

/** Retrouve une carte par l'ID de sa compétence. */
export function findCarte(compId) {
  return CARTES.find((c) => c.id === compId);
}
