-- ═══════════════════════════════════════════════════════════════
-- Advisors hardening — audit 2026-06-10 (docs/AUDIT-2026-06.md)
-- 100 % additif/restrictif, zéro changement de comportement légitime.
--
-- A. Fonctions TRIGGER : jamais appelables via /rest/v1/rpc (defense in depth
--    — elles s'exécutent en interne par les triggers, qui ne dépendent pas
--    du droit EXECUTE du rôle appelant pour les fonctions SECURITY DEFINER).
-- B. RPC métier : réservées aux utilisateurs connectés (revoke anon).
--    GARDÉES anon (flow public légitime) : accept_invitation,
--    accept_parental_consent, get_consent_request, get_invitation_by_token,
--    is_username_available, set_eleve_signup_profile, track_event
--    (signup/consent par token + analytics landing).
-- C. search_path immuable sur award_xp_on_validation (advisor WARN).
-- D. Index dupliqué sur validations : on garde idx_validations_validated_by_date.
-- E. Index couvrants sur les 8 FK signalées sans index.
-- ═══════════════════════════════════════════════════════════════

-- A. Fonctions trigger — aucun rôle client ne doit pouvoir les exécuter
REVOKE EXECUTE ON FUNCTION public.award_xp_on_validation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_moniteur_streak_on_session() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_eleve_on_session_logged() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_auto_ecoles() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_streaks_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_validations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.leads_rate_limit_check() FROM PUBLIC, anon, authenticated;

-- B. RPC métier — utilisateurs connectés uniquement
REVOKE EXECUTE ON FUNCTION public.get_eleve_leaderboard(text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_moniteur_parcours_agg(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_moniteur_ranking(date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_prediction() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_session_v2(uuid, integer, date, text, text[], text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.respond_flash_quiz(uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.send_flash_quiz(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.send_quiz_notification(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_competence_quiz(text, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.validate_session(uuid, date, text, text[], text[], text[]) FROM anon;

-- C. search_path immuable (vecteur d'escalade classique sur SECURITY DEFINER)
ALTER FUNCTION public.award_xp_on_validation() SET search_path = public;

-- D. Index dupliqué (idx_validations_by_date ≡ idx_validations_validated_by_date)
DROP INDEX IF EXISTS public.idx_validations_by_date;

-- E. Index couvrants sur FK non indexées (perf jointures + cascades)
CREATE INDEX IF NOT EXISTS idx_community_questions_competence ON public.community_questions (competence_id);
CREATE INDEX IF NOT EXISTS idx_community_questions_moderated_by ON public.community_questions (moderated_by);
CREATE INDEX IF NOT EXISTS idx_comp_bookmarks_competence ON public.comp_bookmarks (competence_id);
CREATE INDEX IF NOT EXISTS idx_eleve_tags_created_by ON public.eleve_tags (created_by);
CREATE INDEX IF NOT EXISTS idx_examens_created_by ON public.examens (created_by);
CREATE INDEX IF NOT EXISTS idx_quiz_feedback_user ON public.quiz_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_school_events_created_by ON public.school_events (created_by);
CREATE INDEX IF NOT EXISTS idx_webhooks_subscriptions_created_by ON public.webhooks_subscriptions (created_by);
