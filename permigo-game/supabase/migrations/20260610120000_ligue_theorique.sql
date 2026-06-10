-- ═══════════════════════════════════════════════════════════════
-- Ligue théorique : colonnes exam blanc + fix XP + RPC leaderboard
-- 100% additif — aucune donnée modifiée.
-- Appliquée en prod le 2026-06-10 via MCP (apply_migration "ligue_theorique").
-- ═══════════════════════════════════════════════════════════════

-- 1. Colonnes exam blanc (ref_id = n° parcours, passed = verdict CEPC)
ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS ref_id text,
  ADD COLUMN IF NOT EXISTS passed boolean;

-- 2. Fix credit_xp_on_quiz : dédup NULL-safe + cas exam_blanc
--    (avant : competence_id NULL → dédup jamais matchée → re-crédit 50 XP à chaque exam ≥70)
CREATE OR REPLACE FUNCTION public.credit_xp_on_quiz()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_xp_gain int := 0;
BEGIN
  IF NEW.user_id IS NULL OR NEW.score IS NULL THEN RETURN NEW; END IF;

  IF NEW.type = 'exam_blanc' THEN
    -- 80 XP si réussi (verdict CEPC), UNE seule fois par parcours
    IF COALESCE(NEW.passed, false) AND NOT EXISTS (
      SELECT 1 FROM quiz_attempts q
       WHERE q.user_id = NEW.user_id AND q.type = 'exam_blanc'
         AND q.ref_id IS NOT DISTINCT FROM NEW.ref_id
         AND COALESCE(q.passed, false) AND q.id <> NEW.id
    ) THEN
      v_xp_gain := 80;
    END IF;
  ELSIF NEW.score >= 70 THEN
    IF EXISTS (
      SELECT 1 FROM quiz_attempts q
       WHERE q.user_id = NEW.user_id
         AND q.competence_id IS NOT DISTINCT FROM NEW.competence_id
         AND q.type = NEW.type AND q.score >= 70 AND q.id <> NEW.id
    ) THEN RETURN NEW; END IF;
    v_xp_gain := 50;
    IF NEW.type = 'consolidation' THEN v_xp_gain := 30; END IF;
    IF NEW.score >= 100 THEN v_xp_gain := v_xp_gain + 20; END IF;
  END IF;

  IF v_xp_gain > 0 THEN
    UPDATE public.profiles SET xp = COALESCE(xp,0) + v_xp_gain
     WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. RPC leaderboard théorique (calquée sur get_eleve_leaderboard)
-- Score = nb compétences distinctes avec quiz réussi (≥70) + 4 × nb parcours exam blanc distincts réussis
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
REVOKE ALL ON FUNCTION public.get_theory_leaderboard(text,int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_theory_leaderboard(text,int) TO authenticated;
