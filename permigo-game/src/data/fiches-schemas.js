// ═══════════════════════════════════════════════════════════════
// Schémas & photos par fiche de conduite.
// Pipeline « hybride » (23-24/07/2026) : GPT génère des FONDS vierges +
// des PHOTOS de gestes ; les trajectoires (giratoire) et schémas (priorité,
// dépassement) sont posés/dessinés en vectoriel (voir mockups/fiches-schemas/).
// Images SANS texte incrusté → les légendes vivent ICI, traduites FR/EN/AR.
// Fichiers : public/art/fiches/<src>.webp
// { src, fr, en?, ar? } — en/ar optionnels (repli FR à l'affichage).
// Une fiche sans entrée = pas de galerie (repli gracieux).
// ═══════════════════════════════════════════════════════════════

const FICHE_SCHEMAS = {
  // ── MONDE 1 · Maniement ──────────────────────────────────────
  C1a: [
    {
      src: "geste-poste-conduite",
      fr: "Installe-toi bien avant tout : c’est ta base.",
      en: "Settle in properly first — it’s your base.",
      ar: "استقرّ جيدًا قبل كل شيء: هذه قاعدتك.",
    },
    {
      src: "geste-ceinture",
      fr: "Ceinture attachée, portière bien claquée.",
      en: "Seatbelt on, door firmly shut.",
      ar: "اربط حزام الأمان، وأغلق الباب جيدًا.",
    },
  ],
  C1b: [
    {
      src: "geste-poste-conduite",
      fr: "Siège réglé : jambe encore un peu pliée sur l’embrayage.",
      en: "Seat set: knee still slightly bent on the clutch.",
      ar: "اضبط المقعد: تبقى ركبتك منثنية قليلًا على دواسة القابض.",
    },
    {
      src: "geste-retro-interieur",
      fr: "Règle le rétroviseur intérieur pour cadrer toute la lunette arrière.",
      en: "Set the interior mirror to frame the whole rear window.",
      ar: "اضبط المرآة الداخلية لترى كامل الزجاج الخلفي.",
    },
    {
      src: "geste-retro-ext-gauche",
      fr: "Rétroviseur extérieur : juste une pointe de ta voiture visible.",
      en: "Door mirror: just a sliver of your car in view.",
      ar: "المرآة الجانبية: يظهر طرف صغير من سيارتك فقط.",
    },
  ],
  C1c: [
    {
      src: "geste-poste-conduite",
      fr: "Mains à 9h15, pouces posés sur la jante.",
      en: "Hands at 9 and 3, thumbs on the rim.",
      ar: "اليدان عند وضع التاسعة والربع، والإبهامان على الإطار.",
    },
    {
      src: "geste-regard-loin",
      fr: "Regarde loin : ton regard tire la voiture.",
      en: "Look far ahead — your eyes pull the car.",
      ar: "انظر بعيدًا: نظرك يقود السيارة.",
    },
  ],
  C1d: [
    {
      src: "geste-frein-main",
      fr: "Avant le contact : frein à main serré, point mort.",
      en: "Before starting: handbrake on, in neutral.",
      ar: "قبل التشغيل: فرملة اليد مشدودة، والعتلة في وضع الحياد.",
    },
    {
      src: "geste-demarrage-contact",
      fr: "Embrayage à fond, puis contact.",
      en: "Clutch fully down, then start.",
      ar: "اضغط القابض حتى النهاية، ثم أدر المفتاح.",
    },
    {
      src: "geste-levier-vitesse",
      fr: "Passe la 1ère pour démarrer en douceur.",
      en: "Into first to pull away smoothly.",
      ar: "أدخِل السرعة الأولى للانطلاق بسلاسة.",
    },
  ],
  C1f: [
    {
      src: "geste-levier-vitesse",
      fr: "Débraye à fond, déplace le levier, relâche en douceur.",
      en: "Clutch in, shift, ease back out.",
      ar: "اضغط القابض كاملًا، حرّك العتلة، ثم حرّرها بلطف.",
    },
  ],
  C1g: [
    {
      src: "geste-phares-commodo",
      fr: "Teste tes feux : croisement, clignotants, stop.",
      en: "Test your lights: dipped beam, indicators, brake.",
      ar: "اختبر أضواءك: الأضواء المنخفضة، الغمّازات، وأضواء الفرملة.",
    },
  ],
  C1h: [
    {
      src: "geste-marche-arriere-epaule",
      fr: "En marche arrière : tourne-toi, regarde par la lunette.",
      en: "Reversing: turn and look through the rear window.",
      ar: "عند الرجوع للخلف: استدر وانظر عبر الزجاج الخلفي.",
    },
  ],
  C1i: [
    {
      src: "geste-marche-arriere-epaule",
      fr: "Choisis ta manœuvre, puis contrôle tout autour.",
      en: "Pick your maneuver, then check all around.",
      ar: "اختر المناورة المناسبة، ثم راقب كل ما حولك.",
    },
  ],

  // ── MONDE 2 · Circulation ────────────────────────────────────
  C2a: [
    {
      src: "geste-regard-loin",
      fr: "Porte ton regard loin devant, pas sur le capot.",
      en: "Look far ahead, not at the hood.",
      ar: "وجّه نظرك بعيدًا إلى الأمام، لا إلى غطاء المحرك.",
    },
    {
      src: "geste-retro-interieur",
      fr: "Un coup d’œil régulier au rétroviseur intérieur.",
      en: "Glance at the interior mirror regularly.",
      ar: "ألقِ نظرة منتظمة على المرآة الداخلية.",
    },
  ],
  C2d: [
    {
      src: "geste-regard-loin",
      fr: "Dans un virage, les yeux partent vers la sortie.",
      en: "In a bend, your eyes go to the exit.",
      ar: "في المنعطف، توجّه عيناك نحو المخرج.",
    },
  ],
  C2e: [
    {
      src: "C2e-depassement",
      fr: "Déboîte, dépasse largement, et rabats-toi seulement quand tu revois la voiture dans ton rétroviseur.",
      en: "Pull out, pass with plenty of room, and only move back in when you see the car in your mirror.",
      ar: "انحرف، تجاوز بمسافة كافية، ولا تعُد إلى مسارك إلا عندما ترى السيارة في مرآتك.",
    },
    {
      src: "geste-retro-ext-gauche",
      fr: "Avant de déboîter : rétroviseur extérieur gauche puis angle mort.",
      en: "Before pulling out: left door mirror, then blind spot.",
      ar: "قبل الانحراف: المرآة الجانبية اليسرى ثم الزاوية الميتة.",
    },
    {
      src: "geste-angle-mort",
      fr: "Le contrôle de l’angle mort avant de te déporter.",
      en: "The blind-spot check before you move out.",
      ar: "تحقّق من الزاوية الميتة قبل أن تنحرف.",
    },
  ],
  C2f: [
    {
      src: "C2f-giratoire-1-ville",
      fr: "Un rond-point, c’est une route à deux voies… mais courbée.",
      en: "A roundabout is just a two-lane road — only curved.",
      ar: "الدوّار مجرد طريق بمسارين… لكنه منحنٍ.",
    },
    {
      src: "C2f-giratoire-1-anneau",
      fr: "Voie extérieure (verte) et voie intérieure (bleue), comme deux files.",
      en: "Outer lane (green) and inner lane (blue), like two files.",
      ar: "المسار الخارجي (الأخضر) والمسار الداخلي (الأزرق)، كصفّين.",
    },
    {
      src: "C2f-giratoire-2-droite-toutdroit",
      fr: "À droite ou tout droit : voie de droite, clignotant à droite.",
      en: "Right or straight on: right lane, right indicator.",
      ar: "لليمين أو للأمام: المسار الأيمن، والغمّاز الأيمن.",
    },
    {
      src: "C2f-giratoire-3-gauche-rabattement",
      fr: "À gauche : voie de gauche, puis je me rabats une sortie avant la mienne (clignotant droit + angle mort droit).",
      en: "Left: inner lane, then move out one exit early (right indicator + right blind spot).",
      ar: "لليسار: المسار الأيسر، ثم أعود إلى الخارج قبل مخرجي بمخرج واحد (الغمّاز الأيمن + الزاوية الميتة اليمنى).",
    },
    {
      src: "C2f-priorite-droite-1-regle",
      fr: "Sans panneau : tout ce qui vient de ma droite passe avant moi.",
      en: "No sign: whatever comes from my right goes first.",
      ar: "بدون لافتة: كل ما يأتي من يميني له الأولوية عليّ.",
    },
    {
      src: "C2f-priorite-droite-2-stop",
      fr: "Un STOP ou un cédez-le-passage : je cède, même à quelqu’un venant de gauche.",
      en: "A stop or give-way sign: I yield, even to someone on my left.",
      ar: "لافتة قف أو أفسح الطريق: أتنازل عن الأولوية، حتى لمن يأتي من يساري.",
    },
    {
      src: "C2f-priorite-droite-3-feu",
      fr: "Un feu commande tout : vert je passe, rouge j’attends.",
      en: "A traffic light overrides all: green I go, red I wait.",
      ar: "الإشارة الضوئية تتحكم بكل شيء: أخضر أمرّ، أحمر أنتظر.",
    },
    {
      src: "C2f-priorite-droite-4-sensunique",
      fr: "Sens unique qui s’éloigne à droite : personne ne peut venir, je passe.",
      en: "One-way street leaving on my right: no one can come, I go.",
      ar: "طريق باتجاه واحد يبتعد إلى اليمين: لا أحد يمكن أن يأتي، فأمرّ.",
    },
    {
      src: "geste-angle-mort",
      fr: "Le contrôle de l’angle mort : la signature finale avant d’agir.",
      en: "The blind-spot check: the final signature before you act.",
      ar: "التحقّق من الزاوية الميتة: التوقيع الأخير قبل التصرّف.",
    },
  ],
  C2g: [
    {
      src: "geste-cligno-commodo",
      fr: "Annonce tôt : clignotant avant chaque changement.",
      en: "Signal early: indicator before every move.",
      ar: "أعلن مبكرًا: الغمّاز قبل كل تغيير.",
    },
    {
      src: "geste-phares-commodo",
      fr: "Voir et être vu : le bon usage des feux.",
      en: "See and be seen: the right use of your lights.",
      ar: "أن ترى وأن تُرى: الاستخدام الصحيح للأضواء.",
    },
  ],

  // ── MONDE 3 · Conditions difficiles ──────────────────────────
  C3a: [
    {
      src: "geste-phares-commodo",
      fr: "La nuit : feux de croisement dès que tu roules.",
      en: "At night: dipped beams as soon as you drive.",
      ar: "ليلًا: الأضواء المنخفضة بمجرد أن تنطلق.",
    },
  ],
  C3b: [
    {
      src: "geste-essuie-glaces",
      fr: "Dès les premières gouttes : essuie-glaces et désembuage.",
      en: "First drops: wipers and demist.",
      ar: "مع أولى القطرات: المسّاحات وإزالة الضباب عن الزجاج.",
    },
  ],
  C3e: [
    {
      src: "geste-cligno-commodo",
      fr: "Pour t’insérer : clignotant à gauche, tôt.",
      en: "To merge: left indicator, early.",
      ar: "للاندماج: الغمّاز الأيسر، مبكرًا.",
    },
    {
      src: "geste-retro-ext-gauche",
      fr: "Contrôle le rétroviseur gauche et l’angle mort avant de t’insérer.",
      en: "Check the left mirror and blind spot before merging.",
      ar: "تحقّق من المرآة اليسرى والزاوية الميتة قبل الاندماج.",
    },
  ],
  C3f: [
    {
      src: "geste-phares-commodo",
      fr: "Avant le tunnel : feux de croisement (jamais les pleins phares).",
      en: "Before the tunnel: dipped beams (never full beam).",
      ar: "قبل النفق: الأضواء المنخفضة (لا تستخدم الأضواء العالية أبدًا).",
    },
  ],
  C3g: [
    {
      src: "geste-regard-loin",
      fr: "En ville dense : lève le pied, un piéton peut surgir.",
      en: "In busy streets: ease off, a pedestrian may appear.",
      ar: "في المدينة المزدحمة: خفّف السرعة، قد يظهر أحد المشاة فجأة.",
    },
  ],

  // ── MONDE 4 · Conduite autonome ──────────────────────────────
  C4c: [
    {
      src: "geste-levier-vitesse",
      fr: "Passe les rapports tôt pour rouler en bas régime.",
      en: "Shift up early to keep the revs low.",
      ar: "بدّل السرعات مبكرًا للقيادة بدوران منخفض للمحرك.",
    },
  ],
  C4d: [
    {
      src: "geste-regard-loin",
      fr: "Regarde à 15-20 secondes devant toi.",
      en: "Look 15–20 seconds ahead.",
      ar: "انظر إلى مسافة 15–20 ثانية أمامك.",
    },
    {
      src: "geste-retro-interieur",
      fr: "Balaye en continu : rétros, devant, côtés.",
      en: "Scan constantly: mirrors, ahead, sides.",
      ar: "امسح باستمرار: المرايا، الأمام، الجانبان.",
    },
  ],
  C4e: [
    {
      src: "geste-retro-ext-droit",
      fr: "Surveille les cyclistes et deux-roues sur ta droite.",
      en: "Watch for cyclists and bikes on your right.",
      ar: "راقب الدرّاجات والدرّاجات النارية على يمينك.",
    },
  ],
  C4f: [
    {
      src: "geste-poste-conduite",
      fr: "Le jour J : installe ton poste comme à l’entraînement.",
      en: "On the day: set up exactly as in practice.",
      ar: "يوم الامتحان: اضبط وضعية قيادتك كما في التدريب.",
    },
    {
      src: "geste-ceinture",
      fr: "Ceinture, et vérifie celle du passager.",
      en: "Belt on, and check the passenger’s.",
      ar: "حزامك، وتحقّق من حزام الراكب.",
    },
    {
      src: "geste-retro-ext-gauche",
      fr: "Re-règle tes rétroviseurs si tu retouches le siège.",
      en: "Reset your mirrors if you adjust the seat.",
      ar: "أعد ضبط مراياك إذا عدّلت المقعد.",
    },
  ],
};

export function ficheSchemas(code) {
  return FICHE_SCHEMAS[code] || [];
}
