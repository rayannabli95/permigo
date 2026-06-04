-- ═══════════════════════════════════════════════════════════════
-- 0026 — Fix double-crédit & farming XP/gemmes moniteur sur validations
-- ───────────────────────────────────────────────────────────────
-- Contexte (bug) : sur chaque validation, le moniteur était crédité par
-- DEUX triggers empilés sur la table `validations` :
--   • award_xp_on_validation        (0003 puis 0023, +25 XP / +10 gemmes)
--   • credit_xp_moniteur_on_validation (0008, +15 XP)
--
-- Conséquences :
--   1. Double-crédit XP moniteur (+40 au lieu d'un montant unique).
--   2. Farming : award_xp_on_validation n'avait AUCUNE garde de statut et se
--      déclenchait sur n'importe quel INSERT → poser une compétence en
--      'en_cours' ou 'a_retravailler' créditait quand même +25 XP / +10 gemmes.
--      Via la Séance, cycler les statuts permettait de farmer niveau + gemmes.
--   3. Trigger en AFTER INSERT seulement → une compétence passée à 'acquis'
--      via UPDATE (Livret : en_cours → acquis) ne créditait jamais le moniteur.
--
-- Fix : une SEULE fonction canonique, gardée par statut='acquis' + transition,
--   déclenchée sur INSERT OR UPDATE. On retire le trigger doublon (+15 XP).
--
-- ⚠️ Le RANG moniteur n'est PAS concerné : il vient de la matview
--    moniteur_ranking_mv (heures confirmées + validations acquises + élèves
--    distincts + jours actifs), jamais de la colonne `xp`. Cette migration ne
--    touche donc que l'économie niveau/gemmes (Parcours + boutique moniteur).
--
-- Note : ne corrige pas rétroactivement les XP/gemmes déjà sur-crédités ;
--    seul le comportement futur est corrigé.
-- ═══════════════════════════════════════════════════════════════

-- 1) Fonction canonique : crédite UNE fois quand une compétence DEVIENT 'acquis'.
CREATE OR REPLACE FUNCTION award_xp_on_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_validated_by  UUID    := NEW.validated_by;
  v_eleve_id      UUID    := NEW.eleve_id;
  v_xp_gain       INTEGER := 25;
  v_gem_gain      INTEGER := 10;
  v_count_acquis  INTEGER;
  v_today         DATE    := CURRENT_DATE;
  v_last_day      DATE;
  v_new_streak    INTEGER;
BEGIN
  -- Garde anti-farming : on ne crédite que la TRANSITION vers 'acquis'.
  --   • INSERT direct en 'acquis'                 (Séance / validation rapide)
  --   • UPDATE 'en_cours'|'a_retravailler' → 'acquis' (Livret)
  -- Les statuts 'en_cours' / 'a_retravailler' ne créditent rien.
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
    v_xp_gain  := v_xp_gain  + 100;
    v_gem_gain := v_gem_gain + 50;
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

  -- `gemmes` est protégé par protect_profile_fields → bypass via _set_trusted_op().
  PERFORM _set_trusted_op();
  UPDATE profiles
  SET xp                  = COALESCE(xp, 0)     + v_xp_gain,
      gemmes              = COALESCE(gemmes, 0) + v_gem_gain,
      streak_pro_days     = v_new_streak,
      last_validation_day = v_today
  WHERE id = v_validated_by;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION award_xp_on_validation() TO authenticated;

-- 2) Re-attacher le trigger sur INSERT OR UPDATE (au lieu d'INSERT seul),
--    pour capter les transitions en_cours → acquis (Livret).
DROP TRIGGER IF EXISTS trg_award_xp_on_validation ON validations;
CREATE TRIGGER trg_award_xp_on_validation
  AFTER INSERT OR UPDATE ON validations
  FOR EACH ROW
  EXECUTE FUNCTION award_xp_on_validation();

-- 3) Retirer le trigger doublon (+15 XP). award_xp_on_validation devient l'unique
--    source de XP/gemmes moniteur sur validation. On garde la fonction
--    credit_xp_moniteur_on_validation (inerte sans trigger) pour ne rien casser.
DROP TRIGGER IF EXISTS trg_credit_xp_moniteur_on_validation ON validations;

-- NB : le trigger trg_credit_xp_on_validation (élève +100 XP) est CONSERVÉ —
--      il crédite l'élève, pas le moniteur, et n'est pas concerné par ce fix.
-- NB : le XP de séance (credit_xp_moniteur_on_session +10 / _on_session_confirm +5)
--      est laissé inchangé : il récompense l'engagement « séance loggée + confirmée
--      par l'élève », et n'affecte pas le rang. À ré-évaluer séparément si besoin.
