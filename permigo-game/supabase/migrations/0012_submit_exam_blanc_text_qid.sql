-- ==========================================
-- Migration 0012 — submit_exam_blanc : compare les question_id en TEXTE
-- ------------------------------------------
-- Contexte (BUG exam blanc) :
--   submit_exam_blanc comparait les identifiants de questions en les
--   castant en uuid : (a->>'question_id')::uuid = (v_q->>'id')::uuid.
--   Or remc_questions.id est de type TEXT (ex: "q_exam1_06"), pas uuid.
--   → erreur Postgres 22P02 "invalid input syntax for type uuid"
--   → la RPC renvoie 400 → l'app affiche "erreur" et perd les réponses.
--
-- Fix : comparer les question_id tels quels (texte), sans cast uuid.
--   Le reste de la fonction est inchangé (score, results, update).
--
-- Additif, idempotent (CREATE OR REPLACE), réappliquable sans risque.
-- ==========================================

CREATE OR REPLACE FUNCTION public.submit_exam_blanc(p_session_id uuid, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id      uuid := current_profile_id();
  v_session      public.exam_blanc_sessions;
  v_correct      int := 0;
  v_total        int := 0;
  v_score        int;
  v_duration     int;
  v_results      jsonb := '[]'::jsonb;
  v_q            jsonb;
  v_a            jsonb;
  v_correct_idx  int;
  v_selected     int;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO v_session
    FROM exam_blanc_sessions
   WHERE id = p_session_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'session_not_found');
  END IF;
  IF v_session.submitted_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'already_submitted');
  END IF;

  -- Calcule le score
  FOR v_q IN SELECT * FROM jsonb_array_elements(v_session.questions) LOOP
    v_total := v_total + 1;
    v_correct_idx := (v_q->>'correct_idx')::int;

    -- FIX 0012 : comparaison TEXTE (les id de questions ne sont pas des uuid)
    v_a := (
      SELECT a FROM jsonb_array_elements(p_answers) a
      WHERE (a->>'question_id') = (v_q->>'id')
      LIMIT 1
    );
    v_selected := COALESCE((v_a->>'selected_idx')::int, -1);

    v_results := v_results || jsonb_build_object(
      'question_id', v_q->>'id',
      'selected_idx', v_selected,
      'correct_idx', v_correct_idx,
      'is_correct', (v_selected = v_correct_idx)
    );

    IF v_selected = v_correct_idx THEN
      v_correct := v_correct + 1;
    END IF;
  END LOOP;

  v_score    := ROUND((v_correct::numeric / NULLIF(v_total, 0)) * 100);
  v_duration := EXTRACT(EPOCH FROM (now() - v_session.started_at))::int;

  UPDATE exam_blanc_sessions
     SET submitted_at = now(),
         answers      = v_results,
         score        = v_score,
         duration_sec = v_duration
   WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'ok', true,
    'score', v_score,
    'correct', v_correct,
    'total', v_total,
    'duration_sec', v_duration,
    'passed', (v_score >= 70),
    'results', v_results
  );
END;
$function$
;
