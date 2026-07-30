# RAPPORT PRÉ-MODIFICATIONS — Performance

## CHANTIER

Correction proposée de la dimension **Performance** de
`AUDIT-CODE-HEALTH-2026-07-24.md`.

Cette branche est une copie de travail pour validation par Rayan/Claude :
aucun merge, aucune PR, aucun déploiement et aucune migration.

## BRANCHE

`codex/fix-performance-audit`

Base : `origin/main` au commit `6a1f48b`.

## FAIT

### Chargement initial et réseau

- Les faux imports dynamiques de `pwa.js`, `cur-user.js` et `auth.js` ont été
  retirés : Vite les regroupait déjà dans le bundle principal.
- Le préchargement des routes chaudes est désactivé si l'élève utilise
  l'économiseur de données, une connexion 2G, est hors ligne ou a placé
  l'onglet en arrière-plan.
- La vidéo d'introduction passe de `preload="auto"` à `preload="none"` et ne
  commence à charger qu'après le clic explicite sur « OK ».

### Données pédagogiques

- Ajout d'une métadonnée légère des 31 fiches et de leurs 4 mondes.
- Les quatre JSON de fiches sont désormais chargés chapitre par chapitre.
- Les quatre banques de quiz conduite sont chargées chapitre par chapitre.
- « Trouve la faute » ne charge plus les quatre banques de quiz conduite.
- Le hub « Réviser » n'importe plus 31 fiches et 71 situations pour afficher
  deux compteurs.
- Le parcours et la certification autonome chargent seulement la fiche
  réellement ouverte.
- Le compte-rendu moniteur et le centre d'examen n'importent plus les fiches
  pédagogiques complètes pour une vérification de code ou un titre.
- La page de révision conduite affiche son hub avec les seules métadonnées,
  puis charge la fiche, le quiz et les traductions au moment où ils servent.
- L'écran de sélection de l'examen blanc est séparé des questions. Les
  questions, traductions et données d'un centre ne chargent qu'au démarrage du
  mode correspondant.
- Les traductions des situations ne chargent plus pour un élève francophone.

Résultat mesuré sur le build :

- `exam-blanc` : environ **222 Ko → 52 Ko** au premier affichage ;
- questions examen : paquet séparé d'environ **74 Ko** ;
- traductions examen : paquet séparé d'environ **99 Ko** ;
- traductions situations : paquet séparé d'environ **37 Ko** ;
- fiches : quatre paquets séparés d'environ **17 à 24 Ko** ;
- quiz conduite : quatre paquets séparés d'environ **8 à 10 Ko**.

### Images

- 29 images actives converties en WebP **sans perte** : mêmes pixels et même
  transparence.
- Poids cumulé des images concernées : **7,59 Mio → 5,07 Mio**, soit
  **33,1 %** de moins au téléchargement.
- Captures Pass/Réviser, badges, coffres, avatars et monde Circulation pointent
  vers leurs variantes WebP.
- Largeur, hauteur et `decoding="async"` ajoutés aux images touchées.
- Compatibilité conservée avec les anciens chemins PNG d'avatar déjà stockés
  en base. Les PNG originaux restent présents pour cette raison et pour
  faciliter la validation visuelle de Claude.

### Couverture de l'audit Performance

- **19 findings traités complètement**.
- **5 findings améliorés mais pas complètement supprimés** : les gros fichiers
  i18n sont chargés à la demande, mais restent communs à EN/AR ; les questions
  examen restent dans un paquet unique ; les captures Pass n'ont pas encore de
  `srcset`.
- **6 findings volontairement laissés à Claude** : découpage géographique des
  centres, segmentation des situations, extraction des phases de l'examen
  conduite et découpage des trois très gros fichiers source.

## CONTRÔLES

- Métadonnées comparées aux JSON : **31/31 fiches**, aucun code ou titre
  divergent ; total des situations confirmé à **71**.
