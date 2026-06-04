-- 0016_classement_eleves.sql
-- Classement élève opt-in : pseudo public + RPC anonymisée (scope école / national).
-- N.B. 0015 = user_preferences_update_policy déjà pris → ce fichier est 0016.

-- 1. Pseudo public (opt-in)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- Format : 3-16 chars, alphanum + underscore. Nullable.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'username_format'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT username_format
      CHECK (username IS NULL OR username ~ '^[A-Za-z0-9_]{3,16}$');
  END IF;
END $$;

-- Unique case-insensitive (deux élèves ne peuvent pas avoir le même pseudo).
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uq
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- 2. RPC classement élèves — anonymisé, scope école ou national.
CREATE OR REPLACE FUNCTION public.get_eleve_leaderboard(
  p_scope text DEFAULT 'ecole',
  p_limit int  DEFAULT 50
)
RETURNS TABLE (rang int, display_name text, score int, is_me boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT current_profile_id() AS uid,
           (SELECT auto_ecole_id FROM profiles WHERE id = current_profile_id()) AS aid
  ),
  base AS (
    SELECT
      p.id,
      COALESCE(NULLIF(p.username, ''),
               'Apprenti #' || substring(replace(p.id::text, '-', ''), 1, 4)) AS display_name,
      COUNT(v.id) FILTER (WHERE v.statut = 'acquis')::int AS score
    FROM profiles p
    LEFT JOIN validations v ON v.eleve_id = p.id
    WHERE p.role = 'eleve'
      AND (
        (p_scope = 'ecole'    AND p.auto_ecole_id = (SELECT aid FROM me))
        OR (p_scope = 'national')
      )
    GROUP BY p.id, p.username
  ),
  ranked AS (
    SELECT row_number() OVER (ORDER BY score DESC, id) AS rang, * FROM base
  )
  SELECT rang::int, display_name, score, (id = (SELECT uid FROM me)) AS is_me
  FROM ranked
  WHERE rang <= p_limit
     OR id = (SELECT uid FROM me)
  ORDER BY rang;
$$;

REVOKE ALL ON FUNCTION public.get_eleve_leaderboard(text, int) FROM public;
GRANT EXECUTE ON FUNCTION public.get_eleve_leaderboard(text, int) TO authenticated;
