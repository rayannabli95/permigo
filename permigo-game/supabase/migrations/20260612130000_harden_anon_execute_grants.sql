-- ═══════════════════════════════════════════════════════════════
-- Audit pré-lancement 2026-06-12 — hardening des grants EXECUTE.
--
-- Contexte : Postgres accorde EXECUTE à PUBLIC par défaut sur toute
-- fonction. Nos `GRANT ... TO authenticated` n'ont jamais révoqué ce
-- grant PUBLIC implicite → `anon` (utilisateur NON connecté) peut
-- appeler ces fonctions SECURITY DEFINER. D'où 25 WARN advisor
-- `anon_security_definer_function_executable`.
--
-- Aucune de ces fonctions n'est appelée par le front en état anon
-- (vérifié : tous les appels RPC viennent de pages élève/moniteur/
-- enseignant = session authentifiée). On referme donc l'accès anon.
--
-- On NE TOUCHE PAS aux flux pré-login légitimes, laissés ouverts à
-- anon volontairement : get_invitation_by_token, accept_invitation,
-- get_consent_request, accept_parental_consent, is_username_available,
-- leads_rate_limit_check.
-- ═══════════════════════════════════════════════════════════════

-- 1. Fonctions de TRIGGER : jamais appelées en direct (RPC). On retire
--    EXECUTE à PUBLIC entièrement — le trigger SECURITY DEFINER tourne
--    indépendamment du grant. Supprime anon ET authenticated du WARN.
REVOKE EXECUTE ON FUNCTION public.bump_moniteur_streak_on_session()  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_eleve_on_session_logged()   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_auto_ecoles()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_profile_fields()           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_streaks_fields()           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_validations()              FROM PUBLIC;

-- 2. RPC réservés aux utilisateurs connectés : on retire anon, on garde
--    authenticated (déjà accordé ailleurs / via PUBLIC). On révoque
--    aussi de PUBLIC pour purger le grant implicite, puis on re-grant
--    authenticated explicitement (idempotent et sans ambiguïté).
REVOKE EXECUTE ON FUNCTION public.track_event(text, jsonb, text)                                  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_session(uuid, date, text, text[], text[], text[])      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.log_session_v2(uuid, integer, date, text, text[], text)         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_competence_quiz(text, integer, text)                     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_eleve_leaderboard(text, integer)                            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_moniteur_ranking(date)                                      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_moniteur_parcours_agg(uuid)                                 FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_prediction()                                             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin()                                                      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_flash_quiz(uuid, text)                                     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.respond_flash_quiz(uuid, jsonb)                                 FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_quiz_notification(uuid, text, text)                        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_eleve_signup_profile(text, text, text, date, text)          FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.track_event(text, jsonb, text)                                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_session(uuid, date, text, text[], text[], text[])      TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_session_v2(uuid, integer, date, text, text[], text)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_competence_quiz(text, integer, text)                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_eleve_leaderboard(text, integer)                            TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_moniteur_ranking(date)                                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_moniteur_parcours_agg(uuid)                                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_prediction()                                             TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin()                                                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_flash_quiz(uuid, text)                                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_flash_quiz(uuid, jsonb)                                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_quiz_notification(uuid, text, text)                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_eleve_signup_profile(text, text, text, date, text)          TO authenticated;
