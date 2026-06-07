-- ═══════════════════════════════════════════════════════════════
-- Refonte validation de séance — SANS heures
-- Migration 1/2 (NON destructive) :
--   • nouveau RPC validate_session() : enregistre une trace de séance
--     (sans durée), valide les compétences REMC (moniteur = source de
--     vérité) et NOTIFIE l'élève à chaque nouvelle compétence acquise
--     (boucle de valeur / engagement élève).
--   • duration_minutes rendu NULLABLE (la trace séance n'a plus d'heures).
--
-- La migration 2/2 (destructive : DROP COLUMN duration_minutes,
-- confirmation_status, confirmed_at, flagged + suppression des anciens
-- overloads log_session) viendra une fois TOUT le code migré.
-- ═══════════════════════════════════════════════════════════════

-- Trace séance sans heures → duration_minutes optionnel
ALTER TABLE public.sessions_moniteur
  ALTER COLUMN duration_minutes DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_session(
  p_eleve_id        uuid,
  p_session_date    date    DEFAULT CURRENT_DATE,
  p_note            text    DEFAULT NULL,
  p_acquis          text[]  DEFAULT NULL,
  p_en_cours        text[]  DEFAULT NULL,
  p_a_retravailler  text[]  DEFAULT NULL
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_moniteur     uuid := current_profile_id();
  v_role         text;
  v_caller_ecole uuid;
  v_eleve_ecole  uuid;
  v_session      public.sessions_moniteur;
  v_comp         text;
  v_prev         text;
  v_n_new        int := 0;
BEGIN
  IF v_moniteur IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT role, auto_ecole_id INTO v_role, v_caller_ecole
    FROM public.profiles WHERE id = v_moniteur;
  IF v_role NOT IN ('enseignant','gerant') THEN
    RETURN jsonb_build_object('error','wrong_role');
  END IF;

  SELECT auto_ecole_id INTO v_eleve_ecole
    FROM public.profiles WHERE id = p_eleve_id AND role = 'eleve';
  IF v_eleve_ecole IS NULL OR v_eleve_ecole IS DISTINCT FROM v_caller_ecole THEN
    RETURN jsonb_build_object('error','eleve_not_in_ecole');
  END IF;

  IF p_session_date > CURRENT_DATE THEN
    RETURN jsonb_build_object('error','session_in_future');
  END IF;

  -- Trace « une séance a eu lieu » (date + note), SANS durée
  INSERT INTO public.sessions_moniteur (moniteur_id, eleve_id, session_date, notes)
  VALUES (v_moniteur, p_eleve_id, p_session_date, p_note)
  RETURNING * INTO v_session;

  -- Compétences ACQUISES (moniteur = source de vérité) + notif élève si nouveau
  IF p_acquis IS NOT NULL THEN
    FOREACH v_comp IN ARRAY p_acquis LOOP
      SELECT statut INTO v_prev FROM public.validations
        WHERE eleve_id = p_eleve_id AND competence_id = v_comp;

      INSERT INTO public.validations (eleve_id, competence_id, validated_by, validated_at, statut, note_enseignant)
      VALUES (p_eleve_id, v_comp, v_moniteur, now(), 'acquis', p_note)
      ON CONFLICT (eleve_id, competence_id) DO UPDATE
        SET statut = 'acquis', validated_by = v_moniteur, validated_at = now(),
            note_enseignant = COALESCE(EXCLUDED.note_enseignant, public.validations.note_enseignant);

      IF v_prev IS DISTINCT FROM 'acquis' THEN
        v_n_new := v_n_new + 1;
        -- Retour motivant côté élève (SECURITY DEFINER → contourne notifications_insert)
        INSERT INTO public.notifications (user_id, type, title, body, data)
        VALUES (p_eleve_id, 'comp_acquise', 'Compétence validée ✅',
                v_comp || ' — validée par ton moniteur',
                jsonb_build_object('competence_id', v_comp));
      END IF;
    END LOOP;
  END IF;

  -- En cours (ne JAMAIS rétrograder un acquis)
  IF p_en_cours IS NOT NULL THEN
    FOREACH v_comp IN ARRAY p_en_cours LOOP
      INSERT INTO public.validations (eleve_id, competence_id, validated_by, validated_at, statut, note_enseignant)
      VALUES (p_eleve_id, v_comp, v_moniteur, now(), 'en_cours', p_note)
      ON CONFLICT (eleve_id, competence_id) DO UPDATE
        SET statut = 'en_cours', validated_by = v_moniteur, validated_at = now()
        WHERE public.validations.statut IS DISTINCT FROM 'acquis';
    END LOOP;
  END IF;

  -- À retravailler (ne JAMAIS rétrograder un acquis)
  IF p_a_retravailler IS NOT NULL THEN
    FOREACH v_comp IN ARRAY p_a_retravailler LOOP
      INSERT INTO public.validations (eleve_id, competence_id, validated_by, validated_at, statut, note_enseignant)
      VALUES (p_eleve_id, v_comp, v_moniteur, now(), 'a_retravailler', p_note)
      ON CONFLICT (eleve_id, competence_id) DO UPDATE
        SET statut = 'a_retravailler', validated_by = v_moniteur, validated_at = now()
        WHERE public.validations.statut IS DISTINCT FROM 'acquis';
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', true, 'session_id', v_session.id, 'n_acquis_new', v_n_new);
END;
$function$;
