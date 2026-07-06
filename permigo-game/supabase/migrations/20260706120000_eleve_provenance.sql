-- ════════════════════════════════════════════════════════════════
-- ✅ APPLIQUÉE EN PROD le 2026-07-06 (via MCP apply_migration). RLS OK (4 policies).
-- ════════════════════════════════════════════════════════════════
-- 20260706120000 — eleve_provenance (CRM privé du moniteur)
--
-- Le moniteur note D'OÙ vient chacun de SES élèves (canal d'acquisition) :
-- une pastille = un nom libre (ex. « Le Bon Coin ») + une couleur.
-- C'est de la donnée CRM PRIVÉE au moniteur — l'élève ne la voit JAMAIS
-- (aucune policy SELECT pour le rôle élève).
--
-- 1 provenance par élève (eleve_id = clé primaire). Lien élève↔moniteur =
-- profiles.enseignant_id (schéma prod réel). Aucune donnée sensible.
-- Pattern RLS calqué sur revision_focus (20260622120000).
-- ════════════════════════════════════════════════════════════════

create table if not exists public.eleve_provenance (
  eleve_id    uuid primary key references public.profiles(id) on delete cascade,
  moniteur_id uuid not null references public.profiles(id) on delete cascade,
  label       text not null check (char_length(btrim(label)) between 1 and 40),
  color       text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.eleve_provenance is
  'CRM privé moniteur : canal d''acquisition d''un élève (pastille nom + couleur). Jamais exposé à l''élève.';

create index if not exists eleve_provenance_moniteur_idx
  on public.eleve_provenance (moniteur_id);

alter table public.eleve_provenance enable row level security;

-- ── Moniteur : lit la provenance de SES élèves (attitrés) ──
create policy "moniteur lit la provenance de ses eleves"
on public.eleve_provenance for select
to authenticated
using (
  (select public.get_my_role()) = 'enseignant'
  and exists (
    select 1 from public.profiles e
    where e.id = eleve_provenance.eleve_id
      and e.enseignant_id = (select public.current_profile_id())
  )
);

-- ── Moniteur : définit la provenance d'un de SES élèves ──
create policy "moniteur cree une provenance pour son eleve"
on public.eleve_provenance for insert
to authenticated
with check (
  (select public.get_my_role()) = 'enseignant'
  and moniteur_id = (select public.current_profile_id())
  and exists (
    select 1 from public.profiles e
    where e.id = eleve_provenance.eleve_id
      and e.enseignant_id = (select public.current_profile_id())
  )
);

-- ── Moniteur : modifie une provenance qu'il a posée ──
create policy "moniteur modifie sa provenance"
on public.eleve_provenance for update
to authenticated
using (moniteur_id = (select public.current_profile_id()))
with check (moniteur_id = (select public.current_profile_id()));

-- ── Moniteur : retire une provenance qu'il a posée ──
create policy "moniteur supprime sa provenance"
on public.eleve_provenance for delete
to authenticated
using (moniteur_id = (select public.current_profile_id()));

revoke all on public.eleve_provenance from anon;
grant select, insert, update, delete on public.eleve_provenance to authenticated;
