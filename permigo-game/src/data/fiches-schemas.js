// ═══════════════════════════════════════════════════════════════
// Le briefing en images de chaque fiche de conduite.
//
// Deux familles :
//  • `br-*.webp` — la série « glossy » (08/08/2026). Même voiture violette,
//    même rue de pavillons la nuit. Elles remplacent les anciennes photos
//    `geste-*.webp`, qui faisaient trop « planche du code de la route ».
//  • `br-*.mp4` — les six gestes qu'aucune photo ne montre (distance, place
//    dans la voie, écart au cycliste, trajectoire, insertion, créneau). Une
//    photo montre un LIEU, jamais un ÉCART : il faut une ligne qui se dessine.
//    Rendues avec Remotion (permigo-video/src/VueDuCiel.tsx), 3 s en boucle,
//    ~40 Ko pièce, soit MOINS lourd que l'image fixe équivalente.
//
// Restent les schémas vectoriels de dépassement et d'intersection (C2e, C2f) :
// ce sont des plans, pas des photos, ils gardent leur cadre carré.
//
// Images SANS texte incrusté → les légendes vivent ICI, traduites FR/EN/AR.
// Fichiers : public/art/fiches/<src>.webp (ou .mp4 si `video`)
//
// Une entrée :
//   { src, fr, en?, ar?, video?, auto? }
//   `auto` = la variante servie à l'élève inscrit en boîte automatique
//   (pas d'embrayage, sélecteur P R N D). Même forme : { src, fr, en?, ar? }.
// Une fiche sans entrée = pas de galerie (repli gracieux).
// ═══════════════════════════════════════════════════════════════

// ── Les seize vues du poste de conduite ─────────────────────────
// Déclarées une fois, réutilisées par plusieurs fiches : une légende
// écrite deux fois finit toujours par diverger de sa jumelle.

const CLIGNO = {
  src: "br-cligno",
  fr: "Le clignotant est sur le commodo de gauche. Les balais sont à droite.",
  en: "Indicators sit on the left stalk. Wipers are on the right.",
  ar: "الغمّاز على الذراع الأيسر. المسّاحات على اليمين.",
};

const VOLANT = {
  src: "br-volant",
  fr: "Les mains à 9h15. Les pouces posés sur la jante.",
  en: "Hands at 9 and 3. Thumbs resting on the rim.",
  ar: "اليدان عند التاسعة والربع. الإبهامان على الإطار.",
};

const PEDALES = {
  src: "br-pedales",
  fr: "À gauche l'embrayage. Au milieu le frein. À droite l'accélérateur.",
  en: "Clutch on the left. Brake in the middle. Throttle on the right.",
  ar: "القابض على اليسار. الفرملة في الوسط. دواسة الوقود على اليمين.",
  auto: {
    src: "br-pedales-auto",
    fr: "Deux pédales seulement. Le pied gauche se repose à plat.",
    en: "Two pedals only. Your left foot rests flat.",
    ar: "دواستان فقط. تبقى قدمك اليسرى مستريحة.",
  },
};

const LEVIER = {
  src: "br-levier",
  fr: "La grille se lit sur le pommeau. R 1 3 5 en haut. 2 4 6 en bas.",
  en: "The pattern is on the knob. R 1 3 5 up top. 2 4 6 below.",
  ar: "شكل السرعات على المقبض. R 1 3 5 في الأعلى. 2 4 6 في الأسفل.",
  auto: {
    src: "br-levier-auto",
    fr: "P pour stationner. R pour reculer. N au point mort. D pour rouler.",
    en: "P to park. R to reverse. N for neutral. D to drive.",
    ar: "P للركن. R للرجوع. N للحياد. D للسير.",
  },
};

const CEINTURE = {
  src: "br-ceinture",
  fr: "La languette clipse dans la boucle. Tu dois entendre le clic.",
  en: "The tongue clips into the buckle. You should hear the click.",
  ar: "يدخل اللسان في الإبزيم. يجب أن تسمع صوت الطقطقة.",
};

