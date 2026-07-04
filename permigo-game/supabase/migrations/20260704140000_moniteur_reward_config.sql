-- ═══════════════════════════════════════════════════════════════
-- Récompenses moniteur — le moniteur choisit les lots offerts à ses élèves
--
-- Le moniteur (enseignant) configure SES lots (presets + lots perso avec
-- icône) et sa générosité. L'élève lit, via un RPC, les lots ACTIVÉS de
-- son moniteur (rattachement par auto_ecole_id) → panneau « gros lots
-- réels » personnalisé et signé à la marque du moniteur.
--
-- 100 % additive. Ne débite/crédite RIEN : c'est de la CONFIG. Le tirage
-- des gros lots (coût, plafond mensuel, remise du lot) reste à construire.
-- ═══════════════════════════════════════════════════════════════

-- Presets par défaut (servent au 1er affichage tant que le moniteur n'a
-- rien configuré). Le disque A et l'heure sont ON ; le pack (payant) OFF.
CREATE OR REPLACE FUNCTION public._default_reward_lots()
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT '[
    {"key":"disque_a","label":"Disque A jeune conducteur","icon":"🅰️","kind":"preset","enabled":true},
    {"key":"heure_conduite","label":"1 heure de conduite offerte","icon":"🚗","kind":"preset","enabled":true},
    {"key":"pack_securite","label":"Pack ampoules + éthylotest","icon":"🧰","kind":"preset","enabled":false}
  ]'::jsonb;
$$;

CREATE TABLE IF NOT EXISTS public.moniteur_reward_config (
  moniteur_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  lots        jsonb NOT NULL DEFAULT '[]'::jsonb,
  generosite  text  NOT NULL DEFAULT 'equilibre',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.moniteur_reward_config ENABLE ROW LEVEL SECURITY;

-- Le moniteur lit SA config (l'écriture passe par le RPC SECURITY DEFINER).
DROP POLICY IF EXISTS mrc_select_self ON public.moniteur_reward_config;
CREATE POLICY mrc_select_self ON public.moniteur_reward_config
  FOR SELECT TO authenticated
  USING (moniteur_id = current_profile_id());

REVOKE INSERT, UPDATE, DELETE ON public.moniteur_reward_config FROM anon, authenticated;

-- ── RPC moniteur : lire sa config (ou les presets par défaut) ──
CREATE OR REPLACE FUNCTION public.get_my_reward_config()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $$
DECLARE v_id uuid := current_profile_id(); v_lots jsonb; v_gen text;
BEGIN
  IF v_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT lots, generosite INTO v_lots, v_gen
    FROM moniteur_reward_config WHERE moniteur_id = v_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('lots', _default_reward_lots(), 'generosite', 'equilibre', 'configured', false);
  END IF;
  RETURN jsonb_build_object('lots', v_lots, 'generosite', v_gen, 'configured', true);
END; $$;

-- ── RPC moniteur : enregistrer sa config ──
CREATE OR REPLACE FUNCTION public.set_my_reward_config(p_lots jsonb, p_generosite text DEFAULT 'equilibre')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $$
DECLARE v_id uuid := current_profile_id();
BEGIN
  IF v_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF get_my_role() <> 'enseignant' THEN
    RETURN jsonb_build_object('error', 'not_moniteur');
  END IF;
  IF jsonb_typeof(p_lots) <> 'array' OR jsonb_array_length(p_lots) > 30 THEN
    RETURN jsonb_build_object('error', 'invalid_lots');
  END IF;
  IF p_generosite NOT IN ('eco','equilibre','genereux') THEN
    p_generosite := 'equilibre';
  END IF;
  INSERT INTO moniteur_reward_config (moniteur_id, lots, generosite, updated_at)
  VALUES (v_id, p_lots, p_generosite, now())
  ON CONFLICT (moniteur_id) DO UPDATE
    SET lots = EXCLUDED.lots, generosite = EXCLUDED.generosite, updated_at = now();
  RETURN jsonb_build_object('ok', true);
END; $$;

-- ── RPC élève : les lots ACTIVÉS de son moniteur ──
-- Lien explicite profiles.enseignant_id (le moniteur qui suit l'élève) ;
-- fallback sur un enseignant de l'auto-école si le lien manque.
CREATE OR REPLACE FUNCTION public.get_moniteur_rewards()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $$
DECLARE v_me uuid := current_profile_id(); v_mid uuid; v_prenom text; v_lots jsonb;
BEGIN
  IF v_me IS NULL THEN
    RETURN jsonb_build_object('lots', '[]'::jsonb, 'moniteur', NULL);
  END IF;
  SELECT enseignant_id INTO v_mid FROM profiles WHERE id = v_me;
  IF v_mid IS NULL THEN
    SELECT id INTO v_mid FROM profiles
     WHERE auto_ecole_id = (SELECT auto_ecole_id FROM profiles WHERE id = v_me)
       AND role = 'enseignant'
     ORDER BY id LIMIT 1;
  END IF;
  IF v_mid IS NULL THEN
    RETURN jsonb_build_object('lots', '[]'::jsonb, 'moniteur', NULL);
  END IF;
  SELECT prenom INTO v_prenom FROM profiles WHERE id = v_mid;
  SELECT lots INTO v_lots FROM moniteur_reward_config WHERE moniteur_id = v_mid;
  IF v_lots IS NULL THEN v_lots := _default_reward_lots(); END IF;
  -- ne garde que les lots activés
  SELECT COALESCE(jsonb_agg(e), '[]'::jsonb) INTO v_lots
    FROM jsonb_array_elements(v_lots) e
   WHERE (e->>'enabled')::boolean IS TRUE;
  RETURN jsonb_build_object('lots', v_lots, 'moniteur', v_prenom);
END; $$;

REVOKE ALL ON FUNCTION public.get_my_reward_config()               FROM public, anon;
REVOKE ALL ON FUNCTION public.set_my_reward_config(jsonb, text)    FROM public, anon;
REVOKE ALL ON FUNCTION public.get_moniteur_rewards()               FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_reward_config()            TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_my_reward_config(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_moniteur_rewards()            TO authenticated;
