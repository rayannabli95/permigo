-- Fix: get_bilan_data jours_actifs comptait uniquement quiz_attempts,
-- ignorant les validations. Un élève avec séances validées mais 0 quiz
-- affichait "0 Jours actifs". On union quiz_attempts + validations.
CREATE OR REPLACE FUNCTION public.get_bilan_data(p_eleve_id uuid, p_trimestre_start timestamp with time zone DEFAULT date_trunc('quarter'::text, now()))
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_trimestre_end timestamptz := p_trimestre_start + interval '3 months';
  v_prev_start    timestamptz := p_trimestre_start - interval '3 months';

  v_eleve         record;
  v_acquises_now  int;
  v_acquises_prev int;
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

  SELECT COUNT(*) INTO v_acquises_now FROM validations
    WHERE eleve_id = p_eleve_id AND statut = 'acquis'
      AND validated_at >= p_trimestre_start AND validated_at < v_trimestre_end;

  SELECT COUNT(*) INTO v_acquises_prev FROM validations
    WHERE eleve_id = p_eleve_id AND statut = 'acquis'
      AND validated_at >= v_prev_start AND validated_at < p_trimestre_start;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE score >= 60), ROUND(AVG(score)::numeric, 1)
    INTO v_quiz_total, v_quiz_reussis, v_score_avg
    FROM quiz_attempts
    WHERE user_id = p_eleve_id
      AND completed_at >= p_trimestre_start AND completed_at < v_trimestre_end;

  -- Jours actifs = jours distincts avec activité (validations OU quizzes)
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

  WITH world_breakdown AS (
    SELECT
      LEFT(competence_id, 2) AS monde,
      jsonb_agg(jsonb_build_object(
        'competence_id', competence_id,
        'validated_at', validated_at
      ) ORDER BY validated_at) AS acquises
    FROM validations
    WHERE eleve_id = p_eleve_id AND statut = 'acquis'
      AND validated_at >= p_trimestre_start AND validated_at < v_trimestre_end
    GROUP BY LEFT(competence_id, 2)
  )
  SELECT jsonb_object_agg(monde, acquises) INTO v_by_monde FROM world_breakdown;

  WITH months AS (
    SELECT generate_series(0, 2) AS m
  ),
  monthly AS (
    SELECT
      m.m AS month_idx,
      to_char(p_trimestre_start + (m.m || ' months')::interval, 'TMMon') AS month_label,
      COALESCE((
        SELECT COUNT(*) FROM validations
         WHERE eleve_id = p_eleve_id AND statut = 'acquis'
           AND validated_at >= p_trimestre_start + (m.m || ' months')::interval
           AND validated_at <  p_trimestre_start + ((m.m + 1) || ' months')::interval
      ), 0) AS validations_count
    FROM months m
  )
  SELECT jsonb_agg(jsonb_build_object('month', month_label, 'count', validations_count) ORDER BY month_idx) INTO v_evolution FROM monthly;

  IF v_acquises_now >= 21 THEN
    v_comment := 'Excellent rythme ce trimestre. ' || v_acquises_now || ' compétences acquises = en avance sur le planning standard. Continue comme ça pour viser l''examen.';
  ELSIF v_acquises_now >= 12 THEN
    v_comment := 'Bonne dynamique. ' || v_acquises_now || ' compétences acquises ce trimestre. Maintien du rythme actuel = examen prêt dans les délais.';
  ELSIF v_acquises_now >= 4 THEN
    v_comment := 'Rythme à intensifier. ' || v_acquises_now || ' compétences acquises ce trimestre. Une leçon supplémentaire par semaine ferait la différence.';
  ELSIF v_acquises_now > 0 THEN
    v_comment := 'Progression à relancer. ' || v_acquises_now || ' compétence(s) acquise(s) ce trimestre. Discussion à avoir sur l''engagement et le rythme.';
  ELSE
    v_comment := 'Aucune compétence acquise ce trimestre. Risque de décrochage — contact moniteur recommandé.';
  END IF;

  RETURN jsonb_build_object(
    'eleve', jsonb_build_object('id', v_eleve.id, 'prenom', v_eleve.prenom, 'nom', v_eleve.nom),
    'trimestre_start', p_trimestre_start,
    'trimestre_end', v_trimestre_end,
    'kpi', jsonb_build_object(
      'acquises_now', v_acquises_now,
      'acquises_prev', v_acquises_prev,
      'delta_pct', CASE WHEN v_acquises_prev > 0
                       THEN ROUND(((v_acquises_now - v_acquises_prev)::numeric / v_acquises_prev) * 100, 0)
                       ELSE CASE WHEN v_acquises_now > 0 THEN 100 ELSE 0 END END,
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
