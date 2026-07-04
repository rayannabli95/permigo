-- ═══════════════════════════════════════════════════════════════
-- Tirage des GROS LOTS réels — la roue peut (rarement) faire gagner un vrai
-- lot défini par le moniteur, en plus des volants.
--
-- Règles produit (validées) :
--  • Seuls les lots marqués « gros lot » (flag big=true) par le moniteur sont
--    mis en jeu. Tant que le moniteur n'en active aucun → la roue ne donne que
--    des volants (comportement inchangé).
--  • Plafond DUR : au plus 1 gros lot par élève tous les 3 mois (trimestre).
--  • Rareté pilotée par la « générosité » du moniteur (eco/equilibre/genereux).
--  • Le tirage ET l'enregistrement se font CÔTÉ SERVEUR (impossible à tricher /
--    rejouer). Même tour gratuit du jour que spin_roue_daily (1/jour).
--  • L'élève gagne un CODE de retrait à montrer à son moniteur, qui le marque
--    « remis ». Aucun paiement élève, volants jamais vendus : PermiGo n'est que
--    le canal, le lot est un geste du moniteur.
--
-- 100 % additive et réversible.
-- ═══════════════════════════════════════════════════════════════

-- 1. Journal des gros lots gagnés (source de vérité + preuve de retrait).
CREATE TABLE IF NOT EXISTS public.gros_lot_wins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  moniteur_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lot_key     text,
  lot_label   text NOT NULL,
  lot_icon    text,
  claim_code  text NOT NULL UNIQUE,
  status      text NOT NULL DEFAULT 'a_remettre',  -- a_remettre | remis | annule
  won_at      timestamptz NOT NULL DEFAULT now(),
  remis_at    timestamptz
);

ALTER TABLE public.gros_lot_wins ENABLE ROW LEVEL SECURITY;

-- L'élève lit SES gains ; le moniteur lit ceux qu'il doit honorer.
DROP POLICY IF EXISTS glw_select_eleve ON public.gros_lot_wins;
CREATE POLICY glw_select_eleve ON public.gros_lot_wins
  FOR SELECT TO authenticated
  USING (eleve_id = current_profile_id());

DROP POLICY IF EXISTS glw_select_moniteur ON public.gros_lot_wins;
CREATE POLICY glw_select_moniteur ON public.gros_lot_wins
  FOR SELECT TO authenticated
  USING (moniteur_id = current_profile_id());

-- Aucune écriture directe : seuls les RPC SECURITY DEFINER écrivent.
REVOKE INSERT, UPDATE, DELETE ON public.gros_lot_wins FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS glw_eleve_idx    ON public.gros_lot_wins (eleve_id, won_at DESC);
CREATE INDEX IF NOT EXISTS glw_moniteur_idx ON public.gros_lot_wins (moniteur_id, status, won_at DESC);