- `npm run build` : **vert**, 244 modules transformés et 32 pages SEO générées.
- Examen blanc Playwright : **8/8 verts** sur desktop et mobile :
  sélection, parcours complet, examen officiel et révision par centre.
- Parcours Playwright : **4/4 verts** sur desktop et mobile :
  ouverture et fermeture d'une fiche après chargement à la demande.
- Onboarding : sélection d'avatar, progression au scroll et non-réapparition
  passent sur desktop/mobile. Quatre assertions existantes restent rouges car
  le test exige `#ob-skip`, alors que `main` masque volontairement ce bouton
  lorsque l'identité/date de naissance est obligatoire. Le diff de ce chantier
  ne modifie pas cette règle.
- `git diff --check` : **vert**.
- Contrôle WebP : conteneurs `VP8L`, format **Lossless**, dimensions et alpha
  conservés.

## RESTE À FAIRE

- Rayan/Claude : valider visuellement les captures, coffres, avatars et badges.
- Claude : décider si les anciens PNG non nécessaires hors compatibilité avatar
  doivent être retirés après validation.
- Claude : décider si les centres doivent réellement être découpés par zone.
  Cela touche leur source de vérité SEO et mérite un chantier séparé.
- Claude : décider d'une stratégie de sessions de situations par thème avant de
  fractionner le corpus.
- Ajouter des variantes 390 px/780 px et un `srcset` aux captures du Pass si la
  qualité responsive est validée à l'œil.
- Mettre à jour les deux tests onboarding qui supposent toujours la présence
  inconditionnelle du bouton « Passer ».

## FICHIERS TOUCHÉS

- **Chargement/runtime** : `src/main.js`, `src/router.js`,
  `src/services/notif-listener.js`, `src/pages/onboarding/video-intro.js`.
- **Nouvelles métadonnées/chargeurs** : `src/data/conduite-meta.js`,
  `src/data/fiches-loader.js`, `src/data/quiz-conduite-loader.js`,
  `src/data/parcours-quiz-meta.js`.
- **Données existantes** : `src/data/parcours-quiz.js`, `src/data/worlds.js`.
- **Pages élève** : `accueil.js`, `centre-examen.js`, `en-situation.js`,
  `exam-blanc.js`, `jeu-faute.js`, `mes-coffres.js`, `parcours.js`,
  `reviser.js`, `revision-conduite.js`, `valider-seul.js`.
- **Pages enseignant/publiques/onboarding** : `log-session.js`, `pass.js`,
  `onboarding/index.js`.
- **Composants/utilitaires** : `avatar.js`, `avatar-picker.js`, `chest.js`,
  `assets.js`.
- **Assets** : 29 nouveaux `.webp` sous `public/art/reviser/`,
  `public/showcase/`, `public/skins/avatars/`, `public/skins/chests/` et
  `public/skins/`.

## MIGRATIONS

Aucune.

## BLOQUEURS-RISQUES

- Validation visuelle requise avant merge, surtout pour les ratios des coffres
  et le cadrage des captures. La conversion elle-même est sans perte.
- Le premier clic sur une fiche/quiz peut maintenant attendre le téléchargement
  d'un petit paquet. Il n'y a pas encore de skeleton spécifique pendant ces
  quelques millisecondes.
- Les métadonnées légères dupliquent les titres des 31 fiches et le compteur
  `71`. Si le corpus change, ces métadonnées doivent être mises à jour en même
  temps ; un contrôle de build automatique serait préférable à terme.
- Le découpage EN/AR par langue n'est pas fait : il demanderait de séparer les
  fichiers de traduction, avec davantage de risque de désynchronisation.

## DÉLÉGABLE

- **Claude** : revue visuelle, arbitrage sur les PNG, `srcset`, centres et
  situations.
- **Codex** : ajouter un contrôle automatique métadonnées ↔ JSON, mettre à jour
  les tests onboarding, puis appliquer mécaniquement les arbitrages validés.
