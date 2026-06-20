-- ⚠️ À APPLIQUER MANUELLEMENT (Rayan applique les migrations).
-- Le front rend déjà display_name : tant que non appliquée, le classement
-- montre encore le username.
--
-- ⚠️⚠️ DÉCISIONS PRODUIT / RGPD À VALIDER AVANT D'APPLIQUER (audit RLS night-run) :
--   WARN-1 — Exposition nom réel au scope NATIONAL : un élève verra « Max D. »
--            pour des élèves d'AUTRES auto-écoles (avant : un pseudo username).
--            Plus sensible côté mineurs. OK uniquement si le classement national
--            public est voulu avec de vrais noms. Sinon : limiter le nom réel au
--            scope 'ecole' et garder un pseudo/anonyme au national.
--   WARN-2 — Ces RPC sont SECURITY DEFINER et NE filtrent PAS show_in_ranking
--            (comportement préexistant — pas introduit ici). Un élève opté-out
--            (défaut show_in_ranking=false) était déjà affiché via son username ;
--            il le sera désormais via son nom réel. Si l'opt-out doit être respecté,
--            ajouter dans le CTE base : AND (p.show_in_ranking IS TRUE OR p.id = (SELECT uid FROM me))
--            — ⚠️ mais comme le défaut est false, ça risque de VIDER les classements
--            tant que les élèves n'ont pas opté-in. Décision Rayan requise.
--
-- Fonctions redéfinies (signatures INCHANGÉES) :
--   1. public.get_eleve_leaderboard(p_scope text, p_limit integer)
--      RETURNS TABLE(rang integer, display_name text, score integer, is_me boolean, avatar text)
--   2. public.get_theory_leaderboard(p_scope text, p_limit integer)
--      RETURNS TABLE(rang int, display_name text, score int, n_comp int, n_exams int, is_me boolean, avatar text)
--   3. public.get_hall_of_fame(p_scope text, p_limit integer)
--      RETURNS TABLE(prenom text, avatar text, recu_at timestamptz, is_me boolean)
--
-- Seul changement : display_name (et prenom dans get_hall_of_fame) passe de
-- username à "Prénom + initiale du nom + '.'" (ex : « Max D. »).
-- Règle :
--   - is_me → 'Toi'
--   - sinon → COALESCE(NULLIF(TRIM(p.prenom || ' ' || LEFT(COALESCE(p.nom,''),1) || '.'),''), 'Apprenti')
-- ═══════════════════════════════════════════════════════════════


-- 1. get_eleve_leaderboard ──────────────────────────────────────
-- Dernière définition : 20260616010000_eleve_leaderboard_hall_of_fame.sql
-- Changement : display_name dans le SELECT final (CASE is_me / real name).
CREATE OR REPLACE FUNCTION public.get_eleve_leaderboard(
  p_scope text DEFAULT 'ecole', p_limit integer DEFAULT 50
)
RETURNS TABLE(rang integer, display_name text, score integer, is_me boolean, avatar text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT current_profile_id() AS uid,
           (SELECT auto_ecole_id FROM profiles WHERE id = current_profile_id()) AS aid
  ),
  base AS (
    SELECT
      p.id,
      p.prenom,
      p.nom,
      p.avatar_url AS avatar,
      count(v.id) FILTER (WHERE v.statut = 'acquis')::int AS score
    FROM profiles p
    LEFT JOIN validations v ON v.eleve_id = p.id
    WHERE p.role = 'eleve'
      -- 🎓 on retire les lauréats (permis obtenu) du classement actif
      AND NOT EXISTS (
        SELECT 1 FROM examens e WHERE e.eleve_id = p.id AND e.statut = 'recu'
      )
      AND (
        (p_scope = 'ecole'    AND p.auto_ecole_id = (SELECT aid FROM me))
        OR (p_scope = 'national')
      )
    GROUP BY p.id, p.prenom, p.nom, p.avatar_url
  ),
  ranked AS (
    SELECT row_number() OVER (ORDER BY score DESC, id) AS rang, * FROM base
  )
  SELECT
    rang::int,
    CASE
      WHEN id = (SELECT uid FROM me) THEN 'Toi'
      ELSE COALESCE(
             NULLIF(TRIM(prenom || ' ' || LEFT(COALESCE(nom, ''), 1) || '.'), ''),
             'Apprenti'
           )
    END AS display_name,
    score,
    (id = (SELECT uid FROM me)) AS is_me,
    avatar
  FROM ranked
  WHERE rang <= p_limit
     OR id = (SELECT uid FROM me)
  ORDER BY rang;
$function$;

