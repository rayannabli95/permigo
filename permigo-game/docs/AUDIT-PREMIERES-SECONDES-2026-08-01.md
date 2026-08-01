# Audit des premières secondes de PermiGo

**Date** : 1er août 2026
**Périmètre audité** : `origin/main` (a2f2db7), build de production, iPhone 13 (390×844), réseau bridé 4G lente et 3G, contextes de langue fr-FR · en-US · ar-EG · bn-BD.
**Méthode** : lecture du code + rendu réel dans un navigateur piloté + mesures de chargement + captures écran de chaque écran d'entrée (visiteur, élève connecté, moniteur).
**Nota** : la branche de travail locale (`codex/prepare-lesson-hero`) a 168 commits de retard sur `main`. Tout ce qui suit décrit **`main`**, c'est-à-dire ce que voit un vrai visiteur aujourd'hui.

---

## 1. Diagnostic général

### Ce qui est déjà très bon

- **Le produit a un vrai angle** : « prépare ta leçon avant de monter en voiture », et il l'assume dès le titre. C'est le seul acteur du marché qui ne vend pas du code. C'est un actif rare, il est déjà écrit noir sur blanc.
- **Le niveau d'exécution visuelle est au-dessus du marché français** (Ornikar, Codes Rousseau, Lepermislibre) : billet doré, mascotte, DA cohérente, animations propres, arabe entièrement en miroir. Un jeune qui vient de TikTok ne trouvera pas ça ringard.
- **Le compte gratuit existe et il est bien conçu** : 3 leçons acquises à vie, 3 questions par jour, 1 scène par jour, murs chaleureux et traduits (`free-tier-wall.js`). C'est le meilleur travail de conversion de tout le produit.
- **L'accueil élève connecté est excellent** : « TA PROCHAINE LEÇON · PRÉPARE TA LEÇON · Prendre en main le poste de conduite · Je me prépare → ». En une seconde, on sait quoi faire et pourquoi.

### Le problème central, en une phrase

> **La valeur du produit vit derrière le mur de paiement, et la page d'accueil vend un billet avant d'avoir montré une seule seconde de produit.**

Le visiteur froid arrive sur une page qui ressemble à une billetterie : logo, « offre de lancement », billet doré, prix barré, « Réserver ma place · 24,99 € ». Il n'a rien essayé, rien vu bouger, rien réussi. On lui demande sa carte bancaire à la deuxième seconde de sa vie avec la marque. Et **le compte gratuit, qui est la meilleure arme du produit, n'est mentionné nulle part sur cette page et n'a aucun lien depuis le site** (vérifié : une seule occurrence de `#/rejoindre?solo=1` dans tout le code, sur l'écran de remerciement **après** paiement).

### Les trois contradictions à corriger avant tout

1. **On promet le multilingue et on sert du français.** L'écran de démarrage dit bonjour dans 16 langues et se pose sur la langue du téléphone (mesuré : « مرحبا » sur un téléphone arabe à la première visite). Deux secondes plus tard, la page de vente est **en français pour tout le monde** — arabe, anglais, bengali — parce qu'un bug de priorité écrase la langue du navigateur (détail en §7, faille B1). La promesse est faite puis brisée dans la même seconde.
2. **On vend un abonnement à quelqu'un qui n'a pas encore de compte.** Le CTA principal ouvre Stripe. Pas de démo, pas d'aperçu, pas d'essai. Le taux de clic sera correct, le taux de conversion sera très bas, et on n'apprendra rien de l'échec.
3. **On dit « pas une app de code » et on montre surtout des écrans de quiz.** La capture principale du téléphone dans le hero est un écran de progression, pas une scène de conduite. Le mini jeu « En situation », qui est la vraie différence, est relégué en petite vignette au tiers de la page.

### Verdict froid

PermiGo n'est **ni trop enfantin ni pas assez crédible**. Il est **trop fermé**. Le design est bon, la promesse est juste, la crédibilité pédagogique est réelle (REMC, 31 compétences, critères d'examen) — mais rien de tout ça n'est démontrable en dix secondes par un inconnu. Le problème n'est pas la marque, c'est **l'ordre des écrans**.

---

## 2. Compréhension en 3 secondes

Test : ce qu'un humain peut lire et comprendre entre l'ouverture et la troisième seconde, sur la page d'accueil actuelle.

| Question | Réponse obtenue en 3 s | Verdict |
|---|---|---|
| Qu'est-ce que PermiGo ? | « Une app qui prépare la leçon de conduite » | ✅ compris |
| À qui ça s'adresse ? | Implicite : un élève en auto-école. Jamais dit. | 🟠 déduit, pas affirmé |
| Qu'est-ce que ça m'apporte ? | « Prépare ta leçon » — un bénéfice abstrait | 🟠 flou |
| En quoi c'est différent d'une app de code ? | Dit explicitement dans le sous titre | ✅ compris |
| Pourquoi continuer à explorer ? | Rien à explorer. Un bouton de paiement. | 🔴 échec |
| Pourquoi payer ? | Aucune raison fournie à 3 s | 🔴 échec |
| Est-ce sérieux et fiable ? | Beau, mais aucune preuve, aucun avis, aucun nom | 🟠 « joli site inconnu » |

**Score de compréhension à 3 secondes : 3 sur 7.**
**Score d'envie à 3 secondes : 1 sur 7.**

La compréhension est bonne, le désir est nul. C'est exactement l'inverse du problème habituel, et c'est plus facile à réparer : il ne faut pas réécrire la promesse, il faut **donner quelque chose à faire**.

---

## 3. Analyse seconde par seconde

Mesures réelles, build de production, 4G lente (1,6 Mb/s, 150 ms de latence) et 3G (1 Mb/s, 300 ms).

### Seconde 0 à 1 — l'écran de démarrage

**Ce qu'il voit** : fond noir, logo PermiGo en 3D qui se dessine (vidéo de 135 Ko), le mot « Bonjour » qui défile dans 16 langues et se pose sur la sienne.
**Mesuré** : premier pixel utile à 1,38 s en 4G. Le contenu de la page est prêt à 800 ms, mais l'écran de démarrage est volontairement maintenu **2 secondes** et jusqu'à **3,4 secondes** (`SEEN=2`, `CAP=3400` dans `index.html`). En 3G, le titre n'apparaît qu'à **4 secondes** et l'écran de démarrage reste visible jusqu'à environ 5 secondes.
**Ce qu'il comprend** : « c'est une marque, pas un site bricolé ». Le multilingue est un signal fort et bien vu.
**Ce qu'il ressent** : rien de négatif en wifi. En 3G, l'impression d'une app lente.
**Doutes** : aucun.
**Envie** : la salutation dans sa langue crée une micro dette de reconnaissance chez un non francophone. Excellent levier, mais il n'est jamais honoré ensuite.
**Friction** : on brûle 2 des 3 premières secondes sur un logo. C'est un luxe qu'une marque inconnue ne peut pas se payer sur du trafic publicitaire froid.
**Risque de sortie** : faible en wifi, réel en 3G (5 s d'écran noir = 15 à 20 % d'abandon sur du trafic social).

### Seconde 1 à 3 — le hero

