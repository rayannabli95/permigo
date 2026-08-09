// L'instrumentation. Tout ce qu'un élève fait est enregistré, et rien n'est
// envoyé nulle part.
//
// 🔴 Le test terrain se fait sur un téléphone posé sur une table, souvent sans
// réseau, sans compte et sans consentement à recueillir. Tout vit donc EN
// LOCAL, et on exporte un fichier par élève à la fin. La table Supabase
// viendra quand le banc d'essai aura prouvé quelque chose, pas avant.
//
// ⚠️ Un identifiant de session est un nombre tiré au sort. Il n'y a pas de
// nom, pas d'e-mail, pas d'adresse. Un prénom saisi par l'observateur reste
// dans son carnet, pas ici.

const BASE = "permigo-slice";
const TABLE = "essais";

let bdd = null;
async function ouvrir() {
  if (bdd) return bdd;
  if (!("indexedDB" in window)) return null;
  bdd = await new Promise((ok) => {
    let d;
    try {
      d = indexedDB.open(BASE, 1);
    } catch {
      return ok(null);
    }
    d.onupgradeneeded = () => {
      const b = d.result;
      if (!b.objectStoreNames.contains(TABLE))
        b.createObjectStore(TABLE, { keyPath: "cle", autoIncrement: true });
    };
    d.onsuccess = () => ok(d.result);
    d.onerror = () => ok(null);
  });
  return bdd;
}

async function ajouter(enregistrement) {
  const b = await ouvrir();
  if (!b) return false;
  return new Promise((ok) => {
    try {
      const tx = b.transaction(TABLE, "readwrite");
      tx.objectStore(TABLE).add(enregistrement);
      tx.oncomplete = () => ok(true);
      tx.onerror = () => ok(false);
    } catch {
      ok(false);
    }
  });
}

export async function toutLire() {
  const b = await ouvrir();
  if (!b) return [];
  return new Promise((ok) => {
    try {
      const r = b.transaction(TABLE, "readonly").objectStore(TABLE).getAll();
      r.onsuccess = () => ok(r.result || []);
      r.onerror = () => ok([]);
    } catch {
      ok([]);
    }
  });
}

export async function toutEffacer() {
  const b = await ouvrir();
  if (!b) return;
  try {
    b.transaction(TABLE, "readwrite").objectStore(TABLE).clear();
  } catch {
    /* rien à faire */
  }
}

// ─────────────────────────────────────────────────────────────────────────

export function creerJournal(reglages) {
  // ⚠️ Pas de Date.now() dans une valeur qui sert à comparer deux élèves :
  // l'horloge sert seulement à ranger les essais dans l'ordre.
  const session = `s${Math.random().toString(36).slice(2, 8)}`;
  const debut = Date.now();
  const essais = [];
  // Combien de fois cet élève a déjà rencontré CETTE compétence. C'est ça,
  // l'exposition, pas le numéro de la manche.
  const expositions = new Map();

  return {
    session,
    get essais() {
      return essais;
    },

    exposition(famille) {
      return (expositions.get(famille) || 0) + 1;
    },

    // Un essai = une scène jouée. Appelé une fois, à la fin de la scène.
    async noter(essai) {
      const famille = essai.famille;
      const n = (expositions.get(famille) || 0) + 1;
      expositions.set(famille, n);
      const complet = {
        session,
        version: `${reglages.regard}-${reglages.action}-${reglages.retour}`,
        reglages: {
          regard: reglages.regard,
          action: reglages.action,
          retour: reglages.retour,
          seuilObservationInitial: reglages.seuilObservationInitial,
          angleRegardMax: reglages.angleRegardMax,
        },
        exposition: n,
        ordre: essais.length + 1,
        horodatage: Date.now() - debut,
        ...essai,
      };
      essais.push(complet);
      await ajouter(complet);
      return complet;
    },

    // Les chiffres qu'on regarde vraiment. Aucun n'est affiché au joueur.
    bilan() {
      return calculer(essais, reglages);
    },

    fichier() {
      return {
        session,
        version: `${reglages.regard}-${reglages.action}-${reglages.retour}`,
        reglages,
        bilan: calculer(essais, reglages),
        essais,
      };
    },
  };
}

