-- ═══════════════════════════════════════════════════════════════
-- Migration : Cockpit gérant — cohortes d'élèves + KPIs
-- Date      : 2026-05-18
-- ADN       : Tesla + Bloomberg + Airbnb (1 RPC, 10 secondes de lecture)
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. get_gerant_cockpit — TOUT le dashboard en 1 call
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_gerant_cockpit()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid           UUID := public.current_profile_id();
  v_ecole         UUID;
  v_kpi           JSONB;
  v_cohorts       JSONB;
  v_creneaux      JSONB;
  v_moniteurs     JSONB;
  v_alerts        JSONB;
BEGIN
  -- Garde gérant uniquement
  SELECT auto_ecole_id INTO v_ecole
  FROM profiles
  WHERE id = v_uid AND role IN ('gerant', 'admin');

  IF v_ecole IS NULL THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  -- ─── KPIs principaux ─────────────────────────────────────────
  WITH stats AS (
    SELECT
      COUNT(*) FILTER (WHERE p.role = 'eleve' AND p.archived_at IS NULL) AS eleves_actifs,
      COUNT(*) FILTER (WHERE p.role = 'moniteur' AND p.archived_at IS NULL) AS moniteurs_actifs,
      COUNT(*) FILTER (
        WHERE p.role = 'eleve'
          AND p.archived_at IS NULL
          AND p.created_at >= NOW() - INTERVAL '30 days'
      ) AS nouveaux_30j
    FROM profiles p
    WHERE p.auto_ecole_id = v_ecole
  ),
  reussite AS (
    SELECT
      COUNT(*) AS total_passages,
      COUNT(*) FILTER (WHERE statut = 'reussi') AS reussites
    FROM examens_passages ep
    JOIN profiles p ON p.id = ep.eleve_id
    WHERE p.auto_ecole_id = v_ecole
      AND ep.passe_le >= NOW() - INTERVAL '90 days'
  ),
  heures AS (
    SELECT COALESCE(SUM(hours), 0) AS h
    FROM moniteur_log_sessions ms
    JOIN profiles p ON p.id = ms.eleve_id
    WHERE p.auto_ecole_id = v_ecole
      AND ms.confirmed_at IS NOT NULL
      AND ms.session_date >= NOW() - INTERVAL '30 days'
  )
  SELECT jsonb_build_object(
    'eleves_actifs',     stats.eleves_actifs,
    'moniteurs_actifs',  stats.moniteurs_actifs,
    'nouveaux_30j',      stats.nouveaux_30j,
    'taux_reussite_90j', CASE
      WHEN reussite.total_passages = 0 THEN NULL
      ELSE ROUND(100.0 * reussite.reussites / reussite.total_passages, 1)
    END,
    'heures_30j',        ROUND(heures.h, 1)
  ) INTO v_kpi
  FROM stats, reussite, heures;

  -- ─── COHORTES d'élèves ───────────────────────────────────────
  -- Champion  : activité 7j + streak >= 7 + >= 1 validation 30j
  -- Engagé    : activité 7j (sans les conditions champion)
  -- À risque  : activité entre 7 et 21j
  -- Inactif   : pas d'activité depuis 21j
  -- Bloqué    : 0 validation depuis 60j ET inscrit depuis > 60j
  WITH eleves AS (
    SELECT
      p.id,
      p.created_at,
      COALESCE(
        (SELECT MAX(created_at) FROM xp_events WHERE user_id = p.id),
        p.created_at
      ) AS last_activity,
      COALESCE((SELECT current_streak FROM streaks WHERE user_id = p.id), 0) AS streak,
      (SELECT COUNT(*) FROM validations
        WHERE user_id = p.id
          AND statut = 'acquis'
          AND created_at >= NOW() - INTERVAL '30 days'
      ) AS val_30j,
      (SELECT COUNT(*) FROM validations
        WHERE user_id = p.id
          AND statut = 'acquis'
      ) AS val_total
    FROM profiles p
    WHERE p.auto_ecole_id = v_ecole
      AND p.role = 'eleve'
      AND p.archived_at IS NULL
  ),
  classified AS (
    SELECT
      id,
      CASE
        WHEN val_total = 0 AND created_at < NOW() - INTERVAL '60 days' THEN 'bloque'
        WHEN last_activity >= NOW() - INTERVAL '7 days'
             AND streak >= 7
             AND val_30j >= 1 THEN 'champion'
        WHEN last_activity >= NOW() - INTERVAL '7 days' THEN 'engage'
        WHEN last_activity >= NOW() - INTERVAL '21 days' THEN 'a_risque'
        ELSE 'inactif'
      END AS cohort
    FROM eleves
  )
  SELECT jsonb_build_object(
    'champion',  COUNT(*) FILTER (WHERE cohort = 'champion'),
    'engage',    COUNT(*) FILTER (WHERE cohort = 'engage'),
    'a_risque',  COUNT(*) FILTER (WHERE cohort = 'a_risque'),
    'inactif',   COUNT(*) FILTER (WHERE cohort = 'inactif'),
    'bloque',    COUNT(*) FILTER (WHERE cohort = 'bloque'),
    'total',     COUNT(*)
  ) INTO v_cohorts
  FROM classified;

  -- ─── CRENEAUX MORTS (créneaux moniteur dispo non bookés) ────
  WITH creneaux AS (
    SELECT
      c.id,
      c.moniteur_id,
      c.start_at,
      c.duration_min,
      (c.eleve_id IS NULL) AS vide
    FROM creneaux c
    JOIN profiles m ON m.id = c.moniteur_id
    WHERE m.auto_ecole_id = v_ecole
      AND c.start_at >= NOW() - INTERVAL '7 days'
      AND c.start_at < NOW()
  )
  SELECT jsonb_build_object(
    'total_passes',  COUNT(*),
    'vides',         COUNT(*) FILTER (WHERE vide),
    'taux_vide_pct', CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE vide) / COUNT(*), 1)
    END,
    'heures_perdues', ROUND(
      SUM(CASE WHEN vide THEN duration_min ELSE 0 END)::NUMERIC / 60.0,
      1
    )
  ) INTO v_creneaux
  FROM creneaux;

  -- ─── TOP MONITEURS (par heures confirmées 30j) ──────────────
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',           p.id,
      'prenom',       p.prenom,
      'nom',          p.nom,
      'avatar_url',   p.avatar_url,
      'heures_30j',   ROUND(t.heures, 1),
      'n_eleves',     t.n_eleves,
      'n_validations',t.n_val
    ) ORDER BY t.heures DESC
  ) INTO v_moniteurs
  FROM (
    SELECT
      p.id,
      COALESCE(SUM(ms.hours), 0)                          AS heures,
      COUNT(DISTINCT ms.eleve_id) FILTER (
        WHERE ms.session_date >= NOW() - INTERVAL '30 days'
      )                                                    AS n_eleves,
      COUNT(*) FILTER (
        WHERE v.created_at >= NOW() - INTERVAL '30 days'
          AND v.statut = 'acquis'
      )                                                    AS n_val
    FROM profiles p
    LEFT JOIN moniteur_log_sessions ms
      ON ms.moniteur_id = p.id
     AND ms.confirmed_at IS NOT NULL
     AND ms.session_date >= NOW() - INTERVAL '30 days'
    LEFT JOIN validations v
      ON v.moniteur_id = p.id
    WHERE p.auto_ecole_id = v_ecole
      AND p.role = 'moniteur'
      AND p.archived_at IS NULL
    GROUP BY p.id
    ORDER BY heures DESC
    LIMIT 5
  ) t
  JOIN profiles p ON p.id = t.id;

  -- ─── ALERTES (signaux rouges à régler en priorité) ──────────
  WITH alerts AS (
    SELECT 'eleves_inactifs_21j' AS code,
           COUNT(*)::INT AS n,
           'Élèves sans activité depuis 21 jours' AS label
    FROM profiles p
    WHERE p.auto_ecole_id = v_ecole
      AND p.role = 'eleve'
      AND p.archived_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM xp_events x
        WHERE x.user_id = p.id
          AND x.created_at >= NOW() - INTERVAL '21 days'
      )

    UNION ALL

    SELECT 'eleves_bloques',
           COUNT(*)::INT,
           'Élèves inscrits depuis > 60j sans aucune validation'
    FROM profiles p
    WHERE p.auto_ecole_id = v_ecole
      AND p.role = 'eleve'
      AND p.archived_at IS NULL
      AND p.created_at < NOW() - INTERVAL '60 days'
      AND NOT EXISTS (
        SELECT 1 FROM validations v
        WHERE v.user_id = p.id AND v.statut = 'acquis'
      )

    UNION ALL

    SELECT 'sessions_non_confirmees_48h',
           COUNT(*)::INT,
           'Sessions enregistrées non confirmées par l''élève (>48h)'
    FROM moniteur_log_sessions ms
    JOIN profiles m ON m.id = ms.moniteur_id
    WHERE m.auto_ecole_id = v_ecole
      AND ms.confirmed_at IS NULL
      AND ms.created_at < NOW() - INTERVAL '48 hours'
      AND ms.created_at > NOW() - INTERVAL '30 days'

    UNION ALL

    SELECT 'moniteurs_inactifs_14j',
           COUNT(*)::INT,
           'Moniteurs sans session enregistrée depuis 14j'
    FROM profiles m
    WHERE m.auto_ecole_id = v_ecole
      AND m.role = 'moniteur'
      AND m.archived_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM moniteur_log_sessions ms
        WHERE ms.moniteur_id = m.id
          AND ms.session_date >= NOW() - INTERVAL '14 days'
      )
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'code', code,
      'count', n,
      'label', label,
      'severity', CASE
        WHEN code = 'eleves_bloques' AND n >= 3 THEN 'high'
        WHEN code = 'sessions_non_confirmees_48h' AND n >= 1 THEN 'high'
        WHEN n >= 5 THEN 'medium'
        WHEN n >= 1 THEN 'low'
        ELSE 'none'
      END
    ) ORDER BY n DESC
  ) INTO v_alerts
  FROM alerts WHERE n > 0;

  -- ─── ASSEMBLAGE FINAL ───────────────────────────────────────
  RETURN jsonb_build_object(
    'auto_ecole_id', v_ecole,
    'generated_at',  NOW(),
    'kpis',          v_kpi,
    'cohorts',       v_cohorts,
    'creneaux_7j',   v_creneaux,
    'top_moniteurs', COALESCE(v_moniteurs, '[]'::JSONB),
    'alerts',        COALESCE(v_alerts, '[]'::JSONB)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_gerant_cockpit() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_gerant_cockpit() TO authenticated;

COMMENT ON FUNCTION public.get_gerant_cockpit() IS
'Cockpit gérant : KPIs + cohortes + créneaux morts + top moniteurs + alertes en 1 call. ADN Tesla/Bloomberg.';


-- ───────────────────────────────────────────────────────────────
-- 2. get_gerant_cohort_details — drill down sur une cohorte
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_gerant_cohort_details(
  p_cohort TEXT,
  p_limit  INT DEFAULT 50
)
RETURNS TABLE (
  eleve_id      UUID,
  prenom        TEXT,
  nom           TEXT,
  avatar_url    TEXT,
  last_activity TIMESTAMPTZ,
  streak        INT,
  val_total     INT,
  val_30j       INT,
  moniteur_id   UUID,
  moniteur_nom  TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid   UUID := public.current_profile_id();
  v_ecole UUID;
BEGIN
  SELECT auto_ecole_id INTO v_ecole
  FROM profiles
  WHERE id = v_uid AND role IN ('gerant', 'admin');

  IF v_ecole IS NULL THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_cohort NOT IN ('champion', 'engage', 'a_risque', 'inactif', 'bloque') THEN
    RAISE EXCEPTION 'Invalid cohort' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH eleves AS (
    SELECT
      p.id,
      p.prenom,
      p.nom,
      p.avatar_url,
      p.created_at,
      COALESCE(
        (SELECT MAX(created_at) FROM xp_events WHERE user_id = p.id),
        p.created_at
      ) AS last_activity,
      COALESCE((SELECT current_streak FROM streaks WHERE user_id = p.id), 0) AS streak,
      (SELECT COUNT(*)::INT FROM validations WHERE user_id = p.id AND statut = 'acquis') AS val_total,
      (SELECT COUNT(*)::INT FROM validations
        WHERE user_id = p.id AND statut = 'acquis'
          AND created_at >= NOW() - INTERVAL '30 days') AS val_30j,
      p.moniteur_id
    FROM profiles p
    WHERE p.auto_ecole_id = v_ecole
      AND p.role = 'eleve'
      AND p.archived_at IS NULL
  ),
  classified AS (
    SELECT
      e.*,
      CASE
        WHEN e.val_total = 0 AND e.created_at < NOW() - INTERVAL '60 days' THEN 'bloque'
        WHEN e.last_activity >= NOW() - INTERVAL '7 days'
             AND e.streak >= 7
             AND e.val_30j >= 1 THEN 'champion'
        WHEN e.last_activity >= NOW() - INTERVAL '7 days' THEN 'engage'
        WHEN e.last_activity >= NOW() - INTERVAL '21 days' THEN 'a_risque'
        ELSE 'inactif'
      END AS cohort
    FROM eleves e
  )
  SELECT
    c.id,
    c.prenom,
    c.nom,
    c.avatar_url,
    c.last_activity,
    c.streak,
    c.val_total,
    c.val_30j,
    c.moniteur_id,
    (m.prenom || ' ' || m.nom)::TEXT
  FROM classified c
  LEFT JOIN profiles m ON m.id = c.moniteur_id
  WHERE c.cohort = p_cohort
  ORDER BY c.last_activity DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(p_limit, 200));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_gerant_cohort_details(TEXT, INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_gerant_cohort_details(TEXT, INT) TO authenticated;


-- ───────────────────────────────────────────────────────────────
-- 3. Indexes critiques pour la perf
-- ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_xp_events_user_created
  ON public.xp_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_validations_user_status_date
  ON public.validations(user_id, statut, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_log_sessions_moniteur_date
  ON public.moniteur_log_sessions(moniteur_id, session_date DESC)
  WHERE confirmed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_log_sessions_eleve_date
  ON public.moniteur_log_sessions(eleve_id, session_date DESC)
  WHERE confirmed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_ecole_role_archived
  ON public.profiles(auto_ecole_id, role)
  WHERE archived_at IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- FIN MIGRATION
-- ═══════════════════════════════════════════════════════════════
