# Pré-modifications accessibilité issues de l’audit code health

## Statut

Préparation uniquement. Les changements sont isolés sur `codex/fix-accessibilite-audit`, sans merge, PR, déploiement ni modification de `main`.

- Base : `origin/main` au commit `6a1f48b`
- Périmètre : les 33 findings de la section « Accessibilité » de `AUDIT-CODE-HEALTH-2026-07-24.md`
- Résultat : 27 findings ont nécessité du code ; 6 findings étaient déjà conformes et n’ont pas été modifiés
- Modifications : 27 fichiers source, 65 insertions et 50 suppressions
- Base de données : aucune migration et aucun changement Supabase

## Ce qui a été préparé

### Composants partagés — commit `90dee71`

- Boutons globaux `.btn` et `.btn-sm` portés à 44 px.
- Fermeture des toasts : zone invisible de 44 px, sans grossir la pastille de 22 px.
- Fermetures des écrans de célébration, déblocage, récapitulatif et replay portées à 44 px.
- Boutons icône et avatar du header portés à 44 px ; l’avatar interne reste à 36 px.
- CTA et fermeture du bandeau émotionnel sécurisés.
- Onglets des récompenses portés à 44 px.

### Coques communes — commit `ab36f48`

- Retour de la messagerie : zone invisible de 44 px.
- Fermeture de la modale de pseudo du profil : zone invisible de 44 px.
- Boutons de thème et pastilles de couleur des réglages portés à 44 px.

### Pages élève — commit `2ac6fbd`

- CTA d’installation de l’accueil porté à 44 px.
- Fermeture de la galerie : zone invisible de 44 px.
- Champ et sauvegarde de date d’examen, ainsi que reprise après erreur, portés à 44 px.
- Quatre boutons retour de la révision conduite portés à 44 px.
- Retours de la roue et de la certification portés à 44 px.
- Retour de confirmation de séance : zone invisible de 44 px.

### Pages moniteur — commit `9e5f94a`

- Retour et partage du compte-rendu de séance portés à 44 px.
- Menus, onglets, cloche, segments et action d’annulation de « Mes élèves » portés à 44 px.
- La petite croix d’effacement de recherche, oubliée dans la ligne d’audit mais rencontrée dans le même fichier, reçoit une zone invisible de 44 px.
- Retour, bouton de gain et switch des récompenses moniteur portés à 44 px.
- Le rail visuel du switch moniteur reste à 28 px au centre de la zone interactive.

### Onboarding, pages publiques et provenance — commit `f7e5c8d`

- Switch de rappels onboarding porté à une zone de 44 px, avec rails visuels sombre de 36 px et clair de 34 px conservés.
- Fermeture de la vidéo d’introduction portée à 44 px.
- Boutons afficher/masquer le mot de passe portés à 44 px sur les trois formulaires publics.
- Couleurs prédéfinies et couleur libre de provenance portées à 44 px.

## Findings vérifiés sans modification

Ces six fichiers avaient déjà une cible effective de 44 px malgré une boîte visuelle plus petite :

- `pages/common/legal.js` : bouton 36 px avec pseudo-élément de 4 px sur chaque bord.
- `pages/common/notifications.js` : bouton 36 px avec pseudo-élément de 4 px sur chaque bord.
- `pages/eleve/compte-rendu.js` : bouton 36 px avec pseudo-élément de 4 px sur chaque bord.
- `pages/eleve/feedback.js` : bouton 36 px avec pseudo-élément de 4 px sur chaque bord.
- `pages/eleve/mes-coffres.js` : bouton 36 px avec pseudo-élément de 4 px sur chaque bord.
- `pages/eleve/mes-lecons.js` : bouton 36 px avec pseudo-élément de 4 px sur chaque bord.

Deux findings partiellement faux positifs ont néanmoins nécessité une autre correction dans leur fichier :

- `pages/common/profil.js` : le toggle de 26 px est décoratif et inclus dans une ligne interactive de 60 px ; seule la fermeture de modale devait être agrandie.
- `pages/common/settings.js` : le retour de 38 px avait déjà une zone effective de 46 px ; seuls les thèmes et couleurs demandaient une correction.

