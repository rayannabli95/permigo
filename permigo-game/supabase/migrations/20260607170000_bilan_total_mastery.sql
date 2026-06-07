-- ═══════════════════════════════════════════════════════════════
-- get_bilan_data — KPI compétences = TOTAL acquis /31 (à vie)
--
-- Avant : "X/31" comptait les compétences acquises CE TRIMESTRE
-- (COUNT(*) sans DISTINCT) → trompeur pour un élève multi-trimestres
-- et risque de >31 si re-validation.
--
-- Décisions :
--   • KPI compétences = total acquis à vie, COUNT(DISTINCT) → /31 fiable.
--   • Badge « + N ce trimestre » conservé comme dynamique (acquises_trimestre).
--   • Quiz « réussi » = score >= 70 (aligné readiness/examen, avant 60).
--   • by_monde + évolution dédupliqués (DISTINCT competence_id).
--   • Commentaire auto basé sur le total (pas le trimestre).
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_bilan_data(
  p_eleve_id uuid,
  p_trimestre_start timestamptz DEFAULT date_trunc('quarter', now())
) RETURNS jsonb
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_trimestre_end timestamptz := p_trimestre_start + interval '3 months';
  v_eleve         record;
  v_acquises_now  int;   -- total acquis à vie (DISTINCT) → /31
  v_acquises_trim int;   -- acquis ce trimestre (DISTINCT) → dynamique
  v_quiz_total    int;
  v_quiz_reussis  int;
  v_score_avg     numeric;
  v_days_active   int;
  v_days_total    int;
  v_by_monde      jsonb;
  v_evolution     jsonb;
  v_comment       text;
BEGIN
  SELECT id, prenom, nom, created_at INTO v_eleve
    FROM profiles WHERE id = p_eleve_id AND role = 'eleve';
  IF v_eleve.id IS NULL THEN
    RETURN jsonb_build_object('error', 'eleve_not_found');
  END IF;

  -- Total acquis À VIE (DISTINCT) → le "/31" reflète la vraie maîtrise
  SELECT COUNT(DISTINCT competence_id) INTO v_acquises_now FROM validations
    WHERE eleve_id = p_eleve_id AND statut = 'acquis';

  -- Acquis ce trimestre (DISTINCT) → badge dynamique
  SELECT COUNT(DISTINCT competence_id) INTO v_acquises_trim FROM validations
    WHERE eleve_id = p_eleve_id AND statut = 'acquis'
      AND validated_at >= p_trimestre_start AND validated_at < v_trimestre_end;

  -- Quiz : réussi = score >= 70
  SELECT COUNT(*), COUNT(*) FILTER (WHERE score >= 70), ROUND(AVG(score)::numeric, 1)
    INTO v_quiz_total, v_quiz_reussis, v_score_avg
    FROM quiz_attempts
    WHERE user_id = p_eleve_id
      AND completed_at >= p_trimestre_start AND completed_at < v_trimestre_end;

  -- Régularité : jours distincts avec activité (quiz OU validation) ce trimestre
  SELECT COUNT(DISTINCT activity_day) INTO v_days_active FROM (
    SELECT date_trunc('day', completed_at) AS activity_day
      FROM quiz_attempts
     WHERE user_id = p_eleve_id
       AND completed_at >= p_trimestre_start AND completed_at < v_trimestre_end
    UNION
    SELECT date_trunc('day', validated_at) AS activity_day
      FROM validations
     WHERE eleve_id = p_eleve_id
       AND validated_at >= p_trimestre_start AND validated_at < v_trimestre_end
  ) AS all_activity;

  v_days_total := EXTRACT(DAY FROM (LEAST(v_trimestre_end, now()) - p_trimestre_start))::int;

  -- Détail par monde C1-C4 : TOUTES les compétences acquises (à vie, DISTINCT)
  WITH acquired AS (
    SELECT competence_id, MIN(validated_at) AS validated_at
      FROM validations
     WHERE eleve_id = p_eleve_id AND statut = 'acquis'
     GROUP BY competence_id
  ),
  world_breakdown AS (
    SELECT LEFT(competence_id, 2) AS monde,
           jsonb_agg(jsonb_build_object('competence_id', competence_id, 'validated_at', validated_at)
                     ORDER BY validated_at) AS acquises
      FROM acquired
     GROUP BY LEFT(competence_id, 2)
  )
  SELECT jsonb_object_agg(monde, acquises) INTO v_by_monde FROM world_breakdown;

  -- Évolution mensuelle (3 mois du trimestre, DISTINCT)
  WITH months AS (SELECT generate_series(0, 2) AS m),
  monthly AS (
    SELECT m.m AS month_idx,
           to_char(p_trimestre_start + (m.m || ' months')::interval, 'TMMon') AS month_label,
           COALESCE((
             SELECT COUNT(DISTINCT competence_id) FROM validations
              WHERE eleve_id = p_eleve_id AND statut = 'acquis'
                AND validated_at >= p_trimestre_start + (m.m || ' months')::interval
                AND validated_at <  p_trimestre_start + ((m.m + 1) || ' months')::interval
           ), 0) AS validations_count
      FROM months m
  )
  SELECT jsonb_agg(jsonb_build_object('month', month_label, 'count', validations_count) ORDER BY month_idx)
    INTO v_evolution FROM monthly;

  -- Commentaire auto basé sur le TOTAL /31
  IF v_acquises_now >= 28 THEN
    v_comment := 'Excellent — ' || v_acquises_now || '/31 compétences acquises. Quasiment prêt pour l''examen.';
  ELSIF v_acquises_now >= 20 THEN
    v_comment := 'Bonne progression — ' || v_acquises_now || '/31 compétences acquises. En bonne voie vers l''examen.';
  ELSIF v_acquises_now >= 10 THEN
    v_comment := 'En cours — ' || v_acquises_now || '/31 compétences acquises. Rythme à maintenir.';
  ELSIF v_acquises_now > 0 THEN
    v_comment := 'Début de parcours — ' || v_acquises_now || '/31 compétences acquises.';
  ELSE
    v_comment := 'Aucune compétence acquise. Risque de décrochage — contact moniteur recommandé.';
  END IF;

  RETURN jsonb_build_object(
    'eleve', jsonb_build_object('id', v_eleve.id, 'prenom', v_eleve.prenom, 'nom', v_eleve.nom),
    'trimestre_start', p_trimestre_start,
    'trimestre_end', v_trimestre_end,
    'kpi', jsonb_build_object(
      'acquises_now', v_acquises_now,
      'acquises_trimestre', v_acquises_trim,
      'quiz_total', COALESCE(v_quiz_total, 0),
      'quiz_reussis', COALESCE(v_quiz_reussis, 0),
      'score_moyen', COALESCE(v_score_avg, 0),
      'jours_actifs', COALESCE(v_days_active, 0),
      'jours_total', COALESCE(v_days_total, 0)
    ),
    'by_monde', COALESCE(v_by_monde, '{}'::jsonb),
    'evolution', COALESCE(v_evolution, '[]'::jsonb),
    'comment', v_comment
  );
END;
$function$;
