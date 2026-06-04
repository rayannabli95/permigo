-- 0024_eleve_streak_on_login.sql
-- ─────────────────────────────────────────────────────────────────────────
-- Fix : la série (streak) de l'ÉLÈVE n'était jamais incrémentée.
--
-- Constat : rien ne montait `streaks.current_streak` côté élève (seul
-- `use_streak_freeze` y touchait). Conséquences :
--   • le badge série ne s'affichait jamais sur l'accueil (gardé par
--     current_streak > 0) ;
--   • les trophées série (streak_3 / streak_14 / streak_60) étaient
--     INATTEIGNABLES car le trigger trg_check_streak_achievements ne se
--     déclenche que quand current_streak atteint 3 / 14 / 30.
--
-- Correctif : on bumpe la série au PREMIER appel quotidien de
-- get_today_quests (= l'événement « connexion du jour », déjà utilisé pour
-- générer la quête login auto-complétée). +1 si jour consécutif, reset à 1
-- sinon. Respecte protect_streaks_fields (jamais plus de +1, longest jamais
-- décroissant). C'est ce UPDATE qui réveille les trophées série.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_today_quests()
 RETURNS TABLE(quest_id text, title text, target integer, progress integer, completed boolean, claimed boolean, reward_xp integer, reward_gemmes integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id   uuid := current_profile_id();
  v_existing  int;
  v_today     date := CURRENT_DATE;
  v_last      date;
  v_cur       int;
  v_new       int;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Si pas encore 3 quêtes pour aujourd'hui → premier passage du jour
  SELECT COUNT(*) INTO v_existing
    FROM daily_quests_progress
   WHERE user_id = v_user_id AND quest_date = v_today;

  IF v_existing < 3 THEN
    -- ── Série : montée quotidienne (premier login du jour) ──────────────
    SELECT current_streak, last_activity_date INTO v_cur, v_last
      FROM streaks WHERE user_id = v_user_id;

    IF v_last IS NULL THEN
      v_new := 1;                                   -- toute première activité
    ELSIF v_last = v_today THEN
      v_new := GREATEST(COALESCE(v_cur, 1), 1);     -- déjà compté aujourd'hui
    ELSIF v_last = v_today - 1 THEN
      v_new := COALESCE(v_cur, 0) + 1;              -- jour consécutif → +1
    ELSE
      v_new := 1;                                   -- série cassée → reset
    END IF;

    INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_user_id, v_new, v_new, v_today)
    ON CONFLICT (user_id) DO UPDATE
      SET current_streak     = v_new,
          longest_streak     = GREATEST(streaks.longest_streak, v_new),
          last_activity_date = v_today;

    -- Génère le set du jour : login + validation + quiz
    INSERT INTO daily_quests_progress (user_id, quest_date, quest_id, target, reward_xp, reward_gemmes)
    VALUES
      (v_user_id, v_today, 'quest_login',      1, 10, 5),
      (v_user_id, v_today, 'quest_validate_1', 1, 50, 20),
      (v_user_id, v_today, 'quest_quiz_1',     1, 30, 15)
    ON CONFLICT (user_id, quest_date, quest_id) DO NOTHING;

    -- Auto-complète le login (il est ici donc connecté)
    UPDATE daily_quests_progress
       SET progress = 1, completed_at = COALESCE(completed_at, now())
     WHERE user_id = v_user_id
       AND quest_date = v_today
       AND quest_id = 'quest_login';
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
