-- ═══════════════════════════════════════════════════════════════
-- Migration 0005 — User Preferences
-- Préférences notifications + confidentialité + DND
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notif_push      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_email     boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_ranking boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dnd_start       time    DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS dnd_end         time    DEFAULT '07:00';
