-- ═══════════════════════════════════════════════════════════════
-- ⚠️ À RELIRE + APPLIQUER MANUELLEMENT (Rayan). Correctifs PRÉ-LANCEMENT.
-- Généré par l'audit night-run (bodies tirés de la prod via pg_get_functiondef).
--
-- A) 🔴 IDOR — 4 fonctions SECURITY DEFINER renvoyaient les données d'un élève
--    à partir d'un p_eleve_id SANS vérifier que l'appelant a le droit.
--    N'importe quel utilisateur connecté pouvait lire les données d'un AUTRE
--    élève (dont prénom+nom et notes privées du moniteur) en passant son UUID.
--    Fix : garde d'accès (l'élève lui-même OU staff de la même auto-école).
--      - get_bilan_data, get_coaching_tip, predict_exam_ready_date
--      - get_eleve_tags (staff de la même école UNIQUEMENT — notes privées)
--
-- B) 🔴 Moteur streak/quêtes cassé pour tout élève récurrent.
--    get_today_quests fait INSERT (current_streak=v_new>1) ON CONFLICT DO UPDATE.
--    Le trigger anti-triche protect_streaks_fields se déclenche sur l'INSERT
--    proposé (avant le passage en UPDATE) et lève « cannot self-inject streak > 1 ».
--    Résultat : la série et les quêtes du jour ne se créent jamais (retention morte).
--    Fix : UPDATE si la ligne existe (le guard autorise +1), sinon INSERT à 1.
--
-- Signatures INCHANGÉES. Les grants existants sont conservés par CREATE OR REPLACE.
-- ═══════════════════════════════════════════════════════════════


