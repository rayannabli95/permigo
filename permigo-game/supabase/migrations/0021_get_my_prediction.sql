-- ════════════════════════════════════════════════════════════════
-- 0021 — Crystal Ball : prédiction de réussite au permis
-- Calcul pondéré sur les données de l'élève (aucune donnée externe).
-- Pas de table : RPC de lecture uniquement.
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_my_prediction()
RETURNS TABLE (
  prediction_pct    int,
  validated_count   int,
  avg_quiz_score    numeric,
  longest_streak    int,
  velocity_per_week numeric,
  axes_to_improve   text[]
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_me        uuid := current_profile_id();
  v_validated int;
  v_avg_quiz  numeric;
  v_streak    int;
  v_last28    int;
  v_velocity  numeric;
  v_vsignal   numeric;
  v_pred      int;
  v_axes      text[];
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  -- Couverture : compétences acquises
  SELECT COUNT(*) INTO v_validated
  FROM validations WHERE eleve_id = v_me AND statut = 'acquis';

  -- Maîtrise : moyenne des scores (0-100) sur les 30 derniers quiz
  SELECT COALESCE(AVG(score), 0) INTO v_avg_quiz FROM (
    SELECT score FROM quiz_attempts
     WHERE user_id = v_me AND score IS NOT NULL
     ORDER BY completed_at DESC LIMIT 30
  ) q;

  -- Régularité : plus longue série
  SELECT COALESCE(longest_streak, 0) INTO v_streak FROM streaks WHERE user_id = v_me;

  -- Vélocité : compétences acquises sur les 28 derniers jours
  SELECT COUNT(*) INTO v_last28
  FROM validations
  WHERE eleve_id = v_me AND statut = 'acquis'
    AND validated_at > now() - interval '28 days';

  v_velocity := round(v_last28 / 4.0, 1);          -- par semaine (affichage)
  v_vsignal  := LEAST(1, v_last28::numeric / 7);   -- signal (>=7 en 28j = max)

  v_pred := GREATEST(5, LEAST(99, ROUND(100 * (
      0.40 * (v_validated::numeric / 31)
    + 0.30 * (v_avg_quiz / 100)
    + 0.15 * (LEAST(v_streak, 30)::numeric / 30)
    + 0.15 * v_vsignal
  ))));

  -- Axes : 3 catégories REMC (C1..C4) avec le plus faible taux d'acquisition
  SELECT array_agg(cat ORDER BY ratio ASC, cat ASC) INTO v_axes
  FROM (
    SELECT cat, ratio FROM (
      SELECT t.cat,
             COUNT(*) FILTER (WHERE t.acquis)::numeric / NULLIF(COUNT(*), 0) AS ratio
      FROM (
        SELECT left(qc.competence_id, 2) AS cat,
               qc.competence_id,
               EXISTS (
                 SELECT 1 FROM validations v
                 WHERE v.eleve_id = v_me AND v.statut = 'acquis'
                   AND v.competence_id = qc.competence_id
               ) AS acquis
        FROM (SELECT DISTINCT competence_id FROM questions_competence) qc
      ) t
      GROUP BY t.cat
    ) g
    ORDER BY ratio ASC, cat ASC
    LIMIT 3
  ) top3;

  RETURN QUERY SELECT v_pred, v_validated, v_avg_quiz, v_streak, v_velocity, v_axes;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_prediction() TO authenticated;
