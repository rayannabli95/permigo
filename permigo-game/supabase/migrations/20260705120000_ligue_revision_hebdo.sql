-- ═══════════════════════════════════════════════════════════════
-- Ligue RÉVISION — SAISON HEBDO (reset chaque lundi)
-- ---------------------------------------------------------------
-- Variante hebdomadaire de get_theory_leaderboard : ne compte que les
-- points marqués depuis lundi 00:00 (Europe/Paris). Le classement
-- « repart de zéro » chaque semaine → donne du sens au compte à rebours
-- du héros d'accueil (msToNextMonday / fmtCountdown, league-shared.js).
--
-- 100 % ADDITIF : get_theory_leaderboard (à vie) reste inchangée — elle
-- alimente toujours les PALIERS de progression Novice → Maîtrisée
-- (theory-league.js), qui, eux, restent cumulés à vie.
--
-- La ligue CONDUITE (REMC / get_eleve_leaderboard) n'est PAS touchée :
-- elle reste un classement cumulé à vie (dépend des validations moniteur).
--
-- Barème identique à la version à vie : +1 pt / compétence distincte avec
-- quiz réussi (≥70 %) cette semaine, +4 pts / parcours d'examen blanc
-- distinct réussi (verdict CEPC) cette semaine.
-- ⚠️ quiz_attempts n'a pas created_at → fenêtre sur completed_at.
-- ═══════════════════════════════════════════════════════════════

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
      COALESCE(t.n_comp,0) AS n_comp, COALESCE(t.n_exams,0) AS n_exams,
      COALESCE(t.n_comp,0) + COALESCE(t.n_exams,0)*4 AS score
    FROM profiles p
    LEFT JOIN theory t ON t.user_id = p.id
    WHERE p.role = 'eleve'
      AND ((p_scope='ecole' AND p.auto_ecole_id = (SELECT aid FROM me))
           OR p_scope='national')
  ),
  ranked AS (SELECT row_number() OVER (ORDER BY score DESC, id) AS rang, * FROM base)
  SELECT rang::int, display_name, score::int, n_comp, n_exams,
         (id = (SELECT uid FROM me)) AS is_me, avatar
  FROM ranked
  WHERE rang <= p_limit OR id = (SELECT uid FROM me)
  ORDER BY rang;
$$;

REVOKE ALL ON FUNCTION public.get_theory_leaderboard_weekly(text,int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_theory_leaderboard_weekly(text,int) TO authenticated;
