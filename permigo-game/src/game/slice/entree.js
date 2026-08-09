// Le geste. Trois façons de regarder, trois façons de ralentir, une seule
// sortie pour le moteur : un angle de tête et une pression de frein.
//
// ⭐ C'est peut-être la brique la plus importante du banc d'essai. Ce qu'on
// cherche n'est pas « quelle commande est la plus précise » mais laquelle
// donne le plus vite la sensation « JE REGARDE », et pas « je déplace une
// caméra ». Le moteur ne doit rien savoir de la réponse : il lit un angle.
//
// Tout passe par un seul gestionnaire de doigts, parce que regarder et
// freiner arrivent en même temps et qu'un doigt doit être classé une fois
// pour toutes. Un pouce qui glisse est un regard ; un pouce qui s'installe
// est un frein ; un pouce qui touche et repart est une désignation.

export function creerEntree(hote, R) {
  const doigts = new Map();
  let regard = 0; // angle réel, lissé
  let vise = 0; // angle demandé par le doigt
  let gyro = 0; // part fournie par le téléphone
  let gyroBase = null;
  let gyroVu = false;
  let gyroRefuse = false;
  let frein = 0;
  const tapes = [];
  let max = R.angleRegardMax;

  const avecGyro = R.regard === "gyro" || R.regard === "hybride";
  const avecDoigtRegard = R.regard === "swipe" || R.regard === "hybride";
  const partGyro = R.regard === "gyro" ? 1 : R.hybridePartGyro;

  const borne = (a) => Math.max(-max, Math.min(max, a));

  // ── Le téléphone ───────────────────────────────────────────────────────
  // On lit `alpha`, la rotation autour de la verticale : c'est le seul axe
  // qui correspond vraiment à « tourner la tête ». Il dérive, mais on ne
  // s'en sert qu'en ÉCART depuis le début de la scène, sur cinq secondes :
  // la dérive n'a pas le temps d'exister.
  // ⚠️ Certains appareils ne donnent pas d'alpha. On retombe alors sur gamma,
  // l'inclinaison latérale, qui est un geste différent mais jouable.
  function surOrientation(e) {
    gyroVu = true;
    const a = e.alpha ?? null;
    const brut = a === null ? (e.gamma ?? 0) : a;
    if (gyroBase === null) gyroBase = brut;
    // Repli de l'écart dans [-180, 180] : sans ça, passer par 0° fait faire
    // un demi-tour instantané à la tête.
    let d = ((brut - gyroBase + 540) % 360) - 180;
    const signe = d < 0 ? -1 : 1;
    const utile = Math.max(0, Math.abs(d) - R.gyroZoneMorte);
    const part = Math.min(1, utile / Math.max(1, R.gyroAmplitude));
    // ⚠️ Le sens : tourner le téléphone vers la DROITE doit faire regarder à
    // droite, et l'angle de regard est NÉGATIF à droite (cf. camera-rig).
    gyro = -signe * part * max * partGyro;
  }

  async function demanderPermission() {
    if (!avecGyro) return "inutile";
    const D = window.DeviceOrientationEvent;
    if (!D) {
      gyroRefuse = true;
      return "absent";
    }
    try {
      if (typeof D.requestPermission === "function") {
        const r = await D.requestPermission();
        if (r !== "granted") {
          gyroRefuse = true;
          return "refuse";
        }
      }
    } catch {
      gyroRefuse = true;
      return "refuse";
    }
    window.addEventListener("deviceorientation", surOrientation, true);
    // 🔴 Un test terrain où le gyroscope ne répond pas et où personne ne le
    // sait produit des chiffres qui ressemblent à des vrais. On le dit.
    setTimeout(() => {
      if (!gyroVu) gyroRefuse = true;
    }, 1600);
    return "ok";
  }

  // ── Les doigts ─────────────────────────────────────────────────────────
  const rect = () => hote.getBoundingClientRect();

  function bas(y) {
    const r = rect();
    return (y - r.top) / Math.max(1, r.height) > 1 - R.bandeauFrein;
  }

  function surAppui(e) {
    hote.setPointerCapture?.(e.pointerId);
    const dansLeBas = bas(e.clientY);
    doigts.set(e.pointerId, {
      x0: e.clientX,
      y0: e.clientY,
      x: e.clientX,
      t: 0,
      bouge: 0,
      // En version « freinBas », un doigt posé dans le bandeau est un frein
      // dès la première image : le geste doit répondre tout de suite, sinon
      // on mesure le temps de réaction de notre code et pas celui de l'élève.
      role: R.action === "freinBas" && dansLeBas ? "frein" : "indecis",
    });
  }

  function surGlisse(e) {
    const d = doigts.get(e.pointerId);
    if (!d) return;
    const dx = e.clientX - d.x;
    d.bouge = Math.max(d.bouge, Math.hypot(e.clientX - d.x0, e.clientY - d.y0));
    d.x = e.clientX;
    if (d.role === "frein") return;
    // Un glissement horizontal franc est un regard, et il le reste.
    if (d.role === "indecis" && d.bouge > 14) {
      const horizontal =
        Math.abs(e.clientX - d.x0) >= Math.abs(e.clientY - d.y0);
      d.role = horizontal && avecDoigtRegard ? "regard" : "rien";
    }
    if (d.role === "regard") vise = borne(vise - dx * R.swipeSensibilite);
  }

  function surLache(e) {
    const d = doigts.get(e.pointerId);
    doigts.delete(e.pointerId);
    if (!d) return;
    // Un appui court et immobile est une désignation. Elle n'est lue que par
    // la version qui s'en sert, mais on la remonte toujours : savoir que des
    // élèves tapent l'écran dans les autres versions est une donnée.
    if (d.role !== "regard" && d.t < 0.28 && d.bouge < 12)
      tapes.push({ x: d.x0, y: d.y0 });
  }

  hote.addEventListener("pointerdown", surAppui);
  hote.addEventListener("pointermove", surGlisse);
  hote.addEventListener("pointerup", surLache);
  hote.addEventListener("pointercancel", surLache);

  // ── Le clavier, pour régler au bureau ──────────────────────────────────
  // Ce n'est pas une version testée : c'est l'outil qui permet de rejouer une
  // scène cent fois en réglant une distance, sans téléphone sous la main.
  const touches = new Set();
  const bas_ = (e) => touches.add(e.code);
  const haut_ = (e) => touches.delete(e.code);
  window.addEventListener("keydown", bas_);
  window.addEventListener("keyup", haut_);

  return {
    demanderPermission,
    get gyroIndisponible() {
      return avecGyro && gyroRefuse;
    },
    get methode() {
      return R.regard;
    },

    // Au début de chaque scène : la tête revient droite et le téléphone
    // reprend son zéro là où l'élève le tient VRAIMENT, pas là où il le
    // tenait à la scène précédente.
    zero(angleMax = R.angleRegardMax) {
      max = angleMax;
      regard = vise = gyro = 0;
      gyroBase = null;
      frein = 0;
      doigts.clear();
      tapes.length = 0;
    },

    lire(dt) {
      // Les rôles indécis se décident avec le temps : un doigt qui reste
      // posé sans glisser devient un frein, en version « maintien ».
      let freinDemande = 0;
      for (const d of doigts.values()) {
        d.t += dt;
        if (
          d.role === "indecis" &&
          R.action === "maintien" &&
          d.t > R.maintienDelai &&
          d.bouge < R.maintienTolerance
        )
          d.role = "frein";
        if (d.role === "frein") freinDemande = R.freinageMaintien;
      }

      if (touches.has("KeyS") || touches.has("ArrowDown")) freinDemande = 1;
      // ⚠️ Le clavier TIENT une position, il ne rampe pas sans fin. Une rampe
      // traverse l'angle où l'information se trouve en deux dixièmes de
      // seconde, donc sous le seuil d'observation : le banc d'essai concluait
      // que « regarder ne sert à rien », ce qui était un défaut de l'outil.
      let auClavier = true;
      if (touches.has("KeyQ") || touches.has("ArrowLeft")) vise = borne(0.72);
      else if (touches.has("KeyD") || touches.has("ArrowRight"))
        vise = borne(-0.72);
      else if (touches.has("KeyA")) vise = borne(max);
      else if (touches.has("KeyE")) vise = borne(-max);
      else auClavier = false;

      // Le rappel au centre. À 0 la tête reste où on l'a laissée, ce qui est
      // confortable et faux : personne ne roule la tête tournée. C'est un des
      // réglages que le terrain doit trancher.
      if (!doigts.size && !auClavier && R.rappelRegard > 0)
        vise += (0 - vise) * Math.min(1, dt * R.rappelRegard);

      const cible = borne(vise + (avecGyro ? gyro : 0));
      regard += (cible - regard) * Math.min(1, dt * R.lissageRegard);
      frein = freinDemande;

      const sortis = tapes.splice(0, tapes.length);
      return { regard, ralentir: frein, tapes: sortis };
    },

    detruire() {
      hote.removeEventListener("pointerdown", surAppui);
      hote.removeEventListener("pointermove", surGlisse);
      hote.removeEventListener("pointerup", surLache);
      hote.removeEventListener("pointercancel", surLache);
      window.removeEventListener("keydown", bas_);
      window.removeEventListener("keyup", haut_);
      window.removeEventListener("deviceorientation", surOrientation, true);
    },
  };
}
