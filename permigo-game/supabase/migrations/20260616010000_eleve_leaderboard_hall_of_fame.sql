-- ═══════════════════════════════════════════════════════════════
-- Hall of Fame élève : les élèves ayant OBTENU le permis (examens.statut
-- = 'recu') sortent du classement actif et entrent dans un « Hall of Fame ».
--
-- 1. get_eleve_leaderboard : on exclut les lauréats du classement.
-- 2. get_hall_of_fame (NOUVEAU) : renvoie les lauréats avec leur PRÉNOM réel
--    (celui du formulaire) — pas de pseudo/username, pas de tag.
--
-- ⚠️ Décision produit (validée par Rayan) : le PRÉNOM des lauréats est exposé
-- aux autres élèves (scope école). C'est célébratoire, prénom seul. Si un jour
-- on veut l'opt-out, ajouter une colonne profiles.hof_optout.
-- ═══════════════════════════════════════════════════════════════

-- 1. Classement sans les lauréats ────────────────────────────────
create or replace function public.get_eleve_leaderboard(
  p_scope text default 'ecole', p_limit integer default 50
)
returns table(rang integer, display_name text, score integer, is_me boolean, avatar text)
language sql stable security definer set search_path to 'public'
as $function$
  with me as (
    select current_profile_id() as uid,
           (select auto_ecole_id from profiles where id = current_profile_id()) as aid
  ),
  base as (
    select
      p.id,
      coalesce(nullif(p.username, ''),
               'Apprenti #' || substring(replace(p.id::text, '-', ''), 1, 4)) as display_name,
      p.avatar_url as avatar,
      count(v.id) filter (where v.statut = 'acquis')::int as score
    from profiles p
    left join validations v on v.eleve_id = p.id
    where p.role = 'eleve'
      -- 🎓 on retire les lauréats (permis obtenu) du classement actif
      and not exists (
        select 1 from examens e where e.eleve_id = p.id and e.statut = 'recu'
      )
      and (
        (p_scope = 'ecole'    and p.auto_ecole_id = (select aid from me))
        or (p_scope = 'national')
      )
    group by p.id, p.username, p.avatar_url
  ),
  ranked as (
    select row_number() over (order by score desc, id) as rang, * from base
  )
  select rang::int, display_name, score, (id = (select uid from me)) as is_me, avatar
  from ranked
  where rang <= p_limit
     or id = (select uid from me)
  order by rang;
$function$;

-- 2. Hall of Fame (lauréats, prénom réel) ────────────────────────
create or replace function public.get_hall_of_fame(
  p_scope text default 'ecole', p_limit integer default 100
)
returns table(prenom text, avatar text, recu_at timestamptz, is_me boolean)
language sql stable security definer set search_path to 'public'
as $function$
  with me as (
    select current_profile_id() as uid,
           (select auto_ecole_id from profiles where id = current_profile_id()) as aid
  )
  select
    coalesce(nullif(p.prenom, ''), 'Lauréat') as prenom,
    p.avatar_url as avatar,
    max(e.created_at) as recu_at,
    (p.id = (select uid from me)) as is_me
  from profiles p
  join examens e on e.eleve_id = p.id and e.statut = 'recu'
  where p.role = 'eleve'
    and (
      (p_scope = 'ecole'    and p.auto_ecole_id = (select aid from me))
      or (p_scope = 'national')
    )
  group by p.id, p.prenom, p.avatar_url
  order by recu_at desc nulls last
  limit p_limit;
$function$;

grant execute on function public.get_hall_of_fame(text, integer) to authenticated;
