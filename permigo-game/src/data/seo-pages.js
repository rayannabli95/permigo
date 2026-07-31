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
    lead: "Réviser le code, ce n'est pas lire le livret dix fois d'affilée la veille. C'est s'entraîner un peu chaque jour, comprendre ses erreurs, et arriver à l'examen avec des réflexes. Pas juste de la mémoire. Voici la méthode qui marche.",
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
        h2: "3. Lis la question en entier. Les pièges sont dans les mots",
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
            text: "Les dernières semaines, enchaîne des séries blanches de 40 questions, chronométrées, sans pause et sans regarder les corrections en cours de route. Exactement comme à l'examen. C'est ce qui transforme tes connaissances en performance le jour J.",
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
    lead: "Un examen blanc, c'est une série de 40 questions dans les conditions de l'examen officiel : le format, le rythme, le chrono. C'est le seul vrai moyen de savoir si tu es prêt. Bien plus fiable que ton ressenti.",
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
            text: "Règle simple : ne réserve ton examen officiel que quand tu dépasses 35/40 sur plusieurs examens blancs d'affilée. Pas une fois par chance. Plusieurs fois de suite.",
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
        r: "Quand tu dépasses 35/40 de façon régulière sur plusieurs examens blancs d'affilée. Pas une seule fois. La régularité est le meilleur indicateur que tu es prêt.",
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
            text: "La logique est simple : la grille mesure ta conduite globale, la faute éliminatoire sanctionne ce qui met en danger. Sécurité d'abord. Toujours.",
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
            text: "La conséquence est la même pour toutes : échec immédiat, quel que soit le reste de la prestation. Inutile de « rattraper » après. D'où l'importance de la vigilance du début à la fin.",
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

  {
    slug: "conduite-supervisee",
    metaTitle:
      "Conduite supervisée : conditions, démarches et vrais avantages (2026)",
    metaDesc:
      "Dès 18 ans, la conduite supervisée te fait rouler avec un accompagnateur entre les leçons : moins d'heures payées, plus d'expérience. Conditions et démarches.",
    h1: "Conduite supervisée : rouler plus, payer moins",
    lead: "La conduite supervisée, c'est le droit de conduire avec un accompagnateur (parent, proche) en dehors des leçons, dès 18 ans. Résultat : tu engranges de l'expérience sans payer une leçon à chaque sortie, et tu arrives à l'examen avec beaucoup plus de kilomètres dans les mains. Voici comment ça marche, sans jargon.",
    sections: [
      {
        h2: "C'est quoi, exactement ?",
        blocks: [
          {
            type: "p",
            text: "La conduite supervisée est une option de la formation classique au permis B, réservée aux 18 ans et plus. Après ta formation initiale en auto-école ou avec ton moniteur indépendant, tu continues à conduire au quotidien avec un accompagnateur, en attendant (ou en préparant) ton passage à l'examen.",
          },
          {
            type: "callout",
            text: "À ne pas confondre avec la conduite accompagnée (AAC) : l'AAC se commence dès 15 ans avec un minimum d'un an et de 3 000 km avant l'examen. La supervisée, elle, est accessible dès 18 ans, sans minimum de durée ni de kilomètres.",
          },
        ],
      },
      {
        h2: "Les conditions pour s'y mettre",
        blocks: [
          {
            type: "ul",
            items: [
              "Avoir 18 ans ou plus et le code en poche.",
              "Avoir suivi ta formation initiale (les 20 heures minimum) et obtenu l'accord de ton moniteur : c'est lui qui valide que ton niveau est suffisant.",
              "L'accord écrit de ton assureur : l'accompagnateur fait ajouter une extension de garantie sur le véhicule utilisé.",
              "Un rendez-vous préalable d'au moins 2 heures avec ton accompagnateur à bord, encadré par le moniteur.",
            ],
          },
          {
            type: "p",
            text: "L'accompagnateur doit être titulaire du permis B depuis au moins 5 ans sans interruption. Il peut y en avoir plusieurs (les deux parents, un grand frère…), tant que chacun est déclaré à l'assurance.",
          },
        ],
      },
      {
        h2: "Pourquoi ça change tout",
        blocks: [
          {
            type: "p",
            text: "Le premier bénéfice est financier : chaque heure passée au volant avec ton accompagnateur est une heure d'expérience gratuite, là où une leçon se paie. Le second est statistique : plus tu roules dans des situations variées (pluie, nuit, ville, voie rapide), plus tes automatismes sont solides le jour J.",
          },
          {
            type: "ul",
            items: [
              "Tu gardes le rythme entre les leçons au lieu de tout perdre d'une semaine à l'autre.",
              "Tu peux t'y mettre aussi APRÈS un échec à l'examen, pour rester au niveau en attendant une nouvelle place.",
              "Ton moniteur voit ta progression réelle et cible les leçons sur ce qui coince vraiment.",
            ],
          },
        ],
      },
      {
        h2: "Comment bien l'utiliser",
        blocks: [
          {
            type: "p",
            text: "La supervisée n'est utile que si tu roules régulièrement. Vise plusieurs sorties par semaine, même courtes : aller chercher le pain, déposer quelqu'un, un trajet de nuit de temps en temps. Varie les contextes, et note ce qui t'a mis en difficulté pour le retravailler.",
          },
          {
            type: "callout",
            text: "Entre deux sorties, révise le geste : c'est exactement le rôle de PermiGo. Tu retravailles les compétences du permis (giratoires, priorités, manœuvres…) en quiz et en situations, et tu arrives à la sortie suivante avec le réflexe déjà en tête.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "La conduite supervisée est-elle obligatoire ?",
        r: "Non, c'est une option. Mais elle est fortement recommandée si tu peux avoir un accompagnateur : plus d'expérience pour moins d'argent.",
      },
      {
        q: "Il faut combien de kilomètres avant l'examen ?",
        r: "Aucun minimum n'est imposé en supervisée (contrairement à la conduite accompagnée). C'est la régularité qui compte.",
      },
      {
        q: "Qui peut être accompagnateur ?",
        r: "Une personne titulaire du permis B depuis au moins 5 ans sans interruption, déclarée à l'assurance du véhicule. Plusieurs accompagnateurs sont possibles.",
      },
      {
        q: "Je peux passer en supervisée après un échec à l'examen ?",
        r: "Oui, c'est même un cas très courant : ça permet de continuer à rouler sans multiplier les leçons en attendant une nouvelle place d'examen.",
      },
      {
        q: "Est-ce que ça réduit la période probatoire ?",
        r: "Non. C'est la conduite accompagnée (AAC) qui réduit la période probatoire à 2 ans. La supervisée garde la période normale de 3 ans.",
      },
    ],
    cta: {
      text: "Garde le niveau entre deux sorties avec PermiGo",
      sub: "Quiz et mises en situation sur les compétences du permis. Gratuit pour commencer.",
      href: "/#/signup",
    },
  },

  {
    slug: "combien-heures-de-conduite",
    metaTitle:
      "Combien d'heures de conduite avant l'examen ? (minimum légal vs réalité)",
    metaDesc:
      "20 h minimum légal, ~30-35 h en moyenne réelle : ce qui fait varier le nombre d'heures de conduite, et comment en faire moins sans bâcler.",
    h1: "Combien d'heures de conduite faut-il vraiment ?",
    lead: "Le minimum légal, c'est 20 heures. La réalité, c'est qu'un candidat passe l'examen après 30 à 35 heures en moyenne. Entre les deux, il y a ta régularité, ta façon de réviser entre les leçons, et quelques choix malins. On fait le tri.",
    sections: [
      {
        h2: "Les chiffres de base",
        blocks: [
          {
            type: "ul",
            items: [
              "20 heures minimum de formation pratique en boîte manuelle. C'est la loi, aucune présentation à l'examen en dessous.",
              "13 heures minimum si tu passes le permis en boîte automatique.",
              "Dans les faits, la moyenne nationale tourne autour de 30 à 35 heures avant la réussite.",
            ],
          },
          {
            type: "p",
            text: "Pourquoi cet écart entre le minimum et la réalité ? Parce que le minimum est pensé comme un plancher de sécurité, pas comme une promesse. La vraie question n'est pas « combien d'heures » mais « suis-je capable de conduire seul en sécurité ». C'est ça que l'examinateur évalue.",
          },
        ],
      },
      {
        h2: "Ce qui fait grimper (ou baisser) le compteur",
        blocks: [
          {
            type: "ul",
            items: [
              "La fréquence : deux à trois leçons par semaine font progresser bien plus vite qu'une leçon isolée. Tu ne repars pas de zéro à chaque fois.",
              "Ce que tu fais ENTRE les leçons : réviser les compétences, revoir tes erreurs, mentaliser les parcours. Une leçon préparée vaut presque le double.",
              "La conduite supervisée ou accompagnée : chaque heure avec un accompagnateur est une heure d'expérience non facturée.",
              "La régularité du moniteur : un moniteur qui te suit vraiment cible les heures sur tes points faibles au lieu de dérouler un programme générique.",
            ],
          },
          {
            type: "callout",
            text: "Le piège classique : espacer les leçons pour « étaler le budget ». Résultat, chaque leçon commence par re-dérouiller la précédente, et le total d'heures explose. Mieux vaut un rythme dense sur une période courte.",
          },
        ],
      },
      {
        h2: "Comment faire moins d'heures sans bâcler",
        blocks: [
          {
            type: "p",
            text: "Réduire les heures, ce n'est pas rogner sur la sécurité : c'est faire en sorte que chaque heure payée serve à apprendre du neuf, pas à réviser du perdu.",
          },
          {
            type: "ul",
            items: [
              "Arrive à ta leçon en sachant ce que tu vas travailler. Et repars en sachant ce que tu dois consolider.",
              "Travaille la théorie du geste hors voiture : giratoires, priorités, contrôles, manœuvres se comprennent très bien à tête reposée.",
              "Si tu le peux, ajoute la conduite supervisée dès que ton moniteur te valide le niveau.",
              "Passe en boîte automatique si la manuelle n'est pas un besoin pour toi : 13 h minimum au lieu de 20, et un apprentissage plus simple.",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: "Peut-on passer l'examen avec seulement 20 heures ?",
        r: "Légalement oui, si ton moniteur estime que tu es prêt. Dans les faits, c'est rare : la moyenne réelle est plutôt de 30 à 35 heures. L'objectif n'est pas le minimum, c'est d'être prêt.",
      },
      {
        q: "Boîte automatique : c'est vraiment plus court ?",
        r: "Oui : 13 heures minimum au lieu de 20, et moins de choses à gérer (pas d'embrayage ni de passage de vitesses). En contrepartie, ton permis est d'abord limité aux boîtes automatiques. Il peut être étendu ensuite par une formation courte de 7 h.",
      },
      {
        q: "Combien de leçons par semaine, idéalement ?",
        r: "Deux à trois. En dessous, tu perds entre chaque leçon ce que tu as gagné pendant. Au-dessus, tu n'as pas le temps de digérer.",
      },
      {
        q: "Comment savoir si je suis prêt pour l'examen ?",
        r: "Quand les compétences du programme (le référentiel REMC) sont validées par ton moniteur et que tu conduis de façon autonome sans être guidé. Pas avant. Présenter trop tôt, c'est payer une présentation pour rien.",
      },
    ],
    cta: {
      text: "Rentabilise chaque heure de conduite avec PermiGo",
      sub: "Révise les compétences entre les leçons et arrive préparé. Gratuit pour commencer.",
      href: "/#/signup",
    },
  },

  {
    slug: "rater-son-permis",
    metaTitle: "Rater son permis : et maintenant ? (délais, repassage, mental)",
    metaDesc:
      "Échouer à l'examen du permis arrive à plus de 4 candidats sur 10. Ce qu'il faut faire dans l'ordre : lire ton bilan, garder le rythme, repasser au bon moment.",
    h1: "Tu as raté ton permis ? Voilà le plan.",
    lead: "D'abord, remets les choses à leur place : plus de 4 candidats sur 10 échouent à leur premier passage. Ce n'est ni rare, ni définitif, ni un jugement sur ta capacité à conduire un jour. Ce qui compte maintenant, c'est ce que tu fais des trois prochaines semaines.",
    sections: [
      {
        h2: "Étape 1 : lis vraiment ton bilan",
        blocks: [
          {
            type: "p",
            text: "Ton résultat arrive en général sous 48 heures sur le site officiel, avec le bilan de l'examinateur (le CEPC) : la note sur 31, le détail par compétence, et surtout ce qui t'a coûté l'examen. Une note trop basse ou une erreur éliminatoire.",
          },
          {
            type: "callout",
            text: "Le CEPC n'est pas une sanction, c'est une feuille de route : il te dit EXACTEMENT quoi retravailler. La plupart des échecs tiennent à un ou deux points précis, pas à un niveau global insuffisant.",
          },
        ],
      },
      {
        h2: "Étape 2 : ne coupe pas le moteur",
        blocks: [
          {
            type: "p",
            text: "L'erreur classique après un échec : tout arrêter en attendant la nouvelle date. Trois semaines sans conduire ni réviser, et tu repasses moins bon qu'au premier essai. Garde un rythme, même léger.",
          },
          {
            type: "ul",
            items: [
              "Une ou deux leçons ciblées sur les points du bilan. Pas besoin de tout refaire.",
              "La conduite supervisée si tu as un accompagnateur : rouler sans payer, exactement ce qu'il te faut.",
              "Dix minutes de révision par jour sur les compétences qui ont pêché : giratoires, priorités, contrôles…",
            ],
          },
        ],
      },
      {
        h2: "Étape 3 : repasse au bon moment",
        blocks: [
          {
            type: "p",
            text: "Ton code reste valable 5 ans, dans la limite de 5 présentations à l'épreuve pratique. Pour la nouvelle date, les délais varient beaucoup selon les départements : de quelques semaines à plusieurs mois. Ton moniteur (ou la réservation en ligne pour les candidats libres) te trouvera la prochaine place.",
          },
          {
            type: "p",
            text: "Le bon moment pour repasser, c'est quand les points du bilan sont corrigés ET que tu enchaînes des conduites propres. Pas juste quand une place se libère. Se représenter trop tôt, c'est risquer de griller une présentation.",
          },
        ],
      },
      {
        h2: "Et dans la tête ?",
        blocks: [
          {
            type: "p",
            text: "Un examen note une conduite de 32 minutes un jour donné. Pas ta valeur, pas ton avenir de conducteur. Le stress du premier passage est d'ailleurs souvent la vraie cause de l'échec, et il baisse naturellement au second : tu sais désormais exactement à quoi ressemble l'épreuve.",
          },
          {
            type: "callout",
            text: "Statistiquement, tes chances augmentent au deuxième passage. Prépare les points du bilan, garde le rythme, et vas-y en connaissance de cause.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Combien de temps avant de pouvoir repasser ?",
        r: "Il n'y a pas de délai légal imposé, c'est la disponibilité des places qui décide : de quelques semaines à plusieurs mois selon ton département.",
      },
      {
        q: "Est-ce que je dois repayer des heures de conduite ?",
        r: "Pas forcément un gros volume : quelques heures ciblées sur les points du bilan suffisent souvent, surtout si tu gardes le rythme en supervisée ou en révisant entre-temps.",
      },
      {
        q: "Mon code est encore valable ?",
        r: "Oui : 5 ans à partir de son obtention, dans la limite de 5 présentations à l'épreuve pratique.",
      },
      {
        q: "Une faute éliminatoire, ça veut dire que je conduis mal ?",
        r: "Non. Une éliminatoire sanctionne UNE situation où l'examinateur a dû intervenir ou a jugé un danger. Souvent un réflexe précis à corriger (un contrôle oublié, une priorité). C'est ciblé, donc corrigeable.",
      },
      {
        q: "Combien de candidats réussissent du premier coup ?",
        r: "Environ un peu plus de la moitié des présentations au permis B sont des réussites. Échouer une fois te met littéralement dans la norme.",
      },
    ],
    cta: {
      text: "Corrige les points de ton bilan avec PermiGo",
      sub: "Révise compétence par compétence et reviens plus fort au prochain passage.",
      href: "/#/signup",
    },
  },

  {
    slug: "prix-permis-moniteur-independant",
    metaTitle:
      "Prix du permis avec un moniteur indépendant : combien ça coûte vraiment ?",
    metaDesc:
      "Heures à l'unité, pas de frais de structure, suivi direct : ce que coûte le permis avec un moniteur indépendant, et comment payer moins sans bâcler.",
    h1: "Le permis avec un moniteur indépendant : combien ça coûte ?",
    lead: "Le permis B coûte en moyenne entre 1 500 et 2 000 € en France, tout compris. Passer par un moniteur indépendant change la structure du prix : tu paies la personne qui t'apprend à conduire, pas les murs d'une agence. Voici comment lire les prix. Et surtout comment faire baisser la facture intelligemment.",
    sections: [
      {
        h2: "Comment se décompose le prix",
        blocks: [
          {
            type: "ul",
            items: [
              "L'heure de conduite : le gros du budget. Selon la région et le moniteur, compte généralement entre 35 et 55 € de l'heure.",
              "Le code : entraînement en ligne et présentation à l'examen (l'examen lui-même coûte 30 € chez les opérateurs agréés).",
              "Les frais de présentation à l'épreuve pratique et, parfois, la location du véhicule pour le jour J.",
            ],
          },
          {
            type: "p",
            text: "Chez un moniteur indépendant, tu paies souvent les heures à l'unité ou par petits packs, sans frais de dossier ni forfait rigide. Avantage : tu ajustes au fil de ta progression. Point de vigilance : compare bien ce qui est inclus (présentation à l'examen, voiture le jour J).",
          },
        ],
      },
      {
        h2: "Indépendant ou agence : ce qui change vraiment",
        blocks: [
          {
            type: "ul",
            items: [
              "Le suivi : c'est le même moniteur du début à la fin. Il connaît tes points faibles par cœur. Pas besoin de re-expliquer ton niveau à chaque leçon.",
              "La souplesse : créneaux directs avec le moniteur, sans passer par un planning d'agence.",
              "Le prix : pas de local commercial à financer, ce qui se retrouve souvent dans le tarif horaire ou dans l'absence de frais annexes.",
            ],
          },
          {
            type: "callout",
            text: "Le vrai levier d'économie n'est pas de trouver l'heure la moins chère, mais de faire MOINS d'heures : un élève qui révise entre les leçons progresse plus vite, et chaque heure économisée vaut 35 à 55 €.",
          },
        ],
      },
      {
        h2: "Les aides pour financer",
        blocks: [
          {
            type: "ul",
            items: [
              "Le permis à 1 € par jour : un prêt à taux zéro pour les 15-25 ans, remboursé à petites mensualités.",
              "Le CPF : le permis B peut être financé par ton compte formation si son obtention sert ton projet professionnel.",
              "Les aides locales : beaucoup de régions, départements et missions locales aident les jeunes ou les demandeurs d'emploi. Renseigne-toi près de chez toi.",
            ],
          },
        ],
      },
      {
        h2: "Faire baisser la facture sans bâcler",
        blocks: [
          {
            type: "ul",
            items: [
              "Révise entre les leçons (compétences, giratoires, manœuvres…) : chaque leçon sert alors à apprendre du neuf, pas à rattraper.",
              "Ajoute la conduite supervisée dès que ton niveau le permet : de l'expérience gratuite.",
              "Garde un rythme dense (2-3 leçons/semaine) sur une période courte plutôt que d'étaler sur un an.",
              "Envisage la boîte automatique : 13 h minimum au lieu de 20.",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: "Un moniteur indépendant est-il moins cher qu'une auto-école classique ?",
        r: "Souvent à l'heure, et presque toujours sur le total : moins de frais annexes, et un suivi personnalisé qui évite les heures « pour rien ». Mais compare toujours ce qui est inclus.",
      },
      {
        q: "Le moniteur indépendant peut-il me présenter à l'examen ?",
        r: "Oui. Les moniteurs indépendants diplômés présentent leurs élèves à l'épreuve pratique comme une auto-école, avec un véhicule à double commande le jour J.",
      },
      {
        q: "Quel budget total prévoir ?",
        r: "En moyenne nationale, entre 1 500 et 2 000 € tout compris. Avec un bon rythme, de la révision entre les leçons et éventuellement la supervisée, on peut viser nettement moins.",
      },
      {
        q: "Le CPF peut-il financer mon permis ?",
        r: "Oui si l'obtention du permis B contribue à ton projet professionnel (c'est déclaratif mais contrôlable). La demande se fait sur Mon Compte Formation.",
      },
    ],
    cta: {
      text: "Fais moins d'heures, pas moins de niveau",
      sub: "PermiGo te fait réviser entre les leçons pour progresser plus vite. Gratuit pour commencer.",
      href: "/#/signup",
    },
  },
];

// ─────────────────────────────────────────────────────────────
// PILIER MONITEUR (page money — reprend la copy GTM validée)
// ─────────────────────────────────────────────────────────────
export const MONITEUR_PILLAR = {
  slug: "pour-moniteurs",
  metaTitle: "PermiGo. L'app à TA marque pour moniteur indépendant",
  metaDesc:
    "L'app d'entraînement au permis à ta marque, qui rend tes élèves accros à réviser entre les leçons et prouve tes résultats. Pas une plateforme qui te prend tes élèves. 9,99 €/mois.",
  h1: "Ton app de permis. À ton nom. Pas à celui d'une plateforme.",
  lead: "PermiGo, c'est l'outil du moniteur indépendant : une app d'entraînement à ta marque qui garde tes élèves actifs entre les leçons, et qui matérialise ton travail. Qui progresse, qui est prêt, ton taux de réussite. Tes élèves, ta marque, tes résultats.",
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
          text: "Les plateformes outillent le moniteur, mais à LEUR marque. Et elles possèdent ton élève. PermiGo fait l'inverse : l'app et le suivi sont à TA marque. L'élève est à toi, la relation est à toi.",
        },
        {
          type: "h3",
          text: "2. Tes élèves reviennent tout seuls",
        },
        {
          type: "p",
          text: "Parcours gamifié, séries quotidiennes, examens blancs, défis : l'élève prend l'habitude de réviser sans que tu aies à le relancer. Un élève qui s'entraîne entre les leçons, c'est un élève qui progresse plus vite. Et un taux de réussite qui monte.",
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
