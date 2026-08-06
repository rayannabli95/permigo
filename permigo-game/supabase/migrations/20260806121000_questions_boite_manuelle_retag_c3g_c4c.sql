-- ═══════════════════════════════════════════════════════════════
-- Suite du retag « boîte manuelle » du 06/08/2026
-- ═══════════════════════════════════════════════════════════════
-- Le balayage élargi (rapports chiffrés dans les OPTIONS, pas seulement dans
-- l'énoncé) a sorti 2 questions de plus marquées `boite IS NULL` dont les
-- TROIS réponses proposées sont des rapports de boîte manuelle. Un élève en
-- boîte automatique n'avait aucune case juste à cocher.
--
--   C3g · « Ta rue de quartier enchaîne les ralentisseurs. Tu les passes
--          comment ? »        → En 2e en douceur / En 3e sur l'élan / En 1re
--   C4c · « Belle ligne droite dégagée. En éco-conduite tu fais quoi ? »
--                             → Tu montes en 5e ou 6e / Tu restes en 3e /
--                               Tu accélères par à-coups
--
-- Vérifiées et LAISSÉES communes (les réponses justes sont vraies dans les
-- deux boîtes) :
--   C1e « dans une descente la voiture accélère » → « tu gardes la boîte
--        engagée et freines progressivement » (D est un rapport engagé) ;
--   C1f « passer au point mort en descente » → « tu gardes la boîte engagée
--        pour conserver le frein moteur » ;
--   C1f « la commande de boîte résiste » → formulée en « commande » et
--        « position », valable P/R/N/D comme levier ;
--   les questions sur le FREIN MOTEUR (C1e, C4c) : il existe aussi en auto.
--
-- Réserve restante pour un élève en boîte automatique, certification = 5
-- questions (`NB_QUESTIONS` dans src/pages/eleve/valider-seul.js) :
--   C3g : 13 communes
--   C4c :  4 communes + 3 auto = 7
--
-- Idempotent : on cible des id précis et on ne touche que les lignes encore
-- marquées comme communes.
-- ═══════════════════════════════════════════════════════════════

update public.questions_competence
   set boite = 'manuelle'
 where boite is null
   and id in (
     '53410035-94a1-4fb9-bbf5-1efebf5d5eca',  -- C3g · les ralentisseurs
     '6cb0480a-8fa2-464f-ac52-14826a3c3938'   -- C4c · la ligne droite dégagée
   );
