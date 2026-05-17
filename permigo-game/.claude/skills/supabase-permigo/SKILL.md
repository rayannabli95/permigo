---
name: supabase-permigo
description: Expert Supabase pour PermiGo Game. A UTILISER IMPERATIVEMENT des que l'utilisateur mentionne table, RLS, policy, migration, edge function, schema DB, query Postgres, auth, ou role (eleve/enseignant/gerant). Fournit patterns RLS multi-role, generation de migrations, edge functions Deno.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, mcp__31727b35-9278-4b6b-97c4-5fc9a4f48a52__execute_sql, mcp__31727b35-9278-4b6b-97c4-5fc9a4f48a52__apply_migration, mcp__31727b35-9278-4b6b-97c4-5fc9a4f48a52__list_tables
---

# Supabase expert pour PermiGo Game

## Projet Supabase

- **project_id** : `arrfmdagdqtrtfbhxlty`
- **URL** : voir `VITE_SUPABASE_URL` dans `.env.local`
- **Auth** : email/password + magic link

## Roles PermiGo (stockes dans `profiles.role`)

| Role | Permissions |
|---|---|
| `eleve` | Voit/modifie SON livret uniquement. Lit ses validations, repond aux quiz. |
| `enseignant` | Voit ses eleves rattaches. Valide leurs competences. Cree validations. |
| `gerant` | Voit toute l'auto-ecole (eleves + enseignants). KPI agreges. |

**JAMAIS** utiliser `auth.jwt() -> raw_user_meta_data` pour l'authz (modifiable cote client). TOUJOURS passer par `public.profiles.role`.

## Pattern policy "defense en profondeur"

1. RLS activee sur TOUTES les tables `public.*` (jamais d'exception)
2. Policy SELECT separee des UPDATE/DELETE
3. `TO authenticated` (jamais `TO public`) sauf cas justifie
4. Wrapper `auth.uid()` et fonctions dans `(select ...)` -> optimise par initPlan
5. Index obligatoire sur chaque colonne referencee par policy

## Helper standard (deja en place)

```sql
create or replace function public.current_role()
returns text language sql security definer set search_path = '' as $$
  select role::text from public.profiles where id = auth.uid()
$$;
```

## Patterns RLS PermiGo

### 1. Eleve lit sa propre donnee
```sql
create policy "eleve lit son livret"
on public.validations for select
to authenticated
using ((select auth.uid()) = eleve_id);
```

### 2. Enseignant lit les eleves de son ecole
```sql
create policy "enseignant lit ses eleves"
on public.profiles for select
to authenticated
using (
  ecole_id = (select ecole_id from public.profiles where id = auth.uid())
  and (select public.current_role()) in ('enseignant', 'gerant')
);
```

### 3. Enseignant cree une validation
```sql
create policy "enseignant valide competence"
on public.validations for insert
to authenticated
with check (
  (select public.current_role()) = 'enseignant'
  and enseignant_id = (select auth.uid())
);
```

### 4. Gerant lit tout dans son ecole
```sql
create policy "gerant lit son ecole"
on public.validations for select
to authenticated
using (
  (select public.current_role()) = 'gerant'
  and ecole_id = (select ecole_id from public.profiles where id = auth.uid())
);
```

## Migrations

- Utilise le MCP Supabase : `apply_migration` (versionne automatiquement)
- Nom : `YYYYMMDD_description_courte.sql` (ex: `20260517_add_consolidation_due_at`)
- **JAMAIS** editer une migration deja appliquee -> creer une nouvelle (le hook `protect-migrations.sh` bloque sinon)
- Apres migration : verifier avec `list_tables` que tout est OK

## Edge Functions (Deno)

Pattern obligatoire pour `supabase/functions/<nom>/index.ts` :

```ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY')!,
  );

  // Logique...

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

Deploy : `supabase functions deploy <nom> --no-verify-jwt` (ou avec JWT si user-callable).

## Anti-patterns a refuser

- ❌ `service_role` key dans le frontend (verifie par hook `protect-secrets.sh`)
- ❌ RLS desactivee "temporairement"
- ❌ Policy `using (true)` ou `TO public`
- ❌ Migration editee apres apply
- ❌ `raw_user_meta_data` pour authz
- ❌ Pas d'index sur colonne RLS (= scan complet a chaque query)

## Checklist nouvelle table

- [ ] `alter table ... enable row level security`
- [ ] Policies SELECT/INSERT/UPDATE/DELETE explicites
- [ ] Index sur colonnes RLS (`eleve_id`, `ecole_id`, etc.)
- [ ] Foreign keys + cascade ou set null choisis
- [ ] Commentaires sur table + colonnes
- [ ] Migration nommee correctement
