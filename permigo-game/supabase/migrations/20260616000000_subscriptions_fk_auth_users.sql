-- ═══════════════════════════════════════════════════════════════
-- Fix FK subscriptions.user_id : pointer vers auth.users(id), pas profiles(id).
--
-- Dans ce projet, profiles.id ≠ auth.uid() (profiles a son propre id + un
-- auth_id). Or subscriptions.user_id stocke l'auth.uid() (cohérent avec la RLS
-- `auth.uid() = user_id` et avec ce que renvoie auth.getUser() dans
-- l'edge function stripe-checkout). La FK initiale vers profiles(id) faisait
-- donc échouer l'upsert du webhook (23503 : key not present in profiles).
--
-- Appliqué en prod le 2026-06-15 via SQL après debug du 1er paiement test.
-- ═══════════════════════════════════════════════════════════════

alter table public.subscriptions
  drop constraint if exists subscriptions_user_id_fkey;

alter table public.subscriptions
  add constraint subscriptions_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;
