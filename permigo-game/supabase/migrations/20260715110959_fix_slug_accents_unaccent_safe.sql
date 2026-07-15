-- ════════════════════════════════════════════════════════════════
-- 20260715110959 — fix_slug_accents_unaccent_safe
-- ✅ APPLIQUÉE EN PROD le 2026-07-15 via MCP (ledger : 20260715110959).
--
-- Constat (vérif circuit inscription moniteur du 2026-07-15) :
-- l'extension unaccent n'est PAS installée en prod → unaccent_safe
-- retombait sur son fallback qui SUPPRIME les accents au lieu de les
-- translittérer : « Auto-école X » → slug « auto-cole-x-… » (URL
-- publique #/ecole/{slug} moche).
--
-- Fix : fallback remplacé par une translittération translate()
-- (accents FR + latin courant), déterministe, sans dépendance
-- d'extension. Signature inchangée — seul appelant :
-- create_independent_moniteur (slug d'auto-école).
-- Les slugs existants ne sont PAS réécrits (liens déjà partagés).
--
-- Vérifié en prod : « École Éphémère Test » → ecole-ephemere-test-c5607f.
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.unaccent_safe(p_txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT translate(
    replace(replace(replace(replace(coalesce(p_txt, ''), 'œ', 'oe'), 'Œ', 'OE'), 'æ', 'ae'), 'Æ', 'AE'),
    'àáâãäåÀÁÂÃÄÅèéêëÈÉÊËìíîïÌÍÎÏòóôõöÒÓÔÕÖùúûüÙÚÛÜçÇñÑÿŸ',
    'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUcCnNyY'
  );
$function$;
