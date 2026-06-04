-- ============================================================================
-- 0008_demo_core_recovery.sql
-- NOYAU DÉMO : objets prod (projet arrfmdagdqtrtfbhxlty) marqués "Critique démo ? OUI"
-- dans AUDIT_OBJETS_MANQUANTS_2026-05-20.md, absents des migrations 0000-0007.
-- Extrait le 2026-05-20 en lecture seule (pg_get_functiondef / triggerdef / viewdef
-- + reconstruction de DDL des tables depuis le catalogue). Corps verbatim.
--
-- Ordre : helper -> tables -> matview (+refresh) -> trigger-functions -> triggers.
-- check_function_bodies = off : ordre de création non strict pour les corps plpgsql.
--
-- CAVEATS :
--  * Les CHECK de sessions_moniteur utilisent CURRENT_DATE (fonction STABLE) : Postgres
--    l'accepte (avec warning). Conserve verbatim depuis la prod.
--  * Dépendances assumées présentes : tables profiles, validations, quiz_attempts,
--    notifications, auto_ecoles (migrations 0000) + colonnes profiles.xp / auth_id /
--    notif_push / auto_ecole_id / role. Vérifier sur une branche Supabase avant prod.
--  * La matview se peuple à la création (CREATE MATERIALIZED VIEW ... AS). refresh CONCURRENTLY
--    nécessite l'index unique (créé juste après).
-- ============================================================================

set check_function_bodies = off;

-- ==========================================
-- 1. HELPER
-- Fonction : current_profile_id()
-- Rôle : Résout le profile.id de l'utilisateur courant (auth.uid()) — socle de 46 RPC
-- ==========================================
CREATE OR REPLACE FUNCTION public.current_profile_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT id FROM public.profiles WHERE auth_id = auth.uid();
$function$
;

-- ==========================================
-- 2. TABLES
-- ==========================================

-- ==========================================
-- Table : sessions_moniteur
-- Rôle : Séances déclarées par le moniteur (flux séance->quiz, classement, cockpit)
-- Consommée par : log_session, confirm_session, get_moniteur_ranking, get_gerant_cockpit, get_my_today_sessions, ...
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sessions_moniteur (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  moniteur_id uuid NOT NULL,
  eleve_id uuid NOT NULL,
  duration_minutes integer NOT NULL,
  session_date date NOT NULL,
  logged_at timestamp with time zone DEFAULT now() NOT NULL,
  confirmation_status text DEFAULT 'pending'::text NOT NULL,
  confirmed_at timestamp with time zone,
  flagged boolean DEFAULT false NOT NULL,
  notes text,
  CONSTRAINT sessions_moniteur_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_moniteur_moniteur_id_fkey FOREIGN KEY (moniteur_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT sessions_moniteur_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT sessions_moniteur_duration_minutes_check CHECK ((duration_minutes = ANY (ARRAY[30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180]))),
  CONSTRAINT sessions_moniteur_confirmation_status_check CHECK ((confirmation_status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'refused'::text, 'auto'::text]))),
  CONSTRAINT sessions_session_date_not_future CHECK ((session_date <= CURRENT_DATE)),
  CONSTRAINT sessions_session_date_not_too_old CHECK ((session_date >= (CURRENT_DATE - '7 days'::interval)))
);
ALTER TABLE public.sessions_moniteur ENABLE ROW LEVEL SECURITY;
CREATE POLICY "moniteur reads own sessions" ON public.sessions_moniteur AS PERMISSIVE FOR SELECT TO public USING ((moniteur_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "eleve reads sessions about him" ON public.sessions_moniteur AS PERMISSIVE FOR SELECT TO public USING ((eleve_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "gerant reads sessions of school" ON public.sessions_moniteur AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (profiles p_gerant
     JOIN profiles p_moniteur ON ((p_moniteur.auto_ecole_id = p_gerant.auto_ecole_id)))
  WHERE ((p_gerant.auth_id = ( SELECT auth.uid() AS uid)) AND (p_gerant.role = 'gerant'::text) AND (p_moniteur.id = sessions_moniteur.moniteur_id)))));
CREATE INDEX idx_sessions_eleve_pending ON public.sessions_moniteur USING btree (eleve_id, confirmation_status) WHERE (confirmation_status = 'pending'::text);
CREATE INDEX idx_sessions_moniteur_id_date ON public.sessions_moniteur USING btree (moniteur_id, session_date DESC);
CREATE INDEX idx_sessions_logged_at ON public.sessions_moniteur USING btree (logged_at DESC);
CREATE INDEX idx_sessions_moniteur_status_date ON public.sessions_moniteur USING btree (moniteur_id, confirmation_status, session_date DESC) WHERE (confirmation_status = ANY (ARRAY['confirmed'::text, 'auto'::text]));
CREATE INDEX idx_sessions_moniteur_eleve_date ON public.sessions_moniteur USING btree (eleve_id, session_date DESC) WHERE (confirmed_at IS NOT NULL);
CREATE INDEX idx_sessions_moniteur_mon_date ON public.sessions_moniteur USING btree (moniteur_id, session_date DESC) WHERE (confirmed_at IS NOT NULL);

-- ==========================================
-- Table : exam_blanc_sessions
-- Rôle : Sessions d'examen blanc (dépendance du cockpit gérant + examen élève)
-- Consommée par : get_gerant_cockpit, start_exam_blanc, submit_exam_blanc
-- ==========================================
CREATE TABLE IF NOT EXISTS public.exam_blanc_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  submitted_at timestamp with time zone,
  questions jsonb NOT NULL,
  answers jsonb,
  score integer,
  duration_sec integer,
  CONSTRAINT exam_blanc_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT exam_blanc_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.exam_blanc_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user reads own exams" ON public.exam_blanc_sessions AS PERMISSIVE FOR SELECT TO public USING ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "moniteur reads school exams" ON public.exam_blanc_sessions AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (profiles p_user
     JOIN profiles p_eleve ON ((p_eleve.auto_ecole_id = p_user.auto_ecole_id)))
  WHERE ((p_user.auth_id = ( SELECT auth.uid() AS uid)) AND (p_user.role = ANY (ARRAY['enseignant'::text, 'gerant'::text])) AND (p_eleve.id = exam_blanc_sessions.user_id)))));
