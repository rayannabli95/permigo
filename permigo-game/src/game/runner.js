// Le moteur de scénarios. C'est ici que « ce que l'élève fait » devient une
// évaluation. Un scénario n'est que de la DONNÉE : le runner l'installe, le
// joue, l'observe et rend un verdict.
//
// Le verdict a exactement la forme que la page attendait déjà du quiz
// (`{ ok, tags }`), pour se rebrancher sans toucher à la progression PermiGo :
// recordAnswer, marquerSceneVue, addGemmes.
//
// ⚠️ Three.js est importé DYNAMIQUEMENT. Il ne doit jamais entrer dans le
// bundle principal : personne ne paie 600 Ko pour ouvrir son accueil.

import { creerMonde } from "./engine/world.js";
import { creerVehicule, seTouchent } from "./engine/vehicle.js";
import { creerRig, VUES } from "./engine/camera-rig.js";
import { creerCommandes } from "./engine/controls.js";
import { creerZones } from "./engine/zones.js";
import { creerActeur } from "./engine/npc.js";
import { creerDebug } from "./engine/debug.js";
import * as CARREFOUR from "./environments/carrefour.js";

const ENVIRONNEMENTS = { carrefour: CARREFOUR };

// Un regard compte à partir de 30° : en dessous, on n'a pas tourné la tête,
// on a juste bougé les yeux vers le bord du pare-brise.
const REGARD_MIN = 0.52;

// De la plus grave à la moins grave. Sert à choisir CE QU'ON RACONTE à la fin :
// « tu arrives trop vite » sonne creux quand il y a eu un choc juste après.
const GRAVITE = [
  "collision",
  "refus_priorite",
  "pas_arrete",
  "pas_regarde_droite",
  "pas_regarde_gauche",
  "trop_vite",
  "hors_route",
  "trop_long",
];
const gravite = (f) => {
  const i = GRAVITE.indexOf(f);
  return i === -1 ? GRAVITE.length : i;
};

