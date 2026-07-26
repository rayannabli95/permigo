# Pré-modifications i18n issues de l’audit code health

## Statut

Préparation uniquement. Ces changements sont isolés sur `codex/fix-i18n-audit`, sans merge, PR, déploiement ni modification de `main`. Claude peut accepter, modifier ou refuser chaque coque séparément grâce aux commits atomiques.

- Base : `origin/main` au commit `6a1f48b`
- Périmètre : les 13 findings de la section i18n de `AUDIT-CODE-HEALTH-2026-07-24.md`
- Résultat préparé : 13 fichiers source, 13 commits, 1 733 insertions et 417 suppressions
- Langues ajoutées ou complétées : anglais et arabe, avec français conservé comme repli
- Base de données : aucune migration et aucun changement Supabase

## Lots préparés

| Commit | Fichier | Pré-modification |
|---|---|---|
| `51911af` | `permigo-game/src/pages/common/introuvable.js` | Titre, explication et retour à l’accueil traduits. |
| `1b0450e` | `permigo-game/src/pages/eleve/consent-blocked.js` | Écran d’attente du consentement et actions traduits. |
| `a22bc9e` | `permigo-game/src/pages/eleve/session-confirmation.js` | États, récapitulatif, erreurs et CTA de confirmation traduits. |
| `ee03296` | `permigo-game/src/pages/common/messages.js` | Liste, conversation, états vides, erreurs et attributs accessibles traduits. |
| `10df97b` | `permigo-game/src/pages/common/legal.js` | Politique de confidentialité, CGU et crédits préparés en anglais et arabe. |
| `043a171` | `permigo-game/src/pages/common/notifications.js` | Libellés d’actions de notification reliés aux helpers i18n. |
| `9d0dfdf` | `permigo-game/src/pages/common/profil.js` | Coques élève/moniteur, parrainage, compte et modales complétées. |
| `71487a1` | `permigo-game/src/pages/common/settings.js` | Réglages, abonnement, installation, confidentialité et modales complétés. |
| `3aa44f9` | `permigo-game/src/pages/eleve/boutique.js` | Erreur de solde insuffisant reliée au dictionnaire existant. |
| `1bdaf65` | `permigo-game/src/pages/eleve/recompenses.js` | Textes « tour gratuit », « vrai cadeau » et plafond centralisés. |
| `4423ffd` | `permigo-game/src/pages/eleve/roue.js` | Fallback riche de résultat sorti du HTML brut et relié à la ressource i18n. |
| `4cf20ef` | `permigo-game/src/pages/eleve/exam-blanc.js` | Consignes, résultats, verdicts, récapitulatifs, révisions ciblées, CTA, aria et RTL complétés. |
| `8672c74` | `permigo-game/src/pages/eleve/revision-conduite.js` | Hub, mondes, titres, jeu d’ordre et pont de certification traduits ; contenu de fiches existant réutilisé. |

## Contrôles effectués

- `node --check` réussi sur les 13 modules modifiés.
- `git diff --check origin/main...HEAD` réussi.
- Parité des clés anglais/arabe vérifiée sur 16 dictionnaires : aucune clé manquante. Les plus gros dictionnaires contrôlés contiennent notamment 129 clés par langue pour le profil, 111 pour les réglages, 68 pour l’examen blanc et 43 pour la révision conduite.
- `npm run build` réussi : 241 modules transformés et 32 pages SEO générées.
- Les artefacts temporaires `dist/` et le lien temporaire vers les dépendances ont été supprimés après le build.
- Aucun test visuel en navigateur n’a été réalisé.

Le build conserve trois avertissements Vite déjà présents sur le mélange d’imports statiques et dynamiques de `cur-user.js`, `auth.js` et `pwa.js`. Ils ne sont pas causés par ce lot i18n.

## Points à faire valider avant toute intégration

1. Le corpus juridique anglais/arabe est une traduction de travail. Le commit `10df97b` ne doit pas partir en production sans relecture juridique/DPO, notamment les durées de conservation, le consentement parental, la résiliation, le remboursement et le droit de rétractation.
2. Claude ou Rayan doit contrôler visuellement les écrans en anglais et arabe, surtout les retours à la ligne, les modales longues et les spans RTL.
3. Le libellé produit « Mon permis » a été traduit dans les phrases anglaises et arabes de la révision conduite ; confirmer si ce nom doit au contraire rester en français.
4. La phrase de confirmation `SUPPRIMER MON COMPTE` reste volontairement en français : le backend attend cette valeur exacte. Seules les explications autour sont traduites.
5. Le texte pédagogique source des fiches reste affiché en français sous sa traduction lorsqu’un écran applique le mode bilingue existant. Ce comportement est volontaire pour l’apprentissage au permis français.
6. Les contenus de notifications générés côté serveur ne sont pas traduits par ce lot : seules les actions de la coque client sont dans le périmètre.

## Fichiers touchés

- `permigo-game/src/pages/common/introuvable.js`
- `permigo-game/src/pages/common/legal.js`
- `permigo-game/src/pages/common/messages.js`
- `permigo-game/src/pages/common/notifications.js`
- `permigo-game/src/pages/common/profil.js`
- `permigo-game/src/pages/common/settings.js`
- `permigo-game/src/pages/eleve/boutique.js`
- `permigo-game/src/pages/eleve/consent-blocked.js`
- `permigo-game/src/pages/eleve/exam-blanc.js`
- `permigo-game/src/pages/eleve/recompenses.js`
- `permigo-game/src/pages/eleve/revision-conduite.js`
- `permigo-game/src/pages/eleve/roue.js`
- `permigo-game/src/pages/eleve/session-confirmation.js`
- `RAPPORT-PREMODIFS-I18N-2026-07-26.md`

## Rapport WORKFLOW

**CHANTIER**  
Pré-corrections i18n des 13 coques signalées par l’audit code health.

**BRANCHE**  
`codex/fix-i18n-audit`

**FAIT**  
13 lots atomiques préparés ; anglais/arabe miroir ; échappement contenu/attribut conservé ; RTL local ; syntaxe et build validés.

**RESTE À FAIRE**  
Revue visuelle et éditoriale Claude/Rayan ; revue juridique/DPO du commit légal ; décision d’accepter, modifier ou refuser chaque commit ; merge et déploiement uniquement après GO nommé.

**FICHIERS TOUCHÉS**  
13 fichiers JavaScript sous `permigo-game/src/` et ce rapport racine.

**MIGRATIONS**  
Aucune.

**BLOQUEURS-RISQUES**  
Traductions juridiques non validées ; rendu EN/AR non contrôlé à l’œil ; trois avertissements Vite préexistants ; contenus de notifications serveur hors périmètre.

**DÉLÉGABLE**  
Claude : contrôle visuel et décision par commit. Juriste/DPO : corpus légal. Rayan : validation produit des formulations et GO d’intégration.
