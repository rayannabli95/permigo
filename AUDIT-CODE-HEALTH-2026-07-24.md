# Audit « santé du code » PermiGo — 24 juillet 2026

Branche auditée : `codex/audit-code-health`, créée depuis `origin/main` au commit `6a1f48b503490975ee442391af7ac742c296012b`.

Périmètre exclusif : `permigo-game/src/` — 210 fichiers, soit 196 JavaScript, 9 JSON et 5 CSS (4 349 384 octets). `permigo-v7/` hors `permigo-game/src/`, `node_modules`, `dist`, les assets binaires de `public/`, les fonctions Edge absentes du dépôt, les migrations et les données de production n'ont pas été scannés. Aucun résultat n'a été tronqué silencieusement ; chaque regroupement et chaque exclusion sont explicités dans sa section.

## Totaux

| Sévérité | Nombre |
|---|---:|
| 🔴 Casse / faille | 0 |
| 🟠 À corriger | 208 |
| 🟡 Cosmétique / dette | 124 |
| **Total** | **332** |

Méthode : inventaire exhaustif des sources, recherches syntaxiques et lexicales, suivi du graphe d'import depuis `src/main.js`, inspection manuelle des candidats et build Vite de contrôle. Le build est vert (241 modules transformés). Les constats sont statiques : ils ne remplacent ni un test navigateur, ni un audit avec données de production, ni un profilage sur appareil réel.

## 1. Gestion d'erreurs Supabase

Couverture — 210 fichiers scannés, 291 racines `sb.from(...)` / `sb.rpc(...)` recensées, 275 requêtes participant à une expression attendue, dont 157 `await` directs, 29 findings. Les appels `sb.auth.*`, `sb.functions.invoke(...)` et les fonctions Edge ne relèvent pas de la règle précise demandée et sont laissés de côté. Les requêtes qui vérifient déjà `error`, lèvent l'erreur ou la propagent explicitement ont été vérifiées puis exclues.

- [🟠] permigo-game/src/auth/auth.js:119 — la lecture du profil ne récupère que `data` et confond une erreur Supabase avec l'absence de profil — déstructurer `error`, le journaliser ou le lever avant le fallback.
- [🟠] permigo-game/src/pages/common/notifications.js:896 — le résultat de la suppression de notification est ignoré — vérifier `error` et restaurer l'UI ou afficher un échec.
- [🟠] permigo-game/src/pages/common/profil.js:648 — la requête de profil ignore `error` — vérifier `error` avant d'utiliser les données ou les fallbacks.
- [🟠] permigo-game/src/pages/common/profil.js:662 — le `Promise.all` validations/série/parrainage ne contrôle pas les erreurs Supabase de chaque résultat — déstructurer et traiter chaque `error` avant le rendu.
- [🟠] permigo-game/src/pages/common/profil.js:697 — le `Promise.all` des statistiques moniteur ignore les erreurs des requêtes — vérifier chaque résultat et distinguer indisponibilité et valeur nulle.
- [🟠] permigo-game/src/pages/common/profil.js:1784 — le `Promise.allSettled` ignore les statuts et erreurs de profil, validations et série — contrôler `status` puis `value.error` pour chaque requête.
- [🟠] permigo-game/src/pages/common/profil.js:2442 — les requêtes concurrentes du profil enseignant n'examinent pas leurs erreurs Supabase — traiter chaque `error` avant le calcul des statistiques.
- [🟠] permigo-game/src/pages/eleve/boutique.js:895 — `profileRes.value.error` n'est jamais contrôlé alors que le catalogue l'est — appliquer le même contrôle au résultat profil.
- [🟠] permigo-game/src/pages/eleve/classement.js:242 — plusieurs RPC du classement ignorent `error`, dont `theorieWeeklyRes.error` — vérifier chaque RPC au lieu de ne traiter que l'échec agrégé.
- [🟠] permigo-game/src/pages/eleve/examen.js:521 — quatre résultats Supabase sur cinq du `Promise.allSettled` ignorent leur erreur — contrôler `status` et `value.error` pour chaque source.
- [🟠] permigo-game/src/pages/eleve/mon-permis.js:948 — les erreurs du profil, des séances et du compteur de comptes-rendus sont ignorées — traiter les cinq résultats uniformément avant assemblage.
- [🟠] permigo-game/src/pages/eleve/recompenses.js:799 — les erreurs des validations, auto-validations et classements sont ignorées — vérifier chaque `error` et afficher un état partiel explicite.
- [🟠] permigo-game/src/pages/eleve/session-confirmation.js:360 — la requête de validation ne récupère que `data` — déstructurer et traiter `error` avant de décider de l'état.
- [🟠] permigo-game/src/pages/eleve/valider-seul.js:392 — seul le statut de la promesse est testé, pas `value.error` — contrôler les erreurs Supabase des promesses accomplies.
- [🟠] permigo-game/src/pages/enseignant/aujourdhui.js:590 — trois des six requêtes concurrentes ignorent leurs erreurs — vérifier les résultats hier, profils et total avant les KPI.
- [🟠] permigo-game/src/pages/enseignant/aujourdhui.js:675 — la pagination des validations consomme `data` sans vérifier `error` — interrompre ou signaler la pagination en erreur.
- [🟠] permigo-game/src/pages/enseignant/aujourdhui.js:680 — la pagination des compétences acquises ignore `error` — traiter l'erreur de page avant d'ajouter les données.
- [🟠] permigo-game/src/pages/enseignant/aujourdhui.js:695 — la requête d'examens ignore `error` — vérifier l'erreur avant de calculer les indicateurs.
- [🟠] permigo-game/src/pages/enseignant/bilan.js:530 — la requête école ignore son erreur alors que celle du bilan est contrôlée — vérifier les deux résultats avant le rendu.
- [🟠] permigo-game/src/pages/enseignant/classement-eleves.js:58 — seules les erreurs profils sont traitées ; validations, examens et séries sont silencieuses — vérifier chaque résultat du lot.
- [🟠] permigo-game/src/pages/enseignant/livret-remc.js:396 — la lecture du profil élève ignore `error` — traiter l'erreur avant le cas « élève introuvable ».
- [🟠] permigo-game/src/pages/enseignant/livret-remc.js:405 — la lecture des validations ignore `error` — vérifier l'erreur avant de construire le livret.
- [🟠] permigo-game/src/pages/enseignant/mes-eleves.js:694 — les erreurs validations et examens du chargement principal sont ignorées — contrôler chaque résultat, y compris la RPC d'engagement.
- [🟠] permigo-game/src/pages/enseignant/mon-blason.js:299 — les erreurs profil, activité et école sont ignorées — vérifier tous les résultats concurrents avant le blason.
- [🟠] permigo-game/src/pages/public/ecole.js:368 — la recherche d'école par slug ignore `error` — traiter l'erreur avant le fallback par identifiant.
- [🟠] permigo-game/src/pages/public/ecole.js:376 — la recherche d'école par identifiant ignore `error` — distinguer erreur réseau et école absente.
- [🟠] permigo-game/src/pages/public/ecole.js:387 — la requête des moniteurs ignore `error` — vérifier l'erreur avant d'afficher un effectif nul.
- [🟠] permigo-game/src/pages/public/ecole.js:395 — le comptage des élèves ignore `error` — vérifier l'erreur avant le KPI.
- [🟠] permigo-game/src/services/web-push.js:122 — la requête analytique ignore `error` — vérifier et journaliser l'échec sans masquer l'état réel.

