# Permigo (à renommer)

Couche d'engagement pédagogique pour l'apprentissage du permis en France : livret REMC numérique + parcours élève gamifié + classement moniteur (local / national). **Cible prioritaire = le moniteur indépendant** — décideur = payeur = utilisateur, cycle de vente court. L'élève est le **carburant viral** : son engagement (réviser, revenir, progresser) EST l'outil commercial du moniteur. **Modèle = abonnement individuel self-serve 9,99 €/mois** (Stripe, en place). L'offre « auto-école / per-seat » est gardée en **option lointaine**, jamais mise en avant. Stack : **Vanilla JS (ES modules) + Vite + Supabase + Vercel**. Pas de framework front (pas de React).

> 🧭 **Cap produit (verrouillé 2026-06-17)** : on construit pour deux rôles — **élève** (engagement) et **moniteur indépendant** (autorité + preuve). L'espace **gérant / auto-école** (`src/pages/gerant/*`) est **dormant / hors-cible** : ne pas y investir, ne pas le router en avant. ⚠️ Ne PAS le supprimer à la légère — le rôle `gerant` est couplé à l'auth, la nav ET au RLS (la policy `leads_select` repose sur `get_my_role() = 'gerant'`, c'est ce qui permet de **lire les leads** que la landing collecte). Un retrait propre = chantier DB dédié, pas un cleanup au passage. Détails GTM : `permigo-game/docs/GTM_PREMIERS_CLIENTS.md`.

> ⚠️ **Emplacement du projet** : le projet vivant est `permigo-game/`. La racine de `permigo-v7/` héberge un ancien projet Drizzle + Hono + SQLite (`dev.db`) inutilisé en prod, plus des docs legacy. NE PAS modifier le code à la racine sans validation explicite. Tous les chemins ci-dessous sont relatifs à `permigo-game/`.

## Stack & emplacements
- Frontend : `permigo-game/src/` — **Vanilla JS (ES modules)**, bundlé par Vite. Pas de TypeScript, pas de React, pas de react-query, pas de shadcn.
- Pages : `src/pages/` — chaque page exporte `mount(root, param)`, rendu via `innerHTML`.
- Échappement XSS : `src/utils/escape.js` (`esc()` / `richEsc()`) — obligatoire pour toute donnée injectée en `innerHTML`.
- Routing : **hash router maison** dans `src/router.js` (`#/route/{param}`, écoute `hashchange`).
- Auth + DB : **Supabase**. Client singleton `sb` exporté depuis `src/auth/auth.js`. User courant via `src/auth/cur-user.js`.
- Alias import : `@/` → `permigo-game/src/`.
- Migrations : `supabase/migrations/*.sql` (0000–0006) — JAMAIS modifier la prod directement.
- Edge functions : `supabase/functions/` (ex : `trigger-consolidation`).
- Config env : `src/config/env.js` (variables préfixées `VITE_`).
- ⚠️ `src/db/client.js` = façade Drizzle legacy (SQLite/Postgres), **non utilisée** par le front. Ignorer.

## Commandes (depuis `permigo-game/`)
- `npm run dev` — Vite dev
- `npm run build` — build prod
- `npm run preview` — preview du build
- `npm run lint` — ESLint
- `npm run test` — tests Playwright e2e (`tests/e2e/*.spec.js`, dont `a11y.spec.js` via axe-core)
- `npm run test:ui` — Playwright en mode UI

Pas de `typecheck` (pas de TS) ni de `db:types` — ces scripts n'existent pas.

**AVANT COMMIT** : `npm run lint && npm run build` (+ `npm run test` si tu touches un flow critique).

## Règles non-négociables
- **Échappement XSS** : toute donnée injectée dans `innerHTML` passe par `esc()` (`src/utils/escape.js`).
- TOUTES les tables Postgres ont **RLS activée**. Pas d'exception sur le schema public.
- Variables d'env client : préfixe **`VITE_`** (sinon Vite ne les expose pas).
- Ne **JAMAIS** mettre `SUPABASE_SERVICE_ROLE_KEY` côté client. Backend only.
- Toujours utiliser le client supabase **singleton** `sb` depuis `src/auth/auth.js`.
- Pattern d'appel Supabase : `const { data, error } = await sb.from(...)` — toujours gérer `error`, idéalement try/catch autour de l'`await`.

## Domaine métier
- **REMC** = Référentiel pour l'Éducation à une Mobilité Citoyenne (arrêté 13/05/2013).
- 4 compétences C1-C4. Livret officiel = **30 objectifs** (arrêté 29/07/2013, annexe III).
- Acteurs : **moniteur indépendant** (enseignant — cible & payeur) ↔ **élève** (apprenti — carburant viral). L'auto-école / gérant n'est plus la cible prioritaire (espace dormant, cf. cap produit ci-dessus).
- Value-prop : **l'outil DU moniteur, à SA marque** (vs plateformes type Ornikar / En Voiture Simone qui possèdent l'élève) + **engagement élève** (réviser / revenir entre les leçons) + **preuve & autorité** (« qui est prêt », taux de réussite à son nom).
- Concurrents : plateformes qui outillent le moniteur mais à *leur* marque (Ornikar, EVS) ; éditeurs historiques B2B école (Logipermis/Codes Rousseau, Ediser) ; SaaS modernes (Stych). Aucun n'est l'outil *propre* du moniteur avec une couche d'engagement élève — c'est le trou de marché.

## Workflow PR
1. Une branche par feature : `feat/`, `fix/`, `chore/`. Pas de push direct sur `main`.
2. Vérifier sur preview Vercel avant merge.
3. Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).

## Style code
- Un module par fichier ; fonctions camelCase.
- Pages : export `mount(root, param)`.
- Utils dans `src/utils/`, logique métier/réseau dans `src/services/`.
- i18n : français pour l'UI utilisateur ; commentaires/variables en anglais.
- **Logging — état réel** : il n'y a PAS de logger central. ~11 `console.log` traînent dans `src/`, plus des `console.error` dans les `catch`. Amélioration future (non-bloquante) : centraliser dans un `src/utils/logger.js` et remplacer les `console.*`. Tant que ce n'est pas fait, ne pas prétendre qu'une règle « pas de console.log » est en vigueur.

## Verification loop (IMPORTANT)
- Après modif d'une table → mets à jour/ajoute la migration SQL dans `supabase/migrations/`.
- Toute donnée user rendue en `innerHTML` → vérifier l'`esc()`.
- Build casse → fixe avant de continuer. Pas de "TODO fix later".
- Avant "c'est fini" : lance `npm run lint && npm run build` (et `npm run test` sur les flows critiques) et reporte la sortie.

## Erreurs récurrentes (mises à jour quand Claude se trompe)
- (vide — ajoute ici chaque fois que Claude fait la même erreur 2 fois)
