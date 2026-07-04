-- ═══════════════════════════════════════════════════════════════
-- La Roue — tour gratuit du jour, crédit VOLANTS serveur (anti-triche)
--
-- v1 « réelle » : 1 tour gratuit par jour et par élève, le tirage ET le
-- crédit se font CÔTÉ SERVEUR (le client ne peut ni choisir le gain ni
-- rejouer). Même chemin sanctionné que claim_competence_reward / add_gemmes
-- (_set_trusted_op → passe le trigger protect_profile_fields).
--
-- 100 % additive et réversible. Ne touche PAS aux gros lots réels
-- (disque A, heure offerte) ni au gacha cosmétique payant : ceux-là
-- attendent la config moniteur + une migration dédiée.
-- ═══════════════════════════════════════════════════════════════

-- 1. Ledger : une ligne par (élève, jour) → borne le tour gratuit à 1/jour.
CREATE TABLE IF NOT EXISTS public.roue_daily_spins (
  eleve_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  spin_date  date NOT NULL DEFAULT current_date,
  volants    integer NOT NULL,
  rarete     text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (eleve_id, spin_date)
);

ALTER TABLE public.roue_daily_spins ENABLE ROW LEVEL SECURITY;

-- Lecture self-only (l'UI vérifie si le tour du jour est déjà pris).
DROP POLICY IF EXISTS rds_select_self ON public.roue_daily_spins;
CREATE POLICY rds_select_self ON public.roue_daily_spins
  FOR SELECT TO authenticated
  USING (eleve_id = current_profile_id());

-- Aucune écriture directe : seul le RPC SECURITY DEFINER écrit ici.
REVOKE INSERT, UPDATE, DELETE ON public.roue_daily_spins FROM anon, authenticated;

-- 2. RPC : tourne la roue (tour gratuit du jour).
--    Renvoie { ok, already, volants, rarete, new_balance }.
CREATE OR REPLACE FUNCTION public.spin_roue_daily()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := current_profile_id();
  v_roll    int;
  v_reward  int;
  v_rarete  text;
  v_new     int;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Tirage pondéré CÔTÉ SERVEUR (le client ne peut pas l'influencer).
  --  50 % → 10 · 28 % → 20 · 15 % → 30 · 6 % → 50 · 1 % → 100
  v_roll := floor(random() * 100)::int;  -- 0..99
  IF    v_roll < 50 THEN v_reward := 10;  v_rarete := 'commun';
  ELSIF v_roll < 78 THEN v_reward := 20;  v_rarete := 'commun';
  ELSIF v_roll < 93 THEN v_reward := 30;  v_rarete := 'rare';
  ELSIF v_roll < 99 THEN v_reward := 50;  v_rarete := 'epique';
  ELSE                   v_reward := 100; v_rarete := 'legendaire';
  END IF;

  -- Borne 1 tour/jour : l'INSERT échoue en conflit si déjà tourné aujourd'hui.
  INSERT INTO roue_daily_spins (eleve_id, spin_date, volants, rarete)
  VALUES (v_user_id, current_date, v_reward, v_rarete)
  ON CONFLICT (eleve_id, spin_date) DO NOTHING;

  IF NOT FOUND THEN
    SELECT COALESCE(gemmes, 0) INTO v_new FROM profiles WHERE id = v_user_id;
    RETURN jsonb_build_object(
      'ok', true, 'already', true, 'volants', 0, 'new_balance', v_new
    );
  END IF;

  -- Crédit sanctionné (passe protect_profile_fields via _set_trusted_op).
  PERFORM _set_trusted_op();
  UPDATE profiles SET gemmes = COALESCE(gemmes, 0) + v_reward
   WHERE id = v_user_id
   RETURNING gemmes INTO v_new;

  RETURN jsonb_build_object(
    'ok', true, 'already', false,
    'volants', v_reward, 'rarete', v_rarete, 'new_balance', v_new
  );
END;
$$;

REVOKE ALL ON FUNCTION public.spin_roue_daily() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.spin_roue_daily() TO authenticated;
