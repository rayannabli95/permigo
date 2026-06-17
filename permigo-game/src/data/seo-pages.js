// ═══════════════════════════════════════════════════════════════
// Contenu SEO statique — guides élève + pilier moniteur
//
// Ces données sont consommées par `scripts/build-seo.mjs` au build pour
// générer des pages HTML COMPLÈTES et indexables (hors SPA hash-router).
//
// ⚠️ Contenu 100 % ORIGINAL PermiGo. Faits permis (code 40Q/35, pratique
//    ~32 min, grille /31 seuil 20, fautes éliminatoires) = règles publiques
//    officielles, réécrites dans la voix PermiGo. Aucune copie d'un tiers.
//
// Forme d'un bloc de section :
//   { type: "p",       text }            → paragraphe
//   { type: "ul",      items: [...] }    → liste à puces
//   { type: "callout", text }            → encart mis en avant
//   { type: "h3",      text }            → sous-titre
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// GUIDES ÉLÈVE (evergreen, haut de funnel)
// ─────────────────────────────────────────────────────────────
export const GUIDES = [
  {
    slug: "reviser-le-code",
    metaTitle:
      "Comment réviser le code de la route efficacement (méthode 2026)",
    metaDesc:
      "La méthode pour réviser le code de la route sans t'épuiser : petites sessions quotidiennes, séries blanches, et travail des erreurs. Réussis tes 35/40.",
    h1: "Comment réviser le code de la route efficacement",
    lead: "Réviser le code, ce n'est pas lire le livret dix fois d'affilée la veille. C'est s'entraîner un peu chaque jour, comprendre ses erreurs, et arriver à l'examen avec des réflexes — pas juste de la mémoire. Voici la méthode qui marche.",
    sections: [
      {
        h2: "Le seul objectif : 35 bonnes réponses sur 40",
        blocks: [
          {
            type: "p",
            text: "L'examen du code (l'ETG, épreuve théorique générale) compte 40 questions. Il te faut au moins 35 bonnes réponses : tu as donc droit à 5 fautes maximum. Une fois le code obtenu, il reste valable 5 ans pour passer l'épreuve pratique.",
          },
          {
            type: "callout",
            text: "La vraie cible n'est pas « connaître le code » dans l'absolu, mais dépasser 35/40 de façon RÉGULIÈRE sur des séries blanches. Si tu fais 37, 36, 38 sur trois séries d'affilée, tu es prêt.",
          },
        ],
      },
      {
        h2: "1. Des petites sessions tous les jours, pas un marathon",
        blocks: [
          {
            type: "p",
            text: "Le cerveau retient mieux ce qu'il revoit souvent et espacé dans le temps (c'est la répétition espacée). Dix minutes par jour battent trois heures le dimanche. L'idéal : une courte série de questions le matin ou dans les transports, tous les jours, jusqu'à l'examen.",
          },
          {
            type: "ul",
            items: [
              "10 à 15 minutes par jour, mais TOUS les jours.",
              "Toujours à la même heure : ça devient une habitude, plus une corvée.",
              "Mieux vaut 3 séries de 10 questions dans la semaine qu'une série de 40 d'un coup.",
            ],
          },
        ],
      },
      {
        h2: "2. Travaille tes erreurs, pas tes réussites",
        blocks: [
          {
            type: "p",
            text: "La plupart des candidats refont les thèmes qu'ils maîtrisent déjà (rassurant, mais inutile). Le vrai progrès vient des questions ratées. Après chaque série, relis CHAQUE erreur et demande-toi : « pourquoi la bonne réponse est la bonne ? ». Tant que tu ne sais pas l'expliquer, le thème n'est pas acquis.",
          },
          {
            type: "callout",
            text: "Garde une liste de tes thèmes faibles (priorités, vitesses, distances de sécurité, signalisation…) et attaque-les en priorité. C'est là que se gagnent ou se perdent les 5 fautes.",
          },
        ],
      },
      {
        h2: "3. Lis la question en entier — les pièges sont dans les mots",
        blocks: [
          {
            type: "p",
            text: "Beaucoup d'échecs ne viennent pas d'un manque de connaissance mais d'une lecture trop rapide. « Je dois », « je peux », « il est interdit de », « tous », « certains » : ces mots changent tout. Lis la question deux fois, repère le mot-clé, puis réponds.",
          },
          {
            type: "ul",
            items: [
              "Attention aux questions à double réponse : il faut TOUTES les bonnes cases pour avoir le point.",
              "Méfie-toi des « toujours » et « jamais » : souvent faux.",
              "Une image vaut une lecture : regarde les panneaux, le marquage au sol, les autres usagers avant de répondre.",
            ],
          },
        ],
      },
      {
        h2: "4. Passe en conditions réelles avant le jour J",
        blocks: [
          {
            type: "p",
            text: "Les dernières semaines, enchaîne des séries blanches de 40 questions, chronométrées, sans pause et sans regarder les corrections en cours de route — exactement comme à l'examen. C'est ce qui transforme tes connaissances en performance le jour J.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Combien de fautes sont autorisées au code de la route ?",
        r: "5 fautes maximum. Il faut obtenir au moins 35 bonnes réponses sur 40 pour réussir l'examen du code.",
      },
      {
        q: "Combien de temps faut-il pour réviser le code ?",
        r: "Tout dépend du rythme, mais avec 10 à 15 minutes par jour, la plupart des candidats sont prêts en 4 à 8 semaines. La régularité compte bien plus que le nombre d'heures.",
      },
      {
        q: "Le code est-il valable combien de temps ?",
        r: "Une fois obtenu, le code reste valable 5 ans pour passer l'épreuve pratique, dans la limite de 5 présentations à l'examen de conduite.",
      },
    ],
    cta: {
      text: "Révise le code en 10 min/jour avec PermiGo",
      sub: "Séries quotidiennes, suivi de tes thèmes faibles, examens blancs. Gratuit pour commencer.",
      href: "/#/signup",
    },
  },

  {
    slug: "examen-blanc-code",
    metaTitle:
      "Examen blanc du code : pourquoi (et comment) t'entraîner pour de vrai",
    metaDesc:
      "L'examen blanc du code reproduit les conditions réelles : 40 questions, le chrono, le stress. C'est le meilleur test pour savoir si tu es prêt à passer.",
    h1: "Examen blanc du code : le test qui dit si tu es prêt",
    lead: "Un examen blanc, c'est une série de 40 questions dans les conditions de l'examen officiel : le format, le rythme, le chrono. C'est le seul vrai moyen de savoir si tu es prêt — bien plus fiable que ton ressenti.",
    sections: [
      {
        h2: "Pourquoi l'examen blanc change tout",
        blocks: [
          {
            type: "p",
            text: "Réviser thème par thème te donne des connaissances. L'examen blanc, lui, mesure ta performance globale sous pression : gérer 40 questions d'affilée, ne pas paniquer sur une question difficile, garder de l'attention jusqu'à la dernière. C'est une compétence en soi, et elle se travaille.",
          },
          {
            type: "callout",
            text: "Règle simple : ne réserve ton examen officiel que quand tu dépasses 35/40 sur plusieurs examens blancs d'affilée. Pas une fois par chance — plusieurs fois de suite.",
          },
        ],
      },
      {
        h2: "Comment faire un examen blanc qui sert vraiment",
        blocks: [
          {
            type: "ul",
            items: [
              "40 questions d'un coup, sans pause.",
              "Sans regarder les corrections pendant la série (tu corriges tout à la fin).",
              "Dans un endroit calme, comme le jour J.",
              "Tu notes ton score à chaque fois pour suivre ta progression.",
            ],
          },
          {
            type: "p",
            text: "Après la série, l'étape la plus importante : reprends chaque faute, comprends-la, et repère le thème. Trois examens blancs analysés valent dix séries faites à la va-vite.",
          },
        ],
      },
      {
        h2: "Lire ton score intelligemment",
        blocks: [
          {
            type: "p",
            text: "Un 33/40 n'est pas « presque bon » : c'est encore 2 fautes de trop. Mais regarde surtout OÙ tu perds. Si tes 5 erreurs sont éparpillées sur 5 thèmes différents, tu es plus proche que si elles sont toutes concentrées sur un thème que tu ne maîtrises pas du tout.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "À partir de quel score puis-je réserver l'examen du code ?",
        r: "Quand tu dépasses 35/40 de façon régulière sur plusieurs examens blancs d'affilée — pas une seule fois. La régularité est le meilleur indicateur que tu es prêt.",
      },
      {
        q: "Un examen blanc est-il vraiment comme l'examen officiel ?",
        r: "Oui sur le format : 40 questions, conditions chronométrées, pas de correction en cours de route. C'est l'entraînement le plus proche du jour J.",
      },
    ],
    cta: {
      text: "Lance un examen blanc dans PermiGo",
      sub: "Conditions réelles, score suivi, erreurs expliquées. Commence gratuitement.",
      href: "/#/signup",
    },
  },

  {
    slug: "fautes-eliminatoires-permis",
    metaTitle: "Les fautes éliminatoires au permis : la liste à connaître",
    metaDesc:
      "Une faute éliminatoire = échec immédiat à l'examen pratique, quel que soit ton score. Voici la liste des fautes éliminatoires et comment les éviter.",
    h1: "Les fautes éliminatoires à l'examen du permis",
    lead: "À l'épreuve pratique, tu es noté sur une grille de compétences. Mais certaines erreurs ne se discutent pas : ce sont les fautes éliminatoires. Une seule suffit à faire échouer l'examen, même avec un bon score partout ailleurs. Les connaître, c'est déjà les éviter.",
    sections: [
      {
        h2: "Comment fonctionne la notation",
        blocks: [
          {
            type: "p",
            text: "L'épreuve pratique du permis B est évaluée sur une grille de compétences notée sur 31 points. Pour réussir, il faut obtenir au moins 20 points sur 31 ET ne commettre aucune faute éliminatoire. Tu peux donc avoir un excellent parcours et échouer à cause d'une seule faute éliminatoire.",
          },
          {
            type: "callout",
            text: "La logique est simple : la grille mesure ta conduite globale, la faute éliminatoire sanctionne ce qui met en danger. Sécurité d'abord — toujours.",
          },
        ],
      },
      {
        h2: "Les fautes éliminatoires les plus fréquentes",
        blocks: [
          {
            type: "ul",
            items: [
              "Provoquer une situation dangereuse pour toi ou les autres usagers.",
              "Obliger l'examinateur à intervenir (volant, pédale de frein) pour éviter un risque.",
              "Ne pas respecter un signal imposant l'arrêt : feu rouge, panneau STOP.",
              "Franchir ou chevaucher une ligne continue de façon dangereuse.",
              "Circuler à contresens ou refuser une priorité (piéton engagé, priorité à droite, cycliste…).",
              "Rouler à une vitesse clairement excessive ou inadaptée.",
            ],
          },
          {
            type: "p",
            text: "La conséquence est la même pour toutes : échec immédiat, quel que soit le reste de la prestation. Inutile de « rattraper » après — d'où l'importance de la vigilance du début à la fin.",
          },
        ],
      },
      {
        h2: "Comment les éviter le jour J",
        blocks: [
          {
            type: "ul",
            items: [
              "Contrôle systématique des angles morts à chaque changement de direction ou d'allure.",
              "Anticipe : regarde loin devant pour ne jamais être surpris par un feu, un stop ou un piéton.",
              "Marque vraiment l'arrêt au STOP (roues immobiles), même si la voie semble dégagée.",
              "Surveille ton compteur sur les axes roulants : la survitesse involontaire est un piège classique.",
              "En cas de doute, ralentis et cède le passage : la prudence n'est jamais sanctionnée.",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: "Combien de points faut-il pour avoir le permis ?",
        r: "Il faut obtenir au moins 20 points sur 31 à la grille d'évaluation, et ne commettre aucune faute éliminatoire.",
      },
      {
        q: "Une seule faute éliminatoire fait-elle échouer ?",
        r: "Oui. Une faute éliminatoire entraîne l'échec immédiat de l'examen, quel que soit le score obtenu sur le reste du parcours.",
      },
      {
        q: "Le fait que l'examinateur touche le volant est-il éliminatoire ?",
        r: "Oui. Si l'examinateur doit intervenir sur les commandes (frein ou volant) pour éviter un danger, c'est une faute éliminatoire.",
      },
    ],
    cta: {
      text: "Entraîne tes réflexes anti-faute avec PermiGo",
      sub: "Questions ciblées sur les priorités, vitesses et angles morts. Gratuit pour démarrer.",
      href: "/#/signup",
    },
  },

  {
    slug: "deroulement-examen-pratique",
    metaTitle:
      "Comment se passe l'examen pratique du permis B (déroulement complet)",
    metaDesc:
      "Durée, étapes, manœuvre, questions de vérification, bilan : voici comment se déroule l'examen pratique du permis B, minute par minute, pour arriver serein.",
    h1: "Le déroulement de l'examen pratique du permis B",
    lead: "Savoir exactement comment se passe l'examen enlève une grosse part du stress. Voici les étapes, de l'accueil par l'examinateur jusqu'au résultat, pour que rien ne te surprenne le jour J.",
    sections: [
      {
        h2: "Combien de temps dure l'examen ?",
        blocks: [
          {
            type: "p",
            text: "L'épreuve pratique dure environ 32 minutes, dont à peu près 25 minutes de conduite effective. Le reste, c'est l'accueil, les vérifications, les questions et le bilan. Arrive 15 minutes en avance pour te poser et faire baisser la tension.",
          },
        ],
      },
      {
        h2: "Les grandes étapes",
        blocks: [
          {
            type: "h3",
            text: "1. L'accueil et l'installation",
          },
          {
            type: "p",
            text: "L'examinateur vérifie ton identité, t'invite à t'installer et à régler ton poste de conduite (siège, rétroviseurs, ceinture). Prends ton temps : un poste de conduite bien réglé, c'est déjà un point pour toi.",
          },
          {
            type: "h3",
            text: "2. La conduite autonome et le parcours",
          },
          {
            type: "p",
            text: "Tu conduis pendant la majeure partie de l'épreuve. Une partie inclut un temps de conduite « autonome » où tu suis une direction ou un objectif sans guidage permanent. L'examinateur observe ta sécurité, ton autonomie, ton partage de la route et ton attitude au volant.",
          },
          {
            type: "h3",
            text: "3. Une manœuvre",
          },
          {
            type: "p",
            text: "Tu réalises au moins une manœuvre (créneau, rangement en bataille ou en épi, demi-tour, freinage…). L'important n'est pas la perfection au centimètre mais la sécurité : contrôles, lenteur maîtrisée, et la capacité à te reprendre proprement si besoin.",
          },
          {
            type: "h3",
            text: "4. Les questions de vérification et de sécurité",
          },
          {
            type: "p",
            text: "L'examinateur te pose des questions : une vérification technique sur le véhicule (intérieure ou extérieure) et une question liée à la sécurité routière ou aux premiers secours. Elles ne sont pas piège : elles se préparent à l'avance avec ton moniteur.",
          },
          {
            type: "h3",
            text: "5. Le bilan",
          },
          {
            type: "p",
            text: "L'examen se termine, mais l'examinateur ne te donne pas le résultat sur place. Tu le reçois ensuite, généralement sous 48 heures, sur le site officiel des résultats.",
          },
        ],
      },
      {
        h2: "Ce qui se joue vraiment",
        blocks: [
          {
            type: "callout",
            text: "L'examinateur ne cherche pas un pilote parfait : il cherche quelqu'un capable de conduire seul, en sécurité, sans le mettre en danger. Régularité, anticipation et contrôles valent mieux qu'une performance brillante mais risquée.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Combien de temps dure l'examen pratique du permis ?",
        r: "Environ 32 minutes au total, dont à peu près 25 minutes de conduite effective.",
      },
      {
        q: "Quand reçoit-on le résultat du permis ?",
        r: "Le résultat n'est pas donné sur place. Il est disponible généralement sous 48 heures sur le site officiel des résultats du permis.",
      },
      {
        q: "Y a-t-il des questions à l'examen pratique ?",
        r: "Oui : une question de vérification technique sur le véhicule et une question de sécurité routière ou de premiers secours. Elles se préparent à l'avance.",
      },
    ],
    cta: {
      text: "Prépare le jour J avec PermiGo",
      sub: "Vérifications, sécurité, pièges des centres d'examen. Commence gratuitement.",
      href: "/#/signup",
    },
  },
];

// ─────────────────────────────────────────────────────────────
// PILIER MONITEUR (page money — reprend la copy GTM validée)
// ─────────────────────────────────────────────────────────────
export const MONITEUR_PILLAR = {
  slug: "pour-moniteurs",
  metaTitle: "PermiGo — l'app à TA marque pour moniteur indépendant",
  metaDesc:
    "L'app d'entraînement au permis à ta marque, qui rend tes élèves accros à réviser entre les leçons et prouve tes résultats. Pas une plateforme qui te prend tes élèves. 9,99 €/mois.",
  h1: "Ton app de permis. À ton nom. Pas à celui d'une plateforme.",
  lead: "PermiGo, c'est l'outil du moniteur indépendant : une app d'entraînement à ta marque qui garde tes élèves actifs entre les leçons, et qui matérialise ton travail — qui progresse, qui est prêt, ton taux de réussite. Tes élèves, ta marque, tes résultats.",
  sections: [
    {
      h2: "Le problème : entre deux leçons, ton élève est seul",
      blocks: [
        {
          type: "p",
          text: "Un bon moniteur, ça se voit en leçon. Mais entre deux leçons, l'élève décroche : il ne révise pas, il oublie, il revient en ayant régressé. Et le livret papier que personne ne regarde ne prouve rien à personne.",
        },
        {
          type: "callout",
          text: "PermiGo comble ce vide : tes élèves s'entraînent quand tu n'es pas là, tu vois leur progression en temps réel, et ton travail devient enfin visible. À ton nom.",
        },
      ],
    },
    {
      h2: "3 raisons d'en faire ton outil",
      blocks: [
        {
          type: "h3",
          text: "1. À ton nom, pas à celui d'Ornikar",
        },
        {
          type: "p",
          text: "Les plateformes outillent le moniteur, mais à LEUR marque — et elles possèdent ton élève. PermiGo fait l'inverse : l'app et le suivi sont à TA marque. L'élève est à toi, la relation est à toi.",
        },
        {
          type: "h3",
          text: "2. Tes élèves reviennent tout seuls",
        },
        {
          type: "p",
          text: "Parcours gamifié, séries quotidiennes, examens blancs, défis : l'élève prend l'habitude de réviser sans que tu aies à le relancer. Un élève qui s'entraîne entre les leçons, c'est un élève qui progresse plus vite — et un taux de réussite qui monte.",
        },
        {
          type: "h3",
          text: "3. La preuve qui remplit ton agenda",
        },
        {
          type: "p",
          text: "Tu vois qui progresse, qui est prêt à présenter, et tu construis un taux de réussite à TON nom. Cette preuve, c'est ton meilleur argument pour signer de nouveaux élèves.",
        },
      ],
    },
    {
      h2: "Simple, sans engagement",
      blocks: [
        {
          type: "p",
          text: "Abonnement individuel à 9,99 €/mois, sans engagement, en self-service. Pas de logiciel lourd, pas d'installation compliquée : tu invites tes élèves, ils révisent, tu pilotes. C'est tout.",
        },
      ],
    },
  ],
  faq: [
    {
      q: "PermiGo, c'est quoi exactement ?",
      r: "Une app d'entraînement au permis à la marque du moniteur indépendant. Tes élèves révisent entre les leçons (quiz, parcours, examens blancs) et tu suis leur progression et qui est prêt à présenter.",
    },
    {
      q: "En quoi c'est différent d'Ornikar ou En Voiture Simone ?",
      r: "Ces plateformes possèdent l'élève et travaillent à leur marque. PermiGo est TON outil, à TA marque : l'élève et la relation restent à toi.",
    },
    {
      q: "Combien ça coûte ?",
      r: "9,99 €/mois, sans engagement, en abonnement individuel self-service.",
    },
    {
      q: "Faut-il installer un logiciel ?",
      r: "Non. PermiGo est une application web : tu invites tes élèves, ils révisent depuis leur téléphone, tu pilotes depuis le tien.",
    },
  ],
  cta: {
    text: "Essayer PermiGo (9,99 €/mois, sans engagement)",
    sub: "Mets en place l'app à ta marque avec quelques élèves cette semaine.",
    href: "/#/signup",
  },
};
