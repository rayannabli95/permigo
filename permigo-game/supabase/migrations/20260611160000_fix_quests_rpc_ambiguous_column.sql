-- ═══════════════════════════════════════════════════════════════
-- Fix 42702 : « column reference ... is ambiguous » dans les RPC de quêtes.
--
-- get_today_quests() et get_revision_recommendations() déclarent des colonnes
-- de sortie (RETURNS TABLE) qui portent le même nom que des colonnes de table
-- (quest_id, competence_id…). Dans le corps, des références NON qualifiées
-- (ON CONFLICT (..., quest_id) ; SELECT DISTINCT ON (competence_id)) deviennent
-- ambiguës entre la variable PL/pgSQL OUT et la colonne → erreur 42702.
-- Résultat en prod : les deux RPC plantent → aucune quête distribuée, aucune
-- reco de révision affichée.
--
-- Le ON CONFLICT ne peut PAS être qualifié (les colonnes d'inférence doivent
-- être des noms nus de la table cible) → on utilise la directive Postgres
-- idiomatique `#variable_conflict use_column`, qui fait résoudre tout nom nu
-- en colonne. Aucune des deux fonctions ne lit ses colonnes OUT comme variable,
-- donc c'est sûr.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_today_quests()
 RETURNS TABLE(quest_id text, title text, target integer, progress integer, completed boolean, claimed boolean, reward_xp integer, reward_gemmes integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_user_id   uuid := current_profile_id();
  v_existing  int;
  v_today     date := CURRENT_DATE;
  v_last      date;
  v_cur       int;
  v_new       int;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT COUNT(*) INTO v_existing
    FROM daily_quests_progress
   WHERE user_id = v_user_id AND quest_date = v_today;

  IF v_existing < 3 THEN
    -- Série : montée quotidienne (premier login du jour)
    SELECT current_streak, last_activity_date INTO v_cur, v_last
      FROM streaks WHERE user_id = v_user_id;

    IF v_last IS NULL THEN
      v_new := 1;
    ELSIF v_last = v_today THEN
      v_new := GREATEST(COALESCE(v_cur, 1), 1);
    ELSIF v_last = v_today - 1 THEN
      v_new := COALESCE(v_cur, 0) + 1;
    ELSE
      v_new := 1;
    END IF;

    INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_user_id, v_new, v_new, v_today)
    ON CONFLICT (user_id) DO UPDATE
      SET current_streak     = v_new,
          longest_streak     = GREATEST(streaks.longest_streak, v_new),
          last_activity_date = v_today;

    INSERT INTO daily_quests_progress (user_id, quest_date, quest_id, target, reward_xp, reward_gemmes)
    VALUES
      (v_user_id, v_today, 'quest_login',      1, 10, 5),
      (v_user_id, v_today, 'quest_validate_1', 1, 50, 20),
      (v_user_id, v_today, 'quest_quiz_1',     1, 30, 15)
    ON CONFLICT (user_id, quest_date, quest_id) DO NOTHING;

    UPDATE daily_quests_progress
       SET progress = 1, completed_at = COALESCE(completed_at, now())
     WHERE user_id = v_user_id
       AND quest_date = v_today
       AND quest_id = 'quest_login';
  END IF;

  RETURN QUERY
  SELECT
    dq.quest_id,
    CASE dq.quest_id
      WHEN 'quest_login'       THEN 'Se connecter aujourd''hui'
      WHEN 'quest_validate_1'  THEN 'Valider 1 compétence'
      WHEN 'quest_quiz_1'      THEN 'Réussir 1 quiz (≥70%)'
      WHEN 'quest_quiz_3'      THEN 'Réussir 3 quiz'
      WHEN 'quest_streak_keep' THEN 'Maintenir ta série'
      WHEN 'quest_quiz_perfect' THEN 'Faire 1 quiz parfait (100%)'
      ELSE dq.quest_id
    END AS title,
    dq.target,
    dq.progress,
    (dq.completed_at IS NOT NULL) AS completed,
    (dq.claimed_at IS NOT NULL) AS claimed,
    dq.reward_xp,
    dq.reward_gemmes
  FROM daily_quests_progress dq
  WHERE dq.user_id = v_user_id AND dq.quest_date = v_today
  ORDER BY
    CASE dq.quest_id
      WHEN 'quest_login' THEN 1
      WHEN 'quest_validate_1' THEN 2
      WHEN 'quest_quiz_1' THEN 3
      ELSE 4
    END;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_revision_recommendations(p_eleve_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 5)
 RETURNS TABLE(competence_id text, competence_nom text, monde integer, reason text, priority_score numeric, validated_at timestamp with time zone, last_fail_at timestamp with time zone, n_fails integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_user_id uuid := current_profile_id();
  v_target  uuid := COALESCE(p_eleve_id, v_user_id);
  v_user_role text;
  v_user_school uuid;
  v_target_school uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Sécu : élève voit ses recommandations, moniteur/gérant voient celles d'un élève de leur école
  SELECT role, auto_ecole_id INTO v_user_role, v_user_school FROM profiles WHERE id = v_user_id;
  SELECT auto_ecole_id INTO v_target_school FROM profiles WHERE id = v_target;

  IF v_user_id <> v_target
     AND NOT (v_user_role IN ('enseignant','gerant') AND v_user_school = v_target_school) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  WITH validated AS (
    SELECT v.competence_id, v.validated_at
    FROM validations v
    WHERE v.eleve_id = v_target AND v.statut = 'acquis'
  ),
  recent_quiz AS (
    SELECT
      q.competence_id,
      COUNT(*) FILTER (WHERE q.score < 70)::int AS n_fails,
      MAX(q.completed_at) FILTER (WHERE q.score < 70) AS last_fail_at,
      AVG(q.score) AS avg_score
    FROM quiz_attempts q
    WHERE q.user_id = v_target
      AND q.completed_at >= now() - INTERVAL '30 days'
      AND q.score IS NOT NULL
    GROUP BY q.competence_id
  ),
  candidates AS (
    -- Cas 1 : compétences avec quiz fails récents (priorité forte)
    SELECT
      c.id::text AS competence_id,
      c.nom::text AS competence_nom,
      c.monde::int,
      'quiz_fails'::text AS reason,
      ROUND(COALESCE(r.n_fails, 0)::numeric * 30, 1) AS priority_score,
      v.validated_at,
      r.last_fail_at,
      COALESCE(r.n_fails, 0)::int AS n_fails
    FROM competences_remc c
    JOIN validated v ON v.competence_id = c.id
    JOIN recent_quiz r ON r.competence_id = c.id
    WHERE r.n_fails >= 1

    UNION ALL

    -- Cas 2 : validations vieilles (>14j) sans quiz récent (mémoire dégradée)
    SELECT
      c.id::text, c.nom::text, c.monde::int,
      'old_validation'::text,
      ROUND(EXTRACT(EPOCH FROM (now() - v.validated_at)) / 86400 * 0.8, 1),
      v.validated_at,
      NULL::timestamptz,
      0
    FROM competences_remc c
    JOIN validated v ON v.competence_id = c.id
    LEFT JOIN recent_quiz r ON r.competence_id = c.id
    WHERE v.validated_at < now() - INTERVAL '14 days'
      AND r.competence_id IS NULL

    UNION ALL

    -- Cas 3 : validations qui ont une consolidation due (priorité critique)
    SELECT
      c.id::text, c.nom::text, c.monde::int,
      'consolidation_due'::text,
      100.0::numeric,
      v.validated_at,
      NULL::timestamptz,
      0
    FROM competences_remc c
    JOIN validations v ON v.competence_id = c.id
    WHERE v.eleve_id = v_target
      AND v.statut = 'acquis'
      AND v.consolidation_due_at IS NOT NULL
      AND v.consolidation_due_at < now()
      AND v.consolidation_done_at IS NULL
  )
  SELECT DISTINCT ON (candidates.competence_id)
    candidates.competence_id, candidates.competence_nom, candidates.monde, candidates.reason,
    candidates.priority_score, candidates.validated_at, candidates.last_fail_at, candidates.n_fails
  FROM candidates
  ORDER BY candidates.competence_id, candidates.priority_score DESC
  LIMIT p_limit;
END;
$function$;