## 2. XSS / échappement

Couverture — 210 fichiers scannés, 362 affectations `innerHTML` recensées et leurs interpolations inspectées, 23 findings. Les chaînes statiques, SVG/icônes internes, fragments HTML construits localement avec leurs champs déjà échappés et traductions riches de confiance ont été laissés de côté. La règle appliquée est stricte : `esc()` en contenu, `escAttr()` en attribut ; pour `style`, URL et HTML volontairement riche, une validation de schéma ou une API DOM dédiée est nécessaire. Aucun sink activement exploitable par une donnée utilisateur non échappée n'a été prouvé, d'où l'absence de 🔴.

- [🟠] permigo-game/src/components/common/bottom-sheet.js:55 — l'API générique affecte directement son paramètre `html` à `innerHTML` sans contrat de confiance vérifiable — accepter un nœud DOM, un type TrustedHTML ou assainir à la frontière.
- [🟠] permigo-game/src/components/common/arene-rank.js:282 — `attrsOf`, `attrs`, `rightHtml`, `fmtScore` et `meLabel` peuvent injecter du HTML ou des attributs bruts — séparer les données des fragments et appliquer `esc()` / `escAttr()` dans le composant.
- [🟠] permigo-game/src/components/common/toast.js:125 — la couleur injectée dans `style` passe par `esc()`, qui ne sécurise pas le contexte CSS/attribut — valider la couleur par liste blanche puis utiliser `escAttr()`.
- [🟡] permigo-game/src/components/eleve/chest.js:233 — `r.icon` est injecté brut dans `innerHTML`, même si la liste est aujourd'hui interne — rendre l'icône comme nœud sûr ou documenter et valider le fragment SVG autorisé.
- [🟠] permigo-game/src/components/eleve/loot-toast.js:131 — `icon`, `label` et `subLabel` sont injectés bruts par une API exportée — échapper les textes et réserver une voie typée aux icônes HTML de confiance.
- [🟡] permigo-game/src/components/eleve/permis-card.js:379 — le libellé ARIA et l'URL de fond utilisent `esc()` dans des attributs — employer `escAttr()` et valider l'URL du catalogue.
- [🟡] permigo-game/src/components/eleve/purchase-reveal.js:169 — `rColor` est injecté dans un attribut `style` après `esc()` — valider la palette puis employer `escAttr()`.
- [🟡] permigo-game/src/components/eleve/quiz-ui.js:344 — l'état de mascotte est interpolé dans `src` avec `esc()` — imposer un enum de fichiers puis utiliser `escAttr()`.
- [🟡] permigo-game/src/components/eleve/weekly-replay.js:169 — `c.content` est réinjecté brut dans `innerHTML`, bien que les cartes soient locales — construire les cartes en DOM ou typer ce fragment comme HTML de confiance.
- [🟠] permigo-game/src/components/eleve/xp-toast.js:95 — `xp`, `eleveName` et `trophy` sont injectés bruts dans deux `innerHTML` — convertir le nombre et passer les textes par `esc()` avant toute réactivation du fichier.
- [🟠] permigo-game/src/utils/medallions.js:128 — `cls`, `size`, couleurs et surtout `rawGlyph` alimentent directement le SVG HTML — valider les valeurs et isoler explicitement le seul fragment SVG de confiance.
- [🟠] permigo-game/src/pages/common/profil.js:1141 — le code de parrainage utilise `esc()` dans `aria-label` — utiliser `escAttr(code)` pour l'attribut et `esc(code)` pour le contenu.
- [🟡] permigo-game/src/pages/onboarding/index.js:356 — les couleurs de palette injectées dans les variables CSS passent par `esc()` — valider le format couleur et employer `escAttr()` pour l'attribut.
- [🟠] permigo-game/src/pages/eleve/accueil.js:2150 — l'identifiant de compétence est placé dans `data-href` avec `esc()` — utiliser `escAttr()` et encoder le segment de route.
- [🟡] permigo-game/src/pages/eleve/boutique.js:1540 — les couleurs de rareté sont injectées dans `style` avec `esc()` ou en brut — limiter aux tokens autorisés et échapper l'attribut complet.
- [🟡] permigo-game/src/pages/eleve/compte-rendu.js:374 — le pourcentage est injecté dans `style` après `esc()` — borner et convertir en nombre puis affecter `element.style.width`.
- [🟡] permigo-game/src/pages/eleve/exam-blanc.js:487 — l'état de mascotte est interpolé dans `src` avec `esc()` — utiliser un enum puis `escAttr()`.
- [🟡] permigo-game/src/pages/eleve/galerie.js:520 — URL et couleurs de catalogue alimentent des attributs `style` via `esc()` ou en brut — valider URL/palette et affecter les styles par l'API DOM.
- [🟠] permigo-game/src/pages/eleve/parcours.js:2934 — cinq liens de révision/validation interpolent `compId` dans `href` avec `esc()` — encoder le segment et passer l'URL finale par `escAttr()`.
- [🟡] permigo-game/src/pages/eleve/valider-seul.js:327 — `sub.c` est interpolé dans `href` avec `esc()` — encoder le segment puis utiliser `escAttr()`.
- [🟡] permigo-game/src/pages/enseignant/bilan.js:408 — `scoreColor` est injecté dans `style` via `esc()` — borner à une palette de tokens puis utiliser l'API style.
- [🟠] permigo-game/src/pages/enseignant/insights.js:837 — deux routes élève placent un identifiant dans `data-route` avec `esc()` — encoder l'identifiant et utiliser `escAttr()`.
- [🟡] permigo-game/src/pages/gerant/cockpit.js:697 — deux couleurs de KPI/légende sont injectées dans `style` avec `esc()` — valider la palette et affecter les propriétés CSS via DOM.

## 3. Tokens couleur

