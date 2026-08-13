-- ═══════════════════════════════════════════════════════════════
-- L'avis des élèves sur un jeu en bêta.
--
-- Décision Rayan 12/08/2026 : « Au volant » (route #/avance) sort dans le hub
-- Réviser marqué BÊTA, et l'écran de fin demande une note sur 5 + un mot
-- libre. On ne devine plus si le jeu plaît, on le demande à la fin de la
-- partie, au seul moment où l'élève a un avis.
--
-- Générique EXPRÈS (colonne `jeu`) : le prochain prototype réutilise la même
-- table plutôt que d'en créer une par jeu.
--
-- Lecture : owner uniquement (analyse produit). Écriture : tout le monde —
-- #/avance est une route PUBLIQUE (on tend le téléphone à un élève dans un
-- couloir d'auto-école, sans compte). Bornée par des contraintes de taille.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.jeu_avis (
  id         uuid primary key default gen_random_uuid(),
  -- Rempli si la personne était connectée. Un avis anonyme reste un avis.
  -- 🔴 `profiles`, PAS `auth.users` : `CUR_USER.id` de l'app est l'id du
  -- PROFIL (`profiles.auth_id` porte l'id d'authentification). Pointer vers
  -- auth.users donne un « Key is not present in table users » à chaque envoi
  -- — c'est la convention de `quiz_attempts` et `events_analytics`.
  user_id    uuid references public.profiles (id) on delete set null,
  jeu        text not null,
  note       smallint not null,
  texte      text,
  -- Le contexte de la partie (score, dangers repérés, numéro de partie) :
  -- une note de 2 après une partie à 0 danger repéré ne dit pas la même
  -- chose qu'une note de 2 après un sans-faute.
  contexte   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint jeu_avis_note_range check (note between 1 and 5),
  constraint jeu_avis_jeu_len    check (char_length(jeu) between 1 and 60),
  constraint jeu_avis_texte_len  check (char_length(coalesce(texte, '')) <= 1000)
);

comment on table public.jeu_avis is
  'Note sur 5 + mot libre laissés par les élèves à la fin d''un jeu en bêta. Lecture owner only.';

create index if not exists jeu_avis_jeu_date_idx
  on public.jeu_avis (jeu, created_at desc);

alter table public.jeu_avis enable row level security;

-- Tout le monde peut déposer un avis (la route du jeu est publique).
create policy "anyone submits jeu_avis"
  on public.jeu_avis
  for insert
  to anon, authenticated
  with check (true);

-- Seul l'owner lit.
create policy "owner reads jeu_avis"
  on public.jeu_avis
  for select
  to authenticated
  using (public.is_owner());

-- ⚠️ UNE POLICY NE SUFFIT PAS : il faut AUSSI le GRANT. Les privilèges par
-- défaut du schéma public donnent tout à `authenticated` mais seulement le
-- SELECT à `anon` — sans cette ligne, l'élève pas connecté se prend un
-- « permission denied » alors que la policy dit oui.
grant insert on public.jeu_avis to anon;
revoke update, delete on public.jeu_avis from anon, authenticated;

-- PostgREST garde son propre cache du schéma : sans ce réveil, la table
-- existe en base et l'API répond « table introuvable » pendant des minutes.
notify pgrst, 'reload schema';
