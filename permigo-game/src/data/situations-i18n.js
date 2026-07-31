// Traductions du mini-jeu « En situation » (en / ar). Source FR = situations-conduite.js.
export const SITU_UI = {
  en: {
    good: "Well spotted!",
    rule: "The rule to remember",
    next: "Next",
    recap: "See recap",
    you: "You",
    kickerFallback: "Highway code",
  },
  ar: {
    good: "أحسنت!",
    rule: "القاعدة التي يجب تذكّرها",
    next: "التالي",
    recap: "عرض الملخّص",
    you: "أنت",
    kickerFallback: "قانون السير",
  },
};

export const THEME_I18N = {
  en: {
    giratoire: "Roundabout",
    "priorite-droite": "Priority to the right",
    stop: "Stop",
    cede: "Give way",
    feu: "Traffic lights",
    pieton: "Pedestrians",
    croisement: "Intersections",
    distance: "Safety distances",
    depassement: "Overtaking",
    prioritaire: "Priority vehicles",
    autoroute: "Highway",
    cycliste: "Cyclists",
    partage: "Sharing the road",
  },
  ar: {
    giratoire: "الدوّار",
    "priorite-droite": "الأولوية لليمين",
    stop: "قف",
    cede: "افسح الطريق",
    feu: "إشارات المرور",
    pieton: "المشاة",
    croisement: "التقاطعات",
    distance: "مسافات الأمان",
    depassement: "التجاوز",
    prioritaire: "المركبات ذات الأولوية",
    autoroute: "الطريق السريع",
    cycliste: "الدراجات الهوائية",
    partage: "تقاسم الطريق",
  },
};

