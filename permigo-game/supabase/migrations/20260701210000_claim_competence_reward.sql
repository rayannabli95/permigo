-- ═══════════════════════════════════════════════════════════════
-- Récompense volants par compétence — crédit SERVEUR idempotent
--
-- Problème réglé : le client écrivait profiles.gemmes en direct
-- (bloqué silencieusement par le trigger protect_profile_fields) →
-- les +25 volants d'une validation n'étaient JAMAIS persistés.
--
-- Ce que fait cette migration (100 % additive, réversible) :
--   1. Table ledger competence_rewards_granted : UNE récompense par
--      (élève, compétence) — anti double-crédit, multi-appareils OK.
--   2. RPC claim_competence_reward(p_competence_id) SECURITY DEFINER :
--      vérifie que la compétence est réellement « acquis » pour l'élève
--      courant, crédite UNE fois via le chemin sanctionné
--      (_set_trusted_op, même pattern que add_gemmes/open_chest),
--      renvoie { ok, already_claimed, granted, new_balance }.
--
-- PAS de rétro-crédit automatique des compétences déjà acquises :
-- le crédit part du flux de célébration (décision produit à part).
-- ═══════════════════════════════════════════════════════════════

-- 1. Ledger idempotent
CREATE TABLE IF NOT EXISTS public.competence_rewards_granted (
  eleve_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  competence_id text NOT NULL,
  volants       integer NOT NULL,
  granted_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (eleve_id, competence_id)
);

ALTER TABLE public.competence_rewards_granted ENABLE ROW LEVEL SECURITY;

-- Lecture self-only (debug/UI). AUCUNE policy d'écriture : seul le RPC
-- SECURITY DEFINER écrit dans ce ledger.
DROP POLICY IF EXISTS crg_select_self ON public.competence_rewards_granted;
CREATE POLICY crg_select_self ON public.competence_rewards_granted
  FOR SELECT TO authenticated
  USING (eleve_id = current_profile_id());

-- Ceinture + bretelles : pas d'écriture directe même hors RLS grants.
REVOKE INSERT, UPDATE, DELETE ON public.competence_rewards_granted
  FROM anon, authenticated;

-- 2. RPC de claim idempotent
CREATE OR REPLACE FUNCTION public.claim_competence_reward(p_competence_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := current_profile_id();
  v_reward  int  := 25;  -- = COMPETENCE_VOLANT_REWARD côté client
  v_new     int;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- La compétence doit être réellement acquise pour CET élève.
  IF NOT EXISTS (
    SELECT 1 FROM validations
    WHERE eleve_id = v_user_id
      AND competence_id = p_competence_id
      AND statut = 'acquis'
  ) THEN
    RETURN jsonb_build_object('error', 'not_acquired');
  END IF;

  -- Idempotence : une seule récompense par (élève, compétence).
  INSERT INTO competence_rewards_granted (eleve_id, competence_id, volants)
  VALUES (v_user_id, p_competence_id, v_reward)
  ON CONFLICT (eleve_id, competence_id) DO NOTHING;

  IF NOT FOUND THEN
    -- Déjà réclamée (autre appareil / ré-affichage) : zéro re-crédit.
    SELECT COALESCE(gemmes, 0) INTO v_new FROM profiles WHERE id = v_user_id;
    RETURN jsonb_build_object(
      'ok', true, 'already_claimed', true, 'granted', 0, 'new_balance', v_new
    );
  END IF;

  -- Crédit sanctionné (passe le trigger protect_profile_fields).
  PERFORM _set_trusted_op();
  UPDATE profiles SET gemmes = COALESCE(gemmes, 0) + v_reward
   WHERE id = v_user_id
   RETURNING gemmes INTO v_new;

  RETURN jsonb_build_object(
    'ok', true, 'already_claimed', false, 'granted', v_reward, 'new_balance', v_new
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_competence_reward(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_competence_reward(text) TO authenticated;
