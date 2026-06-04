-- C4 — Notif de séance en tutoiement (cohérence éditoriale : toute l'app tutoie)
-- Avant : "Confirmez votre séance" / "Votre moniteur" / "vos compétences"
-- Après : "Confirme ta séance" / "Ton moniteur" / "tes compétences"
-- Seules les 3 chaînes changent ; logique identique. Appliqué en prod le 2026-05-25.

CREATE OR REPLACE FUNCTION public.notify_eleve_on_session_logged()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_moniteur_prenom TEXT;
  v_duration_label  TEXT;
  v_eleve_pref      BOOLEAN;
BEGIN
  IF NEW.confirmation_status <> 'pending' THEN RETURN NEW; END IF;

  SELECT prenom INTO v_moniteur_prenom FROM profiles WHERE id = NEW.moniteur_id;
  SELECT COALESCE(notif_push, TRUE) INTO v_eleve_pref FROM profiles WHERE id = NEW.eleve_id;

  IF NOT v_eleve_pref THEN RETURN NEW; END IF;

  v_duration_label := CASE
    WHEN NEW.duration_minutes = 60  THEN '1h'
    WHEN NEW.duration_minutes = 90  THEN '1h30'
    WHEN NEW.duration_minutes = 120 THEN '2h'
    ELSE (NEW.duration_minutes || ' min')
  END;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.eleve_id,
    'session_confirmation',
    'Confirme ta séance',
    COALESCE(v_moniteur_prenom, 'Ton moniteur') || ' a enregistré une séance de ' || v_duration_label
      || '. Confirme-la pour valider tes compétences.',
    jsonb_build_object(
      'session_id', NEW.id,
      'moniteur_id', NEW.moniteur_id,
      'duration_minutes', NEW.duration_minutes,
      'session_date', NEW.session_date,
      'deep_link', '/#/sessions/' || NEW.id
    )
  );

  RETURN NEW;
END;
$function$;
