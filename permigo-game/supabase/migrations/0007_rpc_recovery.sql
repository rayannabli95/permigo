-- ============================================================================
-- 0007_rpc_recovery.sql
-- Récupération des fonctions RPC présentes en PROD mais absentes des migrations.
--
-- 51 fonctions (52 objets avec la surcharge de log_session) sont appelées par le
-- front via sb.rpc(...) sans être versionnées dans permigo-game/supabase/migrations/.
-- Extraites le 2026-05-20 depuis le projet Supabase prod (arrfmdagdqtrtfbhxlty,
-- eu-west-1) via pg_get_functiondef, en lecture seule. Corps verbatim, non modifiés.
--
-- check_function_bodies = off : CREATE OR REPLACE idempotents, l'ordre de création
-- entre fonctions n'a pas a etre strict (corps plpgsql validés a l'exécution).
--
-- Caveat : ces fonctions peuvent dépendre de tables / types / helpers / vues
-- matérialisées non couverts par 0000-0006 (boutique, quetes, messagerie, sessions
-- moniteur, vue classement, helpers current_profile_id/_set_trusted_op, etc.).
-- Vérifier sur une branche Supabase avant d'appliquer en prod.
-- ============================================================================

set check_function_bodies = off;

-- ==========================================
-- Fonction : accept_invitation
-- Rôle : Accepte une invitation et rattache l'élève à l'auto-école
-- Consommée par : pages/public/signup.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM invitations
   WHERE token = p_token
     AND accepted_at IS NULL
     AND (expires_at IS NULL OR expires_at > now())
   LIMIT 1;

  IF v_id IS NULL THEN RETURN false; END IF;

  UPDATE invitations SET accepted_at = now() WHERE id = v_id;
  RETURN true;
END;
$function$
;

-- ==========================================
-- Fonction : admin_get_dashboard
-- Rôle : Données du tableau de bord admin
-- Consommée par : pages/admin/debug.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.admin_get_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_email text;
  v_now timestamptz := now();
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL OR v_email <> 'rayannabli27@gmail.com' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN jsonb_build_object(
    'generated_at', v_now,
    'counts', jsonb_build_object(
      'eleves',       (SELECT COUNT(*) FROM profiles WHERE role = 'eleve'),
      'enseignants',  (SELECT COUNT(*) FROM profiles WHERE role = 'enseignant'),
      'gerants',      (SELECT COUNT(*) FROM profiles WHERE role = 'gerant'),
      'auto_ecoles',  (SELECT COUNT(*) FROM auto_ecoles),
      'validations',  (SELECT COUNT(*) FROM validations WHERE statut = 'acquis'),
      'questions',    (SELECT COUNT(*) FROM questions_competence),
      'quiz_attempts',(SELECT COUNT(*) FROM quiz_attempts),
      'notifications',(SELECT COUNT(*) FROM notifications),
      'push_subs',    (SELECT COUNT(*) FROM push_subscriptions),
      'invitations_pending', (SELECT COUNT(*) FROM invitations WHERE accepted_at IS NULL)
    ),
    'activity_24h', jsonb_build_object(
      'validations',  (SELECT COUNT(*) FROM validations WHERE validated_at > v_now - interval '24 hours'),
      'quiz_attempts',(SELECT COUNT(*) FROM quiz_attempts WHERE completed_at > v_now - interval '24 hours'),
      'new_profiles', (SELECT COUNT(*) FROM profiles WHERE created_at > v_now - interval '24 hours'),
      'notifications',(SELECT COUNT(*) FROM notifications WHERE created_at > v_now - interval '24 hours')
    ),
    'cron_jobs', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', jobname, 'schedule', schedule, 'active', active)), '[]'::jsonb) FROM cron.job
    )
  );
END;
$function$
;

-- ==========================================
-- Fonction : apply_referral
-- Rôle : Applique un code de parrainage
-- Consommée par : pages/common/profil.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.apply_referral(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id    uuid := current_profile_id();
  v_parrain_id uuid;
  v_claimed    uuid;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;

  select id into v_parrain_id from profiles where referral_code = upper(p_code);
  if v_parrain_id is null then return jsonb_build_object('error', 'invalid_code'); end if;
  if v_parrain_id = v_user_id then return jsonb_build_object('error', 'self_referral_not_allowed'); end if;

  perform _set_trusted_op();

  -- Pose atomique : ne réussit que si referred_by était NULL (1er appel gagnant).
  update profiles set referred_by = v_parrain_id
   where id = v_user_id and referred_by is null
   returning id into v_claimed;

  if v_claimed is null then
    return jsonb_build_object('error', 'already_referred');
  end if;

  update profiles set xp = coalesce(xp, 0) + 200, gemmes = coalesce(gemmes, 0) + 50
   where id in (v_user_id, v_parrain_id);

  insert into notifications (user_id, type, title, body, data) values (
    v_parrain_id, 'emotional_nudge',
    '🎉 Quelqu''un t''a rejoint',
    'Un nouvel élève vient de rejoindre PermiGo avec ton code. +200 XP, +50 gemmes pour toi !',
    jsonb_build_object('template_id', 'referral_success', 'tone', 'celebrate',
      'title', '🎉 Quelqu''un t''a rejoint',
      'body', 'Un nouvel élève vient de rejoindre PermiGo avec ton code. +200 XP, +50 gemmes pour toi !',
      'cta', 'Voir mon profil', 'route', '#/profil'));

  return jsonb_build_object('ok', true, 'parrain_id', v_parrain_id,
    'xp_gained', 200, 'gemmes_gained', 50);
end;
$function$
;

-- ==========================================
-- Fonction : check_duplicate_session
-- Rôle : Détecte une séance en double avant enregistrement
-- Consommée par : pages/enseignant/log-session.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.check_duplicate_session(p_eleve_id uuid, p_session_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid       UUID := public.current_profile_id();
  v_existing  sessions_moniteur;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('duplicate', false); END IF;

  SELECT * INTO v_existing FROM sessions_moniteur
  WHERE moniteur_id = v_uid
    AND eleve_id = p_eleve_id
    AND session_date = p_session_date
    AND confirmation_status <> 'refused'
  ORDER BY logged_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('duplicate', false);
  END IF;

  RETURN jsonb_build_object(
    'duplicate', true,
    'session_id', v_existing.id,
    'duration_minutes', v_existing.duration_minutes,
    'confirmation_status', v_existing.confirmation_status
  );
END;
$function$
;

-- ==========================================
-- Fonction : claim_quest
-- Rôle : Réclame la récompense d'une quête quotidienne
-- Consommée par : components/daily-quests.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.claim_quest(p_quest_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_quest   public.daily_quests_progress;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE daily_quests_progress
     SET claimed_at = now()
   WHERE user_id = v_user_id AND quest_date = CURRENT_DATE
     AND quest_id = p_quest_id AND completed_at IS NOT NULL AND claimed_at IS NULL
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
$function$
;

-- ==========================================
-- Fonction : confirm_session
-- Rôle : L'élève confirme une séance déclarée
-- Consommée par : components/session-confirmation-banner.js, pages/eleve/session-confirmation.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.confirm_session(p_session_id uuid, p_status text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid     UUID := public.current_profile_id();
  v_session sessions_moniteur;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE='42501';
  END IF;

  IF p_status NOT IN ('confirmed', 'refused') THEN
    RAISE EXCEPTION 'invalid_status' USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_session FROM sessions_moniteur WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE='42704';
  END IF;

  IF v_session.eleve_id <> v_uid THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;

  IF v_session.confirmation_status <> 'pending' THEN
    RETURN jsonb_build_object('error', 'already_decided', 'current_status', v_session.confirmation_status);
  END IF;

  UPDATE sessions_moniteur
    SET confirmation_status = p_status,
        confirmed_at = CASE WHEN p_status = 'confirmed' THEN NOW() ELSE NULL END,
        flagged = (p_status = 'refused')
  WHERE id = p_session_id;

  -- Notif au moniteur (résultat)
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    v_session.moniteur_id,
    CASE WHEN p_status = 'confirmed' THEN 'session_confirmed' ELSE 'session_refused' END,
    CASE WHEN p_status = 'confirmed' THEN 'Séance confirmée'   ELSE 'Séance refusée'   END,
    CASE WHEN p_status = 'confirmed'
      THEN 'L''élève a confirmé la séance du ' || to_char(v_session.session_date, 'DD/MM') || '.'
      ELSE 'L''élève a refusé la séance du '   || to_char(v_session.session_date, 'DD/MM') || '. À investiguer.'
    END,
    jsonb_build_object('session_id', p_session_id, 'eleve_id', v_uid)
  );

  RETURN jsonb_build_object('ok', true, 'status', p_status);
END;
$function$
;

-- ==========================================
-- Fonction : delete_my_account
-- Rôle : Suppression de compte (RGPD)
-- Consommée par : pages/common/settings.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.delete_my_account(p_confirm_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_anon_suffix text := substr(v_user_id::text, 1, 8);
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_confirm_text <> 'SUPPRIMER MON COMPTE' THEN
    RETURN jsonb_build_object('error', 'invalid_confirmation', 'expected', 'SUPPRIMER MON COMPTE');
  END IF;

  -- Anonymisation du profile (préserve les stats sans PII)
  UPDATE profiles SET
    prenom        = 'Anonyme',
    nom           = NULL,
    email         = NULL,
    avatar_url    = NULL,
    avatar_preset = 'starter-1',
    banner_url    = NULL,
    referral_code = NULL,
    last_active_at= NULL,
    show_in_ranking = false,
    deleted_at    = now(),
    anonymized_at = now()
   WHERE id = v_user_id;

  -- Vider les données privées
  DELETE FROM push_subscriptions WHERE user_id = v_user_id;
  DELETE FROM user_preferences WHERE user_id = v_user_id;
  DELETE FROM eleve_goals WHERE eleve_id = v_user_id;
  DELETE FROM comp_bookmarks WHERE user_id = v_user_id;
  DELETE FROM eleve_tags WHERE eleve_id = v_user_id;
  DELETE FROM streak_freezes WHERE user_id = v_user_id;
  DELETE FROM webhooks_subscriptions WHERE created_by = v_user_id;

  -- Messages : anonymiser le contenu (préserve thread mais pas le body)
  UPDATE messages SET body = '[message supprimé]'
   WHERE sender_id = v_user_id OR recipient_id = v_user_id;

  -- Notifications : supprimer toutes
  DELETE FROM notifications WHERE user_id = v_user_id;

  -- Events analytics : anonymiser
  UPDATE events_analytics SET user_id = NULL, properties = '{}'::jsonb
   WHERE user_id = v_user_id;

  -- Audit log : conservé (légal) mais le user_id reste pour traçabilité

  -- Notification finale (sans push)
  INSERT INTO events_analytics (user_id, event_name, properties)
  VALUES (NULL, 'gdpr.account_deleted',
          jsonb_build_object('user_id', v_user_id, 'anon_suffix', v_anon_suffix));

  RETURN jsonb_build_object(
    'ok', true,
    'anonymized', true,
    'message', 'Compte anonymisé. Pour effacement total côté authentification, contacte dpo@permigo.fr'
  );
END;
$function$
;

-- ==========================================
-- Fonction : export_my_data
-- Rôle : Export des données personnelles (RGPD)
-- Consommée par : pages/common/settings.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.export_my_data()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_result  jsonb;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT jsonb_build_object(
    'generated_at', now(),
    'user_id', v_user_id,
    'profile', (SELECT to_jsonb(p) FROM profiles p WHERE p.id = v_user_id),
    'preferences', (SELECT to_jsonb(up) FROM user_preferences up WHERE up.user_id = v_user_id),
    'goals', (SELECT to_jsonb(g) FROM eleve_goals g WHERE g.eleve_id = v_user_id),
    'validations', COALESCE((
      SELECT jsonb_agg(to_jsonb(v) ORDER BY v.validated_at DESC)
      FROM validations v WHERE v.eleve_id = v_user_id
    ), '[]'::jsonb),
    'quiz_attempts', COALESCE((
      SELECT jsonb_agg(to_jsonb(q) ORDER BY q.completed_at DESC)
      FROM quiz_attempts q WHERE q.user_id = v_user_id
    ), '[]'::jsonb),
    'streaks', (SELECT to_jsonb(s) FROM streaks s WHERE s.user_id = v_user_id),
    'streak_freezes', COALESCE((
      SELECT jsonb_agg(to_jsonb(f)) FROM streak_freezes f WHERE f.user_id = v_user_id
    ), '[]'::jsonb),
    'chest_unlocks', COALESCE((
      SELECT jsonb_agg(to_jsonb(c)) FROM chest_unlocks c WHERE c.user_id = v_user_id
    ), '[]'::jsonb),
    'inventory', COALESCE((
      SELECT jsonb_agg(to_jsonb(i)) FROM user_inventory i WHERE i.user_id = v_user_id
    ), '[]'::jsonb),
    'achievements', COALESCE((
      SELECT jsonb_agg(to_jsonb(a)) FROM achievements_unlocked a WHERE a.user_id = v_user_id
    ), '[]'::jsonb),
    'bookmarks', COALESCE((
      SELECT jsonb_agg(to_jsonb(b)) FROM comp_bookmarks b WHERE b.user_id = v_user_id
    ), '[]'::jsonb),
    'daily_quests', COALESCE((
      SELECT jsonb_agg(to_jsonb(dq)) FROM daily_quests_progress dq WHERE dq.user_id = v_user_id
    ), '[]'::jsonb),
    'notifications', COALESCE((
      SELECT jsonb_agg(to_jsonb(n) ORDER BY n.created_at DESC)
      FROM notifications n WHERE n.user_id = v_user_id
    ), '[]'::jsonb),
    'sessions_as_eleve', COALESCE((
      SELECT jsonb_agg(to_jsonb(s)) FROM sessions_moniteur s WHERE s.eleve_id = v_user_id
    ), '[]'::jsonb),
    'sessions_as_moniteur', COALESCE((
      SELECT jsonb_agg(to_jsonb(s)) FROM sessions_moniteur s WHERE s.moniteur_id = v_user_id
    ), '[]'::jsonb),
    'messages_sent', COALESCE((
      SELECT jsonb_agg(to_jsonb(m)) FROM messages m WHERE m.sender_id = v_user_id
    ), '[]'::jsonb),
    'messages_received', COALESCE((
      SELECT jsonb_agg(to_jsonb(m)) FROM messages m WHERE m.recipient_id = v_user_id
    ), '[]'::jsonb),
    'exam_blancs', COALESCE((
      SELECT jsonb_agg(to_jsonb(e)) FROM exam_blanc_sessions e WHERE e.user_id = v_user_id
    ), '[]'::jsonb),
    'tags_on_me', COALESCE((
      SELECT jsonb_agg(to_jsonb(t)) FROM eleve_tags t WHERE t.eleve_id = v_user_id
    ), '[]'::jsonb),
    'referrals_made', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('referred_id', id, 'prenom', prenom))
      FROM profiles WHERE referred_by = v_user_id
    ), '[]'::jsonb),
    'incident_reports', COALESCE((
      SELECT jsonb_agg(to_jsonb(i)) FROM incident_reports i WHERE i.reporter_id = v_user_id
    ), '[]'::jsonb),
    'events_analytics_count', (SELECT COUNT(*) FROM events_analytics WHERE user_id = v_user_id),
    'audit_log_entries', COALESCE((
      SELECT jsonb_agg(to_jsonb(al) ORDER BY al.created_at DESC)
      FROM audit_log al WHERE al.actor_id = v_user_id
      LIMIT 1000
    ), '[]'::jsonb)
  ) INTO v_result;

  -- Log de l'export pour traçabilité
  INSERT INTO events_analytics (user_id, event_name, properties)
  VALUES (v_user_id, 'gdpr.data_exported', jsonb_build_object('size_chars', length(v_result::text)));

  RETURN v_result;
END;
$function$
;

-- ==========================================
-- Fonction : generate_referral_code
-- Rôle : Génère le code de parrainage de l'utilisateur
-- Consommée par : pages/common/profil.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_length integer DEFAULT 6)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_code text;
  v_chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';  -- exclu 0/O/1/I/L (ambigus)
  v_exists boolean;
  v_attempts int := 0;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Si déjà un code, le retourner
  SELECT referral_code INTO v_code FROM profiles WHERE id = v_user_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    v_code := '';
    FOR i IN 1..p_length LOOP
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    END LOOP;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists OR v_attempts >= 10;
    v_attempts := v_attempts + 1;
  END LOOP;

  UPDATE profiles SET referral_code = v_code WHERE id = v_user_id;
  RETURN v_code;
