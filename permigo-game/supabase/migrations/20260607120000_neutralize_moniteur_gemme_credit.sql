-- ═══════════════════════════════════════════════════════════════
-- 20260607120000 — Retrait de la couche gemmes côté MONITEUR
-- ───────────────────────────────────────────────────────────────
-- Décision fondateur (2026-06-07) : la monnaie unique du moniteur, ce
-- sont les VALIDATIONS. Plus de monnaie virtuelle (gemmes) ni de boutique
-- de skins côté enseignant — ça réconcilie avec moniteur-levels.js
-- (« jamais de cosmétique, aucune monnaie virtuelle »).
--
-- Le trigger `trg_award_xp_on_validation` (fonction award_xp_on_validation,
-- introduite en 0003, modifiée en 0023 puis 0026) créditait, sur chaque
-- compétence passée à 'acquis', +10 gemmes (+50 au palier 10) au moniteur.
-- Cette migration NEUTRALISE uniquement ce crédit gemmes.
--
-- Conservé à l'identique (0026) :
--   • le gain d'XP (+25, +100 au palier 10) ;
--   • la garde anti-farming (seule la TRANSITION vers 'acquis' crédite) ;
--   • le streak pro (streak_pro_days / last_validation_day) ;
--   • le trigger AFTER INSERT OR UPDATE sur `validations`.
--
-- Hors périmètre (inchangé) :
--   • le RANG moniteur (matview moniteur_ranking_mv) ne dépend pas des gemmes ;
--   • les gemmes/boutique côté ÉLÈVE (coffres, quêtes) ;
--   • le solde gemmes déjà acquis par les moniteurs n'est PAS remis à zéro
--     (pas de réécriture rétroactive) : on stoppe seulement le crédit futur.
--   • la fonction reste SECURITY DEFINER et conserve son GRANT.
-- RLS : aucune policy touchée.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION award_xp_on_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_validated_by  UUID    := NEW.validated_by;
  v_eleve_id      UUID    := NEW.eleve_id;
  v_xp_gain       INTEGER := 25;
  v_count_acquis  INTEGER;
  v_today         DATE    := CURRENT_DATE;
  v_last_day      DATE;
  v_new_streak    INTEGER;
BEGIN
  -- Garde anti-farming : on ne crédite que la TRANSITION vers 'acquis'.
  --   • INSERT direct en 'acquis'                     (Séance / validation rapide)
  --   • UPDATE 'en_cours'|'a_retravailler' → 'acquis' (Livret)
  IF v_validated_by IS NULL
     OR NEW.statut IS DISTINCT FROM 'acquis'
     OR (TG_OP = 'UPDATE' AND OLD.statut IS NOT DISTINCT FROM 'acquis') THEN
    RETURN NEW;
  END IF;

  -- Bonus palier : 10e compétence ACQUISE du même élève (une seule fois).
  -- AFTER trigger → NEW est déjà en table, donc le compte inclut la ligne courante.
  SELECT COUNT(*) INTO v_count_acquis
  FROM validations
  WHERE validated_by = v_validated_by
    AND eleve_id     = v_eleve_id
    AND statut       = 'acquis';

  IF v_count_acquis = 10 THEN
    v_xp_gain := v_xp_gain + 100;
  END IF;

  -- Streak pro : jours consécutifs avec au moins 1 validation acquise.
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
    -- Lundi après un dimanche neutre → on ne casse pas la série.
    v_new_streak := COALESCE(v_new_streak, 0) + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  -- Crédit XP + streak. Plus AUCUN crédit gemmes (décision figée n°1).
  -- streak_pro_days est protégé par protect_profile_fields → bypass _set_trusted_op().
  PERFORM _set_trusted_op();
  UPDATE profiles
  SET xp                  = COALESCE(xp, 0) + v_xp_gain,
      streak_pro_days     = v_new_streak,
      last_validation_day = v_today
  WHERE id = v_validated_by;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION award_xp_on_validation() TO authenticated;
