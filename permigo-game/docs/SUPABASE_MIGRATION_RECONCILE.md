# Supabase Migration Reconcile — drift ledger ↔ prod

> **Statut : 2026-06-20.** Runbook pour réaligner le ledger Supabase
> (`supabase_migrations.schema_migrations`) avec les fichiers du repo, sans
> rejouer d'objets déjà présents en prod.
>
> ⚠️ **Aucune action destructive ici.** On ne touche PAS aux données ni au schéma
> prod. On corrige uniquement le **journal des migrations** (quelles versions sont
> marquées « appliquées ») + on durcit 1 fichier non-idempotent pour le futur.

---

## 1. Le problème (drift confirmé)

- Le **ledger distant** s'arrête à : version `20260612084208`, nom `fix_question_wording`.
- Le **repo** contient des migrations **postérieures** dont les objets **existent déjà en prod**
  (table `subscriptions`, fonction `get_hall_of_fame`, etc. — vérifiés live).
- Les migrations ont été appliquées via **MCP / SQL editor**, pas via `supabase db push`.
  → Les **timestamps du ledger ne correspondent pas** aux noms de fichiers du repo
  (ex. ledger `20260612084208` vs fichier `20260612150000_fix_question_wording.sql`).

**La DB est en AVANCE sur le ledger.** Risque : un futur `supabase db push` verra ces
migrations comme « pending » et tentera de **rejouer des objets existants** → échec
`already exists` sur les fichiers non-idempotents.

---

## 2. Frontière de drift

Le dernier logique enregistré au ledger = `fix_question_wording`. Dans le repo, c'est le
fichier `20260612150000_fix_question_wording.sql`. **Tout fichier dont le timestamp est
strictement postérieur à `20260612150000` est driftté** (présent en prod, absent du ledger).

| # | Fichier repo | Objets créés/modifiés | Au ledger ? | Idempotent ? |
|---|---|---|---|---|
| 1 | `20260615120000_subscriptions.sql` | table `subscriptions`, index, RLS, **policy**, fonction, **trigger** | non | ❌ **WILL FAIL** (policy + trigger) |
| 2 | `20260616000000_subscriptions_fk_auth_users.sql` | FK `subscriptions_user_id_fkey` → `auth.users` | non | ✅ safe (drop if exists + add) |
| 3 | `20260616010000_eleve_leaderboard_hall_of_fame.sql` | `get_eleve_leaderboard` (replace), `get_hall_of_fame` (new), grant | non | ✅ safe (create or replace + grant) |
| 4 | `20260616020000_prelaunch_hardening.sql` | drop index dupliqué + 8 index FK | non | ✅ safe (drop/create if exists) |

> Les fichiers **antérieurs ou égaux** à `20260612150000` correspondent à des entrées du
> ledger (avec des timestamps remappés côté ledger) et la baseline
> `00000000000000_baseline_prod_snapshot.sql` est un **document de référence non rejouable**
> (cf. `_RESYNC_NOTE.md`). On ne les touche pas ici.

### Détail idempotence — fichier #1 (`subscriptions.sql`)
Les deux instructions suivantes **échoueront** en re-run car non gardées :

```sql
-- ❌ pas de IF NOT EXISTS, pas de DROP préalable → "policy ... already exists"
create policy "user reads own subscription" on public.subscriptions ...

-- ❌ bare CREATE TRIGGER → "trigger ... already exists"
create trigger subscriptions_touch_updated_at before update on public.subscriptions ...
```

Le reste du fichier est sûr (`create table if not exists`, `create index if not exists`,
`enable row level security`, `create or replace function`).

---

## 3. Stratégie : REPAIR (pas re-run)

Les 4 objets sont **déjà en prod**. La bonne action n'est PAS de les rejouer mais de
**marquer ces versions comme appliquées** dans le ledger (`migration repair`). Ça insère
la ligne au journal **sans exécuter le SQL**.

### 3.1 Inspecter l'état (read-only, à faire d'abord)

```bash
# Depuis permigo-game/ — nécessite d'être lié au projet (supabase link) une fois.
supabase migration list
```

Lecture du tableau `Local | Remote | Time` :
- Les 4 versions ci-dessous apparaîtront avec une colonne **Local remplie / Remote vide**
  (= « pending » du point de vue de la CLI).
- Confirme que rien d'autre n'est inattendu (les ≤ `20260612150000` doivent être appariées
  côté Remote ; si certaines anciennes apparaissent aussi « Local only » à cause du remap de
  timestamps du ledger, NE PAS les repair sans vérifier d'abord que l'objet existe en prod —
  voir §3.4).

### 3.2 Marquer les 4 versions comme appliquées (le cœur du fix)

