-- ═══════════════════════════════════════════════════════════════
-- Série & quêtes du jour en heure de PARIS (au lieu d'UTC).
--
-- Problème : la série d'activité (get_today_quests) et le gel
-- (use_streak_freeze) calculaient « aujourd'hui » en UTC (CURRENT_DATE),
-- alors que le client (heatmap, « question du jour ») raisonne en heure
-- LOCALE. Pour un élève qui joue entre minuit local et minuit UTC (~1-2 h/nuit),
-- son quiz était daté « hier » → contradiction (hero « terminé » vs bandeau
-- « en danger ») et série potentiellement perdue à tort.
--
-- Fix : les 2 fonctions qui écrivent streaks.last_activity_date basculent sur
-- Europe/Paris (tous les élèves sont en France). Le client, lui, utilise
-- l'heure locale de l'appareil (= Paris en France) → tout s'aligne.
--
-- ⚠️ À tester sur branche/prod (transaction annulée) : un quiz fait « la nuit »
--    compte pour le bon jour de Paris.
-- ═══════════════════════════════════════════════════════════════

-- ── 1) get_today_quests : v_today + fenêtre quiz en heure de Paris ──
CREATE OR REPLACE FUNCTION public.get_today_quests()
 RETURNS TABLE(quest_id text, title text, target integer, progress integer, completed boolean, claimed boolean, reward_xp integer, reward_gemmes integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_user_id   uuid := current_profile_id();
  v_existing  int;
  v_today     date := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_last      date;
  v_cur       int;
  v_new       int;
  v_did_quiz  boolean;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Quêtes du jour (création au 1er passage). SANS la série.
  SELECT COUNT(*) INTO v_existing
    FROM daily_quests_progress
   WHERE user_id = v_user_id AND quest_date = v_today;

  IF v_existing < 3 THEN
    INSERT INTO daily_quests_progress (user_id, quest_date, quest_id, target, reward_xp, reward_gemmes)
    VALUES
      (v_user_id, v_today, 'quest_login',      1, 10, 5),
      (v_user_id, v_today, 'quest_validate_1', 1, 50, 20),
      (v_user_id, v_today, 'quest_quiz_1',     1, 30, 15)
    ON CONFLICT (user_id, quest_date, quest_id) DO NOTHING;

    UPDATE daily_quests_progress
       SET progress = 1, completed_at = COALESCE(completed_at, now())
     WHERE user_id = v_user_id
       AND quest_date = v_today
       AND quest_id = 'quest_login';
  END IF;

  -- Série d'ACTIVITÉ (à chaque appel) : avance si un quiz a été COMPLÉTÉ
  -- aujourd'hui (jour de Paris) et que la série n'a pas déjà été comptée.
  SELECT current_streak, last_activity_date INTO v_cur, v_last
    FROM streaks WHERE user_id = v_user_id;

  IF v_last IS DISTINCT FROM v_today THEN
    SELECT EXISTS (
      SELECT 1 FROM quiz_attempts
       WHERE user_id = v_user_id
         AND (completed_at AT TIME ZONE 'Europe/Paris')::date = v_today
    ) INTO v_did_quiz;

    IF v_did_quiz THEN
      IF v_last = v_today - 1 THEN
        v_new := COALESCE(v_cur, 0) + 1;
      ELSE
        v_new := 1;
      END IF;

      IF EXISTS (SELECT 1 FROM streaks WHERE user_id = v_user_id) THEN
        UPDATE streaks
           SET current_streak     = v_new,
               longest_streak     = GREATEST(longest_streak, v_new),
               last_activity_date = v_today
         WHERE user_id = v_user_id;
      ELSE
        INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date)
        VALUES (v_user_id, v_new, v_new, v_today);
      END IF;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    dq.quest_id,
    CASE dq.quest_id
      WHEN 'quest_login'       THEN 'Se connecter aujourd''hui'
      WHEN 'quest_validate_1'  THEN 'Valider 1 compétence'
      WHEN 'quest_quiz_1'      THEN 'Réussir 1 quiz (≥70%)'
      WHEN 'quest_quiz_3'      THEN 'Réussir 3 quiz'
      WHEN 'quest_streak_keep' THEN 'Maintenir ta série'
      WHEN 'quest_quiz_perfect' THEN 'Faire 1 quiz parfait (100%)'
      ELSE dq.quest_id
    END AS title,
    dq.target,
    dq.progress,
    (dq.completed_at IS NOT NULL) AS completed,
    (dq.claimed_at IS NOT NULL) AS claimed,
    dq.reward_xp,
    dq.reward_gemmes
  FROM daily_quests_progress dq
  WHERE dq.user_id = v_user_id AND dq.quest_date = v_today
  ORDER BY
    CASE dq.quest_id
      WHEN 'quest_login' THEN 1
      WHEN 'quest_validate_1' THEN 2
      WHEN 'quest_quiz_1' THEN 3
      ELSE 4
    END;
END;
$function$;

-- ── 2) use_streak_freeze : « aujourd'hui/hier » en heure de Paris ──
-- (identique à la version prod, seules les 2 dates par défaut/validation changent)
CREATE OR REPLACE FUNCTION public.use_streak_freeze(p_date date DEFAULT (now() AT TIME ZONE 'Europe/Paris')::date)
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

  INSERT INTO streaks (user_id, current_streak, last_activity_date, longest_streak)
  VALUES (v_user_id, GREATEST(COALESCE(v_streak.current_streak, 0), 1), p_date,
          COALESCE(v_streak.longest_streak, 1))
  ON CONFLICT (user_id) DO UPDATE
    SET last_activity_date = GREATEST(streaks.last_activity_date, p_date);

  RETURN jsonb_build_object('ok', true, 'freeze', to_jsonb(v_freeze),
    'new_balance', v_current_gemmes - v_cost, 'streak_preserved', true);
END;
$function$;
