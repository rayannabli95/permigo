# Registre des pré-modifications couleur — PermiGo

- Date : 26/07/2026
- Statut : **propositions isolées — non fusionnées, non déployées**
- Branche : `codex/fix-color-contrast`
- Base : `origin/main` au commit `6a1f48b`
Périmètre relu : `permigo-game/src/`

## À transmettre avec l'audit

L'audit complet reste isolé sur :

- branche : `codex/audit-code-health`
- commit : `747db53c93f33dc44b2e2bd9f38956781e6d67ea`
- rapport : `AUDIT-CODE-HEALTH-2026-07-24.md`
- résultat : 332 findings — 0 🔴, 208 🟠, 124 🟡

Ce registre documente le chantier couleur commencé ensuite. Il ne remplace pas
l'audit et ne prétend pas corriger ses 332 findings.

## Couverture du chantier couleur

- 210 fichiers présents dans `permigo-game/src/`.
- 201 fichiers JS/CSS relus pour les couleurs, les encres et les contrastes.
- 9 fichiers JSON sans CSS laissés hors du contrôle de rendu couleur.
- 54 fichiers source pré-modifiés.
- 147 fichiers JS/CSS relus sans modification.
- 11 commits de code indépendants avant le présent rapport.
- Build de production réussi : 241 modules transformés et 32 pages SEO générées.
- Aucun changement de données, Supabase, Stripe, migration, dépendance ou logique métier.

Les ratios ont été calculés avec la formule WCAG. La cible retenue pour les
textes normaux est `4,5:1`. Toutes les faces des palettes personnalisables qui
reçoivent une encre blanche sont maintenant au minimum à `4,65:1`.

## Lots préparés

### Lot 1 — formulaire élève et premières palettes

Commit : `13243fd` — `fix(ui): harmoniser les contrastes des accents`

- Le sélecteur de langue de `#/rejoindre` n'utilise plus les tokens globaux
  clair/sombre à l'intérieur de sa coque violette fixe.
- Les états actif et inactif utilisent maintenant la palette locale du
  formulaire.
- Les accents vert, cyan et orange ont été approfondis afin de recevoir du
  texte blanc sans libellé presque noir.
- Contraste mesuré du sélecteur : `9,84:1` inactif et `9,17:1` actif.
- Contrôle local effectué en thème clair sur `?solo=1#/rejoindre`.

Validation Claude/Rayan : vérifier à l'œil le sélecteur FR/EN/AR, l'état focus
doré et la sensation générale du formulaire.

### Lot 2 — CTA trophées moniteur

Commit : `ff244ff` — `fix(ui): corriger le contraste du CTA trophées`

- Le CTA bleu utilisait `--ens-ink-go`, token réservé à l'encre du vert
  moniteur.
- L'encre devient blanche et la face haute du bleu passe de `#6d6bff` à
  `#625ee8`.
- Contraste minimal du dégradé : `4,90:1`.

Validation Claude/Rayan : vérifier que ce CTA reste assez visible dans la carte
de premier démarrage.

### Lot 3 — palettes personnalisables complètes

Commit : `4aa8c3f` — `fix(ui): garantir le contraste des palettes d’accent`

- Les faces violet, bleu et rose rejoignent le même standard que vert, cyan et
  orange.
- Les thèmes boutique rose et rouge sont corrigés de la même façon.
- Le violet racine et l'indigo enseignant ont une face claire compatible avec
  du texte blanc.
- Minimum mesuré sur les 18 faces des six accents : `4,65:1`.
- Minimum mesuré sur les 12 faces des quatre thèmes boutique : `4,77:1`.

Validation Claude/Rayan : essayer les six couleurs du profil et les quatre
thèmes boutique, en clair et en sombre.

### Lot 4 — coques publiques et authentification

Commit : `7d558c1` — `fix(ui): assombrir les CTA des coques publiques`

- Les copies locales de l'ancien violet trop clair sont harmonisées dans
  connexion, inscription, invitation, Pass, formulaire pro et avis de départ.
- Le violet reste violet ; seules ses faces qui portent du texte blanc sont
  approfondies.

Validation Claude/Rayan : contrôler connexion, création de compte moniteur,
invitation, inscription élève et Pass sur mobile.

### Lot 5 — CTA violets élève

Commit : `1716928` — `fix(ui): renforcer les CTA violets élève`

- Onboarding, Réviser, Parcours, montée de niveau et révélation d'achat
  n'utilisent plus de lavande trop claire derrière du blanc.
- Les dégradés gardent leur relief et leur famille violette.

Validation Claude/Rayan : juger si le violet reste assez énergique sur les
écrans de célébration.

### Lot 6 — dégradés indigo cohérents

Commit : `ab6c992` — `fix(ui): homogénéiser les dégradés indigo`