**Ce qu'il voit** : « OFFRE DE LANCEMENT* », puis en très gros « Prépare ta leçon / **avant de monter en voiture.** », puis « La seule app qui bosse ta **conduite** entre les leçons. Pas une énième app de code. », puis le haut d'un billet doré.
**Ce qu'il comprend** : le sujet, oui. Le service, non. « Prépare ta leçon » ne dit pas **comment** ni **avec quoi**.
**Ce qu'il ne comprend pas** : est-ce un cours ? un jeu ? un carnet ? est-ce lié à mon auto-école ? est-ce que ça remplace des heures ?
**Ce qu'il ressent** : curiosité tiède. Le mot « leçon » parle à qui a déjà commencé ; il ne parle pas à qui n'a pas encore d'auto-école.
**Questions** : « c'est quoi une leçon préparée ? », « c'est payant tout de suite ? »
**Frictions** :
- « OFFRE DE LANCEMENT* » est la **première ligne** lue. On annonce une promo avant d'avoir annoncé un produit. C'est le réflexe d'un site de déstockage, pas d'un outil pédagogique.
- « La seule app qui… » est une allégation de supériorité invérifiable. Juridiquement fragile en publicité comparative, et psychologiquement suspecte (« ils disent tous ça »).
**Risque de sortie** : moyen.

### Seconde 3 à 5 — le bandeau cookies écrase l'écran

**Mesuré** : le bandeau est présent dès **800 ms**, avant même la disparition de l'écran de démarrage. Sur iPhone 13, il occupe **le tiers inférieur de l'écran** et masque le billet doré ainsi que le bouton principal.
**Ce qu'il voit** : un pavé blanc « Cookies & confidentialité », 4 lignes de texte juridique, deux boutons dont « Tout accepter » en violet plein.
**Ce qu'il ressent** : agacement. Le premier geste demandé par la marque est un geste administratif.
**Ce qu'il fait** : il tape « Tout accepter » sans lire, ou il quitte.
**Risque de sortie** : **élevé**. C'est le point de fuite numéro un des 10 premières secondes, et il est entièrement évitable.

### Seconde 5 à 10 — le billet et le prix

**Ce qu'il voit** : un billet doré « PERMIGO · OBJECTIF PERMIS EN 90 JOURS · Conduite · mini jeux · simulations d'examen · Embarquement JUIL. 2026 · Accès 3 MOIS · Tarif exceptionnel 29,97 € barré → 24,99 € », puis le bouton « Réserver ma place · 24,99 € », puis en bas de l'écran une barre collante qui répète le prix.
**Ce qu'il comprend** : « c'est payant, 24,99 € ».
**Ce qu'il ne comprend pas** : ce qu'il y a **dans** le produit. À la dixième seconde, il n'a vu **aucun contenu réel** : pas une question, pas une scène, pas une fiche.
**Doutes qui apparaissent** :
- « Réserver ma place » suppose des places limitées. Le compteur de places a été retiré. Le verbe est donc devenu un mensonge doux, et le cerveau le détecte : réserver quoi, puisque rien n'est rare ?
- « Embarquement JUIL. 2026 » : **on est le 1er août 2026. Le billet est périmé.** Un visiteur attentif lit « offre expirée ». Un visiteur inattentif ne lit rien mais perd un cran de confiance.
- Deux prix se disputent l'écran (24,99 € sur le billet, 24,99 € sur le bouton, 9,99 € plus bas) sans qu'on sache lequel est le vrai.
**Envie** : le billet est beau et le geste « décoller mon billet » est bon. Mais un billet est une **promesse de voyage futur**, pas une preuve de valeur présente.
**Risque de sortie** : **très élevé** pour tout visiteur qui n'était pas déjà convaincu par la publicité qui l'a amené.

### Seconde 10 à 30 — la démonstration arrive enfin, trop tard

**Ce qu'il voit s'il scrolle** : une scène téléphone + mascotte + bulle « 3 compétences validées ! », puis « Préparer le permis, c'est **bien plus** que conduire. », puis deux vraies captures (« Mini jeux En situation », « Ton centre d'examen décortiqué »), puis trois atouts, puis l'addition (55 € l'heure · 1 800 € le budget · 9,99 € PermiGo).
**Ce qu'il comprend enfin** : ah, il y a des mini jeux, des fiches par leçon, des simulations d'examen notées comme l'inspecteur, des fiches par centre d'examen.
**Diagnostic** : **c'est ce contenu qui aurait dû être en seconde 2.** La démonstration du produit arrive après le prix. On demande de payer avant d'avoir montré.
**L'addition (55 € l'heure)** est le meilleur argument de la page et il est enterré au deux tiers. Bien joué sur le fond : c'est le seul endroit où le prix devient dérisoire.

### Première minute — la décision

Trois issues possibles aujourd'hui :
1. Il paie (rare : moins de 1 % sur du trafic froid, sans preuve sociale).
2. Il ferme (majorité).
3. Il cherche à essayer → **et il ne trouve pas de porte**. Le bouton « Se connecter » mène à un formulaire de connexion dont le seul lien élève est « Élève avec un code moniteur ? Rejoins ton moniteur ». S'il n'a pas de code moniteur, **il est bloqué**. Le compte gratuit existe, il est à `#/rejoindre?solo=1`, et **rien sur le site n'y mène**.

C'est la faille la plus coûteuse de tout l'audit.

---

## 4. Analyse psychologique

### Les moteurs réels d'un candidat au permis

L'apprentissage du permis est une expérience **d'humiliation contrôlée** : on est mauvais devant un témoin, on paie cher pour être mauvais, et un examinateur inconnu tranchera en 32 minutes. Les leviers utiles sont donc, dans l'ordre :

1. **La peur de perdre de l'argent** (55 € l'heure, 1 800 € en moyenne). C'est le levier le plus fort et le plus vrai chez PermiGo. Aujourd'hui il est utilisé une fois, en petit, au deux tiers de la page.
2. **La peur de l'examen et du jugement**. Le produit y répond très bien (simulation notée sur les critères de l'inspecteur, fiches de centre d'examen) mais la page ne verbalise jamais l'angoisse. On ne dit jamais « tu as le droit d'être nul en giratoire ».
3. **Le besoin de contrôle**. « Je saurai quoi faire demain à 14 h » est le bénéfice émotionnel réel. « Prépare ta leçon » l'effleure sans le nommer.
4. **Le besoin de progression visible**. Bien servi une fois dedans (31 compétences, cartes, séries). Invisible avant l'inscription.
5. **La honte linguistique**. Un élève bengali ou arabophone a une peur précise : « je vais rater parce que je n'ai pas compris la question, pas parce que je conduis mal ». Le produit a la bonne réponse (« l'app t'entraîne en français simple, celui du jour J ») mais elle est cachée dans la FAQ, en anglais uniquement.

### Les biais à activer, et ceux à ne pas toucher

**À activer, honnêtement :**
- **Réduction de l'incertitude** — montrer le contenu avant le prix. C'est le levier numéro un ici.
- **Effet de dotation** — faire jouer une scène avant l'inscription : ce qu'on a touché, on veut le garder. Le compte gratuit avec 3 leçons **acquises à vie** est déjà écrit pour ça, il faut juste le rendre visible.
- **Comparaison de coût** — 24,99 € contre 55 € l'heure. Vrai, sourcé, imparable.
- **Autorité pédagogique** — REMC, arrêté du 13/05/2013, 31 compétences, critères d'examen. Jamais dit sur la page publique. C'est pourtant ce qui sépare PermiGo d'un jeu mobile.
- **Preuve sociale** — totalement absente. Il faut la construire (voir §10), même petite : « 42 élèves préparent leur leçon avec PermiGo cette semaine » vaut mieux que rien, à condition que ce soit vrai.

