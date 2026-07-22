-- ═══════════════════════════════════════════════════════════════
-- Roue « tour du jour » & claim des quêtes en heure de PARIS (au lieu d'UTC).
--
-- Problème (confirmé en prod) : le serveur Postgres tourne en UTC, l'app vit
-- en heure de Paris. Deux RPC « 1×/jour » comparaient une date stockée à
-- CURRENT_DATE (= date UTC). Entre minuit et ~02h de Paris, la date UTC est
-- encore « hier » → tout casse :
--
--   • spin_roue_daily() : l'INSERT du tour du jour utilise `current_date`
--     (UTC). Dans la fenêtre 00h→02h Paris, le tour d'AUJOURD'HUI (Paris) a
--     déjà été posé sous la date UTC de la veille → le RPC renvoie
--     {already:true, volants:0} alors que le front (date locale = Paris)
--     croyait le tour dispo. Inversement, l'élève pourrait re-tourner une 2e
--     fois « le lendemain UTC » avant le lendemain Paris.
--
--   • claim_quest() : la réclamation filtrait `quest_date = CURRENT_DATE`
--     (UTC) alors que get_today_quests() a basculé en date Paris le 10/07
--     (migration 20260710120000). Après minuit Paris, la quête complétée reste
--     datée « aujourd'hui Paris » mais le claim cherche la date UTC (encore
--     hier) → « Quête introuvable », récompense perdue à vie.
--
-- Fix (même pattern que get_today_quests / use_streak_freeze du 10/07) :
--   v_today := (now() AT TIME ZONE 'Europe/Paris')::date. Tous les élèves sont
--   en France ; le client raisonne déjà en heure locale (= Paris) → tout
--   s'aligne.
--
-- claim_quest gagne EN PLUS une fenêtre de grâce : une quête complétée hier
-- (Paris) mais jamais réclamée reste réclamable 24 h → fini les récompenses
-- perdues à minuit. L'idempotence est conservée (une ligne = 1 claim max,
-- claimed_at déjà posé → refus) et un seul enregistrement est réclamé par
-- appel (le plus récent), donc aucun double-crédit possible via cette fenêtre.
--
-- Corps de fonction repris VERBATIM de la prod (pg_get_functiondef, lecture
-- seule le 22/07/2026) — identiques au repo, aucune divergence. Seules les
-- dates et la fenêtre de grâce changent.
--
-- 100 % réversible (CREATE OR REPLACE + ALTER COLUMN SET DEFAULT).
-- ⚠️ À APPLIQUER EN PROD AVANT LE MERGE du front.
-- ═══════════════════════════════════════════════════════════════

-- ── 1) roue_daily_spins.spin_date : DEFAULT en date Paris ──
-- (le RPC pose explicitement v_today, mais on aligne aussi le DEFAULT de la
--  colonne pour toute écriture future / cohérence.)
ALTER TABLE public.roue_daily_spins
  ALTER COLUMN spin_date SET DEFAULT (now() AT TIME ZONE 'Europe/Paris')::date;

-- ── 2) spin_roue_daily() : borne « 1 tour/jour » en date Paris ──
CREATE OR REPLACE FUNCTION public.spin_roue_daily()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id  uuid := current_profile_id();
  v_today    date := (now() AT TIME ZONE 'Europe/Paris')::date;  -- ⭐ date Paris
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
  SELECT enseignant_id INTO v_mid FROM profiles WHERE id = v_user_id;
  IF v_mid IS NULL THEN
    SELECT id INTO v_mid FROM profiles
     WHERE auto_ecole_id = (SELECT auto_ecole_id FROM profiles WHERE id = v_user_id)
       AND role = 'enseignant'
     ORDER BY id LIMIT 1;
  END IF;

  IF v_mid IS NOT NULL THEN
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
      v_rate := CASE COALESCE(v_gen, 'equilibre')
                  WHEN 'eco'      THEN 4
                  WHEN 'genereux' THEN 20
                  ELSE 10
                END;
      IF floor(random() * 1000)::int < v_rate THEN
        v_win := true;
        v_lot := v_big -> floor(random() * jsonb_array_length(v_big))::int;
      END IF;
    END IF;
  END IF;

  -- ── B. Détermine l'issue du tour (gros lot OU volants) ──
  IF v_win THEN
    v_reward := 0;
    v_rarete := 'gros_lot';
  ELSE
    v_roll := floor(random() * 100)::int;
    IF    v_roll < 50 THEN v_reward := 10;  v_rarete := 'commun';
    ELSIF v_roll < 78 THEN v_reward := 20;  v_rarete := 'commun';
    ELSIF v_roll < 93 THEN v_reward := 30;  v_rarete := 'rare';
    ELSIF v_roll < 99 THEN v_reward := 50;  v_rarete := 'epique';
    ELSE                   v_reward := 100; v_rarete := 'legendaire';
    END IF;
  END IF;

  -- ── C. Réserve le tour du jour (1/jour, en date PARIS). Conflit → déjà tourné.
  INSERT INTO roue_daily_spins (eleve_id, spin_date, volants, rarete)
  VALUES (v_user_id, v_today, v_reward, v_rarete)          -- ⭐ v_today (Paris)
  ON CONFLICT (eleve_id, spin_date) DO NOTHING;

  IF NOT FOUND THEN
    SELECT COALESCE(gemmes, 0) INTO v_new FROM profiles WHERE id = v_user_id;
    RETURN jsonb_build_object('ok', true, 'already', true, 'volants', 0, 'new_balance', v_new);
  END IF;

  -- ── D. Applique l'issue ──
  IF v_win THEN
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

-- ── 3) claim_quest() : date PARIS + fenêtre de grâce hier/aujourd'hui ──
CREATE OR REPLACE FUNCTION public.claim_quest(p_quest_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_today   date := (now() AT TIME ZONE 'Europe/Paris')::date;  -- ⭐ date Paris
  v_quest   public.daily_quests_progress;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Réclame UNE SEULE ligne (la plus récente réclamable) parmi aujourd'hui OU
  -- hier (Paris) : une quête complétée hier mais jamais réclamée reste
  -- récupérable 24 h (fenêtre de grâce anti-perte à minuit). La clé
  -- (user_id, quest_id, quest_date) est unique → exactement 1 ligne mise à
  -- jour. `claimed_at IS NULL` conserve l'idempotence (concurrence incluse :
  -- le 2e appel re-teste la condition après verrou → NOT FOUND).
  UPDATE daily_quests_progress
     SET claimed_at = now()
   WHERE user_id = v_user_id
     AND quest_id = p_quest_id
     AND claimed_at IS NULL
     AND quest_date = (
       SELECT d.quest_date
         FROM daily_quests_progress d
        WHERE d.user_id = v_user_id
          AND d.quest_id = p_quest_id
          AND d.quest_date IN (v_today, v_today - 1)
          AND d.completed_at IS NOT NULL
          AND d.claimed_at IS NULL
        ORDER BY d.quest_date DESC   -- aujourd'hui d'abord, puis hier
        LIMIT 1
     )
   RETURNING * INTO v_quest;

  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_completed_or_already_claimed'); END IF;

  PERFORM _set_trusted_op();
  UPDATE profiles
     SET xp     = COALESCE(xp, 0)     + v_quest.reward_xp,
         gemmes = COALESCE(gemmes, 0) + v_quest.reward_gemmes
   WHERE id = v_user_id;

  RETURN jsonb_build_object('ok', true,
    'xp_gained', v_quest.reward_xp,
    'gemmes_gained', v_quest.reward_gemmes);
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_quest(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_quest(text) TO authenticated;
