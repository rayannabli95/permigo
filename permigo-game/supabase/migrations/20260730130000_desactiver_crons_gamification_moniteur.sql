-- ════════════════════════════════════════════════════════════════
-- 20260730130000 — Désactivation des crons de la gamification moniteur
--
-- ✅ DÉJÀ APPLIQUÉ EN PROD le 30/07/2026 (décision Rayan « gère »). Ce fichier
--    existe pour que le repo dise la vérité sur l'état de la base.
--
-- Suite du retrait de la gamification moniteur (cf. 20260730120000). En listant
-- cron.job on a trouvé QUATRE jobs qui alimentaient ou notifiaient des écrans
-- qui n'existent plus. Preuves relevées dans `notifications` avant de couper :
--
--   1. friday-digest-moniteur      (vend. 17 h) → « 🎉 Ta semaine PermiGo —
--      0h · 1 validation · 0 élève. Bon week-end Elyne ! » Le dernier envoi du
--      24/07 disait DÉJÀ « 1 validation ». Compte les validations → toujours 0.
--   2. monthly-recap-moniteur     (1er du mois, 8 h) → « Xh · N validations ·
--      N élèves ». Même problème.
--   3. refresh-moniteur-ranking-mv (toutes les 4 h) → rafraîchissait la vue
--      matérialisée du classement moniteur. Plus aucun écran ne la lit.
--   4. refresh-streak-pro-daily    (0 h 05) → recalculait profiles.streak_pro_days
--      (une série de VALIDATIONS). Plus aucun usage côté front (vérifié : zéro
--      occurrence de streak_pro_days dans src/).
--
-- MÉTHODE : `active := false`, PAS `cron.unschedule()`. La commande reste
-- stockée dans cron.job → réactivable en une ligne, sans avoir à retrouver
-- l'URL et les en-têtes du http_post.
--
-- CE QU'ON NE TOUCHE PAS (vérifié encore actif après coup) :
--   · check-students-at-risk-weekly → « ⚠️ Élève à relancer : Lakika n'a pas
--     pratiqué depuis 54 jours ». C'est de l'OBSERVATION, et le moniteur peut
--     encore agir dessus via la relance (conservée). Cœur du pivot.
--   · send-emotional-nudge-hourly / weekly-recap-eleve-sunday → côté élève.
--   · ⚠️ gerant-weekly-digest (lun. 7 h) → « 📊 Ta semaine à l'école — 0
--     validations · 0h conduite · 50 élèves à relancer ». Il compte lui aussi
--     les validations, donc il affichera 0 à vie. LAISSÉ ACTIF volontairement :
--     c'est le rôle `gerant`, hors-cible mais qu'on ne démonte pas au passage
--     (cf. CLAUDE.md). À trancher dans un lot « gérant » dédié.
-- ════════════════════════════════════════════════════════════════

do $$
declare
  v_names text[] := array[
    'monthly-recap-moniteur',
    'friday-digest-moniteur',
    'refresh-moniteur-ranking-mv',
    'refresh-streak-pro-daily'
  ];
  r record;
begin
  for r in select jobid, jobname from cron.job where jobname = any(v_names) loop
    perform cron.alter_job(r.jobid, active := false);
    raise notice '[cron] % désactivé', r.jobname;
  end loop;
end $$;