END;
$function$
;

-- ==========================================
-- Fonction : get_bilan_data
-- Rôle : Données du bilan moniteur
-- Consommée par : pages/enseignant/bilan.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_bilan_data(p_eleve_id uuid, p_trimestre_start timestamp with time zone DEFAULT date_trunc('quarter'::text, now()))
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_trimestre_end timestamptz := p_trimestre_start + interval '3 months';
  v_prev_start    timestamptz := p_trimestre_start - interval '3 months';

  v_eleve         record;
  v_acquises_now  int;
  v_acquises_prev int;
  v_quiz_total    int;
  v_quiz_reussis  int;
  v_score_avg     numeric;
  v_days_active   int;
  v_days_total    int;
  v_by_monde      jsonb;
  v_evolution     jsonb;
  v_comment       text;
BEGIN
  -- Profil élève
  SELECT id, prenom, nom, created_at INTO v_eleve
    FROM profiles WHERE id = p_eleve_id AND role = 'eleve';

  IF v_eleve.id IS NULL THEN
    RETURN jsonb_build_object('error', 'eleve_not_found');
  END IF;

  -- Compétences acquises ce trimestre
  SELECT COUNT(*) INTO v_acquises_now FROM validations
    WHERE eleve_id = p_eleve_id AND statut = 'acquis'
      AND validated_at >= p_trimestre_start AND validated_at < v_trimestre_end;

  -- Trimestre précédent (pour delta)
  SELECT COUNT(*) INTO v_acquises_prev FROM validations
    WHERE eleve_id = p_eleve_id AND statut = 'acquis'
      AND validated_at >= v_prev_start AND validated_at < p_trimestre_start;

  -- Stats quiz
  SELECT COUNT(*), COUNT(*) FILTER (WHERE score >= 60), ROUND(AVG(score)::numeric, 1)
    INTO v_quiz_total, v_quiz_reussis, v_score_avg
    FROM quiz_attempts
    WHERE user_id = p_eleve_id
      AND completed_at >= p_trimestre_start AND completed_at < v_trimestre_end;

  -- Régularité : nombre de jours distincts avec activité
  SELECT COUNT(DISTINCT date_trunc('day', completed_at)) INTO v_days_active
    FROM quiz_attempts
    WHERE user_id = p_eleve_id
      AND completed_at >= p_trimestre_start AND completed_at < v_trimestre_end;
  v_days_total := EXTRACT(DAY FROM (LEAST(v_trimestre_end, now()) - p_trimestre_start))::int;

  -- Détail par monde C1-C4 (acquis pendant le trimestre)
  WITH world_breakdown AS (
    SELECT
      LEFT(competence_id, 2) AS monde,
      jsonb_agg(jsonb_build_object(
        'competence_id', competence_id,
        'validated_at', validated_at
      ) ORDER BY validated_at) AS acquises
    FROM validations
    WHERE eleve_id = p_eleve_id AND statut = 'acquis'
      AND validated_at >= p_trimestre_start AND validated_at < v_trimestre_end
    GROUP BY LEFT(competence_id, 2)
  )
  SELECT jsonb_object_agg(monde, acquises) INTO v_by_monde FROM world_breakdown;

  -- Évolution mensuelle (3 mois du trimestre)
  WITH months AS (
    SELECT generate_series(0, 2) AS m
  ),
  monthly AS (
    SELECT
      m.m AS month_idx,
      to_char(p_trimestre_start + (m.m || ' months')::interval, 'TMMon') AS month_label,
      COALESCE((
        SELECT COUNT(*) FROM validations
         WHERE eleve_id = p_eleve_id AND statut = 'acquis'
           AND validated_at >= p_trimestre_start + (m.m || ' months')::interval
           AND validated_at <  p_trimestre_start + ((m.m + 1) || ' months')::interval
      ), 0) AS validations_count
    FROM months m
  )
  SELECT jsonb_agg(jsonb_build_object('month', month_label, 'count', validations_count) ORDER BY month_idx) INTO v_evolution FROM monthly;

  -- Commentaire pédagogique auto (rule-based)
  IF v_acquises_now >= 21 THEN
    v_comment := 'Excellent rythme ce trimestre. ' || v_acquises_now || ' compétences acquises = en avance sur le planning standard. Continue comme ça pour viser l''examen.';
  ELSIF v_acquises_now >= 12 THEN
    v_comment := 'Bonne dynamique. ' || v_acquises_now || ' compétences acquises ce trimestre. Maintien du rythme actuel = examen prêt dans les délais.';
  ELSIF v_acquises_now >= 4 THEN
    v_comment := 'Rythme à intensifier. ' || v_acquises_now || ' compétences acquises ce trimestre. Une leçon supplémentaire par semaine ferait la différence.';
  ELSIF v_acquises_now > 0 THEN
    v_comment := 'Progression à relancer. ' || v_acquises_now || ' compétence(s) acquise(s) ce trimestre. Discussion à avoir sur l''engagement et le rythme.';
  ELSE
    v_comment := 'Aucune compétence acquise ce trimestre. Risque de décrochage — contact moniteur recommandé.';
  END IF;

  RETURN jsonb_build_object(
    'eleve', jsonb_build_object('id', v_eleve.id, 'prenom', v_eleve.prenom, 'nom', v_eleve.nom),
    'trimestre_start', p_trimestre_start,
    'trimestre_end', v_trimestre_end,
    'kpi', jsonb_build_object(
      'acquises_now', v_acquises_now,
      'acquises_prev', v_acquises_prev,
      'delta_pct', CASE WHEN v_acquises_prev > 0
                       THEN ROUND(((v_acquises_now - v_acquises_prev)::numeric / v_acquises_prev) * 100, 0)
                       ELSE CASE WHEN v_acquises_now > 0 THEN 100 ELSE 0 END END,
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
$function$
;

-- ==========================================
-- Fonction : get_coaching_tip
-- Rôle : Conseil de coaching contextuel
-- Consommée par : components/coaching-tip.js
-- ==========================================
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
    v_tip   := '👋 Bienvenue ! Découvre ton parcours REMC — 31 compétences pour atteindre ton permis.';
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
$function$
;

-- ==========================================
-- Fonction : get_eleve_feedback_feed
-- Rôle : Fil de feedback de l'élève
-- Consommée par : components/feedback-feed.js, pages/enseignant/livret-remc.js, pages/eleve/feedback.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_eleve_feedback_feed(p_eleve_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 30, p_offset integer DEFAULT 0)
 RETURNS TABLE(kind text, ts timestamp with time zone, moniteur_id uuid, moniteur_prenom text, moniteur_nom text, competence_id text, duration_minutes integer, comment text, confirmation_status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id     uuid := current_profile_id();
  v_user_role   text;
  v_user_school uuid;
  v_target      uuid := COALESCE(p_eleve_id, v_user_id);
  v_target_school uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT role, auto_ecole_id INTO v_user_role, v_user_school
    FROM profiles WHERE id = v_user_id;
  SELECT auto_ecole_id INTO v_target_school
    FROM profiles WHERE id = v_target;

  IF v_user_id = v_target THEN NULL;
  ELSIF v_user_role IN ('enseignant','gerant') AND v_target_school = v_user_school THEN NULL;
  ELSE RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  WITH events AS (
    SELECT 'session'::text AS kind, s.logged_at AS ts,
           s.moniteur_id, NULL::text AS competence_id,
           s.duration_minutes, s.notes AS comment,
           s.confirmation_status
    FROM sessions_moniteur s WHERE s.eleve_id = v_target
    UNION ALL
    SELECT 'validation', v.validated_at,
           v.validated_by, v.competence_id,
           NULL::int, v.note_enseignant, NULL::text
    FROM validations v WHERE v.eleve_id = v_target AND v.statut = 'acquis'
  )
  SELECT e.kind, e.ts, e.moniteur_id, p.prenom, p.nom,
         e.competence_id, e.duration_minutes, e.comment, e.confirmation_status
  FROM events e
  LEFT JOIN profiles p ON p.id = e.moniteur_id
  ORDER BY e.ts DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$
;

-- ==========================================
-- Fonction : get_eleve_pending_competences
-- Rôle : Compétences en attente pour un élève
-- Consommée par : components/log-session-modal.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_eleve_pending_competences(p_eleve_id uuid)
 RETURNS TABLE(competence_id text, code text, monde integer, ordre integer, nom text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id     uuid := current_profile_id();
  v_user_role   text;
  v_user_school uuid;
  v_eleve_school uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT role, auto_ecole_id INTO v_user_role, v_user_school
    FROM profiles WHERE id = v_user_id;
  SELECT auto_ecole_id INTO v_eleve_school
    FROM profiles WHERE id = p_eleve_id;

  IF v_user_role NOT IN ('enseignant','gerant') OR v_user_school IS DISTINCT FROM v_eleve_school THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT c.id::text, c.code::text, c.monde::int, c.ordre::int, c.nom::text
  FROM competences_remc c
  WHERE NOT EXISTS (
    SELECT 1 FROM validations v
    WHERE v.eleve_id = p_eleve_id
      AND v.competence_id = c.id
      AND v.statut = 'acquis'
  )
  ORDER BY c.monde, c.ordre;
END;
$function$
;

-- ==========================================
-- Fonction : get_eleves_bloque_sur_competence
-- Rôle : Élèves bloqués sur une compétence
-- Consommée par : pages/enseignant/mes-eleves.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_eleves_bloque_sur_competence(p_competence_id text, p_window_days integer DEFAULT 30)
 RETURNS TABLE(eleve_id uuid, eleve_prenom text, eleve_nom text, n_fails integer, avg_score numeric, last_attempt_at timestamp with time zone, is_acquired boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id   uuid := current_profile_id();
  v_user_role text;
  v_school_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT role, auto_ecole_id INTO v_user_role, v_school_id
    FROM profiles WHERE id = v_user_id;
  IF v_user_role NOT IN ('enseignant','gerant') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  WITH attempts AS (
    SELECT q.user_id, q.score, q.completed_at
    FROM quiz_attempts q
    JOIN profiles p ON p.id = q.user_id
    WHERE p.auto_ecole_id = v_school_id
      AND q.competence_id = p_competence_id
      AND q.completed_at >= now() - (p_window_days || ' days')::interval
      AND q.score IS NOT NULL
  ),
  agg AS (
    SELECT
      a.user_id,
      COUNT(*) FILTER (WHERE a.score < 70)::int AS n_fails,
      ROUND(AVG(a.score), 1) AS avg_score,
      MAX(a.completed_at) AS last_attempt_at
    FROM attempts a
    GROUP BY a.user_id
    HAVING COUNT(*) FILTER (WHERE a.score < 70) >= 2
  )
  SELECT
    p.id, p.prenom, p.nom,
    a.n_fails, a.avg_score, a.last_attempt_at,
    EXISTS (
      SELECT 1 FROM validations v
      WHERE v.eleve_id = p.id AND v.competence_id = p_competence_id AND v.statut = 'acquis'
    ) AS is_acquired
  FROM agg a
  JOIN profiles p ON p.id = a.user_id
  ORDER BY a.n_fails DESC, a.last_attempt_at DESC;
END;
$function$
;

-- ==========================================
-- Fonction : get_fraud_signals
-- Rôle : Signaux de fraude (admin)
-- Consommée par : pages/admin/debug.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_fraud_signals()
 RETURNS TABLE(moniteur_id uuid, prenom text, nom text, total_sessions integer, total_minutes bigint, n_refused integer, n_auto_validated integer, n_eleves_diff integer, n_days_active integer, n_validations integer, flag_refused_sessions boolean, flag_high_auto_rate boolean, flag_hours_zero_val boolean, flag_single_eleve_burst boolean, flag_high_daily_avg boolean, flag_count integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'admin_only'; END IF;
  RETURN QUERY
  SELECT
    sm.moniteur_id, sm.prenom, sm.nom,
    sm.total_sessions, sm.total_minutes, sm.n_refused, sm.n_auto_validated,
    sm.n_eleves_diff, sm.n_days_active, sm.n_validations,
    sm.flag_refused_sessions, sm.flag_high_auto_rate, sm.flag_hours_zero_val,
    sm.flag_single_eleve_burst, sm.flag_high_daily_avg,
    (sm.flag_refused_sessions::int +
     sm.flag_high_auto_rate::int +
     sm.flag_hours_zero_val::int +
     sm.flag_single_eleve_burst::int +
     sm.flag_high_daily_avg::int)::int AS flag_count
  FROM public.suspicious_moniteurs_v sm
  ORDER BY (sm.flag_refused_sessions::int +
            sm.flag_high_auto_rate::int +
            sm.flag_hours_zero_val::int +
            sm.flag_single_eleve_burst::int +
            sm.flag_high_daily_avg::int) DESC,
           sm.total_sessions DESC;
END;
$function$
;

-- ==========================================
-- Fonction : get_gerant_cockpit
-- Rôle : KPIs du cockpit gérant
-- Consommée par : pages/gerant/cockpit.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_gerant_cockpit()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid   UUID := public.current_profile_id();
  v_ecole UUID;
  v_kpi       JSONB;
  v_cohorts   JSONB;
  v_moniteurs JSONB;
  v_alerts    JSONB;
BEGIN
  SELECT auto_ecole_id INTO v_ecole
  FROM profiles
  WHERE id = v_uid AND role IN ('gerant', 'admin');

  IF v_ecole IS NULL THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  -- KPIs
  WITH stats AS (
    SELECT
      COUNT(*) FILTER (WHERE role = 'eleve'    AND deleted_at IS NULL) AS eleves_actifs,
      COUNT(*) FILTER (WHERE role = 'enseignant' AND deleted_at IS NULL) AS moniteurs_actifs,
      COUNT(*) FILTER (
        WHERE role = 'eleve'
          AND deleted_at IS NULL
          AND created_at >= NOW() - INTERVAL '30 days'
      ) AS nouveaux_30j
    FROM profiles
    WHERE auto_ecole_id = v_ecole
  ),
  exam_stats AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE score >= 35) AS reussis
    FROM exam_blanc_sessions e
    JOIN profiles p ON p.id = e.user_id
    WHERE p.auto_ecole_id = v_ecole
      AND e.submitted_at IS NOT NULL
      AND e.submitted_at >= NOW() - INTERVAL '90 days'
  ),
  heures AS (
    SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 AS h
    FROM sessions_moniteur s
    JOIN profiles p ON p.id = s.eleve_id
    WHERE p.auto_ecole_id = v_ecole
      AND s.confirmed_at IS NOT NULL
      AND s.session_date >= (NOW() - INTERVAL '30 days')::DATE
  ),
  val30 AS (
    SELECT COUNT(*)::INT AS n
    FROM validations v
    JOIN profiles p ON p.id = v.eleve_id
    WHERE p.auto_ecole_id = v_ecole
      AND v.statut = 'acquis'
      AND v.validated_at >= NOW() - INTERVAL '30 days'
  )
  SELECT jsonb_build_object(
    'eleves_actifs',     stats.eleves_actifs,
    'moniteurs_actifs',  stats.moniteurs_actifs,
    'nouveaux_30j',      stats.nouveaux_30j,
    'validations_30j',   val30.n,
    'taux_reussite_90j', CASE
      WHEN exam_stats.total = 0 THEN NULL
      ELSE ROUND(100.0 * exam_stats.reussis / exam_stats.total, 1)
    END,
    'heures_30j', ROUND(heures.h, 1)
  ) INTO v_kpi
  FROM stats, exam_stats, heures, val30;

  -- Cohortes élèves
  WITH eleves AS (
    SELECT
      p.id,
      p.created_at,
      p.last_active_at,
      COALESCE((SELECT current_streak FROM streaks WHERE user_id = p.id), 0) AS streak,
      (SELECT COUNT(*) FROM validations
        WHERE eleve_id = p.id AND statut = 'acquis'
          AND validated_at >= NOW() - INTERVAL '30 days') AS val_30j,
      (SELECT COUNT(*) FROM validations
        WHERE eleve_id = p.id AND statut = 'acquis') AS val_total
    FROM profiles p
    WHERE p.auto_ecole_id = v_ecole
      AND p.role = 'eleve'
      AND p.deleted_at IS NULL
  ),
  classified AS (
    SELECT
      id,
      CASE
        WHEN val_total = 0 AND created_at < NOW() - INTERVAL '60 days' THEN 'bloque'
        WHEN COALESCE(last_active_at, created_at) >= NOW() - INTERVAL '7 days'
             AND streak >= 7 AND val_30j >= 1 THEN 'champion'
        WHEN COALESCE(last_active_at, created_at) >= NOW() - INTERVAL '7 days' THEN 'engage'
        WHEN COALESCE(last_active_at, created_at) >= NOW() - INTERVAL '21 days' THEN 'a_risque'
        ELSE 'inactif'
      END AS cohort
    FROM eleves
  )
  SELECT jsonb_build_object(
    'champion', COUNT(*) FILTER (WHERE cohort = 'champion'),
    'engage',   COUNT(*) FILTER (WHERE cohort = 'engage'),
    'a_risque', COUNT(*) FILTER (WHERE cohort = 'a_risque'),
    'inactif',  COUNT(*) FILTER (WHERE cohort = 'inactif'),
    'bloque',   COUNT(*) FILTER (WHERE cohort = 'bloque'),
    'total',    COUNT(*)
  ) INTO v_cohorts
  FROM classified;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',           t.id,
      'prenom',       p.prenom,
      'nom',          p.nom,
      'avatar_url',   p.avatar_url,
      'heures_30j',   ROUND(t.heures, 1),
      'n_eleves',     t.n_eleves,
      'n_validations', t.n_val
    ) ORDER BY t.heures DESC
  ) INTO v_moniteurs
  FROM (
    SELECT
      p.id,
      COALESCE(SUM(s.duration_minutes), 0) / 60.0 AS heures,
      COUNT(DISTINCT s.eleve_id) AS n_eleves,
      (SELECT COUNT(*) FROM validations v
        WHERE v.validated_by = p.id
          AND v.validated_at >= NOW() - INTERVAL '30 days'
          AND v.statut = 'acquis') AS n_val
    FROM profiles p
    LEFT JOIN sessions_moniteur s
      ON s.moniteur_id = p.id
     AND s.confirmed_at IS NOT NULL
     AND s.session_date >= (NOW() - INTERVAL '30 days')::DATE
    WHERE p.auto_ecole_id = v_ecole
      AND p.role = 'enseignant'
      AND p.deleted_at IS NULL
    GROUP BY p.id
    ORDER BY heures DESC
    LIMIT 5
  ) t
  JOIN profiles p ON p.id = t.id;

  WITH alerts AS (
    SELECT 'eleves_inactifs_21j' AS code,
      (SELECT COUNT(*)::INT FROM profiles p
        WHERE p.auto_ecole_id = v_ecole AND p.role = 'eleve' AND p.deleted_at IS NULL
          AND COALESCE(p.last_active_at, p.created_at) < NOW() - INTERVAL '21 days'
      ) AS n,
      'Élèves inactifs depuis 21j' AS label
    UNION ALL
    SELECT 'eleves_bloques',
      (SELECT COUNT(*)::INT FROM profiles p
        WHERE p.auto_ecole_id = v_ecole AND p.role = 'eleve' AND p.deleted_at IS NULL
          AND p.created_at < NOW() - INTERVAL '60 days'
          AND NOT EXISTS (SELECT 1 FROM validations v WHERE v.eleve_id = p.id AND v.statut = 'acquis')
      ),
      'Inscrits > 60j sans validation acquise'
    UNION ALL
    SELECT 'sessions_non_confirmees_48h',
      (SELECT COUNT(*)::INT FROM sessions_moniteur s
        JOIN profiles m ON m.id = s.moniteur_id
        WHERE m.auto_ecole_id = v_ecole
          AND s.confirmed_at IS NULL
          AND s.logged_at < NOW() - INTERVAL '48 hours'
          AND s.logged_at > NOW() - INTERVAL '30 days'
      ),
      'Sessions enregistrées non confirmées (>48h)'
    UNION ALL
    SELECT 'moniteurs_inactifs_14j',
      (SELECT COUNT(*)::INT FROM profiles m
        WHERE m.auto_ecole_id = v_ecole AND m.role = 'enseignant' AND m.deleted_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM sessions_moniteur s
            WHERE s.moniteur_id = m.id
              AND s.session_date >= (NOW() - INTERVAL '14 days')::DATE)
      ),
      'Moniteurs sans session enregistrée depuis 14j'
    UNION ALL
    SELECT 'moniteurs_flagues',
      (SELECT COUNT(*)::INT FROM sessions_moniteur s
        JOIN profiles m ON m.id = s.moniteur_id
        WHERE m.auto_ecole_id = v_ecole AND s.flagged = TRUE
          AND s.logged_at >= NOW() - INTERVAL '30 days'
      ),
      'Sessions flaguées anti-fraude (30j)'
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'code', code, 'count', n, 'label', label,
      'severity', CASE
        WHEN code IN ('eleves_bloques','moniteurs_flagues') AND n >= 1 THEN 'high'
        WHEN code = 'sessions_non_confirmees_48h' AND n >= 1 THEN 'high'
        WHEN n >= 5 THEN 'medium'
        WHEN n >= 1 THEN 'low'
        ELSE 'none'
      END
    ) ORDER BY n DESC
  ) INTO v_alerts
  FROM alerts WHERE n > 0;

  RETURN jsonb_build_object(
    'auto_ecole_id', v_ecole,
    'generated_at',  NOW(),
    'kpis',          v_kpi,
    'cohorts',       v_cohorts,
    'top_moniteurs', COALESCE(v_moniteurs, '[]'::JSONB),
    'alerts',        COALESCE(v_alerts, '[]'::JSONB)
  );
