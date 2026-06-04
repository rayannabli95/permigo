-- ═══════════════════════════════════════════════════════════════
-- 0023 — Monnaie moniteur + équilibrage boutique
-- Problème : le moniteur gagnait de l'XP par validation mais AUCUNE
--   gemme (les gemmes ne venaient que des coffres/quêtes, côté élève).
--   → la boutique skins était donc inatteignable côté enseignant.
-- Fix : créditer des gemmes au moniteur sur chaque validation, et
--   rendre la dernière voiture (Supercar) nettement plus dure à obtenir.
-- ═══════════════════════════════════════════════════════════════

-- 1) award_xp_on_validation : ajoute un crédit gemmes au moniteur.
--    +10 gemmes / validation, +50 bonus à la 10e validation d'un même élève
--    (aligné sur le palier +100 XP existant).
CREATE OR REPLACE FUNCTION award_xp_on_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_validated_by  UUID;
  v_eleve_id      UUID;
  v_xp_gain       INTEGER := 25;
  v_gem_gain      INTEGER := 10;
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

  -- Bonus palier : 10e validation du même élève → +100 XP / +50 gemmes (une seule fois)
  SELECT COUNT(*) INTO v_count_same_eleve
  FROM validations
  WHERE validated_by = v_validated_by
    AND eleve_id     = v_eleve_id;

  IF v_count_same_eleve = 9 THEN
    v_xp_gain  := v_xp_gain  + 100;
    v_gem_gain := v_gem_gain + 50;
  END IF;

  -- Streak pro : jours consécutifs avec au moins 1 validation
  SELECT last_validation_day, streak_pro_days
    INTO v_last_day, v_new_streak
  FROM profiles
  WHERE id = v_validated_by;

  IF v_last_day IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last_day = v_today THEN
    v_new_streak := COALESCE(v_new_streak, 1);
  ELSIF v_last_day = v_today - INTERVAL '1 day' THEN
    v_new_streak := COALESCE(v_new_streak, 0) + 1;
  ELSIF v_last_day = v_today - INTERVAL '2 days'
    AND EXTRACT(DOW FROM v_today) = 1 THEN
    v_new_streak := COALESCE(v_new_streak, 0) + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  -- Mise à jour XP + gemmes + streak.
  -- gemmes est protégé par protect_profile_fields → bypass via _set_trusted_op().
  PERFORM _set_trusted_op();
  UPDATE profiles
  SET
    xp                  = COALESCE(xp, 0) + v_xp_gain,
    gemmes              = COALESCE(gemmes, 0) + v_gem_gain,
    streak_pro_days     = v_new_streak,
    last_validation_day = v_today
  WHERE id = v_validated_by;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION award_xp_on_validation() TO authenticated;

-- 2) Équilibrage : la Supercar (skin ultime) passe de 4000 → 6000 gemmes,
--    pour la détacher nettement du palier précédent (SUV 1500). Les 3
--    premières voitures restent identiques et atteignables.
UPDATE public.items_catalog
   SET cost_gemmes = 6000
 WHERE id = 'car_supercar';
