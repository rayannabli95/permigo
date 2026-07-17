-- ═══════════════════════════════════════════════════════════════
-- CERTIFICATION POUR TOUS LES ÉLÈVES (pivot 17/07, décision Rayan)
--
-- Avant : self_validate_competence refusait un élève rattaché à un
-- moniteur (erreur 'has_moniteur') — la certification était réservée aux
-- élèves solo de la pré-vente Pass Permis.
--
-- Maintenant : TOUT élève certifie lui-même ses compétences après le quiz
-- (« Tu te sens prêt·e à passer à la suite ? »). Le moniteur n'a plus de
-- saisie obligatoire ; il observe (policy self_validations_select_moniteur,
-- badge distinct dans le livret — migration solo_hardening).
--
-- Ce qui NE change PAS :
--   · correction 100 % SERVEUR des réponses (p_answers, anti-doublons)
--   · seuil 80 %, banque questions_competence type='post_validation'
--   · une validation moniteur 'acquis' existante n'est JAMAIS écrasée
--   · table self_validations séparée de `validations` (source moniteur)
--   · écriture uniquement via cette RPC SECURITY DEFINER (aucune policy
--     INSERT/UPDATE/DELETE côté client)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.self_validate_competence(
  p_competence_id text,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_eleve    uuid := current_profile_id();
  v_role     text;
  v_bank     int;
  v_required int;
  v_answered int;
  v_correct  int;
  v_score    int;
BEGIN
  IF v_eleve IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;
  IF p_competence_id IS NULL OR length(btrim(p_competence_id)) = 0 THEN
    RETURN jsonb_build_object('error', 'invalid_competence');
  END IF;
  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'array' THEN
    RETURN jsonb_build_object('error', 'invalid_answers');
  END IF;

  SELECT role INTO v_role
    FROM public.profiles
   WHERE id = v_eleve;

  IF v_role IS DISTINCT FROM 'eleve' THEN
    RETURN jsonb_build_object('error', 'wrong_role');
  END IF;

  -- Jamais d'écrasement de la source de vérité moniteur.
  IF EXISTS (
    SELECT 1 FROM public.validations
     WHERE eleve_id = v_eleve
       AND competence_id = p_competence_id
       AND statut = 'acquis'
  ) THEN
    RETURN jsonb_build_object('ok', true, 'validated', true, 'already_by_moniteur', true);
  END IF;

  SELECT count(*) INTO v_bank
    FROM public.questions_competence
   WHERE competence_id = p_competence_id AND type = 'post_validation';
  IF v_bank = 0 THEN
    RETURN jsonb_build_object('error', 'no_questions');
  END IF;
  v_required := LEAST(5, v_bank);

  -- Correction serveur : une réponse par question (les doublons d'id sont
  -- écrasés — envoyer 5 fois la même question facile ne compte qu'une fois),
  -- seules comptent les questions post_validation de CETTE compétence.
  SELECT count(*),
         count(*) FILTER (WHERE a.answer = q.correct_index)
    INTO v_answered, v_correct
  FROM (
    SELECT DISTINCT ON (elem->>'id')
           (elem->>'id')::uuid AS qid,
           NULLIF(elem->>'answer', '')::int AS answer
      FROM jsonb_array_elements(p_answers) elem
     WHERE jsonb_typeof(elem) = 'object'
       AND (elem->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       AND (elem->>'answer') ~ '^[0-9]{1,3}$'
     ORDER BY elem->>'id'
  ) a
  JOIN public.questions_competence q
    ON q.id = a.qid
   AND q.competence_id = p_competence_id
   AND q.type = 'post_validation';

  IF v_answered < v_required THEN
    RETURN jsonb_build_object('error', 'not_enough_answers',
                              'answered', v_answered, 'required', v_required);
  END IF;

  v_score := round(100.0 * v_correct / v_answered)::int;

  IF v_score < 80 THEN
    RETURN jsonb_build_object('ok', true, 'passed', false, 'validated', false, 'score', v_score);
  END IF;

  INSERT INTO public.self_validations (eleve_id, competence_id, score, validated_at)
  VALUES (v_eleve, p_competence_id, v_score, now())
  ON CONFLICT (eleve_id, competence_id) DO UPDATE
    SET score = GREATEST(public.self_validations.score, EXCLUDED.score);

  RETURN jsonb_build_object('ok', true, 'passed', true, 'validated', true, 'score', v_score);
END;
$function$;

REVOKE ALL ON FUNCTION public.self_validate_competence(text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.self_validate_competence(text, jsonb) TO authenticated;
