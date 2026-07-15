-- ═══════════════════════════════════════════════════════════════
-- 20260716150000 — Validation autonome des compétences (élève SANS moniteur)
--
-- Contexte : la pré-vente « Pass Permis » (#/pass, lancée le 2026-07-15)
-- vend l'app en direct à des élèves solo, sans moniteur rattaché
-- (profiles.enseignant_id IS NULL). Pour eux, `validations` — écrite
-- UNIQUEMENT par un enseignant/gérant (policy validations_insert) — ne se
-- remplit JAMAIS → le parcours reste bloqué à 0/31 à vie.
--
-- Ce que fait cette migration (100% additive, NE TOUCHE PAS `validations`) :
--   1. Table self_validations : une ligne par (élève, compétence) que
--      l'élève a validée LUI-MÊME après avoir lu la fiche + réussi un quiz
--      ≥80%. Table complètement SÉPARÉE de `validations` (source de vérité
--      moniteur) — aucune ligne n'est jamais attribuée à un enseignant,
--      aucune statistique moniteur n'est modifiée.
--   2. RPC self_validate_competence(p_competence_id, p_score) SECURITY
--      DEFINER — seule porte d'écriture (aucune policy INSERT/UPDATE pour
--      le client) :
--        - refuse si l'appelant n'est pas 'eleve'
--        - refuse si l'élève a un moniteur rattaché (profiles.enseignant_id)
--        - refuse (no-op) si la compétence est déjà 'acquis' côté moniteur
--          — jamais d'écrasement de la source de vérité
--        - refuse si le score < 80
--        - upsert idempotent sinon (relance = simple mise à jour du score,
--          jamais de doublon ni de perte de la 1ère date de validation)
--
-- Le front (src/pages/eleve/parcours.js, valider-seul.js) fusionne
-- self_validations dans la carte de progression EN LECTURE SEULE — le badge
-- affiché diffère explicitement (« Auto-validée » vs « Validée par ton
-- moniteur »).
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.self_validations (
  eleve_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  competence_id text NOT NULL REFERENCES public.competences_remc(id) ON DELETE CASCADE,
  score         integer NOT NULL CHECK (score >= 0 AND score <= 100),
  validated_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (eleve_id, competence_id)
);

COMMENT ON TABLE public.self_validations IS
  'Compétences validées en AUTONOMIE par un élève sans moniteur rattaché (fiche relue + quiz >=80%). Séparée de `validations` (source de vérité moniteur) — ne pollue jamais une statistique enseignant.';

CREATE INDEX IF NOT EXISTS idx_self_validations_eleve ON public.self_validations (eleve_id);

ALTER TABLE public.self_validations ENABLE ROW LEVEL SECURITY;

-- Lecture self-only.
DROP POLICY IF EXISTS self_validations_select_own ON public.self_validations;
CREATE POLICY self_validations_select_own ON public.self_validations
  FOR SELECT TO authenticated
  USING (eleve_id = current_profile_id());

-- Aucune policy INSERT/UPDATE/DELETE : seule la RPC SECURITY DEFINER
-- ci-dessous écrit dans cette table (garantit le seuil 80% + le garde-fou
-- « sans moniteur » côté serveur — on ne fait jamais confiance au client
-- pour le score). Ceinture + bretelles, même pattern que
-- competence_rewards_granted (20260701210000).
REVOKE INSERT, UPDATE, DELETE ON public.self_validations FROM anon, authenticated;

-- ── RPC ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.self_validate_competence(
  p_competence_id text,
  p_score integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_eleve   uuid := current_profile_id();
  v_role    text;
  v_has_mon boolean;
BEGIN
  IF v_eleve IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;
  IF p_score IS NULL OR p_score < 0 OR p_score > 100 THEN
    RETURN jsonb_build_object('error', 'invalid_score');
  END IF;
  IF p_competence_id IS NULL OR length(btrim(p_competence_id)) = 0 THEN
    RETURN jsonb_build_object('error', 'invalid_competence');
  END IF;

  SELECT role, (enseignant_id IS NOT NULL)
    INTO v_role, v_has_mon
    FROM public.profiles
   WHERE id = v_eleve;

  IF v_role IS DISTINCT FROM 'eleve' THEN
    RETURN jsonb_build_object('error', 'wrong_role');
  END IF;
  IF v_has_mon THEN
    RETURN jsonb_build_object('error', 'has_moniteur');
  END IF;

  -- Jamais d'écrasement de la source de vérité moniteur (cas rare : un
  -- élève délié d'un moniteur qui l'avait déjà validée avant).
  IF EXISTS (
    SELECT 1 FROM public.validations
     WHERE eleve_id = v_eleve
       AND competence_id = p_competence_id
       AND statut = 'acquis'
  ) THEN
    RETURN jsonb_build_object('ok', true, 'validated', true, 'already_by_moniteur', true);
  END IF;

  IF p_score < 80 THEN
    RETURN jsonb_build_object('ok', true, 'passed', false, 'validated', false);
  END IF;

  INSERT INTO public.self_validations (eleve_id, competence_id, score, validated_at)
  VALUES (v_eleve, p_competence_id, p_score, now())
  ON CONFLICT (eleve_id, competence_id) DO UPDATE
    SET score = GREATEST(public.self_validations.score, EXCLUDED.score);

  RETURN jsonb_build_object('ok', true, 'passed', true, 'validated', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.self_validate_competence(text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.self_validate_competence(text, integer) TO authenticated;
