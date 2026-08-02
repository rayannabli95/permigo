-- ═══════════════════════════════════════════════════════════════
-- Duel entre amis (« Qui est le plus permifié ? »)
--
-- Un élève CONNECTÉ crée une partie et envoie un lien. Ses amis jouent
-- SANS COMPTE : ils tapent un prénom et c'est tout.
--
-- Conséquence de sécurité : un invité n'a AUCUNE session Supabase, donc
-- aucune policy RLS ne peut le décrire. Tout le circuit passe par l'edge
-- function `duel` (service role) qui fait elle-même l'autorisation, avec
-- le code de la partie comme secret partagé. Les tables restent en RLS
-- activée sans porte d'entrée directe depuis le client.
--
-- Ce n'est PAS un quiz certifiant : rien n'est écrit dans quiz_attempts,
-- aucune compétence n'est validée. C'est un jeu de soirée.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.duels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references auth.users (id) on delete cascade,
  question_ids uuid[] not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  constraint duels_code_len check (char_length(code) between 4 and 12),
  constraint duels_questions_len check (
    array_length(question_ids, 1) between 1 and 20
  )
);

comment on table public.duels is
  'Partie « Défie tes amis ». Le code est le secret partagé qui autorise un invité sans compte à jouer.';
comment on column public.duels.question_ids is
  'Les questions tirées à la création : tous les joueurs voient les mêmes, dans le même ordre.';
comment on column public.duels.expires_at is
  'Au delà, la partie et son classement ne sont plus servis (le score d''un invité ne vit que 7 jours).';

create index if not exists duels_code_idx on public.duels (code);
create index if not exists duels_host_idx on public.duels (host_id);

create table if not exists public.duel_players (
  id uuid primary key default gen_random_uuid(),
  duel_id uuid not null references public.duels (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  score int,
  missed_ids uuid[],
  is_host boolean not null default false,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint duel_players_name_len check (char_length(name) between 1 and 24),
  constraint duel_players_score_range check (
    score is null or score between 0 and 20
  )
);

comment on table public.duel_players is
  'Un joueur d''une partie. `user_id` est NULL pour un invité sans compte : `name` est un simple prénom d''affichage, jamais une donnée de contact.';
comment on column public.duel_players.id is
  'Sert aussi de jeton du joueur : c''est lui qui autorise l''envoi du score. Gardé côté client dans localStorage.';

create index if not exists duel_players_duel_idx on public.duel_players (duel_id);

alter table public.duels enable row level security;
alter table public.duel_players enable row level security;

-- L'hôte relit SES parties depuis l'app (retrouver le lien d'une partie).
create policy duels_select_host on public.duels
  for select
  to authenticated
  using ((select auth.uid()) = host_id);

-- ⚠️ AUCUNE policy sur duel_players, et c'est volontaire : le classement se
-- lit UNIQUEMENT via l'edge function, qui exige le code de la partie. Sans ça
-- n'importe quel compte pourrait balayer les prénoms des invités de toutes
-- les parties. Les écritures des deux tables sont réservées au service role.
