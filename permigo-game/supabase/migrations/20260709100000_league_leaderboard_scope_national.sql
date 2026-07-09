-- ═══════════════════════════════════════════════════════════════
-- Ligue enseignant : portée NATIONALE.
-- Avant : get_league_leaderboard(p_role='enseignant') filtrait sur
-- auto_ecole_id — or chaque moniteur indépendant a SA propre école,
-- donc il était toujours SEUL dans son classement (TODO documenté
-- dans ligue-semaine.js). Même mécanique que côté élève
-- (get_eleve_leaderboard p_scope 'ecole'|'national').
--
-- Ajout : p_scope TEXT DEFAULT 'ecole' ('ecole' | 'national').
--   · enseignant + national → TOUS les moniteurs inscrits (prénom +
--     initiale du nom, comme en école — pas de donnée perso de plus).
--   · élève → comportement inchangé (p_scope ignoré ; le national
--     élève passe déjà par get_eleve_leaderboard).
--
-- ⚠️ La signature change → DROP obligatoire, sinon CREATE OR REPLACE
-- crée une SURCHARGE et les appels à 2 arguments deviennent ambigus.
-- ═══════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS get_league_leaderboard(TEXT, INT);

CREATE OR REPLACE FUNCTION get_league_leaderboard(
  p_role  TEXT DEFAULT 'eleve',
  p_limit INT  DEFAULT 50,
  p_scope TEXT DEFAULT 'ecole'
)
RETURNS TABLE (
  user_id      UUID,
  display_name TEXT,
  avatar_url   TEXT,
  weekly_pts   INT,
  rank_pos     BIGINT,
  is_me        BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ecole_id  UUID;
  v_caller    UUID;
  v_week_start TIMESTAMPTZ;
BEGIN
  -- Profil de l'appelant : profiles.auth_id = auth.uid() (PAS profiles.id)
  SELECT id, auto_ecole_id INTO v_caller, v_ecole_id
  FROM profiles WHERE auth_id = auth.uid();
  IF v_caller IS NULL THEN RETURN; END IF;

  -- Lundi de la semaine courante (UTC)
  v_week_start := date_trunc('week', now());

  -- ── Élèves (inchangé : toujours scopé école) ────────────────
  IF p_role = 'eleve' THEN
    IF v_ecole_id IS NULL THEN RETURN; END IF;
    RETURN QUERY
    WITH quiz_pts AS (
      SELECT qa.user_id,
             COALESCE(SUM(CASE WHEN qa.score >= 60 THEN 2 ELSE 0 END)::INT, 0) AS pts
      FROM quiz_attempts qa
      JOIN profiles p ON p.id = qa.user_id
                      AND p.auto_ecole_id = v_ecole_id
                      AND p.role = 'eleve'
      WHERE qa.completed_at >= v_week_start
      GROUP BY qa.user_id
    ),
    val_pts AS (
      SELECT v.eleve_id AS user_id,
             (COUNT(*) * 5)::INT AS pts
      FROM validations v
      JOIN profiles p ON p.id = v.eleve_id
                      AND p.auto_ecole_id = v_ecole_id
                      AND p.role = 'eleve'
      WHERE v.validated_at >= v_week_start
        AND v.statut = 'acquis'
      GROUP BY v.eleve_id
    ),
    scored AS (
      SELECT
        pr.id,
        pr.username,
        pr.avatar_url,
        pr.show_in_ranking,
        COALESCE(q.pts, 0) + COALESCE(v.pts, 0) AS total_pts
      FROM profiles pr
      LEFT JOIN quiz_pts q ON q.user_id = pr.id
      LEFT JOIN val_pts  v ON v.user_id = pr.id
      WHERE pr.auto_ecole_id = v_ecole_id
        AND pr.role = 'eleve'
        AND (pr.show_in_ranking = true OR pr.id = v_caller)
    )
    SELECT
      sc.id AS user_id,
      CASE
        WHEN sc.id = v_caller       THEN COALESCE(NULLIF(sc.username,''), 'Toi')
        WHEN sc.show_in_ranking     THEN COALESCE(NULLIF(sc.username,''), 'Apprenti')
        ELSE '—'
      END AS display_name,
      CASE WHEN sc.id = v_caller OR sc.show_in_ranking THEN sc.avatar_url ELSE NULL END,
      sc.total_pts::INT AS weekly_pts,
      ROW_NUMBER() OVER (ORDER BY sc.total_pts DESC)::BIGINT AS rank_pos,
      (sc.id = v_caller) AS is_me
    FROM scored sc
    WHERE sc.total_pts > 0 OR sc.id = v_caller
    ORDER BY sc.total_pts DESC
    LIMIT p_limit;

  -- ── Enseignants : école OU national ─────────────────────────
  ELSIF p_role = 'enseignant' THEN
    IF p_scope = 'national' THEN
      -- Le roster national des moniteurs est réservé aux moniteurs
      -- eux-mêmes : un compte élève ne doit pas pouvoir énumérer
      -- tous les moniteurs de la plateforme (fonction SECURITY
      -- DEFINER = la RLS ne protège pas ici).
      IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE auth_id = auth.uid() AND role IN ('enseignant','gerant')
      ) THEN RETURN; END IF;
    ELSIF v_ecole_id IS NULL THEN
      RETURN;
    END IF;
    RETURN QUERY
    WITH val_pts AS (
      SELECT v.validated_by AS user_id,
             COUNT(*)::INT AS pts
      FROM validations v
      JOIN profiles p ON p.id = v.validated_by
                      AND p.role = 'enseignant'
                      AND (p_scope = 'national' OR p.auto_ecole_id = v_ecole_id)
      WHERE v.validated_at >= v_week_start
      GROUP BY v.validated_by
    )
    SELECT
      pr.id AS user_id,
      pr.prenom || ' ' || LEFT(COALESCE(pr.nom,''), 1) || '.' AS display_name,
      pr.avatar_url,
      COALESCE(vp.pts, 0)::INT AS weekly_pts,
      ROW_NUMBER() OVER (ORDER BY COALESCE(vp.pts,0) DESC, pr.id)::BIGINT AS rank_pos,
      (pr.id = v_caller) AS is_me
    FROM profiles pr
    LEFT JOIN val_pts vp ON vp.user_id = pr.id
    WHERE pr.role = 'enseignant'
      AND (p_scope = 'national' OR pr.auto_ecole_id = v_ecole_id)
      AND (COALESCE(vp.pts,0) > 0 OR pr.id = v_caller)
    ORDER BY weekly_pts DESC, user_id
    LIMIT p_limit;
  END IF;
END;
$$;

REVOKE ALL  ON FUNCTION get_league_leaderboard(TEXT, INT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION get_league_leaderboard(TEXT, INT, TEXT) TO authenticated;
