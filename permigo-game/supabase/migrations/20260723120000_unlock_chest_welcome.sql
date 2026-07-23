-- ═══════════════════════════════════════════════════════════════
-- 20260723120000 — unlock_chest : ajout du coffre de bienvenue ('welcome')
--
-- Contexte : l'onboarding élève (src/pages/onboarding/index.js) appelle
-- unlockChest("welcome", {xp:50, gemmes:25, …}) à la fin du circuit, mais la
-- fonction prod rejette ce type (invalid_chest_type: welcome) → AUCUN nouvel
-- inscrit ne reçoit le coffre promis à l'accueil.
--
-- Fix :
--   1. La contrainte CHECK chest_unlocks_type_valid accepte 'welcome'
--      (sans elle, l'INSERT échouerait même avec la fonction corrigée).
--   2. unlock_chest accepte 'welcome' : aucune condition d'éligibilité
--      (tout élève authentifié, une seule fois — la déduplication par
--      (user_id, chest_type) existe déjà : contrainte UNIQUE + SELECT INTO
--      avant INSERT), rewards serveur immuables xp 50 / gemmes 25.
--      NB : « gemmes » est le nom technique historique (volants à l'écran)
--      — ne pas renommer.
--
-- ⚠️ Fonction recréée depuis la PROD le 23/07 (pg_get_functiondef) — la prod
-- fait foi, pas les vieilles migrations du repo. Le corps prod est identique
-- à 20260716220000_solo_rewards_parity.sql ; seuls les ajouts 'welcome'
-- ci-dessous changent. Le crédit à l'ouverture (open_chest + trigger
-- trg_credit_xp_on_chest_open) lit la row rewards : aucun autre objet à
-- modifier.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Contrainte CHECK : 'welcome' devient un type de coffre valide ──
ALTER TABLE public.chest_unlocks
  DROP CONSTRAINT IF EXISTS chest_unlocks_type_valid;
ALTER TABLE public.chest_unlocks
  ADD CONSTRAINT chest_unlocks_type_valid
  CHECK (chest_type = ANY (ARRAY['world_1'::text, 'world_2'::text,
                                 'world_3'::text, 'world_4'::text,
                                 'streak_7'::text, 'streak_14'::text,
                                 'streak_30'::text, 'perfect_quiz'::text,
                                 'welcome'::text]));

-- ── 2. unlock_chest : accepte 'welcome' (sans condition d'éligibilité) ──
CREATE OR REPLACE FUNCTION public.unlock_chest(p_chest_type text, p_rewards jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_chest   public.chest_unlocks;
  v_safe_rewards jsonb;
  v_longest_streak int;
  v_n_validations  int;
  v_n_perfect_quiz int;
  v_world_num      int;
  v_n_comp_world   int;
  v_n_comp_acquired int;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_chest_type NOT IN ('world_1','world_2','world_3','world_4',
                          'streak_7','streak_14','streak_30','perfect_quiz',
                          'welcome') THEN
    RAISE EXCEPTION 'invalid_chest_type: %', p_chest_type;
  END IF;

  -- Validation côté serveur du seuil métier
  CASE p_chest_type
    WHEN 'streak_7' THEN
      SELECT COALESCE(longest_streak, 0) INTO v_longest_streak FROM streaks WHERE user_id = v_user_id;
      IF v_longest_streak < 7 THEN
        RAISE EXCEPTION 'eligibility_failed' USING DETAIL = 'Streak max requis : 7 jours. Actuel : ' || v_longest_streak;
      END IF;
    WHEN 'streak_14' THEN
      SELECT COALESCE(longest_streak, 0) INTO v_longest_streak FROM streaks WHERE user_id = v_user_id;
      IF v_longest_streak < 14 THEN
        RAISE EXCEPTION 'eligibility_failed' USING DETAIL = 'Streak max requis : 14 jours. Actuel : ' || v_longest_streak;
      END IF;
    WHEN 'streak_30' THEN
      SELECT COALESCE(longest_streak, 0) INTO v_longest_streak FROM streaks WHERE user_id = v_user_id;
      IF v_longest_streak < 30 THEN
        RAISE EXCEPTION 'eligibility_failed' USING DETAIL = 'Streak max requis : 30 jours. Actuel : ' || v_longest_streak;
      END IF;
    WHEN 'perfect_quiz' THEN
      SELECT COUNT(*) INTO v_n_perfect_quiz FROM quiz_attempts
        WHERE user_id = v_user_id AND score = 100;
      IF v_n_perfect_quiz < 1 THEN
        RAISE EXCEPTION 'eligibility_failed' USING DETAIL = 'Au moins 1 quiz 100% requis.';
      END IF;
    WHEN 'world_1', 'world_2', 'world_3', 'world_4' THEN
      v_world_num := CAST(substring(p_chest_type FROM 'world_(\d)') AS int);
      SELECT COUNT(*) INTO v_n_comp_world FROM competences_remc WHERE monde = v_world_num;
      -- Parité solo (20260716220000) : une compétence est acquise si validée
      -- par le moniteur OU auto-validée (élève sans moniteur, quiz ≥80 %).
      SELECT COUNT(*) INTO v_n_comp_acquired
        FROM competences_remc c
        WHERE c.monde = v_world_num
          AND (
            EXISTS (
              SELECT 1 FROM validations v
              WHERE v.eleve_id = v_user_id AND v.competence_id = c.id AND v.statut = 'acquis'
            )
            OR EXISTS (
              SELECT 1 FROM self_validations sv
              WHERE sv.eleve_id = v_user_id AND sv.competence_id = c.id
            )
          );
      IF v_n_comp_acquired < v_n_comp_world THEN
        RAISE EXCEPTION 'eligibility_failed' USING DETAIL = format('Monde %s : %s/%s compétences acquises',
                                                                  v_world_num, v_n_comp_acquired, v_n_comp_world);
      END IF;
    WHEN 'welcome' THEN
      -- ✨ Coffre de bienvenue : aucune condition — tout élève authentifié,
      -- une seule fois (dédup (user_id, chest_type) ci-dessous).
      NULL;
  END CASE;

  -- Rewards immuables (server-side, ignore p_rewards)
  v_safe_rewards := CASE p_chest_type
    WHEN 'world_1'      THEN jsonb_build_object('xp', 200, 'gemmes', 50,  'title', 'Maître Monde 1')
    WHEN 'world_2'      THEN jsonb_build_object('xp', 400, 'gemmes', 100, 'title', 'Maître Monde 2')
    WHEN 'world_3'      THEN jsonb_build_object('xp', 700, 'gemmes', 175, 'title', 'Maître Monde 3')
    WHEN 'world_4'      THEN jsonb_build_object('xp', 1200,'gemmes', 300, 'title', 'Maître Monde 4')
    WHEN 'streak_7'     THEN jsonb_build_object('xp', 150, 'gemmes', 30,  'title', 'Persévérant')
    WHEN 'streak_14'    THEN jsonb_build_object('xp', 350, 'gemmes', 80,  'title', 'Constant')
    WHEN 'streak_30'    THEN jsonb_build_object('xp', 800, 'gemmes', 200, 'title', 'Inarrêtable')
    WHEN 'perfect_quiz' THEN jsonb_build_object('xp', 100, 'gemmes', 25,  'title', 'Précision')
    WHEN 'welcome'      THEN jsonb_build_object('xp', 50, 'gemmes', 25, 'title', 'Bienvenue dans PermiGo !')
  END;

  SELECT * INTO v_chest FROM public.chest_unlocks WHERE user_id = v_user_id AND chest_type = p_chest_type;
  IF FOUND THEN RETURN jsonb_build_object('already_unlocked', true, 'chest', to_jsonb(v_chest)); END IF;

  INSERT INTO public.chest_unlocks (user_id, chest_type, rewards)
  VALUES (v_user_id, p_chest_type, v_safe_rewards) RETURNING * INTO v_chest;

  RETURN jsonb_build_object('unlocked', true, 'chest', to_jsonb(v_chest));
END;
$function$;

REVOKE ALL ON FUNCTION public.unlock_chest(text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.unlock_chest(text, jsonb) TO authenticated;
