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