Couverture — 210 fichiers scannés, dont 201 fichiers susceptibles de contenir des styles et 9 JSON inspectés sans style, 2 732 occurrences hexadécimales de style inspectées : 2 630 à corriger, regroupées exhaustivement par fichier en 102 findings, et 102 déclarations de la palette canonique dans `styles/base.css` vérifiées puis exclues parce qu'elles définissent les tokens plutôt qu'elles ne les contournent. Les 8 autres occurrences de ce fichier restent signalées. Aucun usage actif de `--surface`, `--border` ou `--muted` n'a été trouvé ; les deux seules mentions sont des commentaires et sont laissées de côté. Chaque finding ci-dessous couvre toutes les occurrences du fichier indiqué, sans échantillonnage.

- [🟠] permigo-game/src/components/common/a2hs-steps.js:30 — 2 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par `--su`, `--bo`, `--mu`, `--ink` ou un token sémantique existant.
- [🟠] permigo-game/src/components/common/add-to-home.js:29 — 19 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/common/arene-rank.js:43 — 39 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/common/badge.js:46 — 6 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/common/celebrate-screen.js:107 — 3 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/common/cookie-banner.js:73 — 2 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/common/guided-tour.js:28 — 27 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/common/header-top.js:57 — 3 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/common/palier-sheet.js:26 — 2 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/common/profile-card.js:59 — 9 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/common/toast.js:101 — 2 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/common/unlock-screen.js:30 — 29 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/activity-heatmap.js:259 — 1 couleur hex codée en dur dans les styles de ce fichier — la remplacer par un token de thème.
- [🟠] permigo-game/src/components/eleve/chest.js:398 — 13 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/coach-sheet.js:27 — 10 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/competence-unlock.js:79 — 34 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/daily-quests.js:170 — 4 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/emotional-banner.js:37 — 16 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/first-quiz-reward.js:21 — 26 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/free-tier-wall.js:52 — 16 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/league-hero.js:212 — 19 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/level-up.js:78 — 9 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/loot-toast.js:33 — 16 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/permis-card.js:25 — 17 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/premium-quiz.js:135 — 66 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/purchase-reveal.js:53 — 8 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/quiz-ui.js:367 — 57 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/recompenses-tabs.js:74 — 1 couleur hex codée en dur dans les styles de ce fichier — la remplacer par un token de thème.
- [🟠] permigo-game/src/components/eleve/revision-recap.js:24 — 23 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/reward-reveal.js:219 — 16 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/share-recap.js:218 — 5 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/streak-launch.js:111 — 11 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/theory-gain.js:108 — 7 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/volant-reward.js:31 — 3 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/weekly-replay.js:296 — 5 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/eleve/world-unlock-cinematic.js:289 — 12 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/enseignant/moniteur-ranking.js:62 — 4 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/components/enseignant/trophy-sheet.js:250 — 13 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/admin/debug.js:74 — 3 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/auth/login.js:332 — 46 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/auth/nouveau-mdp.js:151 — 4 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/auth/signup.js:129 — 3 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/common/messages.js:351 — 15 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/common/notifications.js:591 — 1 couleur hex codée en dur dans les styles de ce fichier — la remplacer par un token de thème.
- [🟠] permigo-game/src/pages/common/profil.js:283 — 145 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/common/settings.js:297 — 2 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/accueil.js:427 — 46 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/boutique.js:312 — 112 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/centre-examen.js:201 — 15 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/compte-rendu.js:168 — 6 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/consent-blocked.js:13 — 3 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/en-situation.js:668 — 36 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/exam-blanc.js:1447 — 5 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/exam-conduite.js:177 — 78 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/examen.js:185 — 5 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/feedback.js:156 — 1 couleur hex codée en dur dans les styles de ce fichier — la remplacer par un token de thème.
- [🟠] permigo-game/src/pages/eleve/flash-quiz.js:404 — 12 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/galerie.js:198 — 3 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/mes-coffres.js:309 — 1 couleur hex codée en dur dans les styles de ce fichier — la remplacer par un token de thème.
- [🟠] permigo-game/src/pages/eleve/mes-lecons.js:123 — 3 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/mon-permis.js:260 — 8 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/parcours.js:313 — 226 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/pass-requis.js:113 — 25 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/quiz.js:848 — 2 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/recompenses.js:265 — 27 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/reviser.js:114 — 31 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/revision-conduite.js:232 — 201 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/roue.js:171 — 52 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/session-confirmation.js:75 — 5 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/trophees.js:150 — 42 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/eleve/valider-seul.js:162 — 23 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/enseignant/abonnement-requis.js:20 — 21 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/enseignant/aujourdhui.js:87 — 53 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/enseignant/bilan.js:39 — 24 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/enseignant/insights.js:103 — 8 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/enseignant/livret-remc.js:77 — 24 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/enseignant/log-session.js:107 — 60 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/enseignant/mes-eleves.js:44 — 154 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/enseignant/mon-blason.js:88 — 41 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/enseignant/parcours-pro-complet.js:81 — 4 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/enseignant/recompenses.js:48 — 40 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/enseignant/relances.js:100 — 42 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/enseignant/trophees-moniteur.js:53 — 18 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/onboarding/index.js:1022 — 87 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/onboarding/video-intro.js:169 — 19 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/public/avis-depart.js:27 — 24 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/public/creer-compte.js:37 — 31 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/public/ecole.js:51 — 7 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/public/parental-consent.js:15 — 1 couleur hex codée en dur dans les styles de ce fichier — la remplacer par un token de thème.
- [🟠] permigo-game/src/pages/public/pass.js:489 — 64 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/public/pro.js:19 — 25 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/public/rejoindre.js:36 — 36 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/pages/public/signup.js:28 — 43 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/services/invite-eleve.js:48 — 5 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/services/quiz-engine.js:300 — 4 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/services/web-push.js:224 — 5 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/styles/animations.css:316 — 5 couleurs hex codées en dur dans ce fichier de styles — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/styles/base.css:404 — 8 couleurs hex hors définitions de palette sont codées en dur — les remplacer par les tokens canoniques déjà définis.
- [🟠] permigo-game/src/styles/components.css:13 — 7 couleurs hex codées en dur dans ce fichier de styles — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/styles/enseignant-arcade.css:19 — 18 couleurs hex codées en dur dans ce fichier de styles — les remplacer par les tokens de thème.
- [🟠] permigo-game/src/utils/gestures.js:128 — 1 couleur hex codée en dur dans les styles de ce fichier — la remplacer par un token de thème.
- [🟠] permigo-game/src/utils/provenance.js:160 — 9 couleurs hex codées en dur dans les styles de ce fichier — les remplacer par les tokens de thème.

## 4. i18n