La version d'une migration = le **préfixe timestamp** du nom de fichier.

```bash
supabase migration repair --status applied 20260615120000
supabase migration repair --status applied 20260616000000
supabase migration repair --status applied 20260616010000
supabase migration repair --status applied 20260616020000
```

> `repair --status applied <version>` insère la ligne dans
> `supabase_migrations.schema_migrations` **sans exécuter le fichier**. C'est exactement ce
> qu'on veut : les objets existent déjà.

### 3.3 Re-vérifier

```bash
supabase migration list
```

Les 4 versions doivent maintenant être appariées (Local **et** Remote remplis). Ensuite :

```bash
supabase db push --dry-run    # doit afficher "Remote database is up to date" / 0 pending
```

Si `--dry-run` ne liste plus rien → drift résorbé. Ne **jamais** lancer un `db push` réel
tant que `--dry-run` n'est pas propre.

### 3.4 (Optionnel) Si d'anciennes versions apparaissent « Local only »

À cause du remap de timestamps (MCP), il se peut que des migrations ≤ `20260612150000`
apparaissent aussi désynchronisées. Pour chacune, **avant** de repair :
1. Vérifier en prod que l'objet attendu existe (table/fonction/policy) — via MCP
   `execute_sql` en read-only ou SQL editor.
2. Si oui → `supabase migration repair --status applied <version>`.
3. Si non (objet réellement manquant) → ce n'est PAS du drift de ledger mais une migration
   vraiment non appliquée : traiter au cas par cas (probablement rendre le fichier idempotent
   puis l'appliquer via `db push`).

---

## 4. Durcir le fichier non-idempotent (#1 `subscriptions.sql`)

Pour qu'un futur re-run / reset / `db push` ne casse pas, rendre la **policy** et le
**trigger** idempotents. Ça ne change rien en prod (les objets existent ; le repair les a
déjà enregistrés), c'est une assurance pour les environnements neufs et les rejeux.

Remplacer dans `20260615120000_subscriptions.sql` :

```sql
-- policy : ajouter un drop préalable
drop policy if exists "user reads own subscription" on public.subscriptions;
create policy "user reads own subscription"
  on public.subscriptions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- trigger : drop préalable (CREATE TRIGGER ne supporte pas IF NOT EXISTS partout)
drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_subscription_updated_at();
```

> Sur Postgres récent, `create or replace trigger` existe aussi ; le pattern
> `drop trigger if exists` + `create trigger` est le plus portable.
>
> ⚠️ Ce fichier est déjà appliqué en prod. **Modifier le fichier ne le ré-applique pas.**
> L'édition ne sert qu'aux rejeux/resets futurs. (Hors périmètre de ce runbook qui n'édite
> qu'un seul doc — appliquer ce durcissement dans un commit dédié.)

Les fichiers #2, #3, #4 sont déjà idempotents — rien à changer.

---

## 5. Liste exacte à repair (copier-coller)

```bash
supabase migration repair --status applied 20260615120000   # subscriptions
supabase migration repair --status applied 20260616000000   # subscriptions_fk_auth_users
supabase migration repair --status applied 20260616010000   # eleve_leaderboard_hall_of_fame
supabase migration repair --status applied 20260616020000   # prelaunch_hardening
```

Puis :

```bash
supabase migration list            # les 4 doivent être Local+Remote
supabase db push --dry-run         # doit être vide / "up to date"
```

---

## 6. Going forward — ne plus créer de drift

1. **Toujours appliquer via `supabase db push`** (jamais MCP `apply_migration` ni SQL editor
   pour du schéma versionné). C'est ce qui maintient le ledger en phase avec les fichiers.
2. Une migration = **un fichier** `AAAAMMJJHHMMSS_nom.sql` après le dernier, **écrit
   idempotent par défaut** :
   - `create table if not exists`, `create index if not exists`
   - `create or replace function/view`
   - `drop policy if exists` **avant** `create policy`
   - `drop trigger if exists` **avant** `create trigger` (ou `create or replace trigger`)
   - `add column if not exists`, et `drop constraint if exists` avant `add constraint`
   - `enable row level security` (no-op si déjà actif), `grant` (idempotent)
3. Avant tout merge : `supabase db push --dry-run` doit être propre.
4. Si un hotfix DB doit passer par MCP/SQL editor en urgence → **immédiatement** créer le
   fichier de migration correspondant ET faire un
   `supabase migration repair --status applied <version>` pour réenregistrer le ledger. Ne
   pas laisser le drift s'accumuler (c'est ce qui a produit cet incident).
5. Garder ce runbook + `_RESYNC_NOTE.md` à jour à chaque resync.
