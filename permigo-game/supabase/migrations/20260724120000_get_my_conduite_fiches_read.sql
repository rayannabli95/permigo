-- ════════════════════════════════════════════════════════════════
-- 20260724120000 — « Fiches de conduite lues » côté élève (multi-appareils)
--
-- Bug : dans « Révise ta conduite », le compteur de fiches lues vivait
-- UNIQUEMENT en localStorage (clé `rvc_read_v1`) → un élève qui a tout lu
-- voyait « 0/31 » sur un autre appareil, alors que « Mon permis » affiche
-- 31/31. Or chaque lecture est DÉJÀ en base : l'event
-- `revision_conduite_fiche_read` (properties.code = code de fiche, ex. C1a),
-- émis par l'élève à chaque ouverture de fiche.
--
-- ⚠️ events_analytics n'est lisible QUE par le gérant (policy events_select).
-- L'élève n'a AUCUNE policy SELECT sur sa propre activité → il faut une RPC
-- SECURITY DEFINER pour qu'il puisse ré-hydrater son set de fiches lues.
-- Même pattern que get_eleve_engagement (moniteur), mais scopé à SOI :
-- user_id = current_profile_id() (= profiles.id où auth_id = auth.uid()),
-- donc un élève ne peut lire QUE ses propres lectures.
--
-- Le client fusionne le résultat avec son localStorage au montage de la page
-- (union), best-effort : RPC absente / hors-ligne → repli localStorage, zéro
-- régression.
-- ════════════════════════════════════════════════════════════════

create or replace function public.get_my_conduite_fiches_read()
returns text[]
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
           array_agg(distinct properties->>'code'
                     order by properties->>'code'),
           '{}'::text[])
  from events_analytics
  where user_id = current_profile_id()
    and event_name = 'revision_conduite_fiche_read'
    and properties->>'code' is not null;
$$;

comment on function public.get_my_conduite_fiches_read() is
  'Codes de fiches de conduite lues par l''élève courant (events_analytics), pour ré-hydrater le compteur « X/31 » entre appareils. SECURITY DEFINER : scopé à current_profile_id().';

grant execute on function public.get_my_conduite_fiches_read() to authenticated;