const mediane = (xs) => {
  const l = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!l.length) return null;
  const m = l.length >> 1;
  return l.length % 2 ? l[m] : (l[m - 1] + l[m]) / 2;
};

export function calculer(essais, R) {
  const utiles = essais.filter((e) => e.verdict);

  // ⭐⭐⭐ Le seul chiffre qui prouve que le moteur enseigne : la marge
  // d'anticipation gagnée entre la 1re et la 2e rencontre d'une compétence.
  // Il se calcule par famille, sinon on compare des scènes qui n'ont pas la
  // même chronologie.
  const deltas = [];
  const parFamille = {};
  for (const e of utiles) {
    (parFamille[e.famille] ||= []).push(e);
  }
  for (const [famille, liste] of Object.entries(parFamille)) {
    const par = new Map(liste.map((e) => [e.exposition, e]));
    const a = par.get(1)?.verdict?.marge;
    const b = par.get(2)?.verdict?.marge;
    if (Number.isFinite(a) && Number.isFinite(b))
      deltas.push({ famille, delta: b - a, exp1: a, exp2: b });
  }

  const avecDanger = utiles.filter((e) => e.verdict.evident !== null);
  const precoce = avecDanger.filter((e) => e.verdict.vu).length;
  const fausses = utiles.filter((e) => e.attendu === "continuer");
  const freinsSteriles = fausses.filter((e) => e.mesures.aRalenti).length;
  const transferts = utiles.filter((e) => e.transfert);

  return {
    scenes: utiles.length,
    // Le chiffre nord, toutes scènes confondues.
    margeMediane: mediane(utiles.map((e) => e.verdict.marge)),
    deltaExposition: deltas,
    deltaMedian: mediane(deltas.map((d) => d.delta)),
    deltaAtteint:
      mediane(deltas.map((d) => d.delta)) >= R.deltaExpositionAttendu,

    // Regarde-t-il, ou réagit-il ?
    decouvertePrecoce: avecDanger.length ? precoce / avecDanger.length : null,
    // Le métronome : du regard dépensé là où il n'y avait rien.
    balayageSterile: mediane(utiles.map((e) => e.mesures.balayageSterile)),
    // 🔴 Le garde-fou produit : freine-t-il sur les scènes où il ne se passe
    // rien ? Si ça monte, le jeu enseigne la peur au lieu de la lecture.
    freinageSterile: fausses.length ? freinsSteriles / fausses.length : null,
    freinageSterileOk: fausses.length
      ? freinsSteriles / fausses.length <= R.freinageSterileMax
      : null,

    // L'envie, mesurée et pas déclarée : on ne propose jamais de rejouer.
    rejeuSpontane: utiles.filter((e) => e.apres?.rejoueImmediatement).length,
    delaiEncoreMedian: mediane(utiles.map((e) => e.apres?.delaiAvantEncore)),

    // ⭐⭐⭐ Le transfert. Une scène jamais vue : a-t-il cherché AVANT qu'un
    // indice lui soit présenté ? C'est la seule mesure qui sépare la mémoire
    // (« la dernière fois il y avait une voiture derrière la camionnette »)
    // de l'apprentissage (« quand je ne vois pas, je cherche »).
    transfert: transferts.length
      ? {
          scenes: transferts.length,
          vu: transferts.filter((e) => e.verdict.vu).length,
          margeMediane: mediane(transferts.map((e) => e.verdict.marge)),
          premierRegardMedian: mediane(
            transferts.map((e) => e.mesures.premierBalayage),
          ),
        }
      : null,

    verdicts: utiles.reduce((acc, e) => {
      acc[e.verdict.cas] = (acc[e.verdict.cas] || 0) + 1;
      return acc;
    }, {}),
  };
}

export function telecharger(objet, nom) {
  const blob = new Blob([JSON.stringify(objet, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nom;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
