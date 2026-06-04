-- 0013_validation_moniteur_source_verite.sql
-- Modèle : MONITEUR = SOURCE DE VÉRITÉ.
-- Toute validation moniteur écrit statut='acquis' IMMÉDIATEMENT.
-- Le quiz élève devient un rappel OPTIONNEL (already_acquired), il ne conditionne
-- plus la validation. Plus aucune compétence ne reste coincée en 'a_valider'.
-- submit_competence_quiz et protect_validations : INCHANGÉS (non recréés ici).
-- Le data fix (point 2) déclenche volontairement les triggers XP (rattrapage des
-- lignes coincées). Aucun double-crédit : les triggers XP sont gardés par
-- (NEW.statut='acquis' AND OLD.statut IS DISTINCT FROM 'acquis').

-- 1) log_session (6 args) : INSERT validations en 'acquis' (était 'a_valider')
CREATE OR REPLACE FUNCTION public.log_session(p_eleve_id uuid, p_duration_minutes integer, p_session_date date DEFAULT CURRENT_DATE, p_notes text DEFAULT NULL::text, p_competence_ids text[] DEFAULT NULL::text[], p_comment text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_moniteur_id uuid := current_profile_id();
  v_role text; v_session public.sessions_moniteur;
  v_day_total int; v_week_total int; v_week_start date;
  v_comp text; v_validations jsonb := '[]'::jsonb; v_one_val record; v_final_notes text;
BEGIN
  IF v_moniteur_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = v_moniteur_id;
  IF v_role NOT IN ('enseignant','gerant') THEN RETURN jsonb_build_object('error','wrong_role'); END IF;
  IF p_duration_minutes NOT IN (30,45,60,75,90,105,120,135,150,165,180) THEN RETURN jsonb_build_object('error','invalid_duration'); END IF;
  IF p_session_date > CURRENT_DATE THEN RETURN jsonb_build_object('error','session_in_future'); END IF;
  IF p_session_date < CURRENT_DATE - INTERVAL '7 days' THEN RETURN jsonb_build_object('error','session_too_old'); END IF;

  SELECT COALESCE(SUM(duration_minutes),0) INTO v_day_total FROM public.sessions_moniteur
   WHERE moniteur_id = v_moniteur_id AND session_date = p_session_date AND confirmation_status <> 'refused';
  IF v_day_total + p_duration_minutes > 600 THEN RETURN jsonb_build_object('error','cap_daily_exceeded','current_minutes',v_day_total,'cap_minutes',600); END IF;

  v_week_start := p_session_date - ((EXTRACT(DOW FROM p_session_date)::int + 6) % 7);
  SELECT COALESCE(SUM(duration_minutes),0) INTO v_week_total FROM public.sessions_moniteur
   WHERE moniteur_id = v_moniteur_id AND session_date >= v_week_start AND session_date < v_week_start + INTERVAL '7 days' AND confirmation_status <> 'refused';
  IF v_week_total + p_duration_minutes > 3000 THEN RETURN jsonb_build_object('error','cap_weekly_exceeded','current_minutes',v_week_total,'cap_minutes',3000); END IF;

  v_final_notes := COALESCE(p_comment, p_notes, NULL);

  INSERT INTO public.sessions_moniteur (moniteur_id, eleve_id, duration_minutes, session_date, notes)
  VALUES (v_moniteur_id, p_eleve_id, p_duration_minutes, p_session_date, v_final_notes)
  RETURNING * INTO v_session;

  IF p_competence_ids IS NOT NULL AND array_length(p_competence_ids,1) > 0 THEN
    FOREACH v_comp IN ARRAY p_competence_ids LOOP
      BEGIN
        -- CHANGEMENT : la séance VALIDE directement la compétence (source de vérité moniteur)
        INSERT INTO public.validations (eleve_id, competence_id, validated_by, validated_at, statut, note_enseignant)
        VALUES (p_eleve_id, v_comp, v_moniteur_id, now(), 'acquis', p_comment)
        RETURNING * INTO v_one_val;
        v_validations := v_validations || jsonb_build_object('competence_id', v_one_val.competence_id, 'created', true, 'statut', 'acquis');
      EXCEPTION WHEN unique_violation THEN
        v_validations := v_validations || jsonb_build_object('competence_id', v_comp, 'created', false, 'reason', 'already_exists');
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', true, 'session', to_jsonb(v_session), 'validations', v_validations);
END;
$function$;

-- 1bis) log_session_v2 (6 args) : idem ('a_valider' -> 'acquis')
CREATE OR REPLACE FUNCTION public.log_session_v2(p_eleve_id uuid, p_duration_minutes integer, p_session_date date DEFAULT CURRENT_DATE, p_notes text DEFAULT NULL::text, p_competence_ids text[] DEFAULT NULL::text[], p_comment text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_moniteur_id uuid := current_profile_id();
  v_role text; v_session public.sessions_moniteur;
  v_day_total int; v_week_total int; v_week_start date;
  v_comp text; v_validations jsonb := '[]'::jsonb; v_one_val record; v_final_notes text;
BEGIN
  IF v_moniteur_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = v_moniteur_id;
  IF v_role NOT IN ('enseignant','gerant') THEN RETURN jsonb_build_object('error','wrong_role'); END IF;
  IF p_duration_minutes NOT IN (30,45,60,75,90,105,120,135,150,165,180) THEN RETURN jsonb_build_object('error','invalid_duration'); END IF;
  IF p_session_date > CURRENT_DATE THEN RETURN jsonb_build_object('error','session_in_future'); END IF;
  IF p_session_date < CURRENT_DATE - INTERVAL '7 days' THEN RETURN jsonb_build_object('error','session_too_old'); END IF;

  SELECT COALESCE(SUM(duration_minutes),0) INTO v_day_total FROM public.sessions_moniteur
   WHERE moniteur_id = v_moniteur_id AND session_date = p_session_date AND confirmation_status <> 'refused';
  IF v_day_total + p_duration_minutes > 600 THEN RETURN jsonb_build_object('error','cap_daily_exceeded','current_minutes',v_day_total,'cap_minutes',600); END IF;

  v_week_start := p_session_date - ((EXTRACT(DOW FROM p_session_date)::int + 6) % 7);
  SELECT COALESCE(SUM(duration_minutes),0) INTO v_week_total FROM public.sessions_moniteur
   WHERE moniteur_id = v_moniteur_id AND session_date >= v_week_start AND session_date < v_week_start + INTERVAL '7 days' AND confirmation_status <> 'refused';
  IF v_week_total + p_duration_minutes > 3000 THEN RETURN jsonb_build_object('error','cap_weekly_exceeded','current_minutes',v_week_total,'cap_minutes',3000); END IF;

  v_final_notes := COALESCE(p_comment, p_notes, NULL);

  INSERT INTO public.sessions_moniteur (moniteur_id, eleve_id, duration_minutes, session_date, notes)
  VALUES (v_moniteur_id, p_eleve_id, p_duration_minutes, p_session_date, v_final_notes)
  RETURNING * INTO v_session;

  IF p_competence_ids IS NOT NULL AND array_length(p_competence_ids,1) > 0 THEN
    FOREACH v_comp IN ARRAY p_competence_ids LOOP
      BEGIN
        -- CHANGEMENT : 'a_valider' -> 'acquis'
        INSERT INTO public.validations (eleve_id, competence_id, validated_by, validated_at, statut, note_enseignant)
        VALUES (p_eleve_id, v_comp, v_moniteur_id, now(), 'acquis', p_comment)
        RETURNING * INTO v_one_val;
        v_validations := v_validations || jsonb_build_object('competence_id', v_one_val.competence_id, 'created', true, 'statut', 'acquis');
      EXCEPTION WHEN unique_violation THEN
        v_validations := v_validations || jsonb_build_object('competence_id', v_comp, 'created', false, 'reason', 'already_exists');
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', true, 'session', to_jsonb(v_session), 'validations', v_validations);
END;
$function$;

-- 2) Data fix : débloque toutes les compétences coincées en 'a_valider'.
--    Triggers XP conservés (rattrapage voulu, pas de double-crédit).
UPDATE public.validations SET statut = 'acquis' WHERE statut = 'a_valider';
