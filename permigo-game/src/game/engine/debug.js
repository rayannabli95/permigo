// Le mode développeur. Sans lui, construire les situations suivantes se fait
// à l'aveugle : on ne voit ni les zones, ni les chemins, ni ce que le moteur
// a détecté. Il s'active avec la touche H, ou avec ?debug=1 dans l'URL.

export function creerDebug(THREE, monde, hote) {
  const groupe = new THREE.Group();
  groupe.visible = false;
  monde.scene.add(groupe);

  const hud = document.createElement("pre");
  hud.className = "g3-debug";
  hud.style.cssText =
    "position:absolute;left:8px;top:8px;margin:0;z-index:9;font:11px/1.45 ui-monospace,monospace;" +
    "color:#9dffc8;background:rgba(8,6,22,.72);padding:8px 10px;border-radius:8px;" +
    "pointer-events:none;white-space:pre;display:none;max-width:60%";
  hote.appendChild(hud);

  let actif = false;
  const fps = [];

  function dessinerZones(zones) {
    for (const z of zones.liste) {
      const geo = new THREE.BoxGeometry(z.l, 2.6, z.p);
      const couleur =
        z.role === "danger"
          ? 0xff4d6d
          : z.role === "observation"
            ? 0x4dd2ff
            : z.role === "decision"
              ? 0xffd24d
              : z.role === "succes"
                ? 0x6dff9a
                : 0x9a8cff;
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          color: couleur,
          transparent: true,
          opacity: 0.1,
        }),
      );
      m.position.set(z.x, 1.3, z.z);
      groupe.add(m);
      const fil = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: couleur }),
      );
      fil.position.copy(m.position);
      groupe.add(fil);
      m.userData.zone = z;
      m.userData.base = couleur;
    }
  }

  function dessinerChemins(acteurs) {
    for (const a of acteurs) {
      if (!a.chemin?.length) continue;
      const pts = a.chemin.map(([x, z]) => new THREE.Vector3(x, 0.6, z));
      groupe.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0xffb14d }),
        ),
      );
      for (const p of pts) {
        const b = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 8, 6),
          new THREE.MeshBasicMaterial({ color: 0xffb14d }),
        );
        b.position.copy(p);
        groupe.add(b);
      }
    }
  }

  function dessinerBoite(v, couleur) {
    const geo = new THREE.BoxGeometry(v.largeur, 1.6, v.longueur);
    const fil = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: couleur }),
    );
    groupe.add(fil);
    return fil;
  }

  return {
    groupe,
    get actif() {
      return actif;
    },
    basculer(v) {
      actif = v === undefined ? !actif : v;
      groupe.visible = actif;
      hud.style.display = actif ? "block" : "none";
      return actif;
    },
    dessinerZones,
    dessinerChemins,
    dessinerBoite,

    maj(dt, infos) {
      fps.push(1 / Math.max(dt, 0.001));
      if (fps.length > 60) fps.shift();
      if (!actif) return;
      const moy = fps.reduce((a, b) => a + b, 0) / fps.length;
      hud.textContent = [
        `fps    ${moy.toFixed(0)}   vue ${infos.vue}`,
        `pos    x ${infos.v.x.toFixed(2)}  z ${infos.v.z.toFixed(2)}`,
        `cap    ${((infos.v.cap * 180) / Math.PI).toFixed(1)}°  braquage ${((infos.v.braquage * 180) / Math.PI).toFixed(1)}°`,
        `vit    ${infos.v.kmh.toFixed(1)} km/h   regard ${((infos.rig.regard * 180) / Math.PI).toFixed(0)}°`,
        `zones  ${
          infos.zones.liste
            .filter((z) => z.dedans)
            .map((z) => z.id)
            .join(" ") || "—"
        }`,
        `npc    ${infos.acteurs.map((a) => `${a.id}:${(a.v.vitesse * 3.6).toFixed(0)}`).join("  ") || "—"}`,
        `etat   ${infos.etat}`,
        infos.evts
          .slice(-5)
          .map((e) => `  · ${e}`)
          .join("\n"),
      ].join("\n");
    },

    detruire() {
      hud.remove();
      monde.scene.remove(groupe);
    },
  };
}
