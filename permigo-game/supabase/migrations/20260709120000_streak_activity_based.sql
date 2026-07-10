-- ═══════════════════════════════════════════════════════════════
-- Série d'ACTIVITÉ (au lieu de série de connexion).
--
-- AVANT : get_today_quests() montait la série au simple 1er login du jour
--   → ouvrir l'app suffisait à « garder sa série ». Conséquences : l'état
--     « série en danger » ne s'affichait JAMAIS sur l'accueil et le gel de
--     série (use_streak_freeze) restait dormant (même condition at_risk).
--
-- APRÈS : la série ne monte QUE si l'élève a fait une vraie activité
--   aujourd'hui (au moins 1 quiz = 1 ligne quiz_attempts du jour). Ouvrir
--   l'app ne suffit plus. Ça rend le bandeau « en danger » + le gel utiles
--   et aligne la mécanique sur le cap (réviser entre les leçons = vraie
--   conséquence pédagogique). Bonus : la notif « série en danger » (18h,
--   check-streak-risk) devient VRAIE au lieu de mensongère.
--
-- CHOIX D'IMPLÉMENTATION (sûr) : on RÉUTILISE le chemin déjà éprouvé en prod
--   — le même UPDATE +1 / reset-à-1 qui passe déjà l'anti-triche
--   protect_streaks_fields. On change juste la CONDITION (quiz fait
--   aujourd'hui) au lieu du login, et on SORT l'avancée du bloc « 1er load du
--   jour » (v_existing<3) pour qu'elle prenne effet au RETOUR sur l'accueil
--   APRÈS le quiz. Aucun nouveau trigger. Comportement de reset identique.
--
-- ⚠️ À TESTER sur une branche Supabase (1 quiz → last_activity_date passe à
--    aujourd'hui + current_streak +1) AVANT d'appliquer en prod.
-- ═══════════════════════════════════════════════════════════════

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
  v_today     date := CURRENT_DATE;
  v_last      date;
  v_cur       int;
  v_new       int;
  v_did_quiz  boolean;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- 1) Quêtes du jour (création au 1er passage). INCHANGÉ — SANS la série.
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

  -- 2) Série d'ACTIVITÉ (à CHAQUE appel). On avance UNIQUEMENT si l'élève a
  --    fait au moins 1 quiz aujourd'hui ET que la série n'a pas déjà été
  --    comptée aujourd'hui. Même logique +1 / reset-à-1 que l'ancien code
  --    (donc passe le guard protect_streaks_fields de la même façon).
  SELECT current_streak, last_activity_date INTO v_cur, v_last
    FROM streaks WHERE user_id = v_user_id;

  IF v_last IS DISTINCT FROM v_today THEN
    SELECT EXISTS (
      SELECT 1 FROM quiz_attempts
       WHERE user_id = v_user_id AND completed_at::date = v_today
    ) INTO v_did_quiz;

    IF v_did_quiz THEN
      IF v_last = v_today - 1 THEN
        v_new := COALESCE(v_cur, 0) + 1;   -- série poursuivie (activité hier + aujourd'hui)
      ELSE
        v_new := 1;                         -- 1re activité, ou reprise après un trou
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

  -- 3) Retour des quêtes du jour. INCHANGÉ.
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
