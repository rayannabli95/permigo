-- ═══════════════════════════════════════════════════════════════
-- Migration 0003 — XP Moniteur + Streak Pro
-- Ajout streak_pro_days + last_validation_day sur profiles
-- Trigger: +25 XP à validated_by sur chaque validation
--          +100 XP si ≥10 validations du même élève (palier acquis)
-- ═══════════════════════════════════════════════════════════════

-- 1. Nouvelles colonnes sur profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS streak_pro_days    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_validation_day DATE;

-- 2. Fonction trigger XP moniteur
CREATE OR REPLACE FUNCTION award_xp_on_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_validated_by  UUID;
  v_eleve_id      UUID;
  v_xp_gain       INTEGER := 25;
  v_count_same_eleve INTEGER;
  v_today         DATE := CURRENT_DATE;
  v_last_day      DATE;
  v_new_streak    INTEGER;
BEGIN
  v_validated_by := NEW.validated_by;
  v_eleve_id     := NEW.eleve_id;

  IF v_validated_by IS NULL THEN
    RETURN NEW;
  END IF;

  -- Bonus palier : 10e validation du même élève → +100 XP supplémentaires
  SELECT COUNT(*) INTO v_count_same_eleve
  FROM validations
  WHERE validated_by = v_validated_by
    AND eleve_id     = v_eleve_id;

  IF v_count_same_eleve >= 9 THEN
    -- Cette nouvelle validation est la 10e (ou plus) → bonus cumulatif unique
    -- On ne donne le bonus que exactement à la 10e
    IF v_count_same_eleve = 9 THEN
      v_xp_gain := v_xp_gain + 100;
    END IF;
  END IF;

  -- Streak pro : jours consécutifs avec au moins 1 validation
  SELECT last_validation_day, streak_pro_days
    INTO v_last_day, v_new_streak
  FROM profiles
  WHERE id = v_validated_by;

  IF v_last_day IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last_day = v_today THEN
    -- Déjà validé aujourd'hui → pas de changement streak
    v_new_streak := COALESCE(v_new_streak, 1);
  ELSIF v_last_day = v_today - INTERVAL '1 day' THEN
    -- Lendemain → +1 streak
    v_new_streak := COALESCE(v_new_streak, 0) + 1;
  ELSIF v_last_day = v_today - INTERVAL '2 days'
    AND EXTRACT(DOW FROM v_today) = 1 THEN
    -- Lundi après dimanche (neutre) → pas de reset
    v_new_streak := COALESCE(v_new_streak, 0) + 1;
  ELSE
    -- Gap > 1 jour → reset
    v_new_streak := 1;
  END IF;

  -- Mise à jour XP + streak
  UPDATE profiles
  SET
    xp                  = COALESCE(xp, 0) + v_xp_gain,
    streak_pro_days     = v_new_streak,
    last_validation_day = v_today
  WHERE id = v_validated_by;

  RETURN NEW;
END;
$$;

-- 3. Attacher le trigger sur validations (INSERT uniquement)
DROP TRIGGER IF EXISTS trg_award_xp_on_validation ON validations;
CREATE TRIGGER trg_award_xp_on_validation
  AFTER INSERT ON validations
  FOR EACH ROW
  EXECUTE FUNCTION award_xp_on_validation();

-- 4. Accorder EXECUTE à authenticated (SECURITY DEFINER se charge du reste)
GRANT EXECUTE ON FUNCTION award_xp_on_validation() TO authenticated;