// clé = id de scène → { en:{q,e,r:{<repId>:"<label>"}}, ar:{q,e,r:{...}} }
export const SITU_I18N = {
  // ── Giratoire ────────────────────────────────────────────────
  "giratoire-entree": {
    en: {
      q: "You reach the roundabout. What do you do?",
      e: "Vehicles already on the roundabout have priority. That's what the give-way sign at the entrance means. You enter once it's clear.",
      r: {
        cede: "I give way",
        engage: "I go straight in",
        accel: "I speed up to get through first",
      },
    },
    ar: {
      q: "تصل إلى الدوّار. ماذا تفعل؟",
      e: "أصحاب الأولوية هم من يسيرون بالفعل على الدوّار. وهذا معنى لافتة افسح الطريق عند المدخل. تدخل عندما يصبح الطريق خاليًا.",
      r: {
        cede: "افسح الطريق",
        engage: "أدخل مباشرة",
        accel: "أسرّع لأمر قبله",
      },
    },
  },
  "giratoire-clignotant": {
    en: {
      q: "You're taking the next exit. Which indicator?",
      e: "To leave a roundabout, put your right indicator on before your exit: drivers waiting to enter know they can go.",
      r: {
        droit: "Right indicator",
        gauche: "Left indicator",
        aucun: "None, I just exit",
      },
    },
    ar: {
      q: "ستأخذ المخرج التالي. أي إشارة انعطاف تستخدم؟",
      e: "للخروج من الدوّار، تُشغّل إشارة الانعطاف اليمنى قبل مخرجك، حتى يعرف من ينتظر الدخول أن بإمكانه التقدّم.",
      r: {
        droit: "إشارة الانعطاف اليمنى",
        gauche: "إشارة الانعطاف اليسرى",
        aucun: "لا شيء، أخرج مباشرة",
      },
    },
  },
  "giratoire-file": {
    en: {
      q: "You're taking the 3rd exit, on your left. Which lane do you take?",
      e: "To go left or make a U-turn, enter from the left lane. The right lane is for exiting early (1st or 2nd exit).",
      r: { gauche: "Left lane", droite: "Right lane" },
    },
    ar: {
      q: "ستأخذ المخرج الثالث، على يسارك. في أي مسرب تضع نفسك؟",
      e: "للاتجاه يسارًا أو الدوران الكامل، تدخل من المسرب الأيسر. أما المسرب الأيمن فيُستخدم للخروج المبكر (المخرج الأول أو الثاني).",
      r: { gauche: "المسرب الأيسر", droite: "المسرب الأيمن" },
    },
  },

  // ── Priorité à droite ────────────────────────────────────────
  "prio-droite-cible": {
    en: {
      q: "Who goes first?",
      e: "No sign, no traffic light: priority to the right applies. The blue car comes from your right, it goes first.",
      r: { v1: "The blue car", moi: "You" },
    },
    ar: {
      q: "من يمرّ أولًا؟",
      e: "لا توجد لافتة ولا إشارة مرور: تُطبَّق الأولوية لليمين. السيارة الزرقاء قادمة من يمينك، فهي تمرّ أولًا.",
      r: { v1: "السيارة الزرقاء", moi: "أنت" },
    },
  },
  "prio-droite-gauche": {
    en: {
      q: "A car is coming from your left. What do you do?",
      e: "It's coming from your left, so you have priority to the right. You go. But keep an eye on it, just in case.",
      r: {
        passe: "I go: I have priority",
        laisse: "I let it pass",
        stop: "I come to a full stop",
      },
    },
    ar: {
      q: "سيارة قادمة من يسارك. ماذا تفعل؟",
      e: "هي قادمة من يسارك، وبالتالي فإن الأولوية لليمين تكون لك. تمرّ. مع إبقاء عينك عليها احتياطًا.",
      r: {
        passe: "أمرّ: لديّ الأولوية",
        laisse: "أدعها تمرّ",
        stop: "أتوقف توقفًا تامًا",
      },
    },
  },

  // ── Stop ─────────────────────────────────────────────────────
  "stop-desert": {
    en: {
      q: "The road is clear. What do you do at the stop sign?",
      e: "At a stop sign, a full stop is mandatory even if the road is empty: wheels stopped at the line, check, then go.",
      r: {
        arret: "Come to a full stop, then set off again",
        ralentis: "I slow right down and go through",
        passe: "I go through, it's clear",
      },
    },
    ar: {
      q: "الطريق خالٍ. ماذا تفعل عند لافتة قف؟",
      e: "عند لافتة قف، التوقف التام إلزامي حتى لو كان الطريق خاليًا تمامًا: تتوقف العجلات عند الخط، تتفقّد المكان، ثم تنطلق.",
      r: {
        arret: "أتوقف توقفًا تامًا، ثم أنطلق من جديد",
        ralentis: "أبطئ كثيرًا وأمرّ",
        passe: "أمرّ، فالطريق خالٍ",
      },
    },
  },

  // ── Cédez le passage ─────────────────────────────────────────
  "cede-moto": {
    en: {
      q: "A motorbike is coming. What do you do?",
      e: "Give way means letting others pass without being forced to stop. You only stop if it's not safe to go.",
      r: {
        cede: "I slow down and let it pass",
        arret: "I stop, it's mandatory",
        passe: "I go before it",
      },
    },
    ar: {
      q: "دراجة نارية قادمة. ماذا تفعل؟",
      e: "افسح الطريق يعني أن تدع الآخرين يمرّون دون إلزامك بالتوقف. لا تتوقف إلا إذا لم يكن المرور آمنًا.",
      r: {
        cede: "أبطئ وأدعها تمرّ",
        arret: "أتوقف، فهذا إلزامي",
        passe: "أمرّ قبلها",
      },
    },
  },

  // ── Feux ─────────────────────────────────────────────────────
  "feu-orange": {
    en: {
      q: "The light turns amber. What do you do?",
      e: "Amber warns that red is coming: you stop, unless you're too far in to brake safely. Here, you have plenty of room.",
      r: {
        arret: "I stop before the line",
        accel: "I speed up to get through",
        continue: "I keep going as normal",
      },
    },
    ar: {
      q: "تتحوّل إشارة المرور إلى اللون البرتقالي. ماذا تفعل؟",
      e: "اللون البرتقالي ينذر باقتراب الأحمر: تتوقف، إلا إذا كنت قد اقتربت كثيرًا بحيث يصبح الفرملة خطرًا. هنا لديك مسافة كافية.",
      r: {
        arret: "أتوقف قبل الخط",
        accel: "أسرّع لأعبر",
        continue: "أواصل السير بشكل عادي",
      },
    },
  },

  // ── Piétons ──────────────────────────────────────────────────
  "pieton-engage": {
    en: {
      q: "A pedestrian is crossing. What do you do?",
      e: "A pedestrian who has stepped onto the crossing always has priority. You stop until they finish crossing.",
      r: {
        arret: "I stop and let them cross",
        contourne: "I gently drive around them",
        klaxonne: "I honk to warn them",
      },
    },
    ar: {
      q: "أحد المشاة يعبر الطريق. ماذا تفعل؟",
      e: "المشاة الذين بدؤوا العبور لهم الأولوية دائمًا. تتوقف إلى أن ينهي عبوره.",
      r: {
        arret: "أتوقف وأدعه يعبر",
        contourne: "ألتف حوله بهدوء",
        klaxonne: "أستخدم البوق لتنبيهه",
      },
    },
  },
  "pieton-bord": {
    en: {
      q: "They haven't stepped onto the crossing yet. What do you do?",
      e: "If a pedestrian shows they want to cross, you must let them. Slow down and be ready to stop.",
      r: {
        ralentis: "I slow down and let them cross",
        continue: "I keep going, they haven't stepped out",
        accel: "I speed up before they cross",
      },
    },
    ar: {
      q: "لم يبدأ العبور بعد. ماذا تفعل؟",
      e: "إذا أظهر أحد المشاة رغبته في العبور، يجب أن تدعه يمرّ. أبطئ وكن مستعدًا للتوقف.",
      r: {
        ralentis: "أبطئ وأدعه يعبر",
        continue: "أواصل السير، فهو لم يبدأ العبور",
        accel: "أسرّع قبل أن يعبر",
      },
    },
  },

  // ── Croisements ──────────────────────────────────────────────
  "croisement-tourne-gauche": {
    en: {
      q: "They're turning left, you're going straight. Who goes first?",
      e: "A driver turning left crosses the path of oncoming traffic, so they must give way. You're going straight, so you go first.",
      r: { moi: "You", v1: "The grey car" },
    },
    ar: {
      q: "هي تنعطف إلى يسارها، وأنت تسير مباشرة. من يمرّ أولًا؟",
      e: "من ينعطف إلى اليسار يقطع طريق السيارات القادمة من الأمام، لذا عليه أن يفسح الطريق. وبما أنك تسير مباشرة، فأنت تمرّ أولًا.",
      r: { moi: "أنت", v1: "السيارة الرمادية" },
    },
  },
  "croisement-visibilite": {
    en: {
      q: "A blind intersection. What do you do?",
      e: "With no visibility, a car could suddenly appear from your right. And it would have priority. Slow down and check before going through.",
      r: {
        ralentis: "I slow down and check to the right",
        continue: "I keep my speed, no one in sight",
        klaxonne: "I honk and go through",
      },
    },
    ar: {
      q: "تقاطع منعدم الرؤية. ماذا تفعل؟",
      e: "في غياب الرؤية، قد تظهر سيارة فجأة من يمينك. وستكون هي صاحبة الأولوية. أبطئ وتفقّد المكان قبل المرور.",
      r: {
        ralentis: "أبطئ وأتفقّد جهة اليمين",
        continue: "أحافظ على سرعتي، فلا أحد في الأفق",
        klaxonne: "أستخدم البوق وأمرّ",
      },
    },
  },

  // ── Priorité à droite (suite) ────────────────────────────────
  "prio-droite-moto": {
    en: {
      q: "A motorcyclist is coming from your right. Who goes first?",
      e: "Priority to the right applies the same way to every vehicle. The motorcyclist comes from your right: they go first, just as a car would.",
      r: { v1: "The motorcyclist", moi: "You" },
    },
    ar: {
      q: "دراج نارية قادم من يمينك. من يمرّ أولًا؟",
      e: "تُطبَّق الأولوية لليمين بالطريقة نفسها على كل المركبات. الدراج قادم من يمينك، لذا يمرّ أولًا تمامًا كما لو كانت سيارة.",
      r: { v1: "الدراج", moi: "أنت" },
    },
  },

  // ── Cédez le passage (suite) ─────────────────────────────────
  "cede-route-degagee": {
    en: {
      q: "The road is clear at the give-way sign. What do you do?",
      e: "A give-way sign doesn't require a full stop, unlike a stop sign: you slow down, look, and go if the road is clear.",
      r: {
        ralentis: "I slow down, look, then go",
        arret: "I come to a full stop, like at a stop sign",
        vitesse: "I keep my speed, it's clear",
      },
    },
    ar: {
      q: "الطريق خالٍ عند لافتة افسح الطريق. ماذا تفعل؟",
      e: "افسح الطريق لا يستوجب توقفًا تامًا، على عكس لافتة قف: تبطئ، تنظر، وتتقدّم إذا كان الطريق خاليًا.",
      r: {
        ralentis: "أبطئ، أتفحّص المكان، ثم أمرّ",
        arret: "أتوقف توقفًا تامًا، كما عند لافتة قف",
        vitesse: "أحافظ على سرعتي، فالطريق خالٍ",
      },
    },
  },

  // ── Stop (suite) ─────────────────────────────────────────────
  "stop-voiture-croise": {
    en: {
      q: "You're at the stop sign. A car is coming on the priority road. What do you do?",
      e: "At a stop sign, you always come to a full stop. And the road you're crossing keeps priority: you let its traffic pass before you go.",
      r: {
        arret_laisse: "Full stop, then I let it pass",
        arret_passe: "Full stop, then I go before it",
        ralentis: "I slow right down without stopping",
      },
    },
    ar: {
      q: "أنت عند لافتة قف. سيارة قادمة على الطريق ذي الأولوية. ماذا تفعل؟",
      e: "عند لافتة قف، تتوقف دائمًا توقفًا تامًا. ويبقى الطريق الذي تقطعه صاحب الأولوية: تدع مركباته تمرّ قبل أن تتقدّم.",
      r: {
        arret_laisse: "توقف تام، ثم أدعها تمرّ",
        arret_passe: "توقف تام، ثم أمرّ قبلها",
        ralentis: "أبطئ كثيرًا دون التوقف",
      },
    },
  },

  // ── Giratoire (suite) ────────────────────────────────────────
  "giratoire-sortie-incertaine": {
    en: {
      q: "Its right indicator is on, but it's still on the roundabout. What do you do?",
      e: "An indicator guarantees nothing: as long as it's on the roundabout, it has priority. Wait until it has actually left before you enter.",
      r: {
        cede: "I keep giving way, it hasn't exited yet",
        engage: "I go, it's about to exit in front of me",
        accel: "I speed up to get through before it",
      },
    },
    ar: {
      q: "أشعلت إشارة الانعطاف اليمنى لكنها ما زالت على الدوّار. ماذا تفعل؟",
      e: "إشارة الانعطاف لا تضمن شيئًا: ما دامت تسير على الدوّار فهي صاحبة الأولوية. انتظر حتى تخرج فعلًا قبل أن تدخل.",
      r: {
        cede: "أستمر في افساح الطريق، فهي لم تخرج بعد",
        engage: "أدخل، فهي ستخرج أمامي",
        accel: "أسرّع لأمر قبلها",
      },
    },
  },
  "giratoire-file-cede": {
    en: {
      q: "You're in the right lane to exit right away. A car is on the roundabout. Who goes?",
      e: "It doesn't matter which lane you entered from: any vehicle already on the roundabout keeps priority. You give way before entering, even to exit right away.",
      r: { v1: "The yellow car", moi: "You" },
    },
    ar: {
      q: "أنت في المسرب الأيمن لتخرج على الفور. سيارة تسير على الدوّار. من يمرّ؟",
      e: "لا يهم المسرب الذي دخلت منه: أي مركبة موجودة بالفعل على الدوّار تبقى صاحبة الأولوية. تفسح الطريق قبل الدخول، حتى لو كنت ستخرج فورًا.",
      r: { v1: "السيارة الصفراء", moi: "أنت" },
    },
  },

  // ── Feux (suite) ─────────────────────────────────────────────
  "feu-vert-pieton-attarde": {
    en: {
      q: "The light turns green, but a pedestrian is still finishing crossing. What do you do?",
      e: "A green light doesn't allow you to drive if a pedestrian is still on the crossing. You wait until they've finished.",
      r: {
        attends: "I stop, they haven't finished",
        demarre: "I set off, I have the green light",
        klaxonne: "I honk to make them hurry",
      },
    },
    ar: {
      q: "تتحوّل الإشارة إلى الأخضر، لكن أحد المشاة لم ينهِ عبوره بعد. ماذا تفعل؟",
      e: "الضوء الأخضر لا يسمح لك بالسير إذا كان أحد المشاة ما زال يعبر. تنتظر حتى ينهي عبوره.",
      r: {
        attends: "أتوقف، فهو لم ينهِ عبوره",
        demarre: "أنطلق، فالإشارة خضراء لصالحي",
        klaxonne: "أستخدم البوق لأجعله يُسرع",
      },
    },
  },

  // ── Croisements (suite) ──────────────────────────────────────
  "croisement-tourne-gauche-toi": {
    en: {
      q: "You want to turn left, a car is coming straight from the opposite direction. Who goes first?",
      e: "When you turn left, you cross the path of the oncoming car: you're the one who gives way. It goes first.",
      r: { v1: "The blue car", moi: "You" },
    },
    ar: {
      q: "تريد الانعطاف يسارًا، وسيارة قادمة من الأمام مباشرة. من يمرّ أولًا؟",
      e: "عندما تنعطف يسارًا، فأنت تقطع مسار السيارة القادمة من الأمام، وبالتالي فأنت من يفسح الطريق. هي تمرّ أولًا.",
      r: { v1: "السيارة الزرقاء", moi: "أنت" },
    },
  },

  // ── Distances de sécurité ────────────────────────────────────
  "distance-securite-2s": {
    en: {
      q: "You're driving right on the bumper of the car ahead. What should you do?",
      e: "The 2-second rule: count the time between the car ahead passing a fixed point and you reaching it. Less than that, and you're too close to brake in time.",
      r: {
        ecart: "I leave at least a 2-second gap",
        colle: "I stay close to keep my spot",
        double: "I overtake as soon as I can",
      },
    },
    ar: {
      q: "أنت تسير ملتصقًا بالسيارة التي أمامك. ماذا يجب أن تفعل؟",
      e: "قاعدة الثانيتين: احسب الوقت بين مرور السيارة التي أمامك على نقطة ثابتة ومرورك أنت عليها. إذا كان أقل من ذلك، فأنت قريب جدًا ولن تستطيع الفرملة في الوقت المناسب.",
      r: {
        ecart: "أترك مسافة لا تقل عن ثانيتين",
        colle: "أبقى ملتصقًا للحفاظ على مكاني",
        double: "أتجاوزها حالما تسنح الفرصة",
      },
    },
  },

  // ── Dépassement ──────────────────────────────────────────────
  "depassement-ligne-continue": {
    en: {
      q: "Solid line, a car ahead of you is driving slowly. Can you overtake it?",
      e: "A solid line forbids any overtaking, even if the lane looks clear. Wait until you reach a broken line.",
      r: {
        non: "No, the solid line forbids overtaking",
        oui_rapide: "Yes, if I overtake quickly",
        oui_personne: "Yes, no one is coming close by",
      },
    },
    ar: {
      q: "خط مستمر، وسيارة أمامك تسير ببطء. هل يمكنك تجاوزها؟",
      e: "الخط المستمر يمنع أي تجاوز، حتى لو بدا المسرب خاليًا. انتظر حتى تصل إلى خط متقطع.",
      r: {
        non: "لا، الخط المستمر يمنع التجاوز",
        oui_rapide: "نعم، إذا تجاوزت بسرعة",
        oui_personne: "نعم، لا أحد يقترب",
      },
    },
  },

  // ── Véhicules prioritaires ───────────────────────────────────
  "vehicule-prioritaire-pompiers": {
    en: {
      q: "An emergency vehicle is approaching, flashing lights and siren on. What do you do?",
      e: "A priority vehicle on an emergency call (fire brigade, ambulance, police) goes before everyone else, even if the normal rule would give you priority. You let it pass.",
      r: {
        cede: "I stop and let it pass",
        passe: "I go, it's coming from my left, I have priority",
        accel: "I speed up to get through before it",
      },
    },
    ar: {
      q: "مركبة طوارئ قادمة، أضواؤها الدوّارة وصفّارة الإنذار تعمل. ماذا تفعل؟",
      e: "المركبة ذات الأولوية أثناء التدخل (الإطفاء، الإسعاف، الشرطة) تمرّ قبل الجميع، حتى لو كانت القاعدة العادية تمنحك الأولوية. تدعها تمرّ.",
      r: {
        cede: "أتوقف وأدعها تمرّ",
        passe: "أمرّ، فهي قادمة من يساري وأنا صاحب الأولوية",
        accel: "أسرّع لأمر قبلها",
      },
    },
  },

  // ── Feux (lot 3) ─────────────────────────────────────────────
  "feu-rouge-desert": {
    en: {
      q: "Red light, no one in sight. What do you do?",
      e: "A red light requires a full stop, even if everything is deserted. You wait for green behind the line, no exceptions.",
      r: {
        arret: "I stop and wait for green",
        passe: "I go through, there's no one around",
        pas: "I creep through carefully",
      },
    },
    ar: {
      q: "إشارة حمراء، ولا أحد في الأفق. ماذا تفعل؟",
      e: "الإشارة الحمراء تفرض التوقف التام، حتى لو كان المكان خاليًا تمامًا. تنتظر الضوء الأخضر خلف الخط، دون استثناء.",
      r: {
        arret: "أتوقف وأنتظر الضوء الأخضر",
        passe: "أمرّ، فلا أحد هنا",
        pas: "أمرّ بحذر وببطء شديد",
      },
    },
  },
  "feu-orange-engage": {
    en: {
      q: "The light turns amber at the last moment, you're almost on it. What do you do?",
      e: "Amber requires you to stop UNLESS you can no longer brake safely. Too far in, you go through. Without accelerating. That's the difference from seeing amber from a distance.",
      r: {
        passe: "I go through: braking here would be dangerous",
        pile: "I slam the brakes to stop",
        milieu: "I stop in the middle of the intersection",
      },
    },
    ar: {
      q: "تتحوّل الإشارة إلى البرتقالي في اللحظة الأخيرة، وأنت على وشك الوصول إليها. ماذا تفعل؟",
      e: "البرتقالي يفرض التوقف إلا إذا لم يعد بإمكانك الفرملة بأمان. إذا كنت قد اقتربت كثيرًا، تمرّ. دون تسريع. وهذا هو الفارق عن رؤية الضوء البرتقالي من بعيد.",
      r: {
        passe: "أمرّ: فالفرملة هنا ستكون خطيرة",
        pile: "أفرمل بقوة لأتوقف",
        milieu: "أتوقف في منتصف التقاطع",
      },
    },
  },

  // ── Priorité à droite (lot 3) ────────────────────────────────
  "feu-eteint-prio-droite": {
    en: {
      q: "The traffic light is out of order, off. Who goes first?",
      e: "An unlit or broken traffic light no longer counts: the crossing becomes an intersection with no signage. Priority to the right applies. The blue car goes first.",
      r: { v1: "The blue car", moi: "You" },
    },
    ar: {
      q: "إشارة المرور معطّلة ومطفأة. من يمرّ أولًا؟",
      e: "الإشارة المطفأة أو المعطّلة لم تعد سارية: يعود التقاطع تقاطعًا بلا إشارات. تُطبَّق الأولوية لليمين. السيارة الزرقاء تمرّ أولًا.",
      r: { v1: "السيارة الزرقاء", moi: "أنت" },
    },
  },
  "prio-panneau-croix": {
    en: {
      q: "This sign announces the intersection. A car is coming from the right. What do you do?",
      e: "This crossed-lines sign announces an intersection with NO particular priority: priority to the right applies. It's coming from your right, it goes.",
      r: {
        laisse: "I let it pass",
        passe: "I go: the sign gives me priority",
        arret: "I stop, it's like a stop sign",
      },
    },
    ar: {
      q: "هذه اللافتة تُنذر بوجود تقاطع. سيارة قادمة من اليمين. ماذا تفعل؟",
      e: "هذه اللافتة (علامة X) تُعلن عن تقاطع بلا أولوية خاصة: تُطبَّق هنا الأولوية لليمين. هي قادمة من يمينك، فهي تمرّ.",
      r: {
        laisse: "أدعها تمرّ",
        passe: "أمرّ: فاللافتة تمنحني الأولوية",
        arret: "أتوقف، فهي أشبه بلافتة قف",
      },
    },
  },
  "camion-prio-droite": {
    en: {
      q: "A truck is coming from your right. Who goes first?",
      e: "Big or small, the rule doesn't change: it's coming from your right, it goes first. With a truck, keep even more margin. It pulls away slowly.",
      r: { v1: "The truck", moi: "You" },
    },
    ar: {
      q: "شاحنة قادمة من يمينك. من يمرّ أولًا؟",
      e: "كبيرة كانت المركبة أم صغيرة، القاعدة لا تتغيّر: هي قادمة من يمينك، فتمرّ أولًا. ومع الشاحنة، اترك هامشًا أكبر. فهي تنطلق ببطء.",
      r: { v1: "الشاحنة", moi: "أنت" },
    },
  },

  // ── Giratoire (lot 3) ────────────────────────────────────────
  "giratoire-anneau-vide": {
    en: {
      q: "The roundabout is empty. Do you have to stop before entering?",
      e: "A roundabout entrance is a give-way, not a stop: if the roundabout is clear, you enter without a full stop. You only stop if someone is coming.",
      r: {
        ralentis: "No: I slow down, check, and go in",
        arret: "Yes: a stop is mandatory, like at a stop sign",
        accel: "I speed up to get in quickly",
      },
    },
    ar: {
      q: "الدوّار خالٍ. هل يجب أن تتوقف قبل الدخول؟",
      e: "مدخل الدوّار هو افسح الطريق، وليس لافتة قف: إذا كان الدوّار خاليًا، تدخل دون توقف تام. لا تتوقف إلا إذا كان أحد قادمًا.",
      r: {
        ralentis: "لا: أبطئ، أتفقّد، ثم أدخل",
        arret: "نعم: التوقف إلزامي كما عند لافتة قف",
        accel: "أسرّع للدخول بسرعة",
      },
    },
  },

  // ── Autoroute ────────────────────────────────────────────────
  "autoroute-voie-droite": {
    en: {
      q: "You're driving in the left lane and the right lane is clear. What do you do?",
      e: "On a highway, you drive in the rightmost lane. The left lane is only for overtaking. Staying in it without reason is an offence.",
      r: {
        rabats: "I move back into the right lane",
        reste: "I stay left, it flows better",
        accel: "I speed up to stay ahead",
      },
    },
    ar: {
      q: "تسير في المسرب الأيسر والمسرب الأيمن خالٍ. ماذا تفعل؟",
      e: "على الطريق السريع، تسير في أقصى مسرب إلى اليمين. المسرب الأيسر مخصص فقط للتجاوز. والبقاء فيه دون سبب مخالفة.",
      r: {
        rabats: "أنتقل إلى المسرب الأيمن",
        reste: "أبقى في اليسار، فالحركة أسلس هناك",
        accel: "أسرّع للبقاء في المقدمة",
      },
    },
  },
  "autoroute-bau-bouchon": {
    en: {
      q: "There's a traffic jam and the hard shoulder is free. Do you use it?",
      e: "The hard shoulder is for broken-down vehicles and emergency services. Driving on it is forbidden and dangerous, jam or not. You wait in your lane.",
      r: {
        non: "No: it's reserved for emergencies",
        sortie: "Yes, just to reach the exit",
        pas: "Yes, if I go at walking pace",
      },
    },
    ar: {
      q: "هناك ازدحام والمسار الاضطراري خالٍ. هل تسلكه؟",
      e: "المسار الاضطراري مخصص للمركبات المعطّلة وخدمات الطوارئ. السير عليه ممنوع وخطير، سواء كان هناك ازدحام أم لا. تنتظر في مسربك.",
      r: {
        non: "لا: فهو مخصص لحالات الطوارئ",
        sortie: "نعم، فقط للوصول إلى المخرج",
        pas: "نعم، إذا سرت ببطء شديد",
      },
    },
  },
  "autoroute-rabattement-camion": {
    en: {
      q: "You're overtaking this truck on the left. When do you move back to the right?",
      e: "You move back without cutting off the vehicle you overtook: once the whole truck appears in your rear-view mirror, you have enough margin to return to the right safely.",
      r: {
        retro: "When I see the whole truck in my rear-view mirror",
        ras: "Right away, just past its front",
        reste: "I stay left until my exit",
      },
    },
    ar: {
      q: "تتجاوز هذه الشاحنة من اليسار. متى تعود إلى اليمين؟",
      e: "تعود إلى مسربك دون أن تقطع الطريق على من تجاوزته: عندما تظهر الشاحنة كاملة في مرآتك الداخلية، يكون لديك هامش كافٍ للعودة إلى اليمين بأمان.",
      r: {
        retro: "عندما أرى الشاحنة كاملة في مرآتي الداخلية",
        ras: "على الفور، بمجرد أن أتجاوز مقدّمتها",
        reste: "أبقى في اليسار حتى مخرجي",
      },
    },
  },

  // ── Cyclistes ────────────────────────────────────────────────
  "cycliste-depassement": {
    en: {
      q: "You want to overtake this cyclist. How much space should you leave?",
      e: "To overtake a cyclist, keeping your distance is mandatory: 1 m in built-up areas, 1.5 m outside them. No room? You stay behind them.",
      r: {
        metre: "At least 1 m in town, 1.5 m outside built-up areas",
        frole: "50 cm is enough if I slow down",
        klaxonne: "I honk so they move over",
      },
    },
    ar: {
      q: "تريد تجاوز هذا الدراج. ما المسافة الجانبية التي يجب أن تتركها؟",
      e: "لتجاوز الدراج، ترك المسافة الجانبية إلزامي: متر واحد داخل المدن، و1.50 متر خارجها. لا توجد مساحة كافية؟ ابقَ خلفه.",
      r: {
        metre: "متر واحد على الأقل داخل المدينة، و1.50 متر خارجها",
        frole: "50 سنتيمترًا تكفي إذا أبطأت",
        klaxonne: "أستخدم البوق ليقترب من الجانب",
      },
    },
  },

  // ── Distances (lot 3) ────────────────────────────────────────
  "distance-camion-ecran": {
    en: {
      q: "This truck is blocking your view of everything ahead. What do you do?",
      e: "The bigger the vehicle ahead, the less you can see: you increase your distance to regain visibility and reaction time.",
      r: {
        ecart: "I increase my distance even more",
        colle: "I get closer to prepare to overtake",
        klaxonne: "I honk to make it speed up",
      },
    },
    ar: {
      q: "هذه الشاحنة تحجب عنك كل ما يحدث أمامك. ماذا تفعل؟",
      e: "كلما كانت المركبة التي أمامك أكبر، قلّت رؤيتك للطريق: تزيد المسافة لاستعادة الرؤية ووقت رد الفعل.",
      r: {
        ecart: "أزيد المسافة أكثر",
        colle: "أقترب منها استعدادًا للتجاوز",
        klaxonne: "أستخدم البوق ليُسرع",
      },
    },
  },

  // ── Piétons (lot 3) ──────────────────────────────────────────
  "pieton-hors-passage": {
    en: {
      q: "They're crossing outside any pedestrian crossing. What do you do?",
      e: "Even in the wrong, a pedestrian is still vulnerable: you never force your way through. Slow down, ready to stop. A collision would be tragic, whatever the rule says.",
      r: {
        ralentis: "I slow down and let them finish",
        klaxonne: "I honk: they shouldn't be there",
        maintiens: "I maintain my speed, I have priority",
      },
    },
    ar: {
      q: "يعبر خارج أي ممر مخصص للمشاة. ماذا تفعل؟",
      e: "حتى لو كان المشي مخالفًا، يبقى المشاة ضعفاء: لا تفرض مرورك أبدًا. أبطئ واستعد للتوقف. فالاصطدام يظل كارثيًا مهما كانت القاعدة.",
      r: {
        ralentis: "أبطئ وأدعه ينهي عبوره",
        klaxonne: "أستخدم البوق: فلا يحقّ له العبور هنا",
        maintiens: "أحافظ على سرعتي، فأنا صاحب الأولوية",
      },
    },
  },

  // ── Véhicules prioritaires (lot 3) ───────────────────────────
  "prioritaire-samu-derriere": {
    en: {
      q: "An ambulance is coming up behind you, siren blaring. What do you do?",
      e: "You always make way for an emergency vehicle: move over to the right and slow down. Without slamming the brakes or stopping just anywhere.",
      r: {
        serre: "I move over to the right and slow down",
        accel: "I speed up so I don't hold it up",
        pile: "I slam on the brakes",
      },
    },
    ar: {
      q: "سيارة إسعاف تقترب من خلفك وصفّارة الإنذار تعمل بصوت عالٍ. ماذا تفعل؟",
      e: "عليك دائمًا تسهيل مرور مركبة الطوارئ: انحرف نحو اليمين وأبطئ. دون التوقف المفاجئ أو التوقف في أي مكان.",
      r: {
        serre: "أنحرف نحو اليمين وأبطئ",
        accel: "أسرّع حتى لا أعرقلها",
        pile: "أتوقف فجأة في مكاني",
      },
    },
  },

  // ── Partage de la route ──────────────────────────────────────
  "partage-bus-arret": {
    en: {
      q: "In town, this bus signals to pull away from its stop. What do you do?",
      e: "In a built-up area, you must make it easier for a bus to pull away from its stop: slow down and let it merge in front of you.",
      r: {
        laisse: "I slow down and let it pull out",
        accel: "I speed up to get past it first",
        klaxonne: "I honk to keep my right of way",
      },
    },
    ar: {
      q: "داخل المدينة، هذه الحافلة تُشغّل إشارة الانعطاف لمغادرة محطتها. ماذا تفعل؟",
      e: "داخل المناطق المأهولة، عليك تسهيل انطلاق الحافلة من محطتها: أبطئ ودعها تندمج في حركة السير أمامك.",
      r: {
        laisse: "أبطئ وأدعها تنطلق",
        accel: "أسرّع لأمر قبلها",
        klaxonne: "أستخدم البوق للاحتفاظ بحق المرور",
      },
    },
  },

  // ── Cédez le passage (lot 4) ─────────────────────────────────
  "cede-camion-gauche": {
    en: {
      q: "The truck is coming from your left, but you have a give-way sign. What do you do?",
      e: "The sign overrides the priority-to-the-right rule: you're on the NON-priority road, so you give way to vehicles from both sides. Even those coming from the left.",
      r: {
        cede: "I let it pass",
        passe: "I go: it's coming from my left",
        arret: "I stop, it's mandatory",
      },
    },
    ar: {
      q: "الشاحنة قادمة من يسارك، لكن لديك لافتة افسح الطريق. ماذا تفعل؟",
      e: "اللافتة تُلغي قاعدة الأولوية لليمين: أنت على الطريق غير ذي الأولوية، لذا تفسح الطريق للمركبات القادمة من الجهتين. حتى تلك القادمة من اليسار.",
      r: {
        cede: "أدعها تمرّ",
        passe: "أمرّ: فهي قادمة من يساري",
        arret: "أتوقف، فهذا إلزامي",
      },
    },
  },
  "cede-deux-sens": {
    en: {
      q: "At the give-way sign, traffic is coming from both sides. What do you do?",
      e: "At a give-way sign, you give way to vehicles from BOTH directions of the priority road. A full stop is only required if it's not safe to go.",
      r: {
        deux: "I let both pass before I go",
        droite: "I only give way to the one coming from the right",
        arret: "A full stop is required either way",
      },
    },
    ar: {
      q: "عند لافتة افسح الطريق، هناك مركبات قادمة من الجهتين. ماذا تفعل؟",
      e: "عند لافتة افسح الطريق، تفسح الطريق للمركبات القادمة من الاتجاهين على الطريق ذي الأولوية. التوقف التام إلزامي فقط إذا لم يكن المرور آمنًا.",
      r: {
        deux: "أدع الاثنتين تمرّان قبل أن أتقدّم",
        droite: "أفسح الطريق فقط للقادمة من اليمين",
        arret: "التوقف إلزامي في كل الأحوال",
      },
    },
  },

  // ── Stop (lot 4) ─────────────────────────────────────────────
  "stop-moto-gauche": {
    en: {
      q: "At the stop sign, the motorbike is coming from your left. What do you do?",
      e: "The stop sign puts you on the non-priority road: after the full stop, you give way to traffic from BOTH directions. Including from the left.",
      r: {
        arret_laisse: "Full stop, then I let it pass",
        arret_passe: "Full stop, then I go: it's coming from the left",
        passe: "I go before it",
      },
    },
    ar: {
      q: "عند لافتة قف، الدراجة النارية قادمة من يسارك. ماذا تفعل؟",
      e: "لافتة قف تضعك على الطريق غير ذي الأولوية: بعد التوقف التام، تفسح الطريق للمركبات القادمة من الاتجاهين. بما في ذلك القادمة من اليسار.",
      r: {
        arret_laisse: "توقف تام، ثم أدعها تمرّ",
        arret_passe: "توقف تام، ثم أمرّ: فهي قادمة من اليسار",
        passe: "أمرّ قبلها",
      },
    },
  },

  // ── Priorité à droite (lot 4) ────────────────────────────────
  "prio-droite-double": {
    en: {
      q: "One on the right, one on the left. Who goes FIRST?",
      e: "Everyone gives way to their right: the blue car has no one on its right, so it goes. Then you (the red car is on your left), and the red car last.",
      r: {
        v1: "The blue one (on your right)",
        moi: "You",
        v2: "The red one (on your left)",
      },
    },
    ar: {
      q: "واحدة على يمينك وأخرى على يسارك. من يمرّ أولًا؟",
      e: "كل سائق يفسح الطريق لمن على يمينه: الزرقاء لا يوجد أحد على يمينها، فتنطلق. ثم أنت (الحمراء على يسارك)، وأخيرًا الحمراء.",
      r: { v1: "الزرقاء (على يمينك)", moi: "أنت", v2: "الحمراء (على يسارك)" },
    },
  },
  "prio-droite-pas-garantie": {
    en: {
      q: "You have priority, but it's coming fast without slowing down. What do you do?",
      e: "You only take priority when the other driver respects it. An accident where 'you were in the right' is still an accident: ease off and let them pass.",
      r: {
        prudence: "I slow down and let it pass",
        force: "I go: I'm in the right",
        klaxonne: "I honk and go through",
      },
    },
    ar: {
      q: "لديك الأولوية، لكنها قادمة بسرعة دون أن تبطئ. ماذا تفعل؟",
      e: "لا تأخذ حق الأولوية إلا عندما يحترمه الآخر. الحادث الذي تكون فيه على حق يبقى حادثًا: ارفع قدمك عن دواسة الوقود ودع الأخرى تمرّ.",
      r: {
        prudence: "أبطئ وأدعها تمرّ",
        force: "أمرّ: فأنا صاحب الحق",
        klaxonne: "أستخدم البوق وأمرّ",
      },
    },
  },

  // ── Giratoire (lot 4) ────────────────────────────────────────
  "giratoire-deux-voitures": {
    en: {
      q: "Two cars are following each other on the roundabout. When do you enter?",
      e: "Everything on the roundabout has priority. A gap that's too tight between two cars means an emergency brake for the second one. Wait for a clear opening.",
      r: {
        apres: "Once both have gone past",
        entre: "I slip in between them",
        avant: "Just before the first one",
      },
    },
    ar: {
      q: "سيارتان متتاليتان على الدوّار. متى تدخل؟",
      e: "كل ما يسير على الدوّار له الأولوية. الفجوة الضيقة جدًا بين سيارتين تعني فرملة طارئة للسيارة الثانية. انتظر حتى تكون الفجوة واضحة.",
      r: {
        apres: "بعد أن تمرّ كلتاهما",
        entre: "أتسلل بينهما",
        avant: "قبل الأولى مباشرة",
      },
    },
  },

  // ── Feux (lot 4) ─────────────────────────────────────────────
  "feu-vert-libre": {
    en: {
      q: "Green light, clear intersection. What do you do?",
      e: "Green light plus a clear intersection: you go through at normal speed, glancing each way. Stopping on a green light surprises drivers behind you. That's the real danger.",
      r: {
        passe: "I go through, staying alert",
        arret: "I make a precautionary stop",
        fort: "I slow right down, just in case",
      },
    },
    ar: {
      q: "إشارة خضراء، والتقاطع خالٍ. ماذا تفعل؟",
      e: "إشارة خضراء وتقاطع خالٍ: تمرّ بسرعة عادية مع نظرة سريعة لكل جانب. التوقف عند الضوء الأخضر يُفاجئ من خلفك. وهذا هو الخطر الحقيقي.",
      r: {
        passe: "أمرّ، مع بقائي متيقظًا",
        arret: "أتوقف توقفًا احتياطيًا",
        fort: "أبطئ كثيرًا احتياطًا",
      },
    },
  },

  // ── Dépassement (lot 4) ──────────────────────────────────────
  "depassement-discontinue": {
    en: {
      q: "Broken line, no one coming from the other direction. Can you overtake this slow car?",
      e: "A broken line allows overtaking if the lane is clear and visibility is good. First the checks: mirrors, blind spot, indicator.",
      r: {
        oui: "Yes: mirrors, indicator, and I overtake",
        non: "No, overtaking is forbidden in town",
        klaxonne: "I honk to make it speed up",
      },
    },
    ar: {
      q: "خط متقطع، ولا أحد قادم من الأمام. هل يمكنك تجاوز هذه السيارة البطيئة؟",
      e: "الخط المتقطع يسمح بالتجاوز إذا كان المسرب خاليًا والرؤية جيدة. أولًا تفقّد: المرايا، النقطة العمياء، إشارة الانعطاف.",
      r: {
        oui: "نعم: أتحقّق من المرايا، أشغّل إشارة الانعطاف، ثم أتجاوز",
        non: "لا، التجاوز ممنوع داخل المدينة",
        klaxonne: "أستخدم البوق ليُسرع السائق",
      },
    },
  },
  "depassement-face": {
    en: {
      q: "The line is broken, but a car is coming from the other direction. Do you overtake?",
      e: "A broken line ALLOWS overtaking, it doesn't require it: you only overtake if the opposite lane stays clear for the whole manoeuvre. Here, it doesn't.",
      r: {
        non: "No: I stay behind, it's not safe",
        vite: "Yes, accelerating hard",
        phares: "I flash my headlights and go for it",
      },
    },
    ar: {
      q: "الخط متقطع، لكن سيارة قادمة من الأمام. هل تتجاوز؟",
      e: "الخط المتقطع يُتيح التجاوز ولا يفرضه: لا تتجاوز إلا إذا بقي المسرب المقابل خاليًا طوال المناورة. وهنا ليس كذلك.",
      r: {
        non: "لا: أبقى خلفها، فالمرور غير آمن",
        vite: "نعم، مع تسريع قوي",
        phares: "أومض بالأضواء وأتجاوز",
      },
    },
  },

  // ── Cyclistes (lot 4) ────────────────────────────────────────
  "cycliste-croisement-droite": {
    en: {
      q: "A cyclist is coming from your right. Who goes first?",
      e: "Priority to the right applies to ALL vehicles, bicycles included. They go first. And cutting them off puts them in danger, not you.",
      r: { velo: "The cyclist", moi: "You" },
    },
    ar: {
      q: "دراج قادم من يمينك. من يمرّ أولًا؟",
      e: "الأولوية لليمين تسري على جميع المركبات، بما فيها الدراجات الهوائية. هو يمرّ أولًا. وقطع الطريق عليه يعرّضه هو للخطر، لا أنت.",
      r: { velo: "الدراج", moi: "أنت" },
    },
  },
  "giratoire-velo-anneau": {
    en: {
      q: "A cyclist is going around the roundabout. Who goes?",
      e: "On the roundabout, the cyclist has priority just like any vehicle. You wait until they've passed your entry point before you go in.",
      r: { velo: "The cyclist", moi: "You" },
    },
    ar: {
      q: "دراج يدور على الدوّار. من يمرّ؟",
      e: "على الدوّار، للدراج الأولوية مثل أي مركبة أخرى. انتظر حتى يتجاوز نقطة دخولك قبل أن تدخل.",
      r: { velo: "الدراج", moi: "أنت" },
    },
  },

  // ── Piétons (lot 4) ──────────────────────────────────────────
  "pieton-masque-bus": {
    en: {
      q: "You're passing this stopped bus. What do you do?",
      e: "A stopped bus is a screen: it hides the pedestrian crossing and anyone stepping onto it. You pass slowly, ready to stop instantly.",
      r: {
        pas: "I go slowly: a pedestrian could suddenly appear from in front of the bus",
        vite: "I go quickly so I don't hold anyone up",
        klaxonne: "I honk as I pass",
      },
    },
    ar: {
      q: "تتجاوز هذه الحافلة المتوقفة. ماذا تفعل؟",
      e: "الحافلة المتوقفة تُشكّل حاجزًا يحجب ممر المشاة ومن يعبر عليه. تجاوزها ببطء شديد، مستعدًا للتوقف الفوري.",
      r: {
        pas: "أمرّ ببطء شديد: فقد يظهر أحد المشاة فجأة أمام الحافلة",
        vite: "أمرّ بسرعة حتى لا أعرقل أحدًا",
        klaxonne: "أستخدم البوق أثناء المرور",
      },
    },
  },

  // ── Véhicules prioritaires (lot 4) ───────────────────────────
  "prioritaire-feu-vert": {
    en: {
      q: "Your light is green, but the police are speeding through on an emergency call. What do you do?",
      e: "Flashing lights plus siren means the emergency vehicle goes before everyone, even when your light is green. You stay behind your line.",
      r: {
        cede: "I let it pass despite my green light",
        passe: "I go: I have the green light",
        accel: "I speed up to clear the intersection",
      },
    },
    ar: {
      q: "إشارتك خضراء، لكن سيارة شرطة تندفع في مهمة طارئة. ماذا تفعل؟",
      e: "الأضواء الدوّارة وصفّارة الإنذار معًا تعني أن مركبة الطوارئ تمرّ قبل الجميع، حتى لو كانت إشارتك خضراء. ابقَ خلف خطك.",
      r: {
        cede: "أدعها تمرّ رغم أن إشارتي خضراء",
        passe: "أمرّ: فإشارتي خضراء",
        accel: "أسرّع لإخلاء التقاطع",
      },
    },
  },

  // ── Autoroute (lot 4) ────────────────────────────────────────
  "autoroute-distance-traits": {
    en: {
      q: "At 130 km/h, what distance should you keep from the car ahead?",
      e: "The official reference: one road-edge mark plus a gap ≈ 45 m. Two marks ≈ 90 m. That's your 2-second safety gap at 130 km/h.",
      r: {
        traits: "At least 2 marks on the hard shoulder",
        longueur: "One car length is enough",
        colle: "As close as possible, for the slipstream",
      },
    },
    ar: {
      q: "عند سرعة 130 كم/سا، ما المسافة التي يجب أن تتركها عن السيارة التي أمامك؟",
      e: "المرجع الرسمي: علامة واحدة على حافة الطريق مع الفراغ التالي لها ≈ 45 مترًا. علامتان ≈ 90 مترًا. وهذه مسافة الأمان بثانيتين عند سرعة 130 كم/سا.",
      r: {
        traits: "علامتان على الأقل من علامات المسار الاضطراري",
        longueur: "طول سيارة واحدة يكفي",
        colle: "أقرب ما يمكن، للاستفادة من انسياب الهواء",
      },
    },
  },
  "autoroute-panne-corridor": {
    en: {
      q: "A car has broken down on the hard shoulder. What do you do?",
      e: "This is the 'safety corridor' rule: when you see a vehicle stopped on the hard shoulder, you change lanes or slow down significantly. People may be standing right beside it.",
      r: {
        ecarte: "I move left if possible, otherwise I slow down",
        rien: "Nothing: it's not on my lane",
        klaxonne: "I honk as I pass",
      },
    },
    ar: {
      q: "سيارة معطّلة على المسار الاضطراري. ماذا تفعل؟",
      e: "هذه قاعدة ممر السلامة: عند رؤية مركبة متوقفة على المسار الاضطراري، غيّر مسربك أو أبطئ بشكل كبير. فقد يكون هناك أشخاص واقفون بجانبها.",
      r: {
        ecarte: "أنحرف نحو اليسار إن أمكن، وإلا فأبطئ",
        rien: "لا شيء: فهي ليست في مسربي",
        klaxonne: "أستخدم البوق أثناء المرور",
      },
    },
  },

  // ── Distances (lot 4) ────────────────────────────────────────
  "distance-moto": {
    en: {
      q: "You're following a motorbike. What's your safety distance?",
      e: "A motorbike brakes in a shorter distance than a car, and its rider is exposed. You increase your distance. If they fall, you need room to avoid them.",
      r: {
        plus: "Even bigger than with a car",
        meme: "The same as usual",
        moins: "Smaller: it's narrow, I can see ahead",
      },
    },
    ar: {
      q: "أنت خلف دراجة نارية. ما مسافة الأمان التي تلتزم بها؟",
      e: "الدراجة النارية تتوقف بمسافة أقصر من السيارة، وسائقها معرّض ومكشوف. تزيد المسافة. فإن سقط، تحتاج إلى مساحة لتفاديه.",
      r: {
        plus: "أكبر منها مع السيارة",
        meme: "نفس المسافة المعتادة",
        moins: "أصغر: فهي نحيفة وأرى ما أمامها",
      },
    },
  },

  // ── Partage de la route (lot 4) ──────────────────────────────
  "partage-warnings-bouchon": {
    en: {
      q: "A sudden traffic jam ahead of you. How do you warn drivers coming up behind?",
      e: "Your hazard lights warn drivers approaching fast behind you that something's happening. That's THE reflex when you hit a traffic jam.",
      r: {
        warnings: "I turn on my hazard lights",
        klaxonne: "I honk several times",
        rien: "Nothing: they'll see it themselves",
      },
    },
    ar: {
      q: "ازدحام مفاجئ أمامك. كيف تُنذر من يقترب من خلفك؟",
      e: "أضواء التحذير تُنذر السائقين القادمين بسرعة من خلفك بوجود أمر ما. وهذا هو ردّ الفعل الصحيح عند الوصول إلى ازدحام.",
      r: {
        warnings: "أشغّل أضواء التحذير",
        klaxonne: "أستخدم البوق عدة مرات",
        rien: "لا شيء: سيرونه بأنفسهم",
      },
    },
  },

  // ── Croisements (lot 4) ──────────────────────────────────────
  "croisement-stop-en-face": {
    en: {
      q: "It has a stop sign and is turning left. You have no sign. Who goes?",
      e: "The stop sign is for THEM: you're on the priority road, you go. Still keep an eye out. A driver running a stop sign is only spotted at the last moment.",
      r: { moi: "You", v1: "The grey car" },
    },
    ar: {
      q: "لديها لافتة قف وتنعطف إلى يسارها. أما أنت فلا توجد لديك أي لافتة. من يمرّ؟",
      e: "لافتة قف مخصصة لها هي: أنت على الطريق ذي الأولوية، فتمرّ. لكن راقب المكان جيدًا. فمن يتجاهل لافتة قف لا يُلاحَظ إلا في اللحظة الأخيرة.",
      r: { moi: "أنت", v1: "السيارة الرمادية" },
    },
  },

  // ── Autoroute : bretelle d'insertion (lot 5) ─────────────────
  "bretelle-priorite": {
    en: {
      q: "You're arriving via the slip road. Who has priority?",
      e: "Drivers already on the highway have priority. You adjust YOUR speed on the acceleration lane to merge without getting in their way.",
      r: { v1: "The car on the highway", moi: "You" },
    },
    ar: {
      q: "تصل عبر مسرب الاندماج. من له الأولوية؟",
      e: "من يسيرون بالفعل على الطريق السريع لهم الأولوية. أما أنت فتضبط سرعتك على مسرب التسارع لتندمج دون إعاقتهم.",
      r: { v1: "السيارة الموجودة على الطريق السريع", moi: "أنت" },
    },
  },
  "bretelle-vitesse": {
    en: {
      q: "You're on the acceleration lane. What do you do?",
      e: "The acceleration lane exists so you reach the flow's speed BEFORE merging. Dawdling or stopping there forces you to start from zero facing cars doing 130 km/h.",
      r: {
        accelere: "I speed up to match the flow of traffic",
        ralentis: "I slow down to look carefully",
        arret: "I stop and wait for a gap",
      },
    },
    ar: {
      q: "أنت على مسرب التسارع. ماذا تفعل؟",
      e: "مسرب التسارع مخصص للوصول إلى سرعة حركة المرور قبل الاندماج فيها. التباطؤ أو التوقف فيه يجبرك على الانطلاق من الصفر أمام سيارات تسير بسرعة 130 كم/سا.",
      r: {
        accelere: "أسرّع لأواكب سرعة حركة المرور",
        ralentis: "أبطئ لأتفحّص المكان جيدًا",
        arret: "أتوقف وأنتظر فرصة",
      },
    },
  },
  "bretelle-clignotant": {
    en: {
      q: "To merge onto the highway, which indicator?",
      e: "LEFT indicator throughout the merge: you warn oncoming drivers that you're about to join their lane.",
      r: {
        gauche: "Left indicator",
        droit: "Right indicator",
        aucun: "None: the lane takes me there on its own",
      },
    },
    ar: {
      q: "للاندماج في الطريق السريع، أي إشارة انعطاف تستخدم؟",
      e: "إشارة الانعطاف اليسرى طوال عملية الاندماج: تُنبّه من يقتربون بأنك ستنضمّ إلى مسربهم.",
      r: {
        gauche: "إشارة الانعطاف اليسرى",
        droit: "إشارة الانعطاف اليمنى",
        aucun: "لا شيء: فالمسرب يقودني إليه تلقائيًا",
      },
    },
  },
  "bretelle-faciliter": {
    en: {
      q: "It's merging and your left lane is clear. What do you do?",
      e: "You have priority, but making it easier to merge is the right reflex: left lane clear → you move over. Otherwise, you adjust your speed.",
      r: {
        deporte: "I move left to make room for it",
        maintiens: "I hold my line: I have priority",
        accelere: "I speed up to get past before it",
      },
    },
    ar: {
      q: "إنها تندمج ومسربك الأيسر خالٍ. ماذا تفعل؟",
      e: "لديك الأولوية، لكن تسهيل الاندماج هو ردّ الفعل الصحيح: إذا كان المسرب الأيسر خاليًا، تنحرف نحوه. وإلا، فاضبط سرعتك.",
      r: {
        deporte: "أنحرف نحو اليسار لأفسح لها مكانًا",
        maintiens: "أحافظ على مساري: فأنا صاحب الأولوية",
        accelere: "أسرّع لأمر قبلها",
      },
    },
  },
  "bretelle-fin-voie": {
    en: {
      q: "The acceleration lane is ending and no one is letting you in. What do you do?",
      e: "Don't force your way in, and don't drive on the hard shoulder: as a last resort, slow down, or even stop at the end of the lane with your left indicator on, and move off as soon as a gap opens.",
      r: {
        ralentis:
          "I slow down, even if it means stopping at the end of the lane",
        force: "I force my way in: they have to let me",
        bau: "I keep going on the hard shoulder",
      },
    },
    ar: {
      q: "مسرب التسارع على وشك الانتهاء ولا أحد يسمح لك بالدخول. ماذا تفعل؟",
      e: "لا تفرض دخولك ولا تسر على المسار الاضطراري: كحل أخير، أبطئ أو حتى توقف في نهاية المسرب مع تشغيل إشارة الانعطاف اليسرى، وانطلق بمجرد أن تفتح فجوة.",
      r: {
        ralentis: "أبطئ، ولو اضطررت للتوقف في نهاية المسرب",
        force: "أفرض دخولي: فيجب عليهم السماح لي",
        bau: "أواصل السير على المسار الاضطراري",
      },
    },
  },
};
