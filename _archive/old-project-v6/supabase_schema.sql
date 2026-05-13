-- ═══════════════════════════════════════════════════════════
-- AUTOPILOT v6 — Schéma Supabase
-- Colle tout ce fichier dans : Supabase > SQL Editor > Run
-- ═══════════════════════════════════════════════════════════

-- Extension UUID (normalement déjà active sur Supabase)
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- TABLE : profiles
-- Contient les moniteurs et élèves créés par l'admin.
-- Liée à auth.users via auth_id une fois qu'ils se connectent.
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key default uuid_generate_v4(),
  auth_id     uuid unique references auth.users(id) on delete set null,
  role        text not null check (role in ('admin','moniteur','eleve')),
  nom         text not null,
  tel         text,
  email       text,
  plaque      text,         -- moniteur : plaque véhicule
  max_heures  int  default 35,   -- moniteur : plafond h/sem
  neph        text,         -- élève : numéro NEPH
  dob         date,         -- élève : date de naissance
  forfait_h   int  default 20,   -- élève : forfait heures
  statut      text default 'Actif',
  code_statut text default 'En cours',
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────
-- TABLE : events
-- Leçons, dispos, absences créées par les moniteurs.
-- Visibles par tous (moniteurs + élèves + admin).
-- ─────────────────────────────────────────────
create table if not exists events (
  id       uuid primary key default uuid_generate_v4(),
  h        text not null,      -- heure : '09:00'
  d        int  not null,      -- jour semaine : 1=lun, 7=dim
  n        text,               -- nom de l'élève
  t        text,               -- type : conf, pend, abs, perso, wait
  dur      numeric default 1,  -- durée en heures
  comment  text,
  lieu     text,
  mon_nom  text,               -- nom du moniteur
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- HELPER RLS
-- ─────────────────────────────────────────────
create or replace function auth_profile()
returns profiles language sql security definer stable as $$
  select * from profiles where auth_id = auth.uid() limit 1;
$$;

-- ─────────────────────────────────────────────
-- RLS (Row Level Security) — STRICTES dès l'origine
-- Chacun voit et modifie uniquement ses propres données.
-- ─────────────────────────────────────────────
alter table profiles enable row level security;
alter table events   enable row level security;

drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_all"    on profiles;
drop policy if exists "profiles_insert" on profiles;
drop policy if exists "profiles_update" on profiles;
drop policy if exists "profiles_delete" on profiles;
drop policy if exists "events_select"   on events;
drop policy if exists "events_all"      on events;
drop policy if exists "events_insert"   on events;
drop policy if exists "events_update"   on events;
drop policy if exists "events_delete"   on events;

-- profiles : chacun voit le sien, admin voit tout
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

-- events : moniteur voit/modifie les siens, élève voit les siens, admin tout
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

-- Pour les autres tables (remc_entries, absences, notations, lieux, notes_priv) :
-- exécuter supabase_rls_strict.sql APRÈS supabase_new_tables.sql

-- ─────────────────────────────────────────────
-- COMPTE ADMIN PAR DÉFAUT
-- Crée un profil admin pour Sophie Laurent.
-- Lance d'abord : Supabase > Auth > Users > "Add user"
-- Choisis un email et mot de passe forts — ne les note pas ici
-- Puis copie l'UUID de l'utilisateur créé à la place de REMPLACE_PAR_UUID_AUTH
-- ─────────────────────────────────────────────
-- insert into profiles (auth_id, role, nom, email)
-- values ('REMPLACE_PAR_UUID_AUTH', 'admin', 'Sophie Laurent', 'admin@autopilot.fr');
