-- ════════════════════════════════════════════════════════════════
-- À RELIRE + APPLIQUER MANUELLEMENT
-- ════════════════════════════════════════════════════════════════
-- 20260621120000 — join_code (rattachement élève → moniteur par code)
--
-- Chemin BIS au lien d'invitation par email : le moniteur partage UN code
-- court à sa marque (ex : "RAYAN1"). L'élève télécharge l'app, crée son compte
-- avec SON propre email, tape le code → il est rattaché au moniteur.
--
-- Pourquoi ce chemin :
--   • Friction : plus besoin que le moniteur collecte l'email de chaque élève.
--   • Confidentialité (règle non-négociable #1) : le moniteur ne manipule
--     JAMAIS l'email/le numéro de l'élève — l'élève s'enregistre seul.
--   • Viral : un code se partage en story, sur une affiche, au comptoir.
--
-- Le lien d'invitation par email (invitations + accept_invitation) RESTE en
-- place : les deux chemins coexistent.
--
-- Consommé par :
--   src/pages/public/rejoindre.js  (élève : aperçu + rattachement)
--   src/services/invite-eleve.js   (moniteur : définit / partage son code)
--
-- Sécurité :
--   • set_my_join_code / join_moniteur_by_code → SECURITY DEFINER, passent par
--     _set_trusted_op() pour que protect_profile_fields autorise la modif de
--     role / auto_ecole_id / enseignant_attitre_id (même patron que
--     create_independent_moniteur / accept_invitation).
--   • get_join_code_info est lisible par anon (aperçu avant signup, comme
--     get_invitation_by_token) mais n'expose qu'un prénom + le nom de l'école,
--     jamais d'id ni de donnée sensible.
-- ════════════════════════════════════════════════════════════════

set check_function_bodies = off;

-- ──────────────────────────────────────────────────────────────
-- 1. Colonne + unicité (uniquement renseignée pour les moniteurs)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS join_code text;

-- Codes stockés en canonique MAJUSCULES ; unicité globale sur les non-null.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_join_code_uniq
  ON public.profiles (join_code)
  WHERE join_code IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 2. Normalisation : MAJUSCULES + [A-Z0-9] uniquement, 3..16 car.
--    Renvoie NULL si le résultat est hors bornes (laisse l'appelant lever
--    l'erreur métier adaptée).
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._normalize_join_code(p_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT CASE
           WHEN char_length(c) BETWEEN 3 AND 16 THEN c
           ELSE NULL
         END
  FROM (
    SELECT upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')) AS c
  ) s;
$function$;

-- ──────────────────────────────────────────────────────────────
-- 3. set_my_join_code — le moniteur définit / change son code.
--    Renvoie le code canonique enregistré.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_my_join_code(p_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_me   uuid := current_profile_id();
  v_role text;
  v_code text := _normalize_join_code(p_code);
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_me;
  IF v_role <> 'enseignant' THEN
    RAISE EXCEPTION 'not_a_moniteur';
  END IF;

  IF v_code IS NULL THEN
    RAISE EXCEPTION 'invalid_code'; -- < 3 ou > 16 caractères alphanumériques
  END IF;

  -- bypass protect_profile_fields (col. métier sur profiles)
  PERFORM _set_trusted_op();
  BEGIN
    UPDATE profiles SET join_code = v_code WHERE id = v_me;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'code_taken';
  END;

  RETURN v_code;
END;
$function$;

-- ──────────────────────────────────────────────────────────────
-- 4. get_join_code_info — aperçu public (anon) avant inscription.
--    Renvoie 0 ligne si le code n'existe pas (front = code invalide).
--    N'expose qu'un prénom + le nom de l'école (déjà montrés sur l'écran
--    d'activation d'invitation), jamais d'id.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_join_code_info(p_code text)
RETURNS TABLE(moniteur_prenom text, ecole_nom text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT p.prenom, ae.nom
  FROM profiles p
  JOIN auto_ecoles ae ON ae.id = p.auto_ecole_id
  WHERE p.role = 'enseignant'
    AND p.join_code = _normalize_join_code(p_code)
  LIMIT 1;
$function$;

-- ──────────────────────────────────────────────────────────────
-- 5. join_moniteur_by_code — l'élève (déjà signUp) se rattache au moniteur.
--    Renvoie le nom de l'auto-école rejointe (affichage succès).
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.join_moniteur_by_code(p_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_me        uuid := current_profile_id();
  v_code      text := _normalize_join_code(p_code);
  v_mon_id    uuid;
  v_ecole_id  uuid;
  v_ecole_nom text;
  v_has       uuid;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF v_code IS NULL THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;

  -- Résout le code → moniteur + son auto-école
  SELECT p.id, p.auto_ecole_id, ae.nom
    INTO v_mon_id, v_ecole_id, v_ecole_nom
  FROM profiles p
  JOIN auto_ecoles ae ON ae.id = p.auto_ecole_id
  WHERE p.role = 'enseignant' AND p.join_code = v_code
  LIMIT 1;

  IF v_mon_id IS NULL THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;

  -- Anti-abus : un seul rattachement (pas de saut d'auto-école self-serve)
  SELECT auto_ecole_id INTO v_has FROM profiles WHERE id = v_me;
  IF v_has IS NOT NULL THEN
    RAISE EXCEPTION 'already_has_school';
  END IF;

  -- Rattache l'élève (bypass protect_profile_fields via trusted_op)
  PERFORM _set_trusted_op();
  UPDATE profiles
     SET role = 'eleve',
         auto_ecole_id = v_ecole_id,
         enseignant_attitre_id = v_mon_id
   WHERE id = v_me;

  RETURN v_ecole_nom;
END;
$function$;

-- ──────────────────────────────────────────────────────────────
-- 6. Grants (defense-in-depth, même patron que harden_anon_execute_grants)
-- ──────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public._normalize_join_code(text)      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_my_join_code(text)          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_moniteur_by_code(text)     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_join_code_info(text)        FROM PUBLIC;

GRANT  EXECUTE ON FUNCTION public.set_my_join_code(text)          TO authenticated;
GRANT  EXECUTE ON FUNCTION public.join_moniteur_by_code(text)     TO authenticated;
-- aperçu avant inscription : accessible au visiteur non connecté
GRANT  EXECUTE ON FUNCTION public.get_join_code_info(text)        TO anon, authenticated;
