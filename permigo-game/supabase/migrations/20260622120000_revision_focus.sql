-- ════════════════════════════════════════════════════════════════
-- À RELIRE + APPLIQUER MANUELLEMENT (Rayan). NE PAS appliquer en prod
-- automatiquement — cette migration n'est pas encore déployée.
-- ════════════════════════════════════════════════════════════════
-- 20260622120000 — revision_focus (couche 2 « Avant / Après ta leçon »)
--
-- Le moniteur cible UNE compétence REMC à réviser pour un de SES élèves
-- (après/avant une leçon). L'élève la voit dans #/revision-conduite, la
-- révise (3 questions), puis la marque « révisée » → le moniteur a le retour.
--
-- Lien élève↔moniteur = profiles.enseignant_attitre_id (cf. join_code).
-- Aucune donnée sensible : juste un code compétence (ex. "C2f") + note courte.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.revision_focus (
  id              uuid primary key default gen_random_uuid(),
  eleve_id        uuid not null references public.profiles(id) on delete cascade,
  moniteur_id     uuid not null references public.profiles(id) on delete cascade,
  competence_code text not null,
  note            text,
  created_at      timestamptz not null default now(),
  done_at         timestamptz
);

comment on table public.revision_focus is
  'Ciblage de révision conduite : un moniteur désigne une compétence REMC à réviser pour un de ses élèves (couche « Avant/Après ta leçon »).';
comment on column public.revision_focus.competence_code is 'Code REMC ciblé, ex. C2f.';
comment on column public.revision_focus.done_at is 'Renseigné par l''élève via mark_revision_focus_done quand il a révisé.';

-- Index sur les colonnes RLS + tri par date
create index if not exists revision_focus_eleve_idx
  on public.revision_focus (eleve_id, created_at desc);
create index if not exists revision_focus_moniteur_idx
  on public.revision_focus (moniteur_id, created_at desc);

alter table public.revision_focus enable row level security;

-- ── Moniteur : crée un ciblage POUR un de SES élèves uniquement ──
create policy "moniteur cree un ciblage pour son eleve"
on public.revision_focus for insert
to authenticated
with check (
  (select public.get_my_role()) = 'enseignant'
  and moniteur_id = (select public.current_profile_id())
  and exists (
    select 1 from public.profiles e
    where e.id = revision_focus.eleve_id
      and e.enseignant_attitre_id = (select public.current_profile_id())
  )
);

-- ── Moniteur : lit ses propres ciblages ──
create policy "moniteur lit ses ciblages"
on public.revision_focus for select
to authenticated
using (moniteur_id = (select public.current_profile_id()));

-- ── Moniteur : supprime ses propres ciblages ──
create policy "moniteur supprime ses ciblages"
on public.revision_focus for delete
to authenticated
using (moniteur_id = (select public.current_profile_id()));

-- ── Élève : lit ses propres ciblages ──
create policy "eleve lit ses ciblages"
on public.revision_focus for select
to authenticated
using (eleve_id = (select public.current_profile_id()));

-- Grants table (defense-in-depth : pas d'UPDATE direct → done via RPC).
revoke all on public.revision_focus from anon;
grant select, insert, delete on public.revision_focus to authenticated;
-- Pas d'UPDATE direct : le « révisé » passe par la RPC SECURITY DEFINER ci-dessous.
revoke update on public.revision_focus from authenticated;

-- ── RPC : l'élève marque un ciblage « révisé » (uniquement done_at, sur SA ligne) ──
create or replace function public.mark_revision_focus_done(p_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  update public.revision_focus
     set done_at = now()
   where id = p_id
     and eleve_id = current_profile_id()
     and done_at is null;
end;
$function$;

revoke execute on function public.mark_revision_focus_done(uuid) from public, anon;
grant  execute on function public.mark_revision_focus_done(uuid) to authenticated;