CREATE INDEX idx_exam_blanc_user_date ON public.exam_blanc_sessions USING btree (user_id, started_at DESC);

-- ==========================================
-- 3. MATVIEW : moniteur_ranking_mv (+ refresh)
-- Rôle : Classement mensuel des moniteurs par auto-école (value-prop)
-- Consommée par : get_moniteur_ranking
-- ==========================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.moniteur_ranking_mv AS
WITH this_month AS (
         SELECT (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))::date AS m_start,
            ((date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) + '1 mon'::interval))::date AS m_end
        ), base_sessions AS (
         SELECT s.moniteur_id,
            s.eleve_id,
            s.duration_minutes,
            s.session_date,
            p.auto_ecole_id
           FROM ((sessions_moniteur s
             JOIN profiles p ON ((p.id = s.moniteur_id)))
             CROSS JOIN this_month tm)
          WHERE ((s.session_date >= tm.m_start) AND (s.session_date < tm.m_end) AND (s.confirmation_status = ANY (ARRAY['confirmed'::text, 'auto'::text])))
        ), per_moniteur AS (
         SELECT base_sessions.moniteur_id,
            base_sessions.auto_ecole_id,
            round(((sum(base_sessions.duration_minutes))::numeric / 60.0), 1) AS hours_confirmed,
            (count(DISTINCT base_sessions.eleve_id))::integer AS n_eleves_diff,
            (count(DISTINCT base_sessions.session_date))::integer AS n_jours_actifs
           FROM base_sessions
          GROUP BY base_sessions.moniteur_id, base_sessions.auto_ecole_id
        ), validations_per AS (
         SELECT v.validated_by AS moniteur_id,
            (count(*))::integer AS n_validations
           FROM (validations v
             CROSS JOIN this_month tm)
          WHERE ((v.validated_at >= tm.m_start) AND (v.validated_at < tm.m_end) AND (v.statut = 'acquis'::text))
          GROUP BY v.validated_by
        ), merged AS (
         SELECT p.id AS moniteur_id,
            p.auto_ecole_id,
            p.prenom,
            p.nom,
            COALESCE(pm.hours_confirmed, (0)::numeric) AS hours_confirmed,
            COALESCE(vp.n_validations, 0) AS n_validations,
            COALESCE(pm.n_eleves_diff, 0) AS n_eleves_diff,
            COALESCE(pm.n_jours_actifs, 0) AS n_jours_actifs
           FROM ((profiles p
             LEFT JOIN per_moniteur pm ON ((pm.moniteur_id = p.id)))
             LEFT JOIN validations_per vp ON ((vp.moniteur_id = p.id)))
          WHERE ((p.role = 'enseignant'::text) AND (p.auto_ecole_id IS NOT NULL))
        ), scored AS (
         SELECT m.moniteur_id,
            m.auto_ecole_id,
            m.prenom,
            m.nom,
            m.hours_confirmed,
            m.n_validations,
            m.n_eleves_diff,
            m.n_jours_actifs,
            round(((((m.hours_confirmed * 0.40) + ((m.n_validations)::numeric * 0.25)) + (((m.n_eleves_diff)::numeric * 1.50) * 0.20)) + (((m.n_jours_actifs)::numeric * 0.50) * 0.15)), 2) AS score_total
           FROM merged m
        )
 SELECT moniteur_id,
    auto_ecole_id,
    prenom,
    nom,
    hours_confirmed,
    n_validations,
    n_eleves_diff,
    n_jours_actifs,
    score_total,
    (row_number() OVER (PARTITION BY auto_ecole_id ORDER BY score_total DESC))::integer AS rank,
    now() AS refreshed_at
   FROM scored;
