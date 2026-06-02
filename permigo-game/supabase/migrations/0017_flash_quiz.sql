-- ════════════════════════════════════════════════════════════════
-- 0017 — Quiz éclair moniteur
-- Le moniteur pousse 3 questions à un élève en fin de séance ;
-- l'élève a 5 minutes pour répondre. Score serveur-side.
-- ════════════════════════════════════════════════════════════════

-- ─── Table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flash_quizzes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by       uuid NOT NULL REFERENCES profiles(id),   -- moniteur
  sent_to       uuid NOT NULL REFERENCES profiles(id),   -- élève
  competence_id text NOT NULL,
  question_ids  uuid[] NOT NULL,                          -- 3 ids questions_competence
  sent_at       timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  responded_at  timestamptz,
  score         int,
  results       jsonb,
  CONSTRAINT score_valid CHECK (score IS NULL OR (score >= 0 AND score <= 3))
);

CREATE INDEX IF NOT EXISTS flash_quizzes_sent_to_active_idx
  ON public.flash_quizzes (sent_to, expires_at)
  WHERE responded_at IS NULL;

CREATE INDEX IF NOT EXISTS flash_quizzes_sent_by_idx
  ON public.flash_quizzes (sent_by, sent_at DESC);

ALTER TABLE public.flash_quizzes ENABLE ROW LEVEL SECURITY;

-- ─── RLS : moniteur voit ses envois, élève voit ses reçus ────────
DROP POLICY IF EXISTS flash_quizzes_select_self ON public.flash_quizzes;
CREATE POLICY flash_quizzes_select_self ON public.flash_quizzes
  FOR SELECT TO authenticated
  USING (sent_by = current_profile_id() OR sent_to = current_profile_id());

-- Écriture via RPC SECURITY DEFINER uniquement
DROP POLICY IF EXISTS flash_quizzes_no_direct_insert ON public.flash_quizzes;
CREATE POLICY flash_quizzes_no_direct_insert ON public.flash_quizzes
  FOR INSERT TO authenticated WITH CHECK (false);
DROP POLICY IF EXISTS flash_quizzes_no_direct_update ON public.flash_quizzes;
CREATE POLICY flash_quizzes_no_direct_update ON public.flash_quizzes
  FOR UPDATE TO authenticated USING (false);