Couverture — 210 fichiers scannés, dont les 39 modules de coque élève/auth/commune examinés ligne par ligne, 13 findings. Les pages exclusivement enseignant, gérant et admin sont hors de la cible « coque élève/auth » de cette dimension ; leurs chaînes ne sont pas comptées. Les notifications serveur et fonctions Edge absentes du dépôt sont hors périmètre. `auth/login`, `auth/nouveau-mdp`, `auth/signup`, `eleve/examen` et `eleve/compte-rendu` ont été vérifiés sans finding résiduel visible ; les textes légaux statiques sont signalés car ils restent accessibles depuis la coque commune.

- [🟠] permigo-game/src/pages/common/introuvable.js:17 — la coque 404 affiche ses textes français directement — déplacer titre, explication et CTA dans `t()` / `text()`.
- [🟠] permigo-game/src/pages/common/legal.js:110 — titres, sections et corps légaux sont rendus depuis un corpus français non localisé — fournir des ressources légales par langue et les sélectionner via `t()` / `text()`.
- [🟠] permigo-game/src/pages/common/messages.js:46 — erreurs, états vides, titres et actions de messagerie restent en français direct — créer les clés miroir et envelopper chaque texte visible.
- [🟠] permigo-game/src/pages/common/notifications.js:769 — les libellés de suppression et d'annulation restent en français direct — les passer par les helpers i18n de la page.
- [🟠] permigo-game/src/pages/common/profil.js:806 — la coque profil conserve de nombreux titres, réglages, parrainage et textes enseignant en français — compléter les clés et remplacer les littéraux visibles.
- [🟠] permigo-game/src/pages/common/settings.js:569 — langue, suppression de compte, modales et plusieurs toasts restent en français direct — centraliser les chaînes dans les dictionnaires de réglages.
- [🟠] permigo-game/src/pages/eleve/boutique.js:857 — quelques textes marketing et toasts, dont le manque de volants, contournent les helpers i18n — ajouter les clés et utiliser `bt()` / `btR()`.
- [🟠] permigo-game/src/pages/eleve/consent-blocked.js:40 — toute la coque de consentement bloqué est française — créer les variantes FR/EN/AR et rendre via `t()` / `text()`.
- [🟠] permigo-game/src/pages/eleve/exam-blanc.js:924 — plusieurs résultats, verdicts et relances restent en français malgré l'i18n partielle — compléter le dictionnaire de l'examen blanc.
- [🟠] permigo-game/src/pages/eleve/recompenses.js:507 — des libellés « tour gratuit » et « vrai cadeau » restent codés en dur — ajouter les clés de récompenses correspondantes.
- [🟠] permigo-game/src/pages/eleve/revision-conduite.js:620 — plusieurs écrans de révision conservent titres, instructions et CTA en français — terminer la migration des littéraux vers les helpers de page.
- [🟠] permigo-game/src/pages/eleve/roue.js:523 — une phrase explicative française subsiste dans un fallback riche — déplacer le texte complet dans les ressources traduites.
- [🟠] permigo-game/src/pages/eleve/session-confirmation.js:330 — confirmation, refus, états de chargement et modale sont entièrement français — créer le dictionnaire et envelopper tous les textes visibles.

## 5. Accessibilité

Couverture — 210 fichiers scannés, 638 éléments interactifs de markup et 121 balises `<img>` inspectés, 33 findings. Les 121 images possèdent toutes un attribut `alt` ; aucun bouton purement icône sans nom accessible n'a été confirmé. Une règle globale `:focus-visible` existe dans `styles/base.css` et 92 occurrences spécifiques ont été recensées : l'absence globale de focus n'est donc pas signalée. Les constats ci-dessous concernent les dimensions CSS statiques strictement inférieures à 44 px ; les zones agrandies par layout ou pseudo-élément au runtime n'ont pas pu être mesurées et restent à tester sur appareil.

- [🟠] permigo-game/src/styles/components.css:27 — `.btn` fait 40 px, `.btn-sm` 36 px et la fermeture de toast 22 px — porter la zone cliquable minimale à 44 × 44 px.
- [🟠] permigo-game/src/components/common/celebrate-screen.js:211 — le bouton de fermeture mesure 36 px — ajouter une zone tactile d'au moins 44 px.
- [🟠] permigo-game/src/components/common/header-top.js:67 — les boutons icône/avatar du header mesurent 36 px — porter leur boîte interactive à 44 px.
- [🟠] permigo-game/src/components/common/unlock-screen.js:310 — la fermeture mesure 38 px — agrandir la cible à 44 px sans grossir nécessairement l'icône.
- [🟠] permigo-game/src/components/eleve/emotional-banner.js:71 — le CTA fait 36 px et la fermeture 28 px — garantir 44 px sur les deux contrôles.
- [🟠] permigo-game/src/components/eleve/recompenses-tabs.js:61 — les onglets ont une hauteur de 34 px — porter leur zone interactive à 44 px.
- [🟠] permigo-game/src/components/eleve/revision-recap.js:194 — la fermeture mesure 36 px — agrandir sa boîte cliquable à 44 px.
- [🟠] permigo-game/src/components/eleve/weekly-replay.js:311 — la fermeture mesure 36 px — garantir une cible de 44 px.
- [🟠] permigo-game/src/pages/common/legal.js:132 — le bouton retour mesure 36 px — porter sa zone interactive à 44 px.
- [🟠] permigo-game/src/pages/common/messages.js:467 — le bouton retour mesure 36 px — porter sa zone interactive à 44 px.
- [🟠] permigo-game/src/pages/common/notifications.js:523 — le bouton retour mesure 36 px — porter sa zone interactive à 44 px.
- [🟠] permigo-game/src/pages/common/profil.js:488 — le toggle de 26 px et la fermeture de modale de 30 px sont sous le minimum tactile — ajouter une boîte interactive de 44 px autour des contrôles.
- [🟠] permigo-game/src/pages/common/settings.js:220 — retour 38 px, boutons de thème 40 px et pastilles d'accent 42 px restent sous 44 px — uniformiser les cibles à 44 px.
- [🟠] permigo-game/src/pages/eleve/accueil.js:2082 — le CTA d'installation mesure 36 px — porter la hauteur interactive à 44 px.
- [🟠] permigo-game/src/pages/eleve/compte-rendu.js:104 — le bouton retour mesure 36 px — porter sa zone interactive à 44 px.
- [🟠] permigo-game/src/pages/eleve/feedback.js:109 — le bouton retour mesure 36 px — porter sa zone interactive à 44 px.
- [🟠] permigo-game/src/pages/eleve/galerie.js:297 — la fermeture de modale mesure 32 px — agrandir la cible à 44 px.
- [🟠] permigo-game/src/pages/eleve/mes-coffres.js:239 — le bouton retour mesure 36 px — porter sa zone interactive à 44 px.
- [🟠] permigo-game/src/pages/eleve/mes-lecons.js:91 — le bouton retour mesure 36 px — porter sa zone interactive à 44 px.
- [🟠] permigo-game/src/pages/eleve/mon-permis.js:433 — le champ date et le bouton de reprise d'erreur font 40 px — porter leur hauteur minimale à 44 px.
- [🟠] permigo-game/src/pages/eleve/revision-conduite.js:230 — plusieurs boutons retour font 38 ou 42 px — appliquer un `min-width` et `min-height` de 44 px.
- [🟠] permigo-game/src/pages/eleve/roue.js:183 — le bouton retour mesure 40 px — porter sa zone interactive à 44 px.
- [🟠] permigo-game/src/pages/eleve/session-confirmation.js:50 — le bouton retour mesure 36 px — porter sa zone interactive à 44 px.
- [🟠] permigo-game/src/pages/eleve/valider-seul.js:160 — le bouton retour mesure 38 px — porter sa zone interactive à 44 px.
- [🟠] permigo-game/src/pages/enseignant/log-session.js:117 — le retour fait 40 px et le partage 38 px — garantir 44 px pour les deux actions.
- [🟠] permigo-game/src/pages/enseignant/mes-eleves.js:264 — menu, onglets, cloche, segments et annulation ont plusieurs dimensions entre 34 et 40 px — normaliser toutes les cibles à 44 px.
- [🟠] permigo-game/src/pages/enseignant/recompenses.js:59 — retour 40 px, bouton gains 38 px et switch 28 px sont sous le minimum — agrandir les zones interactives à 44 px.
- [🟠] permigo-game/src/pages/onboarding/index.js:1231 — le switch a une hauteur de 36 px — fournir une cible tactile de 44 px.
- [🟠] permigo-game/src/pages/onboarding/video-intro.js:252 — la fermeture mesure 42 px — porter la boîte à 44 px.
- [🟠] permigo-game/src/pages/public/creer-compte.js:200 — le bouton d'affichage du mot de passe mesure 40 px — porter la cible à 44 px.
- [🟠] permigo-game/src/pages/public/rejoindre.js:158 — le bouton d'affichage du mot de passe mesure 40 px — porter la cible à 44 px.
- [🟠] permigo-game/src/pages/public/signup.js:188 — le bouton d'affichage du mot de passe mesure 40 px — porter la cible à 44 px.
- [🟠] permigo-game/src/utils/provenance.js:149 — les contrôles de couleur mesurent 34 px — ajouter une zone de sélection de 44 px.

