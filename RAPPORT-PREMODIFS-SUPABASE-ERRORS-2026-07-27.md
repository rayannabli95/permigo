# RAPPORT PRÉ-MODIFICATIONS — Erreurs Supabase

## CHANTIER

Correction proposée de la dimension **Gestion d'erreurs Supabase** de
`AUDIT-CODE-HEALTH-2026-07-24.md`.

Cette branche est une copie de travail pour validation par Rayan/Claude :
aucun merge, aucune PR, aucun déploiement et aucune migration.

## BRANCHE

`codex/fix-supabase-errors-audit`

Base : `origin/main` au commit `6a1f48b`.

## FAIT

### Couverture

- **29 findings revalidés et traités** dans 18 fichiers source.
- Chaque résultat signalé récupère maintenant `error`, contrôle
  `Promise.allSettled().status` ou propage explicitement l'échec.
- Une panne ne devient plus silencieusement un profil absent, une liste vide,
  une série à zéro ou une progression à zéro.

### Flux critiques

- Après un OTP valide, une erreur de lecture du profil provoque une
  déconnexion propre et un message distinct de « profil introuvable ».
- La certification autonome ne démarre plus si les validations moniteur ou
  élève n'ont pas pu être vérifiées.
- Une suppression de notification refusée par Supabase restaure la ligne dans
  l'interface et affiche une erreur.
- La notification de risque de série n'est pas envoyée si l'activité du jour
  n'a pas pu être vérifiée.

### Pages élève

- Profil, boutique, classement, examen, Mon permis et Récompenses contrôlent
  désormais chaque résultat concurrent.
- L'examen devient indisponible si une donnée nécessaire à la checklist
  manque, au lieu d'afficher une fausse readiness.
- « Mon permis » distingue l'indisponibilité des compétences, des leçons et
  de l'examen, avec boutons « Réessayer ».
- Le hub Récompenses affiche un état partiel explicite quand une source est
  indisponible ; les traductions anglaise et arabe sont incluses.
- La confirmation de séance indique que les compétences sont temporairement
  indisponibles sans bloquer les boutons confirmer/refuser.

### Pages moniteur et publique

- « Aujourd'hui », « Mes élèves », classement, livret REMC et blason refusent
  de calculer des KPI à partir de résultats incomplets.
- Les paginations validations/compétences/examens interrompent le rendu si une
  page Supabase échoue.
- Le bilan reste utilisable si seul le nom de l'école échoue, avec repli
  explicite sur « PermiGo » et journalisation.
- La page publique d'école distingue maintenant :
  - école réellement absente ;
  - erreur réseau/RLS/service ;
  - identifiant UUID ou slug.
- Les erreurs secondaires d'engagement sont journalisées mais restent
  volontairement non bloquantes.

### Répartition des 29 findings

- `profil.js` : 5.
- `aujourdhui.js` : 4.
- `ecole.js` : 4.
- `livret-remc.js` : 2.
- 14 autres fichiers : 1 chacun.

## CONTRÔLES

- `npm run build` : **vert**, 241 modules transformés et 32 pages SEO
  générées.
- Playwright desktop + mobile : **50 tests verts, 2 ignorés, 0 échec** sur
  `a11y.spec.js`, `examen.spec.js`, `empty-states.spec.js` et `smoke.spec.js`.
- Les 18 fichiers JavaScript modifiés passent `node --check`.
- `git diff --check` : **vert**.
- Le lien temporaire vers les dépendances de la copie principale a été retiré
  après les contrôles ; aucun `node_modules` n'est enregistré.

## RESTE

- Rayan/Claude : vérifier visuellement les nouveaux états « indisponible » sur
  profil, certification autonome, Mon permis, Récompenses, Aujourd'hui,
  Mes élèves, livret et page école.
- Tester manuellement au moins une panne simulée Supabase avant merge :
  hors-ligne, réponse RLS refusée ou RPC inexistante.
- Claude : confirmer que le mode dégradé du bilan et de l'engagement moniteur
  doit rester non bloquant.

## FICHIERS TOUCHÉS

- `permigo-game/src/auth/auth.js`
- `permigo-game/src/pages/common/notifications.js`
- `permigo-game/src/pages/common/profil.js`
- `permigo-game/src/pages/eleve/boutique.js`
- `permigo-game/src/pages/eleve/classement.js`
- `permigo-game/src/pages/eleve/examen.js`
- `permigo-game/src/pages/eleve/mon-permis.js`
- `permigo-game/src/pages/eleve/recompenses.js`
- `permigo-game/src/pages/eleve/session-confirmation.js`
- `permigo-game/src/pages/eleve/valider-seul.js`
- `permigo-game/src/pages/enseignant/aujourdhui.js`
- `permigo-game/src/pages/enseignant/bilan.js`
- `permigo-game/src/pages/enseignant/classement-eleves.js`
- `permigo-game/src/pages/enseignant/livret-remc.js`
- `permigo-game/src/pages/enseignant/mes-eleves.js`
- `permigo-game/src/pages/enseignant/mon-blason.js`
- `permigo-game/src/pages/public/ecole.js`
- `permigo-game/src/services/web-push.js`
- `RAPPORT-PREMODIFS-SUPABASE-ERRORS-2026-07-27.md`

## MIGRATIONS

Aucune.

## BLOQUEURS-RISQUES

- Les tests verts couvrent les parcours normaux. Ils ne forcent pas encore
  chacun des 29 retours `error` de Supabase.
- Plusieurs nouveaux messages n'apparaissent qu'en cas de panne ; leur
  hiérarchie visuelle doit être validée par Claude/Rayan.
- Les corrections ne changent aucune requête, table, policy RLS ou RPC :
  elles changent uniquement la réaction du client aux erreurs.
- Cette branche part de `origin/main` et ne contient pas les autres branches
  de pré-modifications ; Claude devra décider l'ordre d'intégration.

## DÉLÉGABLE

- **Claude/Rayan** : revue visuelle et décision de merge.
- **Codex** : ajouter des tests avec client Supabase simulé pour les chemins
  d'erreur jugés prioritaires, puis appliquer les ajustements validés.
