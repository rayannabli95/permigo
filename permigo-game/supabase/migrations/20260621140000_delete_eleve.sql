-- ════════════════════════════════════════════════════════════════
-- À RELIRE + APPLIQUER MANUELLEMENT
-- ════════════════════════════════════════════════════════════════
-- 20260621140000 — delete_eleve (suppression d'un élève par le moniteur)
--
-- Le moniteur peut supprimer un élève depuis « Mes élèves » (menu kebab,
-- bouton rouge) pour alléger la base. Suppression DÉFINITIVE.
--
-- Pourquoi une RPC SECURITY DEFINER :
--   • La policy `profiles_no_delete` (USING false) bloque tout DELETE côté
--     client. Seule une fonction definer (owner = postgres, propriétaire de la
--     table → RLS non forcée) peut supprimer.
--   • Garde-fou : on ne supprime QUE des profils role='eleve', et UNIQUEMENT
--     ceux de la propre auto-école de l'appelant (même frontière que le RLS).
--
-- Mécanique de purge :
--   1. Nettoie les 2 FK en NO ACTION qui pourraient référencer l'élève et
--      bloquer le cascade : flash_quizzes.sent_to/sent_by + profiles.referred_by.
--   2. DELETE du profil → cascade ON DELETE CASCADE sur TOUTES les données
--      propres à l'élève (validations, quiz_attempts, streaks, examens,
--      sessions_moniteur, snapshots, notifications, inventory, préférences…).
--   3. Best-effort : purge aussi la ligne auth.users (libère l'email). Si les
--      droits ne le permettent pas, on n'échoue pas — le gros est déjà libéré.
--
-- NB : aucune dépendance edge function. Toute la purge tient dans la RPC.
-- ════════════════════════════════════════════════════════════════

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.delete_eleve(p_eleve_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_me           uuid := current_profile_id();
  v_my_role      text;
  v_my_ecole     uuid;
  v_target_role  text;
  v_target_ecole uuid;
  v_auth_id      uuid;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Appelant : doit être enseignant ou gérant
  SELECT role, auto_ecole_id INTO v_my_role, v_my_ecole
  FROM profiles WHERE id = v_me;
  IF v_my_role NOT IN ('enseignant', 'gerant') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Cible : doit exister, être un élève, et de la MÊME auto-école
  SELECT role, auto_ecole_id, auth_id
    INTO v_target_role, v_target_ecole, v_auth_id
  FROM profiles WHERE id = p_eleve_id;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'eleve_not_found';
  END IF;
  IF v_target_role <> 'eleve' THEN
    RAISE EXCEPTION 'not_an_eleve';
  END IF;
  IF v_target_ecole IS DISTINCT FROM v_my_ecole THEN
    RAISE EXCEPTION 'forbidden_other_school';
  END IF;

  -- 1. Nettoie les FK NO ACTION qui bloqueraient le cascade
  DELETE FROM flash_quizzes WHERE sent_to = p_eleve_id OR sent_by = p_eleve_id;
  PERFORM _set_trusted_op();
  UPDATE profiles SET referred_by = NULL WHERE referred_by = p_eleve_id;

  -- 2. Supprime le profil → cascade toutes les données propres à l'élève
  PERFORM _set_trusted_op();
  DELETE FROM profiles WHERE id = p_eleve_id;

  -- 3. Best-effort : purge la ligne auth.users (libère l'email).
  --    Tolère un manque de droits sans faire échouer la suppression.
  IF v_auth_id IS NOT NULL THEN
    BEGIN
      DELETE FROM auth.users WHERE id = v_auth_id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN true;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.delete_eleve(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.delete_eleve(uuid) TO authenticated;