- Les héros moniteur, la carte profil et la feuille de trophée utilisent les
  mêmes faces indigo contrastées.
- Les petits textes blancs des héros ne traversent plus une zone sous `4,5:1`.

Validation Claude/Rayan : contrôler Aujourd'hui, Livret, Séance, Blason,
Trophées et Profil.

### Lot 7 — encres des états colorés

Commit : `cd9eea1` — `fix(a11y): corriger les encres des états colorés`

- WhatsApp conserve son vert officiel et reçoit l'encre vert foncé lisible.
- Les boutons ambre conservent une encre brune, plus contrastée que du blanc.
- Les pastilles succès, danger, rang et installation utilisent soit une encre
  adaptée, soit une face plus profonde.

Validation Claude/Rayan : vérifier que les encres brunes sur l'ambre restent
volontaires et cohérentes avec les autres boutons or du jeu.

### Lot 8 — petits textes et pastilles

Commit : `9ac8dc4` — `fix(a11y): renforcer les petits textes colorés`

- Compteurs de récompense, rangs argent/bronze, initiales d'avatar, étiquette
  du Pass et touches de réponse passent le seuil normal.
- Les fallbacks indigo du routeur, de la révision et de la provenance sont
  harmonisés.

Validation Claude/Rayan : vérifier les très petites pastilles à taille réelle,
notamment sur téléphone.

### Lot 9 — accents dynamiques

Commit : `33f0040` — `fix(ui): uniformiser les CTA à accent dynamique`

- Les CTA de récap Révision et de déblocage ne posent plus une encre presque
  noire directement sur une couleur dynamique.
- La couleur dynamique est approfondie par `color-mix` et reçoit une encre
  blanche.
- Mesure sur les couleurs réellement possibles : minimum `4,65:1`.

Validation Claude/Rayan : regarder les variantes Diamant, Or, Argent, Bronze,
succès vert et palier ambre.

### Lot 10 — faces d'accent, sans reflet blanchissant

Commit : `7513579` — `fix(ui): utiliser les faces d’accent contrastées`

- Les CTA Accueil, Compte-rendu et Ligue utilisaient un mélange de l'accent
  avec du blanc, qui repassait sous le seuil pour certaines couleurs.
- Leur face haute utilise désormais `--a-lt`, déjà contrôlée et dans la même
  teinte.

Validation Claude/Rayan : confirmer que le relief 3D reste suffisant malgré le
reflet moins pâle.

### Lot 11 — variantes sémantiques profondes

Commit : `76a756a` — `fix(a11y): employer les variantes sémantiques profondes`

- Succès, attention, danger et information réutilisent les variantes profondes
  déjà présentes dans `base.css` lorsqu'elles portent du texte blanc.
- Les verts locaux de Récompenses et Compétence débloquée sont approfondis.
- L'onboarding clair et la salle des trophées n'emploient plus de violet clair
  sous du blanc.
- Aucun nouveau système de tokens n'a été créé.

Validation Claude/Rayan : contrôler les badges génériques, refus/suppression,
chronomètre urgent, écran compétence débloquée et Récompenses.

## Ce qui n'a volontairement pas été modifié

- Les 2 630 couleurs hex reportées dans l'audit ne sont pas 2 630 bugs. Les
  remplacer mécaniquement casserait les illustrations, médaillons, ombres,
  dégradés et palettes locales volontairement fixes.
- Les encres sombres sur l'or ou l'ambre ont été conservées lorsqu'elles donnent
  un meilleur contraste que le blanc.
- Les décorations sans texte, reflets, halos, ombres et couleurs utilisées par
  `background-clip:text` ne sont pas traitées comme un fond de lecture.
- Les icônes au-dessus du seuil non textuel `3:1` n'ont pas été assombries pour
  atteindre artificiellement `4,5:1`.
- Aucun jugement définitif de direction artistique n'est revendiqué : le code
  compile et les ratios sont mesurés, mais la validation visuelle finale reste
  à Claude ou Rayan.

## Risques et méthode de revue

Risque principal : plusieurs accents sont moins néon. Le contraste est meilleur,
mais Claude doit confirmer que l'énergie « Arène 3D » reste suffisante.

Ordre de revue conseillé :

1. `13243fd` seul pour le bug du sélecteur de langue et les premières encres.
2. `ff244ff` seul pour le mélange vert/bleu du CTA trophées.
3. `4aa8c3f` à `ab6c992` pour les palettes et les grands dégradés.
4. `cd9eea1` à `76a756a` pour les petits états et composants dynamiques.

Chaque lot peut être accepté, ajusté ou refusé sans fusionner les autres.

## État git

- Aucun merge.
- Aucune PR.
- Aucun déploiement.
- Aucune migration.
- Aucun `git add -A`.
- Branche de proposition uniquement ; `main` n'a pas été modifiée.