const CONTACT = {
  src: "br-contact",
  fr: "Le contact réveille la voiture. Les témoins s'allument puis s'éteignent.",
  en: "Ignition wakes the car. The warning lights come on then go out.",
  ar: "التشغيل يوقظ السيارة. تضيء المؤشرات ثم تنطفئ.",
};

const FREIN_MAIN = {
  src: "br-frein-main",
  fr: "Frein à main tiré avant de démarrer. Le bouton de relâche est au bout.",
  en: "Handbrake up before starting. The release button is at the tip.",
  ar: "اشدّ فرملة اليد قبل التشغيل. زر التحرير في الطرف.",
};

const PHARES = {
  src: "br-phares",
  fr: "Feux de croisement allumés. Le témoin vert le confirme au compteur.",
  en: "Dipped beams on. The green light on the dash confirms it.",
  ar: "الأضواء المنخفضة مضاءة. يؤكد ذلك المؤشر الأخضر على العدّاد.",
};

const RETRO_INT = {
  src: "br-retro-interieur",
  fr: "Le rétroviseur intérieur cadre toute la lunette arrière.",
  en: "The interior mirror frames the whole rear window.",
  ar: "تُظهر المرآة الداخلية كامل الزجاج الخلفي.",
};

const RETRO_GAUCHE = {
  src: "br-retro-gauche",
  fr: "Dans le rétroviseur extérieur tu ne vois qu'une pointe de ta voiture.",
  en: "In the door mirror you see just a sliver of your own car.",
  ar: "في المرآة الجانبية ترى طرفًا صغيرًا فقط من سيارتك.",
};

const ANGLE_MORT = {
  src: "br-angle-mort",
  fr: "Une voiture roule juste là. Aucun rétroviseur ne te la montre.",
  en: "A car is driving right there. No mirror will show it to you.",
  ar: "توجد سيارة تسير هناك تمامًا. لا تُظهرها لك أي مرآة.",
};

const MARCHE_ARRIERE = {
  src: "br-marche-arriere",
  fr: "En marche arrière tu te tournes et tu regardes par la lunette.",
  en: "Reversing means turning round and looking through the rear window.",
  ar: "عند الرجوع للخلف تستدير وتنظر عبر الزجاج الخلفي.",
};

const REGARD_LOIN = {
  src: "br-regard-loin",
  fr: "Le regard va au bout de la route. La voiture suit les yeux.",
  en: "Your eyes go to the end of the road. The car follows them.",
  ar: "يذهب نظرك إلى آخر الطريق. تتبع السيارة عينيك.",
};

const ESSUIE = {
  src: "br-essuie-glaces",
  fr: "Dès les premières gouttes tu balaies et tu désembues.",
  en: "First drops means wipers on and demist on.",
  ar: "مع أولى القطرات شغّل المسّاحات وأزل الضباب.",
};

// ── Les six vues du ciel, animées ───────────────────────────────

const DISTANCE = {
  src: "br-distance",
  video: true,
  fr: "Deux secondes de vide devant toi. C'est ça la distance de sécurité.",
  en: "Two seconds of empty road ahead. That is your safety gap.",
  ar: "ثانيتان من الفراغ أمامك. تلك هي مسافة الأمان.",
};

const POSITION = {
  src: "br-position",
  video: true,
  fr: "Autant d'espace à gauche qu'à droite. Tu es au milieu de ta voie.",
  en: "As much room left as right. You are centred in your lane.",
  ar: "مساحة متساوية على اليسار واليمين. أنت في وسط مسارك.",
};

const CYCLISTE = {
  src: "br-cycliste",
  video: true,
  fr: "Un mètre en ville. Un mètre cinquante en dehors.",
  en: "One metre in town. One and a half metres outside.",
  ar: "متر واحد داخل المدينة. متر ونصف خارجها.",
};

