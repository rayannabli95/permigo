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
// Pilote sur C1a SEULEMENT (décision Rayan, 05/08/2026) : on valide le
// format sur une compétence avant de générer l'audio des 30 autres. `audio`
// pointe vers un fichier prononcé par une vraie voix (ElevenLabs, voix
// « Andre »), généré et vérifié par Rayan avant la mise en prod.
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
};

/**
 * Renvoie 1 à 4 mots à connaître pour une compétence, ou [] si elle n'a pas
 * encore de lexique (rollout progressif, pilote sur C1a-C1c).
 */
export function vocabulairePour(compId) {
  return VOCABULAIRE_CONDUITE[compId] || [];
}
