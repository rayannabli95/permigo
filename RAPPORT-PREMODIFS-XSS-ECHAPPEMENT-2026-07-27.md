# RAPPORT PRÉ-MODIFS — XSS / échappement

Date : 27/07/2026
Branche : `codex/fix-xss-escaping-audit`
Base : `origin/main` au commit `6a1f48b`
Statut : **copie isolée pour revue Claude/Rayan — rien n’est fusionné dans `main`**

## Résultat

- Les **23 findings XSS/échappement** de l’audit ont été revalidés un par un.
- Les pré-corrections touchent **28 fichiers source** : 23 emplacements signalés, plus leurs appelants directs et les utilitaires communs nécessaires.
- Aucun sink utilisateur activement exploitable n’avait été prouvé par l’audit. Ce lot durcit surtout les frontières avant qu’une future donnée libre ne les rende dangereuses.
- Aucune migration, aucun changement Supabase, aucun déploiement, aucun merge.

## Ce qui a été préparé

1. `components/common/bottom-sheet.js` — une chaîne HTML brute est désormais refusée. Les trois appelants doivent marquer explicitement leur gabarit interne déjà échappé avec `trustedBottomSheetHtml(...)`.
2. `components/common/arene-rank.js` — suppression des attributs et fragments HTML libres (`attrsOf`, `attrs`, `rightHtml`). Les scores passent par `{ value, suffix }`, les identifiants par `escAttr()`, les séries sont rendues dans le composant.
3. `components/common/toast.js` — couleur validée par liste blanche, type de toast limité, couleur appliquée avec l’API `style`.
4. `components/eleve/chest.js` — les récompenses utilisent maintenant des données typées (`iconName`, `iconImage`, `iconText`) au lieu d’un fragment brut.
5. `components/eleve/loot-toast.js` — textes échappés, icônes nommées limitées, URL d’image validée, variante CSS limitée.
6. `components/eleve/permis-card.js` — libellés ARIA avec `escAttr()` et fonds limités à une URL locale ou HTTPS validée.
7. `components/eleve/purchase-reveal.js` — URL du catalogue validée et halo coloré appliqué par l’API DOM.
8. `components/eleve/quiz-ui.js` — états de mascotte limités à `think`, `celebrate`, `coach` et `hello`.
9. `components/eleve/weekly-replay.js` — les cartes stockent un `DocumentFragment` privé, cloné dans le DOM, au lieu de réinjecter `c.content` comme chaîne ; compteurs convertis en nombres.
10. `components/eleve/xp-toast.js` — XP converti en entier et textes élève/trophée échappés avant toute éventuelle réactivation du fichier.
11. `utils/medallions.js` — retrait de `rawGlyph`, tailles bornées, formes/rampes/glyphes limités au catalogue et classes filtrées.
12. `pages/common/profil.js` — code de parrainage séparé correctement entre contenu `esc()` et attribut `escAttr()`.
13. `pages/onboarding/index.js` — couleurs d’accent validées, puis attribut `style` échappé en entier.
14. `pages/eleve/accueil.js` — identifiant de compétence encodé comme segment de route, puis route échappée avec `escAttr()`.
15. `pages/eleve/boutique.js` — couleur de rareté limitée aux syntaxes autorisées et attribut `style` échappé en entier.
16. `pages/eleve/compte-rendu.js` — progression bornée entre 0 et 100, puis largeur appliquée avec `element.style.width`.
17. `pages/eleve/exam-blanc.js` — état de mascotte limité à `hello` ou `think`.
18. `pages/eleve/galerie.js` — URL d’asset et couleurs validées ; fonds et variables CSS appliqués par l’API DOM ; libellés ARIA corrigés.
19. `pages/eleve/parcours.js` — cinq routes de révision/certification encodent le segment puis utilisent `escAttr()`.
20. `pages/eleve/valider-seul.js` — route de fiche encodée puis échappée comme attribut.
21. `pages/enseignant/bilan.js` — couleur de score remplacée par quatre classes CSS fermées.
22. `pages/enseignant/insights.js` — deux routes de livret encodent l’identifiant puis utilisent `escAttr()`.
23. `pages/gerant/cockpit.js` — couleurs KPI/légende validées puis appliquées par l’API DOM ; couleurs du donut également validées.

Deux helpers communs ont été ajoutés à `utils/escape.js` :

- `safeCssColor()` accepte uniquement un hexadécimal valide, un token `var(--...)`, `transparent` ou `currentColor`.
- `safeAssetUrl()` accepte uniquement un chemin local commençant par `/` ou une URL HTTPS ; `javascript:`, `data:`, les URL `//...`, les contrôles et caractères cassant une URL CSS sont refusés.

## Contrôles effectués

