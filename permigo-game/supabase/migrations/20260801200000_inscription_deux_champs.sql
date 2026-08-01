-- ═══════════════════════════════════════════════════════════════
-- Inscription à deux champs : e-mail + mot de passe, rien d'autre.
--
-- Avant : le formulaire demandait prénom, nom, date de naissance et parfois
-- l'e-mail d'un parent AVANT que l'élève ait vu quoi que ce soit du produit.
-- set_eleve_signup_profile() exigeait les trois (invalid_name / invalid_birthdate).
--
-- Maintenant : le compte se crée avec un pseudo seul, et les deux informations
-- qui restent nécessaires sont demandées PLUS TARD, dans l'app, au moment où
-- elles servent :
--   · la date de naissance → carte posée dans l'accueil (obligation légale,
--     consentement d'un parent en dessous de 15 ans, art. 8 RGPD) ;
--   · le prénom → au moment où l'élève apparaît dans un classement.
--
-- ⚠️ set_eleve_signup_profile() n'est PAS supprimée : d'anciens onglets ouverts
-- peuvent encore l'appeler pendant le déploiement.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Inscription : le pseudo, et c'est tout ────────────────────────────
CREATE OR REPLACE FUNCTION public.set_eleve_signup_minimal(p_username text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me   uuid := current_profile_id();
  v_user text := btrim(coalesce(p_username, ''));
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  -- Même bornes que la contrainte de colonne username_format (3-16, sans
  -- accent ni espace) : sinon l'erreur remonte en 23514 illisible côté client.
  IF v_user !~ '^[A-Za-z0-9_]{3,16}$' THEN
    RAISE EXCEPTION 'invalid_username';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE lower(username) = lower(v_user) AND id <> v_me) THEN
    RAISE EXCEPTION 'username_taken';
  END IF;

  UPDATE profiles SET username = v_user WHERE id = v_me;
END;
$$;

-- ─── 2. La date de naissance, posée plus tard ─────────────────────────────
-- Même règle qu'avant : moins de 15 ans → consentement d'un parent exigé et
-- compte bloqué tant qu'il n'est pas donné (route-guards.js).
-- Recalculée à CHAQUE appel : corriger sa date ne doit jamais servir à sortir
-- du consentement une fois qu'on est dedans.
CREATE OR REPLACE FUNCTION public.set_my_birthdate(
  p_date_naissance date,
  p_parent_email   text DEFAULT NULL
)
RETURNS TABLE(consent_required boolean, consent_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
#variable_conflict use_column
DECLARE
  v_me     uuid := current_profile_id();
  v_parent text := nullif(btrim(coalesce(p_parent_email, '')), '');
  v_minor  boolean;
  v_token  text := NULL;
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_date_naissance IS NULL OR p_date_naissance >= current_date OR p_date_naissance < '1920-01-01' THEN
    RAISE EXCEPTION 'invalid_birthdate';
  END IF;

  v_minor := age(p_date_naissance) < interval '15 years';

  IF v_minor THEN
    IF v_parent IS NULL OR v_parent !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
      RAISE EXCEPTION 'parent_email_required';
    END IF;
    -- Un consentement déjà donné n'est pas redemandé (jeton conservé).
    SELECT coalesce(parental_consent_token, gen_random_uuid()::text) INTO v_token
      FROM profiles WHERE id = v_me;
  END IF;

  -- parental_consent_given_at n'est jamais touché ici : un accord déjà donné
  -- reste donné (trace de la preuve), et c'est route-guards.js qui tranche en
  -- lisant le couple (required, given_at).
  UPDATE profiles
     SET date_naissance = p_date_naissance,
         parent_email = CASE WHEN v_minor THEN v_parent ELSE NULL END,
         parental_consent_required = v_minor,
         parental_consent_token = CASE WHEN v_minor THEN v_token ELSE NULL END
   WHERE id = v_me;

  RETURN QUERY SELECT v_minor, v_token;
END;
$$;

-- ─── 3. Le prénom, posé plus tard ─────────────────────────────────────────
-- Appelée quand l'élève entre dans un classement : son nom d'affichage sort
-- de là. Le nom de famille reste facultatif, seule son initiale est publiée.
CREATE OR REPLACE FUNCTION public.set_my_identity(
  p_prenom text,
  p_nom    text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me   uuid := current_profile_id();
  v_pren text := btrim(coalesce(p_prenom, ''));
  v_nom  text := nullif(btrim(coalesce(p_nom, '')), '');
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF char_length(v_pren) < 2 OR char_length(v_pren) > 40 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;
  IF v_nom IS NOT NULL AND char_length(v_nom) > 40 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;

  UPDATE profiles
     SET prenom = v_pren,
         nom = coalesce(v_nom, nom),
         nom_initial = CASE WHEN v_nom IS NULL THEN nom_initial ELSE left(v_nom, 1) END
   WHERE id = v_me;
END;
$$;

REVOKE ALL ON FUNCTION public.set_eleve_signup_minimal(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_my_birthdate(date, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_my_identity(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_eleve_signup_minimal(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_my_birthdate(date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_my_identity(text, text) TO authenticated;
