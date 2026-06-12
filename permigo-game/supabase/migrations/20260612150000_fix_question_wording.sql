-- ═══════════════════════════════════════════════════════════════
-- Audit wording quizz 2026-06-12 (workstream C, PLAN_QUIZ_REDESIGN).
-- 2 corrections de FORME uniquement — options et correct_index
-- strictement inchangés.
--
-- 1. C1d : « À quelle distance tu passes des pleins phares aux
--    croisement en croisant une voiture ? » — grammaire cassée.
-- 2. C1e : « T'accélères et tu sens un crissement ou ça patine.
--    Ça veut dire quoi ? » — la question contenait sa propre
--    réponse (l'option correcte la répète mot pour mot).
-- ═══════════════════════════════════════════════════════════════

UPDATE public.questions_competence
SET question = 'Tu croises une voiture la nuit, t''es en pleins phares. Tu repasses en codes à quelle distance ?'
WHERE id = '86506514-8cd7-4911-87b8-ec8e74895149';

UPDATE public.questions_competence
SET question = 'À quoi tu reconnais que t''accélères trop fort ?'
WHERE id = '6a673dcf-18c8-443f-8230-eb61ebe1af8a';
