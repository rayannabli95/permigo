// ═══════════════════════════════════════════════════════════════
// Le petit lexique français que l'élève garde après une certification.
//
// Décision Rayan (05/08/2026) : un élève allophone (anglais, arabe) traduit
// TOUTE l'app, mais roule en France avec un moniteur qui parle français.
// Ce lexique lui donne 1 à 4 mots RÉELS du poste de conduite, ceux que son
// moniteur dira dans la voiture, avec leur sens dans sa langue et une
// prononciation audio. Le but n'est pas de le franciser : c'est qu'il
// comprenne son moniteur sans perdre sa propre langue.
//
// Les 31 compétences REMC sont couvertes (rollout du 05/08, après pilote
// sur C1a seul). `audio` pointe vers un fichier prononcé par une vraie voix
// (ElevenLabs, voix « Andre »), généré et vérifié par Rayan avant la prod.
// ═══════════════════════════════════════════════════════════════

export const VOCABULAIRE_CONDUITE = {
  C1a: [
    {
      mot: "le commodo",
      en: "the turn signal stalk",
      ar: "ذراع الإشارة",
      audio: "/audio/vocab/commodo.mp3",
    },
    {
      mot: "le clignotant",
      en: "the turn signal",
      ar: "الغماز",
      audio: "/audio/vocab/clignotant.mp3",
    },
    {
      mot: "le tableau de bord",
      en: "the dashboard",
      ar: "لوحة القيادة",
      audio: "/audio/vocab/tableau-de-bord.mp3",
    },
  ],
  C1b: [
    {
      mot: "l'appuie-tête",
      en: "the headrest",
      ar: "مسند الرأس",
      audio: "/audio/vocab/appuie-tete.mp3",
    },
    {
      mot: "le dossier",
      en: "the seatback",
      ar: "مسند الظهر",
      audio: "/audio/vocab/dossier.mp3",
    },
  ],
  C1c: [
    {
      mot: "le volant",
      en: "the steering wheel",
      ar: "المقود",
      audio: "/audio/vocab/volant.mp3",
    },
    {
      mot: "la trajectoire",
      en: "the path you follow",
      ar: "المسار",
      audio: "/audio/vocab/trajectoire.mp3",
    },
  ],
  C1d: [
    {
      mot: "le point d'embrayage",
      en: "the clutch bite point",
      ar: "نقطة التعشيق",
      audio: "/audio/vocab/point-embrayage.mp3",
    },
    {
      mot: "le frein à main",
      en: "the handbrake",
      ar: "فرملة اليد",
      audio: "/audio/vocab/frein-a-main.mp3",
    },
  ],
  C1e: [
    {
      mot: "l'embrayage",
      en: "the clutch",
      ar: "دواسة القابض",
      audio: "/audio/vocab/embrayage.mp3",
    },
    {
      mot: "l'accélérateur",
      en: "the accelerator",
      ar: "دواسة الوقود",
      audio: "/audio/vocab/accelerateur.mp3",
    },
  ],
  C1f: [
    {
      mot: "le levier de vitesse",
      en: "the gear lever",
      ar: "عصا نقل السرعات",
      audio: "/audio/vocab/levier-vitesse.mp3",
    },
    {
      mot: "le régime moteur",
      en: "the engine speed",
      ar: "سرعة دوران المحرك",
      audio: "/audio/vocab/regime-moteur.mp3",
    },
  ],
  C1g: [
    {
      mot: "le tour de voiture",
      en: "the walk-around check",
      ar: "جولة فحص السيارة",
      audio: "/audio/vocab/tour-voiture.mp3",
    },
    {
      mot: "le niveau d'huile",
      en: "the oil level",
      ar: "مستوى الزيت",
      audio: "/audio/vocab/niveau-huile.mp3",
    },
  ],
  C1h: [
    {
      mot: "le créneau",
      en: "parallel parking",
      ar: "الركن الجانبي",
      audio: "/audio/vocab/creneau.mp3",
    },
    {
      mot: "le demi-tour",
      en: "the U-turn",
      ar: "الدوران نصف دائرة",
      audio: "/audio/vocab/demi-tour.mp3",
    },
  ],
  C1i: [
    {
      mot: "la manœuvre",
      en: "the maneuver",
      ar: "المناورة",
      audio: "/audio/vocab/manoeuvre.mp3",
    },
    {
      mot: "l'angle mort",
      en: "the blind spot",
      ar: "الزاوية الميتة",
      audio: "/audio/vocab/angle-mort.mp3",
    },
  ],
  C2a: [
    {
      mot: "le panneau",
      en: "the road sign",
      ar: "اللافتة",
      audio: "/audio/vocab/panneau.mp3",
    },
    {
      mot: "la priorité",
      en: "right of way",
      ar: "الأولوية",
      audio: "/audio/vocab/priorite.mp3",
    },
  ],
  C2b: [
    {
      mot: "l'allure",
      en: "your pace",
      ar: "وتيرة السير",
      audio: "/audio/vocab/allure.mp3",
    },
    {
      mot: "la vitesse",
      en: "the speed",
      ar: "السرعة",
      audio: "/audio/vocab/vitesse.mp3",
    },
  ],
  C2c: [
    {
      mot: "la voie",
      en: "the lane",
      ar: "الحارة",
      audio: "/audio/vocab/voie.mp3",
    },
    {
      mot: "l'accotement",
      en: "the road shoulder",
      ar: "كتف الطريق",
      audio: "/audio/vocab/accotement.mp3",
    },
  ],
  C2d: [
    {
      mot: "le virage",
      en: "the bend",
      ar: "المنعطف",
      audio: "/audio/vocab/virage.mp3",
    },
  ],
  C2e: [
    {
      mot: "le dépassement",
      en: "overtaking",
      ar: "التجاوز",
      audio: "/audio/vocab/depassement.mp3",
    },
  ],
  C2f: [
    {
      mot: "le rond-point",
      en: "the roundabout",
      ar: "الدوار",
      audio: "/audio/vocab/rond-point.mp3",
    },
    {
      mot: "la priorité à droite",
      en: "right of way from the right",
      ar: "أولوية اليمين",
      audio: "/audio/vocab/priorite-droite.mp3",
    },
  ],
  C2g: [
    {
      mot: "le klaxon",
      en: "the horn",
      ar: "بوق السيارة",
      audio: "/audio/vocab/klaxon.mp3",
    },
    {
      mot: "l'appel de phares",
      en: "flashing your headlights",
      ar: "وميض الأضواء",
      audio: "/audio/vocab/appel-phares.mp3",
    },
  ],
  C2h: [
    {
      mot: "le carrefour",
      en: "the intersection",
      ar: "التقاطع",
      audio: "/audio/vocab/carrefour.mp3",
    },
    {
      mot: "la zone 30",
      en: "the 30 km/h zone",
      ar: "منطقة 30",
      audio: "/audio/vocab/zone-30.mp3",
    },
  ],
  C3a: [
    {
      mot: "les feux de croisement",
      en: "low beam headlights",
      ar: "الأضواء المنخفضة",
      audio: "/audio/vocab/feux-croisement.mp3",
    },
    {
      mot: "les feux de route",
      en: "high beam headlights",
      ar: "الأضواء العالية",
      audio: "/audio/vocab/feux-route.mp3",
    },
  ],
  C3b: [
    {
      mot: "le brouillard",
      en: "fog",
      ar: "الضباب",
      audio: "/audio/vocab/brouillard.mp3",
    },
    {
      mot: "l'essuie-glace",
      en: "the wiper",
      ar: "ماسحة الزجاج",
      audio: "/audio/vocab/essuie-glace.mp3",
    },
  ],
  C3c: [
    {
      mot: "l'aquaplaning",
      en: "hydroplaning",
      ar: "انزلاق الماء",
      audio: "/audio/vocab/aquaplaning.mp3",
    },
    {
      mot: "le dérapage",
      en: "skidding",
      ar: "الانزلاق",
      audio: "/audio/vocab/derapage.mp3",
    },
  ],
  C3d: [
    {
      mot: "l'ABS",
      en: "the ABS (anti-lock brakes)",
      ar: "نظام ABS لمنع انغلاق العجلات",
      audio: "/audio/vocab/abs.mp3",
    },
    {
      mot: "le freinage d'urgence",
      en: "emergency braking",
      ar: "الفرملة الاضطرارية",
      audio: "/audio/vocab/freinage-urgence.mp3",
    },
  ],
  C3e: [
    {
      mot: "la bretelle",
      en: "the slip road",
      ar: "طريق الدخول أو الخروج",
      audio: "/audio/vocab/bretelle.mp3",
    },
    {
      mot: "la voie de décélération",
      en: "the deceleration lane",
      ar: "مسار إبطاء السرعة",
      audio: "/audio/vocab/voie-deceleration.mp3",
    },
  ],
  C3f: [
    {
      mot: "le tunnel",
      en: "the tunnel",
      ar: "النفق",
      audio: "/audio/vocab/tunnel.mp3",
    },
    {
      mot: "la distance de sécurité",
      en: "the safety distance",
      ar: "مسافة الأمان",
      audio: "/audio/vocab/distance-securite.mp3",
    },
  ],
  C3g: [
    {
      mot: "la zone piétonne",
      en: "the pedestrian zone",
      ar: "منطقة المشاة",
      audio: "/audio/vocab/zone-pietonne.mp3",
    },
    {
      mot: "le partage de la route",
      en: "sharing the road",
      ar: "تقاسم الطريق",
      audio: "/audio/vocab/partage-route.mp3",
    },
  ],
  C4a: [
    {
      mot: "l'itinéraire",
      en: "the route",
      ar: "المسار المخطط",
      audio: "/audio/vocab/itineraire.mp3",
    },
    {
      mot: "le trajet",
      en: "the trip",
      ar: "الرحلة",
      audio: "/audio/vocab/trajet.mp3",
    },
  ],
  C4b: [
    {
      mot: "le GPS",
      en: "the GPS",
      ar: "نظام تحديد المواقع",
      audio: "/audio/vocab/gps.mp3",
    },
    {
      mot: "la sortie",
      en: "the exit",
      ar: "المخرج",
      audio: "/audio/vocab/sortie.mp3",
    },
  ],
  C4c: [
    {
      mot: "l'éco-conduite",
      en: "eco-driving",
      ar: "القيادة الاقتصادية",
      audio: "/audio/vocab/eco-conduite.mp3",
    },
    {
      mot: "la conduite souple",
      en: "smooth driving",
      ar: "القيادة السلسة",
      audio: "/audio/vocab/conduite-souple.mp3",
    },
  ],
  C4d: [
    {
      mot: "l'anticipation",
      en: "anticipation",
      ar: "الاستباق",
      audio: "/audio/vocab/anticipation.mp3",
    },
    {
      mot: "le sang-froid",
      en: "staying calm",
      ar: "رباطة الجأش",
      audio: "/audio/vocab/sang-froid.mp3",
    },
  ],
  C4e: [
    {
      mot: "le piéton",
      en: "the pedestrian",
      ar: "المشاة",
      audio: "/audio/vocab/pieton.mp3",
    },
    {
      mot: "le cycliste",
      en: "the cyclist",
      ar: "راكب الدراجة",
      audio: "/audio/vocab/cycliste.mp3",
    },
  ],
  C4f: [
    {
      mot: "l'épreuve",
      en: "the driving test",
      ar: "امتحان القيادة",
      audio: "/audio/vocab/epreuve.mp3",
    },
    {
      mot: "le permis",
      en: "the licence",
      ar: "رخصة القيادة",
      audio: "/audio/vocab/permis.mp3",
    },
  ],
  C4g: [
    {
      mot: "le permis probatoire",
      en: "the probationary licence",
      ar: "رخصة تحت التجربة",
      audio: "/audio/vocab/permis-probatoire.mp3",
    },
    {
      mot: "le disque A",
      en: 'the "A" learner disc',
      ar: "ملصق A لحديثي الرخصة",
      audio: "/audio/vocab/disque-a.mp3",
    },
  ],
};

/**
 * Renvoie 1 à 4 mots à connaître pour une compétence, ou [] si elle n'a pas
 * encore de lexique.
 */
export function vocabulairePour(compId) {
  return VOCABULAIRE_CONDUITE[compId] || [];
}
