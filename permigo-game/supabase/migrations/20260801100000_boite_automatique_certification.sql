-- ═══════════════════════════════════════════════════════════════
-- Boîte automatique : le quiz qui CERTIFIE doit parler la voiture
-- que l'élève conduit vraiment.
--
-- Constat (audit du 01/08/2026) : l'app ne demandait nulle part quelle
-- boîte l'élève conduit, et le quiz de certification était écrit pour la
-- boîte manuelle. Sur C1d « Démarrer et s'arrêter », les 6 questions sur 6
-- portaient sur l'embrayage. C1f « Utiliser la boîte de vitesses » était
-- manuelle de bout en bout. Et une question de C1a donnait une réponse
-- FAUSSE en automatique (« le frein au milieu » : en automatique il y a
-- deux pédales et le frein est à gauche).
--
-- 1. profiles.transmission  : la boîte de l'élève ('manuelle' | 'auto').
--    NULL = pas encore renseigné → on ne filtre rien, comme avant.
-- 2. questions_competence.boite : à qui la question s'adresse.
--    NULL = les deux boîtes. C'est le cas de la grande majorité.
-- 3. 23 questions écrites pour la boîte automatique (FR + EN + AR), pour
--    qu'aucune compétence ne tombe sous les 6 questions disponibles.
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists transmission text;
do $$ begin
  alter table public.profiles
    add constraint profiles_transmission_chk
    check (transmission is null or transmission in ('manuelle','auto'));
exception when duplicate_object then null; end $$;
comment on column public.profiles.transmission is
  'Boîte de vitesses de l''élève. NULL = pas encore demandé.';

alter table public.questions_competence
  add column if not exists boite text;
do $$ begin
  alter table public.questions_competence
    add constraint questions_competence_boite_chk
    check (boite is null or boite in ('manuelle','auto'));
exception when duplicate_object then null; end $$;
comment on column public.questions_competence.boite is
  'À qui la question s''adresse. NULL = les deux boîtes.';

-- ── Les questions qui n'ont de sens qu'en boîte manuelle ──
update public.questions_competence set boite = 'manuelle'
where id in (
  '20b4f031-5bcc-4577-895f-b2c38f411e79',
  '414ccdd2-cda0-40a6-83b5-a7295b434ebe',
  '37c2ddcf-16a7-4229-bfdf-f473df4b1082',
  'b37584bb-4756-47e1-aadb-bf8f5172844f',
  '6af08c93-cd1f-4d2f-92d7-b2b2bef3ace3',
  'a14abfc7-892d-4018-b596-ba8008e4e80e',
  '99cec852-5f10-482b-985f-b58e84d882f8',
  '7f1ee6c1-42ee-4f6b-ac4b-7fada25ae813',
  'db5b1d25-e64e-46b1-8ffc-d5a2b47873ae',
  '38f5ecef-cb77-43b9-b9f4-d9f903b68b1a',
  '4e559ab3-2d43-42dc-b3f4-037b13defb28',
  '0fd1be36-2040-4a44-a08c-c9f47019d9e6',
  '041a6e54-a2d0-446e-ab1f-c30b58ed32d5',
  '829c3414-19a4-4951-a72f-392ad5392d93',
  '5ec109b0-56ef-43a1-b39c-f77a0463486a',
  '0262226a-8337-4d66-b1b6-f03a8bd062df',
  '29731ec0-bcbd-482e-b5cd-06002242d165',
  'dbcccb9c-eb25-453e-80ac-7902fb89edd0',
  '929a7226-aac8-4114-bbe6-69c725c50dbf',
  '5ba0b214-1db9-46e3-b2ca-68c424293662',
  '53754269-69a0-42ef-b3a2-cb897b23cf79',
  '790e45bf-5409-4523-b902-a246f993645b',
  '5e2d49d6-0ea0-4924-8c30-2aad92f8d96b'
);

-- ── Une explication qui disait faux ──
-- « Une erreur de boîte est éliminatoire » : c'est faux, et ça fabrique
-- une peur inutile dans un écran qui certifie.
update public.questions_competence
set explanation = $pg$C'est la position de la main qui compte, pas la force. Une main crispée cherche le rapport, et pendant ce temps elle ne tient plus le volant.$pg$
where id = '4e559ab3-2d43-42dc-b3f4-037b13defb28';

update public.question_translations
set explanation = $pg$It's the hand position that matters, not the force. A tense hand hunts for the gear, and while it does, it isn't holding the wheel.$pg$
where question_id = '4e559ab3-2d43-42dc-b3f4-037b13defb28' and lang = 'en';

