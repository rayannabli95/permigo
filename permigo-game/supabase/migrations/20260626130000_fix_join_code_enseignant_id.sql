-- Fix : join_moniteur_by_code écrivait profiles.enseignant_attitre_id, colonne
-- qui n'existe PAS sur profiles (la vraie colonne de rattachement est
-- enseignant_id). Conséquence : tout élève rejoignant un moniteur via son code
-- (#/rejoindre → RPC join_moniteur_by_code) déclenchait l'erreur
-- « column "enseignant_attitre_id" of relation "profiles" does not exist »
-- et n'était jamais rattaché à son moniteur.
--
-- accept_invitation (invitation par email) était déjà correct : il fait
--   enseignant_id = COALESCE(invitations.enseignant_attitre_id, enseignant_id)
-- (la colonne enseignant_attitre_id existe bien, mais sur la table invitations).
-- On aligne le flux « code » sur ce comportement : on écrit profiles.enseignant_id.
--
-- Seule la ligne du UPDATE change ; le reste de la fonction est identique.

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

  SELECT p.id, p.auto_ecole_id, ae.nom
    INTO v_mon_id, v_ecole_id, v_ecole_nom
  FROM profiles p
  JOIN auto_ecoles ae ON ae.id = p.auto_ecole_id
  WHERE p.role = 'enseignant' AND p.join_code = v_code
  LIMIT 1;

  IF v_mon_id IS NULL THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;

  SELECT auto_ecole_id INTO v_has FROM profiles WHERE id = v_me;
  IF v_has IS NOT NULL THEN
    RAISE EXCEPTION 'already_has_school';
  END IF;

  PERFORM _set_trusted_op();
  UPDATE profiles
     SET role = 'eleve',
         auto_ecole_id = v_ecole_id,
         enseignant_id = v_mon_id
   WHERE id = v_me;

  RETURN v_ecole_nom;
END;
$function$;
