-- ============================================================================
-- Un élève ne lit plus la fiche de ses camarades
-- ============================================================================
-- Constat mesuré le 07/09/2026 (night run) sur la production :
--   un élève réel voyait 5 lignes de son auto-école et y lisait
--   4 adresses e-mail et 1 date de naissance.
--   En base : 74 e-mails, 86 dates de naissance.
--
-- Cause : la policy profiles_select filtre les LIGNES, jamais les COLONNES.
-- Sa troisième branche ouvrait aux élèves les lignes de leurs camarades
-- « pour le classement ». Une fois la ligne accessible, l'API REST sert
-- TOUTES ses colonnes sur demande : email, date_naissance, parent_email,
-- et surtout parental_consent_token.
--
-- Le jeton de consentement est le point grave : accept_parental_consent(token)
-- est appelable SANS COMPTE. Un élève qui lit le jeton d'un camarade mineur
-- pouvait donc valider lui-même l'accord parental de ce mineur. Au 07/09 le
-- seul jeton en attente appartenait à un mineur rattaché à aucune auto-école,
-- donc illisible : le trou n'était pas encore exploitable, il le devenait au
-- premier mineur rejoignant une école peuplée.
--
-- Ce que le classement élève utilise VRAIMENT : get_eleve_leaderboard(),
-- SECURITY DEFINER, qui ne rend que display_name, score et avatar. Elle ne
-- passe pas par cette policy et n'est donc pas affectée.
--
-- Balayage du client avant écriture (permigo-game/src) : aucun écran élève ne
-- lit le profil d'un camarade en direct. Les seules lectures de profils
-- d'autrui sont
--   - src/pages/common/messages.js  → role = 'enseignant' de son école
--   - src/pages/common/profil.js    → branche me.role === 'enseignant'
--   - src/pages/enseignant/*, src/pages/gerant/*
-- toutes couvertes par les deux premières branches, qu'on garde intactes.
--
-- Retour arrière : rejouer l'ancienne expression, conservée en commentaire en
-- bas de ce fichier.
-- ============================================================================

ALTER POLICY profiles_select ON public.profiles
  USING (
    -- 1. sa propre fiche
    (auth_id = (SELECT auth.uid()))
    -- 2. le staff voit son auto-école
    OR (
      get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text])
      AND auto_ecole_id = get_my_auto_ecole_id()
    )
    -- 3. l'élève voit le STAFF de son auto-école (pour ouvrir une
    --    conversation avec son moniteur), et plus jamais ses camarades
    OR (
      get_my_role() = 'eleve'::text
      AND auto_ecole_id = get_my_auto_ecole_id()
      AND role = ANY (ARRAY['enseignant'::text, 'gerant'::text])
    )
  );

COMMENT ON POLICY profiles_select ON public.profiles IS
  'Sa propre fiche, le staff de son auto-ecole, et pour le staff toute son auto-ecole. Un eleve ne lit JAMAIS la fiche d un autre eleve : le classement passe par get_eleve_leaderboard(), qui ne rend que pseudo, score et avatar. Voir migration 20260908090000.';

-- ─────────────────────────────────────────────────────────────────────────
-- ANCIENNE EXPRESSION (pour retour arrière) :
--   ((auth_id = ( SELECT auth.uid() AS uid))
--    OR ((get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text]))
--        AND (auto_ecole_id = get_my_auto_ecole_id()))
--    OR ((get_my_role() = 'eleve'::text)
--        AND (auto_ecole_id = get_my_auto_ecole_id())
--        AND ((role = ANY (ARRAY['enseignant'::text, 'gerant'::text]))
--             OR ((role = 'eleve'::text) AND (show_in_ranking IS NOT FALSE)))))
-- ─────────────────────────────────────────────────────────────────────────
