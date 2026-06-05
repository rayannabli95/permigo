-- ═══════════════════════════════════════════════════════════════
-- RPC : get_league_leaderboard
-- Retourne le classement hebdomadaire (lundi → dimanche) pour la
-- même école que l'utilisateur connecté.
-- p_role  : 'eleve' | 'enseignant'
-- p_limit : max lignes (défaut 50)
--
-- Points élève   : quiz_correct×2 + comp_acquis(semaine)×5
-- Points moniteur: validations données(semaine)×1
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_league_leaderboard(
  p_role  TEXT DEFAULT 'eleve',
  p_limit INT  DEFAULT 50
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
  v_caller    UUID := auth.uid();
  v_week_start TIMESTAMPTZ;
BEGIN
  -- Récupère l'école de l'appelant
  SELECT auto_ecole_id INTO v_ecole_id
  FROM profiles WHERE id = v_caller;
  IF v_ecole_id IS NULL THEN RETURN; END IF;

  -- Lundi de la semaine courante (UTC)
  v_week_start := date_trunc('week', now());

  -- ── Élèves ──────────────────────────────────────────────────
  IF p_role = 'eleve' THEN
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

  -- ── Enseignants ─────────────────────────────────────────────
  ELSIF p_role = 'enseignant' THEN
    RETURN QUERY
    WITH val_pts AS (
      SELECT v.validated_by AS user_id,
             COUNT(*)::INT AS pts
      FROM validations v
      JOIN profiles p ON p.id = v.validated_by
                      AND p.auto_ecole_id = v_ecole_id
                      AND p.role = 'enseignant'
      WHERE v.validated_at >= v_week_start
      GROUP BY v.validated_by
    )
    SELECT
      pr.id AS user_id,
      pr.prenom || ' ' || LEFT(COALESCE(pr.nom,''), 1) || '.' AS display_name,
      pr.avatar_url,
      COALESCE(vp.pts, 0)::INT AS weekly_pts,
      ROW_NUMBER() OVER (ORDER BY COALESCE(vp.pts,0) DESC)::BIGINT AS rank_pos,
      (pr.id = v_caller) AS is_me
    FROM profiles pr
    LEFT JOIN val_pts vp ON vp.user_id = pr.id
    WHERE pr.auto_ecole_id = v_ecole_id
      AND pr.role = 'enseignant'
      AND (COALESCE(vp.pts,0) > 0 OR pr.id = v_caller)
    ORDER BY weekly_pts DESC
    LIMIT p_limit;
  END IF;
END;
$$;

-- Permissions
REVOKE ALL  ON FUNCTION get_league_leaderboard(TEXT, INT) FROM public, anon;
GRANT EXECUTE ON FUNCTION get_league_leaderboard(TEXT, INT) TO authenticated;
