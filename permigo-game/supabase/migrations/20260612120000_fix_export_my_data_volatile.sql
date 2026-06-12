-- ═══════════════════════════════════════════════════════════════
-- Audit pré-lancement 2026-06-12 — 2 fixes DB.
--
-- 1. export_my_data() est déclarée STABLE mais journalise l'export
--    (INSERT) → Postgres refuse : « INSERT is not allowed in a
--    non-volatile function ». Conséquence : le bouton RGPD
--    « Exporter mes données » échoue à 100 % en prod (reproduit).
--    Fix : la passer VOLATILE (elle écrit, c'est sa nature).
--
-- 2. award_xp_on_validation() : dernier WARN advisor
--    « function_search_path_mutable » — on fige le search_path
--    comme sur toutes les autres fonctions (hardening).
-- ═══════════════════════════════════════════════════════════════

ALTER FUNCTION public.export_my_data() VOLATILE;

ALTER FUNCTION public.award_xp_on_validation() SET search_path = 'public';
