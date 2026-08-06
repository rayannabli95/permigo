-- Fix : le gel de série échouait pour tout élève ayant déjà une série active.
--
-- use_streak_freeze() faisait un INSERT ... ON CONFLICT (user_id) DO UPDATE
-- sur la table streaks. Le trigger anti-triche protect_streaks_fields
-- (BEFORE INSERT OR UPDATE) voit la ligne VALUES(...) proposée AVANT la
-- résolution du ON CONFLICT, et rejette tout INSERT proposé avec
-- current_streak > 1 ("forbidden: cannot self-inject streak > 1").
-- Résultat : geler sa série échouait précisément quand on a une série
-- à protéger (current_streak > 1) — c'est-à-dire presque toujours.
--
-- Même correctif que celui déjà appliqué à get_today_quests()
-- (migration 20260620150000_prelaunch_idor_and_streak_fix.sql) :
-- UPDATE si la ligne streaks existe déjà, sinon INSERT à 1.
CREATE OR REPLACE FUNCTION public.use_streak_freeze(p_date date DEFAULT ((now() AT TIME ZONE 'Europe/Paris'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id      uuid := current_profile_id();
  v_cost         int  := 50;
  v_current_gemmes int;
  v_streak       record;
  v_freeze       public.streak_freezes;
  v_today        date := (now() AT TIME ZONE 'Europe/Paris')::date;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  IF p_date > v_today OR p_date < v_today - 1 THEN
    RETURN jsonb_build_object('error', 'invalid_date', 'allowed', 'today_or_yesterday');
  END IF;

  IF EXISTS (SELECT 1 FROM streak_freezes WHERE user_id = v_user_id AND frozen_date = p_date) THEN
    RETURN jsonb_build_object('error', 'already_frozen', 'date', p_date);
  END IF;

  SELECT COALESCE(gemmes, 0) INTO v_current_gemmes FROM profiles WHERE id = v_user_id;
  IF v_current_gemmes < v_cost THEN
    RETURN jsonb_build_object('error', 'insufficient_gemmes',
      'current', v_current_gemmes, 'required', v_cost);
  END IF;

  SELECT current_streak, last_activity_date, longest_streak INTO v_streak
    FROM streaks WHERE user_id = v_user_id;

  PERFORM _set_trusted_op();
  UPDATE profiles SET gemmes = gemmes - v_cost WHERE id = v_user_id;

  INSERT INTO streak_freezes (user_id, frozen_date, cost_gemmes)
  VALUES (v_user_id, p_date, v_cost) RETURNING * INTO v_freeze;

  IF v_streak.current_streak IS NOT NULL THEN
    UPDATE streaks
       SET last_activity_date = GREATEST(last_activity_date, p_date)
     WHERE user_id = v_user_id;
  ELSE
    INSERT INTO streaks (user_id, current_streak, last_activity_date, longest_streak)
    VALUES (v_user_id, 1, p_date, 1);
  END IF;

  RETURN jsonb_build_object('ok', true, 'freeze', to_jsonb(v_freeze),
    'new_balance', v_current_gemmes - v_cost, 'streak_preserved', true);
END;
$function$;
