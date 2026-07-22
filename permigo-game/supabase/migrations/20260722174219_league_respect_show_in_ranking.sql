-- ═══════════════════════════════════════════════════════════════
-- 20260722174219 — Ligue élève : RESPECT du consentement « Classement
-- national » (profiles.show_in_ranking) + score REMC = validations moniteur
-- ∪ auto-validations élève.
--
-- ── LE PROBLÈME (confirmé en prod) ────────────────────────────────
-- Les 4 RPC de classement élève sont SECURITY DEFINER : elles BYPASSENT
-- la RLS de `profiles` (dont la policy profiles_select masque déjà, entre
-- élèves, les profils avec show_in_ranking = false). Résultat : au scope
-- 'national', elles diffusaient le pseudo (souvent le prénom réel via
-- genUsername) + l'avatar de TOUS les élèves — y compris ceux qui n'ont
-- JAMAIS activé le toggle « Classement national » des Réglages
-- (profiles.show_in_ranking, DEFAULT false) — à n'importe quel élève
-- authentifié. Consentement RGPD ignoré.
--
-- ── LE CORRECTIF (100 % additif — recrée 4 fonctions, AUCUNE donnée
--    modifiée, AUCUNE signature ni structure de retour changée) ────
-- A. Scope 'ecole' : INCHANGÉ. Les élèves d'une même auto-école continuent
--    de se voir entre eux avec leurs vrais pseudos (exigence produit).
-- B. Scope 'national' (get_eleve_leaderboard, get_theory_leaderboard,
--    get_theory_leaderboard_weekly) : les profils dont
--    show_in_ranking IS DISTINCT FROM true sont MASQUÉS — pas retirés :
--    les RANGS restent réels (personne ne « remonte » d'un cran). Le
--    pseudo devient « Apprenti #XXXX » (déterministe, md5(id)), l'avatar
--    devient NULL. EXCEPTION : la ligne de l'appelant reste EN CLAIR pour
--    lui-même (il voit toujours SON rang et SON nom).
-- C. get_hall_of_fame scope 'national' : mêmes règles — un lauréat
--    non-consentant apparaît « Apprenti #XXXX », avatar NULL (avant : son
--    prénom réel du formulaire).
-- D. get_eleve_leaderboard : le score REMC ne comptait QUE les validations
--    moniteur (statut 'acquis'). Depuis le pivot du 17/07, l'élève solo
--    certifie lui-même (table self_validations). On compte désormais
--    l'UNION des deux (compétences DISTINCTES ; une compétence présente
--    dans les deux tables ne compte qu'une fois) — dans les DEUX scopes.
--    La contrainte UNIQUE(eleve_id, competence_id) de `validations`
--    garantit que ce changement N'ALTÈRE PAS le score des élèves déjà
--    validés par un moniteur (1 ligne 'acquis' = 1 compétence).
--
-- Modèle propre déjà en place = get_league_leaderboard (ligue enseignant,
-- 20260709100000_league_leaderboard_scope_national.sql) : ce fichier
-- applique la même logique de masquage (show_in_ranking) aux 4 RPC élève.
--
-- ⚠️ NE TOUCHE PAS le front : structure de retour identique. Le front lit
-- {rang, display_name, score, is_me, avatar} (classement.js, arene-rank.js)
-- et {prenom, avatar, recu_at, is_me} (Hall of Fame) ; renderUserAvatar
-- gère déjà avatar NULL → repli sur les initiales.
--
-- Null-safety : la comparaison « est-ce ma ligne ? » utilise
-- IS DISTINCT FROM (et non `<>`) — si l'appelant n'a pas de profil
-- (current_profile_id() = NULL), TOUTES les lignes nationales sont
-- masquées (fail-closed) au lieu de fuiter via un `id <> NULL` = NULL.
-- ═══════════════════════════════════════════════════════════════

