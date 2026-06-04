-- 0014_fix_achievement_unlock_moniteur.sql
-- ─────────────────────────────────────────────────────────────────────────
-- Fix : les validations posées par le MONITEUR ne pouvaient pas débloquer
-- les succès (achievements) de l'ÉLÈVE.
--
-- Contexte : depuis le modèle « moniteur source de vérité » (migration 0013),
-- c'est le moniteur qui écrit la validation. Le trigger
-- check_validation_achievements s'exécute donc dans la session du moniteur.
-- Quand une validation faisait atteindre à l'élève un palier
-- (5/10/15/20/25/28/31 compétences acquises), il appelait
-- _unlock_achievement(eleve_id, ...). Or le garde anti-abus de cette fonction
-- (v_caller <> p_user_id) levait alors 'forbidden_target_user' (SQLSTATE P0001)
-- et faisait échouer TOUTE la transaction log_session → la séance n'était
-- jamais enregistrée. Bug intermittent (ne se déclenchait que pile sur un palier).
--
-- Correctif : les triggers serveur posent le flag app.trusted_op avant de
-- débloquer ; le garde de _unlock_achievement honore désormais ce flag. Les
-- appels RPC directs côté client gardent le garde anti-abus intact.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._unlock_achievement(p_user_id uuid, p_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_meta jsonb;
  v_xp int;
  v_gemmes int;
  v_existing uuid;
  v_caller uuid := current_profile_id();
  v_trusted boolean := COALESCE(current_setting('app.trusted_op', true) = 'true', false);
BEGIN
  IF v_caller IS NOT NULL AND v_caller <> p_user_id AND NOT v_trusted THEN
    RAISE EXCEPTION 'forbidden_target_user';
  END IF;

  SELECT id INTO v_existing FROM achievements_unlocked
    WHERE user_id = p_user_id AND achievement_key = p_key;
  IF FOUND THEN RETURN false; END IF;

  v_meta := _achievement_meta(p_key);
  v_xp := COALESCE((v_meta->>'xp')::int, 0);
  v_gemmes := COALESCE((v_meta->>'gemmes')::int, 0);

  INSERT INTO achievements_unlocked (user_id, achievement_key, bonus_xp, bonus_gemmes, metadata)
  VALUES (p_user_id, p_key, v_xp, v_gemmes, v_meta);

  PERFORM _set_trusted_op();
  UPDATE profiles
    SET xp = COALESCE(xp, 0) + v_xp,
        gemmes = COALESCE(gemmes, 0) + v_gemmes
   WHERE id = p_user_id;

  INSERT INTO notifications (user_id, type, title, body, data) VALUES (
    p_user_id, 'emotional_nudge',
    v_meta->>'title', v_meta->>'body',
    jsonb_build_object('template_id', 'achievement_' || p_key,
      'tone', v_meta->>'tone', 'title', v_meta->>'title',
      'body', v_meta->>'body', 'cta', 'Voir',
      'route', v_meta->>'route', 'achievement_key', p_key,
      'bonus_xp', v_xp, 'bonus_gemmes', v_gemmes));
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_validation_achievements()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_count int; v_key text;
BEGIN
  IF NOT (NEW.statut = 'acquis' AND NEW.eleve_id IS NOT NULL
          AND (TG_OP = 'INSERT' OR OLD.statut IS DISTINCT FROM 'acquis')) THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO v_count FROM validations WHERE eleve_id = NEW.eleve_id AND statut = 'acquis';
  v_key := CASE v_count WHEN 5 THEN 'comp_5' WHEN 10 THEN 'comp_10' WHEN 15 THEN 'comp_15'
    WHEN 20 THEN 'comp_20' WHEN 25 THEN 'comp_25' WHEN 28 THEN 'comp_28' WHEN 31 THEN 'comp_31' ELSE NULL END;
  IF v_key IS NOT NULL THEN
    -- le moniteur agit pour le compte de l'élève : on autorise le déblocage cross-user
    PERFORM _set_trusted_op();
    PERFORM _unlock_achievement(NEW.eleve_id, v_key);
  END IF;
  RETURN NEW;
END;
$function$;
