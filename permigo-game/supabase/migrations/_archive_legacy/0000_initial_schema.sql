-- ═══════════════════════════════════════════════════════════════
-- PermiGo Game — Initial Schema (V1 MVP)
-- ═══════════════════════════════════════════════════════════════
-- Run order : 0000 (this) → 0001_seed_competences → 0002_seed_questions
-- ═══════════════════════════════════════════════════════════════

-- ─── EXTENSIONS ──────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_net" with schema extensions; -- pour Edge Functions cron

-- ─── 1. AUTO-ÉCOLES ──────────────────────────────────────────────
create table public.auto_ecoles (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  slug text unique,
  ville text,
  abonnement_status text not null default 'beta' check (abonnement_status in ('beta','active','cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_auto_ecoles_slug on public.auto_ecoles(slug);

-- ─── 2. PROFILES (users) ─────────────────────────────────────────
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid references auth.users(id) on delete cascade unique,
  role text not null check (role in ('eleve','enseignant','gerant')),
  prenom text not null,
  nom_initial text,
  avatar_preset text default 'starter-1',
  avatar_url text,
  auto_ecole_id uuid references public.auto_ecoles(id) on delete set null,
  enseignant_id uuid references public.profiles(id) on delete set null,
  credit_heures decimal(4,1) default 0,
  gems int default 0,
  xp int default 0,
  unlocked_avatars jsonb default '[]'::jsonb,
  unlocked_themes jsonb default '[]'::jsonb,
  is_internal boolean default false,
  created_at timestamptz default now(),
  last_active_at timestamptz default now(),
  first_value_action_at timestamptz
);

create index idx_profiles_auth_id on public.profiles(auth_id);
create index idx_profiles_auto_ecole_id on public.profiles(auto_ecole_id);
create index idx_profiles_enseignant_id on public.profiles(enseignant_id);
create index idx_profiles_role on public.profiles(role);

-- ─── 3. COMPÉTENCES REMC (référentiel officiel) ──────────────────
create table public.competences_remc (
  id text primary key,           -- 'C01.1', 'C02.3', etc.
  code text not null,
  nom text not null,
  description text,
  monde int check (monde between 1 and 4),
  ordre int,
  prerequis text[] default array[]::text[]
);

create index idx_competences_remc_monde on public.competences_remc(monde);

-- ─── 4. QUESTIONS PAR COMPÉTENCE ─────────────────────────────────
create table public.questions_competence (
  id uuid primary key default gen_random_uuid(),
  competence_id text references public.competences_remc(id) on delete cascade,
  question text not null,
  options jsonb not null,         -- ["option A", "option B", ...]
  correct_index int not null,
  explanation text,
  difficulty int default 2 check (difficulty between 1 and 3),
  type text default 'post_validation' check (type in ('post_validation','consolidation','exam_blanc'))
);

create index idx_questions_competence_id on public.questions_competence(competence_id);
create index idx_questions_type on public.questions_competence(type);

-- ─── 5. VALIDATIONS (statut compétences par élève) ───────────────
create table public.validations (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid references public.profiles(id) on delete cascade,
  competence_id text references public.competences_remc(id) on delete cascade,
  validated_by uuid references public.profiles(id) on delete set null,
  validated_at timestamptz default now(),
  statut text default 'acquis' check (statut in ('acquis','en_cours','a_retravailler')),
  score_cognitif int check (score_cognitif is null or score_cognitif between 0 and 100),
  score_consolidation int check (score_consolidation is null or score_consolidation between 0 and 100),
  consolidation_due_at timestamptz,
  consolidation_done_at timestamptz,
  note_enseignant text,
  unique(eleve_id, competence_id)
);

create index idx_validations_eleve_id on public.validations(eleve_id);
create index idx_validations_validated_by on public.validations(validated_by);
create index idx_validations_consolidation_due on public.validations(consolidation_due_at)
  where consolidation_due_at is not null and consolidation_done_at is null;

-- ─── 6. QUIZ ATTEMPTS (log complet) ──────────────────────────────
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  competence_id text references public.competences_remc(id) on delete cascade,
  type text not null check (type in ('post_validation','consolidation','exam_blanc','review')),
  questions_ids uuid[],
  answers_indices int[],
  score int check (score between 0 and 100),
  duration_seconds int,
  completed_at timestamptz default now()
);

create index idx_quiz_attempts_user_id on public.quiz_attempts(user_id);
create index idx_quiz_attempts_competence_id on public.quiz_attempts(competence_id);
create index idx_quiz_attempts_type on public.quiz_attempts(type);

-- ─── 7. STREAKS ──────────────────────────────────────────────────
create table public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak int default 0,
  longest_streak int default 0,
  last_activity_date date,
  frozen_until date,
  updated_at timestamptz default now()
);