- `node --check` sur les 28 fichiers JavaScript modifiés : **OK**.
- Test direct des helpers avec valeurs sûres et charges `javascript:` / déclaration CSS injectée : **OK**.
- Recherche des anciens motifs signalés (`rawGlyph`, `attrsOf`, `rightHtml`, routes avec `esc()` en attribut, couleurs/styles visés) : **aucune occurrence résiduelle dans les emplacements corrigés**.
- `git diff --check` : **OK**.
- `npm run build` : **OK**, 241 modules transformés et 32 pages SEO générées.
- Playwright ciblé sur accessibilité, examen blanc, bilan, stats enseignant et galerie/états vides : **21 réussis, 1 ignoré, 0 échec**.

La suite Playwright complète a aussi été lancée, sans troncature silencieuse :

- **98 réussis**
- **8 ignorés**
- **16 échoués**

Les 16 échecs se regroupent dans quatre attentes déjà divergentes de `origin/main` :

- navigation basse : le test exige que tous les labels inactifs aient une opacité quasi nulle ; `nav-bottom.js` n’est pas touché par cette branche ;
- quêtes : le test attend `.dq-reward`, absent du rendu actuel ; `daily-quests.js` n’est pas touché ;
- ancienne validation enseignant : quatre tests bloquent avant le toast, car les mondes REMC n’apparaissent plus après la sélection ; la page de validation n’est pas touchée ;
- onboarding : le test exige toujours `#ob-skip`, alors que le code de `origin/main` retire volontairement « Passer » lorsque l’identité/date de naissance est obligatoire. Le seul changement onboarding de ce lot concerne l’échappement des couleurs.

## Fichiers touchés

### Utilitaires et composants communs

- `permigo-game/src/utils/escape.js`
- `permigo-game/src/utils/medallions.js`
- `permigo-game/src/components/common/arene-rank.js`
- `permigo-game/src/components/common/bottom-sheet.js`
- `permigo-game/src/components/common/toast.js`
- `permigo-game/src/components/enseignant/trophy-sheet.js`

### Composants élève

- `permigo-game/src/components/eleve/chest.js`
- `permigo-game/src/components/eleve/loot-toast.js`
- `permigo-game/src/components/eleve/permis-card.js`
- `permigo-game/src/components/eleve/purchase-reveal.js`
- `permigo-game/src/components/eleve/quiz-ui.js`
- `permigo-game/src/components/eleve/weekly-replay.js`
- `permigo-game/src/components/eleve/xp-toast.js`

### Pages

- `permigo-game/src/pages/common/profil.js`
- `permigo-game/src/pages/onboarding/index.js`
- `permigo-game/src/pages/eleve/accueil.js`
- `permigo-game/src/pages/eleve/boutique.js`
- `permigo-game/src/pages/eleve/classement.js`
- `permigo-game/src/pages/eleve/compte-rendu.js`
- `permigo-game/src/pages/eleve/exam-blanc.js`
- `permigo-game/src/pages/eleve/galerie.js`
- `permigo-game/src/pages/eleve/parcours.js`
- `permigo-game/src/pages/eleve/trophees.js`
- `permigo-game/src/pages/eleve/valider-seul.js`
- `permigo-game/src/pages/enseignant/bilan.js`
- `permigo-game/src/pages/enseignant/classement-eleves.js`
- `permigo-game/src/pages/enseignant/insights.js`
- `permigo-game/src/pages/gerant/cockpit.js`

## Points à faire valider par Claude

1. `trustedBottomSheetHtml()` impose un contrat explicite et refuse les chaînes brutes, mais ce n’est pas un assainisseur HTML. Si Claude préfère une garantie plus forte, il faudra convertir les trois grandes feuilles en construction DOM complète.
2. `safeAssetUrl()` refuse volontairement `http:`, `blob:` et `data:`. Le catalogue actuel utilise des chemins locaux/HTTPS ; vérifier qu’aucun futur asset légitime ne dépend d’un autre schéma.
3. `safeCssColor()` refuse volontairement `rgb()`, `color-mix()` et les dégradés lorsqu’ils proviennent d’une donnée dynamique. Les dégradés statiques du code restent inchangés.
4. `xp-toast.js` est actuellement non référencé. Une autre branche de nettoyage peut choisir de le supprimer plutôt que de conserver son durcissement.
5. Cette branche touche des fichiers également concernés par d’autres lots d’audit. Claude doit choisir l’ordre de reprise et résoudre les chevauchements avant merge.
6. Une vérification visuelle reste nécessaire sur boutique, galerie, classement, cartes permis et toasts. Codex a vérifié le DOM, le build et les tests, pas le rendu à l’œil.

## Décision attendue

Claude/Rayan peut :

- approuver le lot entier ;
- reprendre seulement les correctifs mécaniques et demander une autre architecture pour les fragments HTML de confiance ;
- refuser un point visuel précis sans perdre les autres corrections, puisque tout est isolé sur cette branche.
