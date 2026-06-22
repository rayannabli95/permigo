# Plan d'action — Brique « Où en est l'élève » (résultat examen + readiness)

*Brief d'implémentation prêt à exécuter par Claude Code. 7 juin 2026.*

## Contexte (à lire avant de coder)

PermiGo, projet vivant dans `permigo-game/` (Vanilla JS + Vite + Supabase). On construit **le cœur de valeur du compte enseignant** : permettre au moniteur de voir d'un coup d'œil qui est prêt à passer l'examen, qui ne l'est pas et *pourquoi*, et d'enregistrer le résultat d'examen. Objectif métier : donner au moniteur de l'autorité objective face à l'élève qui réclame une date (« le livret dit qu'il te manque ça »), et archiver les élèves reçus.

**Ce qui existe déjà (ne pas recasser) :**
- `src/pages/enseignant/mes-eleves.js` calcule et affiche déjà la complétude `acquis/31` par élève (table `validations`, `statut='acquis'`), avec tri, recherche, onglets (Tous / Actifs / À relancer) et un mode « drill » (élèves bloqués sur une compétence).
- `src/data/remc.js` : référentiel des **31 sous-compétences** (`REMC`, `REMC_TOTAL`, `findSubComp`, `findCategory`). IDs type `C1a`, `C4f`.
- Seuil « prêt examen » déjà utilisé en base : **`acquis >= 25` sur 31**. On le réutilise tel quel.

**Hors scope (ne PAS faire) :** pas de parcours/XP/ligue moniteur, pas d'acquisition d'élèves, pas de refonte design. On ajoute UNE brique, proprement.

---

## Étape 1 — Modèle de données : nouvelle table `examens`

Créer une **nouvelle table** `examens` (et non une colonne sur `profiles` : évite les conflits de policy RLS entre la mise à jour par le moniteur et la policy d'update de l'élève sur son propre profil, et permet l'historique des passages).

Nouvelle migration timestampée dans `permigo-game/supabase/migrations/` (format `YYYYMMDDHHMMSS_examens.sql`, ex. `20260607HHMMSS_examens.sql`).

Colonnes :
- `id uuid PK default gen_random_uuid()`
- `eleve_id uuid not null` (FK profiles)
- `statut text not null check (statut in ('planifie','recu','rate'))`
- `date_examen date` (nullable ; renseignée si planifié/passé)
- `created_by uuid not null` (le moniteur, = auth.uid())
- `created_at timestamptz not null default now()`

Index : `(eleve_id, created_at desc)`.

**RLS (obligatoire — toutes les tables ont RLS) :**
- `SELECT` : un enseignant authentifié voit les `examens` des élèves de son auto-école (réutiliser le même partage que `validations` côté école). 
- `INSERT` : un enseignant peut insérer une ligne pour un élève de son auto-école, avec `created_by = auth.uid()`.
- Pas d'UPDATE/DELETE en v1 (un nouveau passage = nouvelle ligne ; le dernier `created_at` fait foi).

⚠️ **Piège connu (cf. historique projet)** : si un trigger se déclenche sur `examens` et tente de créditer/notifier l'ÉLÈVE alors que l'appelant est le MONITEUR, on retombe sur les gardes `caller != user` (erreur `forbidden_target_user`). Donc **pas de trigger qui écrit sur une autre table au nom de l'élève** ici. Si une notif élève est souhaitée plus tard, passer par le pattern `app.trusted_op` existant.

**État « reçu » dérivé** : un élève est considéré *reçu* si sa ligne `examens` la plus récente a `statut='recu'`.

---

## Étape 2 — Logique readiness (front)

Dans `mes-eleves.js`, à partir de `acquis` (déjà calculé) et du dernier `examens.statut`, dériver un état par élève :

- **`recu`** → dernier examen `recu` (archivé, sort des vues actives)
- **`pret`** → `acquis >= 25` et pas reçu
- **`en_approche`** → `acquis` entre 18 et 24
- **`en_cours`** → `acquis < 18`

Calculer aussi la **liste des sous-compétences manquantes** : `REMC` (les 31) moins les `competence_id` ayant `statut='acquis'` pour cet élève. C'est ce qui alimente le « pourquoi il n'est pas prêt ».

> Charger les `competence_id` acquis par élève : aujourd'hui `loadData()` ne récupère que le *count*. L'étendre pour récupérer aussi le set des `competence_id` acquis par élève (un seul `select eleve_id, competence_id from validations where statut='acquis'`), afin de pouvoir lister les manquantes.

---

## Étape 3 — UI dans `mes-eleves.js`

1. **Charger les examens** dans `loadData()` : `select eleve_id, statut, date_examen, created_at from examens order by created_at desc`, garder le plus récent par élève. Toujours gérer `{ data, error }`.
2. **Badge readiness** sur chaque `me-row` : `Prêt ✓` (vert) si `pret`, `Reçu` (archivé) si `recu`, rien de spécial sinon. Réutiliser le style des badges existants (`.me-badge`).
3. **Onglets** : ajouter un onglet **« Prêts »** (`acquis>=25`, non reçus) et un onglet **« Reçus »** (archive). Les élèves `recu` sortent des onglets Tous/Actifs/À relancer.
4. **Détail « pourquoi pas prêt »** : au clic sur un élève en `en_approche`/`en_cours`, afficher la liste nommée des compétences manquantes (via `findSubComp` pour le libellé). Réutiliser la page livret (`#/livret/{id}`) si elle liste déjà les compétences, sinon ajouter un petit panneau « Il manque : C3a Conduite de nuit, C4f Présentation à l'examen… ». C'est l'écran que le moniteur montre à l'élève.
5. **Enregistrer un résultat d'examen** : dans le menu long-press existant (`openQuickMenu`), ajouter les actions « Examen planifié », « Reçu », « Raté » → insert dans `examens`. Toast de confirmation. Re-render de la liste.

Contraintes de code (CLAUDE.md) : toute donnée injectée en `innerHTML` passe par `esc()` ; client supabase **singleton** `sb` depuis `@/auth/auth.js` ; pattern `const { data, error } = await sb...` avec gestion d'erreur ; français pour l'UI, anglais pour le code.

---

## Étape 4 — Vérification (obligatoire avant « c'est fini »)

1. `cd permigo-game && npm run build` → doit passer sans erreur. Fixer toute casse avant de continuer.
2. Tester le flow manuellement : marquer un élève « Reçu » → il disparaît des actifs et apparaît dans « Reçus » ; un élève à 26/31 affiche `Prêt ✓` ; un élève à 20/31 affiche bien la liste de ses compétences manquantes.
3. Vérifier que la table `examens` a bien RLS activée et que les policies sont en place (`select`, `insert`).
4. Migration : ne JAMAIS toucher la prod directement, juste ajouter le fichier SQL dans `supabase/migrations/`.

---

## Workflow git

- `git checkout main && git pull` (toujours partir d'un main à jour — déjà eu un écrasement de travail mergé).
- Branche `feat/examen-readiness`.
- Commits conventionnels (`feat:`, `fix:`).
- Vérifier sur preview Vercel avant merge.

---

## Résumé en une ligne pour l'agent

> Dans `permigo-game/`, ajoute une table `examens` (RLS) pour le résultat d'examen, et dans `mes-eleves.js` calcule un état de readiness (reçu / prêt ≥25 / en approche / en cours), archive les reçus, montre les compétences manquantes des non-prêts, et permet d'enregistrer reçu/raté/planifié via le menu long-press. `npm run build` doit passer. Pas de parcours/XP, pas de trigger écrivant au nom de l'élève.