-- 2. spin_roue_daily() — on ajoute la tentative de gros lot AVANT le tirage
--    des volants. Le tour reste 1/jour, borné par l'INSERT dans roue_daily_spins.
CREATE OR REPLACE FUNCTION public.spin_roue_daily()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id  uuid := current_profile_id();
  v_roll     int;
  v_reward   int;
  v_rarete   text;
  v_new      int;
  -- gros lot
  v_mid      uuid;
  v_prenom   text;
  v_gen      text;
  v_big      jsonb;   -- lots activés ET marqués « gros lot »
  v_lot      jsonb;   -- le lot tiré
  v_rate     int;     -- proba /1000 selon la générosité
  v_code     text;
  v_win      boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- ── A. Peut-on tenter un gros lot ? ──
  -- Trouve le moniteur (lien explicite, fallback auto-école — même logique que
  -- get_moniteur_rewards).
  SELECT enseignant_id INTO v_mid FROM profiles WHERE id = v_user_id;
  IF v_mid IS NULL THEN
    SELECT id INTO v_mid FROM profiles
     WHERE auto_ecole_id = (SELECT auto_ecole_id FROM profiles WHERE id = v_user_id)
       AND role = 'enseignant'
     ORDER BY id LIMIT 1;
  END IF;

  IF v_mid IS NOT NULL THEN
    -- lots activés ET marqués « gros lot »
    SELECT COALESCE(jsonb_agg(e), '[]'::jsonb), MAX(mrc.generosite)
      INTO v_big, v_gen
      FROM moniteur_reward_config mrc,
           LATERAL jsonb_array_elements(mrc.lots) e
     WHERE mrc.moniteur_id = v_mid
       AND (e->>'enabled')::boolean IS TRUE
       AND (e->>'big')::boolean IS TRUE;

    -- Plafond DUR : rien gagné sur les 3 derniers mois (statut non annulé).
    IF v_big IS NOT NULL AND jsonb_array_length(v_big) > 0
       AND NOT EXISTS (
         SELECT 1 FROM gros_lot_wins
          WHERE eleve_id = v_user_id
            AND status <> 'annule'
            AND won_at > now() - interval '3 months'
       )
    THEN
      -- rareté /1000 selon la générosité (défaut = équilibré)
      v_rate := CASE COALESCE(v_gen, 'equilibre')
                  WHEN 'eco'      THEN 4    -- 0,4 %  (~très rare)
                  WHEN 'genereux' THEN 20   -- 2,0 %  (plafonné à 1/trimestre)
                  ELSE 10                    -- 1,0 %  équilibré ≈ 1/trimestre
                END;
      IF floor(random() * 1000)::int < v_rate THEN
        v_win := true;
        -- lot tiré au hasard parmi les gros lots activés
        v_lot := v_big -> floor(random() * jsonb_array_length(v_big))::int;
      END IF;
    END IF;
  END IF;

  -- ── B. Détermine l'issue du tour (gros lot OU volants) ──
  IF v_win THEN
    v_reward := 0;
    v_rarete := 'gros_lot';
  ELSE
    -- Tirage pondéré des volants (inchangé) :
    --  50 % → 10 · 28 % → 20 · 15 % → 30 · 6 % → 50 · 1 % → 100
    v_roll := floor(random() * 100)::int;
    IF    v_roll < 50 THEN v_reward := 10;  v_rarete := 'commun';
    ELSIF v_roll < 78 THEN v_reward := 20;  v_rarete := 'commun';
    ELSIF v_roll < 93 THEN v_reward := 30;  v_rarete := 'rare';
    ELSIF v_roll < 99 THEN v_reward := 50;  v_rarete := 'epique';
    ELSE                   v_reward := 100; v_rarete := 'legendaire';
    END IF;
  END IF;

  -- ── C. Réserve le tour du jour (1/jour). En conflit → déjà tourné. ──
  INSERT INTO roue_daily_spins (eleve_id, spin_date, volants, rarete)
  VALUES (v_user_id, current_date, v_reward, v_rarete)
  ON CONFLICT (eleve_id, spin_date) DO NOTHING;

  IF NOT FOUND THEN
    SELECT COALESCE(gemmes, 0) INTO v_new FROM profiles WHERE id = v_user_id;
    RETURN jsonb_build_object('ok', true, 'already', true, 'volants', 0, 'new_balance', v_new);
  END IF;

  -- ── D. Applique l'issue ──
  IF v_win THEN
    -- code de retrait unique et lisible (ex PG-7F3K2)
    v_code := 'PG-' || upper(substr(md5(random()::text || clock_timestamp()::text || v_user_id::text), 1, 5));
    SELECT prenom INTO v_prenom FROM profiles WHERE id = v_mid;
    INSERT INTO gros_lot_wins (eleve_id, moniteur_id, lot_key, lot_label, lot_icon, claim_code)
    VALUES (v_user_id, v_mid, v_lot->>'key', v_lot->>'label', v_lot->>'icon', v_code);

    SELECT COALESCE(gemmes, 0) INTO v_new FROM profiles WHERE id = v_user_id;
    RETURN jsonb_build_object(
      'ok', true, 'already', false, 'volants', 0, 'rarete', 'gros_lot',
      'gros_lot', jsonb_build_object(
        'label', v_lot->>'label', 'icon', v_lot->>'icon',
        'claim_code', v_code, 'moniteur', v_prenom
      ),
      'new_balance', v_new
    );
  END IF;

  -- Crédit volants sanctionné (passe protect_profile_fields via _set_trusted_op).
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

-- 3. RPC moniteur : les gros lots gagnés par ses élèves (à remettre en premier).
CREATE OR REPLACE FUNCTION public.get_my_lot_wins()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_id uuid := current_profile_id(); v_out jsonb;
BEGIN
  IF v_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT COALESCE(jsonb_agg(row ORDER BY pri, won_at DESC), '[]'::jsonb) INTO v_out
  FROM (
    SELECT
      jsonb_build_object(
        'claim_code', w.claim_code,
        'lot_label', w.lot_label,
        'lot_icon', w.lot_icon,
        'eleve', COALESCE(p.prenom, 'Un élève'),
        'status', w.status,
        'won_at', w.won_at
      ) AS row,
      CASE w.status WHEN 'a_remettre' THEN 0 ELSE 1 END AS pri,
      w.won_at
    FROM gros_lot_wins w
    LEFT JOIN profiles p ON p.id = w.eleve_id
    WHERE w.moniteur_id = v_id
    ORDER BY pri, w.won_at DESC
    LIMIT 60
  ) t;
  RETURN v_out;
END;
$$;

-- 4. RPC moniteur : marquer un gros lot « remis ».
CREATE OR REPLACE FUNCTION public.mark_lot_win_remis(p_claim_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_id uuid := current_profile_id(); v_n int;
BEGIN
  IF v_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  UPDATE gros_lot_wins
     SET status = 'remis', remis_at = now()
   WHERE moniteur_id = v_id
     AND claim_code = p_claim_code
     AND status = 'a_remettre';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('ok', v_n > 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_lot_wins()             FROM public, anon;
REVOKE ALL ON FUNCTION public.mark_lot_win_remis(text)      FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_lot_wins()          TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_lot_win_remis(text)   TO authenticated;
