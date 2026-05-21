-- ============================================================================
-- 0009_parcours_agg.sql
-- Performance page parcours moniteur (Bug #20 : ~5 min de chargement).
--
-- Cause racine : src/pages/enseignant/parcours.js récupère TOUTES les
-- validations du moniteur via `validations.eq('validated_by', _me.id)` sans
-- index dédié → seq scan. L'INDEX ci-dessous est le correctif principal et
-- suffit à lui seul à ramener le SELECT existant à < quelques ms.
--
-- La RPC d'agrégation get_moniteur_parcours_agg est fournie pour une PR
-- ULTÉRIEURE (déplacer l'agrégation côté serveur + cache local). Elle n'est
-- PAS encore consommée par le front dans la PR fix/enseignant-refonte-patches
-- (le basculement de parcours.js est un refactor hors périmètre).
--
-- À appliquer sur la branche Supabase DEV uniquement. NE PAS appliquer en prod
-- directement.
-- ============================================================================

-- 1) Index : accélère le SELECT existant (parcours.js:566) — correctif Bug #20.
CREATE INDEX IF NOT EXISTS idx_validations_validated_by_at
  ON public.validations (validated_by, validated_at DESC);

-- 2) RPC d'agrégation (réservée à une PR future). Garde IDOR : un moniteur ne
--    peut agréger que ses propres validations.
CREATE OR REPLACE FUNCTION public.get_moniteur_parcours_agg(p_moniteur_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_caller uuid := current_profile_id();
  v_total int;
  v_par_eleve jsonb;
  v_top jsonb;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_moniteur_id <> v_caller THEN RETURN jsonb_build_object('error','forbidden'); END IF;

  SELECT COUNT(*) INTO v_total
    FROM public.validations
   WHERE validated_by = p_moniteur_id;

  SELECT COALESCE(jsonb_object_agg(eleve_id, n), '{}'::jsonb) INTO v_par_eleve
    FROM (
      SELECT eleve_id, COUNT(*) AS n
        FROM public.validations
       WHERE validated_by = p_moniteur_id AND eleve_id IS NOT NULL
       GROUP BY eleve_id
    ) s;

  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_top
    FROM (
      SELECT eleve_id,
             COUNT(*) FILTER (WHERE statut = 'acquis') AS acquis,
             MAX(validated_at) AS last_at
        FROM public.validations
       WHERE validated_by = p_moniteur_id AND eleve_id IS NOT NULL
       GROUP BY eleve_id
       ORDER BY MAX(validated_at) DESC
       LIMIT 5
    ) t;

  RETURN jsonb_build_object(
    'total_validations', v_total,
    'par_eleve', v_par_eleve,
    'top_eleves', v_top
  );
END;
$function$
;
