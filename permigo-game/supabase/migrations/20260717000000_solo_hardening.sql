-- ═══════════════════════════════════════════════════════════════
-- 20260717000000 — Durcissement élève solo (suite audit angles morts, #502/#509)
--
-- 1. self_validate_competence : le SERVEUR corrige le quiz.
--    Avant, le client envoyait p_score (déclaratif) → n'importe qui pouvait
--    valider ses 31 compétences depuis la console avec p_score:100. Désormais
--    le client envoie ses RÉPONSES [{id, answer}] ; le serveur compare à
--    questions_competence.correct_index, exige LEAST(5, taille banque)
--    questions distinctes de la bonne compétence et ≥ 80 %. L'ancienne
--    signature (text, integer) est SUPPRIMÉE — le raccourci console meurt.
--    (Les options/réponses restent lisibles par le client comme partout
--    ailleurs : on tue la triche en un appel, pas la connaissance du contenu.)
--
-- 2. Policy self_validations_select_moniteur : un moniteur voit les
--    auto-validations de SES élèves rattachés (lecture seule). Un élève solo
--    qui rejoint un moniteur n'apparaît plus « 0/31 » dans le livret —
--    badge info côté front, n'entre dans AUCUNE stat moniteur.
--
-- 3. get_my_pass_status() : le compte courant a-t-il acheté le Pass Permis ?
--    Match par auth.users.email (vérifié) OU pass_purchases.user_id, statut
--    'paid'. Sert la mesure « comptes solo sans achat » (décision verrou
--    plus tard, avec des chiffres) — pas de mur d'accès ici.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Correction serveur du quiz de validation autonome ──
DROP FUNCTION IF EXISTS public.self_validate_competence(text, integer);

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
  v_has_mon  boolean;
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

  SELECT role, (enseignant_id IS NOT NULL)
    INTO v_role, v_has_mon
    FROM public.profiles
   WHERE id = v_eleve;

  IF v_role IS DISTINCT FROM 'eleve' THEN
    RETURN jsonb_build_object('error', 'wrong_role');
  END IF;
  IF v_has_mon THEN
    RETURN jsonb_build_object('error', 'has_moniteur');
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

-- ── 2. Le moniteur voit les auto-validations de SES élèves (lecture seule) ──
DROP POLICY IF EXISTS self_validations_select_moniteur ON public.self_validations;
CREATE POLICY self_validations_select_moniteur ON public.self_validations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = eleve_id
      AND p.enseignant_id = current_profile_id()
  ));

-- ── 3. Statut Pass Permis du compte courant ──
CREATE OR REPLACE FUNCTION public.get_my_pass_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid   uuid := auth.uid();
  v_email text;
  v_plan  text;
  v_pre   boolean;
  v_since timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('has_pass', false);
  END IF;

  -- Email accepté UNIQUEMENT s'il est confirmé : un compte créé avec
  -- l'email d'un tiers (non confirmé) ne peut pas revendiquer son achat.
  SELECT lower(email) INTO v_email
    FROM auth.users
   WHERE id = v_uid AND email_confirmed_at IS NOT NULL;

  SELECT plan, preorder, created_at
    INTO v_plan, v_pre, v_since
    FROM public.pass_purchases
   WHERE status = 'paid'
     AND (user_id = v_uid
          OR (v_email IS NOT NULL AND lower(email) = v_email))
   ORDER BY created_at DESC
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('has_pass', false);
  END IF;

  RETURN jsonb_build_object('has_pass', true, 'plan', v_plan, 'preorder', v_pre, 'since', v_since);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_my_pass_status() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_pass_status() TO authenticated;
