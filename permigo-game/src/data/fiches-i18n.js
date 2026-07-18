// ═══════════════════════════════════════════════════════════════
// i18n des FICHES DE RÉVISION de conduite (EN + AR).
// Généré depuis src/data/fiches/monde-*.json + monde-*.quiz.json.
// Principe PermiGo : on AFFICHE la traduction + on garde le français dessous
// (helper bilingue dans revision-conduite.js / premium-quiz.js). L'app reste FR.
// FICHES_I18N[lang][code] = { titre, competence, methode[], pourquoi, erreur, bva }
// FICHE_QUIZ_I18N[lang][code] = [{ q, options[], explication }] (même ordre que quizByCode)
// MONDES_I18N[lang][n] = { nom, sous } · RVC_UI[lang] / PQ_UI[lang] = libellés d'interface
// ═══════════════════════════════════════════════════════════════
export const FICHES_I18N = {
  en: {
    C1a: {
      titre: "Getting familiar with the driver's position",
      competence: "Handling",
      methode: [
        "Do a quick walk-around of the car: nothing under the wheels, tyres not flat, lights and plates clean.",
        "Settle in, close the door, check that it's properly shut.",
        "Locate the dashboard controls without starting: speedometer, fuel gauge, warning lights.",
        "Locate the two stalks behind the wheel: LEFT stalk = the turn signals (and the dipped/main-beam headlights, the headlight flash); RIGHT stalk = the windscreen wipers (and the washer).",
        "Locate the foot controls: on the left the clutch, in the middle the brake, on the right the accelerator.",
        "Turn on the ignition (without starting) and watch the warning lights: they come on then go off. If one stays lit (oil, battery, brake), report it.",
      ],
      pourquoi:
        "You need to be able to work a turn signal or a wiper without taking your eyes off the road. If you're hunting for a control while driving, you're no longer looking ahead.",
      erreur:
        "Mixing up the two stalks and setting off the wipers instead of the turn signal. Simple memo: turn signal on the left, wipers on the right.",
      bva: "No clutch pedal: at your feet there's only the brake (left) and the accelerator (right), both for the right foot. In place of the gear lever, you have the P / R / N / D selector. The stalks (turn signal on the left, wipers on the right) don't change.",
    },
    C1b: {
      titre: "Adjusting your driving position",
      competence: "Handling",
      methode: [
        "Seat — distance (depth): move the seat forward/back so your left foot can press the clutch all the way down with your leg still slightly bent (never fully straight). Many learners sit too far back “to have room”: if you have to stretch your leg, move closer.",
        "Seat — height: adjust it so you can see the road without craning your neck. A concrete cue from the instructor: lower the sun visor — if you can see the road below it, your eye height is right; if the visor hides the road, you're too low.",
        "Backrest: adjust it in relation to how you hold the wheel — when your hands are on the wheel, your arms should stay slightly bent (neither too close nor too far).",
        "Headrest: the top of the headrest level with the top of your head.",
        "Steering wheel: adjust it if needed (lever under the wheel) so it doesn't get in the way of your knees and you can clearly see the speedometer over it.",
        "Mirrors: the interior one first, with your right hand, without lifting your shoulders off the seat — you should see the whole rear window at a glance, without moving your head. Then the exterior ones: you only see a small bit of your car at the bottom, the rest is the road (aim for ~90% road, your bodywork is just a reference point).",
        "Seatbelt: it goes over the shoulder (not the neck) and across the pelvis (not the belly), flat, not twisted.",
      ],
      pourquoi:
        "A poorly adjusted seat = you can't press the clutch all the way (risk of stalling) and you tire quickly. Thirty seconds of adjusting = the whole lesson more comfortable and safer.",
      erreur:
        "Setting the seat too far back to “have room”: the left leg is straight and no longer presses the clutch all the way down → you stall without understanding why.",
      bva: "Since there's no clutch, the “left leg slightly bent on the clutch” cue doesn't apply. You adjust the distance so your right foot reaches the brake and accelerator without stretching your leg, and you rest your left foot at rest (on the footrest on the left). Height, backrest, steering wheel, mirrors, seatbelt: the same.",
    },
    C1c: {
      titre: "Holding the wheel and holding your line",
      competence: "Handling",
      methode: [
        "Place your hands as on a clock: at 9 and 3 (the “quarter past nine” position), thumbs resting on the rim, not curled underneath.",
        "Look far ahead, not at the bonnet: your gaze “pulls” the car toward where you want to go.",
        "Turn by pull-pushing the wheel without crossing your hands: one hand pulls, the other pushes/guides.",
        "Only cross your hands for slow manoeuvres (parallel parking, U-turn), never at normal speed.",
        "Let the wheel come back while holding it after a turn — you don't let go and let it spin on its own.",
        "Cue “how many turns does the wheel make?”: a steering wheel turns about one and a half turns each way (a full turn + a half turn to go all the way). To know whether your wheels are straight after a full lock, do exactly the reverse.",
        "Cue “turn your wheel toward the side you want to go”: rather than getting confused between right and left (especially in reverse), you turn the wheel toward the side you want the car to move toward, both going forward and in reverse.",
      ],
      pourquoi:
        "Your gaze guides your hands. If you stare at the bonnet or an obstacle, you'll head straight for it. If you look far ahead where you want to go, your line naturally becomes straight.",
      erreur:
        "Driving with “crossed arms” the whole time, or holding the wheel with a single hand resting at the top: you lose precision and the strength to react quickly. Another common trap in manoeuvres: as soon as the car goes a little off, jerking the wheel every which way to “catch up” → you get completely lost. The right reflex: move slowly, watch where the car is going, then correct gently.",
      bva: null,
    },
    C1d: {
      titre: "Starting off and stopping smoothly",
      competence: "Handling",
      methode: [
        "Before setting off — Before starting the engine: handbrake on, gear lever in neutral, clutch pressed all the way down, ignition.",
        "Before setting off — Put it in 1st.",
        "The biting point — Find the biting zone: release the clutch and quickly pass the “dead zone” (between the pedal fully down and the start of the bite), then slow the movement as soon as the engine responds.",
        "The biting point — At the biting point, give a touch of accelerator and slide your left foot up gradually (the car “wants” to move, the engine sound changes slightly).",
        "The biting point — Release the handbrake, and the car moves off.",
        "Stopping and foot position — To stop: come off the accelerator early, brake gradually, and press the clutch just before the full stop so you don't stall.",
        "Stopping and foot position — When stopped: keep the brake held, then neutral + handbrake if you stay stationary.",
        "Stopping and foot position — Foot position: press with the ball of your foot, heel anchored on the floor, and slide the heel along the floor to lift the clutch. If you lift your heel or the sole slips, you lose precision and can no longer find the biting point in the same place.",
      ],
      pourquoi:
        "The biting point (or rather the biting zone) is the moment when the clutch starts transmitting the engine's power to the wheels. Releasing it too fast at that moment = the car lurches or stalls. Releasing it smoothly = a clean start.",
      erreur:
        "Releasing the clutch all at once at the biting point → it stalls or moves off in jerks. And pressing the clutch too late when braking → it stalls just before stopping.",
      bva: "No biting point, no clutch, no 1st gear to engage. To start off: foot on the brake, selector on D, you release the brake and the car moves off on its own (at idle), then you accelerate gently. To stop: you brake gradually with your right foot until you stop — no risk of stalling. For a long stop, you shift to P and put on the handbrake.",
    },
    C1e: {
      titre: "Modulating the accelerator and the brake",
      competence: "Handling",
      methode: [
        "Accelerate gradually, with the ball of your foot: the right foot pushes gently, never a jerk.",
        "Practise stabilising at different revs (e.g. ~1000, ~1500, ~2500 rpm): the more you press, the higher the engine revs; if you go past the target revs, ease off a little without releasing completely, then readjust. This “step-by-step” dosing can be practised even while stationary.",
        "Look far ahead to see slowdowns coming in advance.",
        "To slow down, first come off the accelerator (engine braking already does part of the work).",
        "Then brake in two stages (progressive braking): a first, firmer press to slow down, then a lighter press to hold the car back, which you release just before stopping. You work the brake pedal (a bit more, a bit less).",
        "Keep your right foot light: a heavy foot = jerks, excess fuel use, jolted passengers.",
      ],
      pourquoi:
        "Smooth driving is anticipation: if you look far ahead, you never have to brake harshly. Bonus: comfortable passengers, less fuel, a better mark on the test.",
      erreur:
        "Driving “like an accordion”: accelerating hard then braking hard, over and over, because you're looking too close. You wear everyone out and wear out the car.",
      bva: "Since the same right foot serves both the brake and the accelerator, the dosing is done with a single foot: you come off the gas, you move onto the brake, never using both at the same time. In D, the car keeps moving on its own at idle as soon as you release the brake — remember to keep it held to stay still on a slope.",
    },
    C1f: {
      titre: "Changing gear at the right moment",
      competence: "Handling",
      methode: [
        "Listen to / watch the engine revs. Sound cue first (“the engine is revving up”); rough figures: ~2000 rpm for diesel, ~2500 for petrol.",
        "To change gear: come off the accelerator, press the clutch all the way, move the lever, release the clutch smoothly (in two stages), get back on the accelerator.",
        "Hold the lever properly: with your palm resting on the knob, never with your fingertips or gripping hard. No strength needed: it's the position of your hand that matters.",
        "Use the return spring: the lever always comes back to neutral (between 3rd and 4th) on its own. Place your hand on the right-hand side of neutral for the right-hand gears (5/6 + reverse depending on the model) and forward/back for 1/2/3/4 to counter this spring.",
        "Keep your eyes on the road, not on the lever: you feel the gears with your hand.",
        "Downshift BEFORE a turn or braking, never during — and you downshift because you've already slowed down, not to slow down. You pick the right gear to have pickup on the way out.",
        "Match the gear to your speed: too high at low speed = the engine “coughs”; too low at high speed = the engine “screams”. You stop in 2nd, not in 1st (then you go back to 1st to set off again).",
      ],
      pourquoi:
        "The right gear is the one that keeps the engine comfortable: neither straining nor racing. Downshifting before the turn leaves you the pickup to accelerate cleanly on the way out.",
      erreur:
        "Looking at the lever while changing gear (you're no longer watching the road) and stalling on a downshift because you release the clutch too fast at low revs. And picking the wrong gear from a poor hand position (aiming for 4th, engaging 2nd): a gearbox error is often a fail on the test.",
      bva: "There's no gear changing to do: the gearbox does it for you. No clutch, no gear lever: you stay in D and handle everything with the accelerator. This card (manual up/downshifting) doesn't apply to a learner in an automatic — and the risk of a fail-grade gearbox error doesn't exist. Good to know: some automatics offer a manual mode (+/-), but it isn't required when you're starting to learn.",
    },
    C1g: {
      titre: "The checks before driving off (walk-around)",
      competence: "Handling",
      methode: [
        "Tyres: not visibly deflated, no cuts, tread not too worn (wear indicator).",
        "Lights: switch them on and have someone check the headlights (dipped/main beam), turn signals, brake lights, reversing lights.",
        "Windows, mirrors, plates, lenses: clean, nothing broken, good visibility.",
        "Fluid levels (if asked): you can point out where the engine oil, screen wash and coolant are.",
        "On the test: the examiner asks you for one check (interior or exterior) + one road-safety question + one first-aid notion. You show/explain calmly.",
      ],
      pourquoi:
        "A poorly checked car is a rolling danger: a bald tyre brakes badly, a dead light = you're not seen. The walk-around is ten seconds that prevent an accident.",
      erreur:
        "Reciting a list by heart without showing anything. On the test as in real life, you're expected to point to the item (“the oil cap is here”) and make the gesture.",
      bva: null,
    },
    C1h: {
      titre: "Nailing the test manoeuvres (parallel parking, U-turn, parking)",
      competence: "Handling",
      methode: [
        "The 6 families (the examiner sets ONE): reversing in a straight line, reversing on a curve, angle parking, U-turn (in 3, 5 or 7 moves), bay parking, parallel parking.",
        "The real key to ALL manoeuvres: knowing how to move your car in reverse (to the right, to the left). And you never have right of way during a manoeuvre: you make it safe first and let every road user who comes past go.",
        "Common rules — Make it safe: turn signal before you stop, 360° checks (mirrors + direct vision), you let others past.",
        "Common rules — The slowest possible pace: you're not being timed.",
        "Common rules — Manage your spacing: don't graze the cars beside you.",
        "Common rules — You may LEAN on the kerb, never MOUNT it (hitting/climbing the kerb = a fail).",
        "Common rules — 360° checks during the manoeuvre, regularly.",
        "Common rules — At the end: neutral + handbrake, car properly immobilised.",
        "Parallel parking — Pull up level with the car in front of the space (mirror to mirror), right turn signal on, at a good sideways distance.",
        "Parallel parking — Engage reverse, check, let others past if needed.",
        "Parallel parking — Give a small quarter-turn of the wheel to the right and go “find” the space by reversing very slowly (if there are 2-3 free spaces behind, use all the room).",
        "Parallel parking — Reverse while easing gently toward the kerb, without hitting it. Tip: you can fold in the right mirror to see the kerb better — remember to put it back before driving off.",
        "Parallel parking — Put it in 1st, turn to the right and move forward gently to settle parallel, then quickly straighten the wheels as soon as you're straight.",
        "Reverse bay / angle parking — Count the spaces from your target (“count 3-4 bays”) and stop level with it, also looking ahead between each bay.",
        "Reverse bay / angle parking — Reverse, turn full lock toward the space, do a 360° check.",
        "Reverse bay / angle parking — General cue: when you turn round, it's the FIRST light / the first edge of the neighbouring car that should appear (toward the start, at the latest the middle of your rear window). If you aim for the 2nd light, you drift out too far.",
        "Reverse bay / angle parking — Reverse slowly, wait until you're straight BEFORE straightening the wheels (a half turn + a full turn).",
        "Reverse bay / angle parking — Don't rely on the neighbouring spaces to line up: imagine your space's line extending and follow along it.",
      ],
      pourquoi:
        "The key to a manoeuvre isn't strength, it's slowness. The slower you go, the more time you have to turn the wheel and correct. Slow speed + decisive steering.",
      erreur:
        "Going too fast and turning the wheel too late. Result: you mount the kerb or touch the car. You need the opposite: slow right down, steer early and decisively. Another trap: staring at your space and turning round too early instead of counting your bays and staying straight → you set off crooked.",
      bva: "In reverse, you put the selector on R. No clutch to modulate: the car reverses on its own at idle as soon as you release the brake, so you set your slowness with the brake (you brake a little to slow, you ease off to move). You keep your right foot on the brake/accelerator and you can steer calmly. It's often easier than in a manual (no risk of stalling in the middle of a manoeuvre).",
    },
    C1i: {
      titre: "Chaining manoeuvres on your own",
      competence: "Handling",
      methode: [
        "Read the situation: which manoeuvre does the space call for (parallel parking, bay, angle, U-turn)?",
        "Choose the right manoeuvre and the right side yourself (reminder: parallel/bay parking on the left only on a one-way street, otherwise you end up facing oncoming traffic).",
        "Signal and make it safe: turn signal before stopping, mirror checks + blind spot + direct vision; you don't have right of way, you let others past.",
        "Execute slowly, working YOUR cues (the ones your instructor taught you) — and keeping the same procedure every time so you can correct.",
        "If it goes wrong, correct without panicking: get yourself straight (wheel straight, wheels straight), spot which side you have room on, and bring the car toward that side. A clean correction is better than forcing it.",
      ],
      pourquoi:
        "On the test, the examiner doesn't guide you. This skill proves you decide and correct yourself on your own — that's what being ready for World 2 means.",
      erreur:
        "Waiting for the instructor's “go” for every move. As long as you depend on guidance, the manoeuvre isn't mastered. The other trap: panicking as soon as the manoeuvre isn't perfect on the first try instead of calmly repositioning.",
      bva: "Same manoeuvres, same autonomy expected. You handle direction with the selector (D to go forward, R to reverse) and your slowness with the brake rather than the clutch. Not being able to stall helps you stay calm when you correct.",
    },
    C2a: {
      titre: "Read the road with your eyes",
      competence: "Traffic",
      methode: [
        "Aim your eyes at mid-height on the windscreen: it forces you to look far ahead and see things coming instead of being caught out by them.",
        "Keep your eyes moving: your gaze shifts somewhere new about every second. A spot stared at too long means a mass of information your brain misses.",
        'Move your head, not just your eyes: to properly "photograph" your surroundings, you actually turn your head (pavements, garage entrances, intersections, parked vehicles).',
        "Come back to your mirrors regularly: a glance at the interior mirror roughly every 5 to 7 seconds.",
        'Bring your gaze back far ahead. You ask yourself two questions on a loop: "where am I now?" and "where do I want to go?".',
      ],
      pourquoi:
        "You drive with your eyes before you drive with your hands. One instructor sums it up well: your eyes are about 80% of driving. If your gaze is badly placed, your line is wrong no matter what you do with your hands. And the more you look at different places, the more your brain rebuilds a complete, precise picture of the scene (distances, shapes, hazards).",
      erreur:
        'Staring at the bonnet, the car right in front, or a single spot for too long. The result: you discover everything at the last moment and brake in a panic. Instructors\' remedy is commentary driving: you say out loud what you see ("pedestrian crossing, kerb curve, 50 sign"). It forces the eye to go hunting for clues and to anticipate.',
      bva: null,
    },
    C2b: {
      titre: "Match your speed to your surroundings",
      competence: "Traffic",
      methode: [
        "Pick up the signs as far ahead as possible: speed limit, school, market, bend, roadworks, vehicles pulling out. Even when it's quiet, keep reading the signs — it's your warm-up before the busy areas.",
        "Ease off the accelerator BEFORE the area, not once you're in it. Often it's enough to release the accelerator and let the car slow down on its own, without harsh braking.",
        "Gauge your distance from the car ahead: the 2-second rule (as the rear of its car passes a fixed marker, you must pass that same marker at least 2 s later).",
        "Double this distance in rain or at night (at least 4 seconds).",
        "Adjust constantly, both ways: when the road is clear and it's allowed, drive at a smooth pace, slightly below the maximum rather than right on the limit; when a hazard appears, slow down straight away.",
      ],
      pourquoi:
        "The right speed isn't \"the posted limit\", it's the one that lets you stop in time if something appears. Instructors stress both directions: driving too slowly isn't safer, it holds up the flow and stops you learning to handle information at real pace. On a descent, you let off the accelerator so you don't speed up on your own; on a climb, you anticipate a bit of throttle so you don't bog down. Speed is controlled as much with the accelerator as with the terrain.",
      erreur:
        "Keeping the same speed everywhere \"because you're within the limit\". A school zone at 50 is still dangerous at 50 if children are crossing. Conversely, crawling well below the limit on a clear road is no guarantee of safety: you adapt, you don't freeze on one speed.",
      bva: null,
    },
    C2c: {
      titre: "Position yourself correctly on the road",
      competence: "Traffic",
      methode: [
        "Drive in the middle of your lane, neither hugging the right nor cutting onto the centre.",
        'Use concrete reference points: with your mirrors, check the gap on the left (centre line) and on the right (kerb); and take a quick glance low down to locate the right-hand kerb — a common reference: it "lands" roughly in the middle of your windscreen.',
        "Keep a side gap of at least one car door from parked cars (risk of a door opening or a pedestrian stepping out).",
        "On a narrow road or with cyclists, shift slightly to the left, after checking it's clear, to leave a safety gap when you pass oncoming traffic or overtake.",
        "Stay centred and steady in a queue or a marked lane: no weaving.",
      ],
      pourquoi:
        "A well-positioned car is readable: others understand where you're going. And above all, a beginner almost always feels their car is too wide, that \"it won't fit\": it's an optical illusion. A car is about 1.80 m (≈ 2 m including mirrors); a lane is at least 3 m. Even passing a bus on a narrow road, the space is there. You trust your reference points, not your feeling.",
      erreur:
        'Hugging the right "to be careful" and grazing parked cars, the kerb or cyclists. Too far right is as dangerous as too far centre. Another trap: staring at the mirror in a bend to guide yourself — it lies (the rear of your car is further from the kerb than the front), you correct wrongly and hit the pavement.',
      bva: null,
    },
    C2d: {
      titre: "Take a bend",
      competence: "Traffic",
      methode: [
        "Prepare your gaze early: as soon as you see the bend, your eyes go toward the exit (where the road opens back up). Lean a little, turn your head if the windscreen pillars get in the way.",
        "Brake and slow down BEFORE entering, on the still-straight section. If needed, downshift to get the right gear.",
        "Stay firmly in your lane: don't cross the centre line and don't cut the bend.",
        "Pull the steering wheel with one hand: right hand for a right bend, left hand for a left bend — without forcing with both hands (you'd compromise your line), your gaze still fixed far ahead.",
        "Accelerate gently once the exit is in sight.",
        'Safety line: you stay in your lane (without cutting or crossing the line). The "outside → inside → outside" line is a racing line, irrelevant for the driving test.',
      ],
      pourquoi:
        'You brake in a straight line, where the car is stable. Braking mid-bend unbalances it and loses grip. Speed is set BEFORE, the wheel is managed DURING. And the line follows the gaze: one instructor puts it bluntly — "my head goes left and my hand follows at the same time". If you look at the edge, you go toward the edge.',
      erreur:
        "Entering too fast and braking in the middle of the bend. A sign you anticipated badly: next time, slow down earlier. Another common mistake: taking the bend at too low revs (gear too high). The car struggles, judders, and you risk stalling mid-curve. You downshift BEFORE to have power.",
      bva: null,
    },
    C2e: {
      titre: "Passing oncoming traffic and overtaking",
      competence: "Traffic",
      methode: [
        "To OVERTAKE — Check it's allowed: no solid line, no bend, no crest of a hill, no reduced visibility.",
        "Make sure you have visibility: you must see far and clear ahead of the vehicle to overtake.",
        "Run through the checks: interior mirror → left exterior mirror → left turn signal → blind-spot check → action. No one is already overtaking you.",
        "Pull out, overtake decisively while leaving the side gap (at least 1 m in town, 1.50 m outside built-up areas for a cyclist or two-wheeler).",
        "Right turn signal, and pull back in when you see the overtaken vehicle whole in your interior mirror (never cutting back in on it).",
        "To pass ONCOMING TRAFFIC on a narrow road: slow down, keep to the right (without brushing the verge), then take your place back once you've passed.",
      ],
      pourquoi:
        "An overtake is a moment when you drive in the oncoming lane: everything must be safe BEFORE, because once committed you can't go back. One instructor stresses the value of the turn signal even when overtaking a cyclist: it warns those behind AND shows the examiner you've analysed the situation. And the decision must be clear-cut: you firmly choose to overtake or to give up, you don't stay hesitating in the middle.",
      erreur:
        'Overtaking "because it\'ll be fine" without full visibility (bend, hill), or giving in to pressure from a car tailgating you. The right reflex when doubt sets in: you ease off, you downshift, you give up — and if the examiner asks why you slowed, you explain yourself ("I had a doubt about the cyclist\'s behaviour, I couldn\'t see far enough").',
      bva: null,
    },
    C2f: {
      titre: "Intersections and roundabouts",
      competence: "Traffic",
      methode: [
        "At intersections — Spot an intersection before the right of way: look for the clues — a pedestrian crossing, the curve of the kerb in the distance (a street opens out), a gap between parked cars or between buildings, direction signs.",
        "At intersections — At an intersection, identify the type AS YOU ARRIVE: traffic light, stop, give way, or nothing.",
        "At intersections — If there's no signage at all, it's priority to the right: anything emerging from your right goes before you.",
        "At intersections — Match your pace to the visibility: a glance at the interior mirror, then drop back to 2nd; if you can't see anything to the right, drop even to 1st to have time to look properly. The examiner will never hold it against you for slowing down to observe well.",
        "At intersections — Never stop abruptly at an intersection (risk of being rear-ended): you slow down early and gently.",
        "At intersections — Only commit if you can clear it: you never get stuck in the middle of a junction.",
        "Priority to the right — Failure to give priority to the right: if the car coming from the right is forced to slow down or stop to let you pass, that's already a failure to give way — even without a collision. It's never up to it to brake for you.",
        'Priority to the right — False positives: a car park exit, a private residence ("private" sign), a raised pavement = not priority to the right. Those coming out of them don\'t have priority (but you stay cautious).',
        'At the roundabout — At a give-way roundabout ("Give way" sign): as you approach, check behind, slow down and downshift (often 2nd). Choose your lane: right-hand lane by default on a small roundabout / to exit early; the lane suited to your exit on a large roundabout.',
        "At the roundabout — Give way: those already on the ring have priority. Take your time — don't rush until you've properly judged the distance AND the speed of those going round. When in doubt, you wait; you can even go round again.",
        "At the roundabout — Enter into a sufficient gap, without a left turn signal to go in (unless you're clearly turning left / going all the way round).",
        "At the roundabout — Approaching your exit: RIGHT turn signal just before it. As it sometimes cancels between two exits, don't hesitate to put it back on.",
        "At the roundabout — Before exiting: check the left blind spot (in case someone cuts across you), a glance right for bikes / cycle lane, then you exit and cancel the signal. Watch for the pedestrian crossing at the exit: you don't accelerate until you've checked.",
        'At the roundabout — A priority-to-the-right roundabout ≠ a give-way roundabout: the difference is read at the entry. Give-way roundabout = "Give way" at the entry → the one entering does NOT have priority, they let through those already on the ring. Priority-to-the-right roundabout (rare, no sign at the entry) → priority to the right → the one entering has priority over those already inside.',
      ],
      pourquoi:
        "An intersection is where paths cross: 99% of the job is knowing WHO GOES FIRST before you get there. The right turn signal when leaving a roundabout tells others you're leaving the ring, which frees up those waiting to enter.",
      erreur:
        'Two big classics: forgetting the right turn signal before leaving the roundabout (waiting road users stay stuck or pull out thinking you\'re carrying on); and not spotting the intersection in time, hence the failure to give priority to the right because you "thought you had time to get through".',
      bva: null,
    },
    C2g: {
      titre: "Communicate with other road users",
      competence: "Traffic",
      methode: [
        "Anticipate your action (turning, changing lane, stopping) BEFORE you do it.",
        "Put on your turn signal early enough, before changing direction — far enough ahead to give others time to understand (guide ~3 s).",
        "Get into position as soon as possible once your intention is signalled: you don't signal then wait 50 m to move over.",
        "Seek eye contact at pedestrian crossings and junctions: a shared glance beats a gamble.",
        "Cancel your turn signal once the manoeuvre is finished (if it doesn't cancel on its own — on a roundabout it often cancels too early, put it back on).",
        "Save the horn for warning of a danger, never for irritation.",
      ],
      pourquoi:
        "The road is a dialogue. Others don't guess your intentions: if you warn early and clearly, everyone adapts smoothly. One instructor shows it well: another driver's turn signal put on too late creates doubt (\"what's he doing? a U-turn?\"). Conversely, a clearly visible turn signal while you wait to pull out reassures and moves the situation along. Warning too late is no use at all.",
      erreur:
        "Putting on the turn signal at the same time as you turn (or not at all) — it must warn BEFORE, not go along with the move. And its cousin: signalling your intention then moving over far too late, which surprises those behind.",
      bva: null,
    },
    C2h: {
      titre: "Driving alone in the city (recap)",
      competence: "Traffic",
      methode: [
        "Before setting off, picture your route: the streets, the changes of direction, the tricky areas.",
        "Loop the reflexes of world 2: far, moving gaze (C2a), adapted speed (C2b), good positioning (C2c).",
        'Structure each manoeuvre, don\'t rush it: "take the time to do it right" — carrying out the moves in order (check → turn signal → blind spot → action) is exactly what makes driving smooth and safe.',
        "Announce your intentions early (turn signals, C2g) and handle priorities (C2f) without hesitating.",
        'Stay calm when the unexpected happens: if you take the wrong lane or street, you keep going — even if it means going round the roundabout again — and you pick it back up further on. Never a dangerous manoeuvre to "make up for it".',
      ],
      pourquoi:
        'World 2 is validated when all the moves become automatic and your mind is free to decide, no longer to steer. A telling benchmark: good learners check their mirrors "without even realising it", out of habit. You run through a long sequence without the instructor stepping in — including in the tricky areas (shopping streets, crowded car parks) where you don\'t let others rush you.',
      erreur:
        'Panicking at the unexpected (closed street, wrong lane on the roundabout, route mistake) and making a dangerous move to "correct" it (abrupt U-turn, reversing, forcing a lane change). You stay calm, you carry on in the lane you\'re in, you pick it back up safely afterwards.',
      bva: null,
    },
    C3a: {
      titre: "See well and be seen well at night",
      competence: "Tough conditions",
      methode: [
        "Before driving — Before you set off: check that your windows and headlights are clean. A dirty window doubles the reflections at night.",
        "Before driving — As soon as you're moving: turn on your low-beam headlights. At night they are mandatory, even in a lit-up town.",
        "Using your beams — On an unlit road with no one coming the other way: switch to high beams (full beam) to see farther. Outside town, the signs and markers become reflective: you see much farther and feel more confident.",
        "Using your beams — You see a vehicle coming the other way (or the faintest glow of headlights in the distance): switch back to low beams BEFORE it bothers you, so you don't dazzle the other driver. At the slightest doubt (a glow behind a wall, a bend), stay on low beams.",
        "Using your beams — While a car is passing you the other way: NEVER stare at the oncoming headlights. Rest your eyes on the right edge of your lane (line or kerb) and follow it. You can even use the reflection of the oncoming headlights on the right edge to place yourself.",
        "Night alertness — Your vision reaches less far than in broad daylight. That's normal: you see less far, so you act 'with a margin' — you brake a little earlier, you accelerate again a little later.",
        "Night alertness — Watch out for dark-clothed pedestrians and for animals. A pedestrian in dark clothes and a hood is spotted very late at night. Outside town, an animal can appear suddenly. Simple rule: certainty = I go, doubt = I don't accelerate.",
        "Night alertness — You feel heavy, your eyelids are drooping: you stop. Take a break every 2 hours — AND at the very first sign of tiredness, without waiting for the 2 hours.",
      ],
      pourquoi:
        "At night you see much less far and your eyes tire quickly. The whole challenge is to see as far as possible without blinding others, and not to let yourself be hypnotized by the oncoming headlights. An instructor sums it up well: at night, 'the eyes work enormously' — they are constantly searching for clues, whereas by day they rest.",
      erreur:
        "Staying on high beams facing an oncoming car (you dazzle it, it dazzles you back) — or staring at the oncoming headlights. If you stop looking at the road for even a fraction of a second, it can be dramatic: you completely lose the right edge of the road.",
      bva: null,
    },
    C3b: {
      titre: "Adjusting your driving to rain, snow and fog",
      competence: "Tough conditions",
      methode: [
        "Prepare, slow down — Get the car ready at the first drops. Front windscreen wipers (set the speed to the intensity), rear wiper if needed, and above all demisting: A/C + warm air on the windscreen to clear the fog fast. A fogged-up window is lost visibility, just like the rain.",
        "Prepare, slow down — Ease off and respect the 'rain' limits. On the motorway: 130 → 110, 110 → 100. And on a bend signed for 50, in the rain you do NOT take it at 50: it can slip.",
        "On slippery ground — Lengthen your distance from the car ahead. In the rain: ×2 (4 seconds instead of 2). On snow: even more (up to ×3).",
        "On slippery ground — Brake gently and early. On wet ground, braking takes 2× more distance: you start braking much earlier, with small presses, never a jolt.",
        "On slippery ground — Avoid big puddles. A large puddle can make you lose grip all at once (aquaplaning) and hide a hole. If you can't avoid it: slow down BEFORE, then cross at a constant speed, without any steering jerk.",
        "See and be seen — Turn on the right lights for the visibility: rain / grey day → low beams to be seen and to see better; fog or snow, visibility under 50 m → front AND rear fog lights allowed; ⚠️ in the RAIN: rear fog lights FORBIDDEN — they strongly dazzle the driver behind (up to 2.5× a brake light), front only if the rain is heavy; turn the fog lights off as soon as visibility returns.",
        "See and be seen — No high beams in heavy rain. The light reflects off the drops and creates a wall of glare in front of you: you see even worse. Stay on low beams.",
        "See and be seen — If the fog is thick: apply the rule of three 50s — visibility 50 m → speed 50 km/h → 50 m gap.",
      ],
      pourquoi:
        "Water, snow and ice reduce your tyres' grip: the car slips and takes longer to stop. More distance and more smoothness make up for this lack of grip. And visibility is the other half of the problem: wipers and demisting first, otherwise you're driving 'blind'.",
      erreur:
        "Keeping the same distance as in dry weather 'because you can still see fine'. Visibility has nothing to do with grip: even if you can see, you brake twice as poorly. Another common mistake: turning on the rear fog light in the rain (forbidden, and you blind the person behind you).",
      bva: null,
    },
    C3c: {
      titre: "Keeping control when it's slippery",
      competence: "Tough conditions",
      methode: [
        "Spot the danger with your eyes: shadowy areas under trees, a shiny patch, dead leaves, loose gravel, a wet tunnel exit. You anticipate BEFORE you get there.",
        "Ease off gently well before the slippery zone, never on it.",
        "On the zone: everything smooth. Light accelerator, gradual steering, no sharp movements. On wet ground, one abrupt acceleration is enough to make the wheels spin.",
        "Slow down BEFORE the bend, in a straight line — not in it. On a slippery curve, you look as far as possible to anticipate your line, and you turn with your foot off the pedal. Use the reflective signs and the kerbs to aim for your exit.",
        "If the rear starts to slide: you ease off (without braking abruptly) and you look where you want to go — your hands follow your eyes.",
      ],
      pourquoi:
        "On slippery ground, your tyres have very little grip. It's the abrupt move (a jerk of the wheel, a stab of the brake, a stab of the accelerator) that exceeds this grip and makes the car go. Smoothness, on the other hand, preserves grip.",
      erreur:
        "Braking in the middle of a bend on slippery ground. Braking + steering at the same time is too much for the tyres: the car keeps going straight or the rear breaks away.",
      bva: null,
    },
    C3d: {
      titre: "Emergency braking & grip (the ABS)",
      competence: "Tough conditions",
      methode: [
        "An obstacle appears. First move: you brake HARD, all the way, in one go. The brake first — it's the absolute priority.",
        "You keep your foot pressed down, without letting go. On a car with ABS (all modern driving-school cars), it's the ABS that stops the wheels from locking — you'll feel the pedal vibrate or 'tap-tap' under your foot: that's normal, you don't let go.",
        "You can steer at the same time. With ABS, you keep steering: you can brake all the way AND steer the car toward your escape route.",
        "You look at your escape route, not the obstacle. Where your eyes go, the car goes.",
        "Then you press the clutch — just before the engine stalls. The order matters: brake first, clutch after. You press the clutch so as not to stall and to keep control, but only once the braking is under way.",
        "Once the danger has passed: you release gradually and you go back to normal driving.",
      ],
      pourquoi:
        "In an emergency, the shortest way to stop is to brake as hard as possible. ABS lets you brake all the way without locking the wheels, and therefore without sliding straight ahead: you keep the ability to steer to avoid the obstacle. You press the clutch after, and not before, so as not to lose engine braking at the very start of the braking.",
      erreur:
        "Braking 'in jerks' or letting go of the pedal as soon as it vibrates, out of fear. The vibration IS the sign that the ABS is working: letting go lengthens the stopping distance and makes you lose the benefit of the system. Another mistake: pressing the clutch BEFORE braking — the order is brake first, clutch after.",
      bva: null,
    },
    C3e: {
      titre: "Expressway & motorway: getting on, driving, getting off",
      competence: "Tough conditions",
      methode: [
        "Getting on — Spot the merge: the combo of 'Give way' + no-left-turn signals a merging lane 9 times out of 10. As soon as you see it, get ready.",
        "Getting on — Merging in: put your left turn signal on.",
        "Getting on — Accelerate along the whole merging lane to reach a speed close to that of the traffic flow (in practice, at least 70-80). Short lane → you stay in 3rd (more pull); long lane → you can shift to 4th. NEVER stop at the end of the lane.",
        "Getting on — Check the left door mirror + a glance over your shoulder (blind spot) and pick the car in front of which you're going to slot in.",
        "Getting on — When the space is clear, merge in smoothly and cancel the turn signal. You don't slow down to merge: you hold your speed or accelerate.",
        "Driving along — Cruising: stay in the right-hand lane by default, even when the road widens to 3 lanes.",
        "Driving along — To overtake: check (interior mirror → door mirror → blind spot), left turn signal, you pull out, you don't slow down during the overtake, then you pull back to the right once you're past (right turn signal, new check).",
        "Driving along — Never stay alongside a heavy goods vehicle: you overtake it decisively.",
        "Getting off — Exiting: right turn signal ~200 m before your exit, after checking.",
        "Getting off — You do NOT brake on the motorway: you wait until you're on the deceleration lane, once you've exited, to slow down and change down gently.",
      ],
      pourquoi:
        "The motorway works on a fast, steady flow. The goal is to blend into it without breaking that flow: arrive at the right speed to merge, and slow down off to the side (deceleration lane) to leave it, without surprising anyone. That's also why you check the blind spot thoroughly: even when well placed, someone can slip through (a motorcyclist, a car forcing its way).",
      erreur:
        "Merging too slowly (or even stopping at the end of the acceleration lane): you force the cars to brake for you and you create a danger. A successful merge means arriving at THEIR speed. Another mistake: braking on the driving lane instead of waiting for the deceleration lane.",
      bva: null,
    },
    C3f: {
      titre: "Tunnels, bridges & special zones",
      competence: "Tough conditions",
      methode: [
        "Tunnel: before going in, turn on your low-beam headlights (never high beams in a tunnel).",
        "As soon as you enter: mentally note the nearest emergency exit and keep your distance.",
        "In the tunnel: no U-turns, no reversing, you keep your pace and your gap.",
        "In case of a forced stop / traffic jam: switch off the engine, and if there's a problem, head on foot toward the emergency exit you noted.",
        "Bridge / viaduct: as you approach an exposed bridge, hold your steering wheel firmly, anticipate a gust of side wind that can push you off course.",
        "At the end of the bridge: careful, the road surface can be more slippery (frost, moisture) than elsewhere.",
      ],
      pourquoi:
        "A tunnel is an enclosed space: you make yourself visible (lights) and you always keep an exit in mind. A bridge is a very exposed space: the wind can push you all at once, hence the firm grip on the wheel.",
      erreur:
        "Entering a tunnel without turning on your lights (you 'can still see' at the entrance but you become invisible deep inside) — or letting go of the wheel when leaving a bridge, right at the moment the gust hits.",
      bva: null,
    },
    C3g: {
      titre: "Dense city: sharing the road with pedestrians, bikes and buses",
      competence: "Tough conditions",
      methode: [
        "Ease off. In a dense city, a reduced pace is your number-one safety margin: it gives you time to react to whatever appears. Speed bumps, you take them in 2nd, gently.",
        "Look far AND wide. You scan the pavements, between parked cars, in front of stopped buses — a pedestrian can appear anywhere, especially behind a bus that blocks the view (the classic trap: they step right onto the crossing, hidden by the bus).",
        "Before every manoeuvre (turning, pulling back in, parking): check your blind spot over your shoulder. A bike or a scooter weaving between you and the pavement hides there easily. Even simply pulling away at a light deserves a glance.",
        "When you overtake a bike: leave at least 1 metre of space (1.50 m outside town) and slow down. If you're already too close when you spot it, you don't overtake: you ease off and you wait.",
        "At a pedestrian crossing: slow down and always give way to the pedestrian, even one who's taken a single step onto it. As long as you're not sure there's no one, you don't accelerate.",
        "Bus lane: you don't drive in it (unless allowed by road markings); watch out for a bus pulling away from its stop, it has right of way — you ease off and you let it go.",
      ],
      pourquoi:
        "In a dense city, the danger doesn't come from speed but from the unexpected: a pedestrian between two cars, a bike in your blind spot, a door opening, a pedestrian hidden behind a bus. Driving slowly and looking everywhere is what gives you time to stop in time. An instructor puts it another way: your driving 'attracts' what your decisions cause — one hesitation too many and you find yourself stuck behind a cyclist you can no longer overtake.",
      erreur:
        "Forgetting to check the blind spot over your shoulder before turning right: a cyclist coming up on your right is invisible in the mirror, and that's the classic 'car turning / bike going straight' accident. Another trap: pulling out in front of a stopped bus without imagining the pedestrian crossing hidden behind it.",
      bva: null,
    },
    C4a: {
      titre: "Plan your route before turning the key",
      competence: "Independent",
      methode: [
        "Look at your whole route on the GPS, not just the start and the finish.",
        'Spot 2-3 visual landmarks along the way: "after the McDonald\'s I turn", "the big petrol station, that\'s where I get off". It reassures you if the GPS glitches.',
        "Plan a backup route in case a road is closed or blocked.",
        "Check the conditions: weather, live traffic, announced roadworks.",
        "Spot the tricky spots in advance: big interchanges, tolls, city entrances, closely spaced exits.",
        "Plan your breaks if the trip is long: a break of about 15 minutes every 2 hours.",
        "Set everything up BEFORE you set off: GPS programmed, phone stowed, seat and mirrors ready.",
      ],
      pourquoi:
        "A prepared trip means a free mind for the road. Instructors tell it to those who are scared to drive off alone: if you've spotted your landmarks and you know you have a backup GPS and that you can always stop, you see that you actually have plenty of solutions at hand. You're not hunting for your exit in a panic at the last moment.",
      erreur:
        'Setting off "on a whim" and programming the GPS once you\'re already moving. You take your eyes off the road at the worst moment, and you discover the difficulties at full speed.',
      bva: null,
    },
    C4b: {
      titre: "Follow a route without taking your eyes off the road",
      competence: "Independent",
      methode: [
        "Program and set up your GPS while stopped (audible volume, screen well positioned).",
        "Listen to the voice rather than staring at the screen: let the GPS talk to you.",
        "Read the direction signs from far away. A tip instructors keep repeating: the LOWER a town's name is on the sign, the CLOSER its exit is. You get ready for your exit well ahead.",
        "Anticipate the exit or the lane change: you take in the info early (interior mirror, exterior mirror, turn signal), and you move over smoothly. If you have to cross several lanes, you start as early as possible.",
        "Don't lose your speed when changing lanes: you glide over to the next lane without braking for nothing.",
        "The road stays priority over the screen. If in doubt between what the GPS says and what's really on the road, you follow the road and the signs.",
      ],
      pourquoi:
        "The GPS is a help, not a driver. You're the one driving. Your eyes stay outside, on the road and the signs. Reading a sign early gives you the time to get into position without lunging for your exit.",
      erreur:
        'Missing your exit and trying to "make up for it": braking sharply, reversing, or cutting back across by force. On a motorway or fast road, you NEVER reverse and you don\'t stop for that.',
      bva: null,
    },
    C4c: {
      titre: "Drive smoothly to burn less fuel (eco-driving)",
      competence: "Independent",
      methode: [
        "Set off gently: no stab of the accelerator at the start.",
        "Shift up early to run at low revs. Sound cue first: you change when you feel \"the engine climbing\", without pushing it. Rough number as a guide: around 2000 rpm in a diesel, 2500 rpm in a petrol. On a nice clear straight, don't hesitate to go up to 5th/6th: it's more economical.",
        "Drive at low revs: an engine turning calmly uses less.",
        "Use engine braking: when you see you're going to slow down (light, roundabout, 70 zone), you lift off early and let the car slow down on its own. You brake less.",
        'If you have to stop, brake "progressively easing off": a bit firmer at first, then you release gently at the end of the braking. You stop right on the mark, smoothly, without jolting your passengers — instead of arriving fast and braking hard at the last second.',
        "Keep a steady speed: stabs of the accelerator and the brake are wasted fuel.",
        "Switch off the engine if you're stopped for a while (except in traffic, where the car's stop & start handles it).",
      ],
      pourquoi:
        "Smooth driving means up to about 20% fuel saved, a car that wears less, and passengers who aren't thrown around. Bonus: on the test, eco-driving (shifting at the right time, anticipating, not stalling, controlling the brake) is one of the skills being marked.",
      erreur:
        "\"Unanticipated\" braking: you arrive fast at a light or a roundabout, you haven't lifted off, and you brake hard at the last second. It's bad for fuel use, bad for your passengers, and unsafe for those behind you. Smoothness beats jerkiness.",
      bva: null,
    },
    C4d: {
      titre: "Anticipate danger and stay calm at the wheel",
      competence: "Independent",
      methode: [
        "Look far ahead: your gaze reaches 15-20 seconds ahead, not onto the bonnet.",
        "Scan continuously: mirrors, ahead, sides, ahead. You take in the information before it becomes a problem.",
        "Keep your safety distances: the 2-second rule with the car ahead (4 seconds in the rain).",
        "Imagine the reasonable worst case: a pedestrian darting out, a door opening, a car braking. You're ready before it happens.",
        'Have "hazard awareness": at a blind intersection (hidden by buildings, parked cars), you actively try to see by inching forward gently, foot ready to brake. You don\'t tell yourself "well, I didn\'t see anything, off I go".',
        "Breathe and stay composed: if someone stresses you or tailgates you, you don't respond to the aggression. You let it go.",
      ],
      pourquoi:
        'A driver who anticipates rarely brakes in an emergency. Seeing far and early means having the time to decide calmly instead of reacting in a panic. Instructors say that hazard awareness "can be felt": that\'s exactly what the examiner wants to see, a driver who senses the risk and adjusts their speed instead of charging ahead.',
      erreur:
        'Fixing on the car right in front (short gaze) and getting caught out by everything happening further away. Or letting irritation take over and driving "to get back at" another driver.',
      bva: null,
    },
    C4e: {
      titre: "Sharing the road with the most vulnerable",
      competence: "Independent",
      methode: [
        "Spot vulnerable road users early: pedestrians, cyclists, e-scooters, two-wheelers.",
        "To overtake a cyclist, leave a gap: 1 m in town, 1.5 m outside built-up areas. If you can't, you wait.",
        "Slow down and anticipate in 30 zones, near schools, near bus stops. The pedestrian has priority.",
        "A pedestrian waiting to cross already has priority: you don't wait for them to have set a foot on the road. If they're at a pedestrian crossing and want to cross, you let them go.",
        "Check your blind spots before every manoeuvre: a bike or an e-scooter hides in them quickly.",
        "Stay courteous: a look, a wave of the hand, you give way without forcing it. Speed comes after safety.",
      ],
      pourquoi:
        "The more vulnerable the road user, the more an error costs them. You anticipate THEIR mistakes, because you're the one with the bodywork around you. On the test, letting a priority pedestrian go isn't even \"courtesy\": it's an obligation. Not doing it is an automatic fail.",
      erreur:
        'Overtaking a cyclist "right up close" without changing your line, or pulling away sharply at a pedestrian crossing as soon as the light turns green without checking that there\'s no one left. Watch out for the opposite too: stopping to "let through" someone who does NOT have priority (your light is green, theirs is red) is an unjustified and dangerous stop — so a fault.',
      bva: null,
    },
    C4f: {
      titre: "Tackling the practical test without panicking",
      competence: "Independent",
      methode: [
        "Set up your driving position like in practice: seat (height, depth, backrest, headrest), steering wheel, mirrors, seatbelt. No fixed order for the mirrors. If you readjust your seat, readjust your mirrors afterwards.",
        "Make the car safe: check that everyone is belted in, that the doors are closed (no warning light), no red warning light on the dashboard. It's an easy point.",
        "The checks are 3 free points. The examiner asks you for the last two digits of the odometer, then asks you 3 questions tied to that number: 1 check question (interior OR exterior, drawn at random); 1 road-safety question; 1 first-aid question (general, not necessarily driving-related). Each correct answer = 1 point. It's not an automatic fail, but don't let them slip away: you can miss your licence by a single point.",
        "Listen carefully to the examiner's instruction and drive as usual. You can ask them to repeat if you didn't understand.",
        "Drive your own drive, not the examiner's: you keep your checks, your turn signals, your distances, your pace.",
        "Also listen to their remarks along the way: they're there to help you, not to sink you. You correct and you carry on.",
        "If you make a small mistake, you carry on calmly. A minor fault doesn't ruin everything.",
        "Requested manoeuvre: you take your time, slow speed, look everywhere (direct vision, not just the mirrors). Don't forget the turn signal BEFORE you stop for the manoeuvre, not after.",
      ],
      pourquoi:
        'The examiner assesses your safety and your independence, not perfection. They want to see a driver who manages on their own without putting anyone in danger. Many students "stop hearing" the examiner, they\'re so stressed, and go in already beaten when they actually had it. Remarks during the test are often kindness meant to help your driving mature — and some "faults" you think are serious aren\'t for them.',
      erreur:
        'Freezing or giving up after a small fault ("that\'s it, I\'m done for, I\'m too stressed"), when the test is actually going very well. Or driving in an unusual way (too slow, too tense) to "look good", which is exactly what creates mistakes.',
      bva: null,
    },
    C4g: {
      titre:
        "Getting off to a good start as a new driver (probationary period)",
      competence: "Independent",
      methode: [
        'Stick your "A" disc on the back: for 3 years on the standard path, 2 years if you did accompanied driving (AAC).',
        "Respect the reduced new-driver speeds: 110 km/h on the motorway, 100 km/h on fast roads (separated carriageways), 80 km/h on roads outside built-up areas.",
        "Zero alcohol, or nearly: 0.2 g/l of blood max as a new driver (in practice, you don't drink if you're driving).",
        "Look after your points balance: you start with 6 points, which climb to 12 if you lose nothing during the period.",
        "Keep driving smartly, even after the licence. The licence lets you drive, it doesn't force you to rush: if you're not comfortable, do short easy trips at first, prepare your routes, and keep the good habits from your lessons (anticipation, distances, no phone). The first months alone are the riskiest.",
      ],
      pourquoi:
        'The first years alone at the wheel are the most dangerous: you no longer have the instructor beside you. The "A" disc and the reduced speeds leave a margin while experience builds up. Instructors reassure those who are scared to drive alone: the licence is a right, not an obligation to head into the city centre on a Friday night the next day. You go at your own pace.',
      erreur:
        'Feeling "free" the moment you have the licence in hand and dropping the good habits (speed, phone, distances). A single big offence can make the brand-new licence vanish.',
      bva: null,
    },
  },
  ar: {
    C1a: {
      titre: "التعرّف على مقعد القيادة",
      competence: "التحكم",
      methode: [
        "قم بجولة سريعة حول السيارة: لا شيء تحت العجلات، الإطارات ليست فارغة الهواء، الأضواء واللوحات نظيفة.",
        "استقرّ في مقعدك، أغلق الباب، وتأكّد من أنه مُغلق جيداً.",
        "حدّد أماكن الأدوات على لوحة القيادة دون تشغيل المحرك: عدّاد السرعة، مؤشّر الوقود، أضواء التنبيه.",
        "حدّد الذراعين خلف المِقود: الذراع الأيسر = إشارات الانعطاف (والأضواء المنخفضة/العالية، ووميض الأضواء)؛ الذراع الأيمن = المساحات (وغسّالة الزجاج).",
        "حدّد الدوّاسات: على اليسار الدبرياج (القابض)، في الوسط الفرامل، على اليمين دوّاسة الوقود.",
        "أدر مفتاح التشغيل (دون تشغيل المحرك) وراقب أضواء التنبيه: تُضيء ثم تنطفئ. إذا بقي أحدها مُضاءً (الزيت، البطارية، الفرامل)، فأبلغ عن ذلك.",
      ],
      pourquoi:
        "يجب أن تكون قادراً على تشغيل إشارة الانعطاف أو المساحات دون أن ترفع عينيك عن الطريق. إذا بحثت عن أداة أثناء القيادة، فلن تعود تنظر إلى الأمام.",
      erreur:
        "الخلط بين الذراعين وتشغيل المساحات بدلاً من إشارة الانعطاف. قاعدة بسيطة: إشارة الانعطاف على اليسار، المساحات على اليمين.",
      bva: "لا توجد دوّاسة دبرياج: عند قدميك يوجد فقط الفرامل (يسار) ودوّاسة الوقود (يمين)، كلاهما للقدم اليمنى. بدلاً من عتلة السرعات، تجد المُبدّل P / R / N / D. الذراعان (إشارة الانعطاف على اليسار، المساحات على اليمين) لا يتغيّران.",
    },
    C1b: {
      titre: "ضبط مقعد القيادة",
      competence: "التحكم",
      methode: [
        "المقعد — المسافة (العمق): حرّك المقعد للأمام/للخلف حتى تتمكّن قدمك اليسرى من ضغط الدبرياج حتى النهاية مع بقاء ساقك مثنيّة قليلاً (وليست ممدودة تماماً). كثير من المتعلّمين يجلسون بعيداً جداً «ليكون لديهم مكان»: إذا اضطررت إلى مدّ ساقك، فاقترب.",
        "المقعد — الارتفاع: اضبطه لترى الطريق دون أن تجهد رقبتك. علامة عملية من المدرّب: أنزل واقية الشمس — إذا رأيت الطريق تحتها، فمستوى نظرك صحيح؛ وإذا حجبت الواقية الطريق، فأنت منخفض جداً.",
        "المسند: يُضبط وفق طريقة الإمساك بالمِقود — عندما تكون يداك على المِقود، يجب أن يبقى ذراعاك مثنيَّين قليلاً (لا قريبين جداً ولا بعيدين جداً).",
        "مسند الرأس: يكون أعلى مسند الرأس بمستوى أعلى الجمجمة.",
        "المِقود: اضبطه إذا لزم الأمر (المقبض تحت المِقود) بحيث لا يعيق ركبتيك وتستطيع رؤية عدّاد السرعة فوقه بوضوح.",
        "المرايا: الداخلية أولاً، باليد اليمنى، دون رفع كتفيك عن المقعد — يجب أن ترى الزجاج الخلفي كله بنظرة واحدة، دون تحريك رأسك. ثم الخارجيتان: لا ترى سوى جزء صغير من سيارتك في الأسفل، والباقي هو الطريق (الهدف ~90 % من الطريق، وهيكل سيارتك مجرّد علامة مرجعية).",
        "حزام الأمان: يمرّ فوق الكتف (لا الرقبة) وعلى الحوض (لا البطن)، مستوياً، غير ملتوٍ.",
      ],
      pourquoi:
        "مقعد مضبوط بشكل سيّئ = لا تستطيع ضغط الدبرياج حتى النهاية (خطر إطفاء المحرك) وتتعب بسرعة. ثلاثون ثانية من الضبط = الدرس كله أكثر راحة وأماناً.",
      erreur:
        "ضبط المقعد بعيداً جداً «ليكون لديك مكان»: الساق اليسرى ممدودة ولم تعد تضغط الدبرياج حتى النهاية ← يتوقّف المحرك دون أن تفهم السبب.",
      bva: "بما أنه لا يوجد دبرياج، فإن علامة «الساق اليسرى المثنيّة قليلاً على الدبرياج» لا تنطبق. تضبط المسافة بحيث تصل قدمك اليمنى إلى الفرامل ودوّاسة الوقود دون مدّ ساقك، وتُريح قدمك اليسرى في وضع الراحة (على مسند القدم على اليسار). الارتفاع، المسند، المِقود، المرايا، حزام الأمان: كما هي.",
    },
    C1c: {
      titre: "الإمساك بالمِقود والحفاظ على المسار",
      competence: "التحكم",
      methode: [
        "ضع يديك كما على الساعة: عند 9 و3 (وضعية «الربع بعد التاسعة»)، مع وضع الإبهامين على حافة المِقود، لا ملفوفين تحته.",
        "انظر بعيداً إلى الأمام، لا إلى غطاء المحرك: نظرتك «تجرّ» السيارة نحو حيث تريد الذهاب.",
        "أدر المِقود بأسلوب السحب والدفع دون تقاطع اليدين: يد تسحب والأخرى تدفع/تُرافق.",
        "لا تقاطع يديك إلا في المناورات البطيئة (الركن الموازي، الدوران الكامل)، أبداً في السرعة العادية.",
        "دع المِقود يعود مع الإمساك به بعد المنعطف — لا تتركه ليدور من تلقاء نفسه.",
        "علامة «كم دورة يدور المِقود؟»: يدور المِقود نحو دورة ونصف في كل اتجاه (دورة كاملة + نصف دورة للوصول إلى النهاية). لتعرف هل عجلاتك مستقيمة بعد لفّ كامل، افعل العكس تماماً.",
        "علامة «أدر مِقودك نحو الجهة التي تريد الذهاب إليها»: بدلاً من أن تضيع بين اليمين واليسار (خاصة في الرجوع للخلف)، تدير المِقود نحو الجهة التي تريد أن تقترب منها السيارة، في السير للأمام كما في الرجوع للخلف.",
      ],
      pourquoi:
        "نظرتك توجّه يديك. إذا حدّقت في غطاء المحرك أو في عائق، فستتّجه نحوه مباشرة. وإذا نظرت بعيداً حيث تريد الذهاب، فسيصبح مسارك مستقيماً بشكل طبيعي.",
      erreur:
        "القيادة بـ«ذراعين متقاطعين» طوال الوقت أو الإمساك بالمِقود بيد واحدة في الأعلى: تفقد الدقة والقوة اللازمة للتفاعل بسرعة. فخّ شائع آخر في المناورة: بمجرّد أن تنحرف السيارة قليلاً، لفّ المِقود في كل الاتجاهات «للتدارك» ← تضيع تماماً. الردّة الصحيحة: تقدّم ببطء، راقب أين تتّجه السيارة، ثم صحّح بلطف.",
      bva: null,
    },
    C1d: {
      titre: "الانطلاق والتوقّف بسلاسة",
      competence: "التحكم",
      methode: [
        "قبل الانطلاق — قبل تشغيل المحرك: فرملة اليد مشدودة، العتلة في الوضع المحايد، الدبرياج مضغوط حتى النهاية، أدر مفتاح التشغيل.",
        "قبل الانطلاق — ضع السرعة الأولى.",
        "نقطة الالتقام — ابحث عن منطقة الالتقام: ارفع الدبرياج وتجاوز بسرعة «المنطقة الميتة» (بين الدوّاسة المضغوطة وبداية الالتقام)، ثم أبطئ الحركة بمجرّد أن يستجيب المحرك.",
        "نقطة الالتقام — عند الالتقام، أعطِ قليلاً من الوقود وارفع قدمك اليسرى تدريجياً (السيارة «تريد» التقدّم، وصوت المحرك يتغيّر قليلاً).",
        "نقطة الالتقام — حرّر فرملة اليد، فتتقدّم السيارة.",
        "التوقّف ووضع القدم — للتوقّف: ارفع قدمك عن الوقود مبكراً، افرمل تدريجياً، واضغط الدبرياج قبل التوقّف الكامل مباشرة كي لا يتوقّف المحرك.",
        "التوقّف ووضع القدم — عند التوقّف: أبقِ الفرامل مضغوطة، ثم الوضع المحايد + فرملة اليد إذا بقيت متوقّفاً.",
        "التوقّف ووضع القدم — وضع القدم: اضغط بمقدّمة القدم، مع تثبيت الكعب على الأرض، وأزلق الكعب على الأرض لرفع الدبرياج. إذا رفعت كعبك أو انزلق نعل حذائك، فستفقد الدقة ولن تجد نقطة الالتقام في المكان نفسه.",
      ],
      pourquoi:
        "نقطة الالتقام (أو بالأحرى منطقة الالتقام) هي اللحظة التي يبدأ فيها الدبرياج بنقل قوة المحرك إلى العجلات. رفعه بسرعة كبيرة في تلك اللحظة = تنتفض السيارة أو يتوقّف محرّكها. ورفعه بسلاسة = انطلاق نظيف.",
      erreur:
        "رفع الدبرياج دفعة واحدة عند نقطة الالتقام ← يتوقّف المحرك أو ينطلق بتشنّج. وضغط الدبرياج متأخراً جداً عند الفرملة ← يتوقّف المحرك قبل التوقّف مباشرة.",
      bva: "لا نقطة التقام، لا دبرياج، لا سرعة أولى تُدخِلها. للانطلاق: القدم على الفرامل، المُبدّل على D، ترفع قدمك عن الفرامل فتتقدّم السيارة من تلقاء نفسها (على السرعة البطيئة)، ثم تسرّع بلطف. للتوقّف: تفرمل تدريجياً بقدمك اليمنى حتى التوقّف — لا خطر لإطفاء المحرك. عند التوقّف الطويل، تنتقل إلى P وتشدّ فرملة اليد.",
    },
    C1e: {
      titre: "التحكّم بدوّاسة الوقود والفرامل",
      competence: "التحكم",
      methode: [
        "سرّع تدريجياً بمقدّمة القدم: القدم اليمنى تضغط بلطف، دون أي حركة مفاجئة.",
        "تدرّب على الثبات عند دورات مختلفة (مثلاً ~1000، ~1500، ~2500 دورة/الدقيقة): كلما ضغطت أكثر، ارتفعت دورات المحرك؛ وإذا تجاوزت الدورات المستهدفة، خفّف قليلاً دون رفع القدم تماماً، ثم أعد الضبط. هذا التحكّم «بالتدرّج» يمكن التمرّن عليه حتى في حالة التوقّف.",
        "انظر بعيداً لترى التباطؤات قادمة مسبقاً.",
        "للتباطؤ، ارفع قدمك عن الوقود أولاً (كبح المحرك يقوم بجزء من العمل مسبقاً).",
        "ثم افرمل على مرحلتين (فرملة متدرّجة): ضغطة أولى أقوى للتباطؤ، ثم ضغطة أخفّ لكبح السيارة، تُرفَع قبل التوقّف مباشرة. تتحكّم بدوّاسة الفرامل (قليلاً أكثر، قليلاً أقل).",
        "أبقِ قدمك اليمنى خفيفة: القدم الثقيلة = حركات مفاجئة، استهلاك زائد للوقود، ركّاب متأرجحون.",
      ],
      pourquoi:
        "القيادة السلسة هي التوقّع المسبق: إذا نظرت بعيداً، فلن تضطر أبداً إلى الفرملة بعنف. مكافأة: ركّاب مرتاحون، وقود أقل، علامة أفضل في الامتحان.",
      erreur:
        "القيادة «كالأكورديون»: تسريع قوي ثم فرملة قوية، بشكل متكرّر، لأنك تنظر قريباً جداً. تُتعب الجميع وتستهلك السيارة.",
      bva: "بما أن القدم اليمنى نفسها تخدم الفرامل ودوّاسة الوقود، فإن التحكّم يتم بقدم واحدة: ترفعها عن الوقود، وتضعها على الفرامل، دون استخدام الاثنين معاً أبداً. في وضع D، تستمرّ السيارة في التقدّم من تلقاء نفسها على السرعة البطيئة بمجرّد رفعك للفرامل — تذكّر أن تبقيها مضغوطة لتبقى ثابتاً على المنحدر.",
    },
    C1f: {
      titre: "تغيير السرعة في الوقت المناسب",
      competence: "التحكم",
      methode: [
        "استمع إلى دورات المحرك أو راقبها. العلامة الصوتية أولاً («المحرك يرتفع»)؛ أرقام تقريبية: ~2000 دورة/الدقيقة في الديزل، ~2500 في البنزين.",
        "لتغيير السرعة: ارفع قدمك عن الوقود، اضغط الدبرياج حتى النهاية، حرّك العتلة، ارفع الدبرياج بسلاسة (على مرحلتين)، ثم عد إلى الوقود.",
        "أمسك العتلة جيداً: براحة يدك موضوعة على مقبض العتلة، لا بأطراف أصابعك ولا بقبضة قوية. لا حاجة إلى قوة: المهمّ هو وضعية اليد.",
        "استفد من نابض الإرجاع: تعود العتلة دائماً إلى الوضع المحايد (بين الثالثة والرابعة) من تلقاء نفسها. ضع يدك على الجهة اليمنى من الوضع المحايد للسرعات اليمنى (5/6 + الرجوع للخلف حسب الطُرُز) وإلى الأمام/الخلف للسرعات 1/2/3/4 لمواجهة هذا النابض.",
        "أبقِ عينيك على الطريق، لا على العتلة: أنت تشعر بالسرعات بيدك.",
        "خفّض السرعة قبل المنعطف أو الفرملة، وليس أثناءهما — وتخفّض السرعة لأنك أبطأت مسبقاً، لا لكي تُبطئ. تختار السرعة المناسبة ليكون لديك تسارع عند الخروج.",
        "لاءم السرعة مع الوتيرة: عالية جداً عند السرعة المنخفضة = المحرك «يسعل»؛ منخفضة جداً عند السرعة العالية = المحرك «يصرخ». تتوقّف على السرعة الثانية، لا الأولى (ثم تعود إلى الأولى للانطلاق من جديد).",
      ],
      pourquoi:
        "السرعة المناسبة هي التي تُبقي المحرك مرتاحاً: لا يجهد ولا يندفع. تخفيض السرعة قبل المنعطف يترك لك تسارعاً لتسرّع بنظافة عند الخروج.",
      erreur:
        "النظر إلى العتلة أثناء تغيير السرعة (لم تعد تنظر إلى الطريق) وإطفاء المحرك عند التخفيض لأنك ترفع الدبرياج بسرعة كبيرة عند دورات منخفضة. واختيار سرعة خاطئة بسبب وضعية يد سيّئة (تستهدف الرابعة فتُدخِل الثانية): خطأ في علبة السرعات غالباً ما يكون سبباً للرسوب في الامتحان.",
      bva: "لا يوجد تغيير للسرعة تقوم به: علبة السرعات تفعل ذلك عنك. لا دبرياج، لا عتلة سرعات: تبقى في وضع D وتدير كل شيء بدوّاسة الوقود. هذه البطاقة (رفع/تخفيض السرعة يدوياً) لا تخصّ متعلّماً على علبة سرعات أوتوماتيكية — وخطر الخطأ المُرسِّب في علبة السرعات غير موجود. من الجيّد معرفته: بعض السيارات الأوتوماتيكية توفّر وضعاً يدوياً (+/-)، لكنه غير مطلوب في بداية التعلّم.",
    },
    C1g: {
      titre: "الفحوصات قبل الانطلاق (جولة حول السيارة)",
      competence: "التحكم",
      methode: [
        "الإطارات: ليست فارغة الهواء بالعين، لا شقوق، المطّاط ليس مهترئاً كثيراً (مؤشّر التآكل).",
        "الأضواء: أشعلها واطلب فحص المصابيح (المنخفضة/العالية)، إشارات الانعطاف، أضواء الفرملة، أضواء الرجوع للخلف.",
        "الزجاج، المرايا، اللوحات، المصابيح: نظيفة، لا شيء مكسور، رؤية جيدة.",
        "مستويات السوائل (إذا طُلب): تستطيع أن تُظهر أين يوجد زيت المحرك، سائل غسل الزجاج، سائل التبريد.",
        "في الامتحان: يطلب منك المُمتحِن فحصاً واحداً (داخلياً أو خارجياً) + سؤالاً عن السلامة المرورية + مفهوماً في الإسعافات الأولية. تُظهر/تشرح بهدوء.",
      ],
      pourquoi:
        "سيارة غير مفحوصة جيداً هي خطر يتحرّك: إطار أملس يفرمل بشكل سيّئ، ضوء معطّل = لا يراك أحد. الجولة حول السيارة عشر ثوانٍ تمنع حادثاً.",
      erreur:
        "تلاوة قائمة عن ظهر قلب دون إظهار أي شيء. في الامتحان كما في الواقع، يُتوقّع منك أن تشير إلى العنصر («سدادة الزيت هنا») وأن تقوم بالحركة.",
      bva: null,
    },
    C1h: {
      titre: "إتقان مناورات الامتحان (الركن الموازي، الدوران الكامل، الركن)",
      competence: "التحكم",
      methode: [
        "الأنواع الستة (يفرض المُمتحِن واحداً منها): الرجوع للخلف في خط مستقيم، الرجوع للخلف في منحنى، الركن المائل، الدوران الكامل (في 3 أو 5 أو 7 حركات)، الركن العمودي، الركن الموازي.",
        "المفتاح الحقيقي لكل المناورات: معرفة كيف تحرّك سيارتك في الرجوع للخلف (يميناً، يساراً). ولا تكون لك أبداً أولوية المرور أثناء المناورة: تؤمّن الوضع أولاً وتترك كل مستخدم للطريق يقترب يمرّ.",
        "قواعد مشتركة — أمّن الوضع: إشارة الانعطاف قبل التوقّف، فحص بزاوية 360° (المرايا + الرؤية المباشرة)، تترك الآخرين يمرّون.",
        "قواعد مشتركة — أبطأ وتيرة ممكنة: لست مؤقّتاً بالساعة.",
        "قواعد مشتركة — أدِر المسافات: لا تحتكّ بالسيارات المجاورة.",
        "قواعد مشتركة — يمكنك أن تستند إلى الرصيف، لكن لا تصعد فوقه أبداً (اصطدام/صعود الرصيف = رسوب).",
        "قواعد مشتركة — فحص بزاوية 360° أثناء المناورة، بانتظام.",
        "قواعد مشتركة — في النهاية: الوضع المحايد + فرملة اليد، السيارة مثبّتة جيداً.",
        "الركن الموازي — قف بمحاذاة السيارة أمام المكان (مرآة بمقابل مرآة)، إشارة الانعطاف اليمنى، على مسافة جانبية جيدة.",
        "الركن الموازي — أدخِل الرجوع للخلف، افحص، اترك الآخرين يمرّون إذا لزم الأمر.",
        "الركن الموازي — أعطِ ربع لفّة صغيرة من المِقود إلى اليمين واذهب «للبحث» عن المكان بالرجوع للخلف ببطء شديد (إذا كان هناك 2-3 أماكن فارغة خلفك، فاستفد من كل المساحة).",
        "الركن الموازي — ارجع للخلف مع الاقتراب بلطف نحو الرصيف، دون الاصطدام به. حيلة: يمكنك طيّ المرآة اليمنى لرؤية الرصيف بشكل أفضل — تذكّر أن تعيدها قبل الانطلاق.",
        "الركن الموازي — ضع السرعة الأولى، لُفّ إلى اليمين وتقدّم بلطف لتصطفّ بشكل موازٍ، ثم قوّم العجلات بسرعة بمجرّد أن تصبح مستقيماً.",
        "الركن العمودي / المائل للخلف — عُدّ الأماكن انطلاقاً من هدفك («عُدّ 3-4 خانات») وتوقّف بمحاذاته، مع النظر أمامك أيضاً بين كل خانة.",
        "الركن العمودي / المائل للخلف — ارجع للخلف، لُفّ حتى النهاية نحو جهة المكان، افحص بزاوية 360°.",
        "الركن العمودي / المائل للخلف — علامة عامة: عندما تلتفت، فإن أول ضوء / أول حافة للسيارة المجاورة هو ما يجب أن يظهر (نحو البداية، وفي أقصى الأحوال منتصف زجاجك الخلفي). إذا استهدفت الضوء الثاني، فأنت تبتعد كثيراً.",
        "الركن العمودي / المائل للخلف — ارجع ببطء، وانتظر حتى تصبح مستقيماً قبل تقويم العجلات (نصف لفّة + لفّة كاملة).",
        "الركن العمودي / المائل للخلف — لا تعتمد على الأماكن المجاورة لتصطفّ: تخيّل أن خط مكانك يمتدّ وسِر بمحاذاته.",
      ],
      pourquoi:
        "مفتاح المناورة ليس القوة، بل البطء. كلما سرت أبطأ، كان لديك وقت أكثر للفّ المِقود والتصحيح. سرعة بطيئة + لفّ حاسم.",
      erreur:
        "السير بسرعة كبيرة واللفّ متأخراً جداً. النتيجة: تصعد على الرصيف أو تلمس السيارة. المطلوب هو العكس: أبطئ تماماً، ولُفّ مبكراً وبحزم. فخّ آخر: التحديق في مكانك والالتفات مبكراً جداً بدلاً من عدّ خاناتك والبقاء مستقيماً ← تنطلق منحرفاً.",
      bva: "في الرجوع للخلف، تضع المُبدّل على R. لا دبرياج تتحكّم به: ترجع السيارة للخلف من تلقاء نفسها على السرعة البطيئة بمجرّد رفعك للفرامل، لذا تضبط بطأك بالفرامل (تفرمل قليلاً للتباطؤ، وترفع للتقدّم). تُبقي قدمك اليمنى على الفرامل/دوّاسة الوقود وتستطيع اللفّ بهدوء. غالباً ما يكون أسهل من علبة السرعات اليدوية (لا خطر لإطفاء المحرك في وسط المناورة).",
    },
    C1i: {
      titre: "أداء المناورات المتتالية باستقلالية",
      competence: "التحكم",
      methode: [
        "حلّل الوضع: أي مناورة يتطلّبها المكان (ركن موازٍ، ركن عمودي، ركن مائل، دوران كامل)؟",
        "اختر بنفسك المناورة الصحيحة والجهة الصحيحة (تذكير: الركن الموازي/العمودي على اليسار فقط في الاتجاه الواحد، وإلا تجد نفسك في الاتجاه المعاكس).",
        "أعلن وأمّن: إشارة الانعطاف قبل التوقّف، فحص المرايا + النقطة العمياء + الرؤية المباشرة؛ ليست لك أولوية المرور، تترك الآخرين يمرّون.",
        "نفّذ ببطء، مستخدماً علاماتك الخاصة (التي علّمك إياها مدرّبك) — مع الحفاظ على الإجراء نفسه في كل مرة كي تتمكّن من التصحيح.",
        "إذا فشلت، صحّح دون ذعر: قوّم وضعك (المِقود مستقيم، العجلات مستقيمة)، حدّد أي جهة لديك فيها مساحة، وأعِد السيارة نحو تلك الجهة. تصحيح نظيف أفضل من الإصرار بالقوة.",
      ],
      pourquoi:
        "في الامتحان، لا يوجّهك المُمتحِن. هذه المهارة تُثبت أنك تقرّر وتصحّح بنفسك — هذا هو معنى أن تكون جاهزاً للعالم الثاني.",
      erreur:
        "انتظار «إشارة» المدرّب لكل حركة. ما دمت تعتمد على التوجيه، فالمناورة لم تُتقَن بعد. الفخّ الآخر: الذعر بمجرّد ألا تكون المناورة مثالية من المحاولة الأولى بدلاً من إعادة التموضع بهدوء.",
      bva: "المناورات نفسها، والاستقلالية نفسها متوقّعة. تدير الاتجاه بالمُبدّل (D للتقدّم، R للرجوع) وبطأك بالفرامل بدلاً من الدبرياج. عدم إمكانية إطفاء المحرك يساعدك على البقاء هادئاً عند التصحيح.",
    },
    C2a: {
      titre: "اقرأ الطريق بعينيك",
      competence: "السير",
      methode: [
        "وجّه نظرك إلى منتصف ارتفاع الزجاج الأمامي: هذا يجبرك على النظر بعيداً ورؤية الأمور قادمة بدل أن تفاجئك.",
        "أبقِ عينك متحركة: يتنقّل نظرك إلى مكان آخر كل ثانية تقريباً. النقطة التي تحدّق فيها طويلاً تعني كمّاً كبيراً من المعلومات يفوت دماغك.",
        'حرّك رأسك، لا عينيك فقط: كي "تصوّر" محيطك جيداً، أدِر رأسك فعلاً (الأرصفة، مداخل المرائب، التقاطعات، المركبات المركونة).',
        "عُد إلى مرآتك بانتظام: نظرة إلى المرآة الداخلية كل 5 إلى 7 ثوانٍ تقريباً.",
        "أعِد نظرك بعيداً. تطرح على نفسك سؤالين بشكل متكرّر: «أين أنا الآن؟» و«إلى أين أريد أن أذهب؟».",
      ],
      pourquoi:
        "أنت تقود بعينيك قبل أن تقود بيديك. يلخّصها أحد المدرّبين جيداً: النظر يشكّل نحو 80% من القيادة. إذا كان نظرك سيّئ التوجيه، فمسارك خاطئ مهما فعلت بيديك. وكلما وجّهت نظرك إلى أماكن مختلفة، أعاد دماغك بناء صورة كاملة ودقيقة للمشهد (المسافات، الأشكال، المخاطر).",
      erreur:
        "التحديق في غطاء المحرك، أو السيارة التي أمامك مباشرة، أو نقطة واحدة لوقت طويل. النتيجة: تكتشف كل شيء في اللحظة الأخيرة وتفرمل في حالة ذعر. علاج المدرّبين هو القيادة المعلّقة: تقول بصوت عالٍ ما تراه («ممر مشاة، انحناء رصيف، لوحة 50»). هذا يجبر العين على البحث عن الإشارات والتوقّع.",
      bva: null,
    },
    C2b: {
      titre: "اضبط سرعتك حسب محيطك",
      competence: "السير",
      methode: [
        "التقط الإشارات على أبعد مسافة ممكنة: تحديد السرعة، مدرسة، سوق، منعطف، منطقة أشغال، خروج مركبات. حتى حين يكون الطريق هادئاً، تابع قراءة اللوحات — إنها تمرينك قبل المناطق المزدحمة.",
        "ارفع قدمك عن الدواسة قبل المنطقة، لا بعد دخولها. غالباً يكفي أن تُرخي دواسة الوقود وتترك السيارة تتباطأ وحدها، دون كبح مفاجئ.",
        "قِس مسافتك عن السيارة التي أمامك: قاعدة الثانيتين (حين يمرّ مؤخّر سيارته بعلامة ثابتة، يجب أن تمرّ بالعلامة نفسها بعد ثانيتين على الأقل).",
        "ضاعِف هذه المسافة في المطر أو الليل (4 ثوانٍ على الأقل).",
        "عدّل باستمرار في الاتجاهين: حين يكون الطريق خالياً ومسموحاً، سِر بوتيرة سلسة، أدنى قليلاً من الحدّ الأقصى بدل الالتصاق بالحدّ؛ وحين يظهر خطر، خفّف السرعة فوراً.",
      ],
      pourquoi:
        "السرعة الصحيحة ليست «الحدّ المسموح»، بل هي التي تتيح لك التوقّف في الوقت المناسب إن ظهر شيء ما. يشدّد المدرّبون على الاتجاهين: القيادة ببطء مفرط ليست أكثر حذراً، بل تعرقل انسياب المرور وتمنعك من تعلّم إدارة المعلومات بالسرعة الحقيقية. في المنحدر، ترفع قدمك عن دواسة الوقود كي لا تتسارع وحدك؛ وفي الصعود، تتوقّع قليلاً من الوقود كي لا تتعثّر السيارة. تُدار السرعة بدواسة الوقود بقدر ما تُدار بتضاريس الطريق.",
      erreur:
        "الحفاظ على السرعة نفسها في كل مكان «لأنك ضمن الحدّ». منطقة مدرسية بسرعة 50 تبقى خطيرة عند 50 إذا كان الأطفال يعبرون. وفي المقابل، الزحف بسرعة أدنى بكثير من الحدّ على طريق خالٍ ليس ضماناً للسلامة: تتكيّف، ولا تتجمّد على سرعة واحدة.",
      bva: null,
    },
    C2c: {
      titre: "ضع سيارتك في المكان الصحيح على الطريق",
      competence: "السير",
      methode: [
        "سِر في وسط مسارك، لا ملتصقاً باليمين ولا متجاوزاً نحو المنتصف.",
        "استعِن بنقاط مرجعية ملموسة: بمرآتيك، تحقّق من المسافة على اليسار (الخط الأوسط) وعلى اليمين (الحافة)؛ وألقِ نظرة سريعة إلى الأسفل لتحديد الحافة اليمنى — مرجع شائع: إنها «تصل» تقريباً إلى منتصف زجاجك الأمامي.",
        "احتفظ بمسافة جانبية لا تقلّ عن عرض باب سيارة عن السيارات المركونة (خطر فتح باب أو خروج مشاة فجأة).",
        "على طريق ضيّق أو بوجود درّاجات، انزح قليلاً نحو اليسار بعد التأكّد من خلوّ الطريق، لترك مسافة أمان عند التقابل أو التجاوز.",
        "ابقَ في المنتصف وثابتاً في الصف أو في مسار محدّد بخطوط: دون تعرّج.",
      ],
      pourquoi:
        "السيارة الموضوعة جيداً تكون واضحة: يفهم الآخرون إلى أين تتجه. والأهم أن المبتدئ يشعر دائماً تقريباً أن سيارته عريضة جداً، وأن «المرور مستحيل»: هذا وهم بصري. عرض السيارة نحو 1.80 م (≈ 2 م مع المرايا)؛ وعرض المسار 3 م على الأقل. حتى عند تقابل حافلة على طريق ضيّق، المساحة موجودة. ثِق بنقاطك المرجعية، لا بإحساسك.",
      erreur:
        "الالتصاق باليمين «توخّياً للحذر» ثم ملامسة السيارات المركونة أو الحافة أو الدرّاجين. الانحراف الزائد يميناً خطير بقدر الانحراف الزائد نحو المنتصف. فخّ آخر: التحديق في المرآة أثناء المنعطف للاسترشاد بها — إنها تخدعك (مؤخّر سيارتك أبعد عن الحافة من مقدّمتها)، فتصحّح خطأً وتصطدم بالرصيف.",
      bva: null,
    },
    C2d: {
      titre: "أخذ المنعطف",
      competence: "السير",
      methode: [
        "جهّز نظرك مبكراً: بمجرّد أن ترى المنعطف، تتّجه عيناك نحو المخرج (حيث ينفتح الطريق من جديد). مِل قليلاً، وأدِر رأسك إذا حجبت قوائم الزجاج الأمامي الرؤية.",
        "افرمل وخفّف السرعة قبل الدخول، على الجزء الذي لا يزال مستقيماً. وإن لزم الأمر، خفّض إلى غيار أدنى للحصول على النسبة المناسبة.",
        "ابقَ تماماً في مسارك: لا تتجاوز الخط الأوسط ولا تقطع المنعطف.",
        "اسحب المقود بيد واحدة: اليد اليمنى للمنعطف نحو اليمين، واليسرى للمنعطف نحو اليسار — دون شدّ باليدين معاً (فتُفسد مسارك)، والنظر يبقى بعيداً دائماً.",
        "تسارع بلطف بمجرّد أن يظهر المخرج.",
        "المسار الآمن: تبقى في مسارك (دون قطع أو تجاوز الخط). المسار «الخارج ثم الداخل ثم الخارج» خطّ سباق، لا علاقة له بامتحان القيادة.",
      ],
      pourquoi:
        "تفرمل في الخط المستقيم، حيث تكون السيارة ثابتة. الكبح في منتصف المنعطف يفقدها التوازن ويُفقد الالتصاق بالطريق. تُضبط السرعة قبل، ويُدار المقود أثناء. والمسار يتبع النظر: يقولها أحد المدرّبين بصراحة — «رأسي يتّجه يساراً ويدي تتبعه في الوقت نفسه». إن نظرت إلى الحافة، اتجهت نحو الحافة.",
      erreur:
        "الدخول بسرعة مفرطة والكبح في منتصف المنعطف. علامة على سوء التوقّع: في المرّة القادمة، خفّف السرعة مبكراً. خطأ شائع آخر: دخول المنعطف بدوران محرّك منخفض (غيار مرتفع جداً). تتعثّر السيارة وترتجّ، وقد تنطفئ في وسط المنحنى. تخفض إلى غيار أدنى قبل كي تحصل على القوّة.",
      bva: null,
    },
    C2e: {
      titre: "التقابل والتجاوز",
      competence: "السير",
      methode: [
        "للتجاوز — تحقّق أنه مسموح: لا خطّ متّصل، لا منعطف، لا قمّة مرتفع، لا رؤية محدودة.",
        "تأكّد من توفّر الرؤية: يجب أن ترى بعيداً وخالياً أمام المركبة المراد تجاوزها.",
        "تابع الفحوص بالتتابع: المرآة الداخلية، ثم المرآة الخارجية اليسرى، ثم إشارة الانعطاف يساراً، ثم فحص النقطة العمياء، ثم التنفيذ. لا أحد يتجاوزك أصلاً.",
        "انحرف واخرج للتجاوز بحزم مع ترك المسافة الجانبية (متر واحد على الأقل في المدينة، و1.50 م خارج المناطق العمرانية لدرّاج أو مركبة بعجلتين).",
        "إشارة الانعطاف يميناً، وعُد إلى مسارك حين ترى المركبة المتجاوَزة كاملة في مرآتك الداخلية (دون أن «تقطع» عليها الطريق أبداً).",
        "للتقابل على طريق ضيّق: خفّف السرعة، والزم اليمين (دون ملامسة جانب الطريق)، ثم استعِد مكانك بعد التقابل.",
      ],
      pourquoi:
        "التجاوز لحظة تسير فيها في مسار الاتجاه المقابل: يجب أن يكون كل شيء آمناً قبل، لأنك ما إن تنطلق حتى لا تستطيع التراجع. يشدّد أحد المدرّبين على فائدة إشارة الانعطاف حتى عند تجاوز درّاج: فهي تنبّه مَن خلفك وتُظهر للمُراقب أنك حلّلت الموقف. ويجب أن يكون القرار حاسماً: تختار التجاوز بوضوح أو تتخلّى عنه، ولا تبقى متردّداً في المنتصف.",
      erreur:
        "التجاوز «لأنه سيمرّ» دون رؤية كاملة (منعطف، مرتفع)، أو الرضوخ لضغط سيارة تلتصق بك من الخلف. ردّ الفعل الصحيح حين يتسلّل الشكّ: ترفع قدمك عن الدواسة، وتخفض الغيار، وتتخلّى عن التجاوز — وإن سألك المُراقب لماذا خفّفت السرعة، تبرّر ذلك («كان لديّ شكّ في تصرّف الدرّاج، ولم أكن أرى بعيداً بما يكفي»).",
      bva: null,
    },
    C2f: {
      titre: "التقاطعات والدوّارات",
      competence: "السير",
      methode: [
        "عند التقاطعات — اكتشف التقاطع قبل أولوية المرور: ابحث عن الإشارات — ممر مشاة، انحناء الرصيف في البعيد (شارع يتفرّع)، فتحة بين السيارات المركونة أو بين المباني، لوحات الاتجاهات.",
        "عند التقاطعات — عند التقاطع، حدّد نوعه أثناء اقترابك: إشارة ضوئية، قف، أفسِح الطريق، أو لا شيء.",
        "عند التقاطعات — إن لم تكن هناك أي إشارة، فهي أولوية اليمين: كل ما يخرج من يمينك يمرّ قبلك.",
        "عند التقاطعات — لائم سرعتك مع مدى الرؤية: نظرة إلى المرآة الداخلية، ثم انزل إلى الغيار الثاني؛ وإن لم ترَ شيئاً على اليمين، انزل حتى إلى الغيار الأول لتملك وقتاً لتنظر جيداً. لن يلومك المُراقب أبداً على تخفيف السرعة لتراقب جيداً.",
        "عند التقاطعات — لا تتوقّف أبداً بشكل مفاجئ عند التقاطع (خطر أن تُصدَم من الخلف): تخفّف السرعة مبكراً وبلطف.",
        "عند التقاطعات — لا تنطلق إلا إذا كان بإمكانك إخلاء التقاطع: لا تحبس نفسك أبداً في وسط المفترق.",
        "أولوية اليمين — عدم منح أولوية اليمين: إذا اضطرّت السيارة القادمة من اليمين إلى تخفيف السرعة أو التوقّف لتتركك تمرّ، فهذا بالفعل عدم منح للأولوية — حتى دون اصطدام. ليس عليها أبداً أن تفرمل من أجلك.",
        "أولوية اليمين — حالات خادعة: مخرج موقف سيارات، إقامة خاصة (لوحة «خاص»)، رصيف مرتفع = ليست أولوية يمين. مَن يخرج منها ليس له الأولوية (لكن تبقى حذراً).",
        "عند الدوّار — عند المفترق الدوّار (لوحة «أفسِح الطريق»): عند الاقتراب، تحقّق مما خلفك، وخفّف السرعة واخفض الغيار (غالباً الثاني). اختر مسارك: المسار الأيمن افتراضياً في دوّار صغير / للخروج مبكراً؛ والمسار المناسب لمخرجك في دوّار كبير.",
        "عند الدوّار — أفسِح الطريق: مَن هم على الحلقة أصلاً لهم الأولوية. خُذ وقتك — لا تتسرّع حتى تقدّر جيداً المسافة وسرعة مَن يدورون. عند الشكّ، تنتظر؛ بل يمكنك أن تدور دورة أخرى.",
        "عند الدوّار — ادخل في فُرجة كافية، دون إشارة انعطاف يساراً للدخول (إلا إذا كنت تنعطف بوضوح نحو اليسار / تدور دورة كاملة).",
        "عند الدوّار — عند الاقتراب من مخرجك: إشارة انعطاف يميناً قبله مباشرة. وبما أنها تنطفئ أحياناً بين مخرجين، لا تتردّد في إعادة تشغيلها.",
        "عند الدوّار — قبل الخروج: افحص النقطة العمياء اليسرى (تحسّباً لمن يقطع عليك الطريق)، وألقِ نظرة يميناً للدرّاجات / المسار المخصّص للدرّاجات، ثم تخرج وتطفئ الإشارة. انتبه لممر المشاة عند المخرج: لا تتسارع حتى تتحقّق.",
        "عند الدوّار — الميدان الدائري (بأولوية اليمين) ≠ المفترق الدوّار (بأولوية الحلقة): يُقرأ الفرق عند المدخل. المفترق الدوّار = «أفسِح الطريق» عند المدخل، أي الداخل ليست له الأولوية، بل يترك مَن هم على الحلقة أصلاً يمرّون. أما الميدان الدائري (نادر، دون لوحة عند المدخل) = أولوية اليمين، أي الداخل له الأولوية على مَن هم بداخله أصلاً.",
      ],
      pourquoi:
        "التقاطع هو المكان الذي تتقاطع فيه المسارات: 99% من العمل هو معرفة مَن يمرّ أولاً قبل الوصول إليه. إشارة الانعطاف يميناً عند الخروج من الدوّار تنبّه الآخرين أنك تغادر الحلقة، ما يفكّ الطريق أمام مَن ينتظرون الدخول.",
      erreur:
        "خطآن كلاسيكيان: نسيان إشارة الانعطاف يميناً قبل الخروج من الدوّار (فيبقى المنتظرون محبوسين أو ينطلقون ظنّاً أنك ستتابع)؛ وعدم كشف التقاطع في الوقت المناسب، ومن هنا يقع عدم منح أولوية اليمين لأنك «ظننت أن لديك وقتاً للمرور».",
      bva: null,
    },
    C2g: {
      titre: "التواصل مع مستخدمي الطريق الآخرين",
      competence: "السير",
      methode: [
        "توقّع فعلك (الانعطاف، تغيير المسار، التوقّف) قبل القيام به.",
        "شغّل إشارة الانعطاف مبكراً بما يكفي، قبل تغيير الاتجاه — بوقت كافٍ لتمنح الآخرين فرصة الفهم (إرشاد ~3 ثوانٍ).",
        "خُذ موضعك في أقرب فرصة بعد إشارتك إلى نيّتك: لا تُشير ثم تنتظر 50 متراً كي تنزاح.",
        "ابحث عن التواصل بالعينين عند ممرات المشاة والمفترقات: نظرة متبادلة خير من مقامرة.",
        "أطفئ إشارة الانعطاف بعد انتهاء المناورة (إن لم تنطفئ وحدها — في الدوّار تنطفئ غالباً مبكراً جداً، فأعِد تشغيلها).",
        "احتفظ بالمنبّه للتحذير من خطر، لا للتعبير عن الغضب أبداً.",
      ],
      pourquoi:
        "الطريق حوار. لا يخمّن الآخرون نواياك: إن نبّهت مبكراً وبوضوح، تكيّف الجميع بسلاسة. يوضّح أحد المدرّبين ذلك جيداً: إشارة انعطاف سائق آخر تُشغَّل متأخّرة جداً تخلق الشكّ («ماذا يفعل؟ التفافاً؟»). وفي المقابل، إشارة انعطاف واضحة وأنت تنتظر الانطلاق تطمئن الآخرين وتدفع الموقف إلى الأمام. التنبيه المتأخّر جداً لا يفيد في شيء.",
      erreur:
        "تشغيل إشارة الانعطاف في اللحظة نفسها التي تنعطف فيها (أو عدم تشغيلها أصلاً) — يجب أن تنبّه قبل، لا أن ترافق الحركة. وقريبتها: الإشارة إلى نيّتك ثم الانزياح متأخّراً جداً، ما يفاجئ مَن خلفك.",
      bva: null,
    },
    C2h: {
      titre: "القيادة وحدك في المدينة (خلاصة)",
      competence: "السير",
      methode: [
        "قبل الانطلاق، تخيّل مسارك: الشوارع، وتغييرات الاتجاه، والمناطق الصعبة.",
        "كرّر باستمرار ردود فعل العالم 2: النظر البعيد المتحرّك (C2a)، والسرعة المناسبة (C2b)، والتموضع الجيد (C2c).",
        "نظّم كل مناورة ولا تتعجّلها: «نأخذ الوقت لنُحسن الأداء» — تنفيذ الحركات بالترتيب (فحص، ثم إشارة الانعطاف، ثم النقطة العمياء، ثم التنفيذ) هو تحديداً ما يجعل القيادة سلسة وآمنة.",
        "أعلِن نواياك مبكراً (إشارات الانعطاف، C2g) وأدِر الأولويات (C2f) دون تردّد.",
        "ابقَ هادئاً أمام المفاجئ: إن أخطأت المسار أو الشارع، تابع — ولو اضطررت إلى الدوران في الدوّار مرة أخرى — واستدرك الأمر لاحقاً. لا مناورة خطيرة أبداً من أجل «التدارك».",
      ],
      pourquoi:
        "يُعتمد العالم 2 حين تصبح كل الحركات تلقائية ويتحرّر ذهنك للقرار، لا للقيادة الميكانيكية. مرجع معبّر: يتفقّد الطلاب الجيّدون مرايهم «دون أن ينتبهوا حتى»، بحكم العادة. تُنجز تسلسلاً طويلاً دون تدخّل المدرّب — بما في ذلك في المناطق الشائكة (الشوارع التجارية، مواقف السيارات المزدحمة) حيث لا تدع الآخرين يستعجلونك.",
      erreur:
        "الذعر أمام المفاجئ (شارع مغلق، مسار خاطئ في الدوّار، خطأ في المسار) والقيام بحركة خطيرة من أجل «التصحيح» (التفاف مفاجئ، رجوع للخلف، تغيير مسار بالقوّة). تبقى هادئاً، وتتابع في المسار الذي أنت فيه، وتستدرك لاحقاً بأمان.",
      bva: null,
    },
    C3a: {
      titre: "أن ترى جيداً وأن تُرى جيداً في الليل",
      competence: "الظروف الصعبة",
      methode: [
        "قبل القيادة — قبل الانطلاق: تأكد من أن زجاجك ومصابيحك الأمامية نظيفة. الزجاج المتسخ يضاعف الانعكاسات في الليل.",
        "قبل القيادة — بمجرد أن تبدأ القيادة: أشعل مصابيح التلاقي (الأضواء المنخفضة). في الليل تكون إلزامية، حتى في المدينة المضاءة.",
        "استعمال الأضواء — على طريق غير مضاء ولا أحد قادم في مواجهتك: انتقل إلى الأضواء العالية (المصابيح الكاملة) لترى أبعد. خارج المدينة، تصبح اللافتات والعلامات عاكسة: ترى أبعد بكثير وتشعر بثقة أكبر.",
        "استعمال الأضواء — ترى مركبة قادمة في مواجهتك (أو أدنى وميض للمصابيح من بعيد): عُد إلى مصابيح التلاقي (الأضواء المنخفضة) قبل أن تزعجك، حتى لا تُبهر السائق الآخر. عند أدنى شك (وميض خلف جدار، منعطف)، ابقَ على الأضواء المنخفضة.",
        "استعمال الأضواء — أثناء عبور مركبة في مواجهتك: لا تُحدّق أبداً في المصابيح المقابلة. ثبّت نظرك على الحافة اليمنى لمسارك (الخط أو الحافة) واتبعها. يمكنك حتى الاستعانة بانعكاس المصابيح المقابلة على الحافة اليمنى لتحديد موقعك.",
        "اليقظة ليلاً — يصبح مدى رؤيتك أقصر مما هو عليه في وضح النهار. هذا طبيعي: ترى أبعد بمسافة أقل، لذلك تتصرف «بهامش» — تفرمل قبل ذلك بقليل، وتعاود التسريع بعد ذلك بقليل.",
        "اليقظة ليلاً — احذر من المشاة ذوي الملابس الداكنة ومن الحيوانات. المشاة بملابس داكنة وقلنسوة يُرَون في وقت متأخر جداً ليلاً. خارج المدينة، قد يظهر حيوان فجأة. قاعدة بسيطة: اليقين = أتقدّم، الشك = لا أسرّع.",
        "اليقظة ليلاً — تشعر بالثقل، وتتدلى جفونك: توقّف. استرِح كل ساعتين — وعند أول علامة على التعب، دون انتظار الساعتين.",
      ],
      pourquoi:
        "في الليل ترى أبعد بمسافة أقل بكثير وتتعب عيناك بسرعة. كل الرهان هو أن ترى أبعد ما يمكن دون أن تُبهر الآخرين، وألا تدع نفسك تنومك المصابيح المقابلة. يلخّص أحد المعلمين ذلك جيداً: في الليل «تعمل العينان كثيراً جداً» — تبحثان باستمرار عن المؤشرات، بينما ترتاحان في النهار.",
      erreur:
        "البقاء على الأضواء العالية في مواجهة سيارة قادمة (تُبهرها فتُبهرك بالمقابل) — أو التحديق في المصابيح المقابلة. إذا توقفت عن النظر إلى الطريق ولو لجزء من الثانية، فقد يكون الأمر خطيراً: تفقد الحافة اليمنى للطريق تماماً.",
      bva: null,
    },
    C3b: {
      titre: "تكييف قيادتك مع المطر والثلج والضباب",
      competence: "الظروف الصعبة",
      methode: [
        "استعد وأبطئ — جهّز السيارة منذ أول قطرات. المساحات الأمامية (اضبط سرعتها حسب شدة المطر)، المساحة الخلفية عند الحاجة، وقبل كل شيء إزالة الضباب: المكيّف + الهواء الساخن على الزجاج الأمامي لطرد الضباب بسرعة. الزجاج المضبّب يعني رؤية أقل، تماماً كالمطر.",
        "استعد وأبطئ — ارفع قدمك عن الدواسة والتزم بحدود السرعة «في المطر». على الطريق السيار: من 130 إلى 110، ومن 110 إلى 100. وفي منعطف موضوع له 50، تحت المطر لا تدخله بسرعة 50: قد ينزلق.",
        "على أرض زلقة — زد المسافة بينك وبين السيارة التي أمامك. تحت المطر: ×2 (4 ثوانٍ بدل 2). على الثلج: أكثر من ذلك (حتى ×3).",
        "على أرض زلقة — افرمل بلطف وباكراً. على أرض مبللة، تستغرق الفرملة مسافة أكبر بمرتين: تبدأ الفرملة أبكر بكثير، بضغطات صغيرة، دون أي حركة مفاجئة.",
        "على أرض زلقة — تجنّب البرك الكبيرة. بركة كبيرة قد تفقدك التماسك دفعة واحدة (الانزلاق المائي) وتخفي حفرة. إذا لم تستطع تجنّبها: أبطئ قبلها، ثم اعبرها بسرعة ثابتة، دون أي حركة مفاجئة للمقود.",
        "انظر وكن مرئياً — أشعل المصابيح المناسبة حسب الرؤية: مطر / نهار رمادي ← مصابيح التلاقي لتكون مرئياً ولترى أفضل؛ ضباب أو ثلج، رؤية دون 50 م ← مصابيح الضباب الأمامية والخلفية مسموحة؛ ⚠️ تحت المطر: مصابيح الضباب الخلفية ممنوعة — فهي تُبهر بشدة السائق الذي خلفك (حتى 2.5× ضوء الفرملة)، الأمامية فقط إذا كان المطر كثيفاً؛ أطفئ مصابيح الضباب بمجرد عودة الرؤية.",
        "انظر وكن مرئياً — لا أضواء عالية تحت المطر الغزير. ينعكس الضوء على القطرات ويصنع أمامك جداراً من الوهج: ترى أسوأ أكثر. ابقَ على الأضواء المنخفضة.",
        "انظر وكن مرئياً — إذا كان الضباب كثيفاً: طبّق قاعدة الخمسينات الثلاث — رؤية 50 م ← سرعة 50 كم/س ← فجوة 50 م.",
      ],
      pourquoi:
        "الماء والثلج والجليد تقلّل تماسك إطاراتك: تنزلق السيارة وتستغرق وقتاً أطول للتوقف. المزيد من المسافة والمزيد من السلاسة يعوّضان نقص التماسك هذا. والرؤية هي النصف الآخر من المشكلة: المساحات وإزالة الضباب أولاً، وإلا فأنت تقود «بشكل أعمى».",
      erreur:
        "الحفاظ على المسافة نفسها كما في الطقس الجاف «لأننا ما زلنا نرى جيداً». الرؤية لا علاقة لها بالتماسك: حتى لو كنت ترى، فإنك تفرمل بنصف الفعالية. خطأ شائع آخر: إشعال مصباح الضباب الخلفي تحت المطر (ممنوع، وتُعمي من يسير خلفك).",
      bva: null,
    },
    C3c: {
      titre: "الحفاظ على السيطرة عندما تنزلق الطريق",
      competence: "الظروف الصعبة",
      methode: [
        "اكتشف الخطر بعينك: منطقة مظللة تحت الأشجار، بقعة لامعة، أوراق ميتة، حصى مفكك، مخرج نفق مبلل. تتوقّع الأمر قبل أن تصل إليه.",
        "ارفع قدمك عن الدواسة بلطف قبل المنطقة الزلقة بكثير، وليس فوقها أبداً.",
        "على المنطقة: كل شيء بسلاسة. دواسة الوقود خفيفة، مقود تدريجي، لا حركات مفاجئة. على أرض مبللة، تسريع مفاجئ واحد يكفي لجعل العجلات تدور بلا تماسك.",
        "أبطئ قبل المنعطف، في خط مستقيم — وليس داخله. في منعطف زلق، انظر أبعد ما يمكن لتتوقّع مسارك، وانعطف ورجلك مرفوعة عن الدواسة. استعن باللافتات العاكسة والحواف لتصوّب نحو مخرجك.",
        "إذا بدأ الجزء الخلفي بالانزلاق: ارفع قدمك عن الدواسة (دون فرملة عنيفة) وانظر إلى حيث تريد الذهاب — تتبع اليدان نظرك.",
      ],
      pourquoi:
        "على أرض زلقة، لإطاراتك تماسك ضعيف جداً. الحركة المفاجئة (حركة مفاجئة للمقود، ضغطة مفاجئة على الفرامل، ضغطة مفاجئة على الوقود) هي التي تتجاوز هذا التماسك وتجعل السيارة تنزلق. أما السلاسة فتحافظ على التماسك.",
      erreur:
        "الفرملة في منتصف المنعطف على أرض زلقة. الفرملة + الانعطاف في آن واحد أمر يفوق قدرة الإطارات: تستمر السيارة مستقيمة أو ينفلت الجزء الخلفي.",
      bva: null,
    },
    C3d: {
      titre: "الفرملة الطارئة والتماسك (نظام ABS)",
      competence: "الظروف الصعبة",
      methode: [
        "تظهر عقبة فجأة. الحركة الأولى: افرمل بقوة، حتى النهاية، دفعة واحدة. الفرامل أولاً — هذه هي الأولوية المطلقة.",
        "أبقِ قدمك مضغوطة، دون أن ترفعها. في سيارة مزوّدة بنظام ABS (جميع سيارات مدارس القيادة الحديثة)، النظام هو الذي يمنع العجلات من الانغلاق — ستشعر بالدواسة تهتز أو تصدر «طق-طق» تحت قدمك: هذا طبيعي، لا ترفع قدمك.",
        "يمكنك الانعطاف في الوقت نفسه. مع نظام ABS، تحتفظ بالتوجيه: يمكنك الفرملة حتى النهاية وتوجيه السيارة نحو مخرج النجاة.",
        "انظر إلى مخرج النجاة، لا إلى العقبة. حيث تذهب عيناك، تذهب السيارة.",
        "ثم اضغط القابض (الدبرياج) — قبيل أن يتوقّف المحرك. الترتيب مهم: الفرامل أولاً، القابض بعد ذلك. اضغط القابض حتى لا يتوقّف المحرك وللحفاظ على السيطرة، لكن فقط بعد أن تكون الفرملة قد بدأت.",
        "بمجرد زوال الخطر: ارفع قدمك تدريجياً وعُد إلى القيادة العادية.",
      ],
      pourquoi:
        "في حالة الطوارئ، أقصر طريق للتوقف هو الفرملة إلى أقصى حد. يتيح لك نظام ABS الفرملة حتى النهاية دون انغلاق العجلات، وبالتالي دون الانزلاق إلى الأمام: تحتفظ بإمكانية التوجيه لتجنّب العقبة. نضغط القابض بعد ذلك، لا قبله، حتى لا نفقد كبح المحرك في بداية الفرملة تماماً.",
      erreur:
        "الفرملة «بشكل متقطع» أو رفع القدم عن الدواسة بمجرد أن تهتز، بدافع الخوف. الاهتزاز هو علامة على أن نظام ABS يعمل: رفع القدم يطيل مسافة التوقف ويفقدك فائدة النظام. خطأ آخر: ضغط القابض قبل الفرملة — الترتيب هو الفرامل أولاً، القابض بعد ذلك.",
      bva: null,
    },
    C3e: {
      titre: "المسلك السريع والطريق السيار: الدخول، السير، الخروج",
      competence: "الظروف الصعبة",
      methode: [
        "الدخول — اكتشف مكان الاندماج: اجتماع «أفسح الطريق» + منع الانعطاف يساراً يعني وجود مسار اندماج في 9 حالات من 10. بمجرد أن تراه، استعد.",
        "الدخول — الاندماج: شغّل إشارة الانعطاف اليسرى.",
        "الدخول — سرّع على طول مسار الاندماج بالكامل لتصل إلى سرعة قريبة من سرعة تدفّق السير (عملياً، 70-80 على الأقل). مسار قصير ← ابقَ في السرعة الثالثة (قوة سحب أكبر)؛ مسار طويل ← يمكنك الانتقال إلى الرابعة. لا تتوقّف أبداً في نهاية المسار.",
        "الدخول — راقب المرآة الجانبية اليسرى + نظرة فوق الكتف (النقطة العمياء) واختر السيارة التي ستندمج أمامها.",
        "الدخول — عندما تكون المساحة خالية، اندمج بسلاسة وأطفئ إشارة الانعطاف. لا تبطئ لتندمج: حافظ على سرعتك أو سرّع.",
        "السير — القيادة: ابقَ في المسار الأيمن افتراضياً، حتى عندما يتسع الطريق إلى 3 مسارات.",
        "السير — للتجاوز: راقب (المرآة الداخلية ← المرآة الجانبية ← النقطة العمياء)، إشارة يسرى، تجاوز، لا تبطئ أثناء التجاوز، ثم عُد إلى اليمين بعد أن تتخطى (إشارة يمنى، مراقبة جديدة).",
        "السير — لا تبقَ أبداً بمحاذاة شاحنة ثقيلة: تجاوزها بحزم.",
        "الخروج — المغادرة: إشارة يمنى قبل مخرجك بنحو 200 م، بعد المراقبة.",
        "الخروج — لا تفرمل على الطريق السيار: انتظر حتى تكون على مسار التباطؤ، بعد الخروج، لتبطئ وتخفّض السرعات بهدوء.",
      ],
      pourquoi:
        "يعمل الطريق السيار بتدفّق سريع ومنتظم. الهدف هو الاندماج فيه دون كسر هذا التدفّق: الوصول بالسرعة المناسبة للاندماج، والتباطؤ جانباً (مسار التباطؤ) للخروج منه، دون مفاجأة أحد. لهذا أيضاً نراقب النقطة العمياء جيداً: حتى مع وضعية جيدة، قد يتسلّل أحدهم (سائق دراجة نارية، سيارة تفرض المرور).",
      erreur:
        "الاندماج ببطء شديد (بل والتوقف في نهاية مسار التسارع): تُجبر السيارات على الفرملة من أجلك وتخلق خطراً. الاندماج الناجح هو الوصول بسرعتهم. خطأ آخر: الفرملة على مسار السير بدل انتظار مسار التباطؤ.",
      bva: null,
    },
    C3f: {
      titre: "الأنفاق والجسور والمناطق الخاصة",
      competence: "الظروف الصعبة",
      methode: [
        "النفق: قبل الدخول، أشعل مصابيح التلاقي (لا أضواء عالية أبداً في النفق).",
        "بمجرد الدخول: حدّد ذهنياً أقرب مخرج طوارئ وحافظ على مسافتك.",
        "داخل النفق: لا التفاف للخلف، لا رجوع إلى الوراء، حافظ على وتيرتك وفجوتك.",
        "في حال توقف قسري / ازدحام: أطفئ المحرك، وعند وجود مشكلة، توجّه سيراً على الأقدام نحو مخرج الطوارئ الذي حدّدته.",
        "جسر / معبر مرتفع: عند الاقتراب من جسر مكشوف، أمسك المقود بإحكام، وتوقّع هبّة رياح جانبية قد تزيحك عن مسارك.",
        "عند نهاية الجسر: انتبه، قد تكون الطريق أكثر انزلاقاً (جليد، رطوبة) من أماكن أخرى.",
      ],
      pourquoi:
        "النفق مكان مغلق: تجعل نفسك مرئياً (الأضواء) وتبقي دائماً مخرجاً في ذهنك. الجسر مكان شديد الانكشاف: قد تدفعك الرياح دفعة واحدة، ومن هنا تأتي قبضة المقود المحكمة.",
      erreur:
        "الدخول إلى نفق دون إشعال الأضواء («ما زلت ترى» عند المدخل لكنك تصبح غير مرئي في العمق) — أو إرخاء المقود عند الخروج من جسر، تماماً في اللحظة التي تضرب فيها الهبّة.",
      bva: null,
    },
    C3g: {
      titre: "المدينة المزدحمة: مشاركة الطريق مع المشاة والدراجات والحافلات",
      competence: "الظروف الصعبة",
      methode: [
        "ارفع قدمك عن الدواسة. في المدينة المزدحمة، الوتيرة البطيئة هي هامش أمانك الأول: تمنحك الوقت للتفاعل مع ما يظهر فجأة. مطبّات السرعة، اجتزها في السرعة الثانية، بلطف.",
        "انظر بعيداً وواسعاً. امسح الأرصفة، وبين السيارات المتوقفة، وأمام الحافلات المتوقفة — قد يظهر مشاة في أي مكان، خاصة خلف حافلة تحجب الرؤية (الفخ الكلاسيكي: يخرج تماماً على ممر العبور، مختبئاً خلف الحافلة).",
        "قبل كل مناورة (الانعطاف، العودة إلى المسار، الركن): راقب النقطة العمياء فوق كتفك. دراجة أو دراجة كهربائية تتسلّل بينك وبين الرصيف تختبئ هناك بسهولة. حتى مجرد الانطلاق عند إشارة يستحق نظرة.",
        "عندما تتجاوز دراجة: اترك مسافة متر واحد على الأقل (1.50 م خارج المدينة) وأبطئ. إذا كنت قريباً جداً منها عندما تكتشفها، فلا تتجاوز: ارفع قدمك عن الدواسة وانتظر.",
        "أمام ممر المشاة: أبطئ وأفسح دائماً للمشاة، حتى لمن خطا خطوة واحدة عليه. ما دمت غير متأكد من خلوّه من أي أحد، لا تسرّع.",
        "مسار الحافلات: لا تسر فيه (إلا بترخيص معلّم على الأرض)؛ انتبه للحافلة التي تنطلق من محطتها، فلها أولوية المرور — ارفع قدمك عن الدواسة ودعها تنطلق.",
      ],
      pourquoi:
        "في المدينة المزدحمة، لا يأتي الخطر من السرعة بل من غير المتوقّع: مشاة بين سيارتين، دراجة في نقطتك العمياء، باب ينفتح، مشاة مختبئ خلف حافلة. القيادة ببطء والنظر في كل مكان هما ما يمنحك الوقت للتوقف في الوقت المناسب. يقولها أحد المعلمين بطريقة أخرى: قيادتك «تجتذب» ما تسبّبه قراراتك — تردّد واحد زائد وتجد نفسك ملتصقاً بدراج لم تعد قادراً على تجاوزه.",
      erreur:
        "نسيان مراقبة النقطة العمياء فوق الكتف قبل الانعطاف يميناً: دراج يتقدّم على يمينك يكون غير مرئي في المرآة، وهذا هو الحادث الكلاسيكي «سيارة تنعطف / دراجة تسير مستقيمة». فخ آخر: التقدّم أمام حافلة متوقفة دون تخيّل المشاة الذي يعبر مختبئاً خلفها.",
      bva: null,
    },
    C4a: {
      titre: "خطّط لمسارك قبل أن تدير المفتاح",
      competence: "القيادة المستقلة",
      methode: [
        "انظر إلى مسارك كاملًا على نظام تحديد المواقع (GPS)، وليس نقطة الانطلاق والوصول فقط.",
        "حدّد 2-3 معالم بصرية على طول الطريق: «بعد ماكدونالدز أنعطف»، «المحطة الكبيرة، هناك أخرج». هذا يطمئنك إذا تعطّل الـ GPS.",
        "جهّز مسارًا بديلًا في حال كان طريق ما مغلقًا أو مزدحمًا.",
        "تحقّق من الظروف: الطقس، حركة المرور المباشرة، الأشغال المعلَنة.",
        "حدّد مسبقًا المناطق الصعبة: التقاطعات الكبيرة، محطات الرسوم، مداخل المدن، المخارج المتقاربة.",
        "جهّز فترات استراحتك إذا كان الطريق طويلًا: استراحة نحو 15 دقيقة كل ساعتين.",
        "اضبط كل شيء قبل الانطلاق: الـ GPS مبرمَج، الهاتف مثبَّت، المقعد والمرايا جاهزة.",
      ],
      pourquoi:
        "الطريق المُجهَّز مسبقًا يعني عقلًا متفرّغًا للقيادة. يقول المدرّبون لمن يخافون الانطلاق بمفردهم: إذا حدّدت معالمك وعرفت أن لديك GPS احتياطيًا وأنه بإمكانك التوقف دائمًا، فسترى أن لديك في الواقع حلولًا كثيرة في متناول يدك. فلن تبحث عن مخرجك في حالة ذعر في اللحظة الأخيرة.",
      erreur:
        "الانطلاق «على الإحساس» وبرمجة الـ GPS أثناء الحركة. عندها تُبعد عينيك عن الطريق في أسوأ لحظة، وتكتشف الصعوبات وأنت بأقصى سرعة.",
      bva: null,
    },
    C4b: {
      titre: "اتّبع المسار دون أن ترفع عينيك عن الطريق",
      competence: "القيادة المستقلة",
      methode: [
        "برمِج واضبط الـ GPS والسيارة متوقفة (صوت مسموع، شاشة في مكان مناسب).",
        "أنصت إلى الصوت بدلًا من التحديق في الشاشة: دع الـ GPS يتحدث إليك.",
        "اقرأ لوحات الاتجاهات من بعيد. قاعدة يكررها المدرّبون: كلما كان اسم المدينة أسفل على اللوحة، كان مخرجها أقرب. فتُجهّز مخرجك قبل وقت كافٍ.",
        "توقّع المخرج أو تغيير المسار: خذ المعلومة مبكرًا (المرآة الداخلية، المرآة الخارجية، إشارة الانعطاف)، وانتقل بهدوء. إذا كان عليك عبور عدة مسارات، فابدأ في أقرب وقت ممكن.",
        "لا تفقد سرعتك عند تغيير المسار: انزلق إلى المسار المجاور دون أن تكبح بلا داعٍ.",
        "الطريق تبقى له الأولوية على الشاشة. عند التردّد بين ما يقوله الـ GPS وواقع الطريق، اتّبع الطريق ولوحات الإشارة.",
      ],
      pourquoi:
        "الـ GPS مساعد وليس سائقًا. أنت من يقود. تبقى عيناك في الخارج، على الطريق واللوحات. قراءة اللوحة مبكرًا تمنحك الوقت لتضع سيارتك في مكانها دون أن تندفع نحو مخرجك.",
      erreur:
        "تفويت المخرج ومحاولة «تدارك الأمر»: الكبح المفاجئ، أو الرجوع للخلف، أو الاندماج بالقوة. على الطريق السريع أو المسار السريع، لا ترجع للخلف أبدًا ولا تتوقف من أجل ذلك.",
      bva: null,
    },
    C4c: {
      titre: "قُد بسلاسة لتحرق وقودًا أقل (القيادة الاقتصادية)",
      competence: "القيادة المستقلة",
      methode: [
        "انطلق بلطف: لا تضغط دواسة الوقود بقوة عند البداية.",
        "بدّل السرعات مبكرًا لتسير على دوران منخفض. المؤشر الصوتي أولًا: بدّل عندما تشعر بـ«المحرك يرتفع صوته»، دون أن ترهقه. مؤشر رقمي إرشادي: نحو 2000 دورة/دقيقة في الديزل، و2500 دورة/دقيقة في البنزين. على خط مستقيم واضح جميل، لا تتردد في الصعود إلى السرعة الخامسة/السادسة: فهذا أكثر اقتصادًا.",
        "سِر على دوران منخفض: المحرك الذي يدور بهدوء يستهلك أقل.",
        "استعمل كبح المحرك: عندما ترى أنك ستبطئ (إشارة ضوئية، دوّار، منطقة 70)، ارفع قدمك مبكرًا ودع السيارة تبطئ من تلقاء نفسها. فتكبح أقل.",
        "إذا كان عليك التوقف، اكبح «بشكل متناقص»: أقوى قليلًا في البداية، ثم تُخفّف الضغط بلطف في نهاية الكبح. فتتوقف في المكان المضبوط، بسلاسة، دون أن تهزّ ركّابك — بدلًا من الوصول بسرعة والكبح بقوة في اللحظة الأخيرة.",
        "حافظ على سرعة ثابتة: الضغطات المفاجئة على دواسة الوقود والفرامل وقود مهدور.",
        "أطفئ المحرك إذا توقفت لفترة طويلة (إلا في السير، حيث يتكفّل نظام التوقف والتشغيل الآلي في السيارة بذلك).",
      ],
      pourquoi:
        "القيادة السلسة توفّر نحو 20% من الوقود، وتقلّل من تآكل السيارة، وتجنّب الركّاب التخبّط. مكافأة إضافية: في الامتحان، القيادة الاقتصادية (تبديل السرعات في الوقت المناسب، والتوقّع، وعدم توقّف المحرك فجأة، وجرعة الكبح المناسبة) من الكفاءات التي تُحتسب.",
      erreur:
        "الكبح «غير المتوقَّع»: تصل بسرعة إلى إشارة ضوئية أو دوّار، ولم ترفع قدمك، فتكبح بقوة في اللحظة الأخيرة. هذا سيّئ للاستهلاك، وسيّئ لركّابك، وغير آمن لمن خلفك. السلاسة تتفوّق على التوتر.",
      bva: null,
    },
    C4d: {
      titre: "توقّع الخطر وابقَ هادئًا خلف المقود",
      competence: "القيادة المستقلة",
      methode: [
        "انظر بعيدًا إلى الأمام: ليصل نظرك إلى 15-20 ثانية أمامك، لا إلى غطاء المحرك.",
        "امسح باستمرار بنظرك: المرايا، الأمام، الجانبين، الأمام. خذ المعلومة قبل أن تصبح مشكلة.",
        "حافظ على مسافات الأمان: قاعدة الثانيتين مع السيارة التي أمامك (4 ثوانٍ تحت المطر).",
        "تخيّل أسوأ احتمال معقول: مشاة يظهرون فجأة، باب سيارة يُفتح، سيارة تكبح. كن مستعدًا قبل أن يحدث ذلك.",
        "تحلَّ بـ«الوعي بالخطر»: عند تقاطع بلا رؤية (تحجبه المباني أو السيارات المتوقفة)، حاول بنشاط أن ترى بالتقدّم ببطء، وقدمك جاهزة للكبح. لا تقل لنفسك «حسنًا، لم أرَ شيئًا، سأمرّ».",
        "تنفّس وابقَ رابط الجأش: إذا أزعجك أحدهم أو التصق بمؤخرة سيارتك، لا تردّ على العدوانية. دعه يمرّ.",
      ],
      pourquoi:
        "السائق الذي يتوقّع نادرًا ما يكبح في حالة طارئة. الرؤية البعيدة والمبكرة تعني امتلاك الوقت لاتخاذ القرار بهدوء بدلًا من ردّ الفعل في حالة ذعر. يقول المدرّبون إن الوعي بالخطر «يُلمَس»: وهذا بالضبط ما يريد الممتحِن رؤيته، سائق يستشعر الخطر ويكيّف سرعته بدلًا من الاندفاع.",
      erreur:
        "التحديق في السيارة التي أمامك مباشرة (نظر قصير) وأن تفاجئك كل الأمور الحاصلة أبعد. أو أن تستسلم للغضب وتقود «ردًّا» على سائق آخر.",
      bva: null,
    },
    C4e: {
      titre: "شارك الطريق مع الأكثر هشاشة",
      competence: "القيادة المستقلة",
      methode: [
        "حدّد مبكرًا مستخدمي الطريق الهشّين: المشاة، راكبي الدراجات، السكوترات الكهربائية، ذوات العجلتين.",
        "لتجاوز راكب دراجة، اترك مسافة: متر واحد داخل المدينة، ومتر ونصف خارج التجمعات السكنية. إذا لم تستطع، فانتظر.",
        "أبطئ وتوقّع في مناطق الـ30، قرب المدارس، ومحطات الحافلات. للمشاة أولوية المرور.",
        "المشاة الذين ينتظرون العبور لهم الأولوية أصلًا: لا تنتظر حتى يضع أحدهم قدمه على الطريق. إذا كان عند ممرّ مشاة ويريد العبور، فدعه يمرّ.",
        "راقب نقاطك العمياء قبل كل مناورة: تختبئ فيها الدراجة أو السكوتر بسرعة.",
        "ابقَ مهذبًا: نظرة، إشارة باليد، وتُفسح الطريق دون إجبار. السرعة تأتي بعد السلامة.",
      ],
      pourquoi:
        "كلما كان مستخدم الطريق أكثر هشاشة، كلّفه الخطأ أكثر. أنت تتوقّع أخطاءه هو، لأنك من يملك هيكل السيارة حوله. في الامتحان، إفساح الطريق لمشاة لهم الأولوية ليس مجرد «تهذيب»: بل هو التزام. عدم فعله يؤدي إلى الرسوب المباشر.",
      erreur:
        "تجاوز راكب دراجة «بمحاذاته» دون تغيير مسارك، أو الانطلاق بحدّة عند ممرّ مشاة بمجرد أن تصبح الإشارة خضراء دون التأكد من خلوّه من أي شخص. انتبه للعكس أيضًا: التوقّف لـ«إفساح الطريق» لشخص ليست له الأولوية (إشارتك خضراء وإشارته حمراء) توقّف غير مبرَّر وخطير — وبالتالي خطأ.",
      bva: null,
    },
    C4f: {
      titre: "خُض الامتحان العملي دون ذعر",
      competence: "القيادة المستقلة",
      methode: [
        "اضبط مكان قيادتك كما في التدريب: المقعد (الارتفاع، العمق، المسند، مسند الرأس)، المقود، المرايا، حزام الأمان. لا ترتيب مفروض للمرايا. إذا أعدت ضبط مقعدك، فأعد ضبط مراياك بعده.",
        "أمّن السلامة داخل السيارة: تأكّد من أن الجميع مربوطون بالأحزمة، وأن الأبواب مغلقة (لا ضوء تحذيري)، ولا ضوء تحذيري أحمر على لوحة القيادة. إنها نقطة سهلة.",
        "الفحوصات 3 نقاط مجانية. يطلب منك الممتحِن آخر رقمين من عدّاد المسافات، ثم يطرح عليك 3 أسئلة مرتبطة بهذا الرقم: سؤال فحص (داخلي أو خارجي يُسحب بالقرعة)؛ سؤال في السلامة المرورية؛ سؤال في الإسعافات الأولية (عام، ليس بالضرورة مرتبطًا بالقيادة). كل إجابة صحيحة = نقطة واحدة. هذا لا يؤدي إلى الرسوب المباشر، لكن لا تدعها تفوتك: قد ترسب في رخصتك بفارق نقطة واحدة.",
        "أنصت جيدًا إلى تعليمات الممتحِن وقُد كالمعتاد. يمكنك أن تطلب منه الإعادة إذا لم تفهم.",
        "قُد بأسلوبك أنت، لا بأسلوب الممتحِن: حافظ على فحوصاتك، وإشارات انعطافك، ومسافاتك، وسرعتك.",
        "أنصت أيضًا إلى ملاحظاته أثناء الطريق: فهي لمساعدتك، لا لإغراقك. صحّح وتابع.",
        "إذا ارتكبت خطأً صغيرًا، فتابع بهدوء. الخطأ البسيط لا يُفسد كل شيء.",
        "المناورة المطلوبة: خذ وقتك، بسرعة بطيئة، وانظر في كل الاتجاهات (الرؤية المباشرة، وليس المرايا فقط). لا تنسَ إشارة الانعطاف قبل التوقف للمناورة، لا بعده.",
      ],
      pourquoi:
        "يقيّم الممتحِن سلامتك واستقلاليتك، لا الكمال. يريد أن يرى سائقًا يدبّر أمره بنفسه دون تعريض أحد للخطر. كثير من المتعلمين «لم يعودوا يسمعون» الممتحِن من شدة توترهم، فينطلقون خاسرين رغم أنهم كانوا ناجحين. غالبًا ما تكون ملاحظاته أثناء الامتحان من باب اللطف لتنضج قيادتك — وبعض «الأخطاء» التي تظنها خطيرة ليست كذلك بالنسبة له.",
      erreur:
        "التجمّد أو الاستسلام بعد خطأ صغير («انتهى الأمر، أنا متوتّر جدًا»)، بينما الامتحان يسير على ما يرام. أو القيادة بطريقة غير معتادة (بطيء جدًا، متوتّر جدًا) لـ«إظهار أداء جيد»، وهو ما يخلق الأخطاء بالضبط.",
      bva: null,
    },
    C4g: {
      titre: "بداية جيدة كسائق حديث (الفترة الاختبارية)",
      competence: "القيادة المستقلة",
      methode: [
        "ألصق قرص «A» في الخلف: لمدة 3 سنوات في المسار العادي، وسنتين إذا اتّبعت القيادة المرافَقة (AAC).",
        "التزم بالسرعات المخفَّضة للسائق الحديث: 110 كم/س على الطريق السريع، 100 كم/س على المسار السريع (طرق ذات مسارين منفصلين)، 80 كم/س على الطرق خارج التجمعات السكنية.",
        "صفر كحول، أو ما يقارب ذلك: 0.2 غ/ل من الدم كحد أقصى للسائق الحديث (عمليًا، لا تشرب إذا كنت ستقود).",
        "اعتنِ برصيدك من النقاط: تبدأ بـ6 نقاط، ترتفع إلى 12 إذا لم تفقد شيئًا خلال الفترة.",
        "استمر في القيادة بذكاء، حتى بعد الحصول على الرخصة. الرخصة تسمح لك بالقيادة، ولا تُجبرك على الاندفاع: إذا لم تكن مرتاحًا، فقُم برحلات قصيرة هادئة في البداية، وجهّز مساراتك، واحتفظ بالعادات الجيدة من الدروس (التوقّع، المسافات، لا هاتف). الأشهر الأولى بمفردك هي الأكثر خطورة.",
      ],
      pourquoi:
        "السنوات الأولى بمفردك خلف المقود هي الأخطر: لم يعد المدرّب بجانبك. قرص «A» والسرعات المخفَّضة يتركان هامشًا ريثما تأتي الخبرة. يطمئن المدرّبون من يخافون القيادة بمفردهم: الرخصة حق، وليست إلزامًا بالذهاب إلى وسط المدينة مساء الجمعة في اليوم التالي. سِر على وتيرتك الخاصة.",
      erreur:
        "الشعور بـ«التحرّر» بمجرد حصولك على الرخصة والتخلّي عن العادات الجيدة (السرعة، الهاتف، المسافات). مخالفة كبيرة واحدة قد تُطيح بالرخصة الجديدة تمامًا.",
      bva: null,
    },
  },
};

