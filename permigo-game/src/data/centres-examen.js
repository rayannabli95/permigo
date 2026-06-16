// ═══════════════════════════════════════════════════════════════
// Fiches « centre d'examen » — contenu éditorial PermiGo
//
// Module de données statique (même esprit que worlds.js / remc.js).
// Une entrée = un centre d'examen du permis B. Ajouter un centre =
// ajouter un objet dans CENTRES_EXAMEN, rien d'autre à toucher.
//
// ⚠️ Contenu 100 % ORIGINAL PermiGo. On s'appuie sur des FAITS publics
//    (adresse, accès transports, difficulté observée, pièges réels du
//    secteur) réécrits dans la voix PermiGo. Aucune copie d'un tiers.
//
// 💎 Destiné à devenir un module PREMIUM (fiches centre payantes).
//    Le verrou vit dans la page : CENTRES_PREMIUM_LOCKED (centre-examen.js).
//    Tant qu'il est à `false`, les fiches sont gratuites — pour donner envie.
// ═══════════════════════════════════════════════════════════════

export const CENTRES_EXAMEN = [
  {
    slug: "cergy",
    nom: "Cergy",
    departement: "Val-d'Oise",
    deptNum: "95",
    adresse: "2 rue des Gémeaux, 95800 Cergy",
    mapsQuery: "Centre d'examen permis 2 rue des Gémeaux 95800 Cergy",
    difficulte: 3, // sur 5
    difficulteLabel: "Intermédiaire",

    resume:
      "Cergy a la réputation d'un examen « piège mais juste » : pas de difficulté extrême, " +
      "mais une exigence de régularité du début à la fin. Les examinateurs y déroulent des " +
      "parcours fluides où la moindre baisse d'attention se voit tout de suite. La bonne " +
      "nouvelle : c'est un centre où la préparation paie. Connaître les zones clés te met " +
      "une vraie longueur d'avance le jour J.",

    acces: [
      {
        ico: "map",
        texte: "RER A — arrêt Cergy-Préfecture, puis quelques minutes à pied.",
      },
      {
        ico: "compass",
        texte: "Transilien ligne L — gare de Cergy, correspondances bus.",
      },
      {
        ico: "car",
        texte:
          "En voiture : axes A15 / N184, parking dans le quartier des Gémeaux.",
      },
    ],

    pieges: [
      {
        ico: "refresh-cw",
        titre: "Le festival de giratoires",
        texte:
          "Compte 6 à 8 ronds-points sur un parcours type. Ce n'est pas un giratoire isolé qui " +
          "fatigue, c'est l'enchaînement : clignotant à l'approche, contrôle, sortie propre, on " +
          "recommence. Travaille l'automatisme jusqu'à ce qu'il devienne réflexe — l'examinateur " +
          "juge ta constance, pas un coup de chance.",
      },
      {
        ico: "eye",
        titre: "Cyclistes partout",
        texte:
          "Cergy est pensée pour le vélo : pistes cyclables et cyclistes à chaque coin. Chaque " +
          "tourne-à-droite, chaque insertion, chaque ouverture de portière imaginée = contrôle de " +
          "l'angle mort obligatoire. C'est la cause d'échec n°1 ici : oublier le coup d'œil cycliste.",
      },
      {
        ico: "alert-triangle",
        titre: "Voies larges, vitesse traître",
        texte:
          "L'infrastructure est moderne et roulante. Le piège est sournois : sur ces grands axes " +
          "fluides, on dépasse la limite sans s'en rendre compte. Garde un œil régulier sur les " +
          "panneaux et ton compteur — une survitesse, même légère, est éliminatoire.",
      },
    ],

    conseils: [
      "Repère le quartier des Gémeaux avant le jour J : les premières minutes seront beaucoup moins stressantes en terrain connu.",
      "Sur giratoire : clignotant à droite seulement quand tu prends la sortie qui suit — jamais avant, sinon tu envoies un mauvais message.",
      "À chaque changement de direction, verbalise tes contrôles dans ta tête : ça force le regard et ça rassure l'examinateur.",
      "Vise une conduite « lisse » : anticipation, allure stable. À Cergy, la régularité bat la performance.",
    ],

    faq: [
      {
        q: "Cergy, c'est un centre difficile ?",
        r: "Plutôt intermédiaire (3/5). Rien d'insurmontable, mais il ne pardonne pas le manque d'attention : giratoires et cyclistes sont les juges de paix.",
      },
      {
        q: "Je peux connaître le parcours exact à l'avance ?",
        r: "Non — l'examinateur choisit son itinéraire le jour même parmi plusieurs. Mais les zones et les pièges reviennent toujours : c'est exactement ce qu'on te prépare ici.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "L'angle mort cycliste oublié, suivi des erreurs de giratoire (sortie ou clignotant mal placé). Deux réflexes à blinder avant de passer.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "L'épreuve pratique du permis B dure environ 32 minutes, dont à peu près 25 minutes de conduite effective. Arrive 15 min en avance pour te poser.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Pas de bachotage intensif. Sommeil, un parcours mental des pièges de Cergy, et confiance : tu as bossé, le jour J c'est juste de la mise en application.",
      },
    ],
  },
];

// Renvoie la fiche d'un centre par son slug, ou null si inconnu.
export function getCentre(slug) {
  return CENTRES_EXAMEN.find((c) => c.slug === slug) || null;
}

// Liste légère pour le sélecteur (slug + nom + département + difficulté).
export function listCentres() {
  return CENTRES_EXAMEN.map(
    ({ slug, nom, departement, deptNum, difficulte }) => ({
      slug,
      nom,
      departement,
      deptNum,
      difficulte,
    }),
  );
}