-- ─── 8. LEÇONS RÉALISÉES (log simple, PAS planning) ──────────────
create table public.lecons_realisees (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid references public.profiles(id) on delete cascade,
  enseignant_id uuid references public.profiles(id) on delete cascade,
  date_lecon date not null,
  duree_heures decimal(3,1),
  competences_validees text[] default array[]::text[],
  notes text,
  created_at timestamptz default now()
);

create index idx_lecons_eleve_id on public.lecons_realisees(eleve_id);
create index idx_lecons_enseignant_id on public.lecons_realisees(enseignant_id);
create index idx_lecons_date on public.lecons_realisees(date_lecon);

-- ─── 9. NOTIFICATIONS ────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_unread on public.notifications(user_id, read) where read = false;

-- ─── 10. EVENTS ANALYTICS ────────────────────────────────────────
create table public.events_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  properties jsonb default '{}'::jsonb,
  session_id text,
  created_at timestamptz default now()
);

create index idx_events_user_id on public.events_analytics(user_id);
create index idx_events_name on public.events_analytics(event_name);
create index idx_events_created_at on public.events_analytics(created_at);

-- ─── 11. INVITATIONS ─────────────────────────────────────────────
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  auto_ecole_id uuid references public.auto_ecoles(id) on delete cascade,
  email text not null,
  role text not null check (role in ('eleve','enseignant')),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz default (now() + interval '7 days'),
  accepted_at timestamptz,
  enseignant_attitre_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_invitations_token on public.invitations(token);
create index idx_invitations_email on public.invitations(email);

-- ─── 12. LEADS (acquisition école) ───────────────────────────────
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  ecole_nom text not null,
  ville text,
  nb_enseignants int,
  email text not null,
  telephone text,
  status text default 'nouveau' check (status in ('nouveau','contacte','converti','perdu')),
  source text default 'landing',
  message text,
  created_at timestamptz default now()
);

create index idx_leads_status on public.leads(status);
create index idx_leads_created_at on public.leads(created_at);

-- ═══════════════════════════════════════════════════════════════
-- RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table public.auto_ecoles enable row level security;
alter table public.profiles enable row level security;
alter table public.competences_remc enable row level security;
alter table public.questions_competence enable row level security;
alter table public.validations enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.streaks enable row level security;
alter table public.lecons_realisees enable row level security;
alter table public.notifications enable row level security;
alter table public.events_analytics enable row level security;
alter table public.invitations enable row level security;
alter table public.leads enable row level security;

-- ─── Helper functions ─────────────────────────────────────────────
create or replace function public.get_my_id() returns uuid
  language sql security definer stable
  set search_path = public, pg_temp
as $$
  select id from public.profiles where auth_id = auth.uid() limit 1
$$;

create or replace function public.get_my_role() returns text
  language sql security definer stable
  set search_path = public, pg_temp
as $$
  select role from public.profiles where auth_id = auth.uid() limit 1
$$;

create or replace function public.get_my_auto_ecole_id() returns uuid
  language sql security definer stable
  set search_path = public, pg_temp
as $$
  select auto_ecole_id from public.profiles where auth_id = auth.uid() limit 1
$$;

-- ─── Policies: AUTO_ECOLES ───────────────────────────────────────
create policy auto_ecoles_select on public.auto_ecoles
  for select to authenticated using (
    id = public.get_my_auto_ecole_id() or public.get_my_role() = 'gerant'
  );

create policy auto_ecoles_insert on public.auto_ecoles
  for insert to anon, authenticated with check (true);

create policy auto_ecoles_update on public.auto_ecoles
  for update to authenticated using (
    id = public.get_my_auto_ecole_id() and public.get_my_role() = 'gerant'
  );

-- ─── Policies: PROFILES ──────────────────────────────────────────
create policy profiles_select on public.profiles
  for select to authenticated using (
    auth_id = auth.uid()
    or auto_ecole_id = public.get_my_auto_ecole_id()
  );

create policy profiles_insert on public.profiles
  for insert to authenticated with check (
    auth_id = auth.uid()
  );

create policy profiles_update on public.profiles
  for update to authenticated using (
    auth_id = auth.uid() or public.get_my_role() = 'gerant'
  );

-- ─── Policies: COMPETENCES_REMC (public read) ────────────────────
create policy competences_select on public.competences_remc
  for select to authenticated using (true);

-- ─── Policies: QUESTIONS_COMPETENCE (authenticated read) ─────────
create policy questions_select on public.questions_competence
  for select to authenticated using (true);

-- ─── Policies: VALIDATIONS ───────────────────────────────────────
create policy validations_select on public.validations
  for select to authenticated using (
    eleve_id = public.get_my_id()
    or validated_by = public.get_my_id()
    or (
      public.get_my_role() = 'gerant'
      and exists (
        select 1 from public.profiles
        where id = validations.eleve_id
          and auto_ecole_id = public.get_my_auto_ecole_id()
      )
    )
  );

create policy validations_insert on public.validations
  for insert to authenticated with check (
    public.get_my_role() in ('enseignant','gerant')
    and validated_by = public.get_my_id()
  );

