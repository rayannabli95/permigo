-- ═══════════════════════════════════════════════════════════
-- AUTOPILOT v6 — Audit Log + Soft-delete + Email unique
-- Colle dans : Supabase > SQL Editor > Run
-- Exécuter APRÈS supabase_schema.sql et supabase_new_tables.sql
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. SOFT-DELETE sur events (is_deleted)
-- ─────────────────────────────────────────────
alter table events add column if not exists is_deleted boolean default false;

-- Index pour filtrer rapidement
create index if not exists idx_events_not_deleted on events(is_deleted) where is_deleted = false;

-- ─────────────────────────────────────────────
-- 2. TABLE audit_log — traçabilité des actions
-- ─────────────────────────────────────────────
create table if not exists audit_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete set null,
  user_nom    text,
  user_role   text,
  action      text not null,   -- LOGIN, LOGOUT, RESERVE, CREATE_EVENT, DELETE_EVENT, SAVE_LIVRET, RATE_MONITOR, etc.
  table_name  text,            -- table concernée
  record_id   uuid,            -- id de l'enregistrement concerné
  details     jsonb,           -- données supplémentaires (ex: {h:'09:00',d:2})
  ip_hint     text,            -- pas de vraie IP (côté client), juste user-agent tronqué
  created_at  timestamptz default now()
);

-- Index pour recherches courantes
create index if not exists idx_audit_user    on audit_log(user_id);
create index if not exists idx_audit_action  on audit_log(action);
create index if not exists idx_audit_created on audit_log(created_at desc);

-- RLS : chacun voit ses propres logs, admin voit tout
alter table audit_log enable row level security;

create policy "audit_select" on audit_log for select using (
  user_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);
create policy "audit_insert" on audit_log for insert with check (
  user_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);
-- Personne ne modifie/supprime les logs
create policy "audit_no_update" on audit_log for update using (false);
create policy "audit_no_delete" on audit_log for delete using (
  (select role from profiles where auth_id = auth.uid()) = 'admin'
);

-- ─────────────────────────────────────────────
-- 3. CONTRAINTE email unique sur profiles
-- ─────────────────────────────────────────────
-- Vérifie d'abord les doublons avant d'ajouter la contrainte
-- SELECT email, COUNT(*) FROM profiles WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1;

-- Ajouter l'index unique (si pas de doublons)
create unique index if not exists idx_profiles_email_unique
  on profiles(email)
  where email is not null;

-- ─────────────────────────────────────────────
-- 4. CONTRAINTE double-booking sur events
-- ─────────────────────────────────────────────
-- Empêche 2 leçons confirmées du même élève au même créneau (même jour + même heure)
create unique index if not exists idx_events_no_double_booking
  on events(n, h, d)
  where t in ('conf','pend') and is_deleted = false;

-- ─────────────────────────────────────────────
-- 5. REQUÊTES D'AUDIT (à lancer dans SQL Editor)
-- ─────────────────────────────────────────────

-- Vérifie doublons email
-- SELECT email, COUNT(*) FROM profiles WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1;

-- Vérifie orphelins REMC
-- SELECT COUNT(*) as orphelins FROM remc_entries WHERE eleve_id NOT IN (SELECT id FROM profiles);

-- Vérifie double-booking
-- SELECT n, h, d, COUNT(*) FROM events WHERE t IN ('conf','pend') AND (is_deleted IS FALSE OR is_deleted IS NULL) GROUP BY n,h,d HAVING COUNT(*) > 1;

-- Progression REMC par élève
-- SELECT p.nom, COUNT(*) FILTER (WHERE r.lv='v') as validees, COUNT(*) as total
-- FROM profiles p LEFT JOIN remc_entries r ON r.eleve_id = p.id
-- WHERE p.role = 'eleve' GROUP BY p.nom ORDER BY validees DESC;

-- Actions récentes (last 24h)
-- SELECT user_nom, user_role, action, created_at FROM audit_log WHERE created_at >= now() - interval '1 day' ORDER BY created_at DESC;