**À ne surtout pas activer :**
- **La rareté fabriquée**. « Réserver ma place », « offre de lancement », « le prix remontera » sans date sont des signaux de site douteux. Sur une cible jeune et méfiante, ça abîme la confiance plus que ça n'accélère l'achat. Soit la promo a une date affichée, soit elle disparaît.
- **La culpabilité et la peur d'échouer** (« ne rate pas ton permis comme 44 % des candidats »). Ça marche à court terme et détruit la relation avec un public déjà en insécurité. Le ton actuel, non culpabilisant, est un choix produit juste. Le garder.
- **Le compte à rebours** sur le paiement.

### Le cas particulier de l'échec précédent

Une personne qui a déjà raté le permis a un besoin unique : **savoir pourquoi elle a raté**. Aucune de ses questions n'a de réponse sur la page actuelle. C'est pourtant le segment le plus prêt à payer immédiatement, avec la plus forte intention. Une seule ligne suffirait : « Déjà présenté une fois ? Reprends par ce qui t'a coûté des points. »

---

## 5. Analyse par persona

Pour chaque profil : ce qu'il remarque, ce qui l'attire, ce qui le bloque, la promesse qui lui parle, le vocabulaire, le CTA, le risque de perte, le déclencheur d'achat.

### 5.1 Élève français qui débute

- **Remarque** : le billet doré et le prix.
- **Comprend** : « app payante pour le permis ».
- **Attire** : « pas une app de code », les mini jeux.
- **Bloque** : ne sait pas encore ce qu'est une « leçon à préparer ». Il n'a pas encore conduit.
- **Rassure** : voir une scène de conduite jouable tout de suite.
- **Promesse** : « Tu sauras quoi faire avant même de t'asseoir au volant. »
- **Vocabulaire** : leçon, volant, giratoire, créneau, moniteur. **À éviter** : REMC, compétence C1a, objectif pédagogique, quiz.
- **CTA** : « Essayer une scène · 60 secondes ».
- **Risque de perte** : il ne se projette pas, il ferme.
- **Déclencheur d'achat** : après sa 3e leçon gratuite, quand le mur tombe sur « Démarrer et s'arrêter ».

### 5.2 Élève proche de l'examen

- **Remarque** : rien de ce qui le concerne. Sa peur est le jour J.
- **Attire** : « Simulation d'examen notée sur les mêmes critères que l'inspecteur », « Ton centre d'examen décortiqué ». Enterrés tous les deux.
- **Bloque** : aucune notion d'urgence utile (« mon exam est dans 3 semaines, ça sert à quoi ? »).
- **Rassure** : une note sur 31 obtenue en 5 minutes.
- **Promesse** : « Passe ton examen blanc ce soir. Tu sauras exactement où tu perds des points. »
- **CTA** : « Faire l'examen blanc · gratuit ».
- **Risque de perte** : il croit que c'est une app pour débutants.
- **Déclencheur d'achat** : son score. Un mauvais score honnête vend mieux que n'importe quel argument.

### 5.3 Élève arabophone

