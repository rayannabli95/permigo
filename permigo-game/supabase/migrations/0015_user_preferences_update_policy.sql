-- 0015 — Policy UPDATE manquante sur user_preferences
--
-- Contexte : user_preferences avait des policies RLS pour INSERT et SELECT,
-- mais PAS pour UPDATE. Le client fait un upsert
-- (INSERT ... ON CONFLICT (user_id) DO UPDATE). Dès qu'une ligne existe déjà
-- pour l'utilisateur, l'upsert devient un UPDATE → bloqué par RLS → échec
-- silencieux. Conséquence : les préférences (cosmétiques équipés, etc.) ne se
-- sauvegardaient jamais en base après la première écriture.
--
-- Fix : ajouter la policy UPDATE, strictement limitée à la propre ligne de
-- l'utilisateur (même condition que les policies INSERT/SELECT existantes).
-- Appliqué en prod le 2026-05-25.

create policy "user updates own prefs"
on public.user_preferences
for update
using (
  user_id in (
    select profiles.id from profiles
    where profiles.auth_id = (select auth.uid())
  )
)
with check (
  user_id in (
    select profiles.id from profiles
    where profiles.auth_id = (select auth.uid())
  )
);