export const FICHE_QUIZ_I18N = {
  en: {
    C1a: [
      {
        q: "You want to use the turn signal. Which stalk?",
        options: ["The right one", "The left one", "The button in the middle"],
        explication:
          "Pro tip: turn signal on the left, wipers on the right. You'll never mix them up again.",
      },
      {
        q: "You want to clear the windscreen. What do you use?",
        options: ["The right stalk", "The left stalk", "The headlight flash"],
        explication:
          "Right = windscreen wipers and washer. The left is for your turn signals.",
      },
      {
        q: "Ignition on, a warning light stays on after the check. What do you do?",
        options: [
          "You wait and report it",
          "You drive off, it'll go away",
          "You turn off the headlights",
        ],
        explication:
          "A warning light that stays on (oil, brakes, battery) signals a real fault.",
      },
      {
        q: "Before getting in, what's your very first move?",
        options: [
          "Start the engine",
          "Adjust the radio",
          "A quick walk around the car",
        ],
        explication:
          "Nothing under the wheels, tyres, lights and plates clean: ten seconds that save you.",
      },
    ],
    C1b: [
      {
        q: "Why keep your left leg slightly bent when adjusting the seat?",
        options: [
          "For knee comfort",
          "To press the clutch all the way down",
          "To see the road better",
        ],
        explication:
          "A straight leg = clutch not fully pressed, and you stall without understanding why.",
      },
      {
        q: "You're adjusting the interior mirror. Do you lean over?",
        options: [
          "Yes, to see better",
          "You tilt your head",
          "No, back and shoulders pressed against the seat",
        ],
        explication:
          "It should show the whole rear window without you moving from your position.",
      },
      {
        q: "Where should the seatbelt sit on your chest?",
        options: [
          "On the shoulder, never on the neck",
          "As close to the neck as possible",
          "Under the arm",
        ],
        explication:
          "On the shoulder and across the hips, flat, never twisted. Otherwise it protects poorly.",
      },
      {
        q: "How do you quickly check if your seat height is right?",
        options: [
          "You lower the sun visor",
          "You touch the ceiling",
          "You look at the bonnet",
        ],
        explication:
          "If you can see the road under the lowered sun visor, your eye height is right.",
      },
    ],
    C1c: [
      {
        q: "Where do you place your hands on the steering wheel?",
        options: [
          "At the top, at twelve o'clock",
          "At 9 and 3, like a clock showing 9:15",
          "One hand is enough",
        ],
        explication:
          "Thumbs resting on the rim: you keep precision and strength to react quickly.",
      },
      {
        q: "You've just turned the wheel fully to the right. How do you straighten up?",
        options: [
          "By feel",
          "The exact opposite: one and a half turns to the left",
          "You let go of the wheel",
        ],
        explication:
          "A steering wheel turns about one and a half turns each way. You just reverse it.",
      },
      {
        q: "In reverse, you're not sure which way to turn. What's the reference?",
        options: [
          "You turn toward where you want the car to go",
          "You turn the opposite way",
          "You look ahead",
        ],
        explication:
          "Same logic forwards and backwards: it stops you mixing up left and right.",
      },
      {
        q: "The car slowly starts to go crooked during a manoeuvre. What do you do?",
        options: [
          "Lots of quick steering jerks",
          "You speed up to catch it",
          "You slow down, look, correct gently",
        ],
        explication:
          "Repeated steering jerks throw you off. Slow down first, correct afterwards.",
      },
    ],
    C1d: [
      {
        q: "You're moving off. What's the tempo of the clutch?",
        options: [
          "Release it all at once",
          "Press the clutch, find the biting point, ease it up gently",
          "Floor the accelerator first",
        ],
        explication:
          "What makes you stall is releasing the clutch all at once at the biting point.",
      },
      {
        q: "Why a touch of accelerator when moving off?",
        options: [
          "To make noise",
          "To give the engine some power",
          "It's not useful",
        ],
        explication:
          "The car weighs a tonne: without a bit of gas when moving off, you stall.",
      },
      {
        q: "You brake to come to a full stop. When do you press the clutch?",
        options: ["Just before stopping", "Right away", "After stopping"],
        explication:
          "Too early = coasting, too late = you stall right before stopping.",
      },
      {
        q: "Heel lifted, sole sliding on the pedal: what's the risk?",
        options: [
          "None, it's the same",
          "You lose the biting point",
          "You brake harder",
        ],
        explication:
          "With your heel anchored on the floor and pivoting, you find the biting point in the same place every time.",
      },
    ],
    C1e: [
      {
        q: "A light turns red 100 m ahead. First move?",
        options: [
          "Brake hard at the last moment",
          "Ease off the accelerator, then brake gently",
          "Keep the gas on",
        ],
        explication:
          "Engine braking already does part of the work. You anticipate, you don't slam the brakes.",
      },
      {
        q: "What is progressive braking in two stages?",
        options: [
          "Brake hard all the way",
          "Pump the pedal",
          "Firm to slow down, light to hold",
        ],
        explication:
          "You ease off just before stopping: no jolt, passengers not jostled.",
      },
      {
        q: "Driving in stop-and-go bursts (accelerate hard, brake hard, on repeat), why is it bad?",
        options: [
          "It's faster",
          "You look too close, you tire everyone out",
          "It's safer",
        ],
        explication:
          "Look far ahead: you see slowdowns coming and you smooth out your driving.",
      },
      {
        q: "How do you practise controlling the accelerator?",
        options: [
          "Hold steady at different engine speeds",
          "By flooring it",
          "Only when driving fast",
        ],
        explication:
          "You aim for an engine speed, and if you go over you ease off a little without letting go. Even while stopped.",
      },
    ],
    C1f: [
      {
        q: "You're changing gear. Where do you look?",
        options: ["The gear lever", "The road, always", "The dashboard gauge"],
        explication:
          "You feel the gears by hand, palm on the knob, without taking your eyes off the road.",
      },
      {
        q: "How do you hold the gear lever?",
        options: [
          "With your fingertips",
          "Gripped very tightly",
          "Palm resting on the knob, without forcing",
        ],
        explication:
          "It's the hand position that matters, not the force. A gearbox mistake is a fail.",
      },
      {
        q: "Sharp bend ahead. Do you downshift before or during?",
        options: [
          "During the bend",
          "Before, once you've slowed down",
          "After the bend",
        ],
        explication:
          "You downshift because you've already slowed down, to have pickup on the way out.",
      },
      {
        q: "You stop at a stop sign. In which gear?",
        options: ["In 1st", "In 2nd", "In neutral"],
        explication:
          "You stop in 2nd, then shift back to 1st to move off. Smoother.",
      },
    ],
    C1g: [
      {
        q: "On a tyre, what do you check by eye before setting off?",
        options: [
          "Flat, cut, worn tread",
          "The colour of the rim",
          "The brand of the tyre",
        ],
        explication:
          "A bald or damaged tyre brakes poorly and can burst. Check the wear indicator.",
      },
      {
        q: "The examiner: show me the dipped-beam control. What do you do?",
        options: [
          "You recite from memory",
          "You point to it and operate it",
          "You explain without touching",
        ],
        explication:
          "You show, you don't recite: you point to the left stalk and operate it.",
      },
      {
        q: "Why check your lights before driving?",
        options: [
          "For decoration",
          "A dead light = you're not seen",
          "It uses less fuel",
        ],
        explication:
          "A broken turn signal or brake light: others can no longer read your intentions. Direct danger.",
      },
      {
        q: "At the test, what exactly is the walk-around check?",
        options: [
          "Reciting a long list",
          "Just looking at the tyres",
          "A check + safety + first aid question",
        ],
        explication:
          "You show the part (the oil cap is here) and you do the action, calmly.",
      },
    ],
    C1h: [
      {
        q: "The golden rule of any slow manoeuvre like parallel parking?",
        options: [
          "Go very slowly",
          "Go fast to finish",
          "Turn the wheel as late as possible",
        ],
        explication:
          "You're not being timed: going slowly gives you time to steer and correct.",
      },
      {
        q: "You can lightly touch the kerb during a manoeuvre. And mount it?",
        options: [
          "Yes, if it's gentle",
          "No, hitting or mounting it = a fail",
          "Only with the rear wheel",
        ],
        explication:
          "Lightly touching it, yes. Mounting or hitting the kerb, that's an instant fail.",
      },
      {
        q: "Reverse bay parking: which reference do you aim for as you turn to look back?",
        options: [
          "The 2nd light of the neighbouring car",
          "The first light, toward the start of the rear window",
          "The front bumper",
        ],
        explication:
          "If you aim for the 2nd light, you drift too wide. First light = good trajectory.",
      },
      {
        q: "During a manoeuvre, do you have right of way over other road users?",
        options: [
          "Yes, you're manoeuvring",
          "No, never: you let them pass",
          "Only at night",
        ],
        explication:
          "You make it safe first, do 360° checks, and let everyone pass.",
      },
    ],
    C1i: [
      {
        q: "You mess up the start of a parallel park. Good reaction?",
        options: [
          "Force your way in anyway",
          "Straighten up, judge the space, correct",
          "Start all over in a panic",
        ],
        explication:
          "Wheel straight, wheels straight, you bring the car back to the side where you have space.",
      },
      {
        q: "How do you know a manoeuvre is truly mastered?",
        options: [
          "When the instructor guides you well",
          "When you go fast",
          "When you do it alone, without guidance",
        ],
        explication:
          "If you wait for the instructor's cue at every step, it's not learned yet.",
      },
      {
        q: "Before starting a manoeuvre on your own, first safety move?",
        options: [
          "Accelerate",
          "Turn signal + checks (mirrors, blind spot)",
          "Honk the horn",
        ],
        explication:
          "You make it safe before moving, and you never have right of way during a manoeuvre.",
      },
      {
        q: "Parallel parking on the left: when is it allowed?",
        options: [
          "Always, whatever the street",
          "Only on a one-way street",
          "Never",
        ],
        explication:
          "On the left outside a one-way street, you end up facing oncoming traffic. Choose the right side.",
      },
    ],
    C2a: [
      {
        q: "You're driving in town on a straight stretch. Where do you look?",
        options: [
          "Far ahead, at mid-height of the windscreen",
          "On the bonnet of your car",
          "On the car right in front of you",
        ],
        explication:
          "Looking far ahead gives you time to anticipate instead of just reacting.",
      },
      {
        q: "How often do you check the interior mirror?",
        options: [
          "Once when you arrive, that's enough",
          "Only before braking",
          "About every 5 to 7 seconds",
        ],
        explication:
          "Knowing who's behind you prepares you to brake or change lanes without surprises.",
      },
      {
        q: "A ball crosses the road 50 m ahead of you. Your reaction?",
        options: [
          "Honk to warn",
          "Ease off the accelerator and scan the pavements with your eyes",
          "Keep going, it's already gone by",
        ],
        explication: "Behind a ball, there's often a child running after it.",
      },
      {
        q: "To take in the whole scene properly, what do you move?",
        options: [
          "Only your eyes",
          "Your head, not just your eyes",
          "Nothing, you stare straight ahead",
        ],
        explication:
          "Turning your head lets you see driveways and side streets opening onto the road.",
      },
    ],
    C2b: [
      {
        q: "You're approaching a school, children on the pavement, and you're under the speed limit. What do you do?",
        options: [
          "You ease off the accelerator anyway",
          "You keep your speed, you're within the limit",
          "You speed up to get past quickly",
        ],
        explication:
          "The limit is a maximum, not a requirement: the right speed depends on the real risk.",
      },
      {
        q: "How do you check your distance from the car in front?",
        options: [
          "By eye, one car length",
          "As long as you can see its lights, you're fine",
          "The 2-second rule using a fixed marker",
        ],
        explication:
          "Two seconds is your margin to brake if it stops suddenly.",
      },
      {
        q: "It's raining. How much distance do you leave from the car in front?",
        options: [
          "The same as in dry conditions",
          "You double it: at least 4 seconds",
          "You reduce it to see it better",
        ],
        explication:
          "On wet ground, your braking distance shoots up: double the margin.",
      },
      {
        q: "You're going down a fairly steep slope. How do you manage your speed?",
        options: [
          "You release the accelerator and let the slope slow you down",
          "You keep accelerating to stay smooth",
          "You brake hard continuously",
        ],
        explication:
          "Accelerating downhill means gaining speed for nothing and braking harder afterwards.",
      },
    ],
    C2c: [
      {
        q: "You're driving alongside cars parked on the right. How much distance?",
        options: [
          "At least the width of a car door",
          "As close as possible to stay to the right",
          "You go right up close, it forces you to slow down",
        ],
        explication:
          "A door can open or a pedestrian can appear between two cars.",
      },
      {
        q: "The street looks too narrow for your car. What do you do?",
        options: [
          "You pull all the way over to the right",
          "You stop, it won't fit",
          "You trust your reference points: the lane is wider than it looks",
        ],
        explication:
          "A lane is at least 3 m wide, your car 1.80 m: it's an optical illusion.",
      },
      {
        q: "Where do you position yourself in your lane during normal driving?",
        options: [
          "Right up against the right-hand kerb",
          "In the middle of your lane",
          "Straddling the centre line",
        ],
        explication:
          "Well centred, your car is easy to read and you keep a margin on both sides.",
      },
      {
        q: "You come across a cyclist on a narrow road. How do you position yourself?",
        options: [
          "You pull to the right to avoid him",
          "You pass as close as possible, he has his lane",
          "You move slightly to the left, after checking it's clear",
        ],
        explication:
          "You move to the left when it's safe, you never brush past the bike.",
      },
    ],
    C2d: [
      {
        q: "You're approaching a sharp bend. When do you brake?",
        options: [
          "Before, on the part that's still straight",
          "Right in the middle of the bend",
          "At the exit of the bend",
        ],
        explication:
          "The car brakes well in a straight line; braking in the curve unbalances it.",
      },
      {
        q: "In the bend, where do you look?",
        options: [
          "The edge of the road, so you don't clip it",
          "Far ahead, towards the exit of the bend",
          "The bonnet, to follow the line",
        ],
        explication:
          "Your gaze pulls your trajectory: if you look at the edge, you head towards the edge.",
      },
      {
        q: "How do you hold the steering wheel in a left-hand bend?",
        options: [
          "You force it with both hands all the way",
          "You let go and let it come back on its own",
          "You pull with one hand, the left one",
        ],
        explication:
          "Pulling with one hand keeps the movement smooth; forcing with both hands makes you tense and drift.",
      },
      {
        q: "At what point do you accelerate again in a bend?",
        options: [
          "Right at the entry, to stay dynamic",
          "At the tightest point",
          "At the exit, when the road opens up again, gently",
        ],
        explication:
          "Accelerating too early opens up your trajectory and pushes you towards the outside.",
      },
    ],
    C2e: [
      {
        q: "You're hesitating about overtaking: visibility isn't perfect. What do you do?",
        options: [
          "You go for it, it'll be fine",
          "You don't overtake: you ease off and give it up",
          "You move out to see better",
        ],
        explication:
          "Doubt alone is enough to cancel the overtake: you only overtake when you can see far and the way is clear.",
      },
      {
        q: "Before pulling out to overtake, what's the correct sequence of checks?",
        options: [
          "Turn signal then pull out",
          "A glance in the mirror and off you go",
          "Interior mirror, left mirror, turn signal, blind spot, go",
        ],
        explication:
          "This sequence makes sure no one is already overtaking you.",
      },
      {
        q: "You're overtaking a cyclist outside town. What side clearance?",
        options: [
          "At least 1.50 m",
          "50 cm is enough",
          "You go right up close to get past quickly",
        ],
        explication:
          "1.50 m outside town, 1 m in town: a cyclist can swerve at any moment.",
      },
      {
        q: "You've just overtaken a car. When do you pull back in front of it?",
        options: [
          "As soon as your front end is past it",
          "When you can see it fully in your interior mirror, right turn signal on",
          "When the driver behind demands it of you",
        ],
        explication:
          "Pulling back in too early forces it to brake: you cut it off.",
      },
    ],
    C2f: [
      {
        q: "Junction with no sign or traffic light at all. Who goes first?",
        options: [
          "Whoever arrives fastest",
          "You, you're going straight ahead",
          "Whatever comes from your right",
        ],
        explication:
          "With no signage, it's priority to the right: you give way to whatever comes from your right.",
      },
      {
        q: "How do you tell a roundabout from a traffic circle?",
        options: [
          "By its size",
          "At the entry: a Give Way sign = roundabout, no sign at all = traffic circle",
          "By the colour of the road markings",
        ],
        explication:
          "Roundabout: you give way to those already on it. Traffic circle: priority to the right, the driver entering has priority.",
      },
      {
        q: "On a roundabout, when do you put your right turn signal on?",
        options: [
          "As soon as you enter the ring",
          "Never, it's pointless",
          "Just before your exit",
        ],
        explication:
          "Too early, the turn signal makes others think you're exiting sooner and blocks them.",
      },
      {
        q: "A car coming from your right slows down to let you go, with no sign. Do you go?",
        options: [
          "Yes, it signalled you to go",
          "No: it has right of way, you let it go",
          "You speed up so as not to hold it up",
        ],
        explication:
          "If it has to brake for you, that already means you've failed to give it right of way.",
      },
    ],
    C2g: [
      {
        q: "You're turning left in 50 m. When do you put the turn signal on?",
        options: [
          "Early enough, before you turn",
          "Right at the moment you turn",
          "Once you're already in the street",
        ],
        explication:
          "A turn signal switched on during the turn has warned no one.",
      },
      {
        q: "A pedestrian is waiting at the edge of a pedestrian crossing. Your move?",
        options: [
          "Make eye contact and slow down to let them cross",
          "Honk so they make up their mind",
          "Go quickly before them",
        ],
        explication:
          "Eye contact removes the doubt; you never force your way through.",
      },
      {
        q: "Someone is tailgating you and it's annoying you. Do you honk to show your irritation?",
        options: [
          "Yes, they'll get the message",
          "You brake sharply to calm them down",
          "No, the horn is for warning of danger",
        ],
        explication: "In town, use of the horn is in fact strictly limited.",
      },
      {
        q: "You've put your turn signal on to change lanes. What do you do next?",
        options: [
          "You wait 50 m before moving over",
          "You move over as soon as it's possible",
          "You switch the turn signal off and stay put",
        ],
        explication:
          "Signalling without moving over keeps those behind you in doubt.",
      },
    ],
    C2h: [
      {
        q: "You realise too late that you're in the wrong lane on the roundabout. Your reaction?",
        options: [
          "You force your way into the other lane straight away",
          "You stay in your lane and go round again if needed",
          "You brake suddenly in the middle",
        ],
        explication:
          "You never force a lane change in traffic to make up for a mistake.",
      },
      {
        q: "A delivery van is blocking your lane. What do you do?",
        options: [
          "You pull out quickly before anyone comes",
          "You honk to make it move",
          "You stop, check behind and the blind spot, then go around if it's clear",
        ],
        explication: "You treat the obstacle like a mini-overtake, safely.",
      },
      {
        q: "How do you know you've mastered driving in town?",
        options: [
          "When you can string together a long stretch without the instructor stepping in",
          "When you drive fast without stalling",
          "When you know all the streets",
        ],
        explication:
          "Your checks have become automatic: your mind is free to anticipate.",
      },
      {
        q: "Before setting off on a trip alone in town, what do you do?",
        options: [
          "You set off and improvise",
          "You picture your route and the tricky areas",
          "You wait until you have a talking GPS",
        ],
        explication:
          "Picturing the route frees your mind to make decisions instead of searching for your way.",
      },
    ],
    C3a: [
      {
        q: "Headlights are coming toward you at night. Where do you look?",
        options: [
          "The oncoming headlights",
          "The right edge of your lane",
          "The center of the road",
        ],
        explication:
          "Staring at the headlights dazzles you; the right edge keeps you on your line.",
      },
      {
        q: "Empty road, a glow of headlights appears in the distance. What do you do?",
        options: [
          "Switch back to low beams",
          "Stay on high beams",
          "Flash your headlights",
        ],
        explication:
          "You dim as soon as you notice someone, even a faint glow, so you don't dazzle them.",
      },
      {
        q: "At night, you're unsure about a dimly-lit pedestrian ahead. What do you do?",
        options: [
          "You speed up to get past",
          "You honk and push on",
          "You ease off and check",
        ],
        explication:
          "Certainty = act, doubt = no speed: a pedestrian in dark clothes is seen very late.",
      },
      {
        q: "You feel your eyelids drooping at the wheel at night. The right reaction?",
        options: [
          "You hold on until the 2-hour mark",
          "You stop at the first sign",
          "You open the window and keep going",
        ],
        explication:
          "Break every 2 hours, but above all at the slightest sign of tiredness, without waiting.",
      },
    ],
    C3b: [
      {
        q: "In the rain, you multiply your safety distance by how much?",
        options: ["By 2", "You keep it the same", "By 1.5"],
        explication:
          "Wet ground = braking doubled: you go from a 2-second to a 4-second gap.",
      },
      {
        q: "It's raining hard. Can you turn on your rear fog light?",
        options: [
          "Yes, always in the rain",
          "No, forbidden in the rain",
          "Only at night",
        ],
        explication:
          "The rear one dazzles the car behind: it's reserved for fog or snow.",
      },
      {
        q: "A big puddle blocks your lane, impossible to avoid. What do you do?",
        options: [
          "Charge through it at normal speed",
          "Brake hard in the puddle",
          "Slow down before, cross with steering steady",
        ],
        explication:
          "Charging in = aquaplaning: you slow down before, never in the puddle, with no sharp steering.",
      },
      {
        q: "On a motorway limited to 130, it starts raining. Your max speed?",
        options: ["130 km/h", "110 km/h", "120 km/h"],
        explication:
          "In the rain 130 drops to 110: less grip, so you ease off.",
      },
    ],
    C3c: [
      {
        q: "You come onto wet dead leaves at the exit of a bend. What do you do?",
        options: [
          "A quick steering jerk to get through fast",
          "Ease off before, steering steady",
          "Brake hard on them",
        ],
        explication:
          "Wet leaves are as slippery as soap: any abrupt move sends the car skidding.",
      },
      {
        q: "On a slippery road, when do you brake before a bend?",
        options: [
          "In a straight line, before the bend",
          "Right in the middle of the bend",
          "At the exit of the bend",
        ],
        explication:
          "Braking and turning together needs too much grip: you brake straight, then turn with your foot off.",
      },
      {
        q: "The rear of your car slides slightly on black ice. First thing?",
        options: [
          "A sharp brake",
          "Steer hard the other way",
          "Ease off and aim where you want to go",
        ],
        explication:
          "The car follows your eyes; a sharp brake makes the skid worse.",
      },
      {
        q: "You spot a shiny patch in the shade under the trees. What do you do?",
        options: [
          "You slow down gently before reaching it",
          "You brake once you're on it",
          "You speed up to get past fast",
        ],
        explication:
          "You anticipate: ease off before the slippery zone, never on it.",
      },
    ],
    C3d: [
      {
        q: "Emergency braking in a car with ABS. Your first move?",
        options: [
          "Press the clutch first",
          "Brake all the way at once",
          "Brake in small jerks",
        ],
        explication:
          "Brake first, all the way: the clutch comes only after, just before stalling.",
      },
      {
        q: "During emergency braking, the pedal vibrates hard under your foot. What do you do?",
        options: [
          "You ease off a bit",
          "You pump the pedal",
          "You keep pressing hard",
        ],
        explication:
          "The vibration is the ABS working: easing off lengthens the stopping distance.",
      },
      {
        q: "An obstacle is right in front of you during emergency braking. Where do you look?",
        options: ["The obstacle", "Your clear escape route", "Your mirrors"],
        explication:
          "The car follows your eyes: aiming at the clear space takes you there, staring at the obstacle sends you into it.",
      },
      {
        q: "With ABS, during emergency braking, can you steer the car?",
        options: [
          "No, the wheels are locked",
          "Yes, you brake all the way AND steer",
          "Only after easing off",
        ],
        explication:
          "ABS prevents the wheels from locking: you keep steering to avoid the obstacle.",
      },
    ],
    C3e: [
      {
        q: "You're on the motorway on-ramp. Your speed target?",
        options: [
          "Slow down to merge",
          "Reach the traffic speed (70-80 min)",
          "Stop at the end of the ramp",
        ],
        explication:
          "You merge into a gap at their pace; arriving slowly forces everyone to brake.",
      },
      {
        q: "You've just overtaken a truck on the motorway. What do you do?",
        options: [
          "You stay in the left lane",
          "You pull back to the right",
          "You slow down alongside it",
        ],
        explication:
          "The left lane is for overtaking: you clear it as soon as you've passed.",
      },
      {
        q: "Your motorway exit is coming up. When do you slow down?",
        options: [
          "On the main lane",
          "As soon as you see the sign",
          "Once on the deceleration lane",
        ],
        explication:
          "You never brake on the motorway itself: signal early, then slow down on the slip road.",
      },
      {
        q: "Before merging, on top of the left mirror, what do you check?",
        options: [
          "Nothing else",
          "The blind spot over your shoulder",
          "Just the interior mirror",
        ],
        explication:
          "A motorcyclist or a car can slip into the blind spot, invisible in the mirror.",
      },
    ],
    C3f: [
      {
        q: "You're entering a tunnel in broad daylight. Your move before the entrance?",
        options: [
          "Turn on the high beams",
          "Turn on the low beams",
          "Turn on nothing",
        ],
        explication:
          "Low beams make you visible without blinding others; never high beams in a tunnel.",
      },
      {
        q: "As soon as you're in the tunnel, what do you spot first?",
        options: [
          "The nearest emergency exit",
          "The radio station",
          "The speed of the others",
        ],
        explication:
          "In an enclosed space, knowing where to escape makes all the difference if something goes wrong.",
      },
      {
        q: "You're crossing a long exposed bridge on a windy day. How do you hold the wheel?",
        options: [
          "One hand, relaxed",
          "You let go at the end of the bridge",
          "Firmly with both hands",
        ],
        explication:
          "The side wind shoves the car suddenly: a loose grip = a swerve.",
      },
      {
        q: "In a tunnel, your car breaks down. What is forbidden?",
        options: [
          "Switching off the engine",
          "Making a U-turn or reversing",
          "Walking to the emergency exit",
        ],
        explication:
          "No U-turn or reversing in a tunnel: you switch off the engine and reach the exit on foot.",
      },
    ],
    C3g: [
      {
        q: "You're about to turn right in town. On top of the mirror, what do you check?",
        options: [
          "Nothing else",
          "Your right blind spot, over your shoulder",
          "The left mirror only",
        ],
        explication:
          "A cyclist coming up on your right is invisible in the mirror: the shoulder glance avoids the accident.",
      },
      {
        q: "A bus stopped on your right hides the pedestrian crossing in front of it. What do you do?",
        options: [
          "You go through normally",
          "You honk and overtake",
          "You slow down and only move on once sure",
        ],
        explication:
          "The bus hides a pedestrian who could dart out: as long as you're not sure, you don't accelerate.",
      },
      {
        q: "You're overtaking a cyclist on an urban boulevard. What's the minimum gap?",
        options: [
          "At least 1 meter",
          "50 cm is enough",
          "You can graze past if you slow down",
        ],
        explication:
          "1 m in town (1.50 m outside built-up areas) absorbs the surprise of a bike weaving.",
      },
      {
        q: "A bus is pulling away from its stop right in front of you. What do you do?",
        options: [
          "You speed up to get past before it",
          "You ease off and let it pull out",
          "You honk so it waits",
        ],
        explication:
          "A bus leaving its stop has right of way: you give it room.",
      },
    ],
    C4a: [
      {
        q: "Before a long trip on unfamiliar roads, what do you do?",
        options: [
          "You just set off on a whim, you'll see",
          "You look at the whole route and note 2-3 landmarks",
          "You set the GPS while driving",
        ],
        explication:
          "What you prepare while stopped frees up your attention for the road.",
      },
      {
        q: "When do you set the GPS?",
        options: [
          "With the car stopped, before setting off",
          "At the first red light",
          "As soon as you're driving",
        ],
        explication:
          "2 seconds with your eyes down at 90 km/h is 50 m driven blind.",
      },
      {
        q: "4 hours of driving. What about your breaks?",
        options: [
          "None if you feel fine",
          "Just one halfway through",
          "About 15 min every 2 hours",
        ],
        explication: "Fatigue hits without warning: a regular break is safety.",
      },
      {
        q: "A road is reported closed. The right move?",
        options: [
          "Having planned a backup route",
          "Force your way through",
          "Improvise on the spot",
        ],
        explication:
          "A ready plan B saves you from searching for your way out in a panic.",
      },
    ],
    C4b: [
      {
        q: "The GPS says left, but the sign shows no entry. Which do you follow?",
        options: [
          "The GPS, it knows the road",
          "The road signs, always",
          "You stop to think",
        ],
        explication:
          "The GPS may be out of date: what you see on the road always wins.",
      },
      {
        q: "You miss your motorway exit. What do you do?",
        options: [
          "You brake to cut back in",
          "You reverse a short way",
          "You keep going to the next exit",
        ],
        explication:
          "A missed exit costs 10 minutes, not your life: never reverse on a motorway.",
      },
      {
        q: "Your town is right at the bottom of the motorway sign. That means?",
        options: [
          "Your exit is the next one",
          "Your exit is still far off",
          "You've gone the wrong way",
        ],
        explication:
          "The lower the name, the closer the exit: move into the right lane early.",
      },
      {
        q: "You have to cross several lanes for your exit. When to start?",
        options: [
          "At the last moment, all at once",
          "As early as possible, smoothly",
          "By forcing your way over",
        ],
        explication:
          "You gather the info early (mirrors, turn signal) and slide over without losing speed.",
      },
    ],
    C4c: [
      {
        q: "In eco-driving, do you shift gears early or late?",
        options: [
          "Late, to have more power",
          "Early, to drive at low revs",
          "Always in 2nd in town",
        ],
        explication:
          "A low-revving engine uses less fuel, makes less noise and wears less.",
      },
      {
        q: "A red light 100 m ahead. The most eco-friendly move?",
        options: [
          "Keep your speed then brake hard",
          "Speed up to get through",
          "Ease off the accelerator early and let it slow down",
        ],
        explication:
          "Engine braking avoids wasting the fuel you've just burned.",
      },
      {
        q: "Smooth driving, how much fuel does it save?",
        options: [
          "A few drops, negligible",
          "Up to about 20%",
          "More than half",
        ],
        explication:
          "Smoothness is the number 1 lever of eco-driving, even before the car itself.",
      },
      {
        q: "A nice clear straight stretch. In eco-driving, what do you do?",
        options: [
          "You shift up to 5th or 6th",
          "You stay in 3rd for pickup",
          "You accelerate in jerks",
        ],
        explication: "A high gear at low revs is what uses the least fuel.",
      },
    ],
    C4d: [
      {
        q: "To anticipate hazards, where do you look?",
        options: [
          "At the bonnet, just ahead",
          "Far ahead, scanning mirrors and the sides",
          "Fixed on the car in front",
        ],
        explication:
          "The farther you see, the more time you have to decide without panicking.",
      },
      {
        q: "A car is tailgating you and honking. What do you do?",
        options: [
          "You brake to punish them",
          "You speed up over the limit",
          "You stay calm and let them overtake",
        ],
        explication:
          "Responding to aggression creates the risk; staying calm defuses it.",
      },
      {
        q: "A blind intersection, hidden by parked cars. What do you do?",
        options: [
          "You edge forward slowly, foot ready to brake",
          "You go through, saw nothing",
          "You speed up to get through fast",
        ],
        explication: "Hazard awareness is sensing the risk BEFORE you see it.",
      },
      {
        q: "The safe following distance in dry weather is the rule of?",
        options: [
          "2 seconds (4 in the rain)",
          "A fixed 1 metre",
          "Always 10 seconds",
        ],
        explication:
          "2 s from the car in front, doubled to 4 s when the road is wet.",
      },
    ],
    C4e: [
      {
        q: "You overtake a cyclist in town. What gap?",
        options: [
          "At least 1 metre",
          "Right up close, it's fine",
          "30 centimetres",
        ],
        explication:
          "1 m in town, 1.5 m outside built-up areas: the margin if he swerves suddenly.",
      },
      {
        q: "A pedestrian is waiting at the edge of a crossing. What do you do?",
        options: [
          "You go while they haven't set a foot on it",
          "You stop, they already have right of way",
          "You honk for them to wait",
        ],
        explication:
          "Driving past a pedestrian who wants to cross, on exam day, is an automatic fail.",
      },
      {
        q: "The road is too narrow to leave the cyclist 1 m. What do you do?",
        options: [
          "You overtake close anyway",
          "You honk for him to move aside",
          "You wait behind until you can overtake",
        ],
        explication:
          "Overtaking too close out of impatience is the most common cycling accident.",
      },
      {
        q: "Your light is green, the pedestrian's is red. Do you stop to let them cross?",
        options: [
          "No, that's an unjustified and dangerous stop",
          "Yes, out of politeness",
          "You honk and go through",
        ],
        explication:
          "Stopping for someone who does NOT have right of way is a mistake: you follow your right of way.",
      },
    ],
    C4f: [
      {
        q: "The examiner asks for the last two digits of the odometer. Why?",
        options: [
          "To check your mileage",
          "To draw the number of your 3 questions",
          "To note the date",
        ],
        explication:
          "It picks out 3 easy questions: vehicle check, road safety, first aid.",
      },
      {
        q: "You stall when setting off during the exam. Is it over?",
        options: [
          "Yes, it's an automatic fail",
          "No, you calmly start again",
          "You give up on the exam",
        ],
        explication:
          "A small mistake doesn't fail you: the examiner looks at your ability to correct yourself.",
      },
      {
        q: "What are the 3 exam questions about?",
        options: [
          "Vehicle check, road safety, first aid",
          "Highway code, road signs, mechanics",
          "Route, weather, GPS",
        ],
        explication:
          "Each correct answer is worth 1 point: you can fail the test by a single point.",
      },
      {
        q: "A manoeuvre is asked for during the exam. The right reflex?",
        options: [
          "Quickly, to show you've got it",
          "Slowly, looking all around, turn signal first",
          "No turn signal, it's just a manoeuvre",
        ],
        explication:
          "You put the turn signal on BEFORE stopping for the manoeuvre, not after.",
      },
    ],
    C4g: [
      {
        q: "Standard licence in hand. Max speed on the motorway?",
        options: ["130 km/h like everyone else", "110 km/h", "90 km/h"],
        explication:
          "On a probationary licence: 110 motorway, 100 dual carriageway, 80 open road, for the first 3 years.",
      },
      {
        q: "The 'A' disc at the back, how long do you keep it?",
        options: [
          "3 years (2 years with accompanied driving)",
          "6 months",
          "For life",
        ],
        explication:
          "It warns others that you're a beginner, so they give you some room.",
      },
      {
        q: "You start your probationary licence with how many points?",
        options: [
          "12 points automatically",
          "6 points that rise to 12",
          "0 points to start",
        ],
        explication:
          "6 points to start: one serious offence can wipe them all out.",
      },
      {
        q: "The max blood alcohol level for a new driver is?",
        options: [
          "0.5 g/L like everyone else",
          "0.2 g/L (in practice, zero)",
          "No limit",
        ],
        explication:
          "0.2 g/L, so put plainly: you don't drink if you're driving.",
      },
    ],
  },
  ar: {
    C1a: [
      {
        q: "تريد تشغيل إشارة الانعطاف. أي ذراع؟",
        options: ["ذراع اليمين", "ذراع اليسار", "الزر في الوسط"],
        explication:
          "حيلة المحترفين: إشارة الانعطاف على اليسار، والمساحات على اليمين. لن تخطئ بعد الآن.",
      },
      {
        q: "تريد مسح الزجاج الأمامي. ماذا تُشغّل؟",
        options: ["ذراع اليمين", "ذراع اليسار", "وميض الأضواء"],
        explication:
          "اليمين = المساحات وغسل الزجاج. أما اليسار فهو لإشارات الانعطاف.",
      },
      {
        q: "بعد تشغيل المفتاح، بقي أحد المصابيح التحذيرية مضيئاً بعد الفحص. ماذا تفعل؟",
        options: [
          "تنتظر وتُبلّغ عنه",
          "تنطلق، سيزول من تلقاء نفسه",
          "تُطفئ الأضواء",
        ],
        explication:
          "المصباح التحذيري الذي يبقى مضيئاً (الزيت، الفرامل، البطارية) يدل على عطل حقيقي.",
      },
      {
        q: "قبل ركوب السيارة، ما أول شيء تفعله؟",
        options: ["تشغيل المحرك", "ضبط الراديو", "جولة سريعة حول السيارة"],
        explication:
          "لا شيء تحت العجلات، والإطارات والأضواء واللوحات نظيفة: عشر ثوانٍ تُنقذك.",
      },
    ],
    C1b: [
      {
        q: "لماذا تُبقي ساقك اليسرى مثنية قليلاً عند ضبط المقعد؟",
        options: [
          "لراحة الركبة",
          "لكبس الدبرياج (القابض) حتى النهاية",
          "لرؤية الطريق بشكل أفضل",
        ],
        explication:
          "الساق الممدودة = الدبرياج غير مكبوس بالكامل، فيتوقف المحرك فجأة دون أن تفهم السبب.",
      },
      {
        q: "تضبط المرآة الداخلية. هل تنحني؟",
        options: [
          "نعم، لرؤية أفضل",
          "تُميل رأسك",
          "لا، الظهر والكتفان ملتصقان بالمقعد",
        ],
        explication: "يجب أن تُظهر كامل الزجاج الخلفي دون أن تتحرك من مكانك.",
      },
      {
        q: "أين يجب أن يمر حزام الأمان على الصدر؟",
        options: [
          "على الكتف، وليس على الرقبة أبداً",
          "أقرب ما يكون من الرقبة",
          "تحت الذراع",
        ],
        explication:
          "على الكتف وعلى الحوض، مستوٍ، وغير ملتوٍ أبداً. وإلا فلن يحميك جيداً.",
      },
      {
        q: "كيف تتحقق بسرعة من أن ارتفاع مقعدك مناسب؟",
        options: ["تُنزل واقي الشمس", "تلمس السقف", "تنظر إلى غطاء المحرك"],
        explication:
          "إذا كنت ترى الطريق أسفل واقي الشمس المُنزَل، فإن ارتفاع نظرك مناسب.",
      },
    ],
    C1c: [
      {
        q: "أين تضع يديك على المقود (عجلة القيادة)؟",
        options: [
          "في الأعلى، عند الساعة الثانية عشرة",
          "عند التاسعة والثالثة، كعقارب تُشير إلى 9:15",
          "يد واحدة تكفي",
        ],
        explication:
          "الإبهامان على إطار المقود: تحافظ على الدقة والقوة لتتفاعل بسرعة.",
      },
      {
        q: "لقد أدرت المقود بالكامل إلى اليمين. كيف تُعيده مستقيماً؟",
        options: [
          "بالإحساس",
          "العكس تماماً: دورة ونصف إلى اليسار",
          "تترك المقود",
        ],
        explication:
          "يدور المقود نحو دورة ونصف في كل اتجاه. ما عليك سوى عكس الحركة.",
      },
      {
        q: "أثناء الرجوع للخلف، لم تعد تعرف إلى أي جهة تُدير المقود. ما هي القاعدة؟",
        options: [
          "تُدير المقود نحو الجهة التي تريد أن تذهب إليها السيارة",
          "تُدير المقود إلى الجهة المعاكسة",
          "تنظر إلى الأمام",
        ],
        explication:
          "نفس المنطق للأمام والخلف: هذا يمنعك من الخلط بين اليمين واليسار.",
      },
      {
        q: "بدأت السيارة تنحرف ببطء أثناء المناورة. ماذا تفعل؟",
        options: [
          "حركات كثيرة ومتتالية بالمقود",
          "تُسرع لتدارك الأمر",
          "تُبطئ، وتراقب، وتُصحح بلطف",
        ],
        explication:
          "الحركات المتكررة بالمقود تُشتّتك. أبطئ أولاً، ثم صحّح بعد ذلك.",
      },
    ],
    C1d: [
      {
        q: "أنت تنطلق. ما هو إيقاع الدبرياج (القابض)؟",
        options: [
          "ترفع قدمك عنه دفعة واحدة",
          "اكبس الدبرياج، جد نقطة الالتقام، ثم ارفع قدمك بلطف",
          "اضغط دواسة الوقود بالكامل أولاً",
        ],
        explication:
          "ما يجعل المحرك يتوقف فجأة هو رفع القدم عن الدبرياج دفعة واحدة عند نقطة الالتقام.",
      },
      {
        q: "لماذا لمسة خفيفة من دواسة الوقود عند الانطلاق؟",
        options: ["لإحداث ضجيج", "لإعطاء المحرك بعض القوة", "ليس مفيداً"],
        explication:
          "تزن السيارة طناً: دون قليل من الوقود عند الانطلاق، سيتوقف المحرك فجأة.",
      },
      {
        q: "تضغط الفرامل لتتوقف تماماً. متى تكبس الدبرياج؟",
        options: ["قبل التوقف مباشرة", "على الفور", "بعد التوقف"],
        explication:
          "مبكراً جداً = انزلاق حر، متأخراً جداً = يتوقف المحرك فجأة قبيل التوقف تماماً.",
      },
      {
        q: "الكعب مرفوع، ونعل الحذاء ينزلق على الدواسة: ما الخطر؟",
        options: [
          "لا خطر، الأمر سيان",
          "تفقد نقطة الالتقام",
          "تضغط الفرامل بقوة أكبر",
        ],
        explication:
          "بتثبيت الكعب على الأرض والدوران عليه، تجد نقطة الالتقام في المكان نفسه في كل مرة.",
      },
    ],
    C1e: [
      {
        q: "تحولت إشارة ضوئية إلى الأحمر على بُعد 100 متر أمامك. أول تصرف؟",
        options: [
          "الضغط على الفرامل بقوة في اللحظة الأخيرة",
          "ترفع قدمك عن دواسة الوقود، ثم تفرمل بلطف",
          "تبقي على الوقود",
        ],
        explication:
          "كبح المحرك يقوم بجزء من العمل مسبقاً. تتوقع مبكراً، ولا تفرمل فجأة بعنف.",
      },
      {
        q: "ما هو الكبح التدريجي على مرحلتين؟",
        options: [
          "الفرملة بقوة حتى النهاية",
          "الضغط المتقطع على الدواسة",
          "بقوة للإبطاء، وبخفة للإمساك",
        ],
        explication:
          "ترفع الضغط قليلاً قبل التوقف مباشرة: بلا اهتزاز، ولا يهتز الركاب.",
      },
      {
        q: "القيادة بأسلوب الأكورديون (تسارع قوي، ثم فرملة قوية، بشكل متكرر)، لماذا هي سيئة؟",
        options: [
          "أسرع",
          "تنظر إلى مسافة قريبة جداً، وتُتعب الجميع",
          "أكثر أماناً",
        ],
        explication:
          "انظر بعيداً: ترى التباطؤات قادمة فتجعل قيادتك أكثر سلاسة.",
      },
      {
        q: "كيف تتدرب على التحكم في دواسة الوقود؟",
        options: [
          "الثبات عند سرعات دوران مختلفة للمحرك",
          "بالضغط عليها بالكامل",
          "فقط عند القيادة بسرعة",
        ],
        explication:
          "تستهدف سرعة دوران معينة، وإذا تجاوزتها تُخفف الضغط قليلاً دون أن ترفع قدمك. حتى وأنت متوقف.",
      },
    ],
    C1f: [
      {
        q: "أنت تُبدّل السرعة. إلى أين تنظر؟",
        options: ["عتلة السرعات", "الطريق، دائماً", "عداد السرعة"],
        explication:
          "تشعر بالسرعات بيدك، وراحة يدك على مقبض العتلة، دون أن ترفع عينيك عن الطريق.",
      },
      {
        q: "كيف تُمسك عتلة السرعات؟",
        options: [
          "بأطراف الأصابع",
          "بقبضة محكمة جداً",
          "راحة اليد على المقبض، دون ضغط",
        ],
        explication:
          "المهم هو وضعية اليد، وليس القوة. الخطأ في علبة السرعات يؤدي إلى الرسوب.",
      },
      {
        q: "منعطف حاد أمامك. هل تُنزّل الغيار قبل المنعطف أم أثناءه؟",
        options: ["أثناء المنعطف", "قبله، بعد أن تُبطئ", "بعد المنعطف"],
        explication:
          "تُنزّل الغيار لأنك أبطأت مسبقاً، لتحصل على قوة تسارع عند الخروج من المنعطف.",
      },
      {
        q: "تتوقف عند إشارة قف. بأي سرعة (غيار)؟",
        options: ["في الأولى", "في الثانية", "في الوضع المحايد"],
        explication:
          "تتوقف في الثانية، ثم تعود إلى الأولى للانطلاق. أكثر سلاسة.",
      },
    ],
    C1g: [
      {
        q: "على الإطار، ماذا تفحص بالعين قبل الانطلاق؟",
        options: [
          "نقص الهواء، أو قطع، أو تآكل المطاط",
          "لون الجنط",
          "ماركة الإطار",
        ],
        explication:
          "الإطار الأملس أو التالف يفرمل بشكل سيئ وقد ينفجر. انظر إلى مؤشر التآكل.",
      },
      {
        q: "الفاحص: أرني مفتاح الأضواء المنخفضة (أضواء التقاطع). ماذا تفعل؟",
        options: ["تسرد من الذاكرة", "تُشير إليه وتُشغّله", "تشرح دون أن تلمس"],
        explication: "تُظهر ولا تسرد: تُشير إلى ذراع اليسار وتُشغّله.",
      },
      {
        q: "لماذا تفحص أضواءك قبل القيادة؟",
        options: ["للزينة", "ضوء معطّل = لا يراك الآخرون", "يستهلك وقوداً أقل"],
        explication:
          "إشارة انعطاف أو ضوء فرملة معطّل: لم يعد الآخرون يفهمون نواياك. خطر مباشر.",
      },
      {
        q: "في الامتحان، ما هي جولة فحص السيارة بالضبط؟",
        options: [
          "سرد قائمة طويلة",
          "مجرد النظر إلى الإطارات",
          "فحص + سلامة + إسعافات أولية",
        ],
        explication: "تُظهر العنصر (سدادة الزيت هنا) وتقوم بالحركة، بهدوء.",
      },
    ],
    C1h: [
      {
        q: "القاعدة الذهبية لأي مناورة بطيئة مثل الركن الموازي؟",
        options: [
          "التحرك ببطء شديد",
          "الإسراع للانتهاء",
          "إدارة المقود في أقصى وقت متأخر",
        ],
        explication:
          "لست مُحتسَباً بالوقت: البطء يمنحك الوقت لإدارة المقود والتصحيح.",
      },
      {
        q: "يمكنك أن تلامس الرصيف بخفة أثناء المناورة. وأن تصعد فوقه؟",
        options: [
          "نعم، إذا كان بلطف",
          "لا، الاصطدام به أو الصعود عليه = رسوب",
          "فقط بالعجلة الخلفية",
        ],
        explication:
          "ملامسته بخفة، نعم. أما الصعود عليه أو الاصطدام به، فهو رسوب مباشر.",
      },
      {
        q: "الركن العمودي للخلف: ما القاعدة التي تستهدفها وأنت تلتفت للخلف؟",
        options: [
          "الضوء الثاني للسيارة المجاورة",
          "الضوء الأول، عند بداية الزجاج الخلفي",
          "المصد الأمامي",
        ],
        explication:
          "إذا استهدفت الضوء الثاني، فستبتعد أكثر من اللازم. الضوء الأول = مسار صحيح.",
      },
      {
        q: "أثناء المناورة، هل لديك أولوية المرور على مستخدمي الطريق الآخرين؟",
        options: [
          "نعم، لأنك تُناور",
          "لا، أبداً: تُفسح لهم المرور",
          "فقط في الليل",
        ],
        explication:
          "تؤمّن الوضع أولاً، وتفحص في كل الاتجاهات (360 درجة)، وتُفسح المرور للجميع.",
      },
    ],
    C1i: [
      {
        q: "أخطأت في بداية الركن الموازي. ما التصرف الصحيح؟",
        options: [
          "تحاول الدخول بالقوة رغم ذلك",
          "تُعدّل وضعك مستقيماً، وتُقدّر المساحة، وتُصحّح",
          "تُعيد كل شيء من جديد في حالة ذعر",
        ],
        explication:
          "المقود مستقيم، والعجلات مستقيمة، تُعيد السيارة إلى الجهة التي لديك فيها مساحة.",
      },
      {
        q: "كيف تعرف أن مناورة ما قد أتقنتها حقاً؟",
        options: [
          "عندما يُرشدك المدرّب جيداً",
          "عندما تقوم بها بسرعة",
          "عندما تقوم بها وحدك، دون إرشاد",
        ],
        explication:
          "إذا كنت تنتظر إشارة المدرّب عند كل حركة، فأنت لم تُتقنها بعد.",
      },
      {
        q: "قبل أن تبدأ مناورة بمفردك، ما أول تصرف للسلامة؟",
        options: [
          "التسارع",
          "إشارة الانعطاف + الفحوصات (المرايا، النقطة العمياء)",
          "استخدام البوق",
        ],
        explication:
          "تؤمّن الوضع قبل التحرك، ولا تملك أبداً أولوية المرور أثناء المناورة.",
      },
      {
        q: "الركن الموازي على اليسار: متى يُسمح به؟",
        options: [
          "دائماً، مهما كان الشارع",
          "فقط في الشارع ذي الاتجاه الواحد",
          "أبداً",
        ],
        explication:
          "على اليسار في شارع غير أحادي الاتجاه، تجد نفسك في الاتجاه المعاكس للسير. اختر الجهة الصحيحة.",
      },
    ],
    C2a: [
      {
        q: "أنت تقود في المدينة على طريق مستقيم. أين توجّه نظرك؟",
        options: [
          "بعيداً إلى الأمام، في منتصف ارتفاع الزجاج الأمامي",
          "على غطاء محرك سيارتك",
          "على السيارة التي أمامك مباشرة",
        ],
        explication: "النظر بعيداً يمنحك الوقت للتوقّع بدل أن تُفاجأ.",
      },
      {
        q: "كم مرة تعود إلى المرآة الداخلية؟",
        options: [
          "مرة واحدة عند الوصول، وهذا يكفي",
          "فقط قبل الكبح",
          "كل 5 إلى 7 ثوانٍ تقريباً",
        ],
        explication: "معرفة من خلفك تجهّزك للكبح أو تغيير المسار دون مفاجأة.",
      },
      {
        q: "كرة تعبر الطريق على بُعد 50 م أمامك. ما ردّة فعلك؟",
        options: [
          "استخدام البوق للتنبيه",
          "رفع القدم عن الدواسة وتفحّص الأرصفة بعينيك",
          "المتابعة، فقد عبرت بالفعل",
        ],
        explication: "خلف الكرة غالباً ما يوجد طفل يركض وراءها.",
      },
      {
        q: "لالتقاط المشهد كاملاً جيداً، ماذا تحرّك؟",
        options: [
          "عينيك فقط",
          "رأسك، وليس عينيك فقط",
          "لا شيء، تثبّت نظرك أمامك مباشرة",
        ],
        explication: "إدارة الرأس تجعلك ترى مداخل المرائب والشوارع المتفرّعة.",
      },
    ],
    C2b: [
      {
        q: "تقترب من مدرسة، وهناك أطفال على الرصيف، وأنت تحت الحد المسموح. ماذا تفعل؟",
        options: [
          "ترفع قدمك عن الدواسة رغم ذلك",
          "تحافظ على سرعتك، فأنت ضمن الحد المسموح",
          "تسرّع لتعبر بسرعة",
        ],
        explication:
          "الحد المسموح هو حدّ أقصى وليس إلزاماً: السرعة المناسبة تعتمد على الخطر الفعلي.",
      },
      {
        q: "كيف تتحقّق من مسافتك عن السيارة التي أمامك؟",
        options: [
          "بالنظر، بطول سيارة واحدة",
          "طالما ترى أضواءها، فالأمر جيد",
          "قاعدة الثانيتين عند علامة ثابتة",
        ],
        explication: "الثانيتان هما هامشك للكبح إذا توقّفت فجأة.",
      },
      {
        q: "إنها تمطر. كم مسافة تترك عن السيارة التي أمامك؟",
        options: [
          "نفس المسافة كما في الطقس الجاف",
          "تضاعفها: 4 ثوانٍ على الأقل",
          "تقلّلها لترى السيارة بشكل أفضل",
        ],
        explication: "على أرض مبلّلة، تزداد مسافة الكبح كثيراً: ضاعِف الهامش.",
      },
      {
        q: "تنزل منحدراً شديداً نوعاً ما. كيف تتحكّم بسرعتك؟",
        options: [
          "ترفع قدمك عن دواسة الوقود وتترك المنحدر يبطّئك",
          "تستمر في التسريع لتبقى سلساً",
          "تكبح بقوة بشكل مستمر",
        ],
        explication:
          "التسريع في النزول يعني اكتساب سرعة بلا فائدة والكبح بقوة أكبر لاحقاً.",
      },
    ],
    C2c: [
      {
        q: "تسير بمحاذاة سيارات مركونة على اليمين. كم مسافة تترك؟",
        options: [
          "بعرض باب سيارة على الأقل",
          "أقرب ما يمكن للبقاء على اليمين",
          "تلتصق بها، فهذا يجبرك على الإبطاء",
        ],
        explication: "قد يُفتح باب أو يظهر مشاة فجأة بين سيارتين.",
      },
      {
        q: "يبدو لك الشارع ضيّقاً جداً على سيارتك. ماذا تفعل؟",
        options: [
          "تلتصق بأقصى اليمين",
          "تتوقّف، فالمرور غير ممكن",
          "تثق بعلاماتك المرجعية: المسار أوسع مما يبدو",
        ],
        explication:
          "عرض المسار 3 أمتار على الأقل، وسيارتك 1.80 م: إنه خداع بصري.",
      },
      {
        q: "أين تضع نفسك في مسارك أثناء القيادة العادية؟",
        options: ["ملتصقاً بحافة اليمين", "في منتصف مسارك", "على خط المنتصف"],
        explication:
          "في المنتصف تماماً، تكون سيارتك واضحة وتحتفظ بهامش على الجانبين.",
      },
      {
        q: "تلتقي بدرّاج على طريق ضيّق. كيف تضع نفسك؟",
        options: [
          "تلتصق باليمين لتتجنّبه",
          "تمرّ قريباً جداً منه، فله مساره",
          "تنحرف قليلاً إلى اليسار بعد التأكّد أن الطريق خالٍ",
        ],
        explication:
          "ننحرف إلى اليسار عندما يكون ذلك آمناً، ولا نمرّ قريباً جداً من الدرّاجة أبداً.",
      },
    ],
    C2d: [
      {
        q: "تقترب من منعطف حادّ. متى تكبح؟",
        options: [
          "قبله، على الجزء الذي لا يزال مستقيماً",
          "في منتصف المنعطف تماماً",
          "عند مخرج المنعطف",
        ],
        explication:
          "تكبح السيارة جيداً على الخط المستقيم؛ والكبح في المنعطف يفقدها توازنها.",
      },
      {
        q: "في المنعطف، أين تنظر؟",
        options: [
          "حافة الطريق، لكي لا تخرج عنها",
          "بعيداً، نحو مخرج المنعطف",
          "غطاء المحرك، لتتبع الخط",
        ],
        explication: "نظرك يقود مسارك: إذا نظرت إلى الحافة، اتّجهت نحوها.",
      },
      {
        q: "كيف تمسك المقود في منعطف نحو اليسار؟",
        options: [
          "تدفعه بكلتا يديك بأقصى قوّة",
          "تتركه ليعود من تلقاء نفسه",
          "تسحبه بيد واحدة، اليسرى",
        ],
        explication:
          "السحب بيد واحدة يبقي الحركة سلسة؛ أما الدفع بكلتا اليدين فيسبّب التوتّر والانحراف.",
      },
      {
        q: "في أي لحظة تعاود التسريع في المنعطف؟",
        options: [
          "عند الدخول مباشرة، لتبقى نشيطاً",
          "عند أضيق نقطة",
          "عند المخرج، عندما ينفتح الطريق من جديد، بهدوء",
        ],
        explication: "التسريع مبكّراً جداً يفتح مسارك ويدفعك نحو الخارج.",
      },
    ],
    C2e: [
      {
        q: "تتردّد في التجاوز: الرؤية ليست مثالية. ماذا تفعل؟",
        options: [
          "تتجاوز، الأمر سيمرّ",
          "لا تتجاوز: ترفع قدمك عن الدواسة وتتخلّى عن الفكرة",
          "تنحرف قليلاً لترى بشكل أفضل",
        ],
        explication:
          "الشكّ وحده كافٍ لإلغاء التجاوز: لا نتجاوز إلا عندما نرى بعيداً والطريق خالٍ.",
      },
      {
        q: "قبل الخروج من مسارك للتجاوز، ما التسلسل الصحيح للتحقّقات؟",
        options: [
          "إشارة الانعطاف ثم الخروج من المسار",
          "نظرة في المرآة ثم الانطلاق",
          "المرآة الداخلية، المرآة اليسرى، إشارة الانعطاف، النقطة العمياء، ثم التنفيذ",
        ],
        explication: "هذا التسلسل يضمن أن لا أحد يتجاوزك بالفعل.",
      },
      {
        q: "تتجاوز درّاجاً خارج المدينة. كم المسافة الجانبية؟",
        options: ["1.50 م على الأقل", "50 سم تكفي", "تلتصق به لتمرّ بسرعة"],
        explication:
          "1.50 م خارج المدينة، 1 م داخلها: قد ينحرف الدرّاج في أي لحظة.",
      },
      {
        q: "لقد تجاوزت سيارة للتوّ. متى تعود إلى المسار أمامها؟",
        options: [
          "بمجرّد أن يتجاوزها مقدّم سيارتك",
          "عندما تراها كاملة في مرآتك الداخلية، مع إشارة انعطاف نحو اليمين",
          "عندما يطلب منك ذلك من هو خلفك",
        ],
        explication:
          "العودة إلى المسار مبكّراً جداً تجبرها على الكبح: فأنت تقطع طريقها.",
      },
    ],
    C2f: [
      {
        q: "تقاطع بلا أي إشارة أو ضوء مرور. من يمرّ أولاً؟",
        options: [
          "من يصل أسرع",
          "أنت، فأنت تسير بشكل مستقيم",
          "ما يأتي من جهة يمينك",
        ],
        explication:
          "بلا إشارات، تكون أولوية المرور لليمين: تفسح المجال لما يأتي من يمينك.",
      },
      {
        q: "كيف تفرّق بين الدوّار العادي والدوّار القديم؟",
        options: [
          "من حجمه",
          "عند المدخل: إشارة أفسح الطريق = دوّار عادي، بلا أي إشارة = دوّار قديم",
          "من لون خطوط الطريق",
        ],
        explication:
          "الدوّار العادي: تفسح الطريق لمن هم داخله. الدوّار القديم: الأولوية لليمين، والداخل له الأولوية.",
      },
      {
        q: "في الدوّار، متى تُشغّل إشارة الانعطاف نحو اليمين؟",
        options: [
          "بمجرّد الدخول إلى الحلقة",
          "أبداً، فهذا بلا فائدة",
          "قبل مخرجك مباشرة",
        ],
        explication:
          "إذا شغّلتها مبكّراً، توهم الآخرين بأنك ستخرج قبل ذلك فتعيقهم.",
      },
      {
        q: "سيارة قادمة من يمينك تبطّئ لتفسح لك المرور، وبلا أي إشارة. هل تمرّ؟",
        options: [
          "نعم، فقد أشارت لك بالمرور",
          "لا: لها أولوية المرور، فتتركها تمرّ",
          "تسرّع لكي لا تعيقها",
        ],
        explication:
          "إذا اضطرّت للكبح من أجلك، فهذا يعني أصلاً أنك لم تمنحها أولوية المرور الواجبة.",
      },
    ],
    C2g: [
      {
        q: "ستنعطف يساراً بعد 50 م. متى تُشغّل إشارة الانعطاف؟",
        options: [
          "مبكّراً بما يكفي، قبل الانعطاف",
          "في اللحظة نفسها التي تنعطف فيها",
          "بعد أن تكون قد دخلت الشارع",
        ],
        explication: "إشارة الانعطاف التي تُشغّل أثناء المنعطف لم تنبّه أحداً.",
      },
      {
        q: "مشاة ينتظر عند حافة ممرّ المشاة. ما تصرّفك؟",
        options: [
          "تبادُل النظر معه والإبطاء لتتركه يعبر",
          "استخدام البوق ليتّخذ قراره",
          "المرور بسرعة قبله",
        ],
        explication: "التواصل بالنظر يزيل الشك؛ ولا نفرض المرور أبداً.",
      },
      {
        q: "شخص يلتصق بك من الخلف ويزعجك. هل تستخدم البوق لتُظهر انزعاجك؟",
        options: [
          "نعم، سيفهم",
          "تكبح بقوّة لتهدّئه",
          "لا، البوق يُستخدم للتحذير من خطر",
        ],
        explication: "في المدينة، استخدام البوق مقيّد بصرامة أصلاً.",
      },
      {
        q: "شغّلت إشارة الانعطاف لتغيير المسار. ماذا تفعل بعد ذلك؟",
        options: [
          "تنتظر 50 م قبل أن تنحرف",
          "تنتقل بمجرّد أن يصبح ذلك ممكناً",
          "تُطفئ إشارة الانعطاف وتبقى مكانك",
        ],
        explication: "الإشارة دون الانتقال تُبقي من خلفك في حيرة.",
      },
    ],
    C2h: [
      {
        q: "تُدرك متأخّراً أنك في المسار الخاطئ داخل الدوّار. ما ردّة فعلك؟",
        options: [
          "تغيّر المسار بالقوّة فوراً",
          "تبقى في مسارك وتدور مجدّداً إذا لزم الأمر",
          "تكبح فجأة في المنتصف",
        ],
        explication: "لا نغيّر المسار بالقوّة في زحمة السير أبداً لتدارُك خطأ.",
      },
      {
        q: "شاحنة توصيل صغيرة تسدّ مسارك. ماذا تفعل؟",
        options: [
          "تخرج من مسارك بسرعة قبل أن يأتي أحد",
          "تستخدم البوق لتتحرّك",
          "تتوقّف، تتحقّق من الخلف ومن النقطة العمياء، ثم تلتفّ حولها إذا كان الطريق خالياً",
        ],
        explication: "نتعامل مع العائق كأنه تجاوز صغير، وبأمان.",
      },
      {
        q: "كيف تعرف أنك أتقنت القيادة في المدينة؟",
        options: [
          "عندما تقود مقطعاً طويلاً دون تدخّل المدرّب",
          "عندما تقود بسرعة دون أن يتوقّف المحرك",
          "عندما تعرف كل الشوارع",
        ],
        explication: "أصبحت تحقّقاتك تلقائية: وعقلك حرّ للتوقّع.",
      },
      {
        q: "قبل أن تبدأ رحلة بمفردك في المدينة، ماذا تفعل؟",
        options: [
          "تنطلق وترتجل",
          "تتخيّل مسارك والمناطق الصعبة",
          "تنتظر حتى يكون لديك نظام ملاحة ناطق",
        ],
        explication:
          "تخيّل المسار يحرّر عقلك لاتّخاذ القرارات بدل البحث عن طريقك.",
      },
    ],
    C3a: [
      {
        q: "أضواء أمامية قادمة نحوك في الليل. إلى أين تنظر؟",
        options: [
          "الأضواء الأمامية المقابلة",
          "الحافة اليمنى لمسربك",
          "منتصف الطريق",
        ],
        explication:
          "التحديق في الأضواء يبهرك؛ والحافة اليمنى تبقيك على مسارك.",
      },
      {
        q: "طريق خالٍ، ويظهر وهج أضواء أمامية من بعيد. ما تصرفك؟",
        options: [
          "العودة إلى الأضواء المنخفضة",
          "البقاء على الأضواء العالية",
          "إعطاء ومضة بالأضواء",
        ],
        explication:
          "تخفّض الأضواء بمجرد أن تلمح أحداً، ولو مجرد وهج خفيف، حتى لا تبهره.",
      },
      {
        q: "في الليل، تشك في وجود أحد المشاة يرتدي ملابس داكنة أمامك. ماذا تفعل؟",
        options: [
          "تُسرع لتتجاوز",
          "تُطلق البوق وتندفع",
          "ترفع قدمك عن الدواسة وتتحقق",
        ],
        explication:
          "اليقين = تصرّف، الشك = لا سرعة: المشاة بملابس داكنة يُرى في وقت متأخر جداً.",
      },
      {
        q: "تشعر بجفنيك يسقطان وأنت خلف المقود ليلاً. ما التصرف الصحيح؟",
        options: [
          "تصمد حتى تُكمل ساعتين من القيادة",
          "تتوقف عند أول علامة",
          "تفتح النافذة وتواصل القيادة",
        ],
        explication:
          "استرح كل ساعتين، لكن قبل كل شيء عند أدنى علامة تعب، دون انتظار.",
      },
    ],
    C3b: [
      {
        q: "تحت المطر، بكم تضاعف مسافة الأمان؟",
        options: ["بـ 2", "تبقيها كما هي", "بـ 1.5"],
        explication:
          "أرض مبللة = مسافة كبح مضاعفة: تنتقل من فارق ثانيتين إلى 4 ثوانٍ.",
      },
      {
        q: "المطر غزير. هل يمكنك تشغيل مصباح الضباب الخلفي؟",
        options: [
          "نعم، دائماً تحت المطر",
          "لا، ممنوع تحت المطر",
          "فقط في الليل",
        ],
        explication:
          "المصباح الخلفي يبهر السيارة التي خلفك: فهو مخصص للضباب أو الثلج فقط.",
      },
      {
        q: "بركة ماء كبيرة تسدّ مسربك، ويستحيل تجنبها. ما تصرفك؟",
        options: [
          "الاندفاع فيها بالسرعة العادية",
          "الكبح بقوة داخل البركة",
          "التباطؤ قبلها، والعبور مع تثبيت المقود",
        ],
        explication:
          "الاندفاع = انزلاق مائي: تتباطأ قبلها، لا داخل البركة أبداً، ودون تحريك مفاجئ للمقود.",
      },
      {
        q: "على طريق سريع محدود بـ 130، يبدأ المطر. ما سرعتك القصوى؟",
        options: ["130 كم/س", "110 كم/س", "120 كم/س"],
        explication:
          "تحت المطر تنخفض 130 إلى 110: تماسك أقل، فترفع قدمك عن الدواسة.",
      },
    ],
    C3c: [
      {
        q: "تصل إلى أوراق شجر ميتة مبللة عند مخرج منعطف. ما تصرفك؟",
        options: [
          "تحريك مفاجئ للمقود للمرور بسرعة",
          "رفع القدم قبلها، مع تثبيت المقود",
          "الكبح بقوة فوقها",
        ],
        explication:
          "الأوراق المبللة تنزلق كالصابون: أي حركة مفاجئة تُفقد السيارة السيطرة.",
      },
      {
        q: "على طريق زلق، متى تكبح قبل المنعطف؟",
        options: [
          "في الخط المستقيم، قبل المنعطف",
          "في منتصف المنعطف تماماً",
          "عند مخرج المنعطف",
        ],
        explication:
          "الكبح والانعطاف معاً يتطلبان تماسكاً أكثر من اللازم: تكبح في الخط المستقيم، ثم تنعطف ورافعٌ قدمك.",
      },
      {
        q: "مؤخرة سيارتك تنزلق قليلاً على الجليد. أول شيء تفعله؟",
        options: [
          "كبح مفاجئ",
          "تدوير المقود بقوة في الاتجاه الآخر",
          "رفع القدم وتوجيه النظر إلى حيث تريد الذهاب",
        ],
        explication: "السيارة تتبع نظرك؛ والكبح المفاجئ يزيد الانزلاق سوءاً.",
      },
      {
        q: "تلاحظ بقعة لامعة في الظل تحت الأشجار. ماذا تفعل؟",
        options: [
          "تتباطأ بلطف قبل الوصول إليها",
          "تكبح بمجرد أن تكون فوقها",
          "تُسرع للمرور بسرعة",
        ],
        explication:
          "تتحسّب مسبقاً: ترفع قدمك قبل المنطقة الزلقة، لا فوقها أبداً.",
      },
    ],
    C3d: [
      {
        q: "كبح طارئ في سيارة مزودة بنظام ABS. ما أول حركة تقوم بها؟",
        options: [
          "الضغط على الدبرياج أولاً",
          "الكبح بالكامل دفعة واحدة",
          "الكبح على دفعات صغيرة متقطعة",
        ],
        explication:
          "الكبح أولاً وبالكامل: أما الدبرياج فيأتي بعده فقط، قبل توقف المحرك مباشرة.",
      },
      {
        q: "أثناء الكبح الطارئ، تهتز الدواسة بقوة تحت قدمك. ماذا تفعل؟",
        options: [
          "ترفع القدم قليلاً",
          "تضغط الدواسة على دفعات",
          "تواصل الضغط بقوة",
        ],
        explication: "الاهتزاز هو نظام ABS يعمل: ورفع القدم يطيل مسافة التوقف.",
      },
      {
        q: "عائق أمامك مباشرة أثناء الكبح الطارئ. إلى أين تنظر؟",
        options: ["العائق", "منفذ الهروب الخالي أمامك", "المرايا"],
        explication:
          "السيارة تتبع النظر: توجيه النظر إلى المساحة الخالية يقودك إليها، والتحديق في العائق يرسلك نحوه.",
      },
      {
        q: "مع نظام ABS، أثناء الكبح الطارئ، هل يمكنك توجيه السيارة؟",
        options: [
          "لا، العجلات مقفلة",
          "نعم، تكبح بالكامل وتوجّه في الوقت نفسه",
          "فقط بعد رفع القدم عن الدواسة",
        ],
        explication:
          "نظام ABS يمنع قفل العجلات: فتحتفظ بالقدرة على التوجيه لتجنّب العائق.",
      },
    ],
    C3e: [
      {
        q: "أنت على مسرب الدخول إلى الطريق السريع. ما هدف سرعتك؟",
        options: [
          "التباطؤ للاندماج",
          "بلوغ سرعة السير (70-80 كحد أدنى)",
          "التوقف في نهاية المسرب",
        ],
        explication:
          "تندمج في فجوة بسرعتهم؛ والوصول ببطء يُجبر الجميع على الكبح.",
      },
      {
        q: "لقد تجاوزت للتو شاحنة على الطريق السريع. ماذا تفعل؟",
        options: [
          "تبقى في المسرب الأيسر",
          "تعود إلى المسرب الأيمن",
          "تتباطأ بجانبها",
        ],
        explication: "المسرب الأيسر مخصص للتجاوز: فتُخليه بمجرد أن تتجاوز.",
      },
      {
        q: "مخرجك من الطريق السريع يقترب. متى تتباطأ؟",
        options: [
          "على مسرب السير",
          "بمجرد أن ترى اللوحة",
          "بمجرد أن تكون على مسرب التباطؤ",
        ],
        explication:
          "لا تكبح أبداً على الطريق السريع نفسه: تشير بالغماز مبكراً، ثم تتباطأ على المخرج الجانبي.",
      },
      {
        q: "قبل الاندماج، إضافة إلى المرآة اليسرى، ماذا تفحص؟",
        options: [
          "لا شيء آخر",
          "النقطة العمياء بالنظر فوق كتفك",
          "فقط المرآة الداخلية",
        ],
        explication:
          "قد يتسلل دراج ناري أو سيارة إلى النقطة العمياء، حيث لا تظهر في المرآة.",
      },
    ],
    C3f: [
      {
        q: "تدخل نفقاً في وضح النهار. ما تصرفك قبل المدخل؟",
        options: [
          "تشغيل الأضواء العالية",
          "تشغيل الأضواء المنخفضة",
          "عدم تشغيل أي أضواء",
        ],
        explication:
          "الأضواء المنخفضة تجعلك مرئياً دون إبهار الآخرين؛ ولا تستخدم الأضواء العالية أبداً في النفق.",
      },
      {
        q: "بمجرد دخولك النفق، ما الذي تحدده أولاً؟",
        options: ["أقرب مخرج طوارئ", "محطة الراديو", "سرعة الآخرين"],
        explication:
          "في مكان مغلق، معرفة مكان الهروب تُحدث فارقاً كبيراً عند حدوث مشكلة.",
      },
      {
        q: "تعبر جسراً طويلاً مكشوفاً في يوم عاصف. كيف تمسك المقود؟",
        options: [
          "بيد واحدة، مسترخياً",
          "تترك المقود عند نهاية الجسر",
          "بإحكام بكلتا اليدين",
        ],
        explication:
          "الرياح الجانبية تدفع السيارة فجأة: والإمساك المرتخي للمقود = انحراف مفاجئ.",
      },
      {
        q: "في نفق، تتعطل سيارتك. ما الممنوع؟",
        options: [
          "إيقاف المحرك",
          "الالتفاف أو الرجوع للخلف",
          "التوجه إلى مخرج الطوارئ سيراً على الأقدام",
        ],
        explication:
          "لا التفاف ولا رجوع للخلف في النفق: توقف المحرك وتصل إلى المخرج سيراً على الأقدام.",
      },
    ],
    C3g: [
      {
        q: "أنت على وشك الانعطاف يميناً في المدينة. إضافة إلى المرآة، ماذا تفحص؟",
        options: [
          "لا شيء آخر",
          "نقطتك العمياء اليمنى، بالنظر فوق كتفك",
          "المرآة اليسرى فقط",
        ],
        explication:
          "الدراج القادم من جهتك اليمنى لا يظهر في المرآة: والنظرة فوق الكتف تتفادى الحادث.",
      },
      {
        q: "حافلة متوقفة على يمينك تحجب عنك ممر المشاة أمامها. ماذا تفعل؟",
        options: [
          "تمرّ بشكل طبيعي",
          "تُطلق البوق وتتجاوز",
          "تتباطأ ولا تتقدم إلا حين تتأكد",
        ],
        explication:
          "الحافلة تخفي مشاةً قد يظهر فجأة: وما دمت غير متأكد، لا تُسرع.",
      },
      {
        q: "تتجاوز دراجاً على جادة حضرية. ما الحد الأدنى للمسافة؟",
        options: [
          "متر واحد على الأقل",
          "50 سم تكفي",
          "يمكنك الاقتراب كثيراً إذا تباطأت",
        ],
        explication:
          "متر واحد في المدينة (1.50 م خارجها) يمتص مفاجأة الدراجة المتمايلة.",
      },
      {
        q: "حافلة تنطلق من موقفها أمامك مباشرة. ماذا تفعل؟",
        options: [
          "تُسرع لتمرّ قبلها",
          "ترفع قدمك وتتركها تنطلق",
          "تُطلق البوق كي تنتظر",
        ],
        explication:
          "الحافلة التي تغادر موقفها لها أولوية المرور: فتُفسح لها المجال.",
      },
    ],
    C4a: [
      {
        q: "قبل رحلة طويلة على طريق لا تعرفه، ماذا تفعل؟",
        options: [
          "تنطلق على الإحساس وسترى لاحقًا",
          "تنظر إلى المسار كاملًا وتحدّد 2-3 نقاط مرجعية",
          "تضبط الـ GPS أثناء القيادة",
        ],
        explication: "ما تُحضّره والسيارة متوقفة يحرّر انتباهك للطريق.",
      },
      {
        q: "متى تضبط الـ GPS؟",
        options: [
          "والسيارة متوقفة، قبل الانطلاق",
          "عند أول إشارة حمراء",
          "بمجرّد أن تبدأ القيادة",
        ],
        explication:
          "ثانيتان بعينين منخفضتين على سرعة 90 كم/س تعني 50 مترًا بلا رؤية.",
      },
      {
        q: "4 ساعات على الطريق. وماذا عن استراحاتك؟",
        options: [
          "لا شيء إذا كنت تشعر بأنك بخير",
          "واحدة فقط في منتصف الطريق",
          "نحو 15 دقيقة كل ساعتين",
        ],
        explication: "التعب يأتي دون سابق إنذار: الاستراحة المنتظمة أمان.",
      },
      {
        q: "طريق مُعلن أنه مقطوع. ما التصرّف الصحيح؟",
        options: [
          "أن تكون قد جهّزت مسارًا بديلًا",
          "أن تفرض المرور بالقوة",
          "أن ترتجل في المكان",
        ],
        explication: "خطة بديلة جاهزة تجنّبك البحث عن مخرجك في حالة ذعر.",
      },
    ],
    C4b: [
      {
        q: "الـ GPS يقول يسارًا، لكن اللافتة تشير إلى ممنوع الدخول. ماذا تتبع؟",
        options: [
          "الـ GPS، فهو يعرف الطريق",
          "لافتات الطريق، دائمًا",
          "تتوقّف لتفكّر",
        ],
        explication: "قد يكون الـ GPS قديمًا: ما تراه على الطريق يفوز دائمًا.",
      },
      {
        q: "تفوّتك مخرج الطريق السريع. ماذا تفعل؟",
        options: [
          "تكبح لتعود إلى المخرج",
          "ترجع إلى الوراء مسافة قصيرة",
          "تتابع حتى المخرج التالي",
        ],
        explication:
          "مخرج فائت يكلّفك 10 دقائق، لا حياتك: لا رجوع للوراء أبدًا على الطريق السريع.",
      },
      {
        q: "مدينتك في أسفل لافتة الطريق السريع تمامًا. ماذا يعني ذلك؟",
        options: ["مخرجك هو التالي", "مخرجك ما زال بعيدًا", "أخطأت الاتجاه"],
        explication:
          "كلما كان الاسم أسفل، كان المخرج أقرب: انتقل إلى اليمين مبكرًا.",
      },
      {
        q: "عليك عبور عدة مسارات للوصول إلى مخرجك. متى تبدأ؟",
        options: [
          "في اللحظة الأخيرة، دفعة واحدة",
          "في أقرب وقت ممكن، بسلاسة",
          "بفرض الانتقال بالقوة",
        ],
        explication:
          "تلتقط المعلومة مبكرًا (المرايا، إشارة الانعطاف) وتنتقل دون فقدان السرعة.",
      },
    ],
    C4c: [
      {
        q: "في القيادة الاقتصادية، هل تبدّل السرعات مبكرًا أم متأخرًا؟",
        options: [
          "متأخرًا، للحصول على القوة",
          "مبكرًا، للقيادة على دورات منخفضة",
          "دائمًا على السرعة الثانية في المدينة",
        ],
        explication:
          "المحرك على دورات منخفضة يستهلك أقل، ويصدر ضجيجًا أقل، ويتآكل أقل.",
      },
      {
        q: "إشارة حمراء على بُعد 100 متر. ما التصرّف الأكثر اقتصادًا؟",
        options: [
          "تحافظ على السرعة ثم تكبح بقوة",
          "تسرّع لتعبر",
          "ترفع قدمك مبكرًا وتترك السيارة تتباطأ",
        ],
        explication: "كبح المحرك يتجنّب هدر الوقود الذي أحرقته للتو.",
      },
      {
        q: "القيادة السلسة، كم توفّر من الوقود؟",
        options: ["بضع قطرات، لا يُذكر", "حتى نحو 20٪", "أكثر من النصف"],
        explication:
          "السلاسة هي العامل رقم 1 في القيادة الاقتصادية، حتى قبل السيارة نفسها.",
      },
      {
        q: "طريق مستقيم واضح وجميل. في القيادة الاقتصادية، ماذا تفعل؟",
        options: [
          "تصعد إلى السرعة الخامسة أو السادسة",
          "تبقى على السرعة الثالثة للتسارع",
          "تسرّع بشكل متقطّع",
        ],
        explication:
          "السرعة العالية على دورات منخفضة هي ما يستهلك أقل ما يمكن.",
      },
    ],
    C4d: [
      {
        q: "لتوقّع المخاطر، إلى أين توجّه نظرك؟",
        options: [
          "إلى غطاء المحرك، أمامك مباشرة",
          "بعيدًا إلى الأمام، مع مسح المرايا والجوانب",
          "مثبّتًا على السيارة التي أمامك",
        ],
        explication: "كلما رأيت أبعد، كان لديك وقت أكثر لتقرّر دون ذعر.",
      },
      {
        q: "سيارة تلتصق بك وتُطلق البوق. ماذا تفعل؟",
        options: [
          "تكبح لتعاقبها",
          "تسرّع فوق الحد المسموح",
          "تبقى هادئًا وتدعها تتجاوز",
        ],
        explication:
          "الردّ على العدوانية يخلق الخطر؛ البقاء هادئًا ينزع فتيله.",
      },
      {
        q: "تقاطع بلا رؤية، محجوب بسيارات متوقفة. ماذا تفعل؟",
        options: [
          "تتقدّم ببطء، وقدمك جاهزة للكبح",
          "تعبر، لم ترَ شيئًا",
          "تسرّع لتعبر بسرعة",
        ],
        explication: "الوعي بالخطر هو أن تشعر بالمخاطرة قبل أن تراها.",
      },
      {
        q: "مسافة الأمان في الطقس الجاف هي قاعدة الـ؟",
        options: ["ثانيتان (4 تحت المطر)", "متر واحد ثابت", "10 ثوانٍ دائمًا"],
        explication:
          "ثانيتان من السيارة التي أمامك، تتضاعف إلى 4 ثوانٍ عندما تكون الطريق مبتلّة.",
      },
    ],
    C4e: [
      {
        q: "تتجاوز راكب دراجة في المدينة. ما المسافة؟",
        options: ["متر واحد على الأقل", "قريبًا جدًا، تمرّ", "30 سنتيمترًا"],
        explication:
          "متر في المدينة، 1.5 متر خارج المناطق المبنية: الهامش إذا انحرف فجأة.",
      },
      {
        q: "أحد المشاة ينتظر عند حافة معبر المشاة. ماذا تفعل؟",
        options: [
          "تعبر ما دام لم يضع قدمه عليه",
          "تتوقّف، فله بالفعل أولوية المرور",
          "تُطلق البوق كي ينتظر",
        ],
        explication:
          "المرور أمام أحد المشاة يريد العبور، يوم الامتحان، يعني الرسوب المباشر.",
      },
      {
        q: "الطريق ضيّق جدًا لترك متر واحد لراكب الدراجة. ماذا تفعل؟",
        options: [
          "تتجاوز عن قرب رغم ذلك",
          "تُطلق البوق كي يتنحّى جانبًا",
          "تنتظر خلفه حتى تتمكّن من التجاوز",
        ],
        explication:
          "التجاوز القريب بدافع نفاد الصبر هو أكثر حوادث الدرّاجات شيوعًا.",
      },
      {
        q: "إشارتك خضراء، وإشارة المشاة حمراء. هل تتوقّف لتدعه يعبر؟",
        options: [
          "لا، فهذا توقّف غير مبرَّر وخطير",
          "نعم، من باب اللباقة",
          "تُطلق البوق وتعبر",
        ],
        explication: "التوقّف لمن ليست له أولوية المرور خطأ: أنت تتبع أولويتك.",
      },
    ],
    C4f: [
      {
        q: "يطلب المُمتحِن آخر رقمين من عدّاد المسافات. لماذا؟",
        options: [
          "للتحقّق من عدد الكيلومترات لديك",
          "لسحب رقم أسئلتك الثلاثة",
          "لتدوين التاريخ",
        ],
        explication:
          "هذا يحدّد 3 أسئلة سهلة: فحص المركبة، السلامة المرورية، الإسعافات الأولية.",
      },
      {
        q: "يتوقّف المحرك عند الانطلاق أثناء الامتحان. هل انتهى الأمر؟",
        options: [
          "نعم، إنه سبب رسوب مباشر",
          "لا، تعيد التشغيل بهدوء",
          "تنسحب من الامتحان",
        ],
        explication:
          "خطأ صغير لا يُرسّبك: يراقب المُمتحِن قدرتك على تصحيح نفسك.",
      },
      {
        q: "عمّ تدور أسئلة الامتحان الثلاثة؟",
        options: [
          "فحص المركبة، السلامة المرورية، الإسعافات الأولية",
          "قانون السير، اللافتات، الميكانيكا",
          "المسار، الطقس، الـ GPS",
        ],
        explication:
          "كل إجابة صحيحة تساوي نقطة واحدة: يمكن أن ترسب في الرخصة بفارق نقطة واحدة.",
      },
      {
        q: "مناورة مطلوبة في الامتحان. ما التصرّف الصحيح؟",
        options: [
          "بسرعة، لتُظهر أنك متمكّن",
          "ببطء، مع النظر في كل الجهات، وإشارة الانعطاف أولًا",
          "بلا إشارة انعطاف، فهي مجرّد مناورة",
        ],
        explication: "تُشغّل إشارة الانعطاف قبل التوقّف للمناورة، لا بعده.",
      },
    ],
    C4g: [
      {
        q: "الرخصة العادية في جيبك. ما السرعة القصوى على الطريق السريع؟",
        options: ["130 كم/س مثل الجميع", "110 كم/س", "90 كم/س"],
        explication:
          "في فترة الرخصة التجريبية: 110 على الطريق السريع، 100 على الطريق المزدوج، 80 على الطريق العادي، خلال السنوات الثلاث الأولى.",
      },
      {
        q: "ملصق A في الخلف، كم من الوقت تبقيه؟",
        options: [
          "3 سنوات (سنتان مع القيادة المرافَقة)",
          "6 أشهر",
          "مدى الحياة",
        ],
        explication: "يُنبّه الآخرين إلى أنك مبتدئ، كي يتركوا لك بعض المجال.",
      },
      {
        q: "بكم نقطة تبدأ رخصتك التجريبية؟",
        options: [
          "12 نقطة تلقائيًا",
          "6 نقاط ترتفع إلى 12",
          "0 نقطة في البداية",
        ],
        explication: "6 نقاط في البداية: مخالفة كبيرة قد تُفقدك كل شيء.",
      },
      {
        q: "ما الحد الأقصى لنسبة الكحول لحامل الرخصة الجديد؟",
        options: ["0.5 غ/ل مثل الآخرين", "0.2 غ/ل (عمليًا، صفر)", "بلا حدّ"],
        explication: "0.2 غ/ل، أي بوضوح: لا تشرب إذا كنت ستقود.",
      },
    ],
  },
};

