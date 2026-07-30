-- ═══════════════════════════════════════════════════════════════
-- 20260730160000 — Le débrief écrit par l'ÉLÈVE
--
-- Contexte : la boucle produit est « Préparer → Conduire → Débriefer →
-- Consolider » (pivot du 17/07/2026). Le « Débriefer » avait une trace
-- écrite : le compte-rendu que le moniteur rédigeait après la leçon. Le
-- retrait de l'émission moniteur (lot 4, 30/07/2026, migration
-- 20260730120000) l'a supprimée — la carte « Revenons sur ta leçon » de
-- l'accueil ne laissait plus qu'un choix éphémère en localStorage
-- (consolider / passer à la suite), effacé au clic.
--
-- Cette migration rend la trace DURABLE et la remet du bon côté : c'est
-- l'élève qui l'écrit, sur sa propre progression. Fidèle au pivot — l'élève
-- est le moteur, il certifie et il débriefe lui-même.
--
-- 100 % additif : aucune table existante n'est touchée.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lecon_debriefs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Compétence travaillée pendant l'heure de conduite (le thème que le hero
  -- « Prépare ta leçon » servait). Nullable : si la compétence disparaît du
  -- référentiel, le débrief reste — c'est le vécu de l'élève, pas une stat.
  competence_id   text REFERENCES public.competences_remc(id) ON DELETE SET NULL,
  -- Ce que l'élève a décidé APRÈS la leçon. C'est la trace minimale : même
  -- sans un mot écrit, on sait qu'il a débriefé et ce qu'il a choisi.
  --   'consolide' → « je retravaille cette compétence »
  --   'suivant'   → « c'est acquis, je passe à la suite »
  choix           text NOT NULL CHECK (choix IN ('consolide', 'suivant')),
  -- Le mot de l'élève : « ce qui a coincé ». Facultatif — imposer un texte
  -- tuerait le taux de réponse, et le choix ci-dessus suffit déjà à tracer.
  -- Borné à 280 caractères : c'est une note de bord, pas un journal.
  note            text CHECK (note IS NULL OR char_length(note) <= 280),
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lecon_debriefs IS
  'Débrief écrit par l''ÉLÈVE après une heure de conduite (étape « Débriefer » de la boucle). Remplace le compte-rendu du moniteur, retiré le 30/07/2026. Strictement privé : personne d''autre que l''élève ne le lit.';

CREATE INDEX IF NOT EXISTS idx_lecon_debriefs_eleve
  ON public.lecon_debriefs (eleve_id, created_at DESC);

ALTER TABLE public.lecon_debriefs ENABLE ROW LEVEL SECURITY;

-- ── RLS : strictement self-only, dans les deux sens ────────────
-- Le moniteur ne lit PAS ces lignes. C'est volontaire et c'est le cœur du
-- pivot : l'élève écrit pour lui-même. Si un jour on veut le partager, ce
-- sera un partage EXPLICITE décidé par l'élève, pas un accès par défaut.

DROP POLICY IF EXISTS lecon_debriefs_select_own ON public.lecon_debriefs;
CREATE POLICY lecon_debriefs_select_own ON public.lecon_debriefs
  FOR SELECT TO authenticated
  USING (eleve_id = current_profile_id());

-- INSERT direct par le client : contrairement à self_validations, il n'y a
-- ici AUCUN enjeu de triche (pas de score, pas de récompense, pas de
-- déblocage) — donc pas besoin d'une RPC SECURITY DEFINER. Le WITH CHECK
-- interdit d'écrire au nom d'un autre élève, et les CHECK de colonne
-- bornent le contenu côté serveur.
DROP POLICY IF EXISTS lecon_debriefs_insert_own ON public.lecon_debriefs;
CREATE POLICY lecon_debriefs_insert_own ON public.lecon_debriefs
  FOR INSERT TO authenticated
  WITH CHECK (eleve_id = current_profile_id());

-- L'élève peut effacer une note qu'il regrette. Pas d'UPDATE : un débrief
-- est daté, on n'en réécrit pas l'histoire — on le supprime ou on en ajoute
-- un nouveau.
DROP POLICY IF EXISTS lecon_debriefs_delete_own ON public.lecon_debriefs;
CREATE POLICY lecon_debriefs_delete_own ON public.lecon_debriefs
  FOR DELETE TO authenticated
  USING (eleve_id = current_profile_id());

REVOKE UPDATE ON public.lecon_debriefs FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.lecon_debriefs TO authenticated;
