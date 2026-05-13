-- ═══════════════════════════════════════════════════════════════════════════
-- AUTOPILOT / PERMIGO — Schéma Supabase COMPLET v2
-- ───────────────────────────────────────────────────────────────────────────
-- ⚠️  CE FICHIER REMPLACE TOUS LES ANCIENS .sql (schema + new_tables + rls_strict + audit_log)
--     Colle TOUT ce fichier dans : Supabase > SQL Editor > Run
--     (idempotent — peut être relancé sans danger)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABLES PRINCIPALES
-- ─────────────────────────────────────────────────────────────────────────────

-- profiles : utilisateurs (admin / moniteur / élève)
create table if not exists profiles (
  id          uuid primary key default uuid_generate_v4(),
  auth_id     uuid unique references auth.users(id) on delete set null,
  role        text not null check (role in ('admin','moniteur','eleve')),
  nom         text not null,
  tel         text,
  email       text,
  plaque      text,
  max_heures  int  default 35,
  neph        text,
  dob         date,
  forfait_h   int  default 20,
  statut      text default 'Actif',
  code_statut text default 'En cours',
  created_at  timestamptz default now()
);

-- events : leçons, dispos, absences
create table if not exists events (
  id         uuid primary key default uuid_generate_v4(),
  h          text not null,
  d          int  not null,
  n          text,
  t          text,
  dur        numeric default 1,
  comment    text,
  lieu       text,
  mon_nom    text,
  is_deleted boolean default false,
  created_at timestamptz default now()
);

-- remc_entries : livret REMC par élève
create table if not exists remc_entries (
  id           uuid primary key default uuid_generate_v4(),
  eleve_id     uuid references profiles(id) on delete cascade,
  moniteur_id  uuid references profiles(id),
  comp_id      text not null,
  checked      boolean default false,
  lv           text,
  note         text,
  validated_at timestamptz default now(),
  unique(eleve_id, comp_id)
);

-- absences : absences / annulations des moniteurs
create table if not exists absences (
  id          uuid primary key default uuid_generate_v4(),
  moniteur_id uuid references profiles(id) on delete cascade,
  date_abs    date not null,
  duree_h     numeric default 4,
  motif       text,
  created_at  timestamptz default now()
);

-- notations : évaluations élève → moniteur
create table if not exists notations (
  id          uuid primary key default uuid_generate_v4(),
  eleve_id    uuid references profiles(id) on delete cascade,
  moniteur_id uuid references profiles(id) on delete cascade,
  stars       int check (stars between 1 and 5),
  commentaire text,
  created_at  timestamptz default now()
);

-- lieux : points de RDV par moniteur
create table if not exists lieux (
  id          uuid primary key default uuid_generate_v4(),
  moniteur_id uuid references profiles(id) on delete cascade,
  nom         text not null,
  adresse     text,
  actif       boolean default true,
  created_at  timestamptz default now()
);

-- notes_priv : notes privées moniteur sur un élève
create table if not exists notes_priv (
  id          uuid primary key default uuid_generate_v4(),
  moniteur_id uuid references profiles(id) on delete cascade,
  eleve_id    uuid references profiles(id) on delete cascade,
  contenu     text,
  updated_at  timestamptz default now(),
  unique(moniteur_id, eleve_id)
);

-- notifications : notifications DB-backed (push vers utilisateurs)
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id) on delete cascade,
  type       text default 'info',   -- info | success | warning | alert
  title      text not null,
  body       text,
  read       boolean default false,
  created_at timestamptz default now()
);

-- audit_log : traçabilité complète des actions utilisateurs
create table if not exists audit_log (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id) on delete set null,
  user_nom   text,
  user_role  text,
  action     text not null,
  table_name text,
  record_id  uuid,
  details    jsonb,
  ip_hint    text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1b. MIGRATION — ajouter is_deleted si la table events existait déjà
