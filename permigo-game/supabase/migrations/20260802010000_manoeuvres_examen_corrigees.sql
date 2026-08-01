-- ═══════════════════════════════════════════════════════════════
-- Une question de certification annonçait une seule manœuvre le jour J.
--
-- Repérée par Codex pendant l'écriture du lot C1d à C1i, et signalée au lieu
-- d'être corrigée en silence, comme le brief le demande. Vérifiée : l'article
-- 25 de l'arrêté du 22 décembre 2017 prévoit DEUX manœuvres particulières,
-- un freinage pour s'arrêter avec précision et une manœuvre en marche arrière
-- prise parmi six familles.
-- https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000029209267
--
-- Une question fausse dans un quiz qui CERTIFIE est pire que six questions
-- répétitives : l'élève repart avec une idée fausse de son examen, et l'app
-- la lui a confirmée.
--
-- Appliquée en production le 02/08/2026, dans les trois langues.
-- ═══════════════════════════════════════════════════════════════

update public.questions_competence set
  question = $pg$Le jour de l'examen, quelles manœuvres l'inspecteur t'impose-t-il ?$pg$,
  options = $pg$["Une seule, parmi six familles", "Deux : un freinage pour s'arrêter avec précision, et une marche arrière", "Aucune si tu conduis bien"]$pg$::jsonb,
  correct_index = 1,
  explanation = $pg$Deux exercices, et tu n'en choisis aucun. Un freinage pour t'arrêter pile sur un repère, et une manœuvre en marche arrière tirée parmi six familles.$pg$
where id = '7da921c6-10e4-4dc1-a224-f4d42d22ef96';

update public.question_translations set
  question = $pg$On test day, which manoeuvres does the examiner set you?$pg$,
  options = $pg$["Just one, from six families", "Two: a braking exercise to stop precisely, and a reversing manoeuvre", "None if you drive well"]$pg$::jsonb,
  explanation = $pg$Two exercises, and you choose neither. A braking exercise to stop exactly on a marker, and one reversing manoeuvre drawn from six families.$pg$
where question_id = '7da921c6-10e4-4dc1-a224-f4d42d22ef96' and lang = 'en';

update public.question_translations set
  question = $pg$يوم الامتحان، ما المناورات التي يفرضها عليك الممتحن؟$pg$,
  options = $pg$["واحدة فقط من ست عائلات", "اثنتان: فرملة للتوقّف بدقة، ومناورة بالرجوع إلى الخلف", "لا شيء إذا كنت تقود جيدًا"]$pg$::jsonb,
  explanation = $pg$تمرينان، ولا تختار أيًا منهما. فرملة للتوقّف تمامًا عند علامة، ومناورة بالرجوع تُسحب من ست عائلات.$pg$
where question_id = '7da921c6-10e4-4dc1-a224-f4d42d22ef96' and lang = 'ar';