CREATE UNIQUE INDEX idx_moniteur_ranking_mv_pk ON public.moniteur_ranking_mv USING btree (moniteur_id);
CREATE INDEX idx_moniteur_ranking_mv_school_rank ON public.moniteur_ranking_mv USING btree (auto_ecole_id, rank);

CREATE OR REPLACE FUNCTION public.refresh_moniteur_ranking_mv()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.moniteur_ranking_mv;
END;
$function$
;

-- ==========================================
-- 4. TRIGGER-FUNCTIONS (XP / notif — boucle validation/séance/quiz)
-- ==========================================
CREATE OR REPLACE FUNCTION public.credit_xp_on_validation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.statut = 'acquis' AND NEW.eleve_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.statut IS DISTINCT FROM 'acquis') THEN
    UPDATE public.profiles SET xp = COALESCE(xp,0) + 100 WHERE id = NEW.eleve_id;
  END IF;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.credit_xp_moniteur_on_validation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.statut = 'acquis' AND NEW.validated_by IS NOT NULL AND NEW.validated_by <> NEW.eleve_id
     AND (TG_OP = 'INSERT' OR OLD.statut IS DISTINCT FROM 'acquis') THEN
    UPDATE public.profiles SET xp = COALESCE(xp,0) + 15 WHERE id = NEW.validated_by;
  END IF;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.credit_xp_moniteur_on_session()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
     SET xp = COALESCE(xp, 0) + 10
   WHERE id = NEW.moniteur_id;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.credit_xp_moniteur_on_session_confirm()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Seulement si on passe pending → confirmed (pas refused/auto)
  IF OLD.confirmation_status = 'pending' AND NEW.confirmation_status = 'confirmed' THEN
    UPDATE public.profiles
       SET xp = COALESCE(xp, 0) + 5
     WHERE id = NEW.moniteur_id;
  END IF;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.credit_xp_on_quiz()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_xp_gain int := 0;
begin
  if NEW.user_id is null or NEW.score is null then return NEW; end if;

  if NEW.score >= 70 then
    -- Déjà récompensé pour cette compétence + ce type ? → pas de re-crédit.
    if exists (
      select 1 from quiz_attempts q
       where q.user_id = NEW.user_id
         and q.competence_id = NEW.competence_id
         and q.type = NEW.type
         and q.score >= 70
         and q.id <> NEW.id
    ) then
      return NEW;
    end if;

    v_xp_gain := 50;
    if NEW.type = 'consolidation' then v_xp_gain := 30; end if;
    if NEW.score >= 100 then v_xp_gain := v_xp_gain + 20; end if;
  end if;

  if v_xp_gain > 0 then
    update public.profiles
       set xp = coalesce(xp, 0) + v_xp_gain
     where id = NEW.user_id;
  end if;

  return NEW;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.notify_eleve_on_session_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_moniteur_prenom text;
  v_h int;
  v_m int;
  v_duration_lbl text;
