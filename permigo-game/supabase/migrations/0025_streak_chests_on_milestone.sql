-- 0025_streak_chests_on_milestone.sql
-- ─────────────────────────────────────────────────────────────────────────
-- Fix : les coffres de série (streak_7 / streak_14 / streak_30) ne se
-- débloquaient JAMAIS.
--
-- Constat : leur seul point de création était `updateStreak()` (localStorage,
-- src/utils/game-state.js) qui produit un `pendingChest` aux paliers 7/14/30.
-- Or `updateStreak()` n'est appelé NULLE PART dans le front → aucun
-- `chest_unlocks` de type streak n'était jamais inséré. Même boucle morte que
-- la série elle-même (cf 0024).
--
-- Correctif : on rend le déblocage serveur-autoritaire, au même endroit que les
-- trophées série. Le trigger check_streak_achievements crée désormais aussi le
-- coffre quand la série atteint 7/14/30. Le coffre est inséré NON ouvert ;
-- le crédit XP/gemmes se fait à l'ouverture (trg_credit_xp_on_chest_open).
-- ON CONFLICT DO NOTHING → idempotent, jamais de doublon.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_streak_achievements()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_key     text;
  v_chest   text;
  v_rewards jsonb;
BEGIN
  -- ── Trophées série (paliers 3 / 14 / 30) ──────────────────────────
  v_key := CASE
    WHEN NEW.current_streak = 3  THEN 'streak_3'
    WHEN NEW.current_streak = 14 THEN 'streak_14'
    WHEN NEW.current_streak = 30 THEN 'streak_60'
    ELSE NULL
  END;
  IF v_key IS NOT NULL THEN
    PERFORM _unlock_achievement(NEW.user_id, v_key);
  END IF;

  -- ── Coffres série (jalons 7 / 14 / 30) ────────────────────────────
  v_chest := CASE
    WHEN NEW.current_streak = 7  THEN 'streak_7'
    WHEN NEW.current_streak = 14 THEN 'streak_14'
    WHEN NEW.current_streak = 30 THEN 'streak_30'
    ELSE NULL
  END;
  IF v_chest IS NOT NULL THEN
    v_rewards := CASE v_chest
      WHEN 'streak_7'  THEN jsonb_build_object('xp', 150, 'gemmes', 30,  'title', 'Persévérant')
      WHEN 'streak_14' THEN jsonb_build_object('xp', 350, 'gemmes', 80,  'title', 'Constant')
      WHEN 'streak_30' THEN jsonb_build_object('xp', 800, 'gemmes', 200, 'title', 'Inarrêtable')
    END;
    INSERT INTO chest_unlocks (user_id, chest_type, rewards)
    VALUES (NEW.user_id, v_chest, v_rewards)
    ON CONFLICT (user_id, chest_type) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
