-- =====================================================================
-- REVOKE des privilèges d'ÉCRITURE du rôle anon sur le schéma public
-- =====================================================================
-- Contexte : malgré security_lockdown_anon_revoke et lockdown_gdpr_anon_revoke_v2,
-- le rôle anon détient encore SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER
-- sur TOUTES les tables + vues public (GRANT ALL par défaut Supabase). Inerte tant
-- que la RLS tient, mais défense-en-profondeur cassée.
--
-- Stratégie (ciblée, non destructive pour l'app) :
--   - on RÉVOQUE les écritures (INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER) à anon ;
--   - on GARDE SELECT (la page école publique lit auto_ecoles/profiles en anon ;
--     la RLS borne déjà la visibilité ligne) ;
--   - on RE-GRANT INSERT sur leads (capture de leads landing, cf. policy leads_insert TO anon) ;
--   - on NE TOUCHE PAS aux EXECUTE sur les fonctions (signup/consent passent par des
--     RPC SECURITY DEFINER : get_invitation_by_token, is_username_available,
--     accept_invitation, set_eleve_signup_profile, get_consent_request,
--     accept_parental_consent — anon en a besoin).
--
-- ⚠️ NON APPLIQUÉE EN PROD. À tester sur preview Vercel (landing + login + page
--    /ecole/:slug + signup par invitation) avant merge. Appliquer via MCP
--    apply_migration seulement après ton OK explicite.
-- =====================================================================

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public FROM anon;

-- Re-grant minimal : capture de leads côté landing (gardée par la policy leads_insert).
GRANT INSERT ON public.leads TO anon;

-- Empêche les FUTURES tables de re-granter des écritures à anon.
-- (rôle propriétaire des objets = postgres ; ajuster si tes objets sont créés par un autre rôle)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon;

-- =====================================================================
-- VÉRIF post-application (doit ne renvoyer que la ligne leads/INSERT) :
--   SELECT table_name, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE table_schema='public' AND grantee='anon'
--     AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE');
-- Attendu : (leads, INSERT) uniquement.
-- =====================================================================
