-- ==========================================
-- Migration 0011 — open_chest : stop double-crédit des gemmes
-- ------------------------------------------
-- Contexte :
--   Un trigger PRÉEXISTANT `trg_credit_xp_on_chest_open`
--   (AFTER UPDATE OF opened_at ON chest_unlocks → credit_xp_on_chest_open)
--   crédite DÉJÀ xp + gemmes à la transition pending → opened.
--   La migration 0010 ajoutait un 2e crédit gemmes manuel dans open_chest
--   → double crédit (ex: world_1 = +50 trigger + 50 manuel = +100).
--
-- Fix :
--   open_chest ne crédite plus lui-même. Il se contente de :
--     - flipper opened_at de façon idempotente (WHERE opened_at IS NULL),
--       ce qui déclenche le trigger (crédit unique xp + gemmes) ;
--     - lire le solde gemmes FRAIS (post-trigger) pour le HUD ;
--     - renvoyer new_balance + gemmes_added (valeur reward, pour la modal).
--   Plus de _set_trusted_op() : on ne touche plus profiles directement.
--
-- Additif, idempotent (CREATE OR REPLACE). Annule l'effet de 0010.
-- ==========================================

CREATE OR REPLACE FUNCTION public.open_chest(p_chest_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_chest   public.chest_unlocks;
  v_balance int;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Idempotent : ne flippe que si pas déjà ouvert.
  -- Le trigger trg_credit_xp_on_chest_open crédite xp + gemmes UNE fois ici.
  UPDATE public.chest_unlocks
     SET opened_at = now()
   WHERE user_id = v_user_id AND chest_type = p_chest_type AND opened_at IS NULL
   RETURNING * INTO v_chest;

  IF NOT FOUND THEN
    SELECT * INTO v_chest FROM public.chest_unlocks
     WHERE user_id = v_user_id AND chest_type = p_chest_type;
    IF FOUND THEN
      RETURN jsonb_build_object('error', 'already_opened', 'chest', to_jsonb(v_chest));
    ELSE
      RETURN jsonb_build_object('error', 'not_unlocked');
    END IF;
  END IF;

  -- Solde frais APRÈS le crédit du trigger.
  SELECT COALESCE(gemmes, 0) INTO v_balance FROM profiles WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'opened',       true,
    'gemmes_added', COALESCE((v_chest.rewards->>'gemmes')::int, 0),
    'new_balance',  v_balance,
    'chest',        to_jsonb(v_chest)
  );
END;
$function$
;
