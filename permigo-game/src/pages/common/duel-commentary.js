/**
 * Les commentaires de l'écran de reveal du duel synchronisé.
 *
 * Après CHAQUE question (pas seulement à la fin), les deux téléphones
 * affichent le même commentaire, choisi selon ce qui vient de se passer :
 * qui prend la tête, un écart qui se creuse, une égalité serrée, les deux
 * qui se plantent ensemble. C'est ce qui donne l'impression d'un vrai match
 * plutôt que de deux quiz qui tournent côte à côte.
 *
 * ⚠️ Comme duel-intermission.js : {a} et {b} sont remplacés par des PRÉNOMS
 * bruts, jamais échappés ici. C'est la page qui doit passer `esc()` autour
 * du résultat avant de l'injecter en innerHTML.
 *
 * Règles d'écriture (CLAUDE.md) : zéro tiret, zéro virgule. Deux idées, deux
 * phrases courtes.
 */

const BANQUE = {
  // Un joueur vient de prendre la tête (il était derrière avant cette manche).
  reprise: [
    { fr: "{a} passe devant !", en: "{a} takes the lead!", ar: "{a} يتقدّم!" },
    {
      fr: "{a} reprend la tête.",
      en: "{a} grabs the lead.",
      ar: "{a} يستعيد الصدارة.",
    },
    {
      fr: "Retournement. {a} mène.",
      en: "Turnaround. {a} is ahead.",
      ar: "انقلاب. {a} في المقدمة.",
    },
    {
      fr: "{a} vient de doubler.",
      en: "{a} just overtook.",
      ar: "{a} تجاوز للتو.",
    },
  ],
  // L'écart se creuse et le même joueur menait déjà.
  ecart: [
    {
      fr: "{a} prend le large.",
      en: "{a} is pulling away.",
      ar: "{a} يبتعد في الصدارة.",
    },
    {
      fr: "{a} accélère encore.",
      en: "{a} speeds up again.",
      ar: "{a} يسرّع أكثر.",
    },
    {
      fr: "L'écart se creuse pour {a}.",
      en: "{a}'s lead keeps growing.",
      ar: "الفارق يتّسع لصالح {a}.",
    },
    {
      fr: "{a} en tête. Large.",
      en: "{a} in front. By a lot.",
      ar: "{a} في المقدمة بفارق كبير.",
    },
  ],
  // Score très serré entre les deux.
  serre: [
    { fr: "Coude à coude.", en: "Neck and neck.", ar: "متعادلان تقريبًا." },
    {
      fr: "Ça se joue à rien.",
      en: "It's anyone's game.",
      ar: "الأمر يتقرر بأي لحظة.",
    },
    {
      fr: "Toujours aussi serré.",
      en: "Still this close.",
      ar: "لا يزال متقاربًا جدًا.",
    },
    {
      fr: "{a} devant d'un souffle.",
      en: "{a} ahead by a hair.",
      ar: "{a} متقدّم بفارق ضئيل.",
    },
  ],
  // Les deux ont eu juste, très vite.
  duel_eclair: [
    {
      fr: "Deux réponses éclair !",
      en: "Two lightning answers!",
      ar: "إجابتان بسرعة البرق!",
    },
    {
      fr: "Personne n'a hésité.",
      en: "Nobody hesitated.",
      ar: "لم يتردد أحد.",
    },
    {
      fr: "Ça répond au quart de tour.",
      en: "Instant reflexes, both of you.",
      ar: "ردّ فعل فوري من الاثنين.",
    },
  ],
  // Les deux se plantent sur la même question.
  double_rate: [
    {
      fr: "Personne ne l'avait.",
      en: "Nobody had that one.",
      ar: "لم يعرفها أحد.",
    },
    {
      fr: "Piège pour tout le monde.",
      en: "That one fooled everyone.",
      ar: "خدعت الجميع.",
    },
    {
      fr: "Celle là, elle est traître.",
      en: "That question was a trap.",
      ar: "هذا السؤال كان خدعة.",
    },
  ],
  // Générique : sert de filet quand aucun cas précis ne matche.
  generique: [
    {
      fr: "{a} garde la tête.",
      en: "{a} stays in front.",
      ar: "{a} يحافظ على الصدارة.",
    },
    { fr: "La partie continue.", en: "Game's still on.", ar: "اللعبة مستمرة." },
    {
      fr: "Rien n'est joué.",
      en: "Nothing's decided yet.",
      ar: "لم يُحسم شيء بعد.",
    },
  ],
  // Un seul joueur dans la partie (l'hôte a lancé seul).
  solo: [
    { fr: "{a} enchaîne.", en: "{a} keeps going.", ar: "{a} يواصل." },
    {
      fr: "Bonne cadence {a}.",
      en: "Good pace {a}.",
      ar: "وتيرة جيدة يا {a}.",
    },
  ],
};

function pioche(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}
function applique(ligne, lang, vars) {
  let s = ligne[lang] || ligne.fr;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

/**
 * `reponses` : le tableau renvoyé par l'action `answer`/`reveal` de l'edge
 * function : [{ name, correct, points, total }, …], un élément par joueur.
 * `avant` : Map(name → total AVANT cette manche), pour détecter un changement
 * de tête. Optionnel : sans elle, la reprise ne peut pas être détectée.
 */
export function commentaireReveal(reponses, avant = new Map(), lang = "fr") {
  if (!reponses.length) return "";
  if (reponses.length === 1) {
    return applique(pioche(BANQUE.solo), lang, { a: reponses[0].name });
  }

  const tries = [...reponses].sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  const [leader, second] = tries;
  const gap = (leader.total ?? 0) - (second?.total ?? 0);

  const leaderAvant = [...avant.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const reprise = avant.size > 0 && leaderAvant && leaderAvant !== leader.name;

  const tousCorrects = reponses.every((r) => r.correct);
  const tousRates = reponses.every((r) => !r.correct);
  const tousEclair =
    tousCorrects && reponses.every((r) => (r.points ?? 0) >= 9);

  let categorie;
  if (reprise && gap > 0) categorie = "reprise";
  else if (tousRates) categorie = "double_rate";
  else if (tousEclair) categorie = "duel_eclair";
  else if (gap <= 2) categorie = "serre";
  else if (gap >= 15) categorie = "ecart";
  else categorie = "generique";

  return applique(pioche(BANQUE[categorie]), lang, {
    a: leader.name,
    b: second?.name || "",
  });
}