-- 1. Ligue CONDUITE (REMC) ────────────────────────────────────────
--    Score = validations moniteur ('acquis') ∪ auto-validations élève.
--    Masquage national des non-consentants (sauf l'appelant).
--    Recrée public.get_eleve_leaderboard
--    (source : 20260616010000_eleve_leaderboard_hall_of_fame.sql).
create or replace function public.get_eleve_leaderboard(
  p_scope text default 'ecole', p_limit integer default 50
)
returns table(rang integer, display_name text, score integer, is_me boolean, avatar text)
language sql stable security definer set search_path to 'public'
as $function$
  with me as (
    select current_profile_id() as uid,
           (select auto_ecole_id from profiles where id = current_profile_id()) as aid
  ),
  -- Score REMC = nb de compétences DISTINCTES certifiées, qu'elles viennent
  -- du moniteur (validations 'acquis') OU de l'élève lui-même
  -- (self_validations). UNION → une compétence présente dans les deux
  -- tables ne compte qu'une seule fois.
  remc as (
    select u.eleve_id, count(distinct u.competence_id)::int as score
    from (
      select v.eleve_id, v.competence_id
        from validations v
       where v.statut = 'acquis'
      union
      select sv.eleve_id, sv.competence_id
        from self_validations sv
    ) u
    group by u.eleve_id
  ),
  base as (
    select
      p.id,
      coalesce(nullif(p.username, ''),
               'Apprenti #' || substring(replace(p.id::text, '-', ''), 1, 4)) as display_name,
      p.avatar_url as avatar,
      p.show_in_ranking as sir,
      coalesce(r.score, 0)::int as score
    from profiles p
    left join remc r on r.eleve_id = p.id
    where p.role = 'eleve'
      -- 🎓 on retire les lauréats (permis obtenu) du classement actif
      and not exists (
        select 1 from examens e where e.eleve_id = p.id and e.statut = 'recu'
      )
      and (
        (p_scope = 'ecole'    and p.auto_ecole_id = (select aid from me))
        or (p_scope = 'national')
      )
  ),
  ranked as (
    select row_number() over (order by score desc, id) as rang, * from base
  )
  select
    rang::int,
    case
      when p_scope = 'national'
       and id  is distinct from (select uid from me)
       and sir is distinct from true
        then 'Apprenti #' || upper(substr(md5(id::text), 1, 4))
      else display_name
    end as display_name,
    score,
    (id = (select uid from me)) as is_me,
    case
      when p_scope = 'national'
       and id  is distinct from (select uid from me)
       and sir is distinct from true
        then null
      else avatar
    end as avatar
  from ranked
  where rang <= p_limit
     or id = (select uid from me)
  order by rang;
$function$;

revoke all  on function public.get_eleve_leaderboard(text, integer) from public, anon;
grant execute on function public.get_eleve_leaderboard(text, integer) to authenticated;

-- 2. Hall of Fame (lauréats du permis) ────────────────────────────
--    Masquage national des non-consentants (sauf l'appelant).
--    Recrée public.get_hall_of_fame
--    (source : 20260616010000_eleve_leaderboard_hall_of_fame.sql).
create or replace function public.get_hall_of_fame(
  p_scope text default 'ecole', p_limit integer default 100
)
returns table(prenom text, avatar text, recu_at timestamptz, is_me boolean)
language sql stable security definer set search_path to 'public'
as $function$
  with me as (
    select current_profile_id() as uid,
           (select auto_ecole_id from profiles where id = current_profile_id()) as aid
  )
  select
    case
      when p_scope = 'national'
       and p.id is distinct from (select uid from me)
       and p.show_in_ranking is distinct from true
        then 'Apprenti #' || upper(substr(md5(p.id::text), 1, 4))
      else coalesce(nullif(p.prenom, ''), 'Lauréat')
    end as prenom,
    case
      when p_scope = 'national'
       and p.id is distinct from (select uid from me)
       and p.show_in_ranking is distinct from true
        then null
      else p.avatar_url
    end as avatar,
    max(e.created_at) as recu_at,
    (p.id = (select uid from me)) as is_me
  from profiles p
  join examens e on e.eleve_id = p.id and e.statut = 'recu'
  where p.role = 'eleve'
    and (
      (p_scope = 'ecole'    and p.auto_ecole_id = (select aid from me))
      or (p_scope = 'national')
    )
  group by p.id, p.prenom, p.avatar_url, p.show_in_ranking
  order by recu_at desc nulls last
  limit p_limit;
$function$;

revoke all  on function public.get_hall_of_fame(text, integer) from public, anon;
grant execute on function public.get_hall_of_fame(text, integer) to authenticated;

-- 3. Ligue RÉVISION à vie (paliers de progression) ────────────────
--    Score inchangé ; masquage national des non-consentants.
--    Recrée public.get_theory_leaderboard
--    (source : 20260610120000_ligue_theorique.sql).
CREATE OR REPLACE FUNCTION public.get_theory_leaderboard(
  p_scope text DEFAULT 'ecole', p_limit int DEFAULT 50
)
RETURNS TABLE (rang int, display_name text, score int,
               n_comp int, n_exams int, is_me boolean, avatar text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT current_profile_id() AS uid,
           (SELECT auto_ecole_id FROM profiles
             WHERE id = current_profile_id()) AS aid
  ),
  theory AS (
    SELECT qa.user_id,
      COUNT(DISTINCT qa.competence_id) FILTER (
        WHERE qa.type IN ('post_validation','consolidation','review')
          AND qa.score >= 70 AND qa.competence_id IS NOT NULL)::int AS n_comp,
      COUNT(DISTINCT qa.ref_id) FILTER (
        WHERE qa.type = 'exam_blanc' AND COALESCE(qa.passed,false))::int AS n_exams
    FROM quiz_attempts qa
    GROUP BY qa.user_id
  ),
  base AS (
    SELECT p.id,
      COALESCE(NULLIF(p.username,''),
               'Apprenti #' || substring(replace(p.id::text,'-',''),1,4)) AS display_name,
      p.avatar_url AS avatar,
      p.show_in_ranking AS sir,
      COALESCE(t.n_comp,0) AS n_comp, COALESCE(t.n_exams,0) AS n_exams,
      COALESCE(t.n_comp,0) + COALESCE(t.n_exams,0)*4 AS score
    FROM profiles p
    LEFT JOIN theory t ON t.user_id = p.id
    WHERE p.role = 'eleve'
      AND ((p_scope='ecole' AND p.auto_ecole_id = (SELECT aid FROM me))
           OR p_scope='national')
  ),
  ranked AS (SELECT row_number() OVER (ORDER BY score DESC, id) AS rang, * FROM base)
  SELECT rang::int,
    CASE
      WHEN p_scope = 'national'
       AND id  IS DISTINCT FROM (SELECT uid FROM me)
       AND sir IS DISTINCT FROM true
        THEN 'Apprenti #' || upper(substr(md5(id::text),1,4))
      ELSE display_name
    END AS display_name,
    score::int, n_comp, n_exams,
    (id = (SELECT uid FROM me)) AS is_me,
    CASE
      WHEN p_scope = 'national'
       AND id  IS DISTINCT FROM (SELECT uid FROM me)
       AND sir IS DISTINCT FROM true
        THEN NULL
      ELSE avatar
    END AS avatar
  FROM ranked
  WHERE rang <= p_limit OR id = (SELECT uid FROM me)
  ORDER BY rang;
$$;
REVOKE ALL  ON FUNCTION public.get_theory_leaderboard(text,int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_theory_leaderboard(text,int) TO authenticated;

-- 4. Ligue RÉVISION hebdo (saison, reset lundi) ───────────────────
--    Score inchangé ; masquage national des non-consentants.
--    Recrée public.get_theory_leaderboard_weekly
--    (source : 20260705120000_ligue_revision_hebdo.sql).
CREATE OR REPLACE FUNCTION public.get_theory_leaderboard_weekly(
  p_scope text DEFAULT 'ecole', p_limit int DEFAULT 50
)
RETURNS TABLE (rang int, display_name text, score int,
               n_comp int, n_exams int, is_me boolean, avatar text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT current_profile_id() AS uid,
           (SELECT auto_ecole_id FROM profiles
             WHERE id = current_profile_id()) AS aid
  ),
  wk AS (
    -- Début de la semaine ISO (lundi 00:00) en heure de Paris, ramené en
    -- timestamptz pour comparer à completed_at.
    SELECT (date_trunc('week', now() AT TIME ZONE 'Europe/Paris')
              AT TIME ZONE 'Europe/Paris') AS start_ts
  ),
  theory AS (
    SELECT qa.user_id,
      COUNT(DISTINCT qa.competence_id) FILTER (
        WHERE qa.type IN ('post_validation','consolidation','review')
          AND qa.score >= 70 AND qa.competence_id IS NOT NULL)::int AS n_comp,
      COUNT(DISTINCT qa.ref_id) FILTER (
        WHERE qa.type = 'exam_blanc' AND COALESCE(qa.passed,false))::int AS n_exams
    FROM quiz_attempts qa, wk
    WHERE qa.completed_at >= wk.start_ts
    GROUP BY qa.user_id
  ),
  base AS (
    SELECT p.id,
      COALESCE(NULLIF(p.username,''),
               'Apprenti #' || substring(replace(p.id::text,'-',''),1,4)) AS display_name,
      p.avatar_url AS avatar,
      p.show_in_ranking AS sir,
      COALESCE(t.n_comp,0) AS n_comp, COALESCE(t.n_exams,0) AS n_exams,
      COALESCE(t.n_comp,0) + COALESCE(t.n_exams,0)*4 AS score
    FROM profiles p
    LEFT JOIN theory t ON t.user_id = p.id
    WHERE p.role = 'eleve'
      AND ((p_scope='ecole' AND p.auto_ecole_id = (SELECT aid FROM me))
           OR p_scope='national')
  ),
  ranked AS (SELECT row_number() OVER (ORDER BY score DESC, id) AS rang, * FROM base)
  SELECT rang::int,
    CASE
      WHEN p_scope = 'national'
       AND id  IS DISTINCT FROM (SELECT uid FROM me)
       AND sir IS DISTINCT FROM true
        THEN 'Apprenti #' || upper(substr(md5(id::text),1,4))
      ELSE display_name
    END AS display_name,
    score::int, n_comp, n_exams,
    (id = (SELECT uid FROM me)) AS is_me,
    CASE
      WHEN p_scope = 'national'
       AND id  IS DISTINCT FROM (SELECT uid FROM me)
       AND sir IS DISTINCT FROM true
        THEN NULL
      ELSE avatar
    END AS avatar
  FROM ranked
  WHERE rang <= p_limit OR id = (SELECT uid FROM me)
  ORDER BY rang;
$$;
REVOKE ALL  ON FUNCTION public.get_theory_leaderboard_weekly(text,int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_theory_leaderboard_weekly(text,int) TO authenticated;
