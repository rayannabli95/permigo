-- ═══════════════════════════════════════════════════════════════
-- Duel entre amis : le score passe du NOMBRE DE BONNES RÉPONSES à des
-- POINTS DE VITESSE (décision Rayan 03/08, « comme Kahoot »).
--
-- Chaque question dure 20 secondes. Une bonne réponse rapporte entre 500 et
-- 1000 points selon la vitesse ; une mauvaise ou un temps écoulé rapporte 0.
-- Maximum théorique sur 10 questions : 10 000.
--
-- L'ancienne contrainte plafonnait le score à 20 (le nombre de questions).
-- Elle aurait rejeté chaque partie. On garde un plafond, mais côté points.
-- ═══════════════════════════════════════════════════════════════

alter table public.duel_players
  drop constraint if exists duel_players_score_range;

alter table public.duel_players
  add constraint duel_players_score_range
  check (score is null or score between 0 and 20000);

-- Le nombre de bonnes réponses reste affiché à côté des points : « 8 sur 10 »
-- se comprend tout de suite, « 7 240 points » ne dit pas si on a bien joué.
alter table public.duel_players
  add column if not exists correct_count int;

alter table public.duel_players
  drop constraint if exists duel_players_correct_range;

alter table public.duel_players
  add constraint duel_players_correct_range
  check (correct_count is null or correct_count between 0 and 20);

comment on column public.duel_players.score is
  'Points de vitesse cumulés (500 à 1000 par bonne réponse selon le temps restant). PAS un nombre de bonnes réponses.';
comment on column public.duel_players.correct_count is
  'Nombre de bonnes réponses sur les 10 questions. Sert à l''affichage, jamais au classement.';