-- ─── RPC : moniteur envoie un quiz éclair ────────────────────────
CREATE OR REPLACE FUNCTION public.send_flash_quiz(
  p_eleve_id uuid,
  p_competence_id text
)
RETURNS TABLE (id uuid, question_ids uuid[], expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_moniteur uuid := current_profile_id();
  v_qids uuid[];
  v_id uuid;
  v_expires timestamptz := now() + interval '5 minutes';
BEGIN
  -- Vérif : moniteur et élève dans la même auto-école
  IF NOT EXISTS (
    SELECT 1 FROM profiles m, profiles e
    WHERE m.id = v_moniteur AND e.id = p_eleve_id
      AND m.role = 'enseignant' AND e.role = 'eleve'
      AND m.auto_ecole_id = e.auto_ecole_id
      AND m.auto_ecole_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'forbidden: not same school';
  END IF;

  -- 3 questions aléatoires de la compétence
  SELECT array_agg(q.qid) INTO v_qids
  FROM (
    SELECT qc.id AS qid FROM questions_competence qc
    WHERE qc.competence_id = p_competence_id
    ORDER BY random()
    LIMIT 3
  ) q;

  IF v_qids IS NULL OR array_length(v_qids, 1) < 3 THEN
    RAISE EXCEPTION 'not enough questions for competence %', p_competence_id;
  END IF;

  PERFORM _set_trusted_op();

  -- 1 seul quiz éclair actif par élève : on périme les précédents non répondus
  UPDATE flash_quizzes fq
     SET expires_at = now()
   WHERE fq.sent_to = p_eleve_id
     AND fq.responded_at IS NULL
     AND fq.expires_at > now();

  INSERT INTO flash_quizzes (sent_by, sent_to, competence_id, question_ids, expires_at)
  VALUES (v_moniteur, p_eleve_id, p_competence_id, v_qids, v_expires)
  RETURNING flash_quizzes.id INTO v_id;

  -- Notif in-app (le bandeau accueil élève assure la livraison temps réel)
  PERFORM _set_trusted_op();
  INSERT INTO notifications (user_id, type, title, body, data) VALUES (
    p_eleve_id, 'flash_quiz',
    '⚡ Quiz éclair de ton moniteur',
    'Tu as 5 minutes pour répondre à 3 questions',
    jsonb_build_object('flash_quiz_id', v_id, 'route', '#/flash-quiz/' || v_id)
  );

  RETURN QUERY SELECT v_id, v_qids, v_expires;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_flash_quiz(uuid, text) TO authenticated;

-- ─── RPC : élève répond ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.respond_flash_quiz(
  p_flash_quiz_id uuid,
  p_answers jsonb -- [{question_id, selected_idx}]
)
RETURNS TABLE (score int, total int, results jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_eleve uuid := current_profile_id();
  v_quiz record;
  v_results jsonb := '[]'::jsonb;
  v_score int := 0;
  v_total int;
  v_ans jsonb;
  v_qid uuid;
  v_correct int;
BEGIN
  SELECT * INTO v_quiz FROM flash_quizzes
   WHERE id = p_flash_quiz_id AND sent_to = v_eleve AND responded_at IS NULL;

  IF NOT FOUND THEN RAISE EXCEPTION 'flash quiz not found or already responded'; END IF;
  IF now() > v_quiz.expires_at THEN RAISE EXCEPTION 'flash quiz expired'; END IF;

  v_total := COALESCE(array_length(v_quiz.question_ids, 1), 3);

  FOR v_ans IN SELECT * FROM jsonb_array_elements(p_answers) LOOP
    v_qid := (v_ans->>'question_id')::uuid;
    -- Ne compter que les questions appartenant à ce quiz
    CONTINUE WHEN NOT (v_qid = ANY(v_quiz.question_ids));

    SELECT qc.correct_index INTO v_correct FROM questions_competence qc WHERE qc.id = v_qid;
    IF v_correct = (v_ans->>'selected_idx')::int THEN v_score := v_score + 1; END IF;
    v_results := v_results || jsonb_build_object(
      'question_id', v_qid,
      'selected_idx', (v_ans->>'selected_idx')::int,
      'correct_idx', v_correct,
      'is_correct', v_correct = (v_ans->>'selected_idx')::int
    );
  END LOOP;

  PERFORM _set_trusted_op();
  UPDATE flash_quizzes fq
     SET responded_at = now(), score = v_score, results = v_results
   WHERE fq.id = p_flash_quiz_id;

  RETURN QUERY SELECT v_score, v_total, v_results;
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_flash_quiz(uuid, jsonb) TO authenticated;

-- ─── Dedupe : flash_quiz est critique (jamais dédupliqué) ────────
CREATE OR REPLACE FUNCTION public.dedupe_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_exists boolean;
  v_window_minutes int;
BEGIN
  -- Types CRITIQUES : on laisse toujours passer (pas de dedupe)
  IF NEW.type IN ('post_validation_quiz','consolidation_quiz','session_confirmation','flash_quiz') THEN
    RETURN NEW;
  END IF;

  v_window_minutes := CASE NEW.type
    WHEN 'emotional_nudge' THEN 360
    WHEN 'streak_risk'     THEN 720
    WHEN 'student_at_risk' THEN 1440
    ELSE 60
  END;

  SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = NEW.user_id
      AND type = NEW.type
      AND created_at >= now() - (v_window_minutes || ' minutes')::interval
      AND id <> COALESCE(NEW.id, gen_random_uuid())
  ) INTO v_exists;

  IF v_exists THEN
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$function$;