END;
$function$
;

-- ==========================================
-- Fonction : get_gerant_cohort_details
-- Rôle : Détails d'une cohorte (gérant)
-- Consommée par : pages/gerant/cockpit.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_gerant_cohort_details(p_cohort text, p_limit integer DEFAULT 50)
 RETURNS TABLE(eleve_id uuid, prenom text, nom text, avatar_url text, last_active_at timestamp with time zone, streak integer, val_total integer, val_30j integer, enseignant_id uuid, enseignant_nom text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid   UUID := public.current_profile_id();
  v_ecole UUID;
BEGIN
  SELECT auto_ecole_id INTO v_ecole
  FROM profiles WHERE id = v_uid AND role IN ('gerant', 'admin');

  IF v_ecole IS NULL THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;

  IF p_cohort NOT IN ('champion','engage','a_risque','inactif','bloque') THEN
    RAISE EXCEPTION 'Invalid cohort' USING ERRCODE='22023';
  END IF;

  RETURN QUERY
  WITH eleves AS (
    SELECT
      p.id, p.prenom, p.nom, p.avatar_url, p.created_at, p.last_active_at,
      p.enseignant_id,
      COALESCE((SELECT current_streak FROM streaks WHERE user_id=p.id),0) AS streak,
      (SELECT COUNT(*)::INT FROM validations WHERE eleve_id=p.id AND statut='acquis') AS val_total,
      (SELECT COUNT(*)::INT FROM validations WHERE eleve_id=p.id AND statut='acquis'
         AND validated_at >= NOW()-INTERVAL '30 days') AS val_30j
    FROM profiles p
    WHERE p.auto_ecole_id = v_ecole AND p.role='eleve' AND p.deleted_at IS NULL
  ),
  classified AS (
    SELECT e.*,
      CASE
        WHEN val_total = 0 AND created_at < NOW() - INTERVAL '60 days' THEN 'bloque'
        WHEN COALESCE(last_active_at, created_at) >= NOW()-INTERVAL '7 days'
             AND streak >= 7 AND val_30j >= 1 THEN 'champion'
        WHEN COALESCE(last_active_at, created_at) >= NOW()-INTERVAL '7 days' THEN 'engage'
        WHEN COALESCE(last_active_at, created_at) >= NOW()-INTERVAL '21 days' THEN 'a_risque'
        ELSE 'inactif'
      END AS cohort
    FROM eleves e
  )
  SELECT c.id, c.prenom, c.nom, c.avatar_url, c.last_active_at,
    c.streak, c.val_total, c.val_30j,
    c.enseignant_id,
    (m.prenom || ' ' || COALESCE(m.nom, ''))::TEXT
  FROM classified c
  LEFT JOIN profiles m ON m.id = c.enseignant_id
  WHERE c.cohort = p_cohort
  ORDER BY c.last_active_at DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(p_limit, 200));
