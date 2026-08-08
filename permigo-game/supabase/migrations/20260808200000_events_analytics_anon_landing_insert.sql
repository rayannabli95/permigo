-- ═══════════════════════════════════════════════════════════════
-- Réactive la mesure de la page de vente pour les visiteurs anonymes
-- ═══════════════════════════════════════════════════════════════
-- Contexte : la landing (pass-simple.js) émet déjà landing.view / landing.* mais
-- l'INSERT sur events_analytics était réservé au rôle `authenticated`. Un clic de
-- pub arrive ANONYME → 0 event de la landing n'a jamais atteint la base.
--
-- On ouvre un chemin d'écriture anonyme volontairement étroit :
--   • user_id NULL          → impossible d'usurper un vrai compte
--   • auto_ecole_id NULL     → impossible de polluer les stats d'une auto-école
--   • event_name préfixé     → uniquement les events publics de la landing
--   • role = 'guest'         → cohérent avec ce qu'envoie le client
--
-- La lecture reste fermée (policy events_select : gérant/owner uniquement).
-- Un bot pourrait insérer de faux events landing ; c'est le compromis assumé de
-- la voie RLS directe (vs edge function). Périmètre minimal pour limiter la casse.

-- La policy est nécessaire mais PAS suffisante : le rôle `anon` n'avait aucun
-- privilège d'écriture sur la table (« permission denied for table »). On accorde
-- l'INSERT au niveau table ; c'est la policy ci-dessous qui borne ce qui passe.
grant insert on public.events_analytics to anon;

create policy "events_insert_anon_public"
on public.events_analytics
for insert
to anon
with check (
  user_id is null
  and auto_ecole_id is null
  and coalesce(role, 'guest') = 'guest'
  and (event_name like 'simple.%' or event_name like 'landing.%')
);
