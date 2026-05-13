-- ═══════════════════════════════════════════════════════════
-- AUTOPILOT v6 — RLS strictes (remplace supabase_new_tables.sql policies)
-- Colle dans : Supabase > SQL Editor > Run
-- IMPORTANT : exécuter APRÈS supabase_schema.sql et supabase_new_tables.sql
-- ═══════════════════════════════════════════════════════════

-- Helper : récupère le profil de l'utilisateur connecté
create or replace function auth_profile()
returns profiles language sql security definer stable as $$
  select * from profiles where auth_id = auth.uid() limit 1;
$$;

-- ─────────────────────────────────────────────
-- profiles : chacun voit son propre profil + admin voit tout
-- ─────────────────────────────────────────────
drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_all"    on profiles;

create policy "profiles_select" on profiles for select using (
  auth_id = auth.uid()
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);
create policy "profiles_insert" on profiles for insert with check (
  (select role from profiles where auth_id = auth.uid()) = 'admin'
);
create policy "profiles_update" on profiles for update using (
  auth_id = auth.uid()
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
) with check (
  auth_id = auth.uid()
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);
create policy "profiles_delete" on profiles for delete using (
  (select role from profiles where auth_id = auth.uid()) = 'admin'
);

-- ─────────────────────────────────────────────
-- events : moniteur voit/modifie ses events + élève voit les siens + admin tout
-- ─────────────────────────────────────────────
drop policy if exists "events_select" on events;
drop policy if exists "events_all"    on events;

create policy "events_select" on events for select using (
  mon_nom = (select nom from profiles where auth_id = auth.uid())
  or n     = (select nom from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);
create policy "events_insert" on events for insert with check (
  mon_nom = (select nom from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) in ('admin','eleve')
);
create policy "events_update" on events for update using (
  mon_nom = (select nom from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);
create policy "events_delete" on events for delete using (
  mon_nom = (select nom from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);

-- ─────────────────────────────────────────────
-- remc_entries : élève voit les siennes, moniteur voit celles de ses élèves, admin tout
-- ─────────────────────────────────────────────
drop policy if exists "remc_all" on remc_entries;

create policy "remc_select" on remc_entries for select using (
  eleve_id    = (select id from profiles where auth_id = auth.uid())
  or moniteur_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);
create policy "remc_write" on remc_entries for all using (
  moniteur_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
) with check (
  moniteur_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);

-- ─────────────────────────────────────────────
-- absences : moniteur voit les siennes + admin tout
-- ─────────────────────────────────────────────
drop policy if exists "abs_all" on absences;

create policy "absences_select" on absences for select using (
  moniteur_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);
create policy "absences_write" on absences for all using (
  (select role from profiles where auth_id = auth.uid()) = 'admin'
) with check (
  (select role from profiles where auth_id = auth.uid()) = 'admin'
);

-- ─────────────────────────────────────────────
-- notations : élève crée, moniteur lit les siennes, admin tout
-- ─────────────────────────────────────────────
drop policy if exists "notations_all" on notations;

create policy "notations_select" on notations for select using (
  eleve_id    = (select id from profiles where auth_id = auth.uid())
  or moniteur_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);
create policy "notations_insert" on notations for insert with check (
  eleve_id = (select id from profiles where auth_id = auth.uid())
);
create policy "notations_update" on notations for update using (false); -- immuable
create policy "notations_delete" on notations for delete using (
  (select role from profiles where auth_id = auth.uid()) = 'admin'
);

-- ─────────────────────────────────────────────
-- lieux : moniteur gère les siens, élève lit (pour réservation), admin tout
-- ─────────────────────────────────────────────
drop policy if exists "lieux_all" on lieux;

create policy "lieux_select" on lieux for select using (
  moniteur_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) in ('eleve','admin')
);
create policy "lieux_write" on lieux for all using (
  moniteur_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
) with check (
  moniteur_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);

-- ─────────────────────────────────────────────
-- notes_priv : moniteur lit/écrit ses propres notes sur ses élèves, admin tout
-- ─────────────────────────────────────────────
drop policy if exists "notes_all" on notes_priv;

create policy "notes_select" on notes_priv for select using (
  moniteur_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);
create policy "notes_write" on notes_priv for all using (
  moniteur_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
) with check (
  moniteur_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);