create policy validations_update on public.validations
  for update to authenticated using (
    -- L'élève peut update son propre score_cognitif et score_consolidation
    eleve_id = public.get_my_id()
    -- L'enseignant peut update les validations qu'il a créées
    or validated_by = public.get_my_id()
  );

-- ─── Policies: QUIZ_ATTEMPTS ─────────────────────────────────────
create policy quiz_attempts_select on public.quiz_attempts
  for select to authenticated using (
    user_id = public.get_my_id()
  );

create policy quiz_attempts_insert on public.quiz_attempts
  for insert to authenticated with check (
    user_id = public.get_my_id()
  );

-- ─── Policies: STREAKS ───────────────────────────────────────────
create policy streaks_select on public.streaks
  for select to authenticated using (user_id = public.get_my_id());

create policy streaks_insert on public.streaks
  for insert to authenticated with check (user_id = public.get_my_id());

create policy streaks_update on public.streaks
  for update to authenticated using (user_id = public.get_my_id());

-- ─── Policies: LECONS_REALISEES ──────────────────────────────────
create policy lecons_select on public.lecons_realisees
  for select to authenticated using (
    eleve_id = public.get_my_id()
    or enseignant_id = public.get_my_id()
    or public.get_my_role() = 'gerant'
  );

create policy lecons_insert on public.lecons_realisees
  for insert to authenticated with check (
    public.get_my_role() = 'enseignant'
    and enseignant_id = public.get_my_id()
  );

-- ─── Policies: NOTIFICATIONS ─────────────────────────────────────
create policy notifications_select on public.notifications
  for select to authenticated using (user_id = public.get_my_id());

create policy notifications_update on public.notifications
  for update to authenticated using (user_id = public.get_my_id());

-- ─── Policies: EVENTS_ANALYTICS ──────────────────────────────────
create policy events_insert on public.events_analytics
  for insert to authenticated with check (
    user_id = public.get_my_id() or user_id is null
  );

create policy events_select on public.events_analytics
  for select to authenticated using (
    public.get_my_role() = 'gerant' and user_id in (
      select id from public.profiles where auto_ecole_id = public.get_my_auto_ecole_id()
    )
  );

-- ─── Policies: INVITATIONS ───────────────────────────────────────
create policy invitations_select on public.invitations
  for select to authenticated using (
    auto_ecole_id = public.get_my_auto_ecole_id()
  );

create policy invitations_insert on public.invitations
  for insert to authenticated with check (
    public.get_my_role() in ('gerant','enseignant')
    and auto_ecole_id = public.get_my_auto_ecole_id()
  );

-- ─── Policies: LEADS ─────────────────────────────────────────────
create policy leads_insert on public.leads
  for insert to anon, authenticated with check (true);

create policy leads_select on public.leads
  for select to authenticated using (
    -- Seul l'admin de PermiGo (toi) voit les leads
    public.get_my_role() = 'gerant' and exists (
      select 1 from auth.users where id = auth.uid() and email = 'rayannabli27@gmail.com'
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Auto-create profile on auth signup
create or replace function public.handle_new_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (auth_id, role, prenom)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'eleve'),
    coalesce(new.raw_user_meta_data->>'prenom', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_signup();

-- Auto-set consolidation_due_at when validation created
create or replace function public.set_consolidation_due()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- 48h après la validation
  new.consolidation_due_at := new.validated_at + interval '48 hours';
  return new;
end;
$$;

create trigger validations_set_consolidation
  before insert on public.validations
  for each row execute function public.set_consolidation_due();

-- ═══════════════════════════════════════════════════════════════
-- VIEWS (pour le dashboard gérant)
-- ═══════════════════════════════════════════════════════════════

create or replace view public.pulse_ecole as
select
  a.id as auto_ecole_id,
  a.nom,
  -- nb élèves actifs
  count(distinct p.id) filter (
    where p.role = 'eleve' and p.last_active_at > now() - interval '7 days'
  ) as eleves_actifs_7d,
  count(distinct p.id) filter (where p.role = 'eleve') as eleves_total,
  -- nb enseignants
  count(distinct p.id) filter (where p.role = 'enseignant') as enseignants_total,
  -- élèves à risque
  count(distinct p.id) filter (
    where p.role = 'eleve' and p.last_active_at < now() - interval '14 days'
  ) as eleves_a_risque,
  -- élèves prêts examen (>= 80% compétences validées)
  count(distinct p.id) filter (
    where p.role = 'eleve' and (
      select count(*) from public.validations v where v.eleve_id = p.id and v.statut = 'acquis'
    ) >= 25 -- 80% de 31 compétences
  ) as eleves_prets_examen,
  -- abonnement status
  a.abonnement_status,
  a.created_at
from public.auto_ecoles a
left join public.profiles p on p.auto_ecole_id = a.id
group by a.id;

-- ═══════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════
