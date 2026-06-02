-- ════════════════════════════════════════════════════════════════
-- 0020 — RGPD mineur (consentement parental < 15 ans)
-- France : âge du consentement numérique = 15 ans (RGPD art. 8 + Loi I&L).
-- Pour un élève < 15 ans : consentement parental requis ; compte bloqué
-- tant que le parent n'a pas validé via un lien.
-- Réutilise la colonne date_naissance (déjà posée en 0018).
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parental_consent_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parental_consent_given_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parental_consent_required boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_parental_token_uq
  ON public.profiles (parental_consent_token)
  WHERE parental_consent_token IS NOT NULL;

-- ─── Pose des infos élève à l'inscription (refonte : + parent_email) ──
DROP FUNCTION IF EXISTS public.set_eleve_signup_profile(text, text, text, date);

CREATE OR REPLACE FUNCTION public.set_eleve_signup_profile(
  p_username text,
  p_nom text,
  p_prenom text,
  p_date_naissance date,
  p_parent_email text DEFAULT NULL
)
RETURNS TABLE (consent_required boolean, consent_token text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_me uuid := current_profile_id();
  v_user   text := btrim(coalesce(p_username, ''));
  v_nom    text := btrim(coalesce(p_nom, ''));
  v_pren   text := btrim(coalesce(p_prenom, ''));
  v_parent text := nullif(btrim(coalesce(p_parent_email, '')), '');
  v_minor  boolean;
  v_token  text := NULL;
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF char_length(v_user) < 3 OR char_length(v_user) > 24 THEN RAISE EXCEPTION 'invalid_username'; END IF;
  IF char_length(v_nom) < 1 OR char_length(v_pren) < 2 THEN RAISE EXCEPTION 'invalid_name'; END IF;
  IF p_date_naissance IS NULL OR p_date_naissance >= current_date OR p_date_naissance < '1920-01-01' THEN
    RAISE EXCEPTION 'invalid_birthdate';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE lower(username) = lower(v_user) AND id <> v_me) THEN
    RAISE EXCEPTION 'username_taken';
  END IF;

  v_minor := age(p_date_naissance) < interval '15 years';

  IF v_minor THEN
    IF v_parent IS NULL OR v_parent !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
      RAISE EXCEPTION 'parent_email_required';
    END IF;
    v_token := gen_random_uuid()::text;
  END IF;

  UPDATE profiles
     SET username = v_user,
         nom = v_nom,
         prenom = v_pren,
         nom_initial = left(v_nom, 1),
         date_naissance = p_date_naissance,
         parent_email = CASE WHEN v_minor THEN v_parent ELSE NULL END,
         parental_consent_required = v_minor,
         parental_consent_token = CASE WHEN v_minor THEN v_token ELSE NULL END,
         parental_consent_given_at = CASE WHEN v_minor THEN NULL ELSE parental_consent_given_at END
   WHERE id = v_me;

  RETURN QUERY SELECT v_minor, v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_eleve_signup_profile(text, text, text, date, text) TO authenticated;

-- ─── Fiche de consentement (parent non connecté → anon) ──────────
CREATE OR REPLACE FUNCTION public.get_consent_request(p_token text)
RETURNS TABLE (prenom text, inscrit_le timestamptz, ecole_nom text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.prenom, p.created_at, ae.nom
  FROM profiles p
  LEFT JOIN auto_ecoles ae ON ae.id = p.auto_ecole_id
  WHERE p.parental_consent_token = p_token
    AND p.parental_consent_required = true
    AND p.parental_consent_given_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_consent_request(text) TO anon, authenticated;

-- ─── Le parent donne son consentement via le token ──────────────
CREATE OR REPLACE FUNCTION public.accept_parental_consent(p_token text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profiles
   WHERE parental_consent_token = p_token
     AND parental_consent_required = true
     AND parental_consent_given_at IS NULL;

  IF v_id IS NULL THEN RAISE EXCEPTION 'invalid_or_used_token'; END IF;

  PERFORM _set_trusted_op();
  UPDATE profiles
     SET parental_consent_given_at = now(),
         parental_consent_token = NULL
   WHERE id = v_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_parental_consent(text) TO anon, authenticated;
