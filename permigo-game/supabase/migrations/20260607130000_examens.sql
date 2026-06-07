-- ═══════════════════════════════════════════════════════════════
-- Migration : table `examens`
-- But : enregistrer le résultat d'examen d'un élève (planifié / reçu / raté)
--       et dériver l'état "reçu" (= dernière ligne examens.statut = 'recu').
--
-- Choix : table dédiée (et non colonne sur profiles) pour
--   1) éviter les conflits de policy RLS entre l'update moniteur et
--      l'update élève sur son propre profil,
--   2) garder l'historique des passages (1 passage = 1 ligne).
--
-- ⚠️ Pas de trigger qui écrit sur une autre table au nom de l'élève
--    (garde caller != user → forbidden_target_user). Si une notif élève
--    est souhaitée plus tard, passer par le pattern app.trusted_op.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.examens (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  eleve_id    uuid        NOT NULL,
  statut      text        NOT NULL,
  date_examen date,
  created_by  uuid        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.examens
  ADD CONSTRAINT examens_pkey PRIMARY KEY (id);

ALTER TABLE public.examens
  ADD CONSTRAINT examens_statut_check
  CHECK (statut = ANY (ARRAY['planifie'::text, 'recu'::text, 'rate'::text]));

ALTER TABLE public.examens
  ADD CONSTRAINT examens_eleve_id_fkey
  FOREIGN KEY (eleve_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- created_by est NOT NULL (audit du moniteur) : pas de ON DELETE SET NULL.
-- NO ACTION par défaut → un profil créateur d'examens ne peut être supprimé
-- sans traiter d'abord ses lignes (préserve l'historique).
ALTER TABLE public.examens
  ADD CONSTRAINT examens_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- Dernier passage par élève (le plus récent fait foi).
CREATE INDEX IF NOT EXISTS idx_examens_eleve_created
  ON public.examens USING btree (eleve_id, created_at DESC);

-- ─── RLS (obligatoire) ───────────────────────────────────────────
ALTER TABLE public.examens ENABLE ROW LEVEL SECURITY;

-- SELECT : l'élève voit ses propres examens ; un enseignant/gérant voit
-- les examens des élèves de SON auto-école (même partage que validations).
CREATE POLICY examens_select ON public.examens
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    (eleve_id = get_my_id())
    OR (
      (get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text]))
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = examens.eleve_id
          AND p.auto_ecole_id = get_my_auto_ecole_id()
      )
    )
  );

-- INSERT : un enseignant/gérant insère pour un élève de son auto-école,
-- avec created_by = lui-même.
CREATE POLICY examens_insert ON public.examens
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    (get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text]))
    AND (created_by = get_my_id())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = examens.eleve_id
        AND p.auto_ecole_id = get_my_auto_ecole_id()
    )
  );

-- Pas d'UPDATE / DELETE en v1 : un nouveau passage = nouvelle ligne.