## Contrôles effectués

- 55/55 contrôles statiques réussis sur les dimensions réelles ou les zones invisibles.
- `node --check` réussi sur les 26 fichiers JavaScript modifiés.
- `git diff --check origin/main...HEAD` réussi.
- `npm run build` réussi : 241 modules transformés et 32 pages SEO générées.
- Les artefacts temporaires `dist/` et le lien temporaire vers les dépendances ont été supprimés après le build.
- Aucun test visuel ou tactile sur appareil n’a été réalisé.

Le build conserve trois avertissements Vite préexistants sur le mélange d’imports statiques et dynamiques de `cur-user.js`, `auth.js` et `pwa.js`. Ils ne sont pas causés par ce lot.

## Points à faire valider par Claude ou Rayan

1. Espacement du header après passage des boutons icône et avatar à 44 px.
2. Hauteur des onglets dans les récompenses, les réglages et « Mes élèves ».
3. Switch onboarding en thème clair et sombre : zone de 44 px, rail visuel volontairement inchangé.
4. Switch des récompenses moniteur : zone de 44 px, rail de 28 px centré.
5. Feuille provenance : pastilles désormais visuellement à 44 px.
6. Zones invisibles des petites fermetures : vérifier sur téléphone qu’elles ne chevauchent pas une action voisine.

## Fichiers touchés

- `permigo-game/src/styles/components.css`
- `permigo-game/src/components/common/celebrate-screen.js`
- `permigo-game/src/components/common/header-top.js`
- `permigo-game/src/components/common/unlock-screen.js`
- `permigo-game/src/components/eleve/emotional-banner.js`
- `permigo-game/src/components/eleve/recompenses-tabs.js`
- `permigo-game/src/components/eleve/revision-recap.js`
- `permigo-game/src/components/eleve/weekly-replay.js`
- `permigo-game/src/pages/common/messages.js`
- `permigo-game/src/pages/common/profil.js`
- `permigo-game/src/pages/common/settings.js`
- `permigo-game/src/pages/eleve/accueil.js`
- `permigo-game/src/pages/eleve/galerie.js`
- `permigo-game/src/pages/eleve/mon-permis.js`
- `permigo-game/src/pages/eleve/revision-conduite.js`
- `permigo-game/src/pages/eleve/roue.js`
- `permigo-game/src/pages/eleve/session-confirmation.js`
- `permigo-game/src/pages/eleve/valider-seul.js`
- `permigo-game/src/pages/enseignant/log-session.js`
- `permigo-game/src/pages/enseignant/mes-eleves.js`
- `permigo-game/src/pages/enseignant/recompenses.js`
- `permigo-game/src/pages/onboarding/index.js`
- `permigo-game/src/pages/onboarding/video-intro.js`
- `permigo-game/src/pages/public/creer-compte.js`
- `permigo-game/src/pages/public/rejoindre.js`
- `permigo-game/src/pages/public/signup.js`
- `permigo-game/src/utils/provenance.js`
- `RAPPORT-PREMODIFS-ACCESSIBILITE-2026-07-27.md`

## Rapport WORKFLOW

**CHANTIER**  
Pré-corrections des 33 findings d’accessibilité de l’audit code health.

**BRANCHE**  
`codex/fix-accessibilite-audit`

**FAIT**  
27 fichiers corrigés, 6 findings déjà conformes vérifiés, 55 contrôles tactiles réussis, syntaxe et build validés.

**RESTE À FAIRE**  
Revue visuelle et tactile Claude/Rayan ; décision d’accepter, modifier ou refuser les cinq commits ; merge et déploiement uniquement après GO nommé.

**FICHIERS TOUCHÉS**  
27 fichiers sous `permigo-game/src/` et ce rapport racine.

**MIGRATIONS**  
Aucune.

**BLOQUEURS-RISQUES**  
Pas de contrôle sur appareil réel ; vérifier l’espacement du header, les onglets, les switches clair/sombre et le chevauchement éventuel des zones invisibles.

**DÉLÉGABLE**  
Claude : contrôle visuel par commit. Rayan : test tactile sur téléphone et GO d’intégration.