const VIRAGE = {
  src: "br-virage",
  video: true,
  fr: "La trace reste entre la ligne du milieu et le bord du début à la fin.",
  en: "The line stays between the centre line and the edge all the way.",
  ar: "يبقى المسار بين الخط الأوسط والحافة من البداية إلى النهاية.",
};

const INSERTION = {
  src: "br-insertion",
  video: true,
  fr: "Tu vises le trou. Tu prends la vitesse de ceux qui roulent déjà.",
  en: "Aim for the gap. Match the speed of the traffic already there.",
  ar: "استهدف الفجوة. واكب سرعة السيارات الموجودة أصلًا.",
};

const CRENEAU = {
  src: "br-creneau",
  video: true,
  fr: "Autant de marge devant que derrière. Les roues sont droites.",
  en: "As much room in front as behind. Wheels straight.",
  ar: "مساحة أمامك بقدر ما خلفك. والعجلات مستقيمة.",
};

// ── Les dix objets, photographiés EN SITUATION ──────────────────
// Générés pour le quiz de certification (quiz-visuals.js) puis servis ici :
// ce sont les mêmes fichiers, la même voiture, la même nuit. Un objet posé
// sur un socle redevient une planche technique — celui-ci est toujours dans
// la voiture ou sur la route.

const GPS = {
  src: "br-obj-gps",
  fr: "Le téléphone se pose sur son support. L'itinéraire se règle moteur coupé.",
  en: "The phone goes in its cradle. Set the route with the engine off.",
  ar: "يوضع الهاتف في حامله. اضبط المسار والمحرّك متوقّف.",
};

const CARTE = {
  src: "br-obj-carte",
  fr: "Le trajet se prépare avant de partir. Tu repères les grands axes et ta sortie.",
  en: "Plan the trip before you set off. Spot the main roads and your exit.",
  ar: "حضّر رحلتك قبل الانطلاق. حدّد الطرق الكبرى ومخرجك.",
};

const HORLOGE = {
  src: "br-obj-horloge",
  fr: "Tu pars avec de l'avance. Un conducteur pressé prend des risques.",
  en: "Leave early. A driver in a hurry takes risks.",
  ar: "انطلق مبكرًا. السائق المستعجل يخاطر.",
};

const JAUGE = {
  src: "br-obj-jauge",
  fr: "Le niveau se regarde avant de rouler. Une panne sèche tombe toujours au mauvais endroit.",
  en: "Check the level before you drive. Running dry always happens in the worst spot.",
  ar: "تحقّق من مستوى الوقود قبل القيادة. نفاد الوقود يحدث دائمًا في أسوأ مكان.",
};

const COMPTEUR = {
  src: "br-obj-compteur",
  fr: "Une vitesse stable use moins de carburant. Le compteur se lit du coin de l'œil.",
  en: "A steady speed burns less fuel. Glance at the dial, never stare.",
  ar: "السرعة الثابتة تستهلك وقودًا أقل. انظر إلى العدّاد بطرف عينك.",
};

const PNEU = {
  src: "br-obj-pneu",
  fr: "Le pneu se contrôle à froid. Tu cherches l'usure et les coupures.",
  en: "Check tyres cold. Look for wear and cuts.",
  ar: "افحص الإطار وهو بارد. ابحث عن التآكل والشقوق.",
};

const SECOURS = {
  src: "br-obj-secours",
  fr: "Le gilet reste à portée de main. Le triangle se pose derrière la voiture.",
  en: "Keep the vest within reach. The triangle goes behind the car.",
  ar: "احتفظ بالسترة في متناول يدك. ويوضع المثلث خلف السيارة.",
};

const DISQUE_A = {
  src: "br-obj-disqueA",
  fr: "Le disque A se colle à l'arrière. Il reste tout le temps de la période probatoire.",
  en: "The A disc goes on the back. It stays on for the whole probation period.",
  ar: "يُلصق قرص A في الخلف. ويبقى طوال فترة القيادة تحت الاختبار.",
};