END;
$function$
;

-- ==========================================
-- Fonction : get_invitation_by_token
-- Rôle : Récupère une invitation via son token
-- Consommée par : pages/public/signup.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token text)
 RETURNS TABLE(id uuid, email text, role text, auto_ecole_id uuid, auto_ecole_nom text, enseignant_attitre_id uuid, expires_at timestamp with time zone, accepted_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT i.id, i.email, i.role, i.auto_ecole_id,
         (SELECT a.nom FROM auto_ecoles a WHERE a.id = i.auto_ecole_id) AS auto_ecole_nom,
         i.enseignant_attitre_id, i.expires_at, i.accepted_at
  FROM invitations i
  WHERE i.token = p_token
  LIMIT 1;
$function$
;

-- ==========================================
-- Fonction : get_items_catalog
-- Rôle : Catalogue de la boutique
-- Consommée par : pages/eleve/boutique.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_items_catalog(p_type text DEFAULT NULL::text)
 RETURNS TABLE(id text, type text, name text, description text, cost_gemmes integer, rarity text, asset_url text, display_color text, ordre integer, owned boolean, acquired_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    c.id, c.type, c.name, c.description, c.cost_gemmes, c.rarity,
    c.asset_url, c.display_color, c.ordre,
    (i.user_id IS NOT NULL) AS owned,
    i.acquired_at
  FROM items_catalog c
  LEFT JOIN user_inventory i
    ON i.item_id = c.id
   AND i.user_id = current_profile_id()
  WHERE c.active = true
    AND (p_type IS NULL OR c.type = p_type)
  ORDER BY c.type, c.ordre, c.cost_gemmes;
$function$
;

-- ==========================================
-- Fonction : get_moniteur_ranking
-- Rôle : Classement mensuel des moniteurs (value-prop)
-- Consommée par : components/moniteur-ranking.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_moniteur_ranking(p_month date DEFAULT NULL::date)
 RETURNS TABLE(moniteur_id uuid, moniteur_prenom text, moniteur_nom text, hours_confirmed numeric, n_validations integer, n_eleves_diff integer, n_jours_actifs integer, score_total numeric, rank integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id    uuid := current_profile_id();
  v_role       text;
  v_school_id  uuid;
BEGIN
  SELECT role, auto_ecole_id INTO v_role, v_school_id
    FROM profiles WHERE id = v_user_id;
  IF v_role NOT IN ('enseignant','gerant') THEN RETURN; END IF;

  -- Si p_month est null OU correspond au mois courant → lire la MV (fast path)
  IF p_month IS NULL OR DATE_TRUNC('month', p_month) = DATE_TRUNC('month', CURRENT_DATE) THEN
    RETURN QUERY
    SELECT m.moniteur_id, m.prenom, m.nom,
           m.hours_confirmed, m.n_validations, m.n_eleves_diff, m.n_jours_actifs,
           m.score_total, m.rank
    FROM moniteur_ranking_mv m
    WHERE m.auto_ecole_id = v_school_id
    ORDER BY m.rank;
    RETURN;
  END IF;

  -- Sinon (mois passé) : recompute on-the-fly comme avant
  DECLARE
    v_month_start date := DATE_TRUNC('month', p_month)::date;
    v_month_end   date := (DATE_TRUNC('month', p_month) + INTERVAL '1 month')::date;
  BEGIN
    RETURN QUERY
    WITH base_sessions AS (
      SELECT s.moniteur_id, s.eleve_id, s.duration_minutes, s.session_date
      FROM sessions_moniteur s
      JOIN profiles p ON p.id = s.moniteur_id
      WHERE p.auto_ecole_id = v_school_id
        AND s.session_date >= v_month_start AND s.session_date < v_month_end
        AND s.confirmation_status IN ('confirmed','auto')
    ),
    pm AS (
      SELECT bs.moniteur_id,
        ROUND(SUM(bs.duration_minutes)::numeric / 60.0, 1) AS hours_confirmed,
        COUNT(DISTINCT bs.eleve_id)::int    AS n_eleves_diff,
        COUNT(DISTINCT bs.session_date)::int AS n_jours_actifs
      FROM base_sessions bs GROUP BY bs.moniteur_id
    ),
    vp AS (
      SELECT v.validated_by AS moniteur_id, COUNT(*)::int AS n_validations
      FROM validations v
      JOIN profiles p ON p.id = v.validated_by
      WHERE p.auto_ecole_id = v_school_id
        AND v.validated_at >= v_month_start AND v.validated_at < v_month_end
        AND v.statut = 'acquis'
      GROUP BY v.validated_by
    ),
    merged AS (
      SELECT p.id AS moniteur_id, p.prenom, p.nom,
        COALESCE(pm.hours_confirmed, 0) AS hours_confirmed,
        COALESCE(vp.n_validations, 0)   AS n_validations,
        COALESCE(pm.n_eleves_diff, 0)   AS n_eleves_diff,
        COALESCE(pm.n_jours_actifs, 0)  AS n_jours_actifs
      FROM profiles p
      LEFT JOIN pm ON pm.moniteur_id = p.id
      LEFT JOIN vp ON vp.moniteur_id = p.id
      WHERE p.auto_ecole_id = v_school_id AND p.role = 'enseignant'
    ),
    scored AS (
      SELECT m.*,
        ROUND((m.hours_confirmed * 0.40) + (m.n_validations * 0.25)
            + (m.n_eleves_diff * 1.50 * 0.20) + (m.n_jours_actifs * 0.50 * 0.15), 2) AS score_total
      FROM merged m
    )
    SELECT s.moniteur_id, s.prenom, s.nom,
           s.hours_confirmed, s.n_validations, s.n_eleves_diff, s.n_jours_actifs,
           s.score_total,
           ROW_NUMBER() OVER (ORDER BY s.score_total DESC)::int AS rank
    FROM scored s
    ORDER BY s.score_total DESC;
  END;
END;
$function$
;

-- ==========================================
-- Fonction : get_my_achievements
-- Rôle : Trophées débloqués de l'utilisateur
-- Consommée par : pages/eleve/trophees.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_achievements()
 RETURNS TABLE(achievement_key text, unlocked_at timestamp with time zone, bonus_xp integer, bonus_gemmes integer, metadata jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT achievement_key, unlocked_at, bonus_xp, bonus_gemmes, metadata
  FROM achievements_unlocked
  WHERE user_id = current_profile_id()
  ORDER BY unlocked_at DESC;
$function$
;

-- ==========================================
-- Fonction : get_my_chests
-- Rôle : Coffres possédés
-- Consommée par : utils/game-state.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_chests()
 RETURNS SETOF chest_unlocks
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM public.chest_unlocks
   WHERE user_id = current_profile_id()
   ORDER BY unlocked_at DESC;
$function$
;

-- ==========================================
-- Fonction : get_my_leaderboard_position
-- Rôle : Position de l'utilisateur au classement
-- Consommée par : pages/eleve/accueil.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_leaderboard_position()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id   uuid := current_profile_id();
  v_school_id uuid;
  v_my_xp     int;
  v_my_rank   int;
  v_total     int;
BEGIN
  SELECT auto_ecole_id, COALESCE(xp, 0) INTO v_school_id, v_my_xp
    FROM profiles WHERE id = v_user_id;
  IF v_school_id IS NULL THEN RETURN jsonb_build_object('error', 'no_school'); END IF;

  SELECT COUNT(*) + 1 INTO v_my_rank
    FROM profiles
   WHERE auto_ecole_id = v_school_id
     AND role = 'eleve'
     AND COALESCE(xp, 0) > v_my_xp
     AND show_in_ranking IS NOT FALSE;

  SELECT COUNT(*) INTO v_total
    FROM profiles
   WHERE auto_ecole_id = v_school_id
     AND role = 'eleve'
     AND show_in_ranking IS NOT FALSE;

  RETURN jsonb_build_object(
    'my_rank', v_my_rank,
    'my_xp', v_my_xp,
    'total_eleves', v_total,
    'percentile', CASE WHEN v_total > 0
      THEN ROUND(100 * ((v_total - v_my_rank + 1)::numeric / v_total))::int
      ELSE NULL END
  );
END;
$function$
;

-- ==========================================
-- Fonction : get_my_message_templates
-- Rôle : Modèles de messages du moniteur
-- Consommée par : pages/enseignant/log-session.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_message_templates()
 RETURNS TABLE(id text, emoji text, body text, category text, unlocked boolean, unlock_at_n_validations integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid UUID := public.current_profile_id();
  v_n   INT;
BEGIN
  -- Compte les validations totales du moniteur (lifetime)
  SELECT COUNT(*)::INT INTO v_n
  FROM validations
  WHERE validated_by = v_uid AND statut = 'acquis';

  RETURN QUERY
  SELECT
    t.id, t.emoji, t.body, t.category,
    (v_n >= t.unlock_at_n_validations) AS unlocked,
    t.unlock_at_n_validations
  FROM message_templates t
  ORDER BY t.unlock_at_n_validations ASC, t.display_order ASC;
END;
$function$
;

-- ==========================================
-- Fonction : get_my_next_unlock_moniteur
-- Rôle : Prochain palier moniteur à débloquer
-- Consommée par : pages/enseignant/parcours-pro.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_next_unlock_moniteur()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid        UUID := public.current_profile_id();
  v_n_val      INT;
  v_current    moniteur_paliers;
  v_next       moniteur_paliers;
  v_prev_thr   INT;
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;

  SELECT COUNT(*)::INT INTO v_n_val
  FROM validations
  WHERE validated_by = v_uid AND statut = 'acquis';

  -- Palier actuel (le plus haut atteint)
  SELECT * INTO v_current
  FROM moniteur_paliers
  WHERE threshold <= v_n_val
  ORDER BY palier DESC
  LIMIT 1;

  -- Palier suivant à débloquer
  SELECT * INTO v_next
  FROM moniteur_paliers
  WHERE threshold > v_n_val
  ORDER BY palier ASC
  LIMIT 1;

  v_prev_thr := COALESCE(v_current.threshold, 0);

  RETURN jsonb_build_object(
    'n_validations',  v_n_val,
    'current_palier', CASE WHEN v_current.palier IS NOT NULL THEN to_jsonb(v_current) ELSE NULL END,
    'next_palier',    CASE WHEN v_next.palier IS NOT NULL THEN to_jsonb(v_next) ELSE NULL END,
    'remaining',      GREATEST(0, COALESCE(v_next.threshold, v_n_val) - v_n_val),
    'progress_pct',   CASE
      WHEN v_next.palier IS NULL THEN 100
      ELSE ROUND(100.0 * (v_n_val - v_prev_thr) / (v_next.threshold - v_prev_thr))
    END
  );
END;
$function$
;

-- ==========================================
-- Fonction : get_my_pending_sessions
-- Rôle : Séances en attente de confirmation
-- Consommée par : components/session-confirmation-banner.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_pending_sessions()
 RETURNS TABLE(id uuid, moniteur_prenom text, moniteur_nom text, duration_minutes integer, session_date date, logged_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT s.id, p.prenom, p.nom, s.duration_minutes, s.session_date, s.logged_at
  FROM public.sessions_moniteur s
  JOIN public.profiles p ON p.id = s.moniteur_id
  WHERE s.eleve_id = current_profile_id()
    AND s.confirmation_status = 'pending'
  ORDER BY s.logged_at DESC;
$function$
;

-- ==========================================
-- Fonction : get_my_preferences
-- Rôle : Préférences utilisateur (thème…)
-- Consommée par : utils/theme.js, pages/common/settings.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_preferences()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_p public.user_preferences;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO v_p FROM user_preferences WHERE user_id = v_user_id;
  RETURN COALESCE(to_jsonb(v_p), jsonb_build_object(
    'theme', 'auto', 'language', 'fr',
    'notif_email', true, 'notif_push', true, 'notif_in_app', true,
    'marketing_optin', false, 'custom', '{}'::jsonb
  ));
END;
$function$
;

-- ==========================================
-- Fonction : get_my_referral_stats
-- Rôle : Statistiques de parrainage
-- Consommée par : pages/common/profil.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_referral_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_code    text;
  v_count   int;
  v_xp_earned int;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT referral_code INTO v_code FROM profiles WHERE id = v_user_id;
  SELECT COUNT(*)::int INTO v_count FROM profiles WHERE referred_by = v_user_id;
  v_xp_earned := v_count * 200;

  RETURN jsonb_build_object(
    'code', v_code,
    'referrals_count', v_count,
    'total_xp_earned', v_xp_earned,
    'total_gemmes_earned', v_count * 50
  );
END;
$function$
;

-- ==========================================
-- Fonction : get_my_threads
-- Rôle : Fils de discussion (messagerie)
-- Consommée par : pages/common/messages.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_threads()
 RETURNS TABLE(partner_id uuid, partner_prenom text, partner_nom text, partner_role text, last_message text, last_at timestamp with time zone, unread_count integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE v_user_id uuid := current_profile_id();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  RETURN QUERY
  WITH my_msgs AS (
    SELECT
      CASE WHEN sender_id = v_user_id THEN recipient_id ELSE sender_id END AS pid,
      body, created_at, read_at, recipient_id
    FROM messages
    WHERE sender_id = v_user_id OR recipient_id = v_user_id
  ),
  threads AS (
    SELECT
      pid,
      (array_agg(body ORDER BY created_at DESC))[1] AS last_body,
      MAX(created_at) AS last_at,
      COUNT(*) FILTER (WHERE recipient_id = v_user_id AND read_at IS NULL)::int AS unread
    FROM my_msgs
    GROUP BY pid
  )
  SELECT t.pid, p.prenom, p.nom, p.role, t.last_body, t.last_at, t.unread
  FROM threads t
  JOIN profiles p ON p.id = t.pid
  ORDER BY t.last_at DESC;
END;
$function$
;

-- ==========================================
-- Fonction : get_my_today_sessions
-- Rôle : Séances du jour du moniteur
-- Consommée par : pages/enseignant/aujourdhui.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_today_sessions()
 RETURNS TABLE(id uuid, eleve_id uuid, eleve_prenom text, duration_minutes integer, confirmation_status text, logged_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT s.id, s.eleve_id, p.prenom, s.duration_minutes, s.confirmation_status, s.logged_at
  FROM public.sessions_moniteur s
  JOIN public.profiles p ON p.id = s.eleve_id
  WHERE s.moniteur_id = current_profile_id()
    AND s.session_date = CURRENT_DATE
  ORDER BY s.logged_at DESC;
$function$
;

-- ==========================================
-- Fonction : get_pending_sessions_eleve
-- Rôle : Séances en attente côté élève
-- Consommée par : pages/eleve/accueil.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_pending_sessions_eleve()
 RETURNS TABLE(session_id uuid, moniteur_id uuid, moniteur_prenom text, moniteur_avatar text, session_date date, duration_minutes integer, notes text, logged_at timestamp with time zone, n_validations integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid UUID := public.current_profile_id();
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.moniteur_id,
    m.prenom,
    m.avatar_url,
    s.session_date,
    s.duration_minutes,
    s.notes,
    s.logged_at,
    (SELECT COUNT(*)::INT FROM validations v
      WHERE v.eleve_id = s.eleve_id
        AND v.validated_by = s.moniteur_id
        AND v.validated_at::DATE = s.session_date
        AND v.statut = 'acquis') AS n_validations
  FROM sessions_moniteur s
  JOIN profiles m ON m.id = s.moniteur_id
  WHERE s.eleve_id = v_uid
    AND s.confirmation_status = 'pending'
    AND s.session_date >= CURRENT_DATE - INTERVAL '7 days'
  ORDER BY s.logged_at DESC;
END;
$function$
;

-- ==========================================
-- Fonction : get_revision_recommendations
-- Rôle : Recommandations de révision
-- Consommée par : components/revision-cards.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_revision_recommendations(p_eleve_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 5)
 RETURNS TABLE(competence_id text, competence_nom text, monde integer, reason text, priority_score numeric, validated_at timestamp with time zone, last_fail_at timestamp with time zone, n_fails integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_target  uuid := COALESCE(p_eleve_id, v_user_id);
  v_user_role text;
  v_user_school uuid;
  v_target_school uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Sécu : élève voit ses recommandations, moniteur/gérant voient celles d'un élève de leur école
  SELECT role, auto_ecole_id INTO v_user_role, v_user_school FROM profiles WHERE id = v_user_id;
  SELECT auto_ecole_id INTO v_target_school FROM profiles WHERE id = v_target;

  IF v_user_id <> v_target
     AND NOT (v_user_role IN ('enseignant','gerant') AND v_user_school = v_target_school) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  WITH validated AS (
    SELECT v.competence_id, v.validated_at
    FROM validations v
    WHERE v.eleve_id = v_target AND v.statut = 'acquis'
  ),
  recent_quiz AS (
    SELECT
      q.competence_id,
      COUNT(*) FILTER (WHERE q.score < 70)::int AS n_fails,
      MAX(q.completed_at) FILTER (WHERE q.score < 70) AS last_fail_at,
      AVG(q.score) AS avg_score
    FROM quiz_attempts q
    WHERE q.user_id = v_target
      AND q.completed_at >= now() - INTERVAL '30 days'
      AND q.score IS NOT NULL
    GROUP BY q.competence_id
  ),
  candidates AS (
    -- Cas 1 : compétences avec quiz fails récents (priorité forte)
    SELECT
      c.id::text AS competence_id,
      c.nom::text AS competence_nom,
      c.monde::int,
      'quiz_fails'::text AS reason,
      ROUND(COALESCE(r.n_fails, 0)::numeric * 30, 1) AS priority_score,
      v.validated_at,
      r.last_fail_at,
      COALESCE(r.n_fails, 0)::int AS n_fails
    FROM competences_remc c
    JOIN validated v ON v.competence_id = c.id
    JOIN recent_quiz r ON r.competence_id = c.id
    WHERE r.n_fails >= 1

    UNION ALL

    -- Cas 2 : validations vieilles (>14j) sans quiz récent (mémoire dégradée)
    SELECT
      c.id::text, c.nom::text, c.monde::int,
      'old_validation'::text,
      ROUND(EXTRACT(EPOCH FROM (now() - v.validated_at)) / 86400 * 0.8, 1),
      v.validated_at,
      NULL::timestamptz,
      0
    FROM competences_remc c
    JOIN validated v ON v.competence_id = c.id
    LEFT JOIN recent_quiz r ON r.competence_id = c.id
    WHERE v.validated_at < now() - INTERVAL '14 days'
      AND r.competence_id IS NULL

    UNION ALL

    -- Cas 3 : validations qui ont une consolidation due (priorité critique)
    SELECT
      c.id::text, c.nom::text, c.monde::int,
      'consolidation_due'::text,
      100.0::numeric,
      v.validated_at,
      NULL::timestamptz,
      0
    FROM competences_remc c
    JOIN validations v ON v.competence_id = c.id
    WHERE v.eleve_id = v_target
      AND v.statut = 'acquis'
      AND v.consolidation_due_at IS NOT NULL
      AND v.consolidation_due_at < now()
      AND v.consolidation_done_at IS NULL
  )
  SELECT DISTINCT ON (competence_id)
    competence_id, competence_nom, monde, reason, priority_score, validated_at, last_fail_at, n_fails
  FROM candidates
  ORDER BY competence_id, priority_score DESC
  LIMIT p_limit;
END;
$function$
;

-- ==========================================
-- Fonction : get_school_trend
-- Rôle : Tendance de l'école (pulse)
-- Consommée par : pages/gerant/pulse.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_school_trend(p_days integer DEFAULT 30)
 RETURNS SETOF school_daily_snapshot
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_school_id uuid;
  v_role text;
BEGIN
  SELECT role, auto_ecole_id INTO v_role, v_school_id
    FROM profiles WHERE id = v_user_id;
  IF v_role NOT IN ('enseignant','gerant') THEN RAISE EXCEPTION 'not_authorized'; END IF;

  RETURN QUERY
  SELECT * FROM school_daily_snapshot
   WHERE auto_ecole_id = v_school_id
     AND snapshot_date >= CURRENT_DATE - p_days
   ORDER BY snapshot_date ASC;
END;
$function$
;

-- ==========================================
-- Fonction : get_thread
-- Rôle : Un fil de discussion
-- Consommée par : pages/common/messages.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_thread(p_partner_id uuid, p_limit integer DEFAULT 50, p_mark_read boolean DEFAULT true)
 RETURNS TABLE(id uuid, sender_id uuid, recipient_id uuid, body text, read_at timestamp with time zone, created_at timestamp with time zone, is_mine boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id   uuid := current_profile_id();
  v_thread_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  v_thread_id := compute_thread_id(v_user_id, p_partner_id);

  IF p_mark_read THEN
    UPDATE messages SET read_at = now()
     WHERE thread_id = v_thread_id
       AND recipient_id = v_user_id
       AND read_at IS NULL;
  END IF;

  RETURN QUERY
  SELECT m.id, m.sender_id, m.recipient_id, m.body, m.read_at, m.created_at,
         (m.sender_id = v_user_id) AS is_mine
  FROM messages m
  WHERE m.thread_id = v_thread_id
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;
$function$
;

-- ==========================================
-- Fonction : get_today_quests
-- Rôle : Quêtes du jour
-- Consommée par : components/daily-quests.js, pages/eleve/accueil.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_today_quests()
 RETURNS TABLE(quest_id text, title text, target integer, progress integer, completed boolean, claimed boolean, reward_xp integer, reward_gemmes integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id   uuid := current_profile_id();
  v_existing  int;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Si pas encore 3 quêtes pour aujourd'hui → générer
  SELECT COUNT(*) INTO v_existing
    FROM daily_quests_progress
   WHERE user_id = v_user_id AND quest_date = CURRENT_DATE;

  IF v_existing < 3 THEN
    -- Génère le set du jour : login + validation + quiz
    INSERT INTO daily_quests_progress (user_id, quest_date, quest_id, target, reward_xp, reward_gemmes)
    VALUES
      (v_user_id, CURRENT_DATE, 'quest_login',      1, 10, 5),
      (v_user_id, CURRENT_DATE, 'quest_validate_1', 1, 50, 20),
      (v_user_id, CURRENT_DATE, 'quest_quiz_1',     1, 30, 15)
    ON CONFLICT (user_id, quest_date, quest_id) DO NOTHING;

    -- Auto-complète le login (il est ici donc connecté)
    UPDATE daily_quests_progress
       SET progress = 1, completed_at = COALESCE(completed_at, now())
     WHERE user_id = v_user_id
       AND quest_date = CURRENT_DATE
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
  WHERE dq.user_id = v_user_id AND dq.quest_date = CURRENT_DATE
  ORDER BY
    CASE dq.quest_id
      WHEN 'quest_login' THEN 1
      WHEN 'quest_validate_1' THEN 2
      WHEN 'quest_quiz_1' THEN 3
      ELSE 4
    END;
END;
$function$
;

-- ==========================================
-- Fonction : get_wrapped_eleve
-- Rôle : Rétrospective « wrapped » élève
-- Consommée par : pages/eleve/wrapped.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_wrapped_eleve(p_year integer DEFAULT 2026)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid           UUID := public.current_profile_id();
  v_ecole_id      UUID;
  v_xp_total      INT;
  v_rang_ecole    INT;
  v_total_eleves  INT;
  v_percentile    INT;
  v_streak_max    INT;
  v_streak_curr   INT;
  v_top_comp_id   TEXT;
  v_top_comp_nom  TEXT;
  v_top_comp_n    INT;
  v_validations   INT;
  v_quiz_score    NUMERIC;
  v_heures        NUMERIC;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT auto_ecole_id, xp INTO v_ecole_id, v_xp_total
  FROM profiles
  WHERE id = v_uid AND role = 'eleve' AND deleted_at IS NULL;

  IF v_ecole_id IS NULL THEN
    RAISE EXCEPTION 'Wrapped reserved to active eleves' USING ERRCODE = '42501';
  END IF;

  -- Rang dans école (basé XP cumulé)
  WITH ranks AS (
    SELECT
      p.id,
      RANK() OVER (ORDER BY COALESCE(p.xp, 0) DESC) AS r,
      COUNT(*) OVER () AS n
    FROM profiles p
    WHERE p.auto_ecole_id = v_ecole_id
      AND p.role = 'eleve'
      AND p.deleted_at IS NULL
  )
  SELECT r, n INTO v_rang_ecole, v_total_eleves
  FROM ranks WHERE id = v_uid;

  v_percentile := CASE
    WHEN COALESCE(v_total_eleves, 0) = 0 THEN NULL
    ELSE GREATEST(1, ROUND(100.0 * v_rang_ecole / v_total_eleves))
  END;

  -- Streak
  SELECT current_streak, longest_streak
    INTO v_streak_curr, v_streak_max
  FROM streaks WHERE user_id = v_uid;

  v_streak_curr := COALESCE(v_streak_curr, 0);
  v_streak_max  := COALESCE(v_streak_max, 0);

  -- Top compétence (la plus validée année)
  SELECT v.competence_id, COUNT(*)::INT
    INTO v_top_comp_id, v_top_comp_n
  FROM validations v
  WHERE v.eleve_id = v_uid
    AND v.statut = 'acquis'
    AND EXTRACT(YEAR FROM v.validated_at) = p_year
  GROUP BY v.competence_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  IF v_top_comp_id IS NOT NULL THEN
    SELECT nom INTO v_top_comp_nom FROM competences_remc WHERE id = v_top_comp_id;
  END IF;

  -- Validations totales année
  SELECT COUNT(*)::INT INTO v_validations
  FROM validations
  WHERE eleve_id = v_uid
    AND statut = 'acquis'
    AND EXTRACT(YEAR FROM validated_at) = p_year;

  -- Score quiz moyen année
  SELECT COALESCE(AVG(score), 0) INTO v_quiz_score
  FROM quiz_attempts
  WHERE user_id = v_uid
    AND EXTRACT(YEAR FROM completed_at) = p_year;

  -- Heures conduite année (sessions confirmées)
  SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 INTO v_heures
  FROM sessions_moniteur
  WHERE eleve_id = v_uid
    AND confirmed_at IS NOT NULL
    AND EXTRACT(YEAR FROM session_date) = p_year;

  RETURN jsonb_build_object(
    'year',               p_year,
    'xp_total',           COALESCE(v_xp_total, 0),
    'rang_ecole',         v_rang_ecole,
    'total_eleves',       v_total_eleves,
    'percentile',         v_percentile,
    'streak_max',         v_streak_max,
    'streak_curr',        v_streak_curr,
    'top_competence_id',  v_top_comp_id,
    'top_competence_nom', v_top_comp_nom,
    'top_competence_n',   COALESCE(v_top_comp_n, 0),
    'validations',        COALESCE(v_validations, 0),
    'quiz_score_avg',     ROUND(v_quiz_score, 1),
    'heures_conduite',    ROUND(v_heures, 1),
    'generated_at',       NOW()
  );
END;
$function$
;

-- ==========================================
-- Fonction : log_session
-- Rôle : Enregistre une séance de conduite
-- Consommée par : components/log-session-modal.js, pages/enseignant/log-session.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.log_session(p_eleve_id uuid, p_duration_minutes integer, p_session_date date DEFAULT CURRENT_DATE, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_moniteur_id uuid := current_profile_id();
  v_role        text;
  v_session     public.sessions_moniteur;
  v_day_total   int;
  v_week_total  int;
  v_week_start  date;
BEGIN
  IF v_moniteur_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_moniteur_id;
  IF v_role NOT IN ('enseignant','gerant') THEN
    RETURN jsonb_build_object('error', 'wrong_role');
  END IF;
  IF p_duration_minutes NOT IN (30,45,60,75,90,105,120,135,150,165,180) THEN
    RETURN jsonb_build_object('error', 'invalid_duration');
  END IF;
  IF p_session_date > CURRENT_DATE THEN
    RETURN jsonb_build_object('error', 'session_in_future');
  END IF;
  IF p_session_date < CURRENT_DATE - INTERVAL '7 days' THEN
    RETURN jsonb_build_object('error', 'session_too_old');
  END IF;

  SELECT COALESCE(SUM(duration_minutes), 0) INTO v_day_total
    FROM public.sessions_moniteur
   WHERE moniteur_id = v_moniteur_id AND session_date = p_session_date
     AND confirmation_status <> 'refused';
  IF v_day_total + p_duration_minutes > 600 THEN
    RETURN jsonb_build_object('error', 'cap_daily_exceeded',
      'current_minutes', v_day_total, 'cap_minutes', 600);
  END IF;

  v_week_start := p_session_date - ((EXTRACT(DOW FROM p_session_date)::int + 6) % 7);
  SELECT COALESCE(SUM(duration_minutes), 0) INTO v_week_total
    FROM public.sessions_moniteur
   WHERE moniteur_id = v_moniteur_id
     AND session_date >= v_week_start AND session_date < v_week_start + INTERVAL '7 days'
     AND confirmation_status <> 'refused';
  IF v_week_total + p_duration_minutes > 3000 THEN
    RETURN jsonb_build_object('error', 'cap_weekly_exceeded',
      'current_minutes', v_week_total, 'cap_minutes', 3000);
  END IF;

  INSERT INTO public.sessions_moniteur (moniteur_id, eleve_id, duration_minutes, session_date, notes)
  VALUES (v_moniteur_id, p_eleve_id, p_duration_minutes, p_session_date, p_notes)
  RETURNING * INTO v_session;

  RETURN jsonb_build_object('ok', true, 'session', to_jsonb(v_session));
END;
$function$
;

-- ==========================================
-- Fonction : log_session
-- Rôle : Enregistre une séance de conduite
-- Consommée par : components/log-session-modal.js, pages/enseignant/log-session.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.log_session(p_eleve_id uuid, p_duration_minutes integer, p_session_date date DEFAULT CURRENT_DATE, p_notes text DEFAULT NULL::text, p_competence_ids text[] DEFAULT NULL::text[], p_comment text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_moniteur_id uuid := current_profile_id();
  v_role text; v_session public.sessions_moniteur;
  v_day_total int; v_week_total int; v_week_start date;
  v_comp text; v_validations jsonb := '[]'::jsonb; v_one_val record; v_final_notes text;
BEGIN
  IF v_moniteur_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = v_moniteur_id;
  IF v_role NOT IN ('enseignant','gerant') THEN RETURN jsonb_build_object('error','wrong_role'); END IF;
  IF p_duration_minutes NOT IN (30,45,60,75,90,105,120,135,150,165,180) THEN RETURN jsonb_build_object('error','invalid_duration'); END IF;
  IF p_session_date > CURRENT_DATE THEN RETURN jsonb_build_object('error','session_in_future'); END IF;
  IF p_session_date < CURRENT_DATE - INTERVAL '7 days' THEN RETURN jsonb_build_object('error','session_too_old'); END IF;

  SELECT COALESCE(SUM(duration_minutes),0) INTO v_day_total FROM public.sessions_moniteur
   WHERE moniteur_id = v_moniteur_id AND session_date = p_session_date AND confirmation_status <> 'refused';
  IF v_day_total + p_duration_minutes > 600 THEN RETURN jsonb_build_object('error','cap_daily_exceeded','current_minutes',v_day_total,'cap_minutes',600); END IF;

  v_week_start := p_session_date - ((EXTRACT(DOW FROM p_session_date)::int + 6) % 7);
  SELECT COALESCE(SUM(duration_minutes),0) INTO v_week_total FROM public.sessions_moniteur
   WHERE moniteur_id = v_moniteur_id AND session_date >= v_week_start AND session_date < v_week_start + INTERVAL '7 days' AND confirmation_status <> 'refused';
  IF v_week_total + p_duration_minutes > 3000 THEN RETURN jsonb_build_object('error','cap_weekly_exceeded','current_minutes',v_week_total,'cap_minutes',3000); END IF;

  v_final_notes := COALESCE(p_comment, p_notes, NULL);

  INSERT INTO public.sessions_moniteur (moniteur_id, eleve_id, duration_minutes, session_date, notes)
  VALUES (v_moniteur_id, p_eleve_id, p_duration_minutes, p_session_date, v_final_notes)
  RETURNING * INTO v_session;

  IF p_competence_ids IS NOT NULL AND array_length(p_competence_ids,1) > 0 THEN
    FOREACH v_comp IN ARRAY p_competence_ids LOOP
      BEGIN
        -- 'a_valider' : la séance DÉBLOQUE la compétence ; l'élève la valide ensuite par quiz
        INSERT INTO public.validations (eleve_id, competence_id, validated_by, validated_at, statut, note_enseignant)
        VALUES (p_eleve_id, v_comp, v_moniteur_id, now(), 'a_valider', p_comment)
        RETURNING * INTO v_one_val;
        v_validations := v_validations || jsonb_build_object('competence_id', v_one_val.competence_id, 'created', true, 'statut', 'a_valider');
      EXCEPTION WHEN unique_violation THEN
        v_validations := v_validations || jsonb_build_object('competence_id', v_comp, 'created', false, 'reason', 'already_exists');
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', true, 'session', to_jsonb(v_session), 'validations', v_validations);
END;
$function$
;

-- ==========================================
-- Fonction : mark_all_notifs_read
-- Rôle : Marque toutes les notifications comme lues
-- Consommée par : components/notif-bell.js, pages/common/notifications.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.mark_all_notifs_read(p_type text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_count   int;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE public.notifications
     SET read = true, read_at = COALESCE(read_at, now())
   WHERE user_id = v_user_id
     AND read = false
     AND (p_type IS NULL OR type = p_type);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'marked', v_count);
END;
$function$
;

-- ==========================================
-- Fonction : mark_notif_read
-- Rôle : Marque une notification comme lue
-- Consommée par : components/emotional-banner.js, components/notif-bell.js, pages/common/notifications.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.mark_notif_read(p_notif_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_n       public.notifications;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE public.notifications
     SET read = true, read_at = COALESCE(read_at, now())
   WHERE id = p_notif_id
     AND user_id = v_user_id
   RETURNING * INTO v_n;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$function$
;

-- ==========================================
-- Fonction : open_chest
-- Rôle : Ouvre un coffre
-- Consommée par : utils/game-state.js
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
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE public.chest_unlocks
     SET opened_at = now()
   WHERE user_id = v_user_id AND chest_type = p_chest_type AND opened_at IS NULL
   RETURNING * INTO v_chest;

  IF NOT FOUND THEN
    SELECT * INTO v_chest FROM public.chest_unlocks
     WHERE user_id = v_user_id AND chest_type = p_chest_type;
    IF FOUND THEN
      RETURN jsonb_build_object('error', 'already_opened', 'chest', to_jsonb(v_chest));
    ELSE
      RETURN jsonb_build_object('error', 'not_unlocked');
    END IF;
  END IF;

  RETURN jsonb_build_object('opened', true, 'chest', to_jsonb(v_chest));
END;
$function$
;

-- ==========================================
-- Fonction : predict_exam_ready_date
-- Rôle : Prédit la date de préparation à l'examen
-- Consommée par : pages/eleve/examen.js
-- ==========================================
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
$function$
;

-- ==========================================
-- Fonction : purchase_item
-- Rôle : Achète un item de la boutique
-- Consommée par : pages/eleve/boutique.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.purchase_item(p_item_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_item    public.items_catalog;
  v_current_gemmes int;
  v_inv     public.user_inventory;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO v_item FROM items_catalog WHERE id = p_item_id AND active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'item_not_found'); END IF;

  IF EXISTS (SELECT 1 FROM user_inventory WHERE user_id = v_user_id AND item_id = p_item_id) THEN
    RETURN jsonb_build_object('error', 'already_owned');
  END IF;

  SELECT COALESCE(gemmes, 0) INTO v_current_gemmes FROM profiles WHERE id = v_user_id;
  IF v_current_gemmes < v_item.cost_gemmes THEN
    RETURN jsonb_build_object('error', 'insufficient_gemmes',
      'current', v_current_gemmes, 'required', v_item.cost_gemmes);
  END IF;

  PERFORM _set_trusted_op();  -- bypass protect_profile_fields gemmes check
  UPDATE profiles SET gemmes = gemmes - v_item.cost_gemmes WHERE id = v_user_id;

  INSERT INTO user_inventory (user_id, item_id, paid_gemmes)
  VALUES (v_user_id, p_item_id, v_item.cost_gemmes)
  RETURNING * INTO v_inv;

  RETURN jsonb_build_object('ok', true, 'item', to_jsonb(v_item),
    'new_balance', v_current_gemmes - v_item.cost_gemmes,
    'inventory_entry', to_jsonb(v_inv));
END;
$function$
;

-- ==========================================
-- Fonction : send_message
-- Rôle : Envoie un message
-- Consommée par : pages/common/messages.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.send_message(p_recipient_id uuid, p_body text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sender_id uuid := current_profile_id();
  v_sender_school uuid;
  v_recipient_school uuid;
  v_sender_role text;
  v_recipient_role text;
  v_thread_id uuid;
  v_msg       public.messages;
  v_n_recent_total int;
  v_n_recent_to_same int;
  v_body_len int;
BEGIN
  IF v_sender_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF v_sender_id = p_recipient_id THEN
    RETURN jsonb_build_object('error', 'cannot_message_self');
  END IF;

  v_body_len := length(trim(COALESCE(p_body, '')));
  IF v_body_len = 0 THEN RETURN jsonb_build_object('error', 'empty_body'); END IF;
  IF v_body_len > 1000 THEN RETURN jsonb_build_object('error', 'body_too_long', 'max', 1000); END IF;

  -- Rate limit : max 20 messages dans la dernière heure
  SELECT COUNT(*) INTO v_n_recent_total FROM messages
   WHERE sender_id = v_sender_id AND created_at > NOW() - INTERVAL '1 hour';
  IF v_n_recent_total >= 20 THEN
    RETURN jsonb_build_object('error', 'rate_limit_hourly', 'max', 20,
                              'retry_in_minutes', 60);
  END IF;

  -- Rate limit : max 5 messages vers le même destinataire en 5 minutes
  SELECT COUNT(*) INTO v_n_recent_to_same FROM messages
   WHERE sender_id = v_sender_id AND recipient_id = p_recipient_id
     AND created_at > NOW() - INTERVAL '5 minutes';
  IF v_n_recent_to_same >= 5 THEN
    RETURN jsonb_build_object('error', 'rate_limit_same_recipient', 'max', 5,
                              'retry_in_minutes', 5);
  END IF;

  SELECT role, auto_ecole_id INTO v_sender_role, v_sender_school
    FROM profiles WHERE id = v_sender_id;
  SELECT role, auto_ecole_id INTO v_recipient_role, v_recipient_school
    FROM profiles WHERE id = p_recipient_id;

  IF v_sender_school IS DISTINCT FROM v_recipient_school THEN
    RETURN jsonb_build_object('error', 'different_school');
  END IF;

  IF NOT (
    (v_sender_role = 'eleve'      AND v_recipient_role IN ('enseignant','gerant')) OR
    (v_sender_role = 'enseignant' AND v_recipient_role IN ('eleve','enseignant','gerant')) OR
    (v_sender_role = 'gerant'     AND v_recipient_role IN ('eleve','enseignant'))
  ) THEN
    RETURN jsonb_build_object('error', 'invalid_pair');
  END IF;

  v_thread_id := compute_thread_id(v_sender_id, p_recipient_id);

  INSERT INTO messages (sender_id, recipient_id, thread_id, body)
  VALUES (v_sender_id, p_recipient_id, v_thread_id, p_body)
  RETURNING * INTO v_msg;

  -- Notif anti-spam : 1 seule notif par 5 min même expéditeur
  IF NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = p_recipient_id
      AND type = 'emotional_nudge'
      AND data->>'sender_id' = v_sender_id::text
      AND created_at > NOW() - INTERVAL '5 minutes'
  ) THEN
    INSERT INTO notifications (user_id, type, title, body, data) VALUES (
      p_recipient_id, 'emotional_nudge',
      '💬 Nouveau message', 'Tu as reçu un message — ouvre PermiGo pour lire.',
      jsonb_build_object('template_id', 'new_message', 'tone', 'gentle',
        'title', '💬 Nouveau message',
        'body', 'Tu as reçu un message — ouvre PermiGo pour lire.',
        'cta', 'Ouvrir', 'route', '#/messages',
        'thread_id', v_thread_id, 'sender_id', v_sender_id));
  END IF;

  RETURN jsonb_build_object('ok', true, 'message', to_jsonb(v_msg));
END;
$function$
;

-- ==========================================
-- Fonction : send_quiz_notification
-- Rôle : Notifie l'élève du quiz post-validation
-- Consommée par : pages/enseignant/validation.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.send_quiz_notification(p_eleve_id uuid, p_competence_id text, p_comp_nom text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_caller uuid := current_profile_id();
  v_caller_role text;
  v_caller_ecole uuid;
  v_eleve_ecole uuid;
begin
  if v_caller is null then
    raise exception 'not authenticated';
  end if;

  select role, auto_ecole_id into v_caller_role, v_caller_ecole
  from profiles where id = v_caller;

  if v_caller_role not in ('enseignant','gerant') then
    raise exception 'forbidden: only staff can send quiz notifications';
  end if;

  select auto_ecole_id into v_eleve_ecole from profiles where id = p_eleve_id;

  if v_eleve_ecole is null or v_eleve_ecole is distinct from v_caller_ecole then
    raise exception 'forbidden: eleve not in your auto-ecole';
  end if;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    p_eleve_id,
    'post_validation_quiz',
    'Nouvelle compétence à valider !',
    coalesce(nullif(p_comp_nom, ''), 'Nouvelle compétence') || ' — Fais le quiz en 30 sec',
    jsonb_build_object('competence_id', p_competence_id)
  );
end;
$function$
;

-- ==========================================
-- Fonction : set_my_preferences
-- Rôle : Enregistre les préférences utilisateur
-- Consommée par : pages/common/settings.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.set_my_preferences(p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := current_profile_id();
  v_p       public.user_preferences;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  INSERT INTO user_preferences (user_id, theme, language, notif_email, notif_push, notif_in_app, dnd_start, dnd_end, marketing_optin, custom, updated_at)
  VALUES (
    v_user_id,
    NULLIF(p_data->>'theme', ''),
    COALESCE(NULLIF(p_data->>'language',''), 'fr'),
    COALESCE((p_data->>'notif_email')::boolean, true),
    COALESCE((p_data->>'notif_push')::boolean, true),
    COALESCE((p_data->>'notif_in_app')::boolean, true),
    (p_data->>'dnd_start')::time,
    (p_data->>'dnd_end')::time,
    COALESCE((p_data->>'marketing_optin')::boolean, false),
    COALESCE(p_data->'custom', '{}'::jsonb),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    theme        = COALESCE(NULLIF(p_data->>'theme',''), user_preferences.theme),
    language     = COALESCE(NULLIF(p_data->>'language',''), user_preferences.language),
    notif_email  = COALESCE((p_data->>'notif_email')::boolean, user_preferences.notif_email),
    notif_push   = COALESCE((p_data->>'notif_push')::boolean, user_preferences.notif_push),
    notif_in_app = COALESCE((p_data->>'notif_in_app')::boolean, user_preferences.notif_in_app),
    dnd_start    = COALESCE((p_data->>'dnd_start')::time, user_preferences.dnd_start),
    dnd_end      = COALESCE((p_data->>'dnd_end')::time, user_preferences.dnd_end),
    marketing_optin = COALESCE((p_data->>'marketing_optin')::boolean, user_preferences.marketing_optin),
    custom       = COALESCE(p_data->'custom', user_preferences.custom),
    updated_at   = now()
  RETURNING * INTO v_p;

  RETURN jsonb_build_object('ok', true, 'preferences', to_jsonb(v_p));
END;
$function$
;

-- ==========================================
-- Fonction : start_exam_blanc
-- Rôle : Démarre un examen blanc
-- Consommée par : pages/eleve/exam-blanc.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.start_exam_blanc()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id   uuid := current_profile_id();
  v_questions jsonb;
  v_session   public.exam_blanc_sessions;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Tire 40 questions aléatoires depuis remc_questions (proportions 31 comp REMC)
  SELECT jsonb_agg(jsonb_build_object(
    'id', q.id,
    'competence_id', q.competence_id,
    'question', q.question,
    'choices', q.choices,
    'correct_idx', q.correct_idx,
    'explanation', q.explanation
  ))
  INTO v_questions
  FROM (
    SELECT * FROM remc_questions ORDER BY random() LIMIT 40
  ) q;

  IF v_questions IS NULL OR jsonb_array_length(v_questions) = 0 THEN
    RETURN jsonb_build_object('error', 'no_questions_available');
  END IF;

  INSERT INTO exam_blanc_sessions (user_id, questions)
  VALUES (v_user_id, v_questions)
  RETURNING * INTO v_session;

  -- Retourne les questions SANS la correct_idx (anti-cheat)
  RETURN jsonb_build_object(
    'session_id', v_session.id,
    'started_at', v_session.started_at,
    'questions', (
      SELECT jsonb_agg(q - 'correct_idx' - 'explanation')
      FROM jsonb_array_elements(v_questions) q
    )
  );
END;
$function$
;

-- ==========================================
-- Fonction : submit_competence_quiz
-- Rôle : Soumet le quiz d'une compétence
-- Consommée par : pages/eleve/quiz.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.submit_competence_quiz(p_competence_id text, p_score integer, p_type text DEFAULT 'post_validation'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_eleve uuid := current_profile_id();
  v_val_id uuid; v_old_statut text; v_passed boolean;
BEGIN
  IF v_eleve IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  IF p_score IS NULL OR p_score < 0 OR p_score > 100 THEN RETURN jsonb_build_object('error','invalid_score'); END IF;

  -- Enregistre la tentative
  INSERT INTO quiz_attempts (user_id, competence_id, type, questions_ids, answers_indices, score, completed_at)
  VALUES (v_eleve, p_competence_id, p_type, ARRAY[]::uuid[], ARRAY[]::int[], p_score, now());

  v_passed := p_score >= 70;

  SELECT id, statut INTO v_val_id, v_old_statut FROM validations
   WHERE eleve_id = v_eleve AND competence_id = p_competence_id ORDER BY validated_at DESC LIMIT 1;

  IF v_val_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'passed', v_passed, 'validated', false, 'reason', 'no_competence_unlocked');
  END IF;

  IF v_old_statut = 'acquis' THEN
    RETURN jsonb_build_object('ok', true, 'passed', v_passed, 'validated', true, 'reason', 'already_acquired');
  END IF;

  IF v_passed THEN
    UPDATE validations SET statut = 'acquis', score_cognitif = p_score WHERE id = v_val_id;
    RETURN jsonb_build_object('ok', true, 'passed', true, 'validated', true);
  ELSE
    RETURN jsonb_build_object('ok', true, 'passed', false, 'validated', false, 'reason', 'score_too_low');
  END IF;
END;
$function$
;

-- ==========================================
-- Fonction : submit_exam_blanc
-- Rôle : Soumet un examen blanc
-- Consommée par : pages/eleve/exam-blanc.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.submit_exam_blanc(p_session_id uuid, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id      uuid := current_profile_id();
  v_session      public.exam_blanc_sessions;
  v_correct      int := 0;
  v_total        int := 0;
  v_score        int;
  v_duration     int;
  v_results      jsonb := '[]'::jsonb;
  v_q            jsonb;
  v_a            jsonb;
  v_correct_idx  int;
  v_selected     int;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO v_session
    FROM exam_blanc_sessions
   WHERE id = p_session_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'session_not_found');
  END IF;
  IF v_session.submitted_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'already_submitted');
  END IF;

  -- Calcule le score
  FOR v_q IN SELECT * FROM jsonb_array_elements(v_session.questions) LOOP
    v_total := v_total + 1;
    v_correct_idx := (v_q->>'correct_idx')::int;

    v_a := (
      SELECT a FROM jsonb_array_elements(p_answers) a
      WHERE (a->>'question_id')::uuid = (v_q->>'id')::uuid
      LIMIT 1
    );
    v_selected := COALESCE((v_a->>'selected_idx')::int, -1);

    v_results := v_results || jsonb_build_object(
      'question_id', v_q->>'id',
      'selected_idx', v_selected,
      'correct_idx', v_correct_idx,
      'is_correct', (v_selected = v_correct_idx)
    );

    IF v_selected = v_correct_idx THEN
      v_correct := v_correct + 1;
    END IF;
  END LOOP;

  v_score    := ROUND((v_correct::numeric / NULLIF(v_total, 0)) * 100);
  v_duration := EXTRACT(EPOCH FROM (now() - v_session.started_at))::int;

  UPDATE exam_blanc_sessions
     SET submitted_at = now(),
         answers      = v_results,
         score        = v_score,
         duration_sec = v_duration
   WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'ok', true,
    'score', v_score,
    'correct', v_correct,
    'total', v_total,
    'duration_sec', v_duration,
    'passed', (v_score >= 70),
    'results', v_results
  );
END;
$function$
;

-- ==========================================
-- Fonction : suggest_next_session
-- Rôle : Suggère la prochaine séance
-- Consommée par : components/log-session-modal.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.suggest_next_session(p_day_of_week integer DEFAULT NULL::integer)
 RETURNS TABLE(eleve_id uuid, eleve_prenom text, typical_duration integer, last_seen_at timestamp with time zone, occurrence_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT s.eleve_id, s.duration_minutes, s.logged_at, s.session_date
    FROM public.sessions_moniteur s
    WHERE s.moniteur_id = current_profile_id()
      AND s.session_date >= CURRENT_DATE - INTERVAL '60 days'
      AND (p_day_of_week IS NULL OR EXTRACT(DOW FROM s.session_date)::int = p_day_of_week)
  ),
  per_eleve AS (
    SELECT eleve_id,
      MODE() WITHIN GROUP (ORDER BY duration_minutes) AS typical_duration,
      MAX(logged_at)  AS last_seen_at,
      COUNT(*)::int   AS occurrence_count
    FROM base GROUP BY eleve_id
  )
  SELECT pe.eleve_id, p.prenom, pe.typical_duration, pe.last_seen_at, pe.occurrence_count
  FROM per_eleve pe
  JOIN public.profiles p ON p.id = pe.eleve_id
  ORDER BY pe.occurrence_count DESC, pe.last_seen_at DESC
  LIMIT 5;
$function$
;

-- ==========================================
-- Fonction : unlock_chest
-- Rôle : Déverrouille un coffre
-- Consommée par : utils/game-state.js
-- ==========================================
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

  -- ✨ NOUVEAU : validation côté serveur du seuil métier
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
      SELECT COUNT(*) INTO v_n_comp_acquired
        FROM validations v
        JOIN competences_remc c ON c.id = v.competence_id
        WHERE v.eleve_id = v_user_id AND v.statut = 'acquis' AND c.monde = v_world_num;
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
$function$
;

-- ==========================================
-- Fonction : use_streak_freeze
-- Rôle : Utilise un gel de série (streak freeze)
-- Consommée par : pages/eleve/accueil.js
-- ==========================================
CREATE OR REPLACE FUNCTION public.use_streak_freeze(p_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id      uuid := current_profile_id();
  v_cost         int  := 50;
  v_current_gemmes int;
  v_streak       record;
  v_freeze       public.streak_freezes;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  IF p_date > CURRENT_DATE OR p_date < CURRENT_DATE - 1 THEN
    RETURN jsonb_build_object('error', 'invalid_date', 'allowed', 'today_or_yesterday');
  END IF;

  IF EXISTS (SELECT 1 FROM streak_freezes WHERE user_id = v_user_id AND frozen_date = p_date) THEN
    RETURN jsonb_build_object('error', 'already_frozen', 'date', p_date);
  END IF;

  SELECT COALESCE(gemmes, 0) INTO v_current_gemmes FROM profiles WHERE id = v_user_id;
  IF v_current_gemmes < v_cost THEN
    RETURN jsonb_build_object('error', 'insufficient_gemmes',
      'current', v_current_gemmes, 'required', v_cost);
  END IF;

  SELECT current_streak, last_activity_date, longest_streak INTO v_streak
    FROM streaks WHERE user_id = v_user_id;

  PERFORM _set_trusted_op();
  UPDATE profiles SET gemmes = gemmes - v_cost WHERE id = v_user_id;

  INSERT INTO streak_freezes (user_id, frozen_date, cost_gemmes)
  VALUES (v_user_id, p_date, v_cost) RETURNING * INTO v_freeze;

  INSERT INTO streaks (user_id, current_streak, last_activity_date, longest_streak)
  VALUES (v_user_id, GREATEST(COALESCE(v_streak.current_streak, 0), 1), p_date,
          COALESCE(v_streak.longest_streak, 1))
  ON CONFLICT (user_id) DO UPDATE
    SET last_activity_date = GREATEST(streaks.last_activity_date, p_date);

  RETURN jsonb_build_object('ok', true, 'freeze', to_jsonb(v_freeze),
    'new_balance', v_current_gemmes - v_cost, 'streak_preserved', true);
END;
$function$
;
