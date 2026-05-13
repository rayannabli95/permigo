-- ═══════════════════════════════════════════════════════════
-- AUTOPILOT v6 — Nouvelles tables (REMC, absences, notations, lieux, notes)
-- Colle tout ce fichier dans : Supabase > SQL Editor > Run
-- ═══════════════════════════════════════════════════════════

-- Table remc_entries : livret REMC par élève
-- Une ligne par compétence (C1a, C1b, ... C4g)
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

-- Table absences : absences des moniteurs
create table if not exists absences (
  id          uuid primary key default uuid_generate_v4(),
  moniteur_id uuid references profiles(id) on delete cascade,
  date_abs    date not null,
  duree_h     numeric default 4,
  motif       text,
  created_at  timestamptz default now()
);

-- Table notations : évaluations élève → moniteur
create table if not exists notations (
  id          uuid primary key default uuid_generate_v4(),
  eleve_id    uuid references profiles(id) on delete cascade,
  moniteur_id uuid references profiles(id) on delete cascade,
  stars       int check (stars between 1 and 5),
  commentaire text,
  created_at  timestamptz default now()
);

-- Table lieux : points de RDV par moniteur
create table if not exists lieux (
  id          uuid primary key default uuid_generate_v4(),
  moniteur_id uuid references profiles(id) on delete cascade,
  nom         text not null,
  adresse     text,
  actif       boolean default true,
  created_at  timestamptz default now()
);

-- Table notes_priv : notes privées moniteur sur un élève
create table if not exists notes_priv (
  id          uuid primary key default uuid_generate_v4(),
  moniteur_id uuid references profiles(id) on delete cascade,
  eleve_id    uuid references profiles(id) on delete cascade,
  contenu     text,
  updated_at  timestamptz default now(),
  unique(moniteur_id, eleve_id)
);

-- RLS : accès total pour l'instant (comme events et profiles)
alter table remc_entries enable row level security;
alter table absences      enable row level security;
alter table notations     enable row level security;
alter table lieux         enable row level security;
alter table notes_priv    enable row level security;

create policy "remc_all"      on remc_entries for all using (true) with check (true);
create policy "abs_all"       on absences     for all using (true) with check (true);
create policy "notations_all" on notations    for all using (true) with check (true);
create policy "lieux_all"     on lieux        for all using (true) with check (true);
create policy "notes_all"     on notes_priv   for all using (true) with check (true);
