# RAPPORT PRÉ-MODIFICATIONS — Mobile / safe-area

## CHANTIER

Correction proposée de la dimension **Mobile / safe-area** de
`AUDIT-CODE-HEALTH-2026-07-24.md`.

Cette branche est une copie de travail pour validation par Rayan/Claude :
aucun merge, aucune PR, aucun déploiement et aucune migration.

## BRANCHE

`codex/fix-mobile-safe-area-audit`

Base : `origin/main` au commit `6a1f48b`.

## FAIT

### Revalidation des 19 findings

- Les **3 usages actifs de `100vh`** sont remplacés par `100dvh` :
  arène de classement, blason moniteur et accueil moniteur.
- Les **2 écrans fixes réellement non protégés** (`signup` et
  `nouveau-mdp`) tiennent maintenant compte des quatre bords sûrs :
  encoche, îlot dynamique, bords en paysage et barre d'accueil.
- Les **8 pages ordinaires restantes** n'ont volontairement pas reçu de
  padding local. Elles sont déjà protégées par l'architecture commune :
  `body:not(.has-chrome)` pour les pages publiques, puis
  `header` + `#app` + barre basse pour les pages connectées. Ajouter les
  mêmes `env(safe-area-inset-*)` dans ces pages doublerait les espaces.
- `classement.js` et `classement-eleves.js` consomment le composant partagé
  `arene-rank.js`, qui gérait déjà les insets haut/bas et utilise maintenant
  `100dvh`.
- `ligue-semaine.js` ne rend aucun écran : il redirige vers `mon-blason`.
- `jeu-faute.js` et la partie immersive de `quiz.js` consomment le composant
  partagé `premium-quiz.js`, corrigé à la source.
- La page publique `ecole.js` reste couverte par le wrapper sans chrome ;
  ce wrapper protège désormais aussi les côtés gauche et droit en paysage.

### Protections renforcées

- Le header et la barre de navigation basse respectent désormais les safe
  areas gauche/droite sur les iPhone utilisés en paysage.
- Le quiz premium ajoute le safe-area du haut lorsqu'il masque le header.
- L'examen de conduite immersif ajoute le safe-area du haut et supprime
  l'espace bas réservé à une barre de navigation pourtant masquée.

### Couverture de l'audit Mobile / safe-area

- **19 findings revalidés**.
- **5 findings corrigés directement** : 2 surfaces fixes et 3 `100vh`.
- **5 findings corrigés au bon niveau partagé** : page publique, deux pages
  de quiz et deux pages de classement.
- **9 findings fermés par preuve architecturale**, sans ajout local risqué :
  8 pages couvertes par le wrapper et 1 module de redirection sans surface.
- **2 lacunes immersives révélées par la vérification ont été corrigées**.
- Aucun risque d'`overflow-x` supplémentaire trouvé ; la protection globale
  `html/body` existante est conservée.

## CONTRÔLES

- `npm run build` : **vert**, 241 modules transformés et 32 pages SEO
  générées.
- Playwright mobile `tests/e2e/a11y.spec.js` : **6/6 verts** :
  login, accueil élève, parcours, fiche compétence, validation enseignant et
  profil.
- Recherche statique : **aucun `100vh` actif restant dans `src/`**.
- Recherche statique : les écrans fixes et immersifs touchés couvrent les
  insets nécessaires.
- `git diff --check` : **vert**.

## RESTE

- Rayan/Claude : vérifier sur un vrai iPhone à encoche, en portrait puis en
  paysage, l'inscription, le changement de mot de passe, un quiz premium et
  l'examen de conduite.
- Ne pas ajouter de safe-area local aux 8 pages ordinaires sans retirer
  d'abord la compensation globale : cela créerait un double espacement.
- Si les anciens iPhone/Safari deviennent une cible explicite, décider avec
  Claude si un fallback `100vh` avant `100dvh` est encore utile. Le projet
  utilise déjà `100dvh` globalement et cible les navigateurs modernes.

## FICHIERS TOUCHÉS

- `permigo-game/src/styles/base.css`
- `permigo-game/src/components/common/header-top.js`
- `permigo-game/src/components/common/nav-bottom.js`
- `permigo-game/src/components/common/arene-rank.js`
- `permigo-game/src/components/eleve/premium-quiz.js`
- `permigo-game/src/pages/auth/signup.js`
- `permigo-game/src/pages/auth/nouveau-mdp.js`
- `permigo-game/src/pages/eleve/exam-conduite.js`
- `permigo-game/src/pages/enseignant/aujourdhui.js`
- `permigo-game/src/pages/enseignant/mon-blason.js`
- `RAPPORT-PREMODIFS-MOBILE-SAFE-AREA-2026-07-27.md`

## MIGRATIONS

Aucune.

## BLOQUEURS-RISQUES

- Les valeurs réelles de `env(safe-area-inset-*)` dépendent du matériel et du
  mode d'affichage Safari/PWA ; Chromium émule le mobile mais pas une encoche
  physique. La validation finale sur iPhone reste donc nécessaire.
- Le changement horizontal du header et de la barre basse est nul en portrait
  sans encoche ; il ne devient visible que lorsqu'un appareil expose un inset
  gauche ou droit.
- Aucun choix de design, couleur ou contenu n'a été fait dans ce chantier.

## DÉLÉGABLE

- **Claude/Rayan** : revue visuelle sur iPhone et décision de merge.
- **Codex** : appliquer mécaniquement un éventuel ajustement après retour
  précis (écran, orientation et bord concerné).
