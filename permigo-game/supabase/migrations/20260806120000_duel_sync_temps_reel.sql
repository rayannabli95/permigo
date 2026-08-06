-- ═══════════════════════════════════════════════════════════════
-- Duel entre amis : passage à un jeu VRAIMENT synchronisé (demande Rayan
-- 06/08, « chaque question synchro entre les deux téléphones »).
--
-- Avant cette migration, chaque joueur jouait sa copie des 10 questions à
-- son rythme, avec son propre chrono local : deux amis dans la même pièce
-- ne voyaient jamais la même question en même temps. Le classement final
-- était juste un tri de scores envoyés indépendamment par chaque client.
--
-- À partir d'ici, la partie a un ÉTAT DE MANCHE unique en base
-- (`duels.status` / `current_index` / `round_deadline`), posé par l'edge
-- function côté serveur et diffusé à tous les téléphones via Supabase
-- Realtime Broadcast (canal `duel:<code>`, voir supabase/functions/duel).
-- Le score de chaque bonne réponse est calculé PAR LE SERVEUR à partir de
-- SON horloge à lui (temps restant avant `round_deadline`), pas de celle du
-- client : deux téléphones avec une horloge légèrement fausse ne peuvent
-- plus se battre un avantage de vitesse en trichant sur l'heure envoyée.
--
-- Le score passe de « points de vitesse jusqu'à 1000 » à un score SUR 10
-- par question (demande explicite : « on met ça sur 10 points en terme de
-- rapidité »). Une bonne réponse rapporte de 1 (au buzzer) à 10 (instantané)
-- point. Maximum théorique sur 10 questions : 100.
-- ═══════════════════════════════════════════════════════════════

alter table public.duels
  add column if not exists status text not null default 'lobby',
  add column if not exists current_index int not null default 0,
  add column if not exists round_deadline timestamptz,
  add column if not exists reveal_until timestamptz,
  add column if not exists intermission_shown boolean not null default false;

alter table public.duels
  drop constraint if exists duels_status_check;
alter table public.duels
  add constraint duels_status_check
  check (status in ('lobby', 'playing', 'reveal', 'intermission', 'finished'));

comment on column public.duels.status is
  'État de la manche en cours, source de vérité pour TOUS les téléphones. lobby = pas encore lancée, playing = question current_index affichée, reveal = les deux joueurs ont répondu ou le temps est écoulé, intermission = pause de la mi-temps, finished = partie jouée.';
comment on column public.duels.current_index is
  'Index (0 à 9) de la question affichée ou sur le point de l''être.';
comment on column public.duels.round_deadline is
  'Horodatage serveur auquel la question current_index se ferme. Tous les téléphones calent leur chrono dessus, pas sur une durée locale.';
comment on column public.duels.reveal_until is
  'Horodatage serveur de fin de l''écran de reveal ou de l''entracte en cours (status = reveal ou intermission).';
comment on column public.duels.intermission_shown is
  'Vrai une fois la pause de mi-temps jouée : une reprise de partie ne la rejoue pas deux fois.';

-- La partie ferme ses portes dès qu'elle a démarré : un ami qui clique sur un
-- vieux lien pendant que la manche tourne ne peut plus rejoindre une question
-- déjà entamée en synchro. `join`, côté edge function, refuse si status != lobby.
create index if not exists duels_status_idx on public.duels (status);

-- ── La réponse de chaque joueur, manche par manche ────────────────────────
-- Nécessaire pour DEUX choses que le score cumulé de duel_players ne donne
-- pas : (1) savoir QUAND tout le monde a répondu à la question en cours,
-- pour déclencher le reveal sans dépendre d'un cron, et (2) afficher au
-- reveal ce que CHAQUE joueur a choisi, pas seulement s'il a eu juste.
create table if not exists public.duel_answers (
  id uuid primary key default gen_random_uuid(),
  duel_id uuid not null references public.duels (id) on delete cascade,
  player_id uuid not null references public.duel_players (id) on delete cascade,
  q_index int not null,
  choice int not null,
  correct boolean not null,
  points int not null default 0,
  answered_at timestamptz not null default now(),
  constraint duel_answers_q_index_range check (q_index between 0 and 19),
  constraint duel_answers_points_range check (points between 0 and 10),
  unique (duel_id, player_id, q_index)
);

comment on table public.duel_answers is
  'Une ligne par joueur par question. `choice = -1` veut dire « temps écoulé, pas répondu ». Sert à détecter que tout le monde a joué la manche en cours et à construire l''écran de reveal.';

create index if not exists duel_answers_round_idx
  on public.duel_answers (duel_id, q_index);

alter table public.duel_answers enable row level security;

-- ⚠️ AUCUNE policy, et c'est volontaire (même choix que duel_players) : un
-- invité n'a pas de session, donc aucune policy RLS ne peut l'autoriser.
-- Les écritures passent PAR l'edge function (service role). La lecture en
-- direct par les téléphones passe par Supabase Realtime Broadcast (canal
-- éphémère `duel:<code>`, pas une lecture de table), qui ne dépend pas de
-- ces policies.

-- Le score passe de « points de vitesse » (0 à 1000 par question) à un score
-- SUR 10 par question. L'ancien plafond à 20 000 n'a plus de sens.
alter table public.duel_players
  drop constraint if exists duel_players_score_range;
alter table public.duel_players
  add constraint duel_players_score_range
  check (score is null or score between 0 and 200);

comment on column public.duel_players.score is
  'Somme des points de manche (1 à 10 par bonne réponse selon la vitesse, 0 sinon). PAS un nombre de bonnes réponses. Recalculé par le serveur à chaque réponse, jamais envoyé par le client.';

-- ── Incrément atomique du score ────────────────────────────────────────
-- Deux amis qui répondent à la même seconde déclenchent deux requêtes
-- concurrentes sur la MÊME ligne duel_players. Un `select` suivi d'un
-- `update` côté edge function perdrait l'un des deux incréments (race
-- condition classique lecture-modification-écriture). `score = score + …`
-- dans un UPDATE unique est atomique au niveau de Postgres : aucun incrément
-- n'est perdu, quel que soit l'ordre d'arrivée des deux requêtes.
create or replace function public.increment_duel_score(
  p_player_id uuid,
  p_points int,
  p_correct int
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.duel_players
  set score = coalesce(score, 0) + p_points,
      correct_count = coalesce(correct_count, 0) + p_correct
  where id = p_player_id;
$$;

comment on function public.increment_duel_score is
  'Incrément atomique du score d''un joueur de duel, appelé par l''edge function `duel` (service role uniquement) à chaque réponse.';