update public.question_translations
set explanation = $pg$وضع اليد هو المهمّ، لا القوّة. اليد المتشنّجة تبحث عن السرعة، وفي تلك الأثناء لا تُمسك المقود.$pg$
where question_id = '4e559ab3-2d43-42dc-b3f4-037b13defb28' and lang = 'ar';

-- ── Les questions écrites pour la boîte automatique ──
insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000001', 'C1a', $pg$Dans une voiture automatique, combien de pédales sous tes pieds ?$pg$, $pg$["Deux : le frein à gauche, l'accélérateur à droite", "Trois, comme partout", "Une seule"]$pg$::jsonb, 0, $pg$Deux pédales, et un seul pied pour les deux : le droit. Le gauche reste au repos sur le repose-pied.$pg$, 1, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000001', 'en', $pg$In an automatic car, how many pedals are under your feet?$pg$, $pg$["Two: brake on the left, accelerator on the right", "Three, like everywhere else", "Just one"]$pg$::jsonb, $pg$Two pedals, and one foot for both: the right one. The left foot stays resting on the footrest.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000001', 'ar', $pg$في سيارة أوتوماتيكية، كم دواسة تحت قدميك؟$pg$, $pg$["اثنتان: الفرامل على اليسار ودواسة الوقود على اليمين", "ثلاث، مثل كل السيارات", "واحدة فقط"]$pg$::jsonb, $pg$دواستان، وقدم واحدة لكلتيهما: اليمنى. أما القدم اليسرى فتبقى مرتاحة على مسند القدم.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000002', 'C1b', $pg$Tu règles la distance de ton siège en boîte automatique. Ton repère ?$pg$, $pg$["Enfoncer le frein à fond sans tendre la jambe", "Garder la jambe gauche pliée sur l'embrayage", "Avoir les bras tendus sur le volant"]$pg$::jsonb, 0, $pg$Pas d'embrayage, donc le repère devient le frein. Tu dois pouvoir l'écraser à fond sans tendre la jambe et sans décoller le dos du dossier.$pg$, 1, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000002', 'en', $pg$You're setting your seat distance in an automatic. What's your reference point?$pg$, $pg$["Pressing the brake all the way down without straightening your leg", "Keeping your left leg bent on the clutch", "Having your arms straight on the wheel"]$pg$::jsonb, $pg$No clutch, so the brake becomes your reference. You must be able to press it fully without straightening your leg or lifting your back off the seat.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000002', 'ar', $pg$تضبط مسافة مقعدك في سيارة أوتوماتيكية. ما هي علامتك؟$pg$, $pg$["أن تضغط الفرامل حتى النهاية دون مدّ ساقك", "أن تبقي ساقك اليسرى مثنية على القابض", "أن تكون ذراعاك ممدودتين على المقود"]$pg$::jsonb, $pg$لا يوجد قابض، لذا تصبح الفرامل هي علامتك. يجب أن تستطيع ضغطها حتى النهاية دون مدّ ساقك ودون رفع ظهرك عن المسند.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000011', 'C1d', $pg$Le sélecteur est sur P. Avant de lancer le moteur, ton pied fait quoi ?$pg$, $pg$["Il appuie sur le frein", "Il appuie sur l'accélérateur", "Rien du tout"]$pg$::jsonb, 0, $pg$Sur une automatique, le moteur ne se lance que le pied sur le frein. C'est la sécurité qui empêche la voiture de partir toute seule.$pg$, 1, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000011', 'en', $pg$The selector is on P. Before starting the engine, what does your foot do?$pg$, $pg$["It presses the brake", "It presses the accelerator", "Nothing at all"]$pg$::jsonb, $pg$In an automatic, the engine only starts with your foot on the brake. That safety stops the car from moving off on its own.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000011', 'ar', $pg$المؤشّر على وضع P. قبل تشغيل المحرك، ماذا تفعل قدمك؟$pg$, $pg$["تضغط على الفرامل", "تضغط على دواسة الوقود", "لا شيء إطلاقًا"]$pg$::jsonb, $pg$في السيارة الأوتوماتيكية، لا يعمل المحرك إلا وقدمك على الفرامل. هذه حماية تمنع السيارة من التحرّك وحدها.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000012', 'C1d', $pg$Tu passes le sélecteur de P à D. Ton pied reste où pendant ce temps ?$pg$, $pg$["Sur le frein", "Sur l'accélérateur", "En l'air, prêt à partir"]$pg$::jsonb, 0, $pg$Pied sur le frein tant que le sélecteur bouge. Dès qu'il est sur D, la voiture avance d'elle-même si tu relâches.$pg$, 1, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000012', 'en', $pg$You move the selector from P to D. Where does your foot stay meanwhile?$pg$, $pg$["On the brake", "On the accelerator", "In the air, ready to go"]$pg$::jsonb, $pg$Foot on the brake while the selector moves. As soon as it's in D, the car creeps forward on its own if you let go.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000012', 'ar', $pg$تنقل المؤشّر من P إلى D. أين تبقى قدمك خلال ذلك؟$pg$, $pg$["على الفرامل", "على دواسة الوقود", "في الهواء، جاهزة للانطلاق"]$pg$::jsonb, $pg$قدمك على الفرامل ما دام المؤشّر يتحرّك. وبمجرد وصوله إلى D، تتقدّم السيارة وحدها إذا رفعت قدمك.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000013', 'C1d', $pg$Sur D, tu relâches le frein sans toucher l'accélérateur. Il se passe quoi ?$pg$, $pg$["La voiture avance doucement toute seule", "Rien, il faut accélérer", "Le moteur cale"]$pg$::jsonb, 0, $pg$Ça s'appelle le fluage. La voiture avance au ralenti sans accélérateur, et ça suffit souvent pour manœuvrer ou avancer dans un bouchon.$pg$, 2, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000013', 'en', $pg$In D, you release the brake without touching the accelerator. What happens?$pg$, $pg$["The car creeps forward on its own", "Nothing, you have to accelerate", "The engine stalls"]$pg$::jsonb, $pg$It's called creep. The car moves at idle with no accelerator, and that's often enough to manoeuvre or crawl in traffic.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000013', 'ar', $pg$على وضع D، ترفع قدمك عن الفرامل دون لمس دواسة الوقود. ماذا يحدث؟$pg$, $pg$["تتقدّم السيارة ببطء من تلقاء نفسها", "لا شيء، عليك أن تضغط دواسة الوقود", "يتوقّف المحرك"]$pg$::jsonb, $pg$يُسمّى هذا الزحف. تتحرّك السيارة على أدنى دوران للمحرك دون دواسة وقود، وغالبًا ما يكفي ذلك للمناورة أو للسير في الزحام.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000014', 'C1d', $pg$Tu vas rester arrêté un moment, à un passage à niveau. Le bon geste ?$pg$, $pg$["Sélecteur sur N et frein à main", "Sélecteur sur P", "Rester sur D, pied sur le frein"]$pg$::jsonb, 0, $pg$Sur un arrêt qui dure : N et frein à main. Ta jambe se repose et la voiture ne peut pas fluer. On garde le P pour se garer.$pg$, 2, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000014', 'en', $pg$You'll be stopped for a while at a level crossing. What's the right move?$pg$, $pg$["Selector on N and handbrake on", "Selector on P", "Stay in D with your foot on the brake"]$pg$::jsonb, $pg$For a long stop: N and the handbrake. Your leg rests and the car can't creep. P is for parking.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000014', 'ar', $pg$ستبقى متوقّفًا مدّة عند مزلقان قطار. ما التصرّف الصحيح؟$pg$, $pg$["المؤشّر على N مع فرامل اليد", "المؤشّر على P", "تبقى على D وقدمك على الفرامل"]$pg$::jsonb, $pg$في التوقّف الطويل: N مع فرامل اليد. ترتاح ساقك ولا تستطيع السيارة الزحف. أما P فهي للركن.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000015', 'C1d', $pg$Tu es garé et tu coupes le moteur. Dans quel ordre ?$pg$, $pg$["Frein à main, puis sélecteur sur P, puis contact coupé", "Sélecteur sur P, puis frein à main", "Contact coupé, puis sélecteur sur P"]$pg$::jsonb, 0, $pg$Frein à main d'abord, P ensuite : la voiture se repose sur son frein et pas sur la petite pièce de la boîte. Elle s'use moins et tu repars sans à-coup.$pg$, 2, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000015', 'en', $pg$You're parked and switching off. In what order?$pg$, $pg$["Handbrake, then selector to P, then engine off", "Selector to P, then handbrake", "Engine off, then selector to P"]$pg$::jsonb, $pg$Handbrake first, then P: the car rests on its brake rather than on the small pawl inside the gearbox. Less wear, and no jolt when you drive off.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000015', 'ar', $pg$أنت مركون وستُطفئ المحرك. بأي ترتيب؟$pg$, $pg$["فرامل اليد، ثم المؤشّر على P، ثم إطفاء المحرك", "المؤشّر على P، ثم فرامل اليد", "إطفاء المحرك، ثم المؤشّر على P"]$pg$::jsonb, $pg$فرامل اليد أولًا ثم P: تستند السيارة على فرامل اليد لا على القطعة الصغيرة داخل علبة السرعة. تآكل أقلّ وانطلاق أنعم في المرة القادمة.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000016', 'C1d', $pg$Il n'y a pas de pédale d'embrayage. Que fait ton pied gauche ?$pg$, $pg$["Il reste au repos, sur le repose-pied à gauche", "Il freine pendant que le droit accélère", "Il appuie sur le frein de secours"]$pg$::jsonb, 0, $pg$Un seul pied travaille, le droit. Deux pieds sur les pédales, c'est le meilleur moyen de freiner et d'accélérer en même temps sans s'en rendre compte.$pg$, 1, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000016', 'en', $pg$There's no clutch pedal. What does your left foot do?$pg$, $pg$["It rests on the footrest to the left", "It brakes while the right one accelerates", "It presses the emergency brake"]$pg$::jsonb, $pg$Only one foot works: the right one. Two feet on the pedals is the surest way to brake and accelerate at the same time without noticing.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000016', 'ar', $pg$لا توجد دواسة قابض. ماذا تفعل قدمك اليسرى؟$pg$, $pg$["تبقى مرتاحة على مسند القدم إلى اليسار", "تضغط الفرامل بينما تضغط اليمنى دواسة الوقود", "تضغط فرامل الطوارئ"]$pg$::jsonb, $pg$قدم واحدة تعمل: اليمنى. ووضع القدمين على الدواستين هو أضمن طريقة للفرملة والتسريع في الوقت نفسه دون أن تنتبه.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000021', 'C1f', $pg$Sur le sélecteur, à quoi sert la position N ?$pg$, $pg$["C'est le point mort : le moteur n'entraîne plus les roues", "C'est la marche arrière", "C'est le mode neige"]$pg$::jsonb, 0, $pg$N, c'est le point mort. Le moteur tourne mais il n'entraîne plus les roues. On y passe pour un arrêt qui dure, jamais en roulant.$pg$, 1, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000021', 'en', $pg$On the selector, what is N for?$pg$, $pg$["It's neutral: the engine no longer drives the wheels", "It's reverse", "It's snow mode"]$pg$::jsonb, $pg$N is neutral. The engine runs but no longer drives the wheels. You use it for a long stop, never while moving.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000021', 'ar', $pg$على المؤشّر، ما فائدة الوضع N؟$pg$, $pg$["إنه الوضع المحايد: لا يدير المحرك العجلات", "إنه الرجوع للخلف", "إنه وضع الثلج"]$pg$::jsonb, $pg$N هو الوضع المحايد. يعمل المحرك لكنه لا يدير العجلات. يُستعمل في التوقّف الطويل، ولا يُستعمل أبدًا أثناء السير.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000022', 'C1f', $pg$Tu roules et le moteur monte dans les tours. Tu fais quoi ?$pg$, $pg$["Rien, la boîte change de rapport toute seule", "Tu pousses le sélecteur vers l'avant", "Tu lèves le pied une seconde"]$pg$::jsonb, 0, $pg$C'est tout l'intérêt de l'automatique : elle choisit le rapport à ta place. Ta tête reste sur la route et sur tes rétroviseurs.$pg$, 1, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000022', 'en', $pg$You're driving and the engine revs climb. What do you do?$pg$, $pg$["Nothing, the gearbox shifts by itself", "You push the selector forward", "You lift off for a second"]$pg$::jsonb, $pg$That's the whole point of an automatic: it picks the gear for you. Your head stays on the road and your mirrors.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000022', 'ar', $pg$أنت تقود ويرتفع دوران المحرك. ماذا تفعل؟$pg$, $pg$["لا شيء، تغيّر العلبة السرعة وحدها", "تدفع المؤشّر إلى الأمام", "ترفع قدمك ثانية واحدة"]$pg$::jsonb, $pg$هذه هي فائدة السيارة الأوتوماتيكية: تختار السرعة بدلًا عنك. ويبقى انتباهك على الطريق وعلى المرايا.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000023', 'C1f', $pg$Tu veux passer la marche arrière. Tu la passes quand ?$pg$, $pg$["À l'arrêt complet, pied sur le frein", "En roulant tout doucement", "Peu importe, la boîte se protège"]$pg$::jsonb, 0, $pg$R ne se passe qu'à l'arrêt complet, pied sur le frein. En roulant, on abîme la boîte, et la réparation coûte cher.$pg$, 2, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000023', 'en', $pg$You want to select reverse. When do you do it?$pg$, $pg$["At a complete stop, foot on the brake", "While rolling very slowly", "Any time, the gearbox protects itself"]$pg$::jsonb, $pg$R goes in only at a complete stop, foot on the brake. Doing it while moving damages the gearbox, and that repair is expensive.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000023', 'ar', $pg$تريد وضع الرجوع للخلف. متى تفعل ذلك؟$pg$, $pg$["عند التوقّف التام وقدمك على الفرامل", "أثناء السير ببطء شديد", "في أي وقت، العلبة تحمي نفسها"]$pg$::jsonb, $pg$لا يوضع R إلا عند التوقّف التام وقدمك على الفرامل. وضعه أثناء السير يُتلف علبة السرعة، وإصلاحها مكلف.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000024', 'C1f', $pg$Tu appuies à fond sur l'accélérateur pour finir un dépassement. La boîte fait quoi ?$pg$, $pg$["Elle descend d'un rapport pour donner de la reprise", "Elle passe au rapport le plus haut", "Elle ne change rien"]$pg$::jsonb, 0, $pg$Ça s'appelle le kick-down. Pied au plancher, la boîte rétrograde et le moteur pousse. Utile, mais un dépassement se décide avant de déboîter, pas au milieu.$pg$, 2, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000024', 'en', $pg$You floor the accelerator to finish an overtake. What does the gearbox do?$pg$, $pg$["It drops a gear to give you pickup", "It shifts to the highest gear", "It does nothing"]$pg$::jsonb, $pg$It's called kick-down. Floor it and the box drops a gear so the engine pulls. Useful, but an overtake is decided before you pull out, not halfway through.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000024', 'ar', $pg$تضغط دواسة الوقود حتى النهاية لإنهاء تجاوز. ماذا تفعل علبة السرعة؟$pg$, $pg$["تنزل سرعة واحدة لتمنحك قوة دفع", "تنتقل إلى أعلى سرعة", "لا تغيّر شيئًا"]$pg$::jsonb, $pg$يُسمّى هذا kick-down. عند ضغط الدواسة كاملًا تنزل العلبة سرعة فيدفع المحرك. مفيد، لكن التجاوز يُقرَّر قبل الخروج من المسار لا في منتصفه.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000025', 'C1f', $pg$Longue descente de montagne. Tu gardes le pied posé sur le frein tout du long ?$pg$, $pg$["Non, tu freines franchement puis tu relâches, et tu recommences", "Oui, en appuyant légèrement en continu", "Oui, c'est la seule solution en automatique"]$pg$::jsonb, 0, $pg$Le pied posé en continu chauffe les freins et ils perdent leur mordant. Des appuis francs et courts, entrecoupés de pauses, gardent des freins efficaces.$pg$, 2, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000025', 'en', $pg$Long mountain descent. Do you keep your foot resting on the brake the whole way?$pg$, $pg$["No, you brake firmly then release, and repeat", "Yes, pressing lightly and continuously", "Yes, it's the only option in an automatic"]$pg$::jsonb, $pg$Resting your foot heats the brakes and they lose their bite. Short firm presses with pauses in between keep the brakes working.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000025', 'ar', $pg$نزول طويل في الجبل. هل تُبقي قدمك على الفرامل طوال الطريق؟$pg$, $pg$["لا، تفرمل بقوة ثم ترفع قدمك، وتكرّر ذلك", "نعم، بضغط خفيف ومستمر", "نعم، هذا هو الحل الوحيد في السيارة الأوتوماتيكية"]$pg$::jsonb, $pg$إبقاء القدم على الفرامل يُسخّنها فتفقد قوتها. الضغطات القوية القصيرة مع فترات راحة بينها تُبقي الفرامل فعّالة.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000026', 'C1f', $pg$Ta voiture a un mode qui laisse choisir le rapport, marqué M ou + et -. Il sert à quoi ?$pg$, $pg$["À retenir un rapport bas en longue descente ou sur route glissante", "À rouler plus vite", "À économiser la batterie"]$pg$::jsonb, 0, $pg$Il garde un rapport bas pour que le moteur freine à ta place, en descente ou sur route glissante. Toutes les voitures ne l'ont pas.$pg$, 3, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000026', 'en', $pg$Your car has a mode that lets you pick the gear, marked M or + and -. What's it for?$pg$, $pg$["Holding a low gear on a long descent or a slippery road", "Driving faster", "Saving the battery"]$pg$::jsonb, $pg$It holds a low gear so the engine brakes for you, on a descent or a slippery road. Not every car has it.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000026', 'ar', $pg$سيارتك فيها وضع يتيح لك اختيار السرعة، مكتوب عليه M أو + و -. ما فائدته؟$pg$, $pg$["إبقاء سرعة منخفضة في النزول الطويل أو على طريق زلق", "القيادة بسرعة أكبر", "توفير البطارية"]$pg$::jsonb, $pg$يُبقي سرعة منخفضة ليفرمل المحرك بدلًا عنك، في النزول أو على طريق زلق. ولا توجد هذه الميزة في كل السيارات.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000031', 'C2d', $pg$Un virage serré arrive, en boîte automatique. Le bon geste ?$pg$, $pg$["Ralentir avant le virage, puis accélérer doucement en sortie", "Freiner en plein virage", "Accélérer avant d'entrer pour être stable"]$pg$::jsonb, 0, $pg$On ralentit avant la courbe, jamais dedans. La boîte choisit le rapport, ton travail c'est la vitesse d'entrée et le regard loin dans le virage.$pg$, 2, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000031', 'en', $pg$A tight bend is coming up, in an automatic. What's the right move?$pg$, $pg$["Slow down before the bend, then accelerate gently on the way out", "Brake in the middle of the bend", "Accelerate before entering to stay stable"]$pg$::jsonb, $pg$You slow down before the curve, never inside it. The gearbox picks the gear; your job is the entry speed and looking far through the bend.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000031', 'ar', $pg$منعطف حادّ يقترب، وأنت في سيارة أوتوماتيكية. ما التصرّف الصحيح؟$pg$, $pg$["تبطئ قبل المنعطف ثم تسرّع بلطف عند الخروج", "تفرمل في منتصف المنعطف", "تسرّع قبل الدخول لتبقى ثابتًا"]$pg$::jsonb, $pg$تبطئ قبل المنعطف لا داخله. علبة السرعة تختار السرعة، ومهمّتك أنت هي سرعة الدخول والنظر بعيدًا داخل المنعطف.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000041', 'C3d', $pg$Freinage d'urgence en boîte automatique. Ton geste ?$pg$, $pg$["Tu écrases le frein et tu ne lâches pas", "Tu freines par petits coups", "Tu passes d'abord au point mort"]$pg$::jsonb, 0, $pg$Pied droit à fond sur le frein, sans relâcher, et les deux mains sur le volant pour contourner. La voiture ne peut pas caler, tu n'as rien d'autre à faire.$pg$, 1, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000041', 'en', $pg$Emergency braking in an automatic. What do you do?$pg$, $pg$["You slam the brake and don't let go", "You brake in short bursts", "You shift to neutral first"]$pg$::jsonb, $pg$Right foot flat on the brake, no letting go, both hands on the wheel to steer around. The car can't stall, so there's nothing else to do.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000041', 'ar', $pg$فرملة طارئة في سيارة أوتوماتيكية. ما تصرّفك؟$pg$, $pg$["تضغط الفرامل بكل قوّتك ولا ترفع قدمك", "تفرمل بضغطات قصيرة متتالية", "تنقل أولًا إلى الوضع المحايد"]$pg$::jsonb, $pg$القدم اليمنى على الفرامل حتى النهاية دون رفعها، واليدان على المقود للانحراف حول العائق. لا يمكن للسيارة أن تتوقّف عن العمل، فليس عليك فعل شيء آخر.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000042', 'C3d', $pg$En automatique, faut-il toucher au sélecteur pendant un freinage d'urgence ?$pg$, $pg$["Non, tu ne t'occupes que du frein et du volant", "Oui, il faut passer sur N", "Oui, il faut passer sur P"]$pg$::jsonb, 0, $pg$Rien à faire avec le sélecteur : la voiture ne cale pas. Tes deux seuls sujets sont le frein et la direction.$pg$, 2, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000042', 'en', $pg$In an automatic, do you need to touch the selector during emergency braking?$pg$, $pg$["No, you only deal with the brake and the wheel", "Yes, you must shift to N", "Yes, you must shift to P"]$pg$::jsonb, $pg$Nothing to do with the selector: the car won't stall. Your only two concerns are the brake and the steering.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000042', 'ar', $pg$في السيارة الأوتوماتيكية، هل تلمس المؤشّر أثناء الفرملة الطارئة؟$pg$, $pg$["لا، تهتمّ بالفرامل والمقود فقط", "نعم، يجب النقل إلى N", "نعم، يجب النقل إلى P"]$pg$::jsonb, $pg$لا شيء تفعله بالمؤشّر: السيارة لا تتوقّف عن العمل. همّك الوحيد هو الفرامل والتوجيه.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000043', 'C3d', $pg$Sur sol glissant, tu sens la voiture partir. Le premier réflexe ?$pg$, $pg$["Lever le pied et regarder là où tu veux aller", "Freiner à fond", "Donner un grand coup de volant"]$pg$::jsonb, 0, $pg$Lever le pied rend de l'adhérence aux roues, et le regard ramène la voiture. Un grand coup de volant ou un freinage brutal aggravent la glissade.$pg$, 3, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000043', 'en', $pg$On a slippery surface, you feel the car sliding. First reflex?$pg$, $pg$["Lift off and look where you want to go", "Brake hard", "Yank the steering wheel"]$pg$::jsonb, $pg$Lifting off gives grip back to the wheels, and your eyes bring the car back. A big steering input or hard braking makes the slide worse.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000043', 'ar', $pg$على أرض زلقة، تشعر أن السيارة تنزلق. ما ردّ الفعل الأول؟$pg$, $pg$["ترفع قدمك عن الدواسة وتنظر إلى حيث تريد الذهاب", "تفرمل بأقصى قوة", "تدير المقود بقوة"]$pg$::jsonb, $pg$رفع القدم يعيد التماسك للعجلات، والنظر يعيد السيارة إلى مسارها. أما إدارة المقود بعنف أو الفرملة القوية فتزيد الانزلاق سوءًا.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000051', 'C3e', $pg$Bande d'insertion courte, en boîte automatique. Comment tu prends de la vitesse ?$pg$, $pg$["Un appui franc sur l'accélérateur, la boîte rétrograde toute seule", "Tu attends d'être sur la voie pour accélérer", "Tu gardes une allure faible et tu forces le passage"]$pg$::jsonb, 0, $pg$Un appui franc et la boîte descend d'un rapport pour pousser. Tu prends l'allure du trafic avant de te rabattre, en regardant dans le rétroviseur et par-dessus l'épaule.$pg$, 2, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000051', 'en', $pg$Short slip road, in an automatic. How do you build up speed?$pg$, $pg$["A firm press on the accelerator, the gearbox drops a gear by itself", "You wait until you're in the lane to accelerate", "You stay slow and force your way in"]$pg$::jsonb, $pg$A firm press and the box drops a gear to pull. You reach the speed of the traffic before merging, checking the mirror and over your shoulder.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000051', 'ar', $pg$مسار اندماج قصير، في سيارة أوتوماتيكية. كيف تكتسب السرعة؟$pg$, $pg$["ضغطة حازمة على دواسة الوقود، وتنزل العلبة سرعة وحدها", "تنتظر حتى تدخل المسار ثم تسرّع", "تبقى بطيئًا وتفرض دخولك"]$pg$::jsonb, $pg$ضغطة حازمة فتنزل العلبة سرعة لتدفع. تبلغ سرعة السير قبل الاندماج، مع النظر في المرآة وفوق الكتف.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000061', 'C4c', $pg$En boîte automatique, comment tu aides la boîte à passer les rapports tôt ?$pg$, $pg$["Tu accélères en douceur", "Tu appuies fort puis tu relâches d'un coup", "Tu ne peux rien y faire"]$pg$::jsonb, 0, $pg$La boîte lit ton pied. Accélération douce, elle monte les rapports tôt et le moteur reste bas. Pied lourd, elle garde les rapports longtemps et ça boit.$pg$, 2, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000061', 'en', $pg$In an automatic, how do you help the gearbox shift up early?$pg$, $pg$["You accelerate gently", "You press hard then lift off suddenly", "There's nothing you can do"]$pg$::jsonb, $pg$The gearbox reads your foot. Gentle acceleration and it shifts up early, keeping the revs low. A heavy foot and it holds the gears, and that drinks fuel.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000061', 'ar', $pg$في السيارة الأوتوماتيكية، كيف تساعد العلبة على رفع السرعات مبكرًا؟$pg$, $pg$["تسرّع بلطف", "تضغط بقوة ثم ترفع قدمك فجأة", "لا يمكنك فعل شيء"]$pg$::jsonb, $pg$العلبة تقرأ قدمك. التسريع اللطيف يجعلها ترفع السرعات مبكرًا فيبقى دوران المحرك منخفضًا. أما القدم الثقيلة فتُبقي السرعات طويلًا ويزيد الاستهلاك.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000062', 'C4c', $pg$À un feu rouge, le moteur s'éteint tout seul. C'est normal ?$pg$, $pg$["Oui, c'est le Stop and Start : il repart quand tu lèves le pied du frein", "Non, la voiture a calé", "Oui, mais il faut redémarrer à la clé"]$pg$::jsonb, 0, $pg$Le Stop and Start coupe le moteur à l'arrêt et le relance seul. Rien à faire, sauf garder le pied sur le frein.$pg$, 1, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000062', 'en', $pg$At a red light, the engine switches off by itself. Is that normal?$pg$, $pg$["Yes, it's Stop and Start: it restarts when you lift off the brake", "No, the car has stalled", "Yes, but you have to restart it with the key"]$pg$::jsonb, $pg$Stop and Start cuts the engine when you stop and restarts it on its own. Nothing to do, just keep your foot on the brake.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000062', 'ar', $pg$عند إشارة حمراء، ينطفئ المحرك وحده. هل هذا طبيعي؟$pg$, $pg$["نعم، إنه نظام Stop and Start: يعود للعمل عند رفع قدمك عن الفرامل", "لا، السيارة توقّفت عن العمل", "نعم، لكن عليك تشغيلها بالمفتاح"]$pg$::jsonb, $pg$يُطفئ نظام Stop and Start المحرك عند التوقّف ويعيد تشغيله وحده. لا شيء عليك فعله سوى إبقاء قدمك على الفرامل.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000063', 'C4c', $pg$Tu vois un bouchon arrêté loin devant. Le geste le plus éco en automatique ?$pg$, $pg$["Lever le pied très tôt et laisser la voiture ralentir seule", "Rouler jusqu'au bouchon puis freiner", "Passer sur N pour rouler sur l'élan"]$pg$::jsonb, 0, $pg$Pied levé, le moteur ne consomme presque plus et la voiture ralentit d'elle-même. Au point mort tu perds le frein moteur et tu ne maîtrises plus rien.$pg$, 2, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000063', 'en', $pg$You see stopped traffic far ahead. The most economical move in an automatic?$pg$, $pg$["Lift off very early and let the car slow down by itself", "Drive up to the queue then brake", "Shift to N and coast"]$pg$::jsonb, $pg$With your foot off, the engine barely uses fuel and the car slows on its own. In neutral you lose engine braking and you're no longer in control.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000063', 'ar', $pg$ترى ازدحامًا متوقّفًا بعيدًا أمامك. ما التصرّف الأقلّ استهلاكًا في سيارة أوتوماتيكية؟$pg$, $pg$["ترفع قدمك مبكرًا جدًا وتترك السيارة تبطئ وحدها", "تتابع حتى الازدحام ثم تفرمل", "تنقل إلى N وتسير بالاندفاع"]$pg$::jsonb, $pg$برفع القدم لا يكاد المحرك يستهلك وقودًا وتبطئ السيارة وحدها. أما الوضع المحايد فيفقدك فرملة المحرك ولا تعود مسيطرًا.$pg$)
on conflict (question_id, lang) do nothing;

