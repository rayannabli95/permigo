-- ════════════════════════════════════════════════════════════════
-- 0018 — Infos élève à l'inscription
-- À la création de compte (invitation, rôle élève), on collecte :
-- usertag (username, unique), nom, prénom, date de naissance.
-- ════════════════════════════════════════════════════════════════

-- Date de naissance (stats). Stockage simple ; gestion mineur = chantier RGPD séparé.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_naissance date;

-- Unicité du usertag, insensible à la casse (aucun doublon existant vérifié).
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uniq
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL AND btrim(username) <> '';

-- ─── Dispo d'un usertag (appelée AVANT signup → accessible en anon) ──
CREATE OR REPLACE FUNCTION public.is_username_available(p_username text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE lower(username) = lower(btrim(p_username))
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;

-- ─── Pose des infos sur le profil de l'élève courant (après signup) ──
CREATE OR REPLACE FUNCTION public.set_eleve_signup_profile(
  p_username text,
  p_nom text,
  p_prenom text,
  p_date_naissance date
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_me uuid := current_profile_id();
  v_user text := btrim(coalesce(p_username, ''));
  v_nom  text := btrim(coalesce(p_nom, ''));
  v_pren text := btrim(coalesce(p_prenom, ''));
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF char_length(v_user) < 3 OR char_length(v_user) > 24 THEN
    RAISE EXCEPTION 'invalid_username';
  END IF;
  IF char_length(v_nom) < 1 OR char_length(v_pren) < 2 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;
  IF p_date_naissance IS NULL OR p_date_naissance >= current_date OR p_date_naissance < '1920-01-01' THEN
    RAISE EXCEPTION 'invalid_birthdate';
  END IF;

  -- Usertag déjà pris par un autre profil ?
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE lower(username) = lower(v_user) AND id <> v_me
  ) THEN
    RAISE EXCEPTION 'username_taken';
  END IF;

  UPDATE profiles
     SET username = v_user,
         nom = v_nom,
         prenom = v_pren,
         nom_initial = left(v_nom, 1),
         date_naissance = p_date_naissance
   WHERE id = v_me;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_eleve_signup_profile(text, text, text, date) TO authenticated;