export async function lancerScenario(
  hote,
  scenario,
  { debug = false, sur = () => {} } = {},
) {
  const THREE = await import("three");
  const monde = creerMonde(THREE, hote, {
    qualite: scenario.qualite || "auto",
  });
  const env = ENVIRONNEMENTS[scenario.environnement] || CARREFOUR;
  const { kit, groupe } = env.construire(THREE, scenario.decor || {});
  monde.scene.add(groupe);

  // ── Le joueur ────────────────────────────────────────────────────────
  const bJ = scenario.joueur?.branche || "S";
  const d0 = scenario.joueur?.recul ?? 46;
  const [px, pz] = env.point(bJ, d0);
  const v = creerVehicule({
    x: px,
    z: pz,
    cap: env.CAP_ENTREE[bJ],
    vitesse: scenario.joueur?.vitesse ?? 11,
    vitesseMax: scenario.joueur?.vitesseMax ?? 16,
  });
  // Deux corps pour la même voiture : la carrosserie (vue de dehors) et le
  // poste de conduite (vu de dedans). On n'affiche jamais les deux : à la
  // place du conducteur, la caméra est À L'INTÉRIEUR du bloc de carrosserie
  // et l'écran devient un aplat violet.
  const mailleJoueur = kit.vehicule("voiture", "violet");
  const posteJoueur = kit.poste("violet");
  monde.scene.add(mailleJoueur, posteJoueur);

  // ── Le trafic ────────────────────────────────────────────────────────
  const acteurs = (scenario.acteurs || []).map((a) => {
    const chemin = a.chemin
      ? a.chemin
      : cheminBranche(env, a.de, a.vers || env.oppose(a.de), a.recul ?? 60);
    const ac = creerActeur({ ...a, chemin });
    ac.maille = kit.vehicule(a.type || "voiture", a.couleur || "gris");
    monde.scene.add(ac.maille);
    return ac;
  });

  // ── Les zones ────────────────────────────────────────────────────────
  const zones = creerZones([
    ...env.zonesCarrefour(bJ),
    ...(scenario.zones || []),
  ]);

  const rig = creerRig(THREE, monde.camera);
  const dbg = creerDebug(THREE, monde, hote);
  dbg.dessinerZones(zones);
  dbg.dessinerChemins(acteurs);
  const boiteJoueur = dbg.dessinerBoite(v, 0x7c5cff);
  const boitesNpc = acteurs.map((a) => dbg.dessinerBoite(a.v, 0xff9a4d));
  if (debug) dbg.basculer(true);

  const cmd = creerCommandes(hote, {
    surTouche: (code) => {
      if (code === "KeyH") dbg.basculer();
      if (code === "KeyC") sur("vue", rig.changerVue());
    },
  });

  // ── L'état du scénario ───────────────────────────────────────────────
  const etat = {
    phase: "roule", // roule → fini
    fautes: [], // dans l'ordre où elles arrivent
    chrono: 0,
    journal: [],
    verdict: null,
  };
  const noter = (t) => {
    etat.journal.push(`${etat.chrono.toFixed(1)}s ${t}`);
  };
  const fauter = (code) => {
    if (etat.fautes.includes(code)) return;
    etat.fautes.push(code);
    noter(`faute ${code}`);
    sur("faute", code);
  };

  // 🔴 Le regard ne se juge PAS dans une boîte. Un élève qui s'arrête dix
  // mètres trop tôt et qui tourne la tête a fait exactement ce qu'il fallait ;
  // la première version le comptait comme « n'a pas regardé ». On retient
  // donc le regard partout sur les 26 derniers mètres avant le carrefour.
  const OBSERVE_A = 26;
  const observe = { droite: false, gauche: false };

  const attendu = scenario.attendu || "ceder";
  const observation = scenario.observation || null; // 'droite' | 'gauche' | null
  const vitesseSure = scenario.vitesseSure ?? 7; // m/s dans la zone de décision

  // « Le conflit » : un acteur prioritaire est-il en train d'arriver ?
  const prioritaires = acteurs.filter((a) => a.prioritaire !== false);
  function conflit() {
    return prioritaires.some((a) => {
      if (a.fini || a.attente > 0) return false;
      const d = Math.hypot(a.x, a.z);
      return d < 16 && a.v.vitesse > 0.8;
    });
  }

  function terminer(ok, code) {
    if (etat.phase === "fini") return;
    etat.phase = "fini";
    if (code) fauter(code);
    etat.verdict = {
      ok: ok && etat.fautes.length === 0,
      fautes: etat.fautes.slice(),
      // La faute qu'on RACONTE n'est pas la première dans le temps mais la
      // plus grave : « tu arrives trop vite » sonne creux quand il y a eu un
      // choc deux secondes plus tard.
      principale:
        [...etat.fautes].sort((a, b) => gravite(a) - gravite(b))[0] || null,
      tags: scenario.tags || [],
      chrono: etat.chrono,
      vitesseCarrefour: (zones.get("carrefour")?.vitesseEntree ?? 0) * 3.6,
      regarde: { ...observe },
      journal: etat.journal.slice(),
    };
    noter(etat.verdict.ok ? "réussi" : "échoué");
    sur("fin", etat.verdict);
  }

  // ── La boucle ────────────────────────────────────────────────────────
  monde.demarrer((dt) => {
    const fige = etat.phase === "fini";
    etat.chrono += fige ? 0 : dt;

    const e = cmd.lire(dt);
    rig.regarder(fige ? "centre" : e.regard);

    if (!fige) {
      // Hors chaussée, ça freine tout seul : un trottoir n'est pas un raccourci.
      const dehors = env.surRoute && !env.surRoute(v.x, v.z);
      v.avancer(
        dt,
        dehors ? { ...e, gaz: 0, freinage: Math.max(e.freinage, 0.45) } : e,
      );
      // La voiture ne sort pas du monde : au-delà, on arrête la manche.
      if (Math.hypot(v.x, v.z) > 120) terminer(false, "hors_route");
    }

    for (const a of acteurs) {
      if (!fige) {
        // Un acteur qui « évite » freine si le joueur lui coupe la route.
        a.arrete =
          a.evite &&
          zones.get("carrefour")?.contient(v.x, v.z) &&
          Math.hypot(a.x - v.x, a.z - v.z) < 22;
        a.maj(dt);
      }
      a.maille.position.set(a.x, 0, a.z);
      a.maille.rotation.y = a.cap;
    }

    for (const m of [mailleJoueur, posteJoueur]) {
      m.position.set(v.x, 0, v.z);
      m.rotation.y = v.cap;
    }
    const dedans = rig.vue === "conduite";
    mailleJoueur.visible = !dedans;
    posteJoueur.visible = dedans;
    // Le volant suit le braquage réel des roues, multiplié par la démultipli-
    // cation d'une direction de série (un tour et demi de butée à butée).
    posteJoueur.userData.volant.rotation.z = v.braquage * 2.6;

    monde.majOmbres(v.x, v.z);
    rig.maj(dt, v);

    if (!fige) {
      if (Math.hypot(v.x, v.z) < OBSERVE_A) {
        if (rig.regardDroite > REGARD_MIN) observe.droite = true;
        if (rig.regardGauche > REGARD_MIN) observe.gauche = true;
      }
      const evts = zones.maj(dt, v, rig);
      for (const { zone, type } of evts) {
        if (type !== "entree") continue;
        noter(`entre dans ${zone.id} à ${(v.vitesse * 3.6).toFixed(0)} km/h`);
        sur("zone", { id: zone.id, role: zone.role, kmh: v.vitesse * 3.6 });

        if (zone.id === "carrefour") {
          // La vitesse qui compte est celle à laquelle on ENTRE dans le
          // carrefour, pas celle de la zone d'avant : freiner au dernier
          // moment reste une bonne décision, arriver lancé n'en est pas une.
          if (v.vitesse > vitesseSure) fauter("trop_vite");
          if (observation && !observe[observation])
            fauter(`pas_regarde_${observation}`);
          if (attendu === "ceder" && conflit()) fauter("refus_priorite");
          if (
            attendu === "arret" &&
            (zones.get("decision")?.vitesseMin ?? 9) > 0.4
          )
            fauter("pas_arrete");
        }
        if (zone.id === "degage") terminer(true);
      }

      // Le choc : c'est la seule chose qui arrête tout net.
      for (const a of acteurs) {
        if (a.fini || a.attente > 0) continue;
        if (seTouchent(v, a.v)) {
          v.vitesse = 0;
          a.v.vitesse = 0;
          terminer(false, "collision");
          break;
        }
      }

      // Garde-fou : une manche ne dure pas éternellement.
      if (etat.chrono > (scenario.duree ?? 75)) terminer(false, "trop_long");
    }

    // Boîtes de collision du mode debug.
    if (dbg.actif) {
      boiteJoueur.position.set(v.x, 0.8, v.z);
      boiteJoueur.rotation.y = v.cap;
      acteurs.forEach((a, i) => {
        boitesNpc[i].position.set(a.x, 0.8, a.z);
        boitesNpc[i].rotation.y = a.cap;
      });
    }

    dbg.maj(dt, {
      v,
      rig,
      zones,
      acteurs,
      vue: rig.vue,
      etat:
        etat.phase + (etat.fautes.length ? ` · ${etat.fautes.join(",")}` : ""),
      evts: etat.journal,
    });

    sur("image", { kmh: v.kmh, phase: etat.phase, regard: rig.regard });
  });

  return {
    monde,
    cmd,
    rig,
    dbg,
    zones,
    acteurs,
    v,
    etat,
    VUES,
    changerVue: (x) => rig.changerVue(x),
    detruire() {
      cmd.detruire();
      dbg.detruire();
      monde.detruire();
    },
  };
}

// Un chemin standard : on arrive par une branche, on repart par une autre.
// Le point du milieu est le centre du carrefour, ce qui suffit à faire une
// trajectoire ronde avec la poursuite pure du NPC.
function cheminBranche(env, de, vers, recul = 60) {
  const entree = env.point(de, recul);
  const seuil = env.point(de, 8);
  const fin = env.sortie(vers, 60);
  return de === env.oppose(vers)
    ? [entree, seuil, fin]
    : [entree, seuil, [0, 0], env.sortie(vers, 10), fin];
}