## 6. Code mort

Couverture — 210 fichiers scannés, graphe complet des imports statiques/dynamiques/CSS depuis `src/main.js`, 198 fichiers atteignables et 12 inatteignables, 83 findings. Sont aussi comptés 4 symboles privés jamais appelés, 47 exports jamais importés ni référencés ailleurs dans `src` regroupés en 27 findings, et 74 exports utilisés seulement dans leur propre module regroupés en 40 findings. Les tests, scripts, imports depuis `public/`, consommateurs externes à `src` et chargements par chaîne non résolus statiquement sont hors périmètre ; ils doivent être vérifiés avant suppression, notamment pour `data/seo-pages.js`.

- [🟡] permigo-game/src/components/common/badge.js:1 — fichier inatteignable depuis `src/main.js` — confirmer l'absence de consommateur externe puis supprimer ou reconnecter.
- [🟡] permigo-game/src/components/common/skeleton.js:1 — fichier inatteignable depuis `src/main.js` — confirmer l'absence de consommateur externe puis supprimer ou reconnecter.
- [🟡] permigo-game/src/components/eleve/reward-reveal.js:1 — fichier inatteignable depuis `src/main.js` — confirmer l'absence de consommateur externe puis supprimer ou reconnecter.
- [🟡] permigo-game/src/components/eleve/weekly-replay.js:1 — fichier inatteignable depuis `src/main.js` — confirmer l'absence de consommateur externe puis supprimer ou reconnecter.
- [🟡] permigo-game/src/components/eleve/xp-toast.js:1 — fichier inatteignable depuis `src/main.js` — confirmer l'absence de consommateur externe puis supprimer ou reconnecter.
- [🟡] permigo-game/src/data/prestige.js:1 — fichier inatteignable depuis `src/main.js` — confirmer l'absence de consommateur externe puis supprimer ou reconnecter.
- [🟡] permigo-game/src/data/seo-pages.js:1 — fichier inatteignable depuis `src/main.js`, avec possible usage par un script hors périmètre — rechercher les consommateurs de build/SEO avant toute suppression.
- [🟡] permigo-game/src/data/trophees.js:1 — fichier inatteignable depuis `src/main.js` — confirmer l'absence de consommateur externe puis supprimer ou reconnecter.
- [🟡] permigo-game/src/db/client.js:1 — client documenté comme legacy et inatteignable — supprimer après vérification des outils externes.
- [🟡] permigo-game/src/pages/auth/signup.js:1 — ancienne page signup inatteignable, doublonnée par la page publique — supprimer après vérification du routeur et des liens externes.
- [🟡] permigo-game/src/utils/count-up.js:1 — fichier inatteignable depuis `src/main.js` — confirmer l'absence de consommateur externe puis supprimer ou reconnecter.
- [🟡] permigo-game/src/utils/format-date.js:1 — fichier inatteignable depuis `src/main.js` — confirmer l'absence de consommateur externe puis supprimer ou reconnecter.
- [🟡] permigo-game/src/components/eleve/chest.js:284 — la fonction privée `chestSVG` n'est jamais appelée — la supprimer ou rétablir son usage intentionnel.
- [🟡] permigo-game/src/pages/eleve/accueil.js:1572 — la fonction privée `_greeting` n'est jamais appelée — la supprimer.
- [🟡] permigo-game/src/pages/eleve/parcours.js:1730 — la fonction privée `saveParcoursView` n'est jamais appelée — la supprimer ou reconnecter la persistance prévue.
- [🟡] permigo-game/src/pages/eleve/revision-conduite.js:99 — la fonction privée `revisedToday` n'est jamais appelée — la supprimer ou rétablir le contrôle quotidien.
- [🟡] permigo-game/src/components/common/confetti.js:121 — l'export `burstConfettiFromElement` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification des consommateurs externes.
- [🟡] permigo-game/src/components/common/empty-state.js:139 — l'export `renderEmptyState` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/components/common/header-top.js:227 — l'export `unmountHeader` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/components/common/install-nudge.js:165 — l'export `maybeShowInstallNudge` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/components/common/nav-bottom.js:372 — l'export `unmountBottomNav` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/components/common/toast.js:75 — l'export `toastAvatar` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/components/eleve/level-up.js:31 — l'export `markLevelSeen` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/components/eleve/permis-card.js:565 — l'export `renderPermisMini` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/components/eleve/quiz-visuals.js:1121 — l'export `_RULES` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/components/enseignant/panneaux-bg.js:62 — l'export `ensHero` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/data/worlds.js:51 — l'export `getWorld` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/pages/enseignant/classement-eleves.js:173 — l'export `mount` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification du routeur.
- [🟡] permigo-game/src/pages/enseignant/relances.js:158 — les exports `mount` et `unmount` ne sont jamais importés ni référencés dans `src` — retirer les symboles après vérification du routeur.
- [🟡] permigo-game/src/services/analytics.js:103 — l'export `identify` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/services/competence-celebration.js:48 — l'export `hasCelebratedCompetence` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/services/daily-quiz.js:53 — les exports `isDailyDone` et `pickDailyQuiz` ne sont jamais importés ni référencés dans `src` — retirer les symboles après vérification externe.
- [🟡] permigo-game/src/services/notif-listener.js:28 — l'export `stopNotifListener` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification du cycle de vie.
- [🟡] permigo-game/src/utils/game-state.js:240 — `updateStreak`, `getLast7Days`, `getOpenedChests`, `isChestOpened`, `getOwnedItems`, `purchaseItem` et `computeStats` ne sont jamais importés ni référencés dans `src` — retirer les API obsolètes après vérification externe.
- [🟡] permigo-game/src/utils/gestures.js:13 — les exports `attachSwipe` et `animateCounter` ne sont jamais importés ni référencés dans `src` — retirer les symboles après vérification externe.
- [🟡] permigo-game/src/utils/icons.js:175 — l'export `iconBadge` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/utils/lang.js:26 — `LANGS`, `LANG_LABELS`, `isRTL` et `saveLang` ne sont jamais importés ni référencés dans `src` — retirer les API inutilisées après vérification externe.
- [🟡] permigo-game/src/utils/league-shared.js:72 — `renderLeagueBadge`, `renderLeagueRow` et `LEAGUE_CSS` ne sont jamais importés ni référencés dans `src` — retirer les API obsolètes après vérification externe.
- [🟡] permigo-game/src/utils/medallions.js:141 — l'export `MED_GLYPH_NAMES` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification des galeries externes.
- [🟡] permigo-game/src/utils/sound.js:59 — sept exports de sons (`playHorn`, `playLevelup`, `playParcours`, `playParcoursIntro`, `playConnexionIntro`, `playLaunchSound`, `playLaunch`) ne sont jamais référencés dans `src` — retirer les API obsolètes après vérification externe.
- [🟡] permigo-game/src/utils/statut-label.js:39 — l'export `statutLabel` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/utils/theme.js:45 — l'export `unlistenSystem` n'est jamais importé ni référencé dans `src` — retirer le symbole ou raccorder le nettoyage.
- [🟡] permigo-game/src/utils/volant.js:39 — l'export `volantAmount` n'est jamais importé ni référencé dans `src` — retirer le symbole après vérification externe.
- [🟡] permigo-game/src/components/common/arene-rank.js:24 — `ARENE_ACCENTS` est utilisé localement mais exporté sans aucun import dans `src` — retirer seulement `export` après vérification des consommateurs externes.
- [🟡] permigo-game/src/components/common/celebrate-screen.js:250 — `CELEBRATE_PRESETS` et `showCelebrate` sont utilisés localement mais jamais importés dans `src` — réduire leur visibilité après vérification externe.
- [🟡] permigo-game/src/components/common/cookie-banner.js:44 — `getConsent` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/components/common/palier-sheet.js:163 — `closePalierSheet` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/components/common/profile-card.js:227 — `renderProfileCard` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/components/eleve/competence-unlock.js:69 — `COMPETENCE_VOLANT_REWARD` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/components/eleve/daily-quests.js:69 — `cleanQuestTitle` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/components/eleve/first-quiz-reward.js:16 — `INSTALL_AFTER_ROUE_KEY` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/components/eleve/permis-card.js:364 — `renderPermisCard` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/components/eleve/quiz-ui.js:21 — `richEsc`, `pickPraise`, `pickCoachHead`, `pickResultMsg` et `pipsHTML` sont utilisés localement mais jamais importés dans `src` — retirer les `export` superflus.
- [🟡] permigo-game/src/components/eleve/quiz-visuals.js:73 — `cockpitSVG`, `pedalesSVG`, `levierSVG`, `feuSVG` et `panneauSVG` sont utilisés localement mais jamais importés dans `src` — retirer les `export` superflus.
- [🟡] permigo-game/src/components/eleve/world-unlock-cinematic.js:129 — `playUnlockCinematic` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/components/enseignant/illus.js:89 — `ILLUS` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/components/enseignant/trophy-sheet.js:59 — `TROPHEES` et `BADGE_IMG` sont utilisés localement mais jamais importés dans `src` — retirer les `export` superflus.
- [🟡] permigo-game/src/data/fiches-i18n.js:48 — `FICHE_UI` et `FICHE_I18N` sont utilisés localement mais jamais importés directement dans `src` — retirer les `export` superflus après vérification des outils.
- [🟡] permigo-game/src/data/fiches-schemas.js:12 — `FICHE_SCHEMAS` est utilisé localement mais jamais importé directement dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/data/moniteur-levels.js:138 — `SAISONS` est utilisé localement mais jamais importé directement dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/data/parcours-quiz-i18n.js:30 — `EXAM_UI` et `EXAM_I18N` sont utilisés localement mais jamais importés directement dans `src` — retirer les `export` superflus.
- [🟡] permigo-game/src/data/quiz-conduite.js:13 — `QUIZ_CONDUITE` est utilisé localement mais jamais importé directement dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/data/remc-details.js:10 — `REMC_DETAILS` est utilisé localement mais jamais importé directement dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/data/rewards-i18n.js:16 — `TROPHY_I18N`, `TROPHY_GROUP_I18N`, `ITEM_I18N` et `RARITY_I18N` sont utilisés localement mais jamais importés directement dans `src` — retirer les `export` superflus.
- [🟡] permigo-game/src/data/worlds-i18n.js:12 — `WORLD_I18N` est utilisé localement mais jamais importé directement dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/pages/eleve/accueil.js:2834 — `fetchLastCompteRendu` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/pages/eleve/examen.js:472 — huit symboles (`parseSavedDate`, `saveExamDate`, `countdown`, `fmtDate`, `loadData`, `BASE_TOTAL`, `buildVerdict`, `buildCriteria`) sont utilisés localement mais jamais importés dans `src` — retirer les `export` superflus.
- [🟡] permigo-game/src/pages/eleve/parcours.js:2232 — `computeWorldStates` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/pages/enseignant/relances.js:22 — `COOL_SEUIL_J` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/services/daily-quiz.js:32 — `LS_DAILY_STREAK` et `LS_DAILY_STREAK_LAST` sont utilisés localement mais jamais importés dans `src` — retirer les `export` superflus.
- [🟡] permigo-game/src/utils/accent.js:65 — `byId` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/utils/free-tier.js:17 — `FREE_QUOTAS` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/utils/game-state.js:81 — `getLeague`, `getNextLeague`, `spendGemmes`, `ownsItem`, `addOwnedItem` et `applyThemeColor` sont utilisés localement mais jamais importés dans `src` — retirer les `export` superflus.
- [🟡] permigo-game/src/utils/lang.js:29 — `isLang` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/utils/league-shared.js:19 — `LEAGUES` et `getLeague` sont utilisés localement mais jamais importés dans `src` — retirer les `export` superflus.
- [🟡] permigo-game/src/utils/medallions.js:21 — `MED_RAMPS` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/utils/provenance.js:23 — `PROV_COLORS`, `PROV_PRESETS` et `provInk` sont utilisés localement mais jamais importés dans `src` — retirer les `export` superflus.
- [🟡] permigo-game/src/utils/pwa.js:52 — `isInAppBrowser` et `isIosNonSafari` sont utilisés localement mais jamais importés dans `src` — retirer les `export` superflus.
- [🟡] permigo-game/src/utils/speech.js:17 — `isQuizMuted`, `setQuizMuted` et `speakQuestion` sont utilisés localement mais jamais importés dans `src` — retirer les `export` superflus.
- [🟡] permigo-game/src/utils/statut-label.js:29 — `statutCfg` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/utils/theme.js:35 — `listenSystem` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/utils/theory-league.js:14 — `THEORY_PTS` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.
- [🟡] permigo-game/src/utils/weak-points.js:50 — `REMC_THEME_TAGS` est utilisé localement mais jamais importé dans `src` — retirer seulement `export` après vérification externe.

