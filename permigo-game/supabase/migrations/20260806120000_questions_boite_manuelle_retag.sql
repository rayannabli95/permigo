-- ═══════════════════════════════════════════════════════════════
-- Certification : 4 questions « communes » étaient en fait 100 % boîte manuelle
-- ═══════════════════════════════════════════════════════════════
-- Constat du 06/08/2026 (Rayan) : les fiches parlaient de changer de vitesse
-- à des élèves en boîte automatique. En remontant le fil jusqu'à la banque qui
-- CERTIFIE, on trouve 4 questions marquées `boite IS NULL` (donc servies à
-- TOUT LE MONDE par quiz-engine.js) dont aucune réponse n'est vraie en boîte
-- automatique. Un élève en auto tombait dessus pendant sa certification sans
-- avoir la moindre bonne réponse à cocher.
--
-- Même famille que l'audit du 01/08/2026 : ce sont les restes qu'il avait
-- laissés. Le mécanisme `boite` existe et fonctionne, il manquait juste le bon
-- marquage sur ces 4 lignes.
--
-- Ce qui est retiré du tronc commun :
--   C1d · « Quand débrayes-tu ? »                    (pas de pédale d'embrayage)
--   C1d · « Talon décollé … »  → point de patinage    (pas de point de patinage)
--   C1f · « Tu rétrogrades avant ou pendant ? »       (pas de rétrogradage manuel)
--   C1f · « À un stop, en quelle vitesse ? »          (1ère / 2e / point mort)
--
-- Ce qui RESTE commun volontairement (vérifié une par une) :
--   les questions sur le FREIN MOTEUR (C1e ×3, C4c ×1) : le frein moteur
--   existe aussi en boîte automatique ;
--   C1f « descendre au point mort » : la bonne réponse dit « boîte engagée ou
--   position de conduite », rédigée pour les deux ;
--   C1f « la commande de boîte résiste » : formulée en « commande » et
--   « position », valable P/R/N/D comme levier.
--
-- Réserve après bascule, pour un élève en boîte automatique :
--   C1d : 6 communes + 6 auto = 12 questions
--   C1f : 6 communes + 6 auto = 12 questions
-- Personne ne se retrouve à court.
--
-- Idempotent : on cible des id précis et on ne touche que les lignes encore
-- marquées comme communes.
-- ═══════════════════════════════════════════════════════════════

update public.questions_competence
   set boite = 'manuelle'
 where boite is null
   and id in (
     '9d5e71c1-d7ba-4c05-8614-92099dfe4698',  -- C1d · quand débrayes-tu
     '0abc3d82-e6ea-451d-b997-abf31b52848f',  -- C1d · talon décollé / point de patinage
     '42d52410-6d0e-4e77-8554-b1c821d2aa1a',  -- C1f · rétrograder avant ou pendant
     '0e674916-fa63-43dc-847e-1a7991b94b3e'   -- C1f · à un stop, en quelle vitesse
   );
