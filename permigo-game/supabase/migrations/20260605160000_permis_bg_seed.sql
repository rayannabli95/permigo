-- ═══════════════════════════════════════════════════════════════
-- Migration NEUTRALISÉE (no-op) le 2026-06-05.
-- Raison : la base prod (arrfmdagdqtrtfbhxlty) contient DÉJÀ 7 fonds
-- permis_bg actifs (sunset, aurora, gold, cyberpunk, nebula, racetrack,
-- minimal_white) avec images valides. Le seed d'origine faisait doublon
-- (permis_bg_aurora) et entrait en collision sur racetrack/cyberpunk.
-- Volontairement vidée pour éviter qu'un `supabase db push` ne crée un doublon.
-- Fichier conservé vide pour ne pas casser l'ordre des migrations déjà poussées.
-- ═══════════════════════════════════════════════════════════════
SELECT 1;