## 7. Performance

Couverture — 210 fichiers scannés, tailles sources, fermetures d'import, build Vite, boucles/tris synchrones et 72 références PNG/JPG inventoriés, 30 findings. Les tailles réelles des binaires sous `public/`, le cache CDN, les timings réseau Supabase, les Web Vitals et le profilage CPU/mémoire sur mobile sont hors de `src/` et laissés de côté. Mesures du build utiles : `exam-blanc` 222,28 kB / 74,12 kB gzip, `fiches-i18n` 165,17 / 68,86, `supabase` 207,09 / 53,47, `profil` 140,03 / 36,94, `accueil` 110,07 / 34,16 et `parcours` 103,79 / 31,19.

- [🟠] permigo-game/src/data/fiches-i18n.js:48 — 245 kB de textes de fiches multilingues sont livrés dans un même module — fractionner par langue et monde avec imports dynamiques.
- [🟠] permigo-game/src/data/parcours-quiz-i18n.js:30 — 148 kB de traductions de quiz sont chargés en bloc — découper par langue et famille de quiz.
- [🟠] permigo-game/src/data/centres-examen.js:17 — 108 kB de centres d'examen sont embarqués pour toute recherche — indexer et charger par zone ou à la demande.
- [🟠] permigo-game/src/data/parcours-quiz.js:96 — 95 kB de questions sont importés comme un seul corpus — découper par monde/session et charger au lancement du quiz.
- [🟠] permigo-game/src/data/situations-conduite.js:77 — 87 kB de situations sont inline dans un module unique — segmenter par thème et importer à la demande.
- [🟠] permigo-game/src/data/situations-i18n.js:55 — 63 kB de traductions de situations sont chargés pour toutes les langues — charger seulement la langue active.
- [🟠] permigo-game/src/data/fiches-conduite.js:9 — quatre JSON de monde sont importés pour toute simple recherche de fiche — créer des points d'entrée par monde ou un loader dynamique.
- [🟠] permigo-game/src/data/quiz-conduite.js:7 — quatre JSON de quiz et le jeu complet sont importés ensemble — charger uniquement le corpus requis par la route.
- [🟡] permigo-game/src/data/exam-conduite-phases.js:487 — environ 39 kB de phases d'examen restent inline — externaliser/segmenter si la route continue de grossir.
- [🟠] permigo-game/src/pages/eleve/exam-blanc.js:10 — la route cumule plusieurs corpus lourds et produit le plus gros chunk applicatif mesuré — lazy-loader chaque mode et ses données après sélection.
- [🟠] permigo-game/src/pages/eleve/revision-conduite.js:16 — quiz, fiches et i18n complets sont importés ensemble — fractionner par écran, monde et langue.
- [🟠] permigo-game/src/pages/eleve/reviser.js:23 — les situations et fiches complètes sont chargées même pour calculer des compteurs — fournir des métadonnées légères séparées.
- [🟠] permigo-game/src/pages/eleve/centre-examen.js:13 — tous les centres et fiches sont importés dès l'ouverture — charger la zone recherchée et les fiches seulement au clic.
- [🟠] permigo-game/src/pages/eleve/en-situation.js:17 — toutes les traductions de situations sont chargées même en français — importer uniquement le dictionnaire actif.
- [🟠] permigo-game/src/pages/enseignant/log-session.js:20 — l'écran moniteur entraîne les quatre JSON de fiches via `getFiche` — isoler un index léger ou charger la fiche demandée.
- [🟠] permigo-game/src/pages/eleve/valider-seul.js:34 — la validation autonome entraîne les quatre JSON de fiches — importer le monde correspondant au code ciblé.
- [🟠] permigo-game/src/pages/eleve/parcours.js:14 — la page parcours entraîne tous les JSON détaillés de fiches — séparer métadonnées de parcours et contenu de révision.
- [🟡] permigo-game/src/pages/eleve/accueil.js:1 — le module source dépasse 125 kB et son chunk 110 kB — scinder les sheets, panneaux et flux secondaires.
- [🟡] permigo-game/src/pages/common/profil.js:1 — le module source dépasse 125 kB et son chunk 140 kB — séparer profils élève/enseignant et modales secondaires.
- [🟡] permigo-game/src/pages/eleve/parcours.js:1 — le module source dépasse 125 kB et son chunk 103 kB — extraire rendu fiche, état des mondes et interactions secondaires.
- [🟠] permigo-game/src/main.js:203 — le préchargement idle de routes lourdes ne tient pas compte de `saveData`, du réseau ou de l'intention — conditionner le prefetch et prioriser les routes probables.
- [🟡] permigo-game/src/main.js:191 — l'import dynamique de PWA est neutralisé par un import statique du même module — choisir un seul mode d'import pour créer un vrai chunk.
- [🟠] permigo-game/src/pages/onboarding/video-intro.js:84 — une vidéo MP4 cachée utilise `preload="auto"` avant le choix utilisateur — passer à `metadata`/`none` et charger après consentement.
- [🟡] permigo-game/src/router.js:474 — l'import dynamique de l'utilisateur courant est neutralisé par un import statique ailleurs — centraliser ou rendre réellement lazy.
- [🟡] permigo-game/src/services/notif-listener.js:131 — les imports dynamiques utilisateur/auth ne créent pas de découpage car ces modules sont aussi statiques — supprimer le faux lazy-loading ou isoler la dépendance.
- [🟡] permigo-game/src/pages/eleve/reviser.js:93 — une capture PNG est chargée sans dimensions ni source responsive — fournir dimensions, WebP/AVIF et `srcset`.
- [🟡] permigo-game/src/pages/public/pass.js:941 — trois captures de présentation PNG n'ont pas toutes dimensions et variantes responsives — fournir tailles explicites, WebP/AVIF et `srcset`.
- [🟡] permigo-game/src/pages/eleve/mes-coffres.js:123 — neuf PNG de coffres sont référencés comme catalogue plein — lazy-loader les états non visibles et servir des formats modernes.
- [🟡] permigo-game/src/utils/assets.js:47 — le catalogue d'avatars/UI pointe vers de nombreux PNG sans variante moderne — exposer WebP/AVIF et tailles adaptées au contexte.
- [🟡] permigo-game/src/data/worlds.js:24 — les illustrations de mondes restent en PNG — fournir des formats modernes et charger uniquement le monde visible.

