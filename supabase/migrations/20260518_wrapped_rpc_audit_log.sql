-- ═══════════════════════════════════════════════════════════════
-- Migration : Wrapped RPC + Audit Log
-- Date      : 2026-05-18
-- Auteur    : Cowork
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. WRAPPED RPC — agrège toute la data des 4 slides en 1 call
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_wrapped_eleve(p_year INT DEFAULT 2026)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid           UUID := public.current_profile_id();
  v_ecole_id      UUID;
  v_xp_total      INT;
  v_percentile    INT;
  v_rang_ecole    INT;
  v_total_eleves  INT;
  v_streak_max    INT;
  v_streak_curr   INT;
  v_top_comp      TEXT;
  v_top_comp_n    INT;
  v_validations   INT;
  v_quiz_score    NUMERIC;
  v_heures        NUMERIC;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Vérifie role élève
  SELECT auto_ecole_id INTO v_ecole_id
  FROM profiles
  WHERE id = v_uid AND role = 'eleve';

  IF v_ecole_id IS NULL THEN
    RAISE EXCEPTION 'Wrapped reserved to eleves' USING ERRCODE = '42501';
  END IF;

  -- XP totale élève (année)
  SELECT COALESCE(SUM(xp_gained), 0) INTO v_xp_total
  FROM xp_events
  WHERE user_id = v_uid
    AND EXTRACT(YEAR FROM created_at) = p_year;

  -- Rang dans l'école (basé XP année)
  WITH ranks AS (
    SELECT
      p.id,
      RANK() OVER (ORDER BY COALESCE(SUM(x.xp_gained), 0) DESC) AS r,
      COUNT(*) OVER () AS n
    FROM profiles p
    LEFT JOIN xp_events x
      ON x.user_id = p.id
     AND EXTRACT(YEAR FROM x.created_at) = p_year
    WHERE p.auto_ecole_id = v_ecole_id
      AND p.role = 'eleve'
    GROUP BY p.id
  )
  SELECT r, n INTO v_rang_ecole, v_total_eleves
  FROM ranks WHERE id = v_uid;

  v_percentile := CASE
    WHEN v_total_eleves IS NULL OR v_total_eleves = 0 THEN NULL
    ELSE GREATEST(1, ROUND(100.0 * v_rang_ecole / v_total_eleves))
  END;

  -- Streak max + current
  SELECT current_streak, longest_streak
  INTO v_streak_curr, v_streak_max
  FROM streaks
  WHERE user_id = v_uid;

  v_streak_curr := COALESCE(v_streak_curr, 0);
  v_streak_max  := COALESCE(v_streak_max, 0);

  -- Top compétence REMC (la plus validée année)
  SELECT competence_nom, n INTO v_top_comp, v_top_comp_n
  FROM (
    SELECT v.competence_nom, COUNT(*) AS n
    FROM validations v
    WHERE v.user_id = v_uid
      AND v.statut = 'acquis'
      AND EXTRACT(YEAR FROM v.created_at) = p_year
    GROUP BY v.competence_nom
    ORDER BY n DESC
    LIMIT 1
  ) t;

  -- Totaux pour bonus stats
  SELECT COUNT(*) INTO v_validations
  FROM validations
  WHERE user_id = v_uid
    AND statut = 'acquis'
    AND EXTRACT(YEAR FROM created_at) = p_year;

  SELECT COALESCE(AVG(score), 0) INTO v_quiz_score
  FROM quiz_attempts
  WHERE user_id = v_uid
    AND EXTRACT(YEAR FROM created_at) = p_year;

  SELECT COALESCE(SUM(hours), 0) INTO v_heures
  FROM moniteur_log_sessions
  WHERE eleve_id = v_uid
    AND confirmed_at IS NOT NULL
    AND EXTRACT(YEAR FROM session_date) = p_year;

  RETURN jsonb_build_object(
    'year',          p_year,
    'xp_total',      v_xp_total,
    'rang_ecole',    v_rang_ecole,
    'total_eleves',  v_total_eleves,
    'percentile',    v_percentile,
    'streak_max',    v_streak_max,
    'streak_curr',   v_streak_curr,
    'top_competence', v_top_comp,
    'top_competence_n', v_top_comp_n,
    'validations',   v_validations,
    'quiz_score_avg', ROUND(v_quiz_score, 1),
    'heures_conduite', ROUND(v_heures, 1),
    'generated_at',  NOW()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_wrapped_eleve(INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_wrapped_eleve(INT) TO authenticated;

COMMENT ON FUNCTION public.get_wrapped_eleve(INT) IS
'Agrège les stats annuelles d''un élève pour la page Wrapped. SECURITY DEFINER, scope auto via current_profile_id().';


-- ───────────────────────────────────────────────────────────────
-- 2. AUDIT LOG — trace toutes les actions admin/gérant sensibles
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id            BIGSERIAL PRIMARY KEY,
  actor_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role    TEXT NOT NULL,
  auto_ecole_id UUID REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,        -- ex: 'profile.role_changed', 'eleve.archived'
  target_type   TEXT,                 -- ex: 'profile', 'auto_ecole'
  target_id     UUID,
  metadata      JSONB DEFAULT '{}'::JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor      ON public.audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_ecole      ON public.audit_log(auto_ecole_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action     ON public.audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target     ON public.audit_log(target_type, target_id);

-- RLS strict : seul le gérant de l'école peut lire les logs de son école
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_select ON public.audit_log;
CREATE POLICY audit_log_select ON public.audit_log
  FOR SELECT
  USING (
    auto_ecole_id IN (
      SELECT auto_ecole_id FROM profiles
      WHERE id = public.current_profile_id()
        AND role IN ('gerant', 'admin')
    )
  );

-- Aucun INSERT/UPDATE/DELETE via API client → uniquement via RPC log_audit()
DROP POLICY IF EXISTS audit_log_no_write ON public.audit_log;
CREATE POLICY audit_log_no_write ON public.audit_log
  FOR ALL USING (false) WITH CHECK (false);


-- ───────────────────────────────────────────────────────────────
-- 3. RPC log_audit — utilisable côté serveur uniquement
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_audit(
  p_action       TEXT,
  p_target_type  TEXT DEFAULT NULL,
  p_target_id    UUID DEFAULT NULL,
  p_metadata     JSONB DEFAULT '{}'::JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid    UUID := public.current_profile_id();
  v_role   TEXT;
  v_ecole  UUID;
  v_id     BIGINT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT role, auto_ecole_id INTO v_role, v_ecole
  FROM profiles WHERE id = v_uid;

  INSERT INTO public.audit_log (
    actor_id, actor_role, auto_ecole_id, action,
    target_type, target_id, metadata
  ) VALUES (
    v_uid, v_role, v_ecole, p_action,
    p_target_type, p_target_id, COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_audit(TEXT, TEXT, UUID, JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.log_audit(TEXT, TEXT, UUID, JSONB) TO authenticated;


-- ───────────────────────────────────────────────────────────────
-- 4. Trigger auto-log sur les changements sensibles de profiles
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      PERFORM public.log_audit(
        'profile.role_changed',
        'profile',
        NEW.id,
        jsonb_build_object('from', OLD.role, 'to', NEW.role)
      );
    END IF;

    IF NEW.archived_at IS DISTINCT FROM OLD.archived_at THEN
      PERFORM public.log_audit(
        CASE WHEN NEW.archived_at IS NOT NULL THEN 'profile.archived' ELSE 'profile.restored' END,
        'profile',
        NEW.id,
        jsonb_build_object('reason', NEW.archive_reason)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_profile_changes ON public.profiles;
CREATE TRIGGER audit_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_audit_profile_changes();


-- ───────────────────────────────────────────────────────────────
-- 5. RPC pour le gérant : list audit log (paginé)
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_audit_log(
  p_limit  INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_action TEXT DEFAULT NULL
)
RETURNS TABLE (
  id            BIGINT,
  actor_nom     TEXT,
  actor_role    TEXT,
  action        TEXT,
  target_type   TEXT,
  target_id     UUID,
  metadata      JSONB,
  created_at    TIMESTAMPTZ
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

  RETURN QUERY
  SELECT
    a.id,
    (p.prenom || ' ' || p.nom)::TEXT AS actor_nom,
    a.actor_role,
    a.action,
    a.target_type,
    a.target_id,
    a.metadata,
    a.created_at
  FROM audit_log a
  LEFT JOIN profiles p ON p.id = a.actor_id
  WHERE a.auto_ecole_id = v_ecole
    AND (p_action IS NULL OR a.action = p_action)
  ORDER BY a.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 200))
  OFFSET GREATEST(0, p_offset);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_audit_log(INT, INT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_audit_log(INT, INT, TEXT) TO authenticated;


-- ───────────────────────────────────────────────────────────────
-- 6. Retention cron audit_log (730 jours = 2 ans)
-- ───────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'audit_log_retention',
  '0 3 * * 0',  -- chaque dimanche 03h00 UTC
  $$
  DELETE FROM public.audit_log
  WHERE created_at < NOW() - INTERVAL '730 days';
  $$
);

-- ═══════════════════════════════════════════════════════════════
-- FIN MIGRATION
-- ═══════════════════════════════════════════════════════════════
