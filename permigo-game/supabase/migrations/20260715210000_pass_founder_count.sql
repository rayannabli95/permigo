-- Compteur PUBLIC des places fondatrices prises (pré-vente Pass Permis).
-- Expose UNIQUEMENT un entier (count des achats payés) — aucune donnée
-- personnelle. Sert la jauge « X places prises sur 20 » de la page #/pass.
create or replace function public.pass_founder_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.pass_purchases where status = 'paid';
$$;

comment on function public.pass_founder_count() is
  'Nombre d''achats Pass Permis payés (jauge publique de la pré-vente #/pass). Expose un entier, rien d''autre.';

revoke all on function public.pass_founder_count() from public;
grant execute on function public.pass_founder_count() to anon, authenticated;