-- ─── Helper d'autorisation : l'appelant peut-il accéder à cet élève ? ───
-- Vrai si : l'appelant EST l'élève, OU est enseignant/gérant de la MÊME auto-école.
CREATE OR REPLACE FUNCTION public.can_access_eleve(p_eleve_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    current_profile_id() = p_eleve_id
    OR EXISTS (
      SELECT 1
      FROM profiles caller
      JOIN profiles target ON target.id = p_eleve_id
      WHERE caller.id = current_profile_id()
        AND caller.role IN ('enseignant','gerant')
        AND caller.auto_ecole_id IS NOT NULL
        AND caller.auto_ecole_id = target.auto_ecole_id
    );
$function$;
REVOKE ALL ON FUNCTION public.can_access_eleve(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_eleve(uuid) TO authenticated;


-- ════════════ A) IDOR FIXES ════════════

-- 1. get_bilan_data — ajout de la garde d'accès en tête.
CREATE OR REPLACE FUNCTION public.get_bilan_data(p_eleve_id uuid, p_trimestre_start timestamp with time zone DEFAULT date_trunc('quarter'::text, now()))
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_trimestre_end timestamptz := p_trimestre_start + interval '3 months';
  v_eleve         record;
  v_acquises_now  int;
  v_acquises_trim int;
  v_quiz_total    int;
  v_quiz_reussis  int;
  v_score_avg     numeric;
  v_days_active   int;
  v_days_total    int;
  v_by_monde      jsonb;
  v_evolution     jsonb;
  v_comment       text;
BEGIN
  -- 🔒 garde d'accès (self ou staff même école)
  IF NOT public.can_access_eleve(p_eleve_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT id, prenom, nom, created_at INTO v_eleve
    FROM profiles WHERE id = p_eleve_id AND role = 'eleve';
  IF v_eleve.id IS NULL THEN
    RETURN jsonb_build_object('error', 'eleve_not_found');
  END IF;

  SELECT COUNT(DISTINCT competence_id) INTO v_acquises_now FROM validations
    WHERE eleve_id = p_eleve_id AND statut = 'acquis';

  SELECT COUNT(DISTINCT competence_id) INTO v_acquises_trim FROM validations
    WHERE eleve_id = p_eleve_id AND statut = 'acquis'
      AND validated_at >= p_trimestre_start AND validated_at < v_trimestre_end;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE score >= 70), ROUND(AVG(score)::numeric, 1)
    INTO v_quiz_total, v_quiz_reussis, v_score_avg
    FROM quiz_attempts
    WHERE user_id = p_eleve_id
      AND completed_at >= p_trimestre_start AND completed_at < v_trimestre_end;

  SELECT COUNT(DISTINCT activity_day) INTO v_days_active FROM (
    SELECT date_trunc('day', completed_at) AS activity_day
      FROM quiz_attempts
     WHERE user_id = p_eleve_id
       AND completed_at >= p_trimestre_start AND completed_at < v_trimestre_end
    UNION
    SELECT date_trunc('day', validated_at) AS activity_day
      FROM validations
     WHERE eleve_id = p_eleve_id
       AND validated_at >= p_trimestre_start AND validated_at < v_trimestre_end
  ) AS all_activity;

  v_days_total := EXTRACT(DAY FROM (LEAST(v_trimestre_end, now()) - p_trimestre_start))::int;

  WITH acquired AS (
    SELECT competence_id, MIN(validated_at) AS validated_at
      FROM validations
     WHERE eleve_id = p_eleve_id AND statut = 'acquis'
     GROUP BY competence_id
  ),
  world_breakdown AS (
    SELECT LEFT(competence_id, 2) AS monde,
           jsonb_agg(jsonb_build_object('competence_id', competence_id, 'validated_at', validated_at)
                     ORDER BY validated_at) AS acquises
      FROM acquired
     GROUP BY LEFT(competence_id, 2)
  )
  SELECT jsonb_object_agg(monde, acquises) INTO v_by_monde FROM world_breakdown;

  WITH months AS (SELECT generate_series(0, 2) AS m),
  monthly AS (
    SELECT m.m AS month_idx,
           to_char(p_trimestre_start + (m.m || ' months')::interval, 'TMMon') AS month_label,
           COALESCE((
             SELECT COUNT(DISTINCT competence_id) FROM validations
              WHERE eleve_id = p_eleve_id AND statut = 'acquis'
                AND validated_at >= p_trimestre_start + (m.m || ' months')::interval
                AND validated_at <  p_trimestre_start + ((m.m + 1) || ' months')::interval
           ), 0) AS validations_count
      FROM months m
  )
  SELECT jsonb_agg(jsonb_build_object('month', month_label, 'count', validations_count) ORDER BY month_idx)
    INTO v_evolution FROM monthly;

  IF v_acquises_now >= 28 THEN
    v_comment := 'Excellent — ' || v_acquises_now || '/31 compétences acquises. Quasiment prêt pour l''examen.';
  ELSIF v_acquises_now >= 20 THEN
    v_comment := 'Bonne progression — ' || v_acquises_now || '/31 compétences acquises. En bonne voie vers l''examen.';
  ELSIF v_acquises_now >= 10 THEN
    v_comment := 'En cours — ' || v_acquises_now || '/31 compétences acquises. Rythme à maintenir.';
  ELSIF v_acquises_now > 0 THEN
    v_comment := 'Début de parcours — ' || v_acquises_now || '/31 compétences acquises.';
  ELSE
    v_comment := 'Aucune compétence acquise. Risque de décrochage — contact moniteur recommandé.';
  END IF;

  RETURN jsonb_build_object(
    'eleve', jsonb_build_object('id', v_eleve.id, 'prenom', v_eleve.prenom, 'nom', v_eleve.nom),
    'trimestre_start', p_trimestre_start,
    'trimestre_end', v_trimestre_end,
    'kpi', jsonb_build_object(
      'acquises_now', v_acquises_now,
      'acquises_trimestre', v_acquises_trim,
      'quiz_total', COALESCE(v_quiz_total, 0),
      'quiz_reussis', COALESCE(v_quiz_reussis, 0),
      'score_moyen', COALESCE(v_score_avg, 0),
      'jours_actifs', COALESCE(v_days_active, 0),
      'jours_total', COALESCE(v_days_total, 0)
    ),
    'by_monde', COALESCE(v_by_monde, '{}'::jsonb),
    'evolution', COALESCE(v_evolution, '[]'::jsonb),
    'comment', v_comment
  );
END;
$function$;


-- 2. get_coaching_tip — garde d'accès après le check d'authentification.
CREATE OR REPLACE FUNCTION public.get_coaching_tip(p_eleve_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id   uuid := current_profile_id();
  v_target    uuid := COALESCE(p_eleve_id, v_user_id);
  v_streak    int;
  v_last_active timestamptz;
  v_n_comp    int;
  v_next_palier int;
  v_n_to_palier int;
  v_avg_score numeric;
  v_n_fails   int;
  v_top_fail_comp text;
  v_hour      int := EXTRACT(HOUR FROM now() AT TIME ZONE 'Europe/Paris')::int;
  v_tip       text;
  v_tone      text := 'gentle';
  v_route     text := '#/';
  v_cta       text := 'Continuer';
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  -- 🔒 garde d'accès (self ou staff même école)
  IF NOT public.can_access_eleve(v_target) THEN RAISE EXCEPTION 'not_authorized'; END IF;

  -- Stats
  SELECT current_streak INTO v_streak FROM streaks WHERE user_id = v_target;
  SELECT last_active_at  INTO v_last_active FROM profiles WHERE id = v_target;
  SELECT COUNT(*)::int   INTO v_n_comp FROM validations WHERE eleve_id = v_target AND statut = 'acquis';

  -- Prochain palier
  v_next_palier := CASE
    WHEN v_n_comp < 10 THEN 10
    WHEN v_n_comp < 15 THEN 15
    WHEN v_n_comp < 20 THEN 20
    WHEN v_n_comp < 25 THEN 25
    WHEN v_n_comp < 28 THEN 28
    WHEN v_n_comp < 31 THEN 31
    ELSE NULL
  END;
  v_n_to_palier := COALESCE(v_next_palier - v_n_comp, 0);

  -- Quiz fails récents
  SELECT
    ROUND(AVG(score), 1),
    COUNT(*) FILTER (WHERE score < 70)::int
  INTO v_avg_score, v_n_fails
  FROM quiz_attempts
  WHERE user_id = v_target
    AND completed_at >= now() - INTERVAL '14 days'
    AND score IS NOT NULL;

  -- Top fail competence
  SELECT competence_id INTO v_top_fail_comp
  FROM quiz_attempts
  WHERE user_id = v_target
    AND completed_at >= now() - INTERVAL '14 days'
    AND score IS NOT NULL AND score < 70
  GROUP BY competence_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- ──── Sélection du tip (ordre de priorité) ────
  IF v_streak IS NOT NULL AND v_streak >= 3
     AND (v_last_active IS NULL OR v_last_active < CURRENT_DATE) THEN
    v_tip   := '🔥 Ta série de ' || v_streak || ' jours est en danger aujourd''hui. Une mini-action suffit.';
    v_tone  := 'urgent';
    v_route := '#/parcours';
    v_cta   := 'Sauver ma série';

  ELSIF v_n_to_palier = 1 AND v_next_palier IS NOT NULL THEN
    v_tip   := '⚡ Une seule compétence te sépare du palier ' || v_next_palier || '. Vas-y maintenant.';
    v_tone  := 'celebrate';
    v_route := '#/parcours';
    v_cta   := 'Y aller';

  ELSIF v_n_to_palier = 2 AND v_next_palier IS NOT NULL THEN
    v_tip   := '🔥 Plus que 2 compétences pour atteindre le palier ' || v_next_palier || '.';
    v_tone  := 'celebrate';
    v_route := '#/parcours';
    v_cta   := 'Continuer';

  ELSIF v_n_fails >= 3 AND v_top_fail_comp IS NOT NULL THEN
    v_tip   := '🎯 Tu as échoué ' || v_n_fails || ' fois sur ' || v_top_fail_comp || ' récemment. Pose-toi 5 min dessus.';
    v_tone  := 'warm';
    v_route := '#/quiz/' || v_top_fail_comp || '/post_validation';
    v_cta   := 'Réviser ' || v_top_fail_comp;

  ELSIF v_n_comp = 0 THEN
    v_tip   := '👋 Bienvenue ! Découvre ton parcours — 31 compétences pour atteindre ton permis.';
    v_tone  := 'gentle';
    v_route := '#/parcours';
    v_cta   := 'Découvrir';

  ELSIF v_hour >= 6 AND v_hour < 11 THEN
    v_tip   := '☀️ Bonne matinée. Une session matinale = mémoire long terme renforcée.';
    v_route := '#/parcours';
    v_cta   := 'Commencer la journée';

  ELSIF v_hour >= 18 AND v_hour < 22 THEN
    v_tip   := '🌙 Une révision avant le dîner ? 5 minutes suffisent pour ancrer.';
    v_route := '#/parcours';
    v_cta   := 'Réviser 5 min';

  ELSIF v_avg_score IS NOT NULL AND v_avg_score >= 85 THEN
    v_tip   := '✨ Tu as un score quiz moyen de ' || ROUND(v_avg_score) || '%. Tu es parmi les meilleurs.';
    v_tone  := 'celebrate';
    v_route := '#/parcours';

  ELSE
    v_tip   := '💪 ' || v_n_comp || '/31 acquises. Continue à ton rythme — chaque compétence compte.';
    v_route := '#/parcours';
  END IF;

  RETURN jsonb_build_object(
    'tip', v_tip,
    'tone', v_tone,
    'cta', v_cta,
    'route', v_route,
    'context', jsonb_build_object(
      'streak', v_streak,
      'n_comp', v_n_comp,
      'next_palier', v_next_palier,
      'n_to_palier', v_n_to_palier,
      'avg_score', v_avg_score,
      'n_fails', v_n_fails,
      'top_fail_comp', v_top_fail_comp,
      'hour_paris', v_hour
    )
  );
END;
$function$;


-- 3. predict_exam_ready_date — garde d'accès après le check d'authentification.
CREATE OR REPLACE FUNCTION public.predict_exam_ready_date(p_eleve_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id   uuid := current_profile_id();
  v_target    uuid := COALESCE(p_eleve_id, v_user_id);
  v_n_comp    int;
  v_n_30d     int;
  v_velocity  numeric;  -- comp par jour
  v_days_needed int;
  v_target_count int := 28;
  v_predicted_date date;
  v_confidence text;
  v_advice    text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  -- 🔒 garde d'accès (self ou staff même école)
  IF NOT public.can_access_eleve(v_target) THEN RAISE EXCEPTION 'not_authorized'; END IF;

  SELECT COUNT(*)::int INTO v_n_comp
    FROM validations WHERE eleve_id = v_target AND statut = 'acquis';

  -- Déjà prêt ?
  IF v_n_comp >= v_target_count THEN
    RETURN jsonb_build_object(
      'ready_now', true,
      'n_acquis', v_n_comp,
      'target', v_target_count,
      'advice', '🎓 Tu es déjà prêt à passer l''examen blanc !'
    );
  END IF;

  -- Vélocité = nb validations sur 30j / 30
  SELECT COUNT(*)::int INTO v_n_30d
    FROM validations
   WHERE eleve_id = v_target
     AND statut = 'acquis'
     AND validated_at >= now() - INTERVAL '30 days';

  v_velocity := v_n_30d::numeric / 30.0;

  IF v_velocity = 0 THEN
    RETURN jsonb_build_object(
      'predicted_date', null,
      'n_acquis', v_n_comp,
      'target', v_target_count,
      'comp_remaining', v_target_count - v_n_comp,
      'velocity_per_week', 0,
      'confidence', 'low',
      'advice', '💭 Pas de validation récente. Reprends une compétence dans la semaine pour amorcer.'
    );
  END IF;

  v_days_needed := CEIL((v_target_count - v_n_comp)::numeric / v_velocity);
  v_predicted_date := CURRENT_DATE + v_days_needed;

  -- Confiance basée sur volume d'historique
  v_confidence := CASE
    WHEN v_n_30d >= 10 THEN 'high'
    WHEN v_n_30d >=  4 THEN 'medium'
    ELSE                   'low'
  END;

  -- Conseil
  v_advice := CASE
    WHEN v_days_needed <= 30 THEN '🎯 Ton examen blanc est à portée — moins d''un mois à ce rythme.'
    WHEN v_days_needed <= 60 THEN '💪 Bonne dynamique. Continue à ce rythme et tu seras prêt dans 2 mois.'
    WHEN v_days_needed <= 90 THEN '📅 Rythme tenable. Vise 2-3 validations par semaine pour gagner du temps.'
    ELSE '🐢 Au rythme actuel, ça prendra du temps. Une session de plus par semaine ferait toute la différence.'
  END;

  RETURN jsonb_build_object(
    'predicted_date', v_predicted_date,
    'days_remaining', v_days_needed,
    'n_acquis', v_n_comp,
    'target', v_target_count,
    'comp_remaining', v_target_count - v_n_comp,
    'velocity_per_week', ROUND(v_velocity * 7, 1),
    'confidence', v_confidence,
    'advice', v_advice
  );
END;
$function$;


-- 4. get_eleve_tags — notes PRIVÉES du moniteur : staff de la même école UNIQUEMENT
--    (l'élève ne doit PAS lire ses propres tags). Conversion en plpgsql pour la garde.
CREATE OR REPLACE FUNCTION public.get_eleve_tags(p_eleve_id uuid)
 RETURNS TABLE(tag text, color text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM profiles caller
    JOIN profiles target ON target.id = p_eleve_id
    WHERE caller.id = current_profile_id()
      AND caller.role IN ('enseignant','gerant')
      AND caller.auto_ecole_id IS NOT NULL
      AND caller.auto_ecole_id = target.auto_ecole_id
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
    SELECT t.tag, t.color, t.created_at
      FROM eleve_tags t
     WHERE t.eleve_id = p_eleve_id
     ORDER BY t.created_at;
END;
$function$;


-- ════════════ B) STREAK ENGINE FIX ════════════
-- get_today_quests : remplace l'INSERT ... ON CONFLICT (qui déclenche le guard
-- protect_streaks_fields sur l'INSERT proposé avec current_streak>1) par un
-- UPDATE-si-existe / INSERT-à-1. Le reste est identique.
CREATE OR REPLACE FUNCTION public.get_today_quests()
 RETURNS TABLE(quest_id text, title text, target integer, progress integer, completed boolean, claimed boolean, reward_xp integer, reward_gemmes integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_user_id   uuid := current_profile_id();
  v_existing  int;
  v_today     date := CURRENT_DATE;
  v_last      date;
  v_cur       int;
  v_new       int;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT COUNT(*) INTO v_existing
    FROM daily_quests_progress
   WHERE user_id = v_user_id AND quest_date = v_today;

  IF v_existing < 3 THEN
    -- Série : montée quotidienne (premier login du jour)
    SELECT current_streak, last_activity_date INTO v_cur, v_last
      FROM streaks WHERE user_id = v_user_id;

    IF v_last IS NULL THEN
      v_new := 1;
    ELSIF v_last = v_today THEN
      v_new := GREATEST(COALESCE(v_cur, 1), 1);
    ELSIF v_last = v_today - 1 THEN
      v_new := COALESCE(v_cur, 0) + 1;
    ELSE
      v_new := 1;
    END IF;

    -- FIX : éviter le guard anti-triche (protect_streaks_fields) qui rejette un
    -- INSERT avec current_streak>1. On UPDATE si la ligne existe (le guard
    -- autorise une hausse de +1), sinon on INSERT à v_new (=1 pour un nouvel élève).
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

    INSERT INTO daily_quests_progress (user_id, quest_date, quest_id, target, reward_xp, reward_gemmes)
    VALUES
      (v_user_id, v_today, 'quest_login',      1, 10, 5),
      (v_user_id, v_today, 'quest_validate_1', 1, 50, 20),
      (v_user_id, v_today, 'quest_quiz_1',     1, 30, 15)
    ON CONFLICT (user_id, quest_date, quest_id) DO NOTHING;

    UPDATE daily_quests_progress
       SET progress = 1, completed_at = COALESCE(completed_at, now())
     WHERE user_id = v_user_id
       AND quest_date = v_today
       AND quest_id = 'quest_login';
  END IF;

  RETURN QUERY
  SELECT
    dq.quest_id,
    CASE dq.quest_id
      WHEN 'quest_login'       THEN 'Se connecter aujourd''hui'
      WHEN 'quest_validate_1'  THEN 'Valider 1 compétence'
      WHEN 'quest_quiz_1'      THEN 'Réussir 1 quiz (≥70%)'
      WHEN 'quest_quiz_3'      THEN 'Réussir 3 quiz'
      WHEN 'quest_streak_keep' THEN 'Maintenir ta série'
      WHEN 'quest_quiz_perfect' THEN 'Faire 1 quiz parfait (100%)'
      ELSE dq.quest_id
    END AS title,
    dq.target,
    dq.progress,
    (dq.completed_at IS NOT NULL) AS completed,
    (dq.claimed_at IS NOT NULL) AS claimed,
    dq.reward_xp,
    dq.reward_gemmes
  FROM daily_quests_progress dq
  WHERE dq.user_id = v_user_id AND dq.quest_date = v_today
  ORDER BY
    CASE dq.quest_id
      WHEN 'quest_login' THEN 1
      WHEN 'quest_validate_1' THEN 2
      WHEN 'quest_quiz_1' THEN 3
      ELSE 4
    END;
END;
$function$;

-- NB (non corrigé ici, faible sévérité — à décider) :
--   get_moniteur_level(p_moniteur_id), get_school_level(p_school_id),
--   get_user_optimal_hour(p_user_id) acceptent un id cible sans garde stricte
--   (exposition XP/agrégat/heure d'un autre — pas de PII élève). À borner si besoin.