const PERMIS = {
  src: "br-obj-permis",
  fr: "Le permis reste sur toi à chaque trajet. Un contrôle peut arriver n'importe quand.",
  en: "Carry your licence on every trip. A check can happen at any time.",
  ar: "احمل رخصتك في كل رحلة. فقد تُوقَف للتفتيش في أي وقت.",
};

const ETHYLO = {
  src: "br-obj-ethylo",
  fr: "En période probatoire la limite est de 0,2 g par litre. Un seul verre la dépasse.",
  en: "On probation the limit is 0.2 g per litre. One drink is already over.",
  ar: "خلال فترة الاختبار الحد هو 0,2 غرام لكل لتر. وكأس واحدة تتجاوزه.",
};

const FICHE_SCHEMAS = {
  // ── MONDE 1 · Maniement ──────────────────────────────────────
  C1a: [CLIGNO, PEDALES, CONTACT],
  C1b: [RETRO_INT, RETRO_GAUCHE, CEINTURE],
  C1c: [VOLANT, REGARD_LOIN],
  C1d: [FREIN_MAIN, CONTACT, LEVIER],
  C1e: [PEDALES],
  C1f: [LEVIER],
  // Le tour de voiture, c'est ce qu'on regarde DEHORS avant de monter : les
  // pneus, les feux, le niveau, et le gilet qui doit être là le jour où.
  C1g: [PNEU, PHARES, JAUGE, SECOURS],
  C1h: [CRENEAU, MARCHE_ARRIERE],
  C1i: [MARCHE_ARRIERE, ANGLE_MORT],

  // ── MONDE 2 · Circulation ────────────────────────────────────
  C2a: [REGARD_LOIN, RETRO_INT],
  C2b: [DISTANCE, REGARD_LOIN],
  C2c: [POSITION, RETRO_GAUCHE],
  C2d: [VIRAGE, REGARD_LOIN],
  C2e: [
    {
      src: "C2e-depassement",
      plan: true,
      fr: "Déboîte, dépasse largement, et rabats-toi seulement quand tu revois la voiture dans ton rétroviseur.",
      en: "Pull out, pass with plenty of room, and only move back in when you see the car in your mirror.",
      ar: "انحرف، تجاوز بمسافة كافية، ولا تعُد إلى مسارك إلا عندما ترى السيارة في مرآتك.",
    },
    {
      src: "geste-retro-ext-gauche",
      plan: true,
      fr: "Avant de déboîter : rétroviseur extérieur gauche puis angle mort.",
      en: "Before pulling out: left door mirror, then blind spot.",
      ar: "قبل الانحراف: المرآة الجانبية اليسرى ثم الزاوية الميتة.",
    },
    {
      src: "geste-angle-mort",
      plan: true,
      fr: "Le contrôle de l’angle mort avant de te déporter.",
      en: "The blind-spot check before you move out.",
      ar: "تحقّق من الزاوية الميتة قبل أن تنحرف.",
    },
  ],
  C2f: [
    {
      src: "C2f-giratoire-1-ville",
      plan: true,
      fr: "Un rond-point, c’est une route à deux voies… mais courbée.",
      en: "A roundabout is just a two-lane road. Only curved.",
      ar: "الدوّار مجرد طريق بمسارين… لكنه منحنٍ.",
    },
    {
      src: "C2f-giratoire-1-anneau",
      plan: true,
      fr: "Voie extérieure (verte) et voie intérieure (bleue), comme deux files.",
      en: "Outer lane (green) and inner lane (blue), like two files.",
      ar: "المسار الخارجي (الأخضر) والمسار الداخلي (الأزرق)، كصفّين.",
    },
    {
      src: "C2f-giratoire-2-droite-toutdroit",
      plan: true,
      fr: "À droite ou tout droit : voie de droite, clignotant à droite.",
      en: "Right or straight on: right lane, right indicator.",
      ar: "لليمين أو للأمام: المسار الأيمن، والغمّاز الأيمن.",
    },
    {
      src: "C2f-giratoire-3-gauche-rabattement",
      plan: true,
      fr: "À gauche : voie de gauche, puis je me rabats une sortie avant la mienne (clignotant droit + angle mort droit).",
      en: "Left: inner lane, then move out one exit early (right indicator + right blind spot).",
      ar: "لليسار: المسار الأيسر، ثم أعود إلى الخارج قبل مخرجي بمخرج واحد (الغمّاز الأيمن + الزاوية الميتة اليمنى).",
    },
    {
      src: "C2f-priorite-droite-1-regle",
      plan: true,
      fr: "Sans panneau : tout ce qui vient de ma droite passe avant moi.",
      en: "No sign: whatever comes from my right goes first.",
      ar: "بدون لافتة: كل ما يأتي من يميني له الأولوية عليّ.",
    },
    {
      src: "C2f-priorite-droite-2-stop",
      plan: true,
      fr: "Un STOP ou un cédez-le-passage : je cède, même à quelqu’un venant de gauche.",
      en: "A stop or give-way sign: I yield, even to someone on my left.",
      ar: "لافتة قف أو أفسح الطريق: أتنازل عن الأولوية، حتى لمن يأتي من يساري.",
    },
    {
      src: "C2f-priorite-droite-3-feu",
      plan: true,
      fr: "Un feu commande tout : vert je passe, rouge j’attends.",
      en: "A traffic light overrides all: green I go, red I wait.",
      ar: "الإشارة الضوئية تتحكم بكل شيء: أخضر أمرّ، أحمر أنتظر.",
    },
    {
      src: "C2f-priorite-droite-4-sensunique",
      plan: true,
      fr: "Sens unique qui s’éloigne à droite : personne ne peut venir, je passe.",
      en: "One-way street leaving on my right: no one can come, I go.",
      ar: "طريق باتجاه واحد يبتعد إلى اليمين: لا أحد يمكن أن يأتي، فأمرّ.",
    },
    {
      src: "geste-angle-mort",
      plan: true,
      fr: "Le contrôle de l’angle mort : la signature finale avant d’agir.",
      en: "The blind-spot check: the final signature before you act.",
      ar: "التحقّق من الزاوية الميتة: التوقيع الأخير قبل التصرّف.",
    },
  ],
  C2g: [CLIGNO, PHARES],
  C2h: [REGARD_LOIN, POSITION],

  // ── MONDE 3 · Conditions difficiles ──────────────────────────
  C3a: [PHARES, REGARD_LOIN],
  C3b: [ESSUIE, DISTANCE],
  C3c: [VIRAGE, PEDALES],
  C3d: [PEDALES, DISTANCE],
  C3e: [INSERTION, RETRO_GAUCHE, ANGLE_MORT],
  C3f: [PHARES],
  C3g: [CYCLISTE, REGARD_LOIN],

  // ── MONDE 4 · Conduite autonome ──────────────────────────────
  C4a: [CARTE, GPS, HORLOGE],
  C4b: [GPS, REGARD_LOIN],
  C4c: [COMPTEUR, LEVIER, REGARD_LOIN],
  C4d: [DISTANCE, REGARD_LOIN, RETRO_INT],
  C4e: [CYCLISTE, ANGLE_MORT],
  C4f: [CEINTURE, RETRO_GAUCHE, VOLANT],
  C4g: [DISQUE_A, PERMIS, ETHYLO],
};

/**
 * Le briefing en images d'une fiche.
 * `enAuto` sert la variante boîte automatique quand elle existe (pédalier,
 * sélecteur). Boîte inconnue ou manuelle → la version manuelle, comme le
 * reste de la page.
 */
export function ficheSchemas(code, enAuto = false) {
  const items = FICHE_SCHEMAS[code] || [];
  return items.map((s) => (enAuto && s.auto ? { ...s, ...s.auto } : s));
}