- **Remarque** : « مرحبا » sur l'écran de démarrage. Puis **une page entièrement en français**. C'est un bug, pas un choix (faille B1).
- **Comprend** : « ce n'est pas pour moi ».
- **Attire** : la version arabe existe et elle est excellente (mise en page en miroir complet, vocabulaire juste). Il faut juste qu'elle s'affiche.
- **Bloque** : la langue. Puis, plus subtil, la peur que l'app soit en arabe alors que **l'examen est en français** — l'app doit dire les deux choses : « on t'accueille dans ta langue, on t'entraîne dans la langue de l'examen ».
- **Rassure** : voir un mot français avec sa traduction dessous, exactement ce que fait déjà le quiz.
- **Promesse** : « نحضّرك بالفرنسية التي ستسمعها يوم الامتحان » (on te prépare avec le français que tu entendras le jour de l'examen).
- **Vocabulaire** : باقة pour Pass, سيناريو الطريق pour mise en situation. **À éviter** : موقف (ambigu, veut aussi dire parking) — déjà documenté dans le code, bien vu.
- **CTA** : « ابدأ مجاناً » (commence gratuitement).
- **Risque de perte** : 100 % à la deuxième seconde tant que le bug de langue est là.
- **Déclencheur d'achat** : la confiance qu'il ne ratera pas à cause de la langue.

### 5.4 Élève anglophone

- **Remarque** : page en français malgré un téléphone en anglais (même bug).
- **Attire** : le bloc « Learning in French? You keep your language » de la version EN est la meilleure copie de tout le site. Honnête, précise, rassurante. Elle n'est visible que si on clique « EN ».
- **Promesse** : « The exam is in French. So we train you in the exact French you'll hear on test day. »
- **CTA** : « Try one scene · free ».
- **Risque de perte** : il pense que l'app est franco française.

### 5.5 Élève originaire du Bangladesh ou peu à l'aise avec le français

- **Remarque** : rien. Le texte est dense, en français, avec des tournures familières (« bosse ta conduite », « une énième app »).
- **Bloque** : le registre. « Bosser », « énième », « galérer » sont invisibles pour un apprenant de français.
- **Rassure** : des images, des icônes, des mots courts, un bouton qui ne demande pas de lire.
- **Promesse** (version très simple) : « Une leçon demain ? On te montre quoi faire. En images. »
- **Vocabulaire** : phrases de 6 mots maximum, verbes à l'infinitif, aucun idiome, aucune ironie.
- **CTA** : « Voir une scène » avec une icône de voiture.
- **Risque de perte** : il ne comprend pas qu'il y a quelque chose de gratuit.
- **Point culturel** : la confiance envers un paiement en ligne est plus faible et le mode de paiement (carte bancaire française) n'est pas toujours disponible. Un compte gratuit sans carte est ici la condition d'entrée, pas un bonus.

### 5.6 Jeune habitué à TikTok, Duolingo, Clash Royale

- **Remarque** : le billet doré, la mascotte, l'or. Il reconnaît les codes.
- **Attire** : ça bouge, c'est brillant, ça ressemble à un jeu.
- **Bloque** : **rien ne se passe quand il tape**. Sa grammaire native est « j'appuie et il se passe un truc ». La page actuelle est une brochure.
- **Rassure** : une interaction en moins de 2 secondes.
- **Promesse** : « Une scène. Une décision. Trois secondes. »
- **CTA** : « Jouer » (pas « Découvrir », pas « En savoir plus »).
- **Risque de perte** : ennui, en 4 secondes.
- **Déclencheur d'achat** : la série, la collection de cartes, le classement — tout ce qui est déjà construit et invisible avant l'inscription.

### 5.7 Personne plus âgée ou peu à l'aise avec la technologie

- **Remarque** : le fond sombre, le texte doré sur or (contraste faible sur le billet), les petits caractères des notes de bas de bouton.
- **Bloque** : le tutoiement systématique, l'esthétique jeu vidéo, l'absence de « à quoi ça sert » écrit simplement.
- **Rassure** : un mot sur le sérieux pédagogique (référentiel officiel), un numéro de téléphone ou une adresse humaine, le mot « remboursé ».
- **Promesse** : « Comprendre ce que l'inspecteur attend. Sans jargon. »
- **Vocabulaire** : vouvoiement possible sur la page publique. **À éviter** : ligue, série, coffre, volants.
- **Risque de perte** : elle se croit hors cible dès la première image.

### 5.8 Personne qui a déjà le permis et veut se remettre à niveau

- **Remarque** : tout parle d'examen. Rien ne parle d'elle.
- **Bloque** : « objectif permis en 90 jours » l'exclut explicitement.
- **Promesse** : « Reprendre le volant sans stress. À ton rythme. »
- **Risque de perte** : totale, aujourd'hui. Segment marginal — ne pas investir, mais une ligne dans la FAQ suffit à ne pas le perdre.

### 5.9 Personne stressée, en échec, ou qui a déjà raté

- **Remarque** : le ton positif, ce qui est une bonne chose.
- **Bloque** : rien ne lui parle de son cas. Elle a besoin d'entendre que rater est normal.
- **Rassure** : « 2 à 3 leçons sur un giratoire, c'est normal » — cette phrase existe dans la doctrine produit et n'est écrite nulle part côté public.
- **Promesse** : « Tu sauras exactement ce qui t'a coûté des points. Et comment le corriger. »
- **CTA** : « Voir où j'en suis · 5 minutes ».
- **Déclencheur d'achat** : le diagnostic. Ce segment paie vite si on lui donne un verdict précis et non culpabilisant.

### 5.10 Moniteur d'auto-école

- **Remarque** : rien pour lui. Sa seule porte est un lien en pied de page, en petit : « Moniteur indépendant ? Crée ton espace ».
- **Comprend** : « c'est une app pour mes élèves ».
- **Attire** : « Des élèves qui arrivent préparés à chaque leçon » — bon titre, mais il est sur `#/creer-compte`, pas sur la page d'accueil.
- **Bloque** : peur de la double saisie (« encore un truc à remplir »). Le produit y répond (il n'écrit rien, il observe) et ne le dit pas assez fort, assez tôt.
- **Rassure** : « Tu ne remplis rien. Tu regardes. »
- **Vocabulaire** : élève, leçon, progression, livret. **À éviter** : gamification, engagement, dashboard, KPI.
- **CTA** : « Voir mon tableau de bord · 30 secondes ».
- **Risque de perte** : il ne saura jamais que le produit existe pour lui.
- **Déclencheur d'achat** : voir un élève réel bouger dans son tableau. Le prix (9,99 €) n'apparaît qu'après l'inscription — c'est une bonne chose ici, à condition de le dire clairement au moment du mur, ce qui est le cas.

### 5.11 Gérant d'auto-école

- **Remarque** : rien. La page `#/pro` existe, est bien faite, **et n'est liée depuis aucune page du site** (vérifié dans tout le code).
- **Promesse** : « Vos élèves arrivent préparés. Vos moniteurs gagnent 10 minutes par leçon. »
- **CTA** : « Demander un devis ».
- **Risque de perte** : 100 %, par simple absence de lien.

### 5.12 Parent qui paie

Persona absent de la liste initiale mais **c'est souvent lui qui sort la carte**.
- **Bloque** : le ton tutoyé jeune, l'absence de garantie visible en haut, l'absence de preuve.
- **Rassure** : « satisfait ou remboursé sous 3 jours », « moins d'une demi heure de conduite », « aucune publicité dans l'app ».
- **Promesse** : « Moins d'heures gaspillées. »
- **CTA** : « Offrir PermiGo · 24,99 € ».

---

## 6. Audit écran par écran

### 6.1 Écran de démarrage (`index.html`)

**Bon** : identité forte, salutation multilingue, poids raisonnable (135 Ko), repli image si la vidéo ne joue pas, respect de `prefers-reduced-motion`.
**Mauvais** : durée fixe de 2 s (plafond 3,4 s) même quand la page est prête à 800 ms. Sur du trafic publicitaire, c'est 2 secondes d'attrition gratuite.
**Correctif** : garder l'écran de marque pour les visites depuis l'app installée et les visiteurs connus ; le raccourcir à 900 ms maximum pour une **première** visite venant d'un lien externe, ou le fermer dès que la page est prête si l'entrée vient d'une publicité (`?utm_`).

### 6.2 Bandeau cookies (`cookie-banner.js`)

**Bon** : texte honnête, deux choix équivalents, mention « aucune publicité dans l'app ».
**Mauvais** : il apparaît à 800 ms, occupe un tiers de l'écran, masque le CTA et le billet. C'est le premier objet interactif du produit.
**Correctif** : bandeau d'une seule ligne collé en bas, hauteur 64 px, « On mesure l'audience pour améliorer l'app · Accepter · Refuser », et l'afficher **après** le premier scroll ou 4 secondes. Aucun traceur non essentiel n'est posé avant le consentement, donc le report est légal.

### 6.3 Page d'accueil visiteur (`pass.js`, 1 197 lignes)

**Bon** : hiérarchie visuelle claire, billet mémorable, arabe en miroir complet, sources citées (UFC-Que Choisir, Sécurité routière), FAQ qui répond aux vraies objections, garantie visible.
**Mauvais** :
- Aucune mention du gratuit (0 occurrence de « gratuit » dans le fichier).
- Aucun lien vers l'inscription libre ni vers `#/pro`.
- « Embarquement JUIL. 2026 » périmé au 1er août 2026.
- Trois offres ici, deux dans le mur interne : incohérence de catalogue.
- 1,9 Mo chargés, 19 requêtes.
- `<html lang="fr">` conservé même en anglais et en arabe.
- Le contenu apparaît au scroll par `IntersectionObserver` : si le script échoue, la moitié de la page reste invisible.
**Correctif** : voir §9, refonte complète du parcours.

### 6.4 Connexion (`login.js`)

**Bon** : intro de marque soignée, Google, code par email, sélecteur de langue.
**Mauvais** :
- Titre « Content de te revoir » pour quelqu'un qui n'est peut être jamais venu.
- Le seul chemin élève en pied de page est « Élève avec un code moniteur ? ». **Un élève sans code n'a aucune porte.**
- Le bouton arabe affiche « ع » (une lettre isolée) au lieu de « العربية » comme ailleurs.
**Correctif** : ajouter en pied de page « Pas encore de compte ? Créer mon compte élève · gratuit » vers `#/rejoindre?solo=1`, et harmoniser le libellé arabe.

### 6.5 Inscription élève (`rejoindre.js`)

**Bon** : trois langues offertes en haut, phrase « Les questions du quiz s'affichent dans ta langue, le français gardé dessous », mode solo sans code.
**Mauvais** :
- Aucune mention du gratuit sur la page elle même. Le titre est « Crée ton compte élève », le sous titre parle du Pass payé.
- 6 champs demandés dont la date de naissance avant d'avoir rien vu.
- Le champ date s'affiche au format `mm/dd/yyyy` (format anglo saxon) selon la langue du navigateur.
**Correctif** : titre « Ton compte gratuit · 3 leçons offertes », demander uniquement l'email et le mot de passe, repousser prénom et date de naissance après la première victoire.

### 6.6 Onboarding élève (`onboarding/index.js`, 1 599 lignes)

**Ce qu'il contient** : « Salut, toi ! Moi c'est PermiGo. En 30 secondes on prépare ton appli. Après, tu réviseras 2 min par soir. » puis 4 sections : identité (prénom et nom, déjà saisis à l'inscription), photo de profil et couleur, rappels du soir, installation de l'app.
**Diagnostic** : **les 4 sections sont de la configuration, aucune n'est de la valeur.** Le nouvel inscrit passe sa première minute à choisir une couleur d'avatar, pas à apprendre à conduire. Puis il tombe sur un tour guidé de 5 étapes qui recouvre l'accueil.
**Correctif** : inverser. Une scène jouée, une réussite, une carte gagnée — **puis** « choisis ta couleur » proposé en option. L'avatar et les rappels peuvent vivre dans le profil.

### 6.7 Premier écran dans l'app (élève)

**Mesuré** : modale « ÉTAPE 1/5 · Bienvenue 👋 · Visite express. Passe quand tu veux. » par dessus un accueil flouté qui contient déjà une bannière d'installation et une alerte de série.
**Bon** : l'accueil lui même est excellent (« TA PROCHAINE LEÇON · PRÉPARE TA LEÇON · Je me prépare → »).
**Mauvais** : trois couches de sollicitation avant le contenu (tour, bannière d'installation, alerte de série). Pour un compte neuf, la série n'a aucun sens.
**Correctif** : une seule sollicitation par session, et jamais à la première ouverture. La première ouverture doit montrer **le bouton « Je me prépare »** et rien d'autre.

### 6.8 Premier écran moniteur

**Mesuré** : modale « ÉTAPE 1/4 · Bienvenue sur PermiGo · Tes élèves préparent chaque leçon dans l'app. Toi, tu vois qui s'entraîne, qui avance, qui décroche. D'un coup d'œil. »
**Bon** : la promesse moniteur est parfaite, exactement au bon endroit.
**Mauvais** : elle n'existe **que** là, c'est à dire après l'inscription. Elle devrait être sur la page d'accueil publique.

### 6.9 Page auto-école (`pro.js`)

**Bon** : titre juste, formulaire de devis complet et bien construit.
**Mauvais** : aucun lien entrant. Page orpheline.

---

## 7. Failles classées par gravité

Format : problème · profil · gravité · impact compréhension / confiance / conversion · solution · exemple · priorité.

### 🔴 BLOQUANT

**B1 — La langue du visiteur est ignorée sur toute la page publique**
- *Profil* : arabophone, anglophone, bengali. Tout le trafic publicitaire international.
- *Cause technique* : `initLangEarly()` (`src/utils/lang.js`) appelle `applyLang(getLang())` au démarrage ; `getLang()` retourne `"fr"` par défaut et `applyLang()` **écrit ce défaut** dans `localStorage.permigo_lang`. Quand `pass.js` cherche la langue, il lit `permigo_lang` **avant** `navigator.language` : le repli navigateur est du code mort.
- *Mesuré* : téléphones en `en-US`, `ar-EG`, `bn-BD` → titre « Prépare ta leçon avant de monter en voiture », `permigo_lang="fr"` écrit dès 600 ms.
- *Aggravant* : l'écran de démarrage, lui, dit bien « مرحبا » à la première visite. Promesse faite puis brisée en 2 secondes. Et dès la seconde visite il dit « Bonjour », car il lit le miroir désormais pollué.
- *Impact* : compréhension anéantie, confiance anéantie, conversion nulle sur toute la cible internationale.
- *Solution* : ne jamais persister un défaut. `applyLang(lang, { persist: false })` au démarrage tant qu'aucun choix explicite n'a été fait, ou poser un drapeau `permigo_lang_explicit`. Dans `pass.js`, l'ordre doit être : `?lang=` → choix explicite mémorisé → `navigator.language` → français.
- *Exemple* : un téléphone en arabe qui ouvre `permigo.fr` doit voir la page arabe, en miroir, sans rien cliquer.
- *Priorité* : **immédiate. C'est un correctif d'une dizaine de lignes qui débloque toute la stratégie internationale.**

**B2 — Le compte gratuit n'a aucune porte depuis le site**
- *Profil* : tous les élèves, et surtout ceux qui ne paieront jamais sans essayer.
- *Mesuré* : `#/rejoindre?solo=1` n'est référencé qu'une fois dans tout le code, sur l'écran de remerciement **après** paiement. Le mot « gratuit » n'apparaît pas une seule fois dans `pass.js`. Sur la page de connexion, le seul chemin élève exige un code moniteur.
- *Impact* : conversion massivement dégradée. On a construit une offre gratuite complète et on ne la vend pas.
- *Solution* : CTA secondaire sur la page d'accueil, lien en pied de page de connexion, et titre de l'inscription qui dit le gratuit.
- *Exemple de texte* : bouton secondaire sous le bouton principal → « Commencer gratuitement · 3 leçons offertes ».
- *Priorité* : **immédiate.**

**B3 — Le bandeau cookies masque l'offre pendant les 10 premières secondes**
- *Profil* : tous.
- *Mesuré* : présent à 800 ms, occupe le tiers bas d'un iPhone 13, recouvre le billet et le CTA.
- *Impact* : premier point de fuite. Confiance abîmée (premier geste = geste juridique).
- *Solution* : version compacte une ligne, en bas, affichée après 4 secondes ou au premier scroll.
- *Priorité* : **immédiate.**

### 🟠 CRITIQUE

**C1 — On demande le paiement avant toute démonstration**
- *Profil* : tous les visiteurs froids.
- *Impact* : compréhension partielle, désir nul, conversion très basse.
- *Solution* : une démonstration jouable **au dessus de la ligne de flottaison** — une vraie scène « En situation » interactive, sans compte, en 2 taps.
- *Exemple* : sous le titre, une carte « Une scène. Une décision. » avec l'image du carrefour et trois boutons de réponse. Réponse juste → « Bien vu. C'est exactement ce que l'inspecteur regarde. » → « Continuer gratuitement ».
- *Priorité* : semaine 1.

**C2 — Zéro preuve sociale, zéro caution**
- *Profil* : tous, et de façon aiguë les non francophones (confiance dans un service en ligne étranger) et les parents.
- *Impact* : « joli site inconnu ». Conversion divisée.
- *Solution* : trois preuves minimum, toutes vraies : un avis élève avec prénom et ville, un chiffre d'usage réel (« 1 200 scènes jouées cette semaine » si c'est vrai), une caution métier (« créé par un moniteur diplômé, sur le référentiel officiel REMC »).
- *Priorité* : semaine 1.

**C3 — Le billet affiche une date d'embarquement passée**
- *Profil* : tous les lecteurs attentifs.
- *Mesuré* : « Embarquement JUIL. 2026 » alors qu'on est le 1er août 2026.
- *Impact* : confiance. Signal « site abandonné » ou « fausse promo ».
- *Solution* : rendre la date dynamique (mois courant) ou la retirer.
- *Priorité* : immédiate, c'est une chaîne de caractères.

**C4 — Le catalogue de prix se contredit**
- *Profil* : tous les acheteurs.
- *Mesuré* : page publique = 3 offres (9,99 · 24,99 · 39,99). Mur interne (`pass-requis.js`) = 2 offres (9,99 · 24,99), décision du 31/07.
- *Impact* : confiance et compréhension. L'élève qui a vu Platine à 39,99 € et ne le retrouve plus se demande ce qui a changé.
- *Solution* : deux offres partout. Retirer Platine de la page publique.
- *Priorité* : semaine 1.

**C5 — L'urgence est fabriquée et non datée**
- *Profil* : jeunes méfiants, parents.
- *Éléments* : « Offre de lancement* », « il remontera après cette promo », « Réserver ma place » alors qu'aucune place n'est limitée.
- *Impact* : confiance. Sur cette cible, la fausse rareté coûte plus qu'elle ne rapporte.
- *Solution* : soit une date réelle (« prix de lancement jusqu'au 31 août »), soit rien. Remplacer « Réserver ma place » par « Ouvrir tout mon parcours ».
- *Priorité* : semaine 1.

**C6 — Les auto-écoles et les moniteurs n'ont pas de porte**
- *Profil* : moniteur, gérant.
- *Mesuré* : `#/pro` n'est lié depuis aucune page. Le moniteur n'a qu'un lien en pied de page.
- *Impact* : conversion nulle sur deux segments payants.
- *Solution* : une ligne discrète mais visible en haut ou en bas de la page d'accueil : « Moniteur ou auto-école ? » avec deux liens.
- *Priorité* : semaine 1.

### 🟡 IMPORTANT

**I1 — L'écran de démarrage coûte 2 à 3,4 secondes** (voir §3). Solution : 900 ms maximum en première visite depuis un lien externe. Priorité semaine 1.

**I2 — 1,9 Mo et 19 requêtes pour une page de vente.** Solution : images en AVIF ou WebP, chargement différé de la mascotte et des captures, budget de 700 Ko sur la première vue. Priorité semaine 2.

**I3 — `<html lang>` reste « fr » en anglais et en arabe.** Impact SEO, lecteurs d'écran, traduction automatique. Solution : `applyLang()` est déjà écrit pour ça, il suffit que `pass.js` l'appelle. Priorité semaine 1.

**I4 — Le titre de l'onglet est en français quelle que soit la langue.** Même correctif.

**I5 — « ع » comme libellé de langue sur la connexion** au lieu de « العربية ». Priorité semaine 1, c'est une chaîne.

**I6 — Registre de langue trop familier pour un apprenant** (« bosse ta conduite », « une énième app », « je galère »). Solution : garder le ton pour la version française, écrire les versions EN et AR en langue simple, et ajouter un mode « français facile » (voir §11).

**I7 — L'onboarding ne produit aucune victoire** (4 sections de configuration). Solution : première victoire avant configuration. Priorité semaine 2.

**I8 — Trois sollicitations empilées à la première ouverture** (tour 5 étapes, bannière d'installation, alerte de série). Solution : une seule, jamais à la première ouverture. Priorité semaine 2.

**I9 — Le mot « leçon » exclut celui qui n'a pas encore commencé.** Solution : une seule ligne dans la FAQ et une variante d'accroche pour le trafic « je démarre le permis ».

**I10 — « La seule app qui… » est une allégation invérifiable.** Risque publicitaire réel (article L121-1 du code de la consommation). Solution : « L'app qui travaille ta conduite, pas seulement le code ». Priorité semaine 1.

**I11 — La FAQ française ne mentionne que l'anglais** (« cette page existe en anglais ») alors que l'arabe existe. Priorité immédiate, c'est une chaîne.

**I12 — Le contenu dépend de `IntersectionObserver`** pour devenir visible. En cas d'échec du script, la page est à moitié vide. Solution : `.pv-rev` visible par défaut, l'animation retire l'état plutôt que l'inverse.

**I13 — Aucune notion de temps de trajet vers la valeur** : le visiteur ne sait pas combien de temps ça lui prendra. « 2 minutes par soir » existe dans l'onboarding et jamais sur la page publique.

### ⚪ AMÉLIORATION SECONDAIRE

- **S1** : le contraste texte doré sur billet doré est faible ; vérifier le ratio AA sur les libellés « Embarquement » et « Accès ».
- **S2** : la métaphore du billet (barcode, embarquement, souche) évoque l'avion et le concert, pas la route. Elle est belle mais elle éloigne du métier. À conserver seulement si la promo reste ; à remplacer par un objet routier (carte grise, plaque, feuille de route) si le positionnement devient permanent.
- **S3** : le format de date `mm/dd/yyyy` à l'inscription.
- **S4** : la personne déjà titulaire du permis n'a aucune réponse. Une ligne de FAQ suffit.
- **S5** : aucun visuel ne montre un être humain. Sur un public en insécurité, un visage rassure plus qu'une mascotte.

---

## 8. Solutions précises, par ordre de retour sur effort

1. **Corriger la priorité de langue** (B1) — une dizaine de lignes, débloque tout l'international.
2. **Ajouter le CTA gratuit** (B2) — un bouton, un lien de pied de page, deux titres. Une heure de travail.
3. **Compacter le bandeau cookies** (B3) — une demi journée.
4. **Mettre une démonstration jouable en haut de page** (C1) — deux jours, c'est le plus gros gain de conversion.
5. **Ajouter trois preuves vraies** (C2) — dépend de la collecte, pas du code.
6. **Nettoyer les incohérences** (C3, C4, C5, I5, I10, I11) — une demi journée, tout est textuel.
7. **Raccourcir l'écran de démarrage** (I1) — deux heures.
8. **Ouvrir les portes moniteur et auto-école** (C6) — deux heures.

---

## 9. Proposition de nouveau parcours

Sept écrans. Objectif : **la première victoire avant la première question, la première question avant le prix.**

### Écran 1 — Ouverture (0 à 1 s)

- **Objectif psychologique** : reconnaissance et sécurité.
- **Contenu** : logo animé, salutation dans la langue détectée, rien d'autre.
- **Durée maximale** : 900 ms en première visite depuis un lien externe, 2 s depuis l'app installée.
- **À éviter** : dépasser une seconde sur du trafic publicitaire.

### Écran 2 — Promesse et démonstration (1 à 10 s)

- **Objectif** : comprendre en 3 secondes et avoir envie de toucher.
- **Hiérarchie** : titre → une phrase → **la scène jouable** → CTA gratuit → CTA payant discret.
- **Contenu exact** :
  - Titre : **« Prépare ta leçon. Avant de monter en voiture. »**
  - Sous titre : « Des scènes de conduite. Des fiches par leçon. Un examen blanc noté comme le jour J. »
  - Bloc interactif : image d'un carrefour, question « Qui passe en premier ? », trois réponses tapables.
  - CTA principal : **« Essayer une scène · gratuit »**
  - CTA secondaire, en texte : « J'ai déjà un compte »
- **À éviter** : le prix, la promo, le billet, le mot « offre ». Rien de commercial au dessus de la ligne de flottaison.
- **Temps passé visé** : 10 s.

### Écran 3 — La scène jouée (10 à 40 s)

- **Objectif** : gratification immédiate et sentiment de compétence.
- **Contenu** : la scène complète, la réponse, l'explication en deux lignes dans le vocabulaire du moniteur.
- **Après la bonne réponse** : « Bien vu. C'est exactement ce que regarde l'inspecteur. »
- **Après la mauvaise** : « Presque. Regarde le panneau à droite. C'est lui qui décide. » Jamais « faux », jamais « raté ».
- **CTA** : « Continuer · c'est gratuit »
- **À éviter** : demander un compte pour voir la réponse.
- **Temps** : 30 s.

### Écran 4 — Mini diagnostic (40 s à 1 min 30)

- **Objectif** : personnalisation et engagement progressif.
- **Contenu** : trois questions à un tap, sans clavier.
  1. « Où tu en es ? » → Je n'ai pas commencé · J'ai commencé la conduite · Mon examen approche · J'ai déjà passé l'examen
  2. « Ta prochaine leçon porte sur quoi ? » → Je ne sais pas · Créneau · Giratoire · Autoroute · Ville
  3. « Tu préfères lire en… » → Français · English · العربية
- **Sortie** : « Voilà ton plan. Trois leçons prêtes. »
- **À éviter** : plus de trois questions, tout champ libre.
- **Temps** : 30 s.

### Écran 5 — Première preuve de valeur (1 min 30 à 3 min)

- **Objectif** : effet de dotation. Il possède quelque chose.
- **Contenu** : la fiche de sa prochaine leçon, ouverte en entier, avec ses images. Plus une carte de compétence gagnée.
- **CTA** : « Garder mes 3 leçons · créer mon compte »
- **À éviter** : demander la date de naissance, le nom, l'avatar.
- **Champs demandés** : email et mot de passe. Deux. Rien d'autre.

### Écran 6 — Première proposition commerciale (au bon moment, pas à la minute 3)

- **Déclencheur** : quand il touche le mur, c'est à dire après la 3e leçon ou après son examen blanc. Jamais avant.
- **Objectif** : rendre l'achat évident par comparaison.
- **Contenu exact** :
  - Titre : **« Ouvre les 28 autres leçons »** (déjà en place, excellent)
  - Sous titre : « Une heure de conduite coûte 55 €. Ton parcours complet coûte 24,99 €. »
  - Deux offres seulement : 9,99 €/mois · 24,99 € les 3 mois (8,33 € par mois)
  - Garantie : « Satisfait ou remboursé sous 3 jours »
- **À éviter** : trois offres, prix barrés partout, compte à rebours.

### Écran 7 — Portes secondaires (permanent, discret)

- En pied de page de la page d'accueil : « Moniteur ? Vois tes élèves progresser » · « Auto-école ? Demander un devis ».

---

## 10. Stratégie de conversion

### Quelle valeur doit être comprise avant le prix

Dans cet ordre exact :
1. **Ça travaille la conduite, pas le code.** (différenciation)
2. **Je saurai quoi faire à ma prochaine leçon.** (bénéfice concret)
3. **Je peux vérifier où j'en suis, noté comme le jour J.** (réduction d'incertitude)
4. **Une heure de conduite mal préparée coûte 55 €.** (cadre de prix)

Le prix ne doit apparaître qu'après le point 4. Aujourd'hui il apparaît avant le point 1.

### Quand annoncer le prix

- **Sur la page publique** : jamais au dessus de la ligne de flottaison. Une fois, au deux tiers, après la démonstration et après l'addition.
- **Dans l'app** : au moment du mur, avec le compteur de ce qu'il a déjà obtenu (« Tes 3 leçons sont à toi. Il en reste 28. »).

### Démo, essai, aperçu ou freemium

**Freemium, et il existe déjà.** C'est le bon modèle : le produit se démontre par l'usage, pas par la description. Deux corrections seulement : le rendre **visible** et lui ajouter une **démo sans compte** (une scène jouable avant même l'inscription).

Ce qu'il faut montrer gratuitement :
- une scène « En situation » complète, sans compte ;
- les 3 premières leçons, à vie (déjà le cas) ;
- 3 questions par jour (déjà le cas) ;
- **un examen blanc de conduite, une fois**. C'est le meilleur argument de vente du produit : la note honnête crée le besoin. Aujourd'hui il est derrière le mur.

### La première victoire à offrir

Une réponse juste à une scène de conduite, dans les 30 premières secondes, sans compte. Pas un quiz de code. Pas un badge. **Une décision de conducteur validée par une explication de moniteur.**

### Démontrer qu'on évite des heures inutiles

Ne jamais l'affirmer, le faire calculer :
> « Une leçon de créneau où tu découvres tout sur place : 55 €.
> La même leçon préparée la veille : tu commences à la marche 3.
> Fais le calcul sur 20 heures. »

C'est honnête, non chiffré abusivement, et ça active la peur de perte sans mentir. **Ne jamais promettre « X heures économisées »** : c'est invérifiable et attaquable.

### Comparer au coût du permis sans manipuler

Le bloc « addition » actuel est juste. Une seule amélioration : le sortir de la fin de page et le poser juste avant le prix, avec une phrase de conclusion neutre : « PermiGo coûte moins qu'une demi heure de conduite. »

### Preuves à présenter avant la demande de paiement

Par ordre d'efficacité :
1. **La note de son propre examen blanc** (preuve personnelle, imbattable).
2. **Un avis élève réel** avec prénom, âge, ville et le résultat (« Yanis, 19 ans, Cergy — obtenu du premier coup »).
3. **La caution métier** : créé par un moniteur, sur le référentiel officiel REMC.
4. **La garantie** : remboursé sous 3 jours.
5. **Le nombre d'utilisateurs**, uniquement quand il sera flatteur.

### Rendre l'achat évident selon le payeur

- **Élève** : « moins qu'une demi heure de conduite ».
- **Parent** : « il arrive préparé, tu paies moins d'heures ».
- **Moniteur** : « tes élèves arrivent prêts, tes leçons vont plus loin ». 9,99 €, soit un dixième d'heure de travail.
- **Auto-école** : « vos moniteurs gagnent 10 minutes par leçon et vos élèves restent ».

### Augmenter la valeur perçue sans ajouter de fonctionnalité

- Nommer ce qui existe déjà : « 31 compétences officielles », « 59 scènes de conduite », « fiches par centre d'examen ».
- Montrer le volume : « 28 leçons restantes » vaut mieux que « accès complet ».
- Afficher la garantie deux fois plutôt qu'une.
- Dire qui l'a fait. Un nom et un visage valent dix arguments.

---

## 11. Recommandations de textes

### Trois promesses principales

1. **« Prépare ta leçon. Avant de monter en voiture. »** — la plus juste, la plus différenciante. À garder.
2. **« Arrive à ta leçon en sachant déjà quoi faire. »** — plus concrète, meilleure pour le débutant.
3. **« Ton permis se joue entre les leçons. »** — la plus vendeuse, la plus mémorisable, celle qui justifie le mieux l'abonnement.

### Trois accroches d'ouverture

1. « Demain 14 h. Créneau. Tu sais déjà quoi faire. »
2. « Une heure de conduite coûte 55 €. Ne la découvre pas sur place. »
3. « Une scène. Une décision. Trois secondes. »

### Trois appels à l'action

1. **« Essayer une scène · gratuit »** (principal, page publique)
2. **« Commencer gratuitement · 3 leçons offertes »** (secondaire)
3. **« Ouvrir tout mon parcours · 24,99 € »** (payant, jamais en haut de page)

### Version élève

> **Prépare ta leçon. Avant de monter en voiture.**
> Des scènes de conduite. Des fiches par leçon. Un examen blanc noté comme le jour J.
> *Essayer une scène · gratuit*

### Version moniteur

> **Tes élèves arrivent préparés. Tu ne remplis rien.**
> Ils préparent chaque leçon dans l'app. Toi tu vois qui avance et qui décroche.
> *Voir mon tableau de bord · 30 secondes*

### Version auto-école

> **Des élèves préparés. Des leçons qui vont plus loin.**
> Vos moniteurs gardent la main. L'élève travaille entre les heures.
> *Demander un devis*

### Version français facile

> **Tu as une leçon de conduite bientôt ?**
> PermiGo te montre quoi faire.
> Avec des images. Des phrases courtes.
> *Essayer · c'est gratuit*

Règles d'écriture de cette version : phrases de 6 mots maximum, un seul verbe par phrase, aucun idiome, aucune ironie, une image par idée.

### Logique multilingue

- **Détection** : `?lang=` du lien publicitaire → choix explicite mémorisé → langue du téléphone → français. Jamais l'inverse, et **ne jamais écrire un défaut dans la mémoire du navigateur**.
- **Français** : ton actuel, tutoiement, énergie.
- **Anglais** : ton plus factuel, et surtout le bloc déjà écrit « Learning in French? You keep your language ».
- **Arabe** : mise en page en miroir complète (déjà faite et bien faite), vocabulaire déjà validé (باقة, سيناريو الطريق).
- **Règle d'or, à dire dans les trois langues** : « On t'accueille dans ta langue. On t'entraîne dans la langue de l'examen. » C'est honnête, c'est le vrai argument, et c'est ce qui évite le reproche « votre app n'est pas traduite ».
- **Ce qu'il ne faut pas faire** : traduire l'app entière. L'examen est en français. La traduction sert d'échafaudage, pas de destination — ce que le produit fait déjà avec le français gardé sous la traduction.

### Preuves sociales et pédagogiques à afficher

- « Créé par un moniteur diplômé. »
- « Sur le référentiel officiel REMC · 31 compétences. »
- « Simulation notée sur les critères de l'examen. »
- Un avis élève par persona (débutant, examen proche, non francophone).
- La garantie 3 jours, deux fois.

### La meilleure manière de présenter le prix

> **Ouvre les 28 autres leçons**
> Une heure de conduite : 55 €
> Ton parcours complet : 24,99 € · soit 8,33 € par mois
> Satisfait ou remboursé sous 3 jours

Deux offres. Pas de prix barré. Pas de compte à rebours. Le prix comparé, pas le prix soldé.

---

## 12. Priorités immédiates

1. **B1** — la langue du visiteur (bug, une dizaine de lignes).
2. **B2** — le CTA gratuit et le lien depuis la connexion.
3. **B3** — le bandeau cookies compact.
4. **C3** — la date d'embarquement périmée.
5. **I5, I10, I11** — les chaînes fausses ou bancales (« ع », « la seule app », FAQ qui ignore l'arabe).

Ces cinq points sont faisables en une journée et ils touchent tous des sorties d'utilisateurs mesurables.

---

## 13. Plan d'action sur 7 jours

**Jour 1 · Les hémorragies**
- Corriger la priorité de langue (`lang.js` + `pass.js`), vérifier sur quatre langues de téléphone.
- Poser `<html lang>` et le titre d'onglet à la langue affichée.
- Corriger la date du billet, « ع » → « العربية », FAQ arabe, retirer « la seule app ».

**Jour 2 · Les portes**
- Bouton « Commencer gratuitement · 3 leçons offertes » sur la page d'accueil.
- Lien « Créer mon compte élève · gratuit » sur la page de connexion.
- Titre de l'inscription solo qui annonce le gratuit.
- Liens moniteur et auto-école en pied de page d'accueil.

**Jour 3 · Le premier écran**
- Bandeau cookies compact, différé.
- Écran de démarrage à 900 ms en première visite externe.
- Images en WebP ou AVIF, chargement différé sous la ligne de flottaison.

**Jour 4 et 5 · La démonstration**
- Scène « En situation » jouable sans compte, au dessus de la ligne de flottaison.
- Trois réponses tapables, explication de moniteur, enchaînement vers le gratuit.
- Mesure : taux de tap sur la scène, taux de passage scène → compte.

**Jour 6 · Le prix**
- Deux offres au lieu de trois, page publique alignée sur le mur interne.
- Bloc « addition » remonté juste avant les offres.
- Retrait de « Réserver ma place » au profit de « Ouvrir tout mon parcours ».

**Jour 7 · Les preuves**
- Collecter trois avis élèves réels (prénom, ville, résultat).
- Ajouter la caution « créé par un moniteur · référentiel REMC ».
- Publier, mesurer, comparer.

---

## 14. Plan d'amélioration sur 30 jours

**Semaine 2 — L'entrée dans l'app**
- Inverser l'onboarding : une scène jouée et une carte gagnée **avant** la configuration.
- Réduire l'inscription à deux champs.
- Une seule sollicitation par session, aucune à la première ouverture.
- Examen blanc de conduite offert une fois au compte gratuit.

**Semaine 3 — Les segments**
- Variante d'accroche pour « je démarre le permis » et pour « mon examen approche », branchées sur le mini diagnostic.
- Version française facile, activable par le sélecteur de langue au même titre que EN et AR.
- Page moniteur publique (aujourd'hui la promesse moniteur n'existe qu'après inscription).
- Lien entrant vers `#/pro`.

**Semaine 4 — La preuve et la mesure**
- Trois avis vidéo de 15 secondes, tournés au téléphone, un par persona.
- Compteur d'usage réel s'il est flatteur.
- Suivi de l'entonnoir complet : ouverture → scène jouée → compte créé → 3e leçon → mur → paiement. Aujourd'hui on ne mesure pas les deux premières marches parce qu'elles n'existent pas.
- Test A/B d'une seule chose : promesse 1 contre promesse 3 (« Prépare ta leçon » contre « Ton permis se joue entre les leçons »).

**Ce qu'il ne faut pas faire pendant ces 30 jours**
- Ajouter des fonctionnalités. Le produit en a déjà plus que ce qu'il montre.
- Refaire la direction artistique. Elle est bonne.
- Traduire toute l'app. Le français de l'examen est un choix pédagogique juste, il faut l'assumer et l'expliquer.

---

## Annexe — Mesures brutes

**Chargement de la page d'accueil, build de production, iPhone 13**

| Réseau | Premier pixel utile | DOM prêt | Titre lisible | Page complète | Poids |
|---|---|---|---|---|---|
| Wifi (30 Mb/s) | 468 ms | 420 ms | 800 ms | 1,2 s | 1,9 Mo |
| 4G lente (1,6 Mb/s · 150 ms) | 1,38 s | 1,82 s | 800 ms | 8,9 s | 1,9 Mo |
| 3G (1 Mb/s · 300 ms) | 1,13 s | 2,25 s | **≈ 4 s** | > 9 s | 830 Ko à 4 s |

**Langue affichée selon la langue du téléphone** (page d'accueil, première visite)

| Téléphone | Écran de démarrage | Page affichée | `permigo_lang` écrit |
|---|---|---|---|
| fr-FR | Bonjour | français | fr |
| en-US | Hello | **français** | fr |
| ar-EG | مرحبا | **français** | fr |
| bn-BD | (carrousel) | **français** | fr |

**Autres faits vérifiés**
- `#/rejoindre?solo=1` : 1 seule occurrence dans le code, sur l'écran post paiement.
- « gratuit » : 0 occurrence dans `pass.js`.
- `#/pro` : 0 lien entrant.
- Billet : « Embarquement JUIL. 2026 » au 1er août 2026.
- Offres : 3 sur la page publique, 2 dans `pass-requis.js`.
- Compte gratuit : C1a, C1b, C1c à vie · 3 questions par jour · 1 scène par jour.
- Onboarding élève : 4 sections de configuration, puis un tour guidé de 5 étapes.
- Onboarding moniteur : tour guidé de 4 étapes.
