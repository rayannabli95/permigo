// Collection « En situation » — quelles scènes l'élève a déjà jouées.
// localStorage only (comme le plafond de volants du jeu), clé scopée par
// compte : deux élèves sur le même appareil ont chacun leur collection.
// Consommé par la page du jeu (marquage + récap) et l'accueil (carte
// « Scène du jour » : « Tu en as vu X / N »).

const LS_VUES = "pg-sit-vues-ids"; // { ids: string[] }

function vuesKey(userId) {
  return userId ? `${LS_VUES}:${userId}` : LS_VUES;
}

/** @returns {Set<string>} ids des scènes déjà jouées par ce compte */
export function getScenesVues(userId) {
  try {
    const raw = JSON.parse(localStorage.getItem(vuesKey(userId)) || "null");
    return new Set(Array.isArray(raw?.ids) ? raw.ids : []);
  } catch {
    return new Set();
  }
}

/** Marque une scène comme vue. @returns {Set<string>} la collection à jour */
export function marquerSceneVue(userId, sceneId) {
  const vues = getScenesVues(userId);
  if (vues.has(sceneId)) return vues;
  vues.add(sceneId);
  try {
    localStorage.setItem(vuesKey(userId), JSON.stringify({ ids: [...vues] }));
  } catch {
    /* stockage plein : la partie continue, on retentera à la prochaine */
  }
  return vues;
}
