-- ════════════════════════════════════════════════════════════════
-- À RELIRE + APPLIQUER MANUELLEMENT
-- ════════════════════════════════════════════════════════════════
-- 20260620160000 — create_independent_moniteur
--
-- Onboarding SELF-SERVE du moniteur indépendant (flow commercial #1).
-- Consommée par : src/pages/public/creer-compte.js
--
-- Contexte :
--   Le trigger handle_new_user_signup ne pose que (auth_id, role, prenom)
--   depuis les metadata du signUp. Un moniteur self-serve se retrouve donc
--   SANS auto_ecole_id ni email → non fonctionnel (le RLS partout repose sur
--   auto_ecole_id). Et un client ne peut PAS poser lui-même
--   profiles.auto_ecole_id (le trigger protect_profile_fields le bloque pour
--   tout rôle ≠ gérant). Il faut donc une RPC SECURITY DEFINER qui crée
--   l'auto-école ET rattache le profil de manière atomique.
--
-- Cette RPC :
--   1. Vérifie que l'appelant est authentifié (current_profile_id()).
--   2. Garde l'idempotence / l'abus : refuse si le profil a déjà un
--      auto_ecole_id (already_has_school).
--   3. Insère une ligne auto_ecoles (nom = p_ecole_nom, slug unique dérivé,
--      abonnement_status par défaut 'beta' — pas de gate paiement en bêta).
--   4. Met à jour le profil appelant : role='enseignant',
--      auto_ecole_id = nouvelle école, nom = p_nom,
--      email = (SELECT email FROM auth.users WHERE id = auth.uid()),
--      en passant par _set_trusted_op() pour que protect_profile_fields
--      autorise la modif de auto_ecole_id/role (même pattern que
--      accept_parental_consent / _unlock_achievement / buy_streak_freeze).
--   5. Retourne le nouvel auto_ecole_id.
--
-- NB pédagogique : aucune monnaie / aucun gate paiement ici (bêta).
--   Stripe ne gate rien au signup pour l'instant — décision produit à
--   confirmer (cf. report). Le statut d'abonnement reste le défaut 'beta'.
-- ════════════════════════════════════════════════════════════════

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_independent_moniteur(
  p_ecole_nom text,
  p_nom text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_me        uuid := current_profile_id();
  v_ecole_nom text := btrim(coalesce(p_ecole_nom, ''));
  v_nom       text := btrim(coalesce(p_nom, ''));
  v_email     text;
  v_has_school uuid;
  v_slug_base text;
  v_slug      text;
  v_ecole_id  uuid;
  v_try       int := 0;
BEGIN
  -- 1. Auth
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Validation des entrées (miroir du CHECK RLS auto_ecoles_insert : 2..120)
  IF char_length(v_ecole_nom) < 2 OR char_length(v_ecole_nom) > 120 THEN
    RAISE EXCEPTION 'invalid_ecole_nom';
  END IF;
  IF char_length(v_nom) < 1 OR char_length(v_nom) > 80 THEN
    RAISE EXCEPTION 'invalid_nom';
  END IF;

  -- 2. Idempotence / anti-abus : un seul rattachement self-serve
  SELECT auto_ecole_id INTO v_has_school FROM profiles WHERE id = v_me;
  IF v_has_school IS NOT NULL THEN
    RAISE EXCEPTION 'already_has_school';
  END IF;

  -- Email de l'utilisateur courant (jamais exposé au client en écriture)
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  -- 3. Crée l'auto-école avec un slug unique dérivé du nom
  --    slug = nom slugifié (a-z0-9 + tirets) + suffixe court aléatoire
  v_slug_base := regexp_replace(
                   regexp_replace(lower(unaccent_safe(v_ecole_nom)), '[^a-z0-9]+', '-', 'g'),
                   '(^-+|-+$)', '', 'g'
                 );
  IF v_slug_base IS NULL OR v_slug_base = '' THEN
    v_slug_base := 'auto-ecole';
  END IF;
  v_slug_base := left(v_slug_base, 48);

  LOOP
    v_try := v_try + 1;
    v_slug := v_slug_base || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
    BEGIN
      INSERT INTO auto_ecoles (nom, slug, abonnement_status)
      VALUES (v_ecole_nom, v_slug, 'beta')
      RETURNING id INTO v_ecole_id;
      EXIT; -- succès
    EXCEPTION WHEN unique_violation THEN
      IF v_try >= 5 THEN RAISE; END IF; -- abandonne après 5 collisions de slug
    END;
  END LOOP;

  -- 4. Rattache le profil appelant (bypass protect_profile_fields via trusted_op)
  PERFORM _set_trusted_op();
  UPDATE profiles
     SET role = 'enseignant',
         auto_ecole_id = v_ecole_id,
         nom = v_nom,
         nom_initial = left(v_nom, 1),
         email = v_email
   WHERE id = v_me;

  -- 5. Retourne l'id de la nouvelle auto-école
  RETURN v_ecole_id;
END;
$function$;

-- Helper de slugification tolérant aux accents. Crée la version "unaccent"
-- si l'extension est dispo, sinon fallback sans translittération (le slug
-- reste valide grâce au regexp_replace [^a-z0-9] qui retire les accents).
CREATE OR REPLACE FUNCTION public.unaccent_safe(p_txt text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Si l'extension unaccent est installée dans le schéma public, l'utiliser.
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'unaccent') THEN
    RETURN public.unaccent(p_txt);
  END IF;
  RETURN p_txt;
EXCEPTION WHEN OTHERS THEN
  RETURN p_txt;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_independent_moniteur(text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_independent_moniteur(text, text) TO authenticated;
