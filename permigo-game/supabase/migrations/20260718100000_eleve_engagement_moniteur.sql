-- ════════════════════════════════════════════════════════════════
-- 20260718100000 — Engagement élève « vue vautour » côté moniteur
--
-- Le moniteur veut repérer d'un coup d'œil les élèves DÉTERMINÉS (et ceux qui
-- DÉCROCHENT) : dernière activité, régularité (jours actifs), volume de quiz +
-- tendance, fiches de conduite lues, heure d'activité préférée.
--
-- Ces données existent DÉJÀ en base — pas de nouvelle table :
--   • events_analytics : activité in-app + l'event « revision_conduite_fiche_read »
--     (émis par l'élève à chaque ouverture de fiche) = les fiches lues.
--     ⚠️ events_analytics n'est lisible QUE par le gérant (policy events_select) →
--     il FAUT une RPC SECURITY DEFINER pour que le moniteur y accède.
--   • quiz_attempts / self_validations / streaks : signaux non gatés par le
--     consentement analytique (fiables même si l'élève refuse les cookies).
--
-- Autorisation (alignée sur get_eleve_feedback_feed / get_eleves_bloque_sur_competence) :
--   caller role IN ('enseignant','gerant') ET même auto_ecole_id que l'élève.
--   Identité résolue via current_profile_id() (= profiles.id où auth_id = auth.uid()).
-- ════════════════════════════════════════════════════════════════

-- ── Classement d'engagement (pur, réutilisé fiche + liste pour un vocabulaire unique) ──
-- nouveau  : jamais d'activité repérée
-- decroche : était actif mais silence radio depuis ≥ 10 jours
-- determine: activité récente ET soutenue (≥5 jours actifs/14j, ou ≥6 quiz/7j, ou série ≥5)
-- regulier : actif récemment, rythme normal
create or replace function public.engagement_tier(
  p_days_since int,
  p_active14   int,
  p_quiz7      int,
  p_streak     int
) returns text
language sql
immutable
as $function$
  select case
    when p_days_since is null then 'nouveau'
    when p_days_since >= 10 then 'decroche'
    when coalesce(p_active14, 0) >= 5
      or coalesce(p_quiz7, 0)   >= 6
      or coalesce(p_streak, 0)  >= 5 then 'determine'
    else 'regulier'
  end;
$function$;

revoke execute on function public.engagement_tier(int, int, int, int) from public, anon;
grant  execute on function public.engagement_tier(int, int, int, int) to authenticated;

-- ── Engagement détaillé d'UN élève (pour la fiche livret) ──
create or replace function public.get_eleve_engagement(
  p_eleve_id uuid,
  p_days     int default 30
) returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid           uuid := current_profile_id();
  v_role          text;
  v_school        uuid;
  v_target_school uuid;
  v_target_role   text;
  v_days          int  := greatest(coalesce(p_days, 30), 7);
  -- events_analytics (in-app, gaté consentement)
  v_last_ev       timestamptz;
  v_fiches_read   int;
  v_fiche_last    timestamptz;
  v_optimal_hour  int;
  -- quiz (non gaté)
  v_last_qz       timestamptz;
  v_quiz_7d       int;
  v_quiz_prev_7d  int;
  v_quiz_window   int;
  -- auto-validations solo
  v_self_valid    int;
  v_last_sv       timestamptz;
  -- streak
  v_streak_raw    int;
  v_streak_date   date;
  v_streak_eff    int := 0;
  -- régularité (union events + quiz par jour, robuste sans consentement)
  v_active_days    int;
  v_active_days_14 int;
  -- calcul final
  v_last_activity timestamptz;
  v_days_since    int;
  v_tier          text;
begin
  if v_uid is null then
    return null;
  end if;

  select role, auto_ecole_id into v_role, v_school from profiles where id = v_uid;
  select auto_ecole_id, role into v_target_school, v_target_role from profiles where id = p_eleve_id;

  -- Garde tenant : moniteur/gérant qui consulte un ÉLÈVE de SA propre auto-école.
  -- (role='eleve' obligatoire → un moniteur ne peut pas profiler un collègue.)
  if not (
    v_role in ('enseignant', 'gerant')
    and v_school is not null
    and v_target_school is not distinct from v_school
    and v_target_role = 'eleve'
  ) then
    return null;
  end if;

  -- Activité in-app + fiches de conduite lues (distinct sur le code REMC).
  select
    max(created_at),
    count(distinct (properties ->> 'code'))
      filter (where event_name = 'revision_conduite_fiche_read' and (properties ->> 'code') is not null),
    max(created_at) filter (where event_name = 'revision_conduite_fiche_read')
  into v_last_ev, v_fiches_read, v_fiche_last
  from events_analytics
  where user_id = p_eleve_id;

  -- Heure préférée = mode des heures d'activité (60 j), heure locale FR. NULL si aucune.
  select h into v_optimal_hour
  from (
    select extract(hour from (created_at at time zone 'Europe/Paris'))::int as h, count(*) as c
    from events_analytics
    where user_id = p_eleve_id and created_at >= now() - interval '60 days'
    group by 1
    order by c desc, h asc
    limit 1
  ) q;

  -- Volume de quiz + tendance (7 j vs 7 j précédents).
  select
    max(completed_at),
    count(*) filter (where completed_at >= now() - interval '7 days'),
    count(*) filter (where completed_at >= now() - interval '14 days' and completed_at < now() - interval '7 days'),
    count(*) filter (where completed_at >= now() - (v_days || ' days')::interval)
  into v_last_qz, v_quiz_7d, v_quiz_prev_7d, v_quiz_window
  from quiz_attempts
  where user_id = p_eleve_id;

  -- Auto-validations solo (info d'engagement, pas une stat pédagogique moniteur).
  select count(*), max(validated_at)
  into v_self_valid, v_last_sv
  from self_validations
  where eleve_id = p_eleve_id;

  -- Streak vivant seulement si activité aujourd'hui ou hier (la valeur stockée
  -- ne se reset qu'au prochain login élève — même règle que effectiveStreak côté front).
  select current_streak, last_activity_date into v_streak_raw, v_streak_date
  from streaks where user_id = p_eleve_id;
  v_streak_raw := coalesce(v_streak_raw, 0);
  if v_streak_date is not null and v_streak_date >= current_date - 1 then
    v_streak_eff := v_streak_raw;
  end if;

  -- Jours actifs (distinct) = union des jours events + jours quiz.
  select count(distinct d) into v_active_days from (
    select (created_at at time zone 'Europe/Paris')::date as d
      from events_analytics where user_id = p_eleve_id and created_at >= now() - (v_days || ' days')::interval
    union
    select (completed_at at time zone 'Europe/Paris')::date
      from quiz_attempts where user_id = p_eleve_id and completed_at >= now() - (v_days || ' days')::interval
  ) u;
  select count(distinct d) into v_active_days_14 from (
    select (created_at at time zone 'Europe/Paris')::date as d
      from events_analytics where user_id = p_eleve_id and created_at >= now() - interval '14 days'
    union
    select (completed_at at time zone 'Europe/Paris')::date
      from quiz_attempts where user_id = p_eleve_id and completed_at >= now() - interval '14 days'
  ) u;

  -- Dernière activité = max de TOUS les signaux élève (GREATEST ignore les NULL).
  v_last_activity := greatest(v_last_ev, v_last_qz, v_last_sv, v_streak_date::timestamptz);
  v_days_since := case
    when v_last_activity is null then null
    else floor(extract(epoch from (now() - v_last_activity)) / 86400)::int
  end;

  v_tier := public.engagement_tier(v_days_since, v_active_days_14, v_quiz_7d, v_streak_eff);

  return jsonb_build_object(
    'tier',           v_tier,
    'last_activity',  v_last_activity,
    'days_since',     v_days_since,
    'window_days',    v_days,
    'active_days',    coalesce(v_active_days, 0),
    'active_days_14', coalesce(v_active_days_14, 0),
    'quiz_7d',        coalesce(v_quiz_7d, 0),
    'quiz_prev_7d',   coalesce(v_quiz_prev_7d, 0),
    'quiz_window',    coalesce(v_quiz_window, 0),
    'fiches_read',    coalesce(v_fiches_read, 0),
    'fiche_last',     v_fiche_last,
    'self_valid',     coalesce(v_self_valid, 0),
    'streak',         v_streak_eff,
    'optimal_hour',   v_optimal_hour
  );
end;
$function$;

revoke execute on function public.get_eleve_engagement(uuid, int) from public, anon;
grant  execute on function public.get_eleve_engagement(uuid, int) to authenticated;

-- ── Engagement synthétique de TOUS mes élèves (pour l'étiquette + tri de la liste) ──
create or replace function public.get_eleves_engagement()
returns table(
  eleve_id       uuid,
  tier           text,
  last_activity  timestamptz,
  days_since     int,
  active_days_14 int,
  quiz_7d        int,
  fiches_read    int,
  streak         int
)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid    uuid := current_profile_id();
  v_role   text;
  v_school uuid;
begin
  if v_uid is null then
    return;
  end if;
  select role, auto_ecole_id into v_role, v_school from profiles where id = v_uid;
  if not (v_role in ('enseignant', 'gerant') and v_school is not null) then
    return;
  end if;

  return query
  with elv as (
    select id from profiles where role = 'eleve' and auto_ecole_id = v_school
  ),
  ev as (
    select e.user_id,
      max(e.created_at) as last_ev,
      count(distinct (e.created_at at time zone 'Europe/Paris')::date)
        filter (where e.created_at >= now() - interval '14 days') as ad14_ev,
      count(distinct (e.properties ->> 'code'))
        filter (where e.event_name = 'revision_conduite_fiche_read' and (e.properties ->> 'code') is not null) as fiches
    from events_analytics e
    join elv on elv.id = e.user_id
    group by e.user_id
  ),
  qz as (
    select q.user_id,
      max(q.completed_at) as last_qz,
      count(*) filter (where q.completed_at >= now() - interval '7 days') as quiz7,
      count(distinct (q.completed_at at time zone 'Europe/Paris')::date)
        filter (where q.completed_at >= now() - interval '14 days') as ad14_qz
    from quiz_attempts q
    join elv on elv.id = q.user_id
    group by q.user_id
  ),
  sv as (
    select s.eleve_id as uid, max(s.validated_at) as last_sv
    from self_validations s
    join elv on elv.id = s.eleve_id
    group by s.eleve_id
  ),
  st as (
    select s.user_id, s.current_streak, s.last_activity_date
    from streaks s
    join elv on elv.id = s.user_id
  ),
  base as (
    select
      elv.id as eleve_id,
      greatest(ev.last_ev, qz.last_qz, sv.last_sv, st.last_activity_date::timestamptz) as last_activity,
      -- régularité sur 14 j : approx par le max des deux sources (l'une est
      -- généralement un sur-ensemble de l'autre ; robuste si events vide sans consentement).
      -- ::int explicite : count(...) rend du bigint, or engagement_tier attend des int.
      greatest(coalesce(ev.ad14_ev, 0), coalesce(qz.ad14_qz, 0))::int as active_days_14,
      coalesce(qz.quiz7, 0)::int as quiz_7d,
      coalesce(ev.fiches, 0)::int as fiches_read,
      case
        when st.last_activity_date is not null and st.last_activity_date >= current_date - 1
        then coalesce(st.current_streak, 0) else 0
      end as streak
    from elv
    left join ev on ev.user_id = elv.id
    left join qz on qz.user_id = elv.id
    left join sv on sv.uid = elv.id
    left join st on st.user_id = elv.id
  )
  select
    b.eleve_id,
    public.engagement_tier(
      case when b.last_activity is null then null
           else floor(extract(epoch from (now() - b.last_activity)) / 86400)::int end,
      b.active_days_14, b.quiz_7d, b.streak
    ) as tier,
    b.last_activity,
    case when b.last_activity is null then null
         else floor(extract(epoch from (now() - b.last_activity)) / 86400)::int end as days_since,
    b.active_days_14,
    b.quiz_7d,
    b.fiches_read,
    b.streak
  from base b;
end;
$function$;

revoke execute on function public.get_eleves_engagement() from public, anon;
grant  execute on function public.get_eleves_engagement() to authenticated;
