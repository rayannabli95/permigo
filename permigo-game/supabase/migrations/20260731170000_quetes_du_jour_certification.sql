-- ═══════════════════════════════════════════════════════════════
-- Quête du jour : une seule, et la certification compte ENFIN
--
-- Trois choses, dont un bug silencieux :
--
-- 1) 🔴 La quête « compétence » était IMPOSSIBLE à terminer. Son déclencheur
--    écoute la table `validations` — celle du moniteur. Depuis le retrait du
--    canal moniteur (#608 et suivants), plus personne n'y écrit : l'élève
--    certifie lui-même dans `self_validations`. La barre restait donc à 0/1
--    quoi que fasse l'élève. → nouveau déclencheur sur `self_validations`.
--
-- 2) UNE seule quête par jour : « Certifier une compétence ». La quête quiz
--    poussait vers le quiz nu, que l'élève fuit ; « Se connecter aujourd'hui »
--    se réclamait pour être simplement là et alourdissait la carte pour rien
--    (décision Rayan 31/07 : « ça fait trop lourd en texte »). Le rendez-vous
--    quotidien récompensé existe déjà ailleurs : la roue de Récompenses.
--
-- 3) Les deux déclencheurs cherchaient la ligne du jour avec CURRENT_DATE
--    (UTC) alors que get_today_quests la crée en heure de Paris. Entre minuit
--    et 2 h du matin, la progression visait une ligne qui n'existait pas.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Le déclencheur qui manquait : la certification autonome ────────────
CREATE OR REPLACE FUNCTION public.advance_quest_certification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- L'ON CONFLICT DO UPDATE de self_validate_competence ne touche que le
  -- score (l'élève a refait le quiz mieux) : ce n'est pas une nouvelle
  -- certification, on ne recompte pas.
  IF TG_OP = 'UPDATE' AND OLD.validated_at IS NOT DISTINCT FROM NEW.validated_at THEN
    RETURN NEW;
  END IF;

  UPDATE daily_quests_progress
     SET progress = LEAST(progress + 1, target),
         completed_at = CASE WHEN progress + 1 >= target
                             THEN COALESCE(completed_at, now())
                             ELSE completed_at END
   WHERE user_id = NEW.eleve_id
     AND quest_date = (now() AT TIME ZONE 'Europe/Paris')::date
     AND quest_id = 'quest_validate_1'
     AND completed_at IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_advance_quest_certification ON public.self_validations;
CREATE TRIGGER trg_advance_quest_certification
AFTER INSERT OR UPDATE ON public.self_validations
FOR EACH ROW EXECUTE FUNCTION public.advance_quest_certification();

-- ── 2. Même correction de date sur le déclencheur moniteur ────────────────
-- (il ne sert plus qu'aux comptes rattachés dont le moniteur a validé avant
-- le retrait, mais tant qu'il existe autant qu'il vise le bon jour)
CREATE OR REPLACE FUNCTION public.advance_quest_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.statut = 'acquis' AND NEW.eleve_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.statut IS DISTINCT FROM 'acquis') THEN
    UPDATE daily_quests_progress
       SET progress = LEAST(progress + 1, target),
           completed_at = CASE WHEN progress + 1 >= target
                               THEN COALESCE(completed_at, now())
                               ELSE completed_at END
     WHERE user_id = NEW.eleve_id
       AND quest_date = (now() AT TIME ZONE 'Europe/Paris')::date
       AND quest_id = 'quest_validate_1'
       AND completed_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 3. Une quête par jour, et le mot juste ───────────────────────────────
-- « Certifier » et non « Valider » : depuis le pivot, c'est l'élève qui
-- certifie, le moniteur ne valide plus rien.
CREATE OR REPLACE FUNCTION public.get_today_quests()
RETURNS TABLE(quest_id text, title text, target integer, progress integer,
              completed boolean, claimed boolean, reward_xp integer,
              reward_gemmes integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
#variable_conflict use_column
DECLARE
  v_user_id   uuid := current_profile_id();
  v_existing  int;
  v_today     date := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_last      date;
  v_cur       int;
  v_new       int;
  v_did_quiz  boolean;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT COUNT(*) INTO v_existing
    FROM daily_quests_progress
   WHERE user_id = v_user_id
     AND quest_date = v_today
     AND quest_id = 'quest_validate_1';

  IF v_existing < 1 THEN
    INSERT INTO daily_quests_progress (user_id, quest_date, quest_id, target, reward_xp, reward_gemmes)
    VALUES (v_user_id, v_today, 'quest_validate_1', 1, 50, 20)
    ON CONFLICT (user_id, quest_date, quest_id) DO NOTHING;
  END IF;

  -- Série (inchangé) : une activité quiz dans la journée entretient la série.
  SELECT current_streak, last_activity_date INTO v_cur, v_last
    FROM streaks WHERE user_id = v_user_id;

  IF v_last IS DISTINCT FROM v_today THEN
    SELECT EXISTS (
      SELECT 1 FROM quiz_attempts
       WHERE user_id = v_user_id
         AND (completed_at AT TIME ZONE 'Europe/Paris')::date = v_today
    ) INTO v_did_quiz;

    IF v_did_quiz THEN
      IF v_last = v_today - 1 THEN
        v_new := COALESCE(v_cur, 0) + 1;
      ELSE
        v_new := 1;
      END IF;

      IF EXISTS (SELECT 1 FROM streaks WHERE user_id = v_user_id) THEN
        UPDATE streaks
           SET current_streak     = v_new,
               longest_streak     = GREATEST(longest_streak, v_new),
               last_activity_date = v_today
         WHERE user_id = v_user_id;
      ELSE
        INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date)
        VALUES (v_user_id, v_new, v_new, v_today);
      END IF;
    END IF;
  END IF;

  -- Filtre sur la seule quête active : les élèves qui ont déjà reçu leurs
  -- lignes « connexion » et « quiz » aujourd'hui ne les voient pas traîner un
  -- jour de plus. Les anciennes lignes restent en base (aucune donnée effacée,
  -- et les récompenses déjà réclamées le restent).
  RETURN QUERY
  SELECT
    dq.quest_id,
    CASE dq.quest_id
      WHEN 'quest_validate_1' THEN 'Certifier une compétence'
      ELSE dq.quest_id
    END AS title,
    dq.target,
    dq.progress,
    (dq.completed_at IS NOT NULL) AS completed,
    (dq.claimed_at IS NOT NULL) AS claimed,
    dq.reward_xp,
    dq.reward_gemmes
  FROM daily_quests_progress dq
  WHERE dq.user_id = v_user_id
    AND dq.quest_date = v_today
    AND dq.quest_id = 'quest_validate_1';
END;
$$;
