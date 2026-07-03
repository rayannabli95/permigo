-- Sécurité [08] — IDOR en écriture sur validations.
-- ✅ DÉJÀ APPLIQUÉE EN PROD le 2026-07-03 (vérifiée : cross-école bloqué 42501,
-- même-école autorisée). Ce fichier aligne l'historique du repo sur la prod.
--
-- La policy INSERT n'imposait pas que l'élève appartienne à l'auto-école de
-- l'auteur → un moniteur/gérant pouvait falsifier le livret d'un élève d'une
-- AUTRE auto-école. On ajoute le même EXISTS auto_ecole_id que examens_insert
-- et validations_update.

DROP POLICY IF EXISTS validations_insert ON public.validations;

CREATE POLICY validations_insert ON public.validations
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    (get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text]))
    AND (validated_by = get_my_id())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = validations.eleve_id
        AND p.auto_ecole_id = get_my_auto_ecole_id()
    )
  );