## 8. Mobile / safe-area

Couverture — 210 fichiers scannés, dont les 66 modules de page, 19 findings. La protection globale de `styles/base.css` et les protections du header/nav ont été vérifiées : les 16 pages signalées ne sont pas nécessairement cassées, mais dépendent exclusivement de ce wrapper et n'ont aucune protection locale pour leurs surfaces fixes/plein écran. Les scrollers horizontaux intentionnels et les débordements contenus par `overflow-x: clip/hidden` ont été laissés de côté ; aucun autre overflow-x non contenu n'a été prouvé statiquement. Trois usages actifs de `100vh` ont été trouvés ; les commentaires ne sont pas comptés.

- [🟡] permigo-game/src/pages/admin/debug.js:1 — aucune référence locale à `env(safe-area-inset-*)` — protéger les surfaces fixes/plein écran ou documenter la dépendance au wrapper global.
- [🟡] permigo-game/src/pages/auth/nouveau-mdp.js:1 — aucune référence locale à `env(safe-area-inset-*)` — ajouter les paddings safe-area utiles aux bords de viewport.
- [🟡] permigo-game/src/pages/auth/signup.js:1 — aucune référence locale à `env(safe-area-inset-*)` — ajouter les paddings safe-area utiles aux bords de viewport.
- [🟡] permigo-game/src/pages/eleve/classement.js:1 — aucune référence locale à `env(safe-area-inset-*)` — protéger les surfaces bord à bord ou documenter le wrapper requis.
- [🟡] permigo-game/src/pages/eleve/examen.js:1 — aucune référence locale à `env(safe-area-inset-*)` — protéger les surfaces bord à bord ou documenter le wrapper requis.
- [🟡] permigo-game/src/pages/eleve/feedback.js:1 — aucune référence locale à `env(safe-area-inset-*)` — protéger les surfaces bord à bord ou documenter le wrapper requis.
- [🟡] permigo-game/src/pages/eleve/jeu-faute.js:1 — aucune référence locale à `env(safe-area-inset-*)` — protéger les surfaces bord à bord ou documenter le wrapper requis.
- [🟡] permigo-game/src/pages/eleve/mes-coffres.js:1 — aucune référence locale à `env(safe-area-inset-*)` — protéger les surfaces bord à bord ou documenter le wrapper requis.
- [🟡] permigo-game/src/pages/eleve/mon-permis.js:1 — aucune référence locale à `env(safe-area-inset-*)` — protéger les surfaces bord à bord ou documenter le wrapper requis.
- [🟡] permigo-game/src/pages/eleve/quiz.js:1 — aucune référence locale à `env(safe-area-inset-*)` — protéger le plein écran de quiz avec des inset locaux.
- [🟡] permigo-game/src/pages/eleve/recompenses.js:1 — aucune référence locale à `env(safe-area-inset-*)` — protéger les surfaces bord à bord ou documenter le wrapper requis.
- [🟡] permigo-game/src/pages/enseignant/classement-eleves.js:1 — aucune référence locale à `env(safe-area-inset-*)` — protéger les surfaces bord à bord ou documenter le wrapper requis.
- [🟡] permigo-game/src/pages/enseignant/ligue-semaine.js:1 — aucune référence locale à `env(safe-area-inset-*)` — protéger les surfaces bord à bord ou documenter le wrapper requis.
- [🟡] permigo-game/src/pages/enseignant/recompenses.js:1 — aucune référence locale à `env(safe-area-inset-*)` — protéger les surfaces bord à bord ou documenter le wrapper requis.
- [🟡] permigo-game/src/pages/gerant/pulse.js:1 — aucune référence locale à `env(safe-area-inset-*)` — protéger les surfaces bord à bord ou documenter le wrapper requis.
- [🟡] permigo-game/src/pages/public/ecole.js:1 — aucune référence locale à `env(safe-area-inset-*)` — ajouter les paddings safe-area aux bords de la page publique.
- [🟠] permigo-game/src/components/common/arene-rank.js:49 — la hauteur minimale utilise `100vh`, instable avec les barres mobiles — utiliser `100dvh` avec fallback approprié.
- [🟠] permigo-game/src/pages/enseignant/mon-blason.js:68 — la page utilise `100vh` — remplacer par `100dvh` ou `min-height: 100dvh` avec fallback.
- [🟠] permigo-game/src/pages/enseignant/aujourdhui.js:90 — la page utilise `100vh` — remplacer par `100dvh` ou `min-height: 100dvh` avec fallback.

## Vérifications de fin

- Rapport unique créé à la racine du worktree d'audit : `AUDIT-CODE-HEALTH-2026-07-24.md`.
- Huit sections de dimension présentes, chacune avec une ligne de couverture et ses exclusions.
- 332 findings au format demandé : 0 🔴, 208 🟠, 124 🟡.
- Aucun fichier sous `permigo-game/src/` modifié.
- Build Vite de contrôle vert ; aucun `dist` ni `node_modules` ajouté au worktree.