BEGIN
  SELECT prenom INTO v_moniteur_prenom FROM public.profiles WHERE id = NEW.moniteur_id;

  v_h := NEW.duration_minutes / 60;
  v_m := NEW.duration_minutes % 60;
  v_duration_lbl := CASE
    WHEN v_h = 0 THEN v_m || ' min'
    WHEN v_m = 0 THEN v_h || 'h'
    ELSE v_h || 'h' || LPAD(v_m::text, 2, '0')
  END;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.eleve_id,
    'session_confirmation',
    'Confirme ta session avec ' || COALESCE(v_moniteur_prenom, 'ton moniteur'),
    v_duration_lbl || ' à confirmer',
    jsonb_build_object(
      'session_id',        NEW.id,
      'moniteur_prenom',   v_moniteur_prenom,
      'duration_minutes',  NEW.duration_minutes,
      'session_date',      NEW.session_date
    )
  );
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.notify_eleve_on_session_logged()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_moniteur_prenom TEXT;
  v_duration_label  TEXT;
  v_eleve_pref      BOOLEAN;
BEGIN
  IF NEW.confirmation_status <> 'pending' THEN RETURN NEW; END IF;

  SELECT prenom INTO v_moniteur_prenom FROM profiles WHERE id = NEW.moniteur_id;
  SELECT COALESCE(notif_push, TRUE) INTO v_eleve_pref FROM profiles WHERE id = NEW.eleve_id;

  IF NOT v_eleve_pref THEN RETURN NEW; END IF;

  v_duration_label := CASE
    WHEN NEW.duration_minutes = 60  THEN '1h'
    WHEN NEW.duration_minutes = 90  THEN '1h30'
    WHEN NEW.duration_minutes = 120 THEN '2h'
    ELSE (NEW.duration_minutes || ' min')
  END;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.eleve_id,
    'session_confirmation',
    'Confirmez votre séance',
    COALESCE(v_moniteur_prenom, 'Votre moniteur') || ' a enregistré une séance de ' || v_duration_label
      || '. Confirmez-la pour valider vos compétences.',
    jsonb_build_object(
      'session_id', NEW.id,
      'moniteur_id', NEW.moniteur_id,
      'duration_minutes', NEW.duration_minutes,
      'session_date', NEW.session_date,
      'deep_link', '/#/sessions/' || NEW.id
    )
  );

  RETURN NEW;
END;
$function$
;

-- ==========================================
-- 4b. TRIGGERS
-- ==========================================
CREATE TRIGGER trg_notify_eleve_on_session_insert AFTER INSERT ON public.sessions_moniteur FOR EACH ROW EXECUTE FUNCTION notify_eleve_on_session_insert();
CREATE TRIGGER trg_credit_xp_on_quiz AFTER INSERT ON public.quiz_attempts FOR EACH ROW EXECUTE FUNCTION credit_xp_on_quiz();
CREATE TRIGGER trg_credit_xp_moniteur_on_session AFTER INSERT ON public.sessions_moniteur FOR EACH ROW EXECUTE FUNCTION credit_xp_moniteur_on_session();
CREATE TRIGGER trg_credit_xp_moniteur_on_session_confirm AFTER UPDATE OF confirmation_status ON public.sessions_moniteur FOR EACH ROW EXECUTE FUNCTION credit_xp_moniteur_on_session_confirm();
CREATE TRIGGER trg_notify_eleve_session_logged AFTER INSERT ON public.sessions_moniteur FOR EACH ROW EXECUTE FUNCTION notify_eleve_on_session_logged();
CREATE TRIGGER trg_credit_xp_moniteur_on_validation AFTER INSERT OR UPDATE ON public.validations FOR EACH ROW EXECUTE FUNCTION credit_xp_moniteur_on_validation();
CREATE TRIGGER trg_credit_xp_on_validation AFTER INSERT OR UPDATE ON public.validations FOR EACH ROW EXECUTE FUNCTION credit_xp_on_validation();
