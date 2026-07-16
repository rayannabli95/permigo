-- ═══════════════════════════════════════════════════════════════
-- 20260716220000 — Parité des récompenses pour l'élève SOLO (auto-validation)
--
-- Contexte : depuis 20260716150000_self_validations, un élève sans moniteur
-- valide ses compétences via self_validations. Le front (parcours.js) fusionne
-- ces auto-validations dans la carte de progression : un monde peut donc être
-- « complété » sans aucune ligne dans `validations`. MAIS deux RPC serveur ne
-- comptaient QUE `validations` (moniteur) :
--
--   1. unlock_chest('world_N') → eligibility_failed pour un solo qui a
--      pourtant fini le monde à l'écran → coffre affiché mais jamais
--      déblocable (ni XP ni volants de fin de monde).
--   2. claim_competence_reward → 'not_acquired' pour une compétence
--      auto-validée → jamais les +25 volants qu'un élève rattaché reçoit.
--
-- Résultat : l'élève PAYANT (Pass Permis) gagnait moins que l'élève gratuit
-- rattaché à un moniteur. Cette migration aligne les deux RPC : une
-- compétence compte comme acquise si elle l'est côté moniteur (`validations`
-- statut 'acquis') OU côté autonomie (`self_validations`, écrite uniquement
-- par la RPC self_validate_competence, seuil 80 % vérifié serveur).
--
-- L'union est volontairement NON conditionnée à profiles.enseignant_id :
-- une ligne self_validations n'a pu être créée QUE pendant une période sans
-- moniteur (garde-fou de self_validate_competence), et le front continue de
-- l'afficher comme acquise même si l'élève se rattache ensuite. Les deux
-- récompenses restent idempotentes (1 coffre par type, 1 claim par
-- compétence) : aucun double-crédit possible, aucune stat moniteur touchée.
--
-- unlock_chest est repris à l'identique de sa dernière définition versionnée
-- (_archive_legacy/0007_rpc_recovery.sql — aucune migration ultérieure ne le
-- redéfinit) ; seul le décompte du monde change. claim_competence_reward est
-- repris de 20260701210000 ; seul le test d'acquisition change.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. unlock_chest : un monde compte les acquis moniteur + auto-validés ──
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
                          'streak_7','streak_14','streak_30','perfect_quiz') THEN
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
      -- ✨ CHANGEMENT (parité solo) : une compétence est acquise si validée
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

-- ── 2. claim_competence_reward : acquis = moniteur OU auto-validée ──
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

  -- ✨ CHANGEMENT (parité solo) : la compétence doit être réellement acquise
  -- pour CET élève — validée par le moniteur OU auto-validée (quiz ≥80 %,
  -- seuil garanti par self_validate_competence).
  IF NOT EXISTS (
    SELECT 1 FROM validations
    WHERE eleve_id = v_user_id
      AND competence_id = p_competence_id
      AND statut = 'acquis'
  ) AND NOT EXISTS (
    SELECT 1 FROM self_validations
    WHERE eleve_id = v_user_id
      AND competence_id = p_competence_id
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
