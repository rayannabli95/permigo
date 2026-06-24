-- ════════════════════════════════════════════════════════════════════════
-- Migration : rôle « owner » (plateforme) au-dessus de « gerant » (école)
-- ────────────────────────────────────────────────────────────────────────
-- Objectif : remplacer le hack RLS hardcodé sur l'email rayannabli27@gmail.com
-- (policy leads_select) par un VRAI rôle 'owner', et donner à ce rôle une vue
-- AGRÉGÉE de toute la plateforme (toutes les écoles), sans casser le scoping
-- mono-école du 'gerant' (toujours via get_my_auto_ecole_id()).
--
-- Sémantique :
--   eleve / enseignant / gerant : inchangés (gerant = SON école uniquement).
--   owner : voit TOUTE la plateforme, AGRÉGATS par défaut (vie privée des
--           moniteurs respectée — pas de nominatif sauf drill assumé).
--
-- ⚠️ NON APPLIQUÉE EN PROD par cette session. À relire (supabase-rls-reviewer)
--    puis appliquer manuellement par Rayan. Voir l'étape de promotion en bas.
-- ════════════════════════════════════════════════════════════════════════

-- 1) Élargir la contrainte de rôle pour autoriser 'owner'.
--    (La contrainte actuelle interdit 'owner' ET 'admin' — on tranche : on
--     ajoute 'owner', on laisse 'admin' de côté. Si un RPC référence encore
--     'admin', il faudra l'aligner sur 'owner' dans un passage dédié.)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['eleve'::text, 'enseignant'::text, 'gerant'::text, 'owner'::text]));

-- 2) Helper : is_owner() — STABLE SECURITY DEFINER, miroir de get_my_role().
--    Sert de frontière de sécurité dans les policies et RPC ci-dessous.
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_my_role() = 'owner';
$$;

REVOKE ALL ON FUNCTION public.is_owner() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;

-- 3) leads_select : retirer le hack email, brancher sur is_owner().
--    Les leads (pipeline commercial de la landing) sont une donnée PLATEFORME
--    → seul l'owner les lit. (Avant : un gerant dont l'email == Rayan ; le
--     filtre par rôle 'gerant' n'était qu'un proxy de « c'est Rayan ».)
DROP POLICY IF EXISTS leads_select ON public.leads;
CREATE POLICY leads_select ON public.leads
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_owner());

-- 4) RPC : vue d'ensemble plateforme (agrégats globaux). Un seul row.
CREATE OR REPLACE FUNCTION public.get_owner_overview()
RETURNS TABLE (
  nb_ecoles      bigint,
  nb_eleves      bigint,
  nb_moniteurs   bigint,
  nb_validations bigint,
  nb_examens     bigint,
  nb_recus       bigint,
  taux_reussite  integer,
  nb_actifs_7j   bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'forbidden: owner only';
  END IF;

  -- NB : on filtre partout deleted_at IS NULL (soft-delete) pour ne pas gonfler
  -- les effectifs avec des comptes supprimés ; les validations/examens d'élèves
  -- supprimés sont exclus via le JOIN sur profiles.
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.auto_ecoles),
    (SELECT count(*) FROM public.profiles WHERE role = 'eleve' AND deleted_at IS NULL),
    (SELECT count(*) FROM public.profiles WHERE role = 'enseignant' AND deleted_at IS NULL),
    (SELECT count(*) FROM public.validations v
       JOIN public.profiles p ON p.id = v.eleve_id
       WHERE v.statut = 'acquis' AND p.deleted_at IS NULL),
    (SELECT count(*) FROM public.examens e
       JOIN public.profiles p ON p.id = e.eleve_id WHERE p.deleted_at IS NULL),
    (SELECT count(*) FROM public.examens e
       JOIN public.profiles p ON p.id = e.eleve_id
       WHERE e.statut = 'recu' AND p.deleted_at IS NULL),
    -- taux de réussite = reçus / (reçus + ratés) parmi les examens PASSÉS
    (SELECT CASE
        WHEN count(*) FILTER (WHERE e.statut IN ('recu','rate')) > 0
        THEN round(100.0 * count(*) FILTER (WHERE e.statut = 'recu')
             / count(*) FILTER (WHERE e.statut IN ('recu','rate')))::int
        ELSE 0 END
      FROM public.examens e
      JOIN public.profiles p ON p.id = e.eleve_id WHERE p.deleted_at IS NULL),
    (SELECT count(*) FROM public.profiles
       WHERE role = 'eleve' AND deleted_at IS NULL
         AND last_active_at >= now() - interval '7 days');
END;
$$;

REVOKE ALL ON FUNCTION public.get_owner_overview() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_owner_overview() TO authenticated;

-- 5) RPC : ventilation par école (1 row / école, drillable). Agrégats — jamais
--    le détail nominatif d'un moniteur (antipattern surveillance #6).
CREATE OR REPLACE FUNCTION public.get_owner_school_breakdown()
RETURNS TABLE (
  ecole_id           uuid,
  ecole_nom          text,
  ville              text,
  abonnement_status  text,
  nb_moniteurs       bigint,
  nb_eleves          bigint,
  nb_validations     bigint,
  nb_recus           bigint,
  nb_actifs_7j       bigint,
  derniere_activite  timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'forbidden: owner only';
  END IF;

  RETURN QUERY
  SELECT
    ae.id,
    ae.nom,
    ae.ville,
    ae.abonnement_status,
    (SELECT count(*) FROM public.profiles p
       WHERE p.auto_ecole_id = ae.id AND p.role = 'enseignant' AND p.deleted_at IS NULL),
    (SELECT count(*) FROM public.profiles p
       WHERE p.auto_ecole_id = ae.id AND p.role = 'eleve' AND p.deleted_at IS NULL),
    (SELECT count(*) FROM public.validations v
       JOIN public.profiles p ON p.id = v.eleve_id
       WHERE p.auto_ecole_id = ae.id AND v.statut = 'acquis' AND p.deleted_at IS NULL),
    (SELECT count(*) FROM public.examens e
       JOIN public.profiles p ON p.id = e.eleve_id
       WHERE p.auto_ecole_id = ae.id AND e.statut = 'recu' AND p.deleted_at IS NULL),
    (SELECT count(*) FROM public.profiles p
       WHERE p.auto_ecole_id = ae.id AND p.role = 'eleve' AND p.deleted_at IS NULL
         AND p.last_active_at >= now() - interval '7 days'),
    (SELECT max(p.last_active_at) FROM public.profiles p
       WHERE p.auto_ecole_id = ae.id AND p.deleted_at IS NULL)
  FROM public.auto_ecoles ae
  ORDER BY ae.nom;
END;
$$;

REVOKE ALL ON FUNCTION public.get_owner_school_breakdown() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_owner_school_breakdown() TO authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- ÉTAPE MANUELLE (à exécuter par Rayan APRÈS application, hors migration) :
-- Promouvoir le compte plateforme en 'owner' (il lit alors les leads + cockpit
-- owner ; sans ça, plus PERSONNE ne lit les leads → ne pas oublier) :
--
--   UPDATE public.profiles
--      SET role = 'owner'
--    WHERE auth_id = (SELECT id FROM auth.users WHERE email = 'rayannabli27@gmail.com');
--
-- Vérifs post-apply : SELECT public.is_owner();  -- doit renvoyer true
--                     SELECT * FROM public.get_owner_overview();
-- ════════════════════════════════════════════════════════════════════════