export const MONDES_I18N = {
  en: {
    1: {
      nom: "Vehicle handling",
      sous: "Getting to grips with the car",
    },
    2: {
      nom: "Traffic",
      sous: "Driving in normal conditions",
    },
    3: {
      nom: "Tough conditions",
      sous: "Night, weather, sharing the road",
    },
    4: {
      nom: "Driving solo",
      sous: "On your own, safe, economical",
    },
  },
  ar: {
    1: {
      nom: "التحكّم في السيارة",
      sous: "التعوّد على قيادة السيارة",
    },
    2: {
      nom: "السير",
      sous: "القيادة في الظروف العادية",
    },
    3: {
      nom: "الظروف الصعبة",
      sous: "الليل، الطقس، مشاركة الطريق",
    },
    4: {
      nom: "القيادة المستقلة",
      sous: "بمفردك، بأمان، واقتصادي",
    },
  },
};

export const RVC_UI = {
  en: {
    home_title: "Brush up your driving",
    worlds_kicker: "Your 4 worlds",
    flag_start: "To start",
    flag_current: "In progress",
    resume_start: "Start",
    resume_reread: "Reread",
    resume_continue: "Continue",
    defi_title: "Daily challenge",
    defi_sub: "1 min",
    faute_title: "Spot the mistake",
    faute_sub: "Find the error",
    read_suffix: "read",
    read_flag: "To read",
    monde_word: "World",
    method_header: "The method",
    coach_header: "Coach cards",
    err_label: "The mistake to avoid",
    why_label: "Why it matters",
    bva_label: "In an automatic",
    source_prefix: "Seen with real instructors:",
    deck_sub: "Check off your moves, then unlock the test.",
    deck_label: "Your deck",
    geste_sing: "move",
    geste_plur: "moves",
    cta_test: "Test yourself",
    cta_order: "Put in order",
    next_flag: "your turn",
    order_done_title: "In order, perfect!",
    order_done_sub: 'The {n} steps of "{titre}": nailed.',
    order_continue: "Continue",
    order_hint: "In the right order. Your turn.",
    fallback_sub: "The cards are coming very soon. Come back in a moment.",
  },
  ar: {
    home_title: "راجِع قيادتك",
    worlds_kicker: "عوالمك الأربعة",
    flag_start: "للبدء",
    flag_current: "قيد التقدّم",
    resume_start: "ابدأ",
    resume_reread: "أعد القراءة",
    resume_continue: "تابع",
    defi_title: "تحدّي اليوم",
    defi_sub: "دقيقة واحدة",
    faute_title: "اكتشف الخطأ",
    faute_sub: "حدّد الخطأ",
    read_suffix: "مقروءة",
    read_flag: "للقراءة",
    monde_word: "عالم",
    method_header: "الطريقة",
    coach_header: "بطاقات المدرّب",
    err_label: "الخطأ الذي يجب تجنّبه",
    why_label: "لماذا هذا مهم",
    bva_label: "في علبة السرعات الأوتوماتيكية",
    source_prefix: "مأخوذ من مدرّبين حقيقيين:",
    deck_sub: "أشّر على حركاتك، ثم افتح الاختبار.",
    deck_label: "مجموعتك",
    geste_sing: "حركة",
    geste_plur: "حركات",
    cta_test: "اختبر نفسك",
    cta_order: "رتّب الخطوات",
    next_flag: "دورك",
    order_done_title: "بالترتيب، ممتاز!",
    order_done_sub: "خطوات «{titre}» الـ{n}: أُنجزت.",
    order_continue: "تابع",
    order_hint: "بالترتيب الصحيح. دورك.",
    fallback_sub: "البطاقات في الطريق قريبًا. عُد بعد لحظة.",
  },
};
