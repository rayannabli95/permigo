// Les commandes. Elles ne produisent que trois nombres : gaz, freinage,
// volant — plus une intention de regard. Le moteur ne sait pas si ça vient
// d'un clavier ou d'un pouce.
//
// ⚠️ Clavier : on lit `event.code` (position physique de la touche), jamais
// `event.key`. Sur un clavier AZERTY, `key` renvoie « z » pour la touche qui
// est au-dessus de « s », et « q » pour celle de gauche. Avec `code`, ZQSD et
// WASD sont la même chose sans une ligne de plus.
//
//   avancer   W/Z ou ↑        freiner   S ou ↓
//   gauche    A/Q ou ←        droite    D ou →
//   regard    Q… non : A et E ne servent pas au volant en tactile, donc au
//             clavier le regard est sur ↑←→ shift ; voir REGARD ci-dessous.
//   vue       C               debug     H

const REGARD = { KeyQ: "gauche", KeyE: "droite" };

export function creerCommandes(hote, { surTouche } = {}) {
  const etat = { gaz: 0, freinage: 0, volant: 0, regard: "centre" };
  const enfonce = new Set();
  const morts = [];

  // ── Clavier ───────────────────────────────────────────────────────────
  const bas = (e) => {
    if (e.repeat) return;
    enfonce.add(e.code);
    if (REGARD[e.code]) etat.regard = REGARD[e.code];
    if (surTouche) surTouche(e.code);
    if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
  };
  const haut = (e) => {
    enfonce.delete(e.code);
    if (REGARD[e.code] && etat.regard === REGARD[e.code])
      etat.regard = "centre";
  };
  const perdu = () => enfonce.clear();
  addEventListener("keydown", bas, { passive: false });
  addEventListener("keyup", haut);
  addEventListener("blur", perdu);
  morts.push(() => {
    removeEventListener("keydown", bas);
    removeEventListener("keyup", haut);
    removeEventListener("blur", perdu);
  });

  // ── Tactile ───────────────────────────────────────────────────────────
  // Le manche : un pouce qui glisse à gauche/droite. Il revient au centre
  // quand on lâche, comme un vrai volant.
  const tactile = { manche: 0, gaz: false, frein: false };
  let doigtManche = null;
  let doigtRegard = null;
  let regardX0 = 0;

  function brancherManche(el) {
    if (!el) return;
    let x0 = 0;
    const pris = (e) => {
      doigtManche = e.pointerId;
      x0 = e.clientX;
      el.setPointerCapture(e.pointerId);
    };
    const bouge = (e) => {
      if (e.pointerId !== doigtManche) return;
      const r = el.getBoundingClientRect();
      tactile.manche = Math.max(
        -1,
        Math.min(1, (e.clientX - x0) / (r.width * 0.34)),
      );
    };
    const lache = (e) => {
      if (e.pointerId !== doigtManche) return;
      doigtManche = null;
      tactile.manche = 0;
    };
    el.addEventListener("pointerdown", pris);
    el.addEventListener("pointermove", bouge);
    el.addEventListener("pointerup", lache);
    el.addEventListener("pointercancel", lache);
    morts.push(() => {
      el.removeEventListener("pointerdown", pris);
      el.removeEventListener("pointermove", bouge);
      el.removeEventListener("pointerup", lache);
      el.removeEventListener("pointercancel", lache);
    });
  }

  function brancherPedale(el, quoi) {
    if (!el) return;
    const on = (e) => {
      e.preventDefault();
      tactile[quoi] = true;
    };
    const off = () => {
      tactile[quoi] = false;
    };
    el.addEventListener("pointerdown", on);
    el.addEventListener("pointerup", off);
    el.addEventListener("pointerleave", off);
    el.addEventListener("pointercancel", off);
    morts.push(() => {
      el.removeEventListener("pointerdown", on);
      el.removeEventListener("pointerup", off);
      el.removeEventListener("pointerleave", off);
      el.removeEventListener("pointercancel", off);
    });
  }

  // Tourner la tête : on glisse le doigt sur le pare-brise. Relâcher remet
  // le regard devant, comme quand on repose les yeux sur la route.
  function brancherRegard(el) {
    if (!el) return;
    const pris = (e) => {
      if (doigtRegard !== null) return;
      doigtRegard = e.pointerId;
      regardX0 = e.clientX;
    };
    const bouge = (e) => {
      if (e.pointerId !== doigtRegard) return;
      const d =
        (e.clientX - regardX0) / (el.getBoundingClientRect().width * 0.3);
      // Glisser vers la gauche = regarder à droite (on tourne la tête, on ne
      // fait pas glisser une image).
      etat.regard = Math.max(-1.08, Math.min(1.08, -d * 1.08));
    };
    const lache = (e) => {
      if (e.pointerId !== doigtRegard) return;
      doigtRegard = null;
      etat.regard = "centre";
    };
    el.addEventListener("pointerdown", pris);
    el.addEventListener("pointermove", bouge);
    el.addEventListener("pointerup", lache);
    el.addEventListener("pointercancel", lache);
    morts.push(() => {
      el.removeEventListener("pointerdown", pris);
      el.removeEventListener("pointermove", bouge);
      el.removeEventListener("pointerup", lache);
      el.removeEventListener("pointercancel", lache);
    });
  }

  return {
    etat,
    brancherManche,
    brancherPedale,
    brancherRegard,
    estEnfonce: (code) => enfonce.has(code),

    // Appelé une fois par image : fond les deux entrées en un seul état.
    lire(dt) {
      const av = enfonce.has("KeyW") || enfonce.has("ArrowUp");
      const fr = enfonce.has("KeyS") || enfonce.has("ArrowDown");
      const ga = enfonce.has("KeyA") || enfonce.has("ArrowLeft");
      const dr = enfonce.has("KeyD") || enfonce.has("ArrowRight");

      etat.gaz = av || tactile.gaz ? 1 : 0;
      etat.freinage = fr || tactile.frein ? 1 : 0;

      // Le volant se rejoint progressivement même au clavier : une entrée
      // tout-ou-rien donne une trajectoire en escalier.
      const vise = tactile.manche || (ga ? 1 : 0) - (dr ? 1 : 0);
      etat.volant += (vise - etat.volant) * Math.min(1, dt * 8);
      if (Math.abs(etat.volant) < 0.002) etat.volant = 0;
      return etat;
    },

    detruire() {
      morts.forEach((f) => f());
    },
  };
}
