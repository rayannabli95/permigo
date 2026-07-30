// Métadonnées légères pour les coques qui n'ont pas besoin du contenu complet
// des fiches/situations. Les données pédagogiques restent dans leurs JSON.
export const FICHE_META = [
  { code: "C1a", titre: "Prendre en main le poste de conduite" },
  { code: "C1b", titre: "Régler son poste de conduite" },
  { code: "C1c", titre: "Tenir le volant et tenir sa trajectoire" },
  { code: "C1d", titre: "Démarrer et s'arrêter en douceur" },
  { code: "C1e", titre: "Doser l'accélérateur et le frein" },
  { code: "C1f", titre: "Changer de vitesse au bon moment" },
  {
    code: "C1g",
    titre: "Les vérifications avant de rouler (tour de voiture)",
  },
  {
    code: "C1h",
    titre: "Réussir les manœuvres-test (créneau, demi-tour, stationnement)",
  },
  { code: "C1i", titre: "Enchaîner les manœuvres en autonomie" },
  { code: "C2a", titre: "Lire la route avec tes yeux" },
  { code: "C2b", titre: "Régler ta vitesse sur l'environnement" },
  { code: "C2c", titre: "Te placer au bon endroit sur la route" },
  { code: "C2d", titre: "Négocier un virage" },
  { code: "C2e", titre: "Croiser et dépasser" },
  { code: "C2f", titre: "Intersections et ronds-points" },
  { code: "C2g", titre: "Communiquer avec les autres usagers" },
  { code: "C2h", titre: "Conduire seul en ville (synthèse)" },
  { code: "C3a", titre: "Bien voir et bien être vu la nuit" },
  {
    code: "C3b",
    titre: "Adapter ta conduite à la pluie, la neige, le brouillard",
  },
  { code: "C3c", titre: "Garder le contrôle quand ça glisse" },
  { code: "C3d", titre: "Freinage d'urgence & adhérence (l'ABS)" },
  {
    code: "C3e",
    titre: "Voie rapide & autoroute : entrer, rouler, sortir",
  },
  { code: "C3f", titre: "Tunnels, ponts & zones spécifiques" },
  {
    code: "C3g",
    titre: "Ville dense : partager la route avec piétons, vélos et bus",
  },
  { code: "C4a", titre: "Préparer son trajet avant de tourner la clé" },
  {
    code: "C4b",
    titre: "Suivre un itinéraire sans lâcher la route des yeux",
  },
  {
    code: "C4c",
    titre: "Conduire souple pour brûler moins de carburant (éco-conduite)",
  },
  { code: "C4d", titre: "Anticiper le danger et rester calme au volant" },
  { code: "C4e", titre: "Partager la route avec les plus fragiles" },
  { code: "C4f", titre: "Aborder l'examen pratique sans paniquer" },
  {
    code: "C4g",
    titre: "Bien démarrer en jeune permis (période probatoire)",
  },
].map((fiche) => ({ ...fiche, monde: Number(fiche.code[1]) }));

export const MONDES_CONDUITE = [
  { n: 1, nom: "Maniement du véhicule", sous: "Prendre en main la voiture" },
  { n: 2, nom: "Circulation", sous: "Rouler en conditions normales" },
  {
    n: 3,
    nom: "Conditions difficiles",
    sous: "Nuit, météo, partage de la route",
  },
  { n: 4, nom: "Conduite autonome", sous: "Seul, sûr, économique" },
];

export const FICHE_CODES = FICHE_META.map((fiche) => fiche.code);
export const FICHE_TOTAL = FICHE_META.length;
export const SITUATION_TOTAL = 71;

export function getFicheMeta(code) {
  return FICHE_META.find((fiche) => fiche.code === code) || null;
}

export function fichesMetaByMonde(n) {
  return FICHE_META.filter((fiche) => fiche.monde === n);
}
