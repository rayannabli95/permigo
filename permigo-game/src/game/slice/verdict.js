// Le verdict. Deux axes, jamais un seul.
//
//                  A BIEN DÉCIDÉ          A MAL DÉCIDÉ
//   A REGARDÉ      ✅ vu_juste            🟠 vu_faux
//   N'A PAS VU     🟠 aveugle_juste       🔴 aveugle_faux
//
// ⭐⭐⭐ La case `aveugle_juste` est la raison d'être du produit. C'est la
// seule chose qu'aucune application de code, aucun moniteur pressé et aucun
// examinateur ne dit jamais à un élève : tu as eu raison par hasard.
//
// Et un troisième axe par-dessus : le MOMENT. Bien vu, bien décidé, mais
// après que ça soit devenu évident, ce n'est plus de l'anticipation, c'est
// de la réaction.

export const CAS = ["vu_juste", "vu_faux", "aveugle_juste", "aveugle_faux"];

export function juger(scene, obs, m, R) {
  const cible = obs.danger || obs.indice;

  // ⭐ L'INSTANT DE RÉFÉRENCE, celui auquel tout se compare. Trois repères,
  // dans cet ordre, et aucun n'est écrit à la main :
  //   1. l'instant où le danger crève les yeux, dans l'axe de la voiture
  //   2. faute de mieux, l'instant où il arrive à portée de tôle
  //      🔴 Il en faut un deuxième : un angle mort ne devient JAMAIS évident.
  //      Sans ce repli, la scène du vélo ne produisait aucune mesure.
  //   3. sinon celui de l'indice, pour les scènes où rien n'est dangereux
  const reference =
    cible?.evident ??
    cible?.critique ??
    obs.indice?.evident ??
    obs.indice?.critique ??
    null;

  // ⭐⭐⭐ LA correction que le banc d'essai a imposée, et qui n'était dans
  // aucun document. « Vu » ne peut pas se prouver de la même façon selon
  // l'endroit où se trouve l'information.
  //
  //   preuve « regard »   il a fallu tourner la tête AVANT que ça arrive
  //                       dans l'axe. Regarder droit devant ne prouve rien :
  //                       un joueur qui ne bouge jamais le pouce « voyait »
  //                       tout, et les quatre cases devenaient du bruit.
  //
  //   preuve « reaction » l'information est droit devant mais LOIN. Un
  //                       téléphone n'a pas de profondeur de regard : aucune
  //                       direction ne dira jamais s'il a lu les feux stop
  //                       deux véhicules plus loin. Le seul témoin honnête,
  //                       c'est le délai entre l'allumage et son geste.
  // Le contrôle déclaré : le geste vaut preuve, même quand il n'y a rien à
  // trouver. C'est la seule façon de créditer une fausse alerte bien gérée.
  const vu =
    m.controleFait ||
    obs.zones.some((z) => {
      if (z.preuve === "reaction")
        return (
          m.tAction !== null && m.tAction - z.apparait <= R.delaiReactionInitial
        );
      if (z.niveau < 2 || z.premierRegard === null) return false;
      // Jamais devenu évident (l'angle mort) : l'avoir trouvé EST la preuve.
      if (z.evident === null) return true;
      // ⚠️ Strictement avant, avec la marge d'une image : sinon « premier
      // instant visible » et « premier instant évident » tombent au même
      // centième et tout le monde a l'air d'avoir regardé.
      return z.premierRegard < z.evident - 0.12;
    });

  const decision = m.aRalenti ? "ralentir" : "continuer";
  const attendu = scene.attendu;
  // Une décision juste ne suffit pas : percuter quelqu'un en ayant « ralenti »
  // n'est pas une réussite. L'issue tranche en dernier.
  const juste = decision === attendu && m.issue !== "choc" && !m.tropPres;

  const cas = `${vu ? "vu" : "aveugle"}_${juste ? "juste" : "faux"}`;

  // ⭐ La marge d'anticipation : l'instant de référence moins l'instant où il
  // a agi. Positive, il a anticipé. Négative, il a subi. C'est la métrique
  // nord du projet, et elle n'a de sens que parce que la référence est
  // MESURÉE et pas écrite à la main.
  const marge =
    reference !== null && m.tAction !== null ? reference - m.tAction : null;

  // « Tard » ne s'applique qu'à ce qui demandait un geste. Sur une fausse
  // alerte, ne rien faire au bon moment n'est pas un retard.
  const tard =
    juste &&
    attendu === "ralentir" &&
    marge !== null &&
    marge < 0 &&
    m.issue !== "choc";

  return {
    cas,
    tard,
    vu,
    decision,
    attendu,
    juste,
    marge,
    reference,
    evident: cible?.evident ?? null,
    critique: cible?.critique ?? null,
    connaissable: cible?.connaissable ?? null,
    niveau: cible?.niveau ?? 0,
    indice: obs.indice?.texte || cible?.texte || "",
    // La phrase du moteur. La coque décide si elle la montre, et quand.
    phrase: tard ? scene.phrases.tard : scene.phrases[cas],
  };
}

// Les quatre cases traduites pour un humain qui lit un export.
export const LIBELLES = {
  vu_juste: "vu et bien décidé",
  vu_faux: "vu et mal décidé",
  aveugle_juste: "bonne décision sans avoir vu",
  aveugle_faux: "ni vu ni compris",
};
