-- 20260620140000_consolidate_select_policies.sql
--
-- PURPOSE: Resolve the Supabase performance advisor warning
--          `multiple_permissive_policies` on 4 tables.
--
-- Postgres evaluates multiple PERMISSIVE policies for the same role+action by
-- OR-ing their USING clauses together. Having several permissive SELECT
-- policies on one table therefore means Postgres must evaluate each USING
-- expression on every row — pure overhead, since the effective access is the
-- logical OR of all of them.
--
-- This migration MERGES, per table, the existing permissive SELECT policies
-- into a SINGLE `<table>_select` policy whose USING clause is the OR of the
-- original expressions, copied BYTE-FOR-BYTE from the baseline snapshot
-- (00000000000000_baseline_prod_snapshot.sql). The order of the OR'd terms is
-- irrelevant to the result.
--
-- ACCESS IS IDENTICAL. No logic is changed: each merged condition is the exact
-- original USING expression, only combined with OR. Roles are preserved
-- (all originals were `TO public`). INSERT / UPDATE / DELETE / ALL policies and
-- indexes are untouched.
--
-- ⚠️ REVIEW MANUALLY before applying. DO NOT auto-apply to prod. Apply by hand
--    after reviewing, per the project's "JAMAIS modifier la prod directement"
--    rule.
--
-- Tables affected:
--   - sessions_moniteur      (3 SELECT policies -> 1)
--   - community_questions    (2 SELECT policies -> 1)
--   - eleve_daily_snapshot   (2 SELECT policies -> 1)
--   - exam_blanc_sessions    (2 SELECT policies -> 1)

-- =============================================================================
-- sessions_moniteur
-- =============================================================================
DROP POLICY IF EXISTS "eleve reads sessions about him" ON public.sessions_moniteur;
DROP POLICY IF EXISTS "gerant reads sessions of school" ON public.sessions_moniteur;
DROP POLICY IF EXISTS "moniteur reads own sessions" ON public.sessions_moniteur;

CREATE POLICY sessions_moniteur_select ON public.sessions_moniteur AS PERMISSIVE FOR SELECT TO public USING (
  -- "eleve reads sessions about him"
  (eleve_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid))))
  OR
  -- "gerant reads sessions of school"
  (EXISTS ( SELECT 1
   FROM (profiles p_gerant
     JOIN profiles p_moniteur ON ((p_moniteur.auto_ecole_id = p_gerant.auto_ecole_id)))
  WHERE ((p_gerant.auth_id = ( SELECT auth.uid() AS uid)) AND (p_gerant.role = 'gerant'::text) AND (p_moniteur.id = sessions_moniteur.moniteur_id))))
  OR
  -- "moniteur reads own sessions"
  (moniteur_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid))))
);

-- =============================================================================
-- community_questions
-- =============================================================================
DROP POLICY IF EXISTS "moniteur reads school proposals" ON public.community_questions;
DROP POLICY IF EXISTS "user reads own proposals" ON public.community_questions;

CREATE POLICY community_questions_select ON public.community_questions AS PERMISSIVE FOR SELECT TO public USING (
  -- "moniteur reads school proposals"
  (proposed_by IN ( SELECT p.id
   FROM (profiles p
     JOIN profiles me ON ((me.auto_ecole_id = p.auto_ecole_id)))
  WHERE ((me.auth_id = ( SELECT auth.uid() AS uid)) AND (me.role = ANY (ARRAY['enseignant'::text, 'gerant'::text])))))
  OR
  -- "user reads own proposals"
  (proposed_by IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid))))
);

-- =============================================================================
-- eleve_daily_snapshot
-- =============================================================================
DROP POLICY IF EXISTS "school reads snapshots of school" ON public.eleve_daily_snapshot;
DROP POLICY IF EXISTS "user reads own snapshots" ON public.eleve_daily_snapshot;

CREATE POLICY eleve_daily_snapshot_select ON public.eleve_daily_snapshot AS PERMISSIVE FOR SELECT TO public USING (
  -- "school reads snapshots of school"
  (eleve_id IN ( SELECT p.id
   FROM (profiles p
     JOIN profiles me ON ((me.auto_ecole_id = p.auto_ecole_id)))
  WHERE ((me.auth_id = ( SELECT auth.uid() AS uid)) AND (me.role = ANY (ARRAY['enseignant'::text, 'gerant'::text])))))
  OR
  -- "user reads own snapshots"
  (eleve_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid))))
);

-- =============================================================================
-- exam_blanc_sessions
-- =============================================================================
DROP POLICY IF EXISTS "moniteur reads school exams" ON public.exam_blanc_sessions;
DROP POLICY IF EXISTS "user reads own exams" ON public.exam_blanc_sessions;

CREATE POLICY exam_blanc_sessions_select ON public.exam_blanc_sessions AS PERMISSIVE FOR SELECT TO public USING (
  -- "moniteur reads school exams"
  (EXISTS ( SELECT 1
   FROM (profiles p_user
     JOIN profiles p_eleve ON ((p_eleve.auto_ecole_id = p_user.auto_ecole_id)))
  WHERE ((p_user.auth_id = ( SELECT auth.uid() AS uid)) AND (p_user.role = ANY (ARRAY['enseignant'::text, 'gerant'::text])) AND (p_eleve.id = exam_blanc_sessions.user_id))))
  OR
  -- "user reads own exams"
  (user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid))))
);
