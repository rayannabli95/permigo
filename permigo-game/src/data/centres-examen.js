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
    // Tags du pool de questions ciblant les pièges de ce centre
    quizTags: ["rond_point", "cycliste", "vitesse"],

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

  {
    slug: "argenteuil",
    nom: "Argenteuil",
    departement: "Val-d'Oise",
    deptNum: "95",
    adresse: "235 rue d'Epinay, 95100 Argenteuil",
    mapsQuery: "Centre d'examen permis 235 rue d'Epinay 95100 Argenteuil",
    difficulte: 4,
    difficulteLabel: "Difficile",
    quizTags: ["vitesse", "priorite", "cycliste", "manoeuvre"],
    resume:
      "Argenteuil est considéré comme le centre le plus exigeant du Val-d'Oise : tu passes en quelques secondes d'un quartier résidentiel calme à un grand axe à fort trafic, avec des insertions sur voie rapide en prime. L'environnement urbain dense, les comportements imprévisibles des usagers et la diversité des situations de conduite t'imposent une vigilance de tous les instants. Pas de panique : avec un entraînement sérieux sur le secteur, tu transformes cette réputation intimidante en vraie longueur d'avance le jour J.",
    acces: [
      {
        ico: "map",
        texte:
          "Transilien H ou J depuis Paris-Saint-Lazare ou Gare du Nord — descends à Argenteuil, puis bus ou 15 min à pied vers la rue d'Epinay.",
      },
      {
        ico: "compass",
        texte:
          "Tramway T2 — direction Bezons/Pont-de-Bezons, puis bus local vers le centre ou rejoins à pied par les axes principaux.",
      },
      {
        ico: "car",
        texte:
          "En voiture : A15 sortie Argenteuil Centre ou A86, des places de stationnement sont disponibles dans les rues à proximité du centre.",
      },
    ],
    pieges: [
      {
        ico: "zap",
        titre: "Insertions sur voie rapide",
        texte:
          "Le parcours inclut des accès à des axes à 90-110 km/h (A86, bretelles de l'A15). Tu dois anticiper ta prise de vitesse, bien vérifier tes angles morts et t'insérer avec décision. Une hésitation sur ces points coûte cher aux examinateurs.",
      },
      {
        ico: "alert-triangle",
        titre: "Sorties de centre piégeuses",
        texte:
          "Dès les premières dizaines de mètres après le départ, des carrefours à géométrie complexe t'attendent : angles peu conventionnels, visibilité réduite par les véhicules stationnés, piétons et scooters qui surgissent. Beaucoup de candidats sont déjà déstabilisés avant d'avoir vraiment commencé.",
      },
      {
        ico: "users",
        titre: "Usagers de tous types, partout",
        texte:
          "Cyclistes, livreurs à vélo-cargo, piétons qui traversent hors passage clouté, camions sur les grands boulevards : la diversité des usagers est maximale sur ce parcours. Tu dois scanner ton environnement en continu et ne jamais supposer que la route devant toi est libre.",
      },
    ],
    conseils: [
      "Fais au moins une dizaine d'heures de conduite spécifiquement autour de la rue d'Epinay et des axes voisins (Bezons, Sannois, Colombes) : connaître les carrefours difficiles à froid te sauvera du stress le jour J.",
      "Entraîne-toi aux insertions sur voie rapide avec ton moniteur — accélération franche, regard miroirs-angle mort, prise de position sans flottement. C'est la compétence qui fait la différence sur ce centre.",
      "Soigne le scanning actif : guette les cyclistes sur les côtés, vérifie deux fois avant de t'engager dans un carrefour mal dégagé, et annonce tes vérifications à voix basse si ça t'aide à structurer.",
      "La veille, repose-toi et relis mentalement les grandes étapes d'un examen (départ, voie rapide, retour centre-ville, arrivée). Ne tente pas de « mémoriser un parcours précis » — concentre-toi sur tes automatismes de conduite.",
    ],
    faq: [
      {
        q: "Argenteuil, c'est un centre difficile ?",
        r: "Oui, c'est objectivement le plus exigeant du Val-d'Oise. La combinaison d'un tissu urbain dense, d'insertions sur voie rapide et de carrefours difficiles dès la sortie du centre en fait un endroit où la moindre fragilité technique se voit. Mais difficile ne veut pas dire inaccessible : des candidats bien préparés, qui ont roulé sur le secteur, réussissent chaque session.",
      },
      {
        q: "Je peux connaître le parcours exact à l'avance ?",
        r: "Non — les examens sont variés et l'inspecteur dirige en temps réel. Ce qui compte, c'est de maîtriser les types de situations du secteur (voie rapide, carrefours complexes, zones résidentielles) plutôt que de tenter d'apprendre un trajet par cœur.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "La gestion des insertions sur voie rapide et les manquements à l'observation aux carrefours difficiles situés juste après le départ. Un oubli d'angle mort ou une hésitation à l'insertion coûtent souvent l'examen à des candidats par ailleurs bien préparés.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "Environ 30 à 35 minutes de conduite effective, auxquelles s'ajoutent les vérifications du véhicule et les formalités administratives avant et après. Prévois d'être disponible sur un créneau d'une heure.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Tu coupes les révisions théoriques, tu vérifies l'heure et le lieu, et tu te reposes vraiment. Le jour de l'examen, arrive avec au moins 15 minutes d'avance pour souffler, t'installer et ne pas partir stressé avant même d'avoir démarré.",
      },
    ],
  },

  {
    slug: "bobigny",
    nom: "Bobigny",
    departement: "Seine-Saint-Denis",
    deptNum: "93",
    adresse: "320 avenue Paul Vaillant Couturier, 93000 Bobigny",
    mapsQuery:
      "Centre d'examen permis 320 avenue Paul Vaillant Couturier 93000 Bobigny",
    difficulte: 5,
    difficulteLabel: "Très difficile",
    quizTags: ["vitesse", "priorite", "manoeuvre"],
    resume:
      "Bobigny fait partie des centres les plus exigeants d'Île-de-France. Entre les boulevards à fort trafic, les insertions sur voies rapides type A86 ou A3 et la densité urbaine permanente du 93, l'examen ici ne laisse aucune place à l'improvisation. Si tu maîtrises Bobigny, tu peux conduire n'importe où — alors autant en faire une force et arriver le jour J vraiment prêt.",
    acces: [
      {
        ico: "map",
        texte:
          "Métro ligne 5 — stations Bobigny-Pablo Picasso ou Bobigny-Pantin-Raymond Queneau, à quelques minutes à pied.",
      },
      {
        ico: "compass",
        texte:
          "Tramway T1 — terminus Bobigny-Pablo Picasso, correspondances bus RATP disponibles.",
      },
      {
        ico: "car",
        texte:
          "En voiture : axes A86 / A3, stationnement avenue Paul Vaillant Couturier et rues adjacentes.",
      },
    ],
    pieges: [
      {
        ico: "zap",
        titre: "Les voies rapides au cœur du parcours",
        texte:
          "L'A86 et l'A3 peuvent faire partie du trajet d'examen. S'insérer à bonne vitesse, gérer les dépassements et anticiper les sorties sur ces axes à 110 km/h, c'est la compétence qui fait la différence. Une hésitation à l'insertion et tu perds des points décisifs.",
      },
      {
        ico: "users",
        titre: "Un trafic dense et imprévisible",
        texte:
          "Bobigny, c'est la Seine-Saint-Denis : flux de véhicules constant, usagers aux comportements variés, deux-roues qui se faufilent, piétons qui traversent hors passage. L'inspecteur ne sanctionne pas le trafic — il sanctionne ton manque d'anticipation face à lui.",
      },
      {
        ico: "alert-triangle",
        titre: "Des vitesses qui changent vite",
        texte:
          "Le parcours enchaîne zones à 30, voiries urbaines à 50 et axes rapides à 70 ou plus. Les panneaux se succèdent rapidement et il est facile de rester dans la vitesse précédente par inattention. Regarde les limitations actives, pas celles dont tu te souviens.",
      },
    ],
    conseils: [
      "Entraîne-toi spécifiquement sur l'A86 et l'A3 avec ton moniteur avant l'examen : l'insertion sur voie rapide doit devenir un automatisme, pas une source de stress.",
      "Répète le trajet autour du centre pendant tes heures de conduite accompagnée ou avec ton auto-école — les boulevards et carrefours de l'avenue Paul Vaillant Couturier reviennent souvent.",
      "Surveille les panneaux de limitation en continu : les passages de 50 à 30 km/h et retour sont fréquents dans les zones résidentielles et aux abords des établissements scolaires.",
      "Anticipe loin devant toi — dans ce secteur urbain dense, ce qui change de niveau c'est la capacité à lire la situation 3 à 4 secondes avant qu'elle n'arrive.",
    ],
    faq: [
      {
        q: "Bobigny, c'est un centre difficile ?",
        r: "Oui, c'est l'un des centres les plus techniques d'Île-de-France. La densité urbaine, la présence de voies rapides dans le rayon d'examen et l'intensité du trafic en font un parcours noté 5/5 en difficulté. Ça ne veut pas dire que c'est impossible — ça veut dire qu'il faut arriver vraiment préparé.",
      },
      {
        q: "Je peux connaître le parcours exact à l'avance ?",
        r: "Non — l'inspecteur choisit les directions en temps réel, et les itinéraires varient d'une session à l'autre. Ce qui compte, c'est de connaître le secteur dans son ensemble et de réagir juste à chaque situation, quelle que soit la rue empruntée.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "Le défaut de maîtrise sur les voies rapides et les insertions : vitesse insuffisante à l'insertion, manque de vérification des angles morts, hésitation à la bretelle. Dans un secteur où l'A86 peut s'inviter dans le trajet, cette compétence doit être solide avant le jour J.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "Environ 32 minutes de conduite effective, auxquelles s'ajoutent les vérifications du véhicule et les échanges avec l'inspecteur. Prévois d'être sur place au moins 15 minutes avant l'heure de convocation.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Pas de marathon de révisions. Relis mentalement deux ou trois points clés (limitations, insertions, priorités), assure-toi de connaître l'adresse exacte du centre et prévois ton trajet en transports ou en covoiturage. Une tête reposée vaut mieux que dix heures de stress.",
      },
    ],
  },

  {
    slug: "creteil",
    nom: "Créteil",
    departement: "Val-de-Marne",
    deptNum: "94",
    adresse: "12 rue des Archives, 94000 Créteil",
    mapsQuery: "Centre d'examen permis 12 rue des Archives 94000 Créteil",
    difficulte: 4,
    difficulteLabel: "Difficile",
    quizTags: ["vitesse", "rond_point", "priorite"],
    resume:
      "Créteil t'emmène sur un terrain varié et exigeant : tu vas enchaîner les quartiers résidentiels denses, les grands axes à fort trafic, puis des insertions sur voies rapides à 90 km/h (A4, A86). Les giratoires sont omniprésents et la circulation hachée te demande de rester concentré de la première à la dernière seconde. Pas de panique — avec une bonne préparation et des automatismes solides, c'est tout à fait gérable. C'est le type de centre qui valorise les candidats vraiment à l'aise en conditions réelles.",
    acces: [
      {
        ico: "map",
        texte:
          "Métro ligne 8 — stations Créteil-Préfecture ou Créteil-Université, à moins de 10 minutes à pied du centre.",
      },
      {
        ico: "compass",
        texte:
          "Tramway T9 et bus TVM desservent le secteur ; plusieurs lignes RATP s'arrêtent à proximité directe.",
      },
      {
        ico: "car",
        texte:
          "En voiture : accès par la N19 ou la N406, stationnement possible dans les rues adjacentes au centre.",
      },
    ],
    pieges: [
      {
        ico: "activity",
        titre: "Insertions sur voie rapide",
        texte:
          "Le parcours peut inclure des bretelles d'accès vers l'A4 ou l'A86 où la vitesse monte à 90 km/h. Le saut de régime entre zone urbaine à 50 et voie rapide est abrupt. Anticipe l'accélération dès la bretelle et assure-toi d'avoir une case franche avant de t'insérer — l'examinateur surveille tes angles morts.",
      },
      {
        ico: "refresh-cw",
        titre: "Giratoires en série",
        texte:
          "Créteil multiplie les grands giratoires, parfois à plusieurs voies. L'erreur classique : s'engager sans regarder les véhicules déjà sur l'anneau ou couper la trajectoire en sortie. Prends le temps de repérer ta sortie avant d'entrer et serre ta voie jusqu'au bout.",
      },
      {
        ico: "eye",
        titre: "Visibilité réduite aux intersections",
        texte:
          "Dans les zones commerçantes et industrielles, le marquage au sol est souvent usé et la priorité moins évidente. Les camions en stationnement créent des angles morts constants. Réduis ta vitesse avant chaque carrefour ambigu et avance progressivement pour te faire voir — et pour voir.",
      },
    ],
    conseils: [
      "Entraîne-toi spécifiquement à l'insertion sur voie rapide avec ton moniteur avant le jour J — c'est le point technique le plus stressant du parcours.",
      "Repasse la règle des giratoires multi-voies : qui cède le passage, comment changer de voie sur l'anneau, comment signaler ta sortie. Beaucoup de fautes viennent de là.",
      "La veille, repère l'itinéraire pour rejoindre le centre en transports — arriver en retard ou stressé plombe ta concentration dès le départ.",
      "Pendant l'examen, verbalise mentalement chaque vérification (rétros, angles morts, clignotant) : ça t'ancre dans le moment présent et réduit les oublis sous pression.",
    ],
    faq: [
      {
        q: "Créteil, c'est un centre difficile ?",
        r: "Oui, on le classe parmi les centres difficiles d'Île-de-France. La diversité des situations — voies rapides, giratoires complexes, trafic dense — exige un niveau solide et des automatismes bien installés. Mais ça ne veut pas dire que c'est une loterie : les candidats bien préparés passent. Discute avec ton moniteur du nombre d'heures qu'il te recommande avant de te présenter.",
      },
      {
        q: "Je peux connaître le parcours exact à l'avance ?",
        r: "Non — les examinateurs disposent de plusieurs parcours et les varient. Ce que tu peux faire, c'est rouler avec ton moniteur dans le secteur autour du centre pour t'habituer à l'ambiance, aux types de voies et aux giratoires récurrents. La familiarité avec la zone vaut bien mieux que de mémoriser un tracé.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "La gestion des insertions sur voie rapide et les erreurs aux giratoires multi-voies arrivent en tête. Mais derrière, c'est souvent le stress qui amplifie tout : un angle mort oublié ici, un stop mal marqué là. Travailler ses automatismes en conditions réelles — pas seulement en circulation douce — fait toute la différence.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "Environ 35 minutes de conduite effective sur le parcours, auxquelles s'ajoutent les formalités d'accueil et le bilan de fin d'examen. Prévois d'être disponible au moins une heure et demie pour l'ensemble de la session.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Arrête les révisions intenses — ton cerveau a besoin de souffler. Prépare tes documents (convocation, pièce d'identité) la veille au soir pour ne pas chercher au dernier moment. Dors suffisamment, mange normalement le matin et arrive sur place avec quelques minutes d'avance pour te poser avant d'embarquer dans la voiture.",
      },
    ],
  },

  {
    slug: "nanterre",
    nom: "Nanterre",
    departement: "Hauts-de-Seine",
    deptNum: "92",
    adresse: "27-29 avenue Jules Quentin, 92000 Nanterre",
    mapsQuery:
      "Centre d'examen permis 27-29 avenue Jules Quentin 92000 Nanterre",
    difficulte: 4,
    difficulteLabel: "Difficile",
    quizTags: ["vitesse", "priorite", "cycliste"],
    resume:
      "Nanterre, c'est un examen qui ne te laisse pas le temps de souffler. Tu passes d'un centre-ville animé et serré à des axes rapides comme l'A86 ou l'A14, en bordure directe du quartier d'affaires de La Défense. Le trafic est dense, les poids lourds sont présents sur la rocade, et les limites de vitesse changent sans toujours être annoncées clairement. Un centre qui récompense vraiment ceux qui ont roulé sur place avant le jour J.",
    acces: [
      {
        ico: "map",
        texte:
          "RER A jusqu'à Nanterre-Préfecture ou Nanterre-Université, puis quelques minutes à pied. Paris-La Défense est à moins de 15 minutes.",
      },
      {
        ico: "compass",
        texte:
          "Transilien L depuis Saint-Lazare ou La Défense, arrêt Nanterre-Ville. Plusieurs lignes de bus RATP desservent le secteur depuis Rueil-Malmaison et Courbevoie.",
      },
      {
        ico: "car",
        texte:
          "En voiture, prévoir de la marge : le stationnement aux abords de l'avenue Jules Quentin est limité. Arriver au moins 20 minutes avant l'heure de convocation.",
      },
    ],
    pieges: [
      {
        ico: "zap",
        titre: "L'A86 sans filet",
        texte:
          "L'insertion sur l'A86 fait partie des situations attendues à Nanterre. Les bretelles sont courtes, les poids lourds fréquents et la vitesse monte vite à 90 km/h. Tu dois évaluer d'un coup d'œil, accélérer franchement et t'insérer sans hésiter. Une insertion molle ou une correction de trajectoire trop brutale est éliminatoire.",
      },
      {
        ico: "alert-triangle",
        titre: "Zones sans panneau de sortie d'agglomération",
        texte:
          "À Nanterre, plusieurs axes changent de limitation de vitesse sans que le panneau de fin d'agglomération soit immédiatement visible. Beaucoup de candidats maintiennent les 50 km/h alors que la voie autorise 70 ou 90. Connaître la géographie du secteur te permet d'anticiper ces transitions plutôt que d'attendre un panneau qui n'est pas là.",
      },
      {
        ico: "users",
        titre: "Centre-ville saturé",
        texte:
          "Entre les bus qui s'arrêtent brusquement, les cyclistes sur les pistes partagées et les piétons qui débordent aux carrefours, le cœur de Nanterre demande une vigilance à 360°. L'inspecteur observe comment tu gères les conflits de priorité dans un flux dense, pas seulement si tu t'arrêtes au feu rouge.",
      },
    ],
    conseils: [
      "Fais au moins 3 à 4 heures de conduite spécifiquement sur le secteur de Nanterre avant l'examen : l'A86, l'avenue Jules Quentin, et le tour du centre-ville ne s'improvisent pas.",
      "Entraîne-toi à l'insertion sur voie rapide sur des bretelles courtes : accélère tôt dans la bretelle, vérifie tes angles morts dès le début, et vise un créneau précis sans flotter.",
      "Mémorise les grandes transitions de limitation : où la ville se termine, où l'A86 commence, où la N13 change de gabarit. Ne compte pas sur les panneaux pour te prévenir à temps.",
      "La veille, dors. Pas de révision de parcours jusqu'à minuit. Un candidat reposé gère dix fois mieux les imprévus en circulation dense qu'un candidat stressé qui connaît chaque virage par cœur.",
    ],
    faq: [
      {
        q: "Nanterre, c'est un centre difficile ?",
        r: "Oui, franchement. Nanterre combine trafic urbain dense, passages en voie rapide sur l'A86 et une signalisation de zone parfois absente. C'est un centre qui discrimine vraiment les candidats préparés des autres. Avec un bon entraînement sur place, c'est tout à fait passable — mais il ne pardonne pas l'improvisation.",
      },
      {
        q: "Je peux connaître le parcours exact à l'avance ?",
        r: "Les parcours officiels ne sont pas publiés et l'inspecteur choisit l'itinéraire le jour J. En revanche, la zone est bien documentée et tu peux identifier les axes les plus souvent empruntés (A86, centre-ville, quartier Mercure) avec ton moniteur. Mieux vaut maîtriser toute la zone que mémoriser un seul trajet.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "Les erreurs sur voie rapide arrivent en tête : insertion hésitante sur l'A86, sous-estimation de la vitesse des autres véhicules, ou maintien d'une allure trop basse après l'insertion. Vient ensuite la mauvaise lecture des limitations de vitesse dans les zones sans signalisation de sortie d'agglomération.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "Environ 32 minutes de conduite effective, auxquelles s'ajoutent les formalités d'accueil et le débriefing. Prévois d'être disponible pendant 1h au total sur le site.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Tu prépares tes documents (convocation, pièce d'identité), tu repasses mentalement les grandes situations du centre (insertion A86, transitions de vitesse, carrefours complexes), et tu te couches tôt. Le jour de l'examen, mange quelque chose de léger avant de partir et arrive sans précipitation.",
      },
    ],
  },

  {
    slug: "trappes",
    nom: "Trappes",
    departement: "Yvelines",
    deptNum: "78",
    adresse: "7 rue Léon Teisserenc de Bort, 78190 Trappes",
    mapsQuery:
      "Centre d'examen permis 7 rue Léon Teisserenc de Bort 78190 Trappes",
    difficulte: 3,
    difficulteLabel: "Intermédiaire",
    quizTags: ["vitesse", "priorite", "rond_point"],
    resume:
      "Trappes, c'est un centre qui te fait vivre plusieurs visages de la route en une seule sortie : zones résidentielles calmes, boulevard urbain, et insertions sur grand axe. Le tout sans te prévenir de l'ordre. La N10 impose des changements de limitation rapides à maîtriser, et les quartiers de Pissaloup et de La Boissière réservent des priorités à droite qui surprennent ceux qui ne les ont pas travaillées. Bien préparé, ce centre est tout à fait accessible.",
    acces: [
      {
        ico: "map",
        texte:
          "Transilien N depuis Paris-Montparnasse, arrêt Trappes (environ 25 min). Le centre est ensuite accessible à pied ou en bus local depuis la gare.",
      },
      {
        ico: "compass",
        texte:
          "Depuis Saint-Quentin-en-Yvelines, prendre un bus du réseau Sqybus en direction de Trappes centre. Le secteur Météo France / Teisserenc de Bort est desservi.",
      },
      {
        ico: "car",
        texte:
          "En voiture, rejoindre Trappes par la N10 ou la D36. Stationnement possible à proximité du site Météo France. Prévois 10 min de marge pour t'installer.",
      },
    ],
    pieges: [
      {
        ico: "activity",
        titre: "La N10 : trois vitesses en un kilomètre",
        texte:
          "Sur la Nationale 10, la limite passe de 50 à 70 puis à 90 km/h avant de redescendre, parfois sur quelques centaines de mètres. Tu dois lire les panneaux en avance et ajuster ta vitesse de façon fluide — ni trop tôt, ni trop tard. L'inspecteur note chaque excès comme chaque conduite hésitante.",
      },
      {
        ico: "eye",
        titre: "Priorités à droite en zone pavillonnaire",
        texte:
          "Les quartiers résidentiels autour de Trappes comportent de nombreuses intersections sans marquage apparent. La règle de priorité à droite s'y applique pleinement. Beaucoup d'élèves partent confiants sur boulevard et relâchent leur vigilance dès qu'ils entrent dans ces rues — c'est là que ça coince.",
      },
      {
        ico: "refresh-cw",
        titre: "Giratoires à plusieurs voies",
        texte:
          "Le parcours inclut des ronds-points où deux voies coexistent à l'intérieur. Il faut choisir sa voie à l'entrée selon la sortie visée, tenir sa trajectoire sans empiéter, et signaler sa sortie. Se tromper de voie à l'intérieur ou forcer un changement de couloir compte comme une faute.",
      },
    ],
    conseils: [
      "Repère la N10 et entraîne-toi à enchaîner les changements de vitesse (50→70→90→50) sans à-coups : c'est un classique du parcours.",
      "Dans les quartiers résidentiels, ralentis systématiquement avant chaque intersection non réglée — ne devine pas, vérifie.",
      "Aux giratoires à deux voies, décide ta sortie AVANT d'entrer et garde ta voie jusqu'au bout. Pas de slalom à l'intérieur.",
      "La veille, dors correctement et arrive au centre 15 min en avance : repérer les lieux te permet de démarrer serein plutôt que stressé.",
    ],
    faq: [
      {
        q: "Trappes, c'est un centre difficile ?",
        r: "Pas particulièrement — on lui attribue une difficulté de 3/5, dans la moyenne des centres d'Île-de-France. Ce qui peut piéger, c'est la diversité du parcours : tu passes d'une zone calme à un axe rapide sans transition annoncée. Si tu as bien travaillé les priorités à droite et les insertions sur grand axe, tu as les clés pour t'en sortir.",
      },
      {
        q: "Je peux connaître le parcours exact à l'avance ?",
        r: "Non, l'inspecteur choisit l'itinéraire le jour J et il varie à chaque passage. Ce que tu peux faire, c'est rouler régulièrement dans le secteur de Trappes pour apprivoiser ses axes principaux, ses giratoires et ses quartiers résidentiels. La familiarité avec les lieux compte autant que la technique.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "Les priorités à droite non respectées dans les zones résidentielles et les mauvaises gestions de vitesse sur la N10 sont les deux erreurs les plus fréquentes. Beaucoup d'élèves perdent en vigilance dès qu'ils quittent une voie principale — or c'est exactement là que l'inspecteur attend une conduite irréprochable.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "Environ 25 minutes de conduite effective, auxquelles s'ajoutent une manœuvre spécifique et deux questions de sécurité (vérifications moteur ou habitacle). Prévois une demi-heure sur place entre l'accueil et la fin du passage.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Évite une grande séance de conduite stressante. Révise mentalement les points clés du centre (vitesses N10, priorités à droite, giratoires), prépare tes documents, et couche-toi à une heure raisonnable. Le jour J, mange quelque chose de léger et arrive en avance : un candidat posé fait moins d'erreurs qu'un candidat qui court.",
      },
    ],
  },

  {
    slug: "massy",
    nom: "Massy",
    departement: "Essonne",
    deptNum: "91",
    adresse: "Quartier Opéra, avenue de France, 91300 Massy",
    mapsQuery:
      "Centre d'examen permis Opéra de Massy avenue de France 91300 Massy",
    difficulte: 3,
    difficulteLabel: "Intermédiaire",
    quizTags: ["priorite", "rond_point", "vitesse"],

    resume:
      "Massy, c'est un examen qui ne te laisse pas le temps de chauffer : dès la sortie du " +
      "centre, dans le quartier Opéra, tu es tout de suite dans le bain. Le secteur mélange " +
      "centre-ville dense, intersections en pagaille et ronds-points à enchaîner — rien " +
      "d'extrême, mais une exigence d'attention de la première à la dernière minute. Classé " +
      "3/5 dans l'Essonne, c'est un centre « juste » : il récompense ceux qui ont roulé le " +
      "secteur et gardé la tête froide. Bien préparé, tu en fais un terrain connu.",

    acces: [
      {
        ico: "map",
        texte:
          "RER B et RER C — gare de Massy-Palaiseau, puis quelques minutes vers le quartier Opéra.",
      },
      {
        ico: "compass",
        texte:
          "Gare de Massy TGV à deux pas, nombreuses lignes de bus desservant l'avenue de France.",
      },
      {
        ico: "car",
        texte:
          "En voiture : accès par l'A10 / la N20, stationnement autour de l'Opéra et du centre commercial.",
      },
    ],

    pieges: [
      {
        ico: "zap",
        titre: "Le départ qui ne pardonne pas",
        texte:
          "Ici, pas d'échauffement : à peine sorti du centre, tu attaques un environnement chargé. " +
          "L'examinateur observe ta capacité à te mettre en conduite immédiatement. Le réflexe à " +
          "avoir : poser ta respiration, balayer du regard et te caler sur l'allure dès les premiers " +
          "mètres, sans précipitation.",
      },
      {
        ico: "alert-triangle",
        titre: "Le festival de stops et d'intersections",
        texte:
          "Le centre-ville de Massy enchaîne les intersections, dont beaucoup de stops. Le piège " +
          "classique : le stop « roulé », marqué à moitié. Arrêt complet, roues immobiles, regard " +
          "à gauche-droite-gauche, puis tu repars. Un stop non marqué, c'est éliminatoire.",
      },
      {
        ico: "refresh-cw",
        titre: "Ronds-points et sens uniques mêlés",
        texte:
          "Le secteur alterne giratoires à lire vite et voies à sens unique. Le risque, c'est de " +
          "se tromper de file ou d'engager un sens interdit sous la pression. Anticipe la " +
          "signalisation, vérifie les flèches au sol et choisis ta voie tôt — la lecture de la route " +
          "prime sur la vitesse.",
      },
    ],

    conseils: [
      "Va rouler le quartier Opéra avant le jour J : connaître le départ enlève l'essentiel du stress des premières minutes.",
      "À chaque stop, exagère ton arrêt : mieux vaut une seconde de trop qu'un arrêt jugé incomplet.",
      "Sur les sens uniques, fie-toi aux flèches au sol et aux panneaux plutôt qu'à ton instinct — le secteur est piégeux.",
      "Garde une allure souple et régulière : à Massy, la constance rassure l'examinateur plus que la performance.",
    ],

    faq: [
      {
        q: "Massy, c'est un centre difficile ?",
        r: "Intermédiaire (3/5). Moins corsé que Villabé, comparable à Évry ou Étampes. Rien d'insurmontable si tu as travaillé le secteur et tes contrôles.",
      },
      {
        q: "Qu'est-ce qui surprend le plus le jour de l'examen ?",
        r: "Le départ : tu es tout de suite dans la circulation dense, sans phase d'échauffement. C'est mental — préparé à ça, tu n'es plus pris de court.",
      },
      {
        q: "Quelle est la cause d'échec n°1 ici ?",
        r: "Les stops bâclés et les erreurs de file (sens unique ou mauvaise sortie de giratoire). Deux réflexes à blinder avant de passer.",
      },
      {
        q: "Combien de temps dure l'épreuve ?",
        r: "Environ 32 minutes, dont à peu près 25 minutes de conduite effective. Arrive 15 min en avance pour te poser au calme.",
      },
    ],
  },

  {
    slug: "evry",
    nom: "Évry-Courcouronnes",
    departement: "Essonne",
    deptNum: "91",
    adresse: "Avenue de la Préfecture, 91000 Évry-Courcouronnes",
    mapsQuery:
      "Centre d'examen permis avenue de la Préfecture 91000 Évry-Courcouronnes",
    difficulte: 3,
    difficulteLabel: "Intermédiaire",
    quizTags: ["priorite", "vitesse", "rond_point"],

    resume:
      "Évry, c'est un examen qui te fait changer de décor en permanence : grandes artères " +
      "modernes d'un côté, ruelles du vieux village de l'autre, et au milieu une insertion sur " +
      "la Nationale 7 qui ne s'improvise pas. Le secteur teste ta capacité à passer d'un " +
      "environnement à l'autre sans perdre tes contrôles. Classé 3/5 dans l'Essonne, il n'a " +
      "rien d'effrayant — mais il faut un regard mobile et de l'anticipation, surtout quand le " +
      "trafic se densifie autour de la gare et des centres commerciaux.",

    acces: [
      {
        ico: "map",
        texte:
          "RER D — gare d'Évry-Courcouronnes Centre, puis quelques minutes vers l'avenue de la Préfecture.",
      },
      {
        ico: "compass",
        texte:
          "Nombreuses lignes de bus desservant le quartier de la préfecture et le centre-ville.",
      },
      {
        ico: "car",
        texte:
          "En voiture : accès par la N7 / l'A6, stationnement autour de la préfecture et des grandes surfaces.",
      },
    ],

    pieges: [
      {
        ico: "alert-triangle",
        titre: "L'insertion sur la Nationale 7",
        texte:
          "C'est le moment clé du parcours : t'insérer proprement sur la N7, à allure soutenue, " +
          "demande un contrôle rétro + angle mort net et une accélération franche pour te fondre " +
          "dans le flux. Trop hésitant, tu gênes ; trop pressé, tu forces. Vise le créneau et engage-toi avec assurance.",
      },
      {
        ico: "eye",
        titre: "Le vieux village",
        texte:
          "Rues plus étroites, priorités à droite, visibilité réduite : le vieux village casse le " +
          "rythme des grands axes. On y baisse la garde après une portion fluide. Reste en alerte " +
          "sur les priorités et adapte ton allure aux rues resserrées.",
      },
      {
        ico: "compass",
        titre: "Zones d'incertitude & signalisation discrète",
        texte:
          "Par endroits, le marquage et les panneaux sont peu visibles : tu dois décider vite sans " +
          "repère évident. Le réflexe gagnant : balayer loin devant, lire les indices (flèches, " +
          "comportement des autres) et choisir ta trajectoire tôt plutôt que de réagir au dernier moment.",
      },
    ],

    conseils: [
      "Travaille spécifiquement l'insertion sur la N7 à l'entraînement : c'est le geste qui fait la différence à Évry.",
      "Après une grande artère, repasse mentalement en « mode ville » avant d'entrer dans le vieux village : priorités à droite et allure réduite.",
      "Là où la signalisation est floue, ralentis légèrement et observe : un doute géré calmement vaut mieux qu'une décision précipitée.",
      "Garde des contrôles visibles et systématiques : sur un parcours aussi varié, c'est ce qui rassure l'examinateur.",
    ],

    faq: [
      {
        q: "Évry, c'est un centre difficile ?",
        r: "Intermédiaire (3/5). La difficulté vient surtout de la variété : tu enchaînes des contextes très différents. Bien préparé sur le secteur, c'est tout à fait jouable.",
      },
      {
        q: "Quel est le moment le plus redouté ?",
        r: "L'insertion sur la Nationale 7. Travaille-la à l'avance et elle devient une formalité le jour J.",
      },
      {
        q: "Quelle est la cause d'échec n°1 ici ?",
        r: "Le relâchement en passant des grands axes au vieux village (priorités à droite oubliées) et les insertions mal gérées.",
      },
      {
        q: "Combien de temps dure l'épreuve ?",
        r: "Environ 32 minutes, dont à peu près 25 minutes de conduite effective. Arrive 15 min en avance pour te poser au calme.",
      },
    ],
  },

  {
    slug: "melun",
    nom: "Melun – Vaux-le-Pénil",
    departement: "Seine-et-Marne",
    deptNum: "77",
    adresse: "Avenue Georges Clemenceau, 77000 Vaux-le-Pénil (secteur Melun)",
    mapsQuery:
      "Centre d'examen permis avenue Georges Clemenceau Vaux-le-Pénil Melun 77",
    difficulte: 3,
    difficulteLabel: "Intermédiaire",
    quizTags: ["rond_point", "cycliste", "vitesse"],

    resume:
      "Le centre dessert Melun depuis Vaux-le-Pénil, et sa signature, ce sont les giratoires : " +
      "nombreux, parfois techniques, et souvent bordés d'une voie cyclable. Ajoute des zones 30 " +
      "et un centre-ville où le regard ne doit jamais se figer, et tu obtiens un examen 3/5 qui " +
      "récompense la maîtrise des ronds-points et la vigilance cycliste. Si ton parcours passe " +
      "par le cœur de Melun, la difficulté peut grimper d'un cran — d'où l'intérêt de connaître le secteur.",

    acces: [
      {
        ico: "map",
        texte:
          "Gare de Melun (RER D, Transilien R, TER) puis bus vers Vaux-le-Pénil et l'avenue Georges Clemenceau.",
      },
      {
        ico: "compass",
        texte:
          "Lignes de bus locales reliant Melun à Vaux-le-Pénil ; centre accessible depuis le centre-ville.",
      },
      {
        ico: "car",
        texte:
          "En voiture : accès par la N105 / la N6 et l'A5a, stationnement dans le secteur de Vaux-le-Pénil.",
      },
    ],

    pieges: [
      {
        ico: "refresh-cw",
        titre: "Les giratoires de Melun",
        texte:
          "C'est LA spécialité du centre : des ronds-points nombreux et parfois techniques. Le piège " +
          "récurrent, c'est le positionnement — mauvaise file à l'entrée ou clignotant mal placé à la " +
          "sortie. Choisis ta voie tôt, signale au bon moment et garde une trajectoire nette.",
      },
      {
        ico: "eye",
        titre: "Cyclistes sur les giratoires",
        texte:
          "Beaucoup de giratoires ont une voie cyclable : un cycliste peut surgir sur ta droite au " +
          "moment où tu sors. Contrôle de l'angle mort à chaque sortie, sans exception. C'est ici " +
          "qu'on perd des points bêtement.",
      },
      {
        ico: "alert-triangle",
        titre: "Les zones 30 traîtres",
        texte:
          "Le centre-ville compte des zones 30 où la vitesse grimpe sans qu'on s'en rende compte, " +
          "surtout après une portion plus roulante. Surveille les panneaux et ton compteur : une " +
          "survitesse en zone 30, même légère, peut coûter cher.",
      },
    ],

    conseils: [
      "Entraîne-toi aux ronds-points du secteur jusqu'à ce que le positionnement devienne un réflexe : c'est le cœur de l'examen ici.",
      "À chaque sortie de giratoire, un coup d'œil angle mort droit pour le cycliste — fais-en un automatisme.",
      "En zone 30, anticipe le panneau et lève le pied avant d'y entrer plutôt que de freiner dedans.",
      "Si tu passes par le centre de Melun, reste souple : c'est la partie qui peut faire monter la difficulté.",
    ],

    faq: [
      {
        q: "Le centre est à Melun ou à Vaux-le-Pénil ?",
        r: "Le départ se fait à Vaux-le-Pénil, juste à côté de Melun, mais le parcours t'emmène volontiers dans le secteur de Melun et ses giratoires.",
      },
      {
        q: "Qu'est-ce qui fait la difficulté ici ?",
        r: "Les giratoires, surtout : nombreux, techniques, avec voie cyclable. Maîtrise le positionnement et les contrôles, et tu tiens l'essentiel.",
      },
      {
        q: "Quelle est la cause d'échec n°1 ?",
        r: "Le mauvais positionnement en giratoire et l'angle mort cycliste oublié à la sortie. Deux réflexes à blinder.",
      },
      {
        q: "Combien de temps dure l'épreuve ?",
        r: "Environ 32 minutes, dont à peu près 25 minutes de conduite effective. Arrive 15 min en avance pour te poser au calme.",
      },
    ],
  },

  {
    slug: "lyon",
    nom: "Lyon – Vénissieux",
    departement: "Rhône",
    deptNum: "69",
    adresse: "9 rue Aristide Bruant, 69200 Vénissieux (secteur Lyon)",
    mapsQuery: "Centre d'examen permis 9 rue Aristide Bruant 69200 Vénissieux",
    difficulte: 3,
    difficulteLabel: "Intermédiaire",
    quizTags: ["rond_point", "vitesse", "priorite"],

    resume:
      "Surprise pour beaucoup de Lyonnais : il n'y a pas de centre d'examen dans Lyon même. Tu passes en périphérie, " +
      "le plus souvent à Vénissieux ou Saint-Priest, parfois à Rillieux-la-Pape (plus corsé) ou Dardilly (plus tranquille). " +
      "Vénissieux, le plus proche de Lyon, te plonge dans l'urbain dense dès le premier mètre : pas d'échauffement, " +
      "des grands boulevards trompeurs et des giratoires à deux voies qui servent de juge de paix. Le Rhône tourne " +
      "autour de 57 % de réussite, un peu sous la moyenne nationale — rien d'infranchissable, mais ça se prépare.",

    acces: [
      {
        ico: "map",
        texte:
          "Métro D — terminus Gare de Vénissieux, puis tram ou bus TCL vers le centre-ville.",
      },
      {
        ico: "compass",
        texte:
          "Tram T4 — plusieurs arrêts dans Vénissieux, correspondance à la Gare de Vénissieux.",
      },
      {
        ico: "car",
        texte:
          "En voiture : périphérique Laurent Bonnevay (sorties Vénissieux) ou D383, stationnement dans les rues autour du centre.",
      },
    ],

    pieges: [
      {
        ico: "refresh-cw",
        titre: "Les giratoires à deux voies, test signature",
        texte:
          "C'est LE morceau attendu du secteur : des ronds-points à deux voies avec du flux en continu. " +
          "Choisis ta voie avant d'entrer selon ta sortie, tiens ta trajectoire sans mordre sur l'autre couloir, " +
          "et signale ta sortie au bon moment. Un changement de file improvisé sur l'anneau, et l'examinateur note.",
      },
      {
        ico: "eye",
        titre: "Un départ dans le vif, montée comprise",
        texte:
          "Zéro mise en jambes ici : tu démarres directement dans un environnement dense — commerces, piétons, " +
          "arrêts de bus. Les candidats parlent aussi d'une belle montée dès le départ, avec un passage piéton très " +
          "fréquenté en haut. Traduction : démarrage en côte propre ET œil sur les piétons en même temps. Prépare " +
          "les deux, pas l'un après l'autre.",
      },
      {
        ico: "alert-triangle",
        titre: "Les grands boulevards, faux amis",
        texte:
          "Les axes larges à plusieurs voies donnent une impression de confort — et c'est exactement là que " +
          "beaucoup d'élèves ratent. On relâche l'attention, on laisse filer la vitesse, on oublie un contrôle au " +
          "changement de voie. Garde la même rigueur sur boulevard que dans une petite rue : c'est la constance " +
          "qui est jugée.",
      },
    ],

    conseils: [
      "Roule le secteur avant le jour J : Vénissieux centre, les boulevards et les giratoires à deux voies — le terrain connu enlève la moitié du stress.",
      "Travaille le démarrage en côte jusqu'au réflexe : frein à main ou point de patinage, mais zéro recul avec des piétons autour.",
      "Le tram T4 traverse la ville : aux carrefours avec les voies de tram, redouble d'attention sur la signalisation dédiée.",
      "Sur les grands boulevards, garde un œil régulier sur compteur et panneaux : le relâchement est la faute la plus fréquente ici.",
    ],

    faq: [
      {
        q: "Il y a un centre d'examen dans Lyon ?",
        r: "Non — les centres du Rhône sont tous en périphérie : Vénissieux, Saint-Priest, Rillieux-la-Pape, Dardilly, Givors ou Villefranche. Depuis Lyon, Vénissieux est le plus accessible (métro D + tram T4).",
      },
      {
        q: "Vénissieux, c'est un centre difficile ?",
        r: "Intermédiaire (3/5), au même niveau que Saint-Priest ou Givors — plus accessible que Rillieux-la-Pape, plus exigeant que Dardilly. Le Rhône est un poil sous la moyenne nationale de réussite, donc prépare-toi sérieusement.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "Le relâchement sur les grands boulevards et les erreurs de voie dans les giratoires à deux voies. Deux automatismes à blinder avant de te présenter.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "L'épreuve pratique du permis B dure environ 32 minutes, dont à peu près 25 minutes de conduite. Tu es noté sur 31 points : admis dès 20 points, sans faute éliminatoire.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Pas de bachotage. Vérifie ton trajet jusqu'au centre (métro D + T4 si besoin), repasse mentalement giratoires et démarrage en côte, et dors. Le jour J, arrive 15 min en avance pour te poser.",
      },
    ],
  },

  {
    slug: "marseille",
    nom: "Marseille – Saint-Henri",
    departement: "Bouches-du-Rhône",
    deptNum: "13",
    adresse: "99 chemin de la Pelouque, 13016 Marseille (quartier Saint-Henri)",
    mapsQuery:
      "Centre d'examen permis 99 chemin de la Pelouque 13016 Marseille",
    difficulte: 4,
    difficulteLabel: "Difficile",
    quizTags: ["priorite", "rond_point", "vitesse"],

    resume:
      "Saint-Henri, dans le 16e arrondissement, c'est LE centre de Marseille : environ 70 % des candidats " +
      "marseillais passent ici, l'alternative étant Aubagne. Le décor est posé — quartiers nord entre collines et " +
      "littoral, l'A55 à deux pas, une circulation marseillaise qui ne fait pas de cadeau. Intersections aux " +
      "priorités pas toujours évidentes, ronds-points, insertions sur axes chargés et limitations qui alternent " +
      "entre 30 et 50 : tout y est. Avec un taux de réussite du département autour de 56 %, nettement sous la " +
      "moyenne nationale, ce centre mérite son 4/5 — et une vraie préparation sur le secteur.",

    acces: [
      {
        ico: "map",
        texte:
          "Bus RTM 35, 36/36B ou 96 desservent Saint-Henri ; depuis le centre, métro 2 jusqu'à Gèze puis bus vers les quartiers nord.",
      },
      {
        ico: "compass",
        texte:
          "TER — gare de l'Estaque (ligne Marseille–Miramas par la Côte Bleue), à quelques minutes du chemin de la Pelouque.",
      },
      {
        ico: "car",
        texte:
          "En voiture : A55 toute proche (sorties du secteur Saint-Henri / l'Estaque), stationnement aux abords du centre.",
      },
    ],

    pieges: [
      {
        ico: "eye",
        titre: "Les priorités à droite à la marseillaise",
        texte:
          "Le tissu urbain des quartiers nord multiplie les intersections où la priorité n'est pas évidente : " +
          "marquage discret, visibilité coupée par le stationnement, usagers qui forcent le passage. La mauvaise " +
          "gestion des priorités à droite est citée comme l'erreur classique du secteur. Ralentis avant chaque " +
          "carrefour ambigu et ne pars jamais du principe que l'autre va céder.",
      },
      {
        ico: "refresh-cw",
        titre: "Ronds-points et insertions musclées",
        texte:
          "Le parcours enchaîne plusieurs giratoires et des insertions sur des axes très fréquentés — avec l'A55 " +
          "en toile de fond du secteur. Le piège : hésiter. Observe tôt, choisis ton créneau et engage-toi " +
          "franchement, contrôles rétro + angle mort à l'appui. Une insertion molle gêne le flux autant qu'une " +
          "insertion forcée.",
      },
      {
        ico: "alert-triangle",
        titre: "Le yo-yo 30/50 dans un secteur vallonné",
        texte:
          "Les limitations alternent sans arrêt entre 30 et 50 km/h, et le relief du 16e — entre collines et " +
          "mer — ajoute des arrêts en pente. Reste dans la bonne vitesse à chaque zone, et soigne tes démarrages " +
          "en côte : un recul au feu ou une survitesse en zone 30, même légère, coûte très cher.",
      },
    ],

    conseils: [
      "Fais plusieurs heures de conduite dans les 15e et 16e arrondissements avant l'examen : la circulation du secteur ne ressemble à aucune autre, autant l'apprivoiser avant le jour J.",
      "Blinde ta priorité à droite : à chaque intersection sans signalisation claire, pied levé et regard actif — c'est l'erreur la plus citée ici.",
      "Travaille le démarrage en côte jusqu'au réflexe : le relief du quartier ne te laissera pas y échapper.",
      "Garde tes distances de sécurité même quand ça bouchonne : se laisser coller au véhicule de devant est une faute que l'examinateur relève.",
    ],

    faq: [
      {
        q: "Saint-Henri, c'est un centre difficile ?",
        r: "Oui, on le classe 4/5. Le taux de réussite des Bouches-du-Rhône tourne autour de 56 %, nettement sous la moyenne nationale, et la circulation marseillaise demande une vigilance de tous les instants. Bien préparé sur le secteur, ça se passe — mais pas en improvisant.",
      },
      {
        q: "C'est le seul centre pour passer à Marseille ?",
        r: "C'est le seul dans Marseille même — environ 70 % des candidats marseillais passent ici. L'autre option du secteur est le centre d'Aubagne, un peu plus loin à l'est.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "La mauvaise gestion des priorités à droite, suivie des distances de sécurité mal tenues dans le trafic dense. Deux réflexes à automatiser avant de te présenter.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "L'épreuve pratique du permis B dure environ 32 minutes, dont à peu près 25 minutes de conduite. Tu es noté sur 31 points : admis dès 20 points, sans faute éliminatoire.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Repos, pas de marathon de révisions. Vérifie ton trajet (bus RTM ou TER l'Estaque, ou A55 en voiture), prépare convocation et pièce d'identité, et arrive 15 min en avance pour souffler avant de monter dans la voiture.",
      },
    ],
  },

  {
    slug: "toulouse",
    nom: "Toulouse – Lalande",
    departement: "Haute-Garonne",
    deptNum: "31",
    adresse: "2 rue de Lalande, 31200 Toulouse",
    mapsQuery: "Centre d'examen permis 2 rue de Lalande 31200 Toulouse",
    difficulte: 3,
    difficulteLabel: "Intermédiaire",
    quizTags: ["rond_point", "vitesse", "priorite"],

    resume:
      "Lalande, au nord de Toulouse, est le grand centre d'examen de la Ville rose — l'agglo compte aussi " +
      "Darasse (31500) et Colomiers si ton auto-école t'y envoie. Le terrain de jeu : le nord toulousain, avec " +
      "la D820 (avenue des États-Unis) en colonne vertébrale, la rocade et l'A62 aux portes du quartier, des " +
      "giratoires en série et des communes résidentielles comme Aucamville, Launaguet ou Fenouillet juste à côté. " +
      "La Haute-Garonne tourne autour de 60 % de réussite, dans la moyenne nationale : un centre exigeant mais " +
      "juste, où la préparation sur le secteur paie vraiment.",

    acces: [
      {
        ico: "map",
        texte:
          "Métro B — station La Vache, puis quelques minutes de bus ou une vingtaine à pied vers la rue de Lalande.",
      },
      {
        ico: "compass",
        texte:
          "Linéo L10 et bus Tisséo (29, 60, 69) desservent le secteur Lalande et la Barrière de Paris.",
      },
      {
        ico: "car",
        texte:
          "En voiture : D820 (avenue des États-Unis) ou échangeur A62 / rocade au nord ; du stationnement est disponible à proximité immédiate du centre.",
      },
    ],

    pieges: [
      {
        ico: "refresh-cw",
        titre: "Les giratoires du nord toulousain",
        texte:
          "Entre la D820, les abords de la rocade et les entrées des communes voisines, les ronds-points " +
          "s'enchaînent — certains à plusieurs voies. C'est le point d'entraînement n°1 recommandé sur ce " +
          "centre : voie choisie avant d'entrer, trajectoire tenue, clignotant de sortie au bon moment. " +
          "L'examinateur juge la répétition propre, pas un giratoire réussi par chance.",
      },
      {
        ico: "alert-triangle",
        titre: "La rocade aux portes du quartier",
        texte:
          "L'échangeur A62 / rocade est tout proche du centre, et l'insertion sur voie rapide fait partie des " +
          "situations à maîtriser ici. Accélère franchement dans la bretelle, contrôle rétro + angle mort tôt, " +
          "et vise un créneau précis sans flotter. Une insertion hésitante sur le périphérique toulousain, " +
          "c'est des points qui s'envolent.",
      },
      {
        ico: "eye",
        titre: "L'avenue des États-Unis, grand axe piégeux",
        texte:
          "Cette ancienne nationale traverse tout le quartier : commerces, concessions autos, entrées et sorties " +
          "de parkings en continu, bus et piétons. Le trafic y est dense et les limitations alternent entre " +
          "zones 30 et 50. Scanne les côtés en permanence et vérifie ta vitesse à chaque panneau — la survitesse " +
          "d'inattention est le piège classique des grands axes.",
      },
    ],

    conseils: [
      "Roule le secteur avant le jour J : Lalande, l'avenue des États-Unis et les communes voisines (Aucamville, Launaguet, Fenouillet) — leurs rues résidentielles demandent une vigilance particulière sur les priorités.",
      "Travaille l'insertion sur la rocade avec ton moniteur jusqu'à ce qu'elle devienne un automatisme : c'est la compétence qui fait la différence ici.",
      "Sur la D820, lis les panneaux en avance : les passages 50 → 30 et retour s'enchaînent vite dans les zones commerçantes.",
      "Arrive 15 min en avance avec convocation et pièce d'identité : démarrer posé, c'est déjà des points de sauvés.",
    ],

    faq: [
      {
        q: "Lalande, c'est un centre difficile ?",
        r: "Intermédiaire (3/5). La Haute-Garonne est dans la moyenne nationale de réussite (autour de 60 %). Ce qui compte ici, c'est la maîtrise des giratoires, de l'insertion rocade et des grands axes — des situations qui se travaillent très bien à l'avance.",
      },
      {
        q: "Il y a d'autres centres à Toulouse ?",
        r: "Oui : Darasse, dans l'est toulousain (rue Xavier Darasse, 31500), et Colomiers dans l'ouest de l'agglo. Ton auto-école choisit le centre — la préparation reste la même : connaître le secteur où tu passes.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "Les erreurs de giratoire (voie ou clignotant mal placés) et les insertions hésitantes sur la rocade sont les points les plus travaillés par les auto-écoles du secteur. Blinde ces deux automatismes avant de te présenter.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "L'épreuve pratique du permis B dure environ 32 minutes, dont à peu près 25 minutes de conduite. Tu es noté sur 31 points : admis dès 20 points, sans faute éliminatoire.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Pas de bachotage. Repère ton trajet (métro B La Vache + bus, ou D820 en voiture), repasse mentalement giratoires et insertion rocade, et dors correctement. Un candidat reposé lit mieux la route qu'un candidat qui a révisé jusqu'à minuit.",
      },
    ],
  },
  {
    slug: "bordeaux",
    nom: "Bordeaux – Mérignac",
    departement: "Gironde",
    deptNum: "33",
    adresse: "20 rue Thierry Sabine, 33700 Mérignac",
    mapsQuery: "Centre d'examen permis 20 rue Thierry Sabine 33700 Mérignac",
    difficulte: 3,
    difficulteLabel: "Intermédiaire",
    quizTags: ["rond_point", "vitesse", "priorite"],

    resume:
      "Surprise pour beaucoup de candidats bordelais : l'examen ne se passe pas dans Bordeaux, " +
      "mais à Mérignac, dans la zone de l'aéroport (un second centre dessert le sud de la " +
      "métropole à Villenave-d'Ornon). Le secteur est moderne et roulant : giratoires en " +
      "cascade, grands axes type avenue Marcel Dassault, rocade toute proche et tram A qui " +
      "s'invite dans le paysage. La Gironde affiche un taux de réussite au-dessus de la moyenne " +
      "nationale — ici, la préparation paie. Connaître les réflexes du secteur te met une vraie " +
      "longueur d'avance le jour J.",

    acces: [
      {
        ico: "map",
        texte:
          "Tram A, branche aéroport — arrêts Cadéra-Issartier, Caroline Aigle ou Aéroport, puis correspondance bus ou marche dans la zone.",
      },
      {
        ico: "compass",
        texte:
          "Bus TBM — arrêt Institut Evering à une dizaine de minutes à pied du centre.",
      },
      {
        ico: "car",
        texte:
          "En voiture : rocade A630, sortie 11b côté zone aéroportuaire ; du stationnement est disponible à proximité immédiate du centre.",
      },
    ],

    pieges: [
      {
        ico: "refresh-cw",
        titre: "Les giratoires à la chaîne",
        texte:
          "Un parcours type dans le secteur peut aligner plus d'une dizaine de ronds-points. Ce n'est pas " +
          "un giratoire qui pose problème, c'est la répétition : clignotant à l'approche, contrôle, " +
          "sortie propre, et on recommence. Travaille l'automatisme jusqu'au réflexe — l'examinateur " +
          "juge ta constance sur toute la série, pas un passage réussi par chance.",
      },
      {
        ico: "alert-triangle",
        titre: "Voies rapides au départ et à l'arrivée",
        texte:
          "Les parcours du centre démarrent et se terminent souvent par des voies à accès limité : " +
          "la rocade et ses bretelles sont juste là. Insertion franche, angle mort vérifié, allure " +
          "adaptée dès les premières minutes — tu n'as pas le temps de chauffer. Une insertion molle " +
          "ou une hésitation à la bretelle coûte très cher.",
      },
      {
        ico: "eye",
        titre: "Le tram A dans le secteur",
        texte:
          "Depuis 2023, la branche aéroport du tram A traverse Mérignac jusqu'au terminus Aéroport. " +
          "Carrefours à feux avec plateforme tram, signalisation spécifique, piétons qui traversent " +
          "vers les stations : le tram a toujours la priorité quand les feux le disent. Ne te laisse " +
          "jamais surprendre par une rame qui arrive dans ton dos.",
      },
    ],

    conseils: [
      "Va repérer la zone de l'aéroport avant le jour J : le centre n'est pas dans Bordeaux, et arriver en terrain connu enlève une grosse part du stress.",
      "Blinde tes insertions sur la rocade avec ton moniteur : accélération franche, rétro + angle mort, prise de position sans flottement. C'est le geste qui fait la différence ici.",
      "Sur giratoire : clignotant à droite seulement quand tu prends la sortie qui suit — jamais avant. Sur une série de dix, l'examinateur voit tout de suite si c'est un réflexe ou du hasard.",
      "Aux carrefours avec le tram, fie-toi aux feux et à la signalisation dédiée, pas à ton instinct : une rame silencieuse arrive plus vite qu'on ne le croit.",
    ],

    faq: [
      {
        q: "L'examen se passe à Bordeaux ou à Mérignac ?",
        r: "À Mérignac, rue Thierry Sabine, dans la zone de l'aéroport. C'est le centre principal de la métropole bordelaise ; un autre centre existe à Villenave-d'Ornon pour le secteur sud.",
      },
      {
        q: "Bordeaux, c'est un centre difficile ?",
        r: "Intermédiaire (3/5). La Gironde réussit au-dessus de la moyenne nationale (~62 % contre ~58 %), mais le secteur de Mérignac reste technique : rocade, séries de giratoires et tram demandent des automatismes solides.",
      },
      {
        q: "Je peux connaître le parcours exact à l'avance ?",
        r: "Non — l'examinateur choisit son itinéraire le jour même parmi plusieurs. Mais les ingrédients reviennent toujours : giratoires, grands axes de la zone aéroportuaire et passage possible par la rocade. C'est exactement ce qu'on te prépare ici.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "L'épreuve pratique du permis B dure environ 32 minutes, dont à peu près 25 minutes de conduite. Tu es noté sur 31 points : admis dès 20 points, sans faute éliminatoire. Arrive 15 min en avance pour te poser.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Pas de bachotage. Vérifie ton itinéraire jusqu'à la rue Thierry Sabine (ce n'est pas Bordeaux centre !), repasse mentalement giratoires et insertion rocade, et dors. Le jour J, c'est juste de la mise en application.",
      },
    ],
  },

  {
    slug: "lille",
    nom: "Lille – Lomme",
    departement: "Nord",
    deptNum: "59",
    adresse: "57 avenue Roger Salengro, 59160 Lomme (Lille)",
    mapsQuery: "Centre d'examen permis 57 avenue Roger Salengro 59160 Lomme",
    difficulte: 3,
    difficulteLabel: "Intermédiaire",
    quizTags: ["rond_point", "vitesse", "priorite"],

    resume:
      "Pour Lille, l'examen part de Lomme, à l'ouest de la métropole (un autre centre dessert " +
      "l'est, côté Lezennes / Villeneuve-d'Ascq). La signature du secteur, c'est le grand écart : " +
      "un même parcours peut enchaîner boulevards urbains, giratoires de zone commerciale, " +
      "autoroute A25 ou A22 avec sortie numérotée, puis le centre d'un village comme Pérenchies " +
      "ou Sequedin et ses rues étroites. Le Nord réussit dans la moyenne nationale : rien " +
      "d'injuste ici, mais le parcours teste ta capacité à changer de registre sans perdre tes " +
      "contrôles. Prépare chaque décor et tu ne seras surpris par aucun.",

    acces: [
      {
        ico: "map",
        texte:
          "Métro ligne 2 — station Bourg (Lomme), à quelques minutes à pied du secteur Salengro / République.",
      },
      {
        ico: "compass",
        texte:
          "Bus Ilévia — la ligne 10 dessert l'avenue de la République toute proche, correspondances vers le reste de la métropole.",
      },
      {
        ico: "car",
        texte:
          "En voiture : A25 côté Lomme ou grands axes depuis Lille, stationnement dans les rues du secteur. Prévois 10 min de marge.",
      },
    ],

    pieges: [
      {
        ico: "alert-triangle",
        titre: "L'autoroute au milieu de l'examen",
        texte:
          "Les parcours réels du centre passent par l'A25 ou l'A22, avec une sortie précise à prendre. " +
          "Insertion à bonne allure, contrôles rétro + angle mort, maintien du 110 puis sortie anticipée : " +
          "tout s'enchaîne vite. Une insertion hésitante ou une sortie ratée au dernier moment, et tu " +
          "perds des points décisifs. Travaille ce bloc jusqu'à ce qu'il soit fluide.",
      },
      {
        ico: "eye",
        titre: "Les villages qui cassent le rythme",
        texte:
          "Pérenchies, Sequedin, Saint-André : les itinéraires quittent volontiers Lomme pour le centre " +
          "d'un village voisin. Rues étroites, stationnement des deux côtés, intersections sans marquage " +
          "où la priorité à droite s'applique pleinement. C'est là qu'on relâche la garde après une " +
          "portion roulante — et c'est exactement là que ça coince.",
      },
      {
        ico: "refresh-cw",
        titre: "Giratoires et trafic de zone commerciale",
        texte:
          "Compte environ huit ronds-points sur un parcours type d'une douzaine de kilomètres, dont " +
          "certains dans des secteurs commerciaux chargés. Voitures qui cherchent leur direction, " +
          "entrées-sorties de parking, files qui se croisent : choisis ta voie tôt, signale ta sortie " +
          "au bon moment et garde une trajectoire nette malgré l'agitation autour.",
      },
    ],

    conseils: [
      "Travaille le bloc autoroute avec ton moniteur : insertion sur l'A25 ou l'A22, maintien d'allure, puis sortie numérotée anticipée. C'est le passage le plus discriminant du secteur.",
      "Dans les villages (Pérenchies, Sequedin), repasse en « mode prudence » dès l'entrée : allure réduite, regard actif, et priorité à droite considérée par défaut aux intersections sans marquage.",
      "Roule au moins quelques heures dans le secteur de Lomme avant le jour J : connaître les giratoires et les zones commerciales à froid change tout.",
      "Vise une conduite lisse sur tout le parcours : ici, c'est le changement de décor qui piège. Celui qui garde les mêmes contrôles en ville, sur autoroute et en village a déjà gagné.",
    ],

    faq: [
      {
        q: "L'examen se passe dans Lille même ?",
        r: "Non — le centre est à Lomme, commune associée de Lille, avenue Roger Salengro. Un autre centre dessert l'est de la métropole côté Lezennes / Villeneuve-d'Ascq. Vérifie bien l'adresse sur ta convocation.",
      },
      {
        q: "Lille, c'est un centre difficile ?",
        r: "Intermédiaire (3/5). Le Nord réussit dans la moyenne nationale (~58 %). La difficulté vient de la variété : ville, autoroute et village dans le même examen. Bien préparé sur les trois registres, c'est tout à fait jouable.",
      },
      {
        q: "Je peux connaître le parcours exact à l'avance ?",
        r: "Non — l'inspecteur choisit l'itinéraire le jour J parmi plusieurs. Mais les ingrédients reviennent : giratoires de Lomme, passage possible par l'A25 ou l'A22, et détour par un village voisin. Maîtrise les types de situations plutôt qu'un tracé par cœur.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "L'épreuve pratique du permis B dure environ 32 minutes, dont à peu près 25 minutes de conduite. Tu es noté sur 31 points : admis dès 20 points, sans faute éliminatoire. Arrive 15 min en avance.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Pas de marathon de révisions. Repasse mentalement les trois décors du secteur (ville, autoroute, village), prépare convocation et pièce d'identité, et couche-toi tôt. Un candidat reposé gère dix fois mieux les changements de rythme.",
      },
    ],
  },

  {
    slug: "nantes",
    nom: "Nantes – Saint-Herblain",
    departement: "Loire-Atlantique",
    deptNum: "44",
    adresse: "3 rue de la Johardière, 44800 Saint-Herblain",
    mapsQuery:
      "Centre d'examen permis 3 rue de la Johardière 44800 Saint-Herblain",
    difficulte: 2,
    difficulteLabel: "Accessible",
    quizTags: ["rond_point", "priorite", "vitesse"],

    resume:
      "Pour Nantes, l'examen part de Saint-Herblain, dans la zone de la Lorie à l'ouest de la " +
      "ville (un second centre dessert le sud de l'agglomération à Bouguenais). Bonne nouvelle : " +
      "le secteur réussit au-dessus de la moyenne nationale — autour de 64 % contre ~57 %. La " +
      "spécialité locale, ce sont les ronds-points : un parcours type en enchaîne une quinzaine, " +
      "avec quelques doubles giratoires en prime, le long des boulevards Salvador Allende et " +
      "Charles de Gaulle. Ajoute le tram et la possibilité d'une insertion sur voie rapide, et tu " +
      "as un examen exigeant sur les automatismes mais vraiment juste.",

    acces: [
      {
        ico: "map",
        texte:
          "Tram ligne 1 — terminus François Mitterrand, sur le boulevard Salvador Allende, puis correspondance bus vers la zone de la Lorie.",
      },
      {
        ico: "compass",
        texte:
          "Bus TAN — lignes 93 et C3, arrêt Apave au plus près du centre ; les lignes 50, 71 et 91 desservent aussi le secteur.",
      },
      {
        ico: "car",
        texte:
          "En voiture : périphérique ouest de Nantes, sorties Porte d'Atlantis ou Porte de Saint-Herblain, direction la zone de la Lorie. Stationnement sur place.",
      },
    ],

    pieges: [
      {
        ico: "refresh-cw",
        titre: "Le marathon des giratoires",
        texte:
          "Une quinzaine de ronds-points sur un parcours type, parfois trois sorties à enchaîner coup " +
          "sur coup, et des doubles giratoires typiques de l'agglo nantaise. La difficulté n'est pas " +
          "technique, elle est dans la répétition : clignotant, contrôle, trajectoire, sortie propre — " +
          "à la quinzième fois comme à la première. L'examinateur note ta constance.",
      },
      {
        ico: "eye",
        titre: "Le tram sur le boulevard Allende",
        texte:
          "La ligne 1 du tram longe le boulevard Salvador Allende, en plein secteur d'examen. " +
          "Plateforme au centre, carrefours à feux spécifiques, piétons qui coupent vers les stations : " +
          "au moindre franchissement de la plateforme, fie-toi aux feux dédiés et vérifie qu'aucune " +
          "rame n'arrive. Une erreur face au tram ne pardonne pas.",
      },
      {
        ico: "alert-triangle",
        titre: "Les voies rapides aux portes du secteur",
        texte:
          "L'ouest nantais est bordé de voies rapides — périphérique, axes vers Rennes (N137) et " +
          "Vannes (N165). Une insertion peut s'inviter dans ton parcours : voie d'accélération utilisée " +
          "en entier, contrôles rétro + angle mort, allure adaptée au flux. Garde aussi tes distances de " +
          "sécurité une fois inséré — c'est un point que les inspecteurs regardent de près ici.",
      },
    ],

    conseils: [
      "Fais des ronds-points ta priorité d'entraînement : sur ce secteur, celui qui a l'automatisme giratoire a déjà fait 80 % du travail.",
      "Répète les carrefours avec tram sur le boulevard Allende : feux dédiés, plateforme, piétons. Le réflexe « je vérifie la rame avant de franchir » doit être ancré.",
      "Travaille une vraie insertion sur voie rapide avec ton moniteur : accélération franche dans la voie d'insertion, pas de timidité à 70 quand le flux est à 110.",
      "Va rouler dans la zone de la Lorie avant le jour J : c'est une zone d'activités, pas un centre-ville — camions, entrées d'entreprises et giratoires ont leur rythme propre.",
    ],

    faq: [
      {
        q: "L'examen se passe à Nantes ou à Saint-Herblain ?",
        r: "À Saint-Herblain, rue de la Johardière, dans la zone de la Lorie à l'ouest de Nantes. C'est le centre principal de l'agglo ; un autre centre existe à Bouguenais, route de Bouaye, pour le secteur sud.",
      },
      {
        q: "Nantes, c'est un centre difficile ?",
        r: "Plutôt accessible (2/5). Le taux de réussite du secteur est au-dessus de la moyenne nationale (~64 % contre ~57 %). L'examen reste exigeant sur les automatismes — giratoires et tram en tête — mais il est réputé juste.",
      },
      {
        q: "Je peux connaître le parcours exact à l'avance ?",
        r: "Non — l'inspecteur choisit son itinéraire le jour même. Mais la recette locale ne change pas : beaucoup de giratoires, les boulevards Allende et Charles de Gaulle, le tram, et une insertion possible sur voie rapide. C'est exactement ce qu'on te prépare ici.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "L'épreuve pratique du permis B dure environ 32 minutes, dont à peu près 25 minutes de conduite. Tu es noté sur 31 points : admis dès 20 points, sans faute éliminatoire. Arrive 15 min en avance pour te poser.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Pas de bachotage. Vérifie ton trajet jusqu'à la zone de la Lorie (tram 1 + bus ou périph ouest), repasse mentalement giratoires, tram et insertion, et dors bien. Sur un centre qui réussit au-dessus de la moyenne, la sérénité est ton meilleur atout.",
      },
    ],
  },
  {
    slug: "strasbourg",
    nom: "Strasbourg",
    departement: "Bas-Rhin",
    deptNum: "67",
    adresse: "40 rue Guynemer, 67100 Strasbourg",
    mapsQuery: "Centre d'examen permis 40 rue Guynemer 67100 Strasbourg",
    difficulte: 3,
    difficulteLabel: "Intermédiaire",
    quizTags: ["cycliste", "priorite", "vitesse"],

    resume:
      "Strasbourg, c'est la capitale française du vélo — et ça se sent le jour de l'examen. " +
      "Le centre du 40 rue Guynemer, dans le quartier de la Musau au sud de la ville, t'envoie " +
      "dans un secteur où cyclistes, tram et zones 30 se partagent la route en permanence. " +
      "Bonne nouvelle : le Bas-Rhin affiche un taux de réussite au-dessus de la moyenne " +
      "nationale (autour de 63 %). L'examen est exigeant sur l'observation, mais il est " +
      "juste : ceux qui ont blindé leurs contrôles d'angle mort passent.",

    acces: [
      {
        ico: "map",
        texte:
          "En tram + à pied : la Musau est entre Neudorf et la Meinau — compte 10 à 15 minutes à pied depuis les stations de tram du secteur.",
      },
      {
        ico: "compass",
        texte:
          "En bus CTS : plusieurs lignes desservent la Musau et la plaine des Bouchers, arrêts à quelques minutes du centre.",
      },
      {
        ico: "car",
        texte:
          "En voiture : A35 puis les quartiers sud ; le parking du centre est réservé aux voitures d'auto-école — la plupart des candidats arrivent avec leur moniteur.",
      },
    ],

    pieges: [
      {
        ico: "eye",
        titre: "Cyclistes : le contrôle qui décide de tout",
        texte:
          "Strasbourg est la ville la plus cyclable de France : pistes partout, vélos qui " +
          "surgissent vite, des deux côtés, à toute heure. Chaque tourne-à-droite, chaque " +
          "insertion, chaque démarrage = rétro + angle mort, sans exception. C'est LE réflexe " +
          "que l'examinateur juge ici — et la cause d'échec la plus bête à éviter.",
      },
      {
        ico: "alert-triangle",
        titre: "Le tram sur ta route",
        texte:
          "Six lignes de tram traversent la ville : voies partagées, plateformes à franchir, " +
          "feux spécifiques. Règles d'or : ne jamais t'engager sur les voies sans être sûr de " +
          "pouvoir dégager, arrêt impératif au feu rouge clignotant, et priorité au tram. " +
          "Gêner une rame, c'est très cher le jour J.",
      },
      {
        ico: "refresh-cw",
        titre: "Trafic dense, vitesses en yo-yo",
        texte:
          "L'A35 et le tunnel de l'Étoile sont réputés souvent saturés aux heures de pointe, " +
          "et le centre-ville multiplie zones 30 et secteurs apaisés. Le piège : rester calé " +
          "sur la vitesse d'avant. Lis les panneaux en continu et adapte ton allure à chaque " +
          "changement d'ambiance — c'est ce que l'examinateur regarde.",
      },
    ],

    conseils: [
      "Roule le secteur sud (Neudorf, Meinau, plaine des Bouchers) avec ton moniteur avant le jour J : le départ en terrain connu change tout.",
      "Fais du contrôle cycliste un réflexe : rétro + angle mort à CHAQUE changement de direction, même quand la piste semble vide.",
      "Apprends les règles du tram par cœur : feu rouge clignotant = arrêt absolu, jamais d'arrêt sur les voies, priorité à la rame.",
      "Surveille les transitions 30/50 : dans les quartiers résidentiels le 30 est fréquent, et une survitesse même légère se paie cash.",
    ],

    faq: [
      {
        q: "Strasbourg, c'est un centre difficile ?",
        r: "Intermédiaire (3/5). Le Bas-Rhin réussit mieux que la moyenne nationale (~63 % contre ~57-58 %), mais l'examen en ville ne pardonne pas les oublis d'observation : vélos et tram sont les juges de paix.",
      },
      {
        q: "Je peux connaître le parcours exact à l'avance ?",
        r: "Non — l'examinateur choisit son itinéraire le jour même. Mais le secteur revient toujours : quartiers sud, axes partagés avec le tram, pistes cyclables. C'est exactement ce qu'on te prépare ici.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "L'angle mort cycliste oublié, devant la mauvaise gestion du tram (engagement sur les voies, feu clignotant grillé). Deux réflexes à blinder avant de te présenter.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "L'épreuve pratique du permis B dure environ 32 minutes, dont à peu près 25 minutes de conduite. Tu es noté sur 31 points : admis dès 20 points, sans faute éliminatoire.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Pas de bachotage. Sommeil, un parcours mental des pièges de Strasbourg (vélos, tram, zones 30), documents prêts. Le jour J, arrive 15 min en avance pour te poser.",
      },
    ],
  },

  {
    slug: "montpellier",
    nom: "Montpellier",
    departement: "Hérault",
    deptNum: "34",
    adresse: "500 rue Alfred Nobel, 34000 Montpellier",
    mapsQuery: "Centre d'examen permis 500 rue Alfred Nobel 34000 Montpellier",
    difficulte: 4,
    difficulteLabel: "Difficile",
    quizTags: ["rond_point", "priorite", "vitesse"],

    resume:
      "Le centre du Millénaire — la « Maison de la Sécurité Routière » — est LE centre " +
      "d'examen de Montpellier, posé entre Port Marianne et Odysseum. Le secteur enchaîne " +
      "giratoires, grands axes roulants et lignes de tram qui quadrillent la ville. Ajoute " +
      "le passage en ville 30 depuis 2021 et un taux de réussite en ville nettement sous la " +
      "moyenne nationale, et tu comprends pourquoi on le classe difficile. Rien " +
      "d'insurmontable pour autant : ici, la préparation sur le secteur paie vraiment.",

    acces: [
      {
        ico: "map",
        texte:
          "Tram ligne 1 — arrêt Millénaire (direction Odysseum), puis quelques minutes à pied jusqu'à la rue Alfred Nobel.",
      },
      {
        ico: "compass",
        texte:
          "Depuis la gare Saint-Roch : tram 1 direction Odysseum, environ un quart d'heure jusqu'au Millénaire.",
      },
      {
        ico: "car",
        texte:
          "En voiture : autoroute sortie 29 « Montpellier Est », puis le parc du Millénaire ; stationnement possible dans le quartier.",
      },
    ],

    pieges: [
      {
        ico: "eye",
        titre: "Le tram, roi de la ville",
        texte:
          "À Montpellier, le tram est partout et il est prioritaire. Feu rouge clignotant = " +
          "arrêt absolu, jamais d'arrêt sur les voies, et avant de franchir une plateforme tu " +
          "vérifies TOUJOURS qu'une rame n'arrive pas dans l'autre sens. Un tram gêné ou une " +
          "traversée hasardeuse, c'est l'examen qui s'arrête là.",
      },
      {
        ico: "refresh-cw",
        titre: "Giratoires à la chaîne",
        texte:
          "Le secteur Port Marianne / Odysseum enchaîne les giratoires, et certains ronds-points " +
          "de la ville sont réputés saturés chez les auto-écoles locales (la Lyre, Rieucoulon). " +
          "Le piège classique : mauvaise voie à l'entrée ou clignotant de sortie oublié. Choisis " +
          "ta file tôt, tiens-la, signale ta sortie — à chaque fois.",
      },
      {
        ico: "alert-triangle",
        titre: "Ville 30 : la vitesse au cordeau",
        texte:
          "Depuis août 2021, presque toute la ville est limitée à 30 km/h, sauf quelques grands " +
          "axes restés à 50. Résultat : des transitions de vitesse permanentes, et un 30 vite " +
          "dépassé sans s'en rendre compte en sortant d'un axe roulant. Lis les panneaux en " +
          "continu et surveille ton compteur — la survitesse est éliminatoire.",
      },
    ],

    conseils: [
      "Roule le triangle Millénaire – Port Marianne – Odysseum avec ton moniteur : le départ se joue dans ce secteur.",
      "Blinde tes règles de tram : feu clignotant, priorité à la rame, vérification des deux sens avant chaque traversée.",
      "Aux giratoires, décide ta sortie AVANT d'entrer et garde ta voie jusqu'au bout — pas de slalom dans l'anneau.",
      "Calibre-toi sur le 30 km/h : en ville 30, rouler « normalement » c'est déjà trop vite. Compteur, panneaux, régularité.",
    ],

    faq: [
      {
        q: "Montpellier, c'est un centre difficile ?",
        r: "Oui, on le classe 4/5. L'Hérault est dans la moyenne nationale (~57 %), mais le taux de réussite en ville tourne autour de 51 % : tram omniprésent, giratoires chargés et ville 30 demandent une vraie préparation.",
      },
      {
        q: "Je peux connaître le parcours exact à l'avance ?",
        r: "Non — l'examinateur choisit l'itinéraire le jour même parmi plusieurs. Mais les ingrédients reviennent toujours : giratoires, plateformes de tram, transitions 30/50. Maîtrise-les et le tracé n'a plus d'importance.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "Les erreurs liées au tram (traversée mal vérifiée, feu clignotant) et les giratoires mal négociés. Juste derrière : la survitesse en zone 30, sournoise après un grand axe.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "L'épreuve pratique du permis B dure environ 32 minutes, dont à peu près 25 minutes de conduite. Notation sur 31 points : admis dès 20 points, sans faute éliminatoire.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Repos, documents prêts, et un parcours mental des trois pièges du centre : tram, giratoires, ville 30. Le jour J, arrive 15 min en avance — le Millénaire est facile d'accès en tram.",
      },
    ],
  },

  {
    slug: "nice",
    nom: "Nice – Les Iscles",
    departement: "Alpes-Maritimes",
    deptNum: "06",
    adresse: "Avenue Pierre Léonetti, 06200 Nice",
    mapsQuery:
      "Centre d'examen permis avenue Pierre Léonetti Les Iscles 06200 Nice",
    difficulte: 3,
    difficulteLabel: "Intermédiaire",
    quizTags: ["rond_point", "vitesse", "priorite"],

    resume:
      "Nice compte deux centres officiels : Les Iscles, le principal, dans la plaine du Var " +
      "à Saint-Isidore (à deux pas du stade Allianz Riviera), et Vauban, au stade Vauban à " +
      "l'est du centre-ville. Aux Iscles, le décor est clair : giratoires en série, zones " +
      "commerciales à fort trafic, le tram 3 en plein milieu et la pénétrante du Var qui " +
      "longe tout ça. Les Alpes-Maritimes réussissent un peu mieux que la moyenne nationale : " +
      "bien préparé sur le secteur, tu joues à domicile.",

    acces: [
      {
        ico: "map",
        texte:
          "Tram ligne 3 — terminus Saint-Isidore, tout près du centre ; environ 30 minutes depuis le centre-ville de Nice.",
      },
      {
        ico: "compass",
        texte:
          "Bus Lignes d'Azur — plusieurs lignes desservent la plaine du Var et le secteur du stade Allianz Riviera.",
      },
      {
        ico: "car",
        texte:
          "En voiture : A8 sortie Saint-Isidore, puis route de Grenoble (M6202bis) ; stationnement aux abords du stade.",
      },
    ],

    pieges: [
      {
        ico: "refresh-cw",
        titre: "Giratoires + trafic commercial",
        texte:
          "La plaine du Var enchaîne les giratoires qui desservent les grandes zones commerciales " +
          "du secteur (Lingostière, Nice Valley, Ikea). Résultat : des flux qui entrent et " +
          "sortent en permanence, souvent pressés. Position, observation, clignotant de sortie — " +
          "l'examinateur juge ta constance sur toute la série, pas un giratoire isolé.",
      },
      {
        ico: "eye",
        titre: "Le tram 3 en plein secteur",
        texte:
          "La ligne 3 court le long de la plaine du Var, exactement là où tu passes l'examen : " +
          "plateformes à franchir, feux dédiés, priorité à la rame. Avant chaque traversée, " +
          "vérifie les deux sens et assure-toi de pouvoir dégager complètement. Une hésitation " +
          "sur les voies ou un feu clignotant ignoré, et c'est terminé.",
      },
      {
        ico: "alert-triangle",
        titre: "La pénétrante du Var : insertion et allure",
        texte:
          "La route de Grenoble et la M6202bis longent le secteur : la vitesse y monte vite et " +
          "les insertions doivent être franches. Accélère tôt, contrôle rétro + angle mort, et " +
          "vise ton créneau sans flotter. Attention aussi au retour en zone urbaine : redescendre " +
          "à 50 puis 30 sans traîner sur ta lancée.",
      },
    ],

    conseils: [
      "Roule la plaine du Var aux heures chargées : les giratoires des zones commerciales n'ont rien à voir à vide et en pleine affluence.",
      "Automatise le giratoire : voie choisie avant l'entrée, trajectoire tenue, clignotant de sortie. C'est le pain quotidien du secteur.",
      "Répète les règles du tram : priorité à la rame, arrêt au feu clignotant, jamais d'arrêt sur la plateforme.",
      "Travaille l'insertion sur voie rapide avec ton moniteur : une insertion molle sur la pénétrante coûte très cher.",
    ],

    faq: [
      {
        q: "Nice, c'est un centre difficile ?",
        r: "Intermédiaire (3/5). Les Alpes-Maritimes réussissent un peu au-dessus de la moyenne nationale (~61 % contre ~57-58 %), et Nice ville est dans la moyenne. Le secteur des Iscles est exigeant mais lisible : giratoires, tram, insertion.",
      },
      {
        q: "Je passe aux Iscles ou à Vauban ?",
        r: "C'est ton auto-école qui t'inscrit sur l'un des deux. Les Iscles, dans la plaine du Var, c'est giratoires et grands axes ; Vauban, en ville, c'est rues serrées, trafic dense et démarrages en côte. Demande à ton moniteur lequel te concerne et prépare le bon décor.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "Les giratoires mal négociés (voie ou clignotant de sortie) et les erreurs face au tram 3. Deux automatismes à blinder avant le jour J.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "L'épreuve pratique du permis B dure environ 32 minutes, dont à peu près 25 minutes de conduite. Notation sur 31 points : admis dès 20 points, sans faute éliminatoire.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Repos et logistique : repère ton trajet (le tram 3 dessert Saint-Isidore), prépare convocation et pièce d'identité, et refais mentalement le trio giratoires / tram / insertion. Le jour J, arrive 15 min en avance.",
      },
    ],
  },
  {
    slug: "rennes",
    nom: "Rennes",
    departement: "Ille-et-Vilaine",
    deptNum: "35",
    adresse: "12 rue Maurice Fabre, 35000 Rennes",
    mapsQuery: "Centre d'examen permis 12 rue Maurice Fabre 35000 Rennes",
    difficulte: 3,
    difficulteLabel: "Intermédiaire",
    quizTags: ["vitesse", "cycliste", "rond_point"],

    resume:
      "Bonne nouvelle d'entrée : l'Ille-et-Vilaine réussit le permis nettement mieux que la " +
      "moyenne nationale (environ 66 % contre ~60 %). Mais Rennes ville reste un vrai test : " +
      "depuis septembre 2023, la quasi-totalité des rues est passée à 30 km/h, et la rocade — " +
      "l'axe le plus chargé de Bretagne — peut s'inviter dans ton parcours. Le centre principal " +
      "est à Villejean, dans les locaux de la DDTM ; un second centre dessert l'agglo à " +
      "Saint-Jacques-de-la-Lande (42 allée de la Gautrais, près de l'aéroport). Bien préparé " +
      "sur ces deux ambiances — ville apaisée et rocade rapide — tu pars avec une vraie avance.",

    acces: [
      {
        ico: "map",
        texte:
          "Métro ligne a — station J.F. Kennedy, à environ 5 minutes à pied de la rue Maurice Fabre.",
      },
      {
        ico: "compass",
        texte:
          "Bus C4, 53 ou 54 — arrêt Kennedy Guyenne, à 300 m du centre (bâtiment de la DDTM).",
      },
      {
        ico: "car",
        texte:
          "En voiture : rocade (RN136), sortie Villejean, puis rue Maurice Fabre. Stationnement possible dans le secteur.",
      },
    ],

    pieges: [
      {
        ico: "alert-triangle",
        titre: "La ville entière à 30 km/h",
        texte:
          "Depuis le 4 septembre 2023, environ 95 % des rues de Rennes sont limitées à 30 km/h — " +
          "seuls les grands axes d'entrée restent à 50. Le piège : suivre le flux et rouler à 40 " +
          "« parce que ça roule ». L'inspecteur, lui, lit les panneaux. Cale-toi sur 30 par défaut " +
          "et guette les rares retours à 50.",
      },
      {
        ico: "refresh-cw",
        titre: "La rocade, l'axe le plus chargé de Bretagne",
        texte:
          "Le centre de Villejean est posé au bord de la rocade : insertion à 90 km/h dans un flux " +
          "qui dépasse les 100 000 véhicules par jour sur la section ouest. Accélération franche " +
          "dans la bretelle, contrôle rétro + angle mort, insertion décidée. Une hésitation molle " +
          "coûte très cher ici.",
      },
      {
        ico: "eye",
        titre: "Vélos et couloirs partagés",
        texte:
          "Rennes pousse fort le vélo : aménagements cyclables en développement partout et " +
          "cyclistes nombreux, surtout autour du campus de Villejean. Chaque tourne-à-droite et " +
          "chaque insertion exige le coup d'œil angle mort. C'est le contrôle qu'on oublie le plus " +
          "quand on se concentre sur la vitesse.",
      },
    ],

    conseils: [
      "Roule le secteur Villejean avant le jour J : le départ en terrain connu enlève une grosse part du stress.",
      "Travaille les deux régimes du parcours : 30 km/h en ville, 90 sur rocade. C'est la transition qui piège, pas chaque zone prise séparément.",
      "Bosse l'insertion sur la rocade avec ton moniteur aux heures creuses puis aux heures chargées : la densité change tout.",
      "Vise une conduite lisse et régulière : dans une ville à 30, la précipitation se voit immédiatement.",
    ],

    faq: [
      {
        q: "Rennes, c'est un centre difficile ?",
        r: "Intermédiaire (3/5). Le département affiche un taux de réussite au-dessus de la moyenne nationale (~66 %), mais Rennes ville ajoute deux vrais tests : la ville à 30 km/h et l'insertion sur une rocade très chargée.",
      },
      {
        q: "Il y a un ou deux centres à Rennes ?",
        r: "Deux pour l'agglo : Rennes Ouest à Villejean (12 rue Maurice Fabre, à la DDTM) et Saint-Jacques-de-la-Lande (42 allée de la Gautrais, près de l'aéroport). Ta convocation précise lequel.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "La vitesse mal calée depuis le passage de la ville à 30 km/h, et les insertions hésitantes sur la rocade. Deux points à blinder avant de te présenter.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "L'épreuve dure environ 32 minutes, dont à peu près 25 minutes de conduite effective. Elle est notée sur 31 points : admis dès 20 points, sans faute éliminatoire.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Pas de bachotage. Repasse mentalement les deux ambiances du secteur (ville à 30, rocade à 90), prépare convocation et pièce d'identité, et dors. Le jour J, arrive 15 min en avance.",
      },
    ],
  },

  {
    slug: "grenoble",
    nom: "Grenoble – La Tronche",
    departement: "Isère",
    deptNum: "38",
    adresse: "17 avenue du Grand Sablon, 38700 La Tronche",
    mapsQuery:
      "Centre d'examen permis 17 avenue du Grand Sablon 38700 La Tronche",
    difficulte: 3,
    difficulteLabel: "Intermédiaire",
    quizTags: ["cycliste", "vitesse", "priorite"],

    resume:
      "Le centre d'examen de l'agglo grenobloise est à La Tronche, avenue du Grand Sablon, " +
      "juste à côté du CHU — et le parcours t'emmène dans les communes voisines. Deux " +
      "particularités locales dominent : la métropole est passée à 30 km/h presque partout " +
      "(la première grande agglo de France à l'avoir fait), et le tramway quadrille le secteur. " +
      "Ajoute des cyclistes très nombreux et quelques rues qui grimpent vers les premières " +
      "pentes de la Chartreuse, et tu as un examen 3/5 : rien d'extrême, mais une lecture de " +
      "la route qui doit être permanente. L'Isère réussit d'ailleurs un peu au-dessus de la " +
      "moyenne nationale — la préparation paie.",

    acces: [
      {
        ico: "map",
        texte:
          "Tram B — arrêt Grand Sablon (CHU), à quelques minutes à pied du centre.",
      },
      {
        ico: "compass",
        texte:
          "Bus 13, 16 ou 62, plus des lignes Transisère : le secteur Grand Sablon / CHU est très bien desservi.",
      },
      {
        ico: "car",
        texte:
          "En voiture : par les quais de l'Isère ou la rocade Sud (N87) direction CHU. Stationnement autour du Grand Sablon souvent chargé — prévois de la marge.",
      },
    ],

    pieges: [
      {
        ico: "eye",
        titre: "Le tram est partout",
        texte:
          "Le centre est posé sur la ligne B, et le réseau traverse tout le secteur d'examen. " +
          "Voies réservées à ne jamais couper, feux spécifiques, priorité quasi systématique au " +
          "tram : chaque carrefour avec des rails demande une lecture calme et complète. " +
          "S'engager sur une plateforme de tram, c'est l'éliminatoire assuré.",
      },
      {
        ico: "alert-triangle",
        titre: "La métropole apaisée : 30 km/h par défaut",
        texte:
          "Grenoble Alpes Métropole a généralisé le 30 km/h sur 45 de ses 49 communes — le 50 " +
          "est devenu l'exception. Le piège est le même qu'ailleurs, en pire : de longues avenues " +
          "droites où l'aiguille monte toute seule. Retiens la logique locale : 30 par défaut, " +
          "50 seulement là où c'est indiqué.",
      },
      {
        ico: "refresh-cw",
        titre: "Cyclistes en continu",
        texte:
          "Grenoble est l'une des capitales françaises du vélo, avec ses grandes pistes " +
          "Chronovélo et un flux de cyclistes constant, notamment vers le campus et le CHU. " +
          "Angle mort à chaque tourne-à-droite, contrôle avant chaque insertion, et distance " +
          "d'au moins 1 m en ville pour dépasser. C'est ici que les points s'envolent bêtement.",
      },
    ],

    conseils: [
      "Roule le secteur La Tronche / CHU et les communes voisines avant le jour J : le départ avenue du Grand Sablon en terrain connu, ça change tout.",
      "Apprends à lire les carrefours à tram : feux dédiés, marquage, sens d'arrivée des rames. Un carrefour compris à l'avance est un carrefour réussi.",
      "Si le parcours grimpe vers Corenc ou Meylan, ça monte vraiment : soigne tes démarrages en côte pour ne pas reculer.",
      "Cale-toi sur 30 km/h par défaut en agglo et vérifie ton compteur régulièrement — la survitesse « involontaire » reste une faute.",
    ],

    faq: [
      {
        q: "Grenoble, c'est un centre difficile ?",
        r: "Intermédiaire (3/5). L'Isère réussit un peu au-dessus de la moyenne nationale, mais l'agglo cumule tram, vélos et 30 km/h généralisé : c'est un examen d'attention plus que de technique pure.",
      },
      {
        q: "Le centre est à Grenoble ou à La Tronche ?",
        r: "À La Tronche, au 17 avenue du Grand Sablon, juste à côté du CHU — c'est le centre qui dessert l'agglomération grenobloise. Le parcours peut ensuite explorer les communes autour.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "Les erreurs autour du tram (voie réservée coupée, feu spécifique mal lu) et l'angle mort cycliste oublié. Deux réflexes à automatiser avant de passer.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "Environ 32 minutes, dont à peu près 25 minutes de conduite effective. L'épreuve est notée sur 31 points : admis dès 20 points, sans faute éliminatoire.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Repos, pas de marathon. Repasse mentalement les trois pièges du secteur (tram, 30 km/h, cyclistes), vérifie ton trajet jusqu'au Grand Sablon et couche-toi tôt. Arrive 15 min en avance.",
      },
    ],
  },

  {
    slug: "rouen",
    nom: "Rouen",
    departement: "Seine-Maritime",
    deptNum: "76",
    adresse: "Centre Jean Texcier, 78 rue Jean Texcier, 76000 Rouen",
    mapsQuery: "Centre Jean Texcier rue Jean Texcier 76000 Rouen permis",
    difficulte: 3,
    difficulteLabel: "Intermédiaire",
    quizTags: ["priorite", "vitesse", "manoeuvre"],

    resume:
      "L'agglo de Rouen a deux centres : rive droite au centre Jean Texcier, sur le plateau " +
      "des Hauts-de-Rouen (quartier de la Grand'Mare), et rive gauche au Grand-Quevilly " +
      "(place Gabriel Péri, à la mairie annexe). La rive droite a une signature bien à elle : " +
      "la ville est construite à flanc de coteaux, donc ça monte, ça descend, et les démarrages " +
      "en côte ne sont pas une option. Ajoute la N28 avec le tunnel de la Grand'Mare juste " +
      "sous le quartier et les couloirs réservés du TEOR, et tu comprends pourquoi ce centre " +
      "se prépare. Côté chiffres, la Seine-Maritime réussit légèrement au-dessus de la moyenne " +
      "nationale : bien entraîné sur le relief, tu as toutes tes chances.",

    acces: [
      {
        ico: "map",
        texte:
          "TEOR T2 — la ligne dessert le plateau de la Grand'Mare (direction Tamarelle), arrêt à quelques minutes du centre Jean Texcier.",
      },
      {
        ico: "compass",
        texte:
          "Plusieurs lignes du réseau Astuce montent sur les Hauts-de-Rouen depuis le centre-ville — compte 20 à 25 minutes depuis la rive droite.",
      },
      {
        ico: "car",
        texte:
          "En voiture : N28 (rocade Nord-Est) sortie plateau de la Grand'Mare, parking au centre Jean Texcier.",
      },
    ],

    pieges: [
      {
        ico: "refresh-cw",
        titre: "Démarrages en côte à répétition",
        texte:
          "Rouen rive droite est bâtie sur des coteaux : le centre d'examen est sur le plateau, " +
          "et beaucoup d'itinéraires montent ou descendent vers la ville. Le démarrage en côte " +
          "doit être un réflexe : frein bien tenu, point de patinage trouvé, zéro recul. Un recul " +
          "marqué avec un véhicule derrière, c'est l'examen qui s'arrête là.",
      },
      {
        ico: "alert-triangle",
        titre: "La N28 et le tunnel de la Grand'Mare",
        texte:
          "La rocade Nord-Est passe littéralement sous le quartier, dans un tunnel de plus de " +
          "1,5 km. Si le parcours t'y emmène : insertion décidée, allure stable, distances de " +
          "sécurité rallongées et aucun changement de voie fantaisiste sous terre. C'est un " +
          "environnement que peu de candidats ont travaillé — sois de ceux qui l'ont fait.",
      },
      {
        ico: "eye",
        titre: "TEOR et couloirs réservés",
        texte:
          "Les lignes TEOR circulent en couloirs dédiés avec leurs propres feux. Le piège " +
          "classique : couper un couloir de bus en tournant, ou repartir sur un feu qui ne " +
          "s'adresse pas à toi. À chaque carrefour équipé, identifie d'abord quel signal te " +
          "concerne, puis engage-toi. La précipitation ici se paie cash.",
      },
    ],

    conseils: [
      "Fais tes heures de conduite sur le relief rouennais, pas seulement sur le plat : les côtes de la rive droite doivent devenir banales pour toi.",
      "Demande à ton moniteur un passage par la N28 et le tunnel de la Grand'Mare : rouler une fois sous terre enlève tout l'effet de surprise.",
      "Aux carrefours avec TEOR, prends une seconde de plus pour lire les feux et le marquage — mieux vaut être lent et juste que rapide et faux.",
      "Vérifie sur ta convocation quel centre te concerne : Jean Texcier (rive droite) et Grand-Quevilly (rive gauche) n'ont pas du tout le même environnement.",
    ],

    faq: [
      {
        q: "Rouen, c'est un centre difficile ?",
        r: "Intermédiaire (3/5). Le département réussit légèrement au-dessus de la moyenne nationale, mais la rive droite se mérite : relief, tunnel et couloirs TEOR demandent une vraie préparation locale.",
      },
      {
        q: "Il y a un ou deux centres à Rouen ?",
        r: "Deux pour l'agglo : Rouen rive droite au centre Jean Texcier (rue Jean Texcier, sur les Hauts-de-Rouen) et Rouen rive gauche au Grand-Quevilly (place Gabriel Péri, mairie annexe). Ta convocation indique le tien.",
      },
      {
        q: "Quelle est la cause d'échec n°1 sur ce centre ?",
        r: "Le démarrage en côte raté — recul ou calage en pleine pente — et les erreurs de lecture aux carrefours TEOR. Deux points à travailler jusqu'à l'automatisme.",
      },
      {
        q: "Combien de temps dure l'examen ?",
        r: "Environ 32 minutes, dont à peu près 25 minutes de conduite effective. L'épreuve est notée sur 31 points : admis dès 20 points, sans faute éliminatoire.",
      },
      {
        q: "Je fais quoi la veille ?",
        r: "Pas de séance marathon. Repasse mentalement les pièges du plateau (côtes, tunnel, TEOR), prépare convocation et pièce d'identité, et dors correctement. Le jour J, arrive 15 min en avance pour te poser.",
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