REVOKE ALL ON FUNCTION public.get_eleve_leaderboard(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_eleve_leaderboard(text, integer) TO authenticated;


-- 2. get_theory_leaderboard ─────────────────────────────────────
-- Dernière définition : 20260610120000_ligue_theorique.sql
-- Changement : display_name dans le SELECT final (CASE is_me / real name).
CREATE OR REPLACE FUNCTION public.get_theory_leaderboard(
  p_scope text DEFAULT 'ecole', p_limit int DEFAULT 50
)
RETURNS TABLE (rang int, display_name text, score int,
               n_comp int, n_exams int, is_me boolean, avatar text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT current_profile_id() AS uid,
           (SELECT auto_ecole_id FROM profiles
             WHERE id = current_profile_id()) AS aid
  ),
  theory AS (
    SELECT qa.user_id,
      COUNT(DISTINCT qa.competence_id) FILTER (
        WHERE qa.type IN ('post_validation','consolidation','review')
          AND qa.score >= 70 AND qa.competence_id IS NOT NULL)::int AS n_comp,
      COUNT(DISTINCT qa.ref_id) FILTER (
        WHERE qa.type = 'exam_blanc' AND COALESCE(qa.passed,false))::int AS n_exams
    FROM quiz_attempts qa
    GROUP BY qa.user_id
  ),
  base AS (
    SELECT
      p.id,
      p.prenom,
      p.nom,
      p.avatar_url AS avatar,
      COALESCE(t.n_comp,0) AS n_comp,
      COALESCE(t.n_exams,0) AS n_exams,
      COALESCE(t.n_comp,0) + COALESCE(t.n_exams,0)*4 AS score
    FROM profiles p
    LEFT JOIN theory t ON t.user_id = p.id
    WHERE p.role = 'eleve'
      AND ((p_scope='ecole' AND p.auto_ecole_id = (SELECT aid FROM me))
           OR p_scope='national')
  ),
  ranked AS (SELECT row_number() OVER (ORDER BY score DESC, id) AS rang, * FROM base)
  SELECT
    rang::int,
    CASE
      WHEN id = (SELECT uid FROM me) THEN 'Toi'
      ELSE COALESCE(
             NULLIF(TRIM(prenom || ' ' || LEFT(COALESCE(nom, ''), 1) || '.'), ''),
             'Apprenti'
           )
    END AS display_name,
    score::int,
    n_comp,
    n_exams,
    (id = (SELECT uid FROM me)) AS is_me,
    avatar
  FROM ranked
  WHERE rang <= p_limit OR id = (SELECT uid FROM me)
  ORDER BY rang;
$$;

REVOKE ALL ON FUNCTION public.get_theory_leaderboard(text, int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_theory_leaderboard(text, int) TO authenticated;


-- 3. get_hall_of_fame ───────────────────────────────────────────
-- Dernière définition : 20260616010000_eleve_leaderboard_hall_of_fame.sql
-- La colonne s'appelle `prenom` (signature inchangée).
-- Changement : on passe de prenom seul à "Prénom N." (+ initiale du nom).
-- Règle is_me : pour le HoF, afficher "Toi" (cohérence avec les autres classements).
CREATE OR REPLACE FUNCTION public.get_hall_of_fame(
  p_scope text DEFAULT 'ecole', p_limit integer DEFAULT 100
)
RETURNS TABLE(prenom text, avatar text, recu_at timestamptz, is_me boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT current_profile_id() AS uid,
           (SELECT auto_ecole_id FROM profiles WHERE id = current_profile_id()) AS aid
  )
  SELECT
    CASE
      WHEN p.id = (SELECT uid FROM me) THEN 'Toi'
      ELSE COALESCE(
             NULLIF(TRIM(p.prenom || ' ' || LEFT(COALESCE(p.nom, ''), 1) || '.'), ''),
             'Lauréat'
           )
    END AS prenom,
    p.avatar_url AS avatar,
    max(e.created_at) AS recu_at,
    (p.id = (SELECT uid FROM me)) AS is_me
  FROM profiles p
  JOIN examens e ON e.eleve_id = p.id AND e.statut = 'recu'
  WHERE p.role = 'eleve'
    AND (
      (p_scope = 'ecole'    AND p.auto_ecole_id = (SELECT aid FROM me))
      OR (p_scope = 'national')
    )
  GROUP BY p.id, p.prenom, p.nom, p.avatar_url
  ORDER BY recu_at DESC NULLS LAST
  LIMIT p_limit;
$function$;

GRANT EXECUTE ON FUNCTION public.get_hall_of_fame(text, integer) TO authenticated;
