-- ════════════════════════════════════════════════════════════════════
-- PermiGo — Row Level Security policies
-- ════════════════════════════════════════════════════════════════════
-- À exécuter dans Supabase → SQL Editor (en une seule fois).
-- Idempotent : peut être rejoué sans casser.
--
-- Modèle :
--   - auth.uid() = id user Supabase (uuid)
--   - profiles.auth_id = lien vers auth.uid() (text)
--   - get_my_profile_id() = id du profil courant (text)
--   - get_my_role() = 'admin' | 'moniteur' | 'eleve'
-- ════════════════════════════════════════════════════════════════════


-- ─────────────────────────── HELPERS ───────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE auth_id = auth.uid()::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE auth_id = auth.uid()::text LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role()       TO authenticated;


-- ─────────────────────────── PROFILES ──────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_profiles_select ON public.profiles;
CREATE POLICY p_profiles_select ON public.profiles
  FOR SELECT TO authenticated USING (
    auth_id = auth.uid()::text
    OR get_my_role() IN ('admin','moniteur')
  );

DROP POLICY IF EXISTS p_profiles_insert ON public.profiles;
CREATE POLICY p_profiles_insert ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (
    auth_id = auth.uid()::text
    OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_profiles_update ON public.profiles;
CREATE POLICY p_profiles_update ON public.profiles
  FOR UPDATE TO authenticated USING (
    auth_id = auth.uid()::text OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_profiles_delete ON public.profiles;
CREATE POLICY p_profiles_delete ON public.profiles
  FOR DELETE TO authenticated USING (get_my_role() = 'admin');


-- ─────────────────────────── EVENTS ────────────────────────────
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_events_select ON public.events;
CREATE POLICY p_events_select ON public.events
  FOR SELECT TO authenticated USING (
    eleve_id    = get_my_profile_id()
    OR moniteur_id = get_my_profile_id()
    OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_events_insert ON public.events;
CREATE POLICY p_events_insert ON public.events
  FOR INSERT TO authenticated WITH CHECK (
    moniteur_id = get_my_profile_id()
    OR eleve_id  = get_my_profile_id()
    OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_events_update ON public.events;
CREATE POLICY p_events_update ON public.events
  FOR UPDATE TO authenticated USING (
    moniteur_id = get_my_profile_id()
    OR eleve_id  = get_my_profile_id()
    OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_events_delete ON public.events;
CREATE POLICY p_events_delete ON public.events
  FOR DELETE TO authenticated USING (
    moniteur_id = get_my_profile_id() OR get_my_role() = 'admin'
  );


-- ────────────────────────── REMC_ENTRIES ───────────────────────
ALTER TABLE public.remc_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_remc_select ON public.remc_entries;
CREATE POLICY p_remc_select ON public.remc_entries
  FOR SELECT TO authenticated USING (
    eleve_id = get_my_profile_id()
    OR get_my_role() IN ('admin','moniteur')
  );

DROP POLICY IF EXISTS p_remc_insert ON public.remc_entries;
CREATE POLICY p_remc_insert ON public.remc_entries
  FOR INSERT TO authenticated WITH CHECK (
    get_my_role() IN ('admin','moniteur')
  );

DROP POLICY IF EXISTS p_remc_update ON public.remc_entries;
CREATE POLICY p_remc_update ON public.remc_entries
  FOR UPDATE TO authenticated USING (
    get_my_role() IN ('admin','moniteur')
  );

DROP POLICY IF EXISTS p_remc_delete ON public.remc_entries;
CREATE POLICY p_remc_delete ON public.remc_entries
  FOR DELETE TO authenticated USING (
    get_my_role() IN ('admin','moniteur')
  );


-- ────────────────────────── ABSENCES ───────────────────────────
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_absences_all ON public.absences;
CREATE POLICY p_absences_all ON public.absences
  FOR ALL TO authenticated USING (
    eleve_id    = get_my_profile_id()
    OR moniteur_id = get_my_profile_id()
    OR get_my_role() = 'admin'
  ) WITH CHECK (
    eleve_id    = get_my_profile_id()
    OR moniteur_id = get_my_profile_id()
    OR get_my_role() = 'admin'
  );


-- ────────────────────────── NOTATIONS ──────────────────────────
ALTER TABLE public.notations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_notations_select ON public.notations;
CREATE POLICY p_notations_select ON public.notations
  FOR SELECT TO authenticated USING (
    eleve_id = get_my_profile_id()
    OR moniteur_id = get_my_profile_id()
    OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_notations_write ON public.notations;
CREATE POLICY p_notations_write ON public.notations
  FOR INSERT TO authenticated WITH CHECK (
    moniteur_id = get_my_profile_id() OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_notations_update ON public.notations;
CREATE POLICY p_notations_update ON public.notations
  FOR UPDATE TO authenticated USING (
    moniteur_id = get_my_profile_id() OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_notations_delete ON public.notations;
CREATE POLICY p_notations_delete ON public.notations
  FOR DELETE TO authenticated USING (
    moniteur_id = get_my_profile_id() OR get_my_role() = 'admin'
  );


-- ────────────────────────── LIEUX ──────────────────────────────
ALTER TABLE public.lieux ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_lieux_select ON public.lieux;
CREATE POLICY p_lieux_select ON public.lieux
  FOR SELECT TO authenticated USING (
    moniteur_id = get_my_profile_id()
    OR get_my_role() IN ('admin','eleve')
  );

DROP POLICY IF EXISTS p_lieux_insert ON public.lieux;
CREATE POLICY p_lieux_insert ON public.lieux
  FOR INSERT TO authenticated WITH CHECK (
    moniteur_id = get_my_profile_id() OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_lieux_update ON public.lieux;
CREATE POLICY p_lieux_update ON public.lieux
  FOR UPDATE TO authenticated USING (
    moniteur_id = get_my_profile_id() OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_lieux_delete ON public.lieux;
CREATE POLICY p_lieux_delete ON public.lieux
  FOR DELETE TO authenticated USING (
    moniteur_id = get_my_profile_id() OR get_my_role() = 'admin'
  );


-- ────────────────────────── NOTES_PRIV ─────────────────────────
-- Notes privées du moniteur sur les élèves — accès strict
ALTER TABLE public.notes_priv ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_notes_priv_select ON public.notes_priv;
CREATE POLICY p_notes_priv_select ON public.notes_priv
  FOR SELECT TO authenticated USING (
    moniteur_id = get_my_profile_id() OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_notes_priv_write ON public.notes_priv;
CREATE POLICY p_notes_priv_write ON public.notes_priv
  FOR INSERT TO authenticated WITH CHECK (
    moniteur_id = get_my_profile_id() OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_notes_priv_update ON public.notes_priv;
CREATE POLICY p_notes_priv_update ON public.notes_priv
  FOR UPDATE TO authenticated USING (
    moniteur_id = get_my_profile_id() OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_notes_priv_delete ON public.notes_priv;
CREATE POLICY p_notes_priv_delete ON public.notes_priv
  FOR DELETE TO authenticated USING (
    moniteur_id = get_my_profile_id() OR get_my_role() = 'admin'
  );


-- ────────────────────────── NOTIFICATIONS ──────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_notif_select ON public.notifications;
CREATE POLICY p_notif_select ON public.notifications
  FOR SELECT TO authenticated USING (
    user_id = get_my_profile_id() OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_notif_insert ON public.notifications;
CREATE POLICY p_notif_insert ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (
    user_id = get_my_profile_id() OR get_my_role() IN ('admin','moniteur')
  );

DROP POLICY IF EXISTS p_notif_update ON public.notifications;
CREATE POLICY p_notif_update ON public.notifications
  FOR UPDATE TO authenticated USING (
    user_id = get_my_profile_id() OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS p_notif_delete ON public.notifications;
CREATE POLICY p_notif_delete ON public.notifications
  FOR DELETE TO authenticated USING (
    user_id = get_my_profile_id() OR get_my_role() = 'admin'
  );


-- ────────────────────────── AUDIT_LOG ──────────────────────────
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_audit_select ON public.audit_log;
CREATE POLICY p_audit_select ON public.audit_log
  FOR SELECT TO authenticated USING (get_my_role() = 'admin');

DROP POLICY IF EXISTS p_audit_insert ON public.audit_log;
CREATE POLICY p_audit_insert ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- Pas de UPDATE/DELETE → l'audit est immuable

-- ════════════════════════════════════════════════════════════════════
-- Fin. Vérifier dans Supabase → Auth → Policies que tout est ON.
-- ════════════════════════════════════════════════════════════════════