-- ─────────────────────────────────────────────────────────────────────────────
alter table events add column if not exists is_deleted boolean default false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. INDEXES PERFORMANCE
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists idx_events_not_deleted   on events(is_deleted) where is_deleted = false;
create index if not exists idx_events_mon_nom        on events(mon_nom) where is_deleted = false;
create index if not exists idx_events_n              on events(n) where is_deleted = false;
create index if not exists idx_events_d              on events(d) where is_deleted = false;
create index if not exists idx_profiles_role         on profiles(role);
create index if not exists idx_profiles_auth_id      on profiles(auth_id) where auth_id is not null;
create index if not exists idx_remc_eleve            on remc_entries(eleve_id);
create index if not exists idx_absences_moniteur     on absences(moniteur_id);
create index if not exists idx_notations_moniteur    on notations(moniteur_id);
create index if not exists idx_lieux_moniteur        on lieux(moniteur_id) where actif = true;
create index if not exists idx_notifs_user           on notifications(user_id);
create index if not exists idx_notifs_unread         on notifications(user_id, read) where read = false;
create index if not exists idx_audit_user            on audit_log(user_id);
create index if not exists idx_audit_action          on audit_log(action);
create index if not exists idx_audit_created         on audit_log(created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CONTRAINTES UNICITÉ
-- ─────────────────────────────────────────────────────────────────────────────
create unique index if not exists idx_profiles_email_unique
  on profiles(email) where email is not null;

-- Anti double-booking : 2 leçons confirmées du même élève au même créneau
create unique index if not exists idx_events_no_double_booking
  on events(n, h, d)
  where t in ('conf','pend') and is_deleted = false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. FONCTIONS SECURITY DEFINER (évitent la récursion infinie sur profiles)
-- ─────────────────────────────────────────────────────────────────────────────
-- Ces fonctions lisent profiles avec les droits du propriétaire (BYPASS RLS)
-- sans créer de récursion. Utilisées dans toutes les politiques RLS.

create or replace function get_my_role()
returns text language sql security definer stable as $$
  select role from profiles where auth_id = auth.uid() limit 1;
$$;

create or replace function get_my_id()
returns uuid language sql security definer stable as $$
  select id from profiles where auth_id = auth.uid() limit 1;
$$;

create or replace function get_my_nom()
returns text language sql security definer stable as $$
  select nom from profiles where auth_id = auth.uid() limit 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY — activation
-- ─────────────────────────────────────────────────────────────────────────────
alter table profiles      enable row level security;
alter table events        enable row level security;
alter table remc_entries  enable row level security;
alter table absences      enable row level security;
alter table notations     enable row level security;
alter table lieux         enable row level security;
alter table notes_priv    enable row level security;
alter table notifications enable row level security;
alter table audit_log     enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RLS POLICIES — suppression des anciennes avant recréation
-- ─────────────────────────────────────────────────────────────────────────────
do $$ begin
  -- profiles
  drop policy if exists "profiles_select"   on profiles;
  drop policy if exists "profiles_insert"   on profiles;
  drop policy if exists "profiles_update"   on profiles;
  drop policy if exists "profiles_delete"   on profiles;
  drop policy if exists "profiles_all"      on profiles;
  -- events
  drop policy if exists "events_select"     on events;
  drop policy if exists "events_insert"     on events;
  drop policy if exists "events_update"     on events;
  drop policy if exists "events_delete"     on events;
  drop policy if exists "events_all"        on events;
  -- remc_entries
  drop policy if exists "remc_select"       on remc_entries;
  drop policy if exists "remc_write"        on remc_entries;
  drop policy if exists "remc_all"          on remc_entries;
  -- absences
  drop policy if exists "absences_select"   on absences;
  drop policy if exists "absences_write"    on absences;
  drop policy if exists "abs_all"           on absences;
  -- notations
  drop policy if exists "notations_select"  on notations;
  drop policy if exists "notations_insert"  on notations;
  drop policy if exists "notations_update"  on notations;
  drop policy if exists "notations_delete"  on notations;
  drop policy if exists "notations_all"     on notations;
  -- lieux
  drop policy if exists "lieux_select"      on lieux;
  drop policy if exists "lieux_write"       on lieux;
  drop policy if exists "lieux_all"         on lieux;
  -- notes_priv
  drop policy if exists "notes_select"      on notes_priv;
  drop policy if exists "notes_write"       on notes_priv;
  drop policy if exists "notes_all"         on notes_priv;
  -- notifications
  drop policy if exists "notifs_select"     on notifications;
  drop policy if exists "notifs_insert"     on notifications;
  drop policy if exists "notifs_update"     on notifications;
  drop policy if exists "notifs_delete"     on notifications;
  -- audit_log
  drop policy if exists "audit_select"      on audit_log;
  drop policy if exists "audit_insert"      on audit_log;
  drop policy if exists "audit_no_update"   on audit_log;
  drop policy if exists "audit_no_delete"   on audit_log;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RLS POLICIES — PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
-- Chacun voit son propre profil ; admin voit tout
create policy "profiles_select" on profiles for select using (
  auth_id = auth.uid() or get_my_role() = 'admin'
);
-- Inscription self-service (moniteur/élève) OU création par admin
create policy "profiles_insert" on profiles for insert with check (
  get_my_role() = 'admin'
  or (auth_id = auth.uid() and role in ('moniteur','eleve'))
);
-- Chacun modifie le sien ; admin modifie tout
create policy "profiles_update" on profiles for update using (
  auth_id = auth.uid() or get_my_role() = 'admin'
) with check (
  auth_id = auth.uid() or get_my_role() = 'admin'
);
-- Seul l'admin supprime
create policy "profiles_delete" on profiles for delete using (
  get_my_role() = 'admin'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RLS POLICIES — EVENTS
-- ─────────────────────────────────────────────────────────────────────────────
-- Moniteur voit ses events ; élève voit les siens ; admin voit tout
create policy "events_select" on events for select using (
  mon_nom = get_my_nom()
  or n = get_my_nom()
  or get_my_role() = 'admin'
);
-- Moniteur crée ses events ; élève peut créer une réservation (t='pend') ; admin crée tout
create policy "events_insert" on events for insert with check (
  mon_nom = get_my_nom()
  or get_my_role() in ('admin','eleve')
);
-- Moniteur modifie ses events ; admin modifie tout
create policy "events_update" on events for update using (
  mon_nom = get_my_nom() or get_my_role() = 'admin'
);
-- Moniteur soft-delete ses events ; admin peut hard-delete si nécessaire
create policy "events_delete" on events for delete using (
  mon_nom = get_my_nom() or get_my_role() = 'admin'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. RLS POLICIES — REMC_ENTRIES
-- ─────────────────────────────────────────────────────────────────────────────
create policy "remc_select" on remc_entries for select using (
  eleve_id    = get_my_id()
  or moniteur_id = get_my_id()
  or get_my_role() = 'admin'
);
create policy "remc_write" on remc_entries for all using (
  moniteur_id = get_my_id() or get_my_role() = 'admin'
) with check (
  moniteur_id = get_my_id() or get_my_role() = 'admin'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. RLS POLICIES — ABSENCES
-- ─────────────────────────────────────────────────────────────────────────────
create policy "absences_select" on absences for select using (
  moniteur_id = get_my_id() or get_my_role() = 'admin'
);
-- Admin et moniteur peuvent créer des absences
create policy "absences_insert" on absences for insert with check (
  moniteur_id = get_my_id() or get_my_role() = 'admin'
);
-- Seul l'admin modifie/supprime les absences
create policy "absences_update" on absences for update using (
  get_my_role() = 'admin'
);
create policy "absences_delete" on absences for delete using (
  get_my_role() = 'admin'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. RLS POLICIES — NOTATIONS
-- ─────────────────────────────────────────────────────────────────────────────
create policy "notations_select" on notations for select using (
  eleve_id    = get_my_id()
  or moniteur_id = get_my_id()
  or get_my_role() = 'admin'
);
-- Seul l'élève peut noter (et seulement son propre enregistrement)
create policy "notations_insert" on notations for insert with check (
  eleve_id = get_my_id()
);
-- Les notations sont immuables (personne ne modifie)
create policy "notations_update" on notations for update using (false);
-- Seul l'admin supprime
create policy "notations_delete" on notations for delete using (
  get_my_role() = 'admin'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. RLS POLICIES — LIEUX
-- ─────────────────────────────────────────────────────────────────────────────
create policy "lieux_select" on lieux for select using (
  moniteur_id = get_my_id()
  or get_my_role() in ('eleve','admin')
);
create policy "lieux_write" on lieux for all using (
  moniteur_id = get_my_id() or get_my_role() = 'admin'
) with check (
  moniteur_id = get_my_id() or get_my_role() = 'admin'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. RLS POLICIES — NOTES_PRIV
-- ─────────────────────────────────────────────────────────────────────────────
create policy "notes_select" on notes_priv for select using (
  moniteur_id = get_my_id() or get_my_role() = 'admin'
);
create policy "notes_write" on notes_priv for all using (
  moniteur_id = get_my_id() or get_my_role() = 'admin'
) with check (
  moniteur_id = get_my_id() or get_my_role() = 'admin'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. RLS POLICIES — NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────
-- Chacun lit ses propres notifications ; admin lit tout
create policy "notifs_select" on notifications for select using (
  user_id = get_my_id() or get_my_role() = 'admin'
);
-- N'importe quel utilisateur connecté peut créer une notif pour un autre (ex: moniteur → élève)
create policy "notifs_insert" on notifications for insert with check (
  get_my_id() is not null
);
-- Chacun peut marquer ses propres notifs comme lues
create policy "notifs_update" on notifications for update using (
  user_id = get_my_id() or get_my_role() = 'admin'
);
-- Seul l'admin supprime les notifications
create policy "notifs_delete" on notifications for delete using (
  get_my_role() = 'admin'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. RLS POLICIES — AUDIT_LOG
-- ─────────────────────────────────────────────────────────────────────────────
create policy "audit_select" on audit_log for select using (
  user_id = get_my_id() or get_my_role() = 'admin'
);
create policy "audit_insert" on audit_log for insert with check (
  user_id = get_my_id() or get_my_role() = 'admin'
);
-- Personne ne modifie les logs (immutabilité)
create policy "audit_no_update" on audit_log for update using (false);
-- Seul l'admin peut supprimer (purge manuelle si nécessaire)
create policy "audit_no_delete" on audit_log for delete using (
  get_my_role() = 'admin'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. BUCKET STORAGE — profile-photos
-- ─────────────────────────────────────────────────────────────────────────────
-- À exécuter dans Supabase > Storage > New Bucket :
--   nom : profile-photos
--   public : false (accès via signed URL)
-- Puis ajouter ces policies Storage dans Supabase > Storage > Policies :
--
-- INSERT : authenticated users can upload their own photo
--   allow insert where bucket_id = 'profile-photos'
--   and (storage.foldername(name))[1] = auth.uid()::text
--
-- SELECT : authenticated users can read their own photo
--   allow select where bucket_id = 'profile-photos'
--   and (storage.foldername(name))[1] = auth.uid()::text

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. REQUÊTES DE VÉRIFICATION (lancer après l'exécution)
-- ─────────────────────────────────────────────────────────────────────────────

-- Vérifier doublons email :
-- SELECT email, COUNT(*) FROM profiles WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1;

-- Vérifier double-booking résiduel :
-- SELECT n, h, d, COUNT(*) FROM events WHERE t IN ('conf','pend') AND is_deleted IS NOT TRUE GROUP BY n,h,d HAVING COUNT(*) > 1;

-- Compter les events soft-deleted :
-- SELECT COUNT(*) as supprimes FROM events WHERE is_deleted = true;

-- Notifs non lues par utilisateur :
-- SELECT p.nom, COUNT(*) as unread FROM notifications n JOIN profiles p ON p.id = n.user_id WHERE n.read = false GROUP BY p.nom ORDER BY unread DESC;

-- Progression REMC par élève :
-- SELECT p.nom, COUNT(*) FILTER (WHERE r.lv='v') as validees, COUNT(*) as total
-- FROM profiles p LEFT JOIN remc_entries r ON r.eleve_id = p.id
-- WHERE p.role = 'eleve' GROUP BY p.nom ORDER BY validees DESC;

-- Audit : dernières actions (24h) :
-- SELECT user_nom, user_role, action, table_name, created_at FROM audit_log WHERE created_at >= now() - interval '1 day' ORDER BY created_at DESC LIMIT 50;
