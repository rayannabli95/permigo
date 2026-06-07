-- ═══════════════════════════════════════════════════════════════
-- validate_session — version VALIDATIONS SEULES (révision)
--
-- Découverte : sessions_moniteur porte 6 triggers (XP moniteur, streak,
-- 2 notifs élève, XP-à-la-confirmation, audit) et confirmation_status
-- défaut 'pending'. Y insérer une « trace séance » rallumait toute la
-- machinerie heures/confirmation/ranking qu'on veut justement retirer.
--
-- Décision : validate_session N'ÉCRIT PLUS dans sessions_moniteur.
-- Il enregistre uniquement les validations REMC (moniteur = source de
-- vérité) et notifie l'élève à chaque NOUVELLE compétence acquise.
-- Zéro effet de bord. La note se rattache à chaque validation
-- (validations.note_enseignant). Les colonnes heures ne sont PAS
-- supprimées (25+ fonctions gérant/stats les lisent encore).
-- ═══════════════════════════════════════════════════════════════

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

  -- NB : aucune écriture dans sessions_moniteur (évite les 6 triggers
  -- + la boucle de confirmation 'pending'). Validations uniquement.

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
        INSERT INTO public.notifications (user_id, type, title, body, data)
        VALUES (p_eleve_id, 'comp_acquise', 'Compétence validée ✅',
                v_comp || ' — validée par ton moniteur',
                jsonb_build_object('competence_id', v_comp));
      END IF;
    END LOOP;
  END IF;

  IF p_en_cours IS NOT NULL THEN
    FOREACH v_comp IN ARRAY p_en_cours LOOP
      INSERT INTO public.validations (eleve_id, competence_id, validated_by, validated_at, statut, note_enseignant)
      VALUES (p_eleve_id, v_comp, v_moniteur, now(), 'en_cours', p_note)
      ON CONFLICT (eleve_id, competence_id) DO UPDATE
        SET statut = 'en_cours', validated_by = v_moniteur, validated_at = now()
        WHERE public.validations.statut IS DISTINCT FROM 'acquis';
    END LOOP;
  END IF;

  IF p_a_retravailler IS NOT NULL THEN
    FOREACH v_comp IN ARRAY p_a_retravailler LOOP
      INSERT INTO public.validations (eleve_id, competence_id, validated_by, validated_at, statut, note_enseignant)
      VALUES (p_eleve_id, v_comp, v_moniteur, now(), 'a_retravailler', p_note)
      ON CONFLICT (eleve_id, competence_id) DO UPDATE
        SET statut = 'a_retravailler', validated_by = v_moniteur, validated_at = now()
        WHERE public.validations.statut IS DISTINCT FROM 'acquis';
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', true, 'n_acquis_new', v_n_new);
END;
$function$;
