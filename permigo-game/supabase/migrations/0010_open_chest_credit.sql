-- ==========================================
-- Migration 0010 — open_chest crédite les gemmes côté serveur
-- ------------------------------------------
-- Contexte (BUG 1 + BUG 2) :
--   Le crédit des gemmes d'un coffre était fait CÔTÉ CLIENT
--   (utils/game-state.js : addGemmes → UPDATE profiles.gemmes direct).
--   Ce write est bloqué par le trigger protect_profile_fields → le solde
--   n'était jamais persisté en DB (BUG 2 : "+300 gemmes" sans effet réel).
--   Par ailleurs, rien ne garantissait côté serveur l'unicité du gain ni
--   l'état "ouvert" → réouvertures/re-crédits possibles (BUG 1).
--
-- Fix : open_chest devient la SEULE source de vérité.
--   - flip opened_at de façon idempotente (WHERE opened_at IS NULL) ;
--   - crédit gemmes UNE fois, depuis rewards figés à l'unlock
--     (chest_unlocks.rewards.gemmes, posé par unlock_chest) ;
--   - bypass protect_profile_fields via _set_trusted_op() (même pattern
--     que purchase_item / use_streak_freeze) ;
--   - retourne new_balance pour rafraîchir le HUD.
--
-- XP : HORS SCOPE (pas d'API XP encore) — gemmes uniquement.
-- Additif : ne touche que open_chest. Idempotent (CREATE OR REPLACE),
-- réappliquable sans risque, comme 0008/0009.
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
  v_gemmes  int;
  v_balance int;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Idempotent : ne flippe que si le coffre n'est pas déjà ouvert.
  UPDATE public.chest_unlocks
     SET opened_at = now()
   WHERE user_id = v_user_id AND chest_type = p_chest_type AND opened_at IS NULL
   RETURNING * INTO v_chest;

  IF NOT FOUND THEN
    -- Soit déjà ouvert (pas de re-crédit), soit pas débloqué.
    SELECT * INTO v_chest FROM public.chest_unlocks
     WHERE user_id = v_user_id AND chest_type = p_chest_type;
    IF FOUND THEN
      RETURN jsonb_build_object('error', 'already_opened', 'chest', to_jsonb(v_chest));
    ELSE
      RETURN jsonb_build_object('error', 'not_unlocked');
    END IF;
  END IF;

  -- Crédit gemmes une seule fois (rewards immuables posés à l'unlock).
  v_gemmes := COALESCE((v_chest.rewards->>'gemmes')::int, 0);
  IF v_gemmes > 0 THEN
    PERFORM _set_trusted_op();  -- bypass protect_profile_fields gemmes check
    UPDATE profiles SET gemmes = COALESCE(gemmes, 0) + v_gemmes
     WHERE id = v_user_id
     RETURNING gemmes INTO v_balance;
  ELSE
    SELECT COALESCE(gemmes, 0) INTO v_balance FROM profiles WHERE id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'opened',       true,
    'gemmes_added', v_gemmes,
    'new_balance',  v_balance,
    'chest',        to_jsonb(v_chest)
  );
END;
$function$
;