insert into public.questions_competence (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values ('b0a70000-0000-4000-8000-000000000071', 'C4f', $pg$Pendant l'examen tu hésites et tu prends la mauvaise file. C'est terminé ?$pg$, $pg$["Non, tu continues calmement et tu te corriges", "Oui, c'est éliminatoire", "Tu t'arrêtes pour t'expliquer"]$pg$::jsonb, 0, $pg$Une hésitation n'élimine personne. L'inspecteur regarde comment tu te rattrapes, et il te remet dans le bon chemin s'il le faut.$pg$, 1, 'post_validation', 'auto')
on conflict (id) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000071', 'en', $pg$During the test you hesitate and take the wrong lane. Is it over?$pg$, $pg$["No, you carry on calmly and correct yourself", "Yes, that's an automatic fail", "You stop to explain yourself"]$pg$::jsonb, $pg$Hesitation eliminates nobody. The examiner watches how you recover, and will put you back on the right road if needed.$pg$)
on conflict (question_id, lang) do nothing;
insert into public.question_translations (question_id, lang, question, options, explanation)
values ('b0a70000-0000-4000-8000-000000000071', 'ar', $pg$أثناء الامتحان تتردّد وتأخذ المسار الخطأ. هل انتهى الأمر؟$pg$, $pg$["لا، تتابع بهدوء وتصحّح نفسك", "نعم، هذا سبب رسوب مباشر", "تتوقّف لتشرح ما حدث"]$pg$::jsonb, $pg$التردّد لا يُرسّب أحدًا. الفاحص يراقب كيف تتدارك الأمر، وسيعيدك إلى الطريق الصحيح إن لزم.$pg$)
on conflict (question_id, lang) do nothing;
