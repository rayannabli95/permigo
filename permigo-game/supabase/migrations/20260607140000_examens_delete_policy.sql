-- ═══════════════════════════════════════════════════════════════
-- Migration : policy DELETE sur `examens`
-- But : autoriser l'annulation (undo) d'un résultat d'examen que le
--       moniteur vient d'enregistrer — il supprime SA propre ligne.
--
-- Contexte : la table examens (20260607130000_examens.sql) n'autorisait
--   ni UPDATE ni DELETE ("1 passage = 1 ligne"). L'UX d'archivage « reçu »
--   sans filet (faux contact = élève disparu, irrécupérable depuis l'app)
--   impose un undo. On reste sur le modèle append-only : pas d'UPDATE,
--   seulement la suppression de sa propre ligne par son créateur.
--
-- RLS déjà activée par la migration d'origine — on ne la re-déclare pas.
-- ═══════════════════════════════════════════════════════════════

-- DELETE : un enseignant/gérant supprime UNIQUEMENT une ligne qu'il a créée.
-- (created_by = get_my_id()) → un moniteur ne peut pas effacer le passage
-- enregistré par un collègue. L'élève n'a aucun droit de suppression.
CREATE POLICY examens_delete ON public.examens
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (created_by = get_my_id());
