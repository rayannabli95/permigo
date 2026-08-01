/**
 * La boîte de vitesses de l'élève.
 *
 * Audit du 01/08/2026 : le quiz qui CERTIFIE était écrit pour la boîte
 * manuelle, et l'app ne demandait nulle part quelle voiture l'élève conduit.
 * Sur « Démarrer et s'arrêter », les six questions parlaient de l'embrayage.
 * Un élève en automatique n'a pas cette pédale.
 *
 * On lit donc la boîte, et le moteur de quiz écarte les questions qui ne
 * s'adressent pas à elle.
 *
 * Deux filets, parce que le front ne doit jamais dépendre de l'ordre de
 * déploiement :
 *   - la colonne absente ou illisible → on renvoie null ;
 *   - null → aucun filtre, l'élève voit la banque entière, comme avant.
 * Personne ne se retrouve devant un quiz vide.
 */
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";

export const BOITES = Object.freeze(["manuelle", "auto"]);

/** undefined = jamais lu · null = pas renseignée · sinon la valeur */
let _cache;
/** La colonne n'existe pas encore côté serveur : on cesse de la demander. */
let _indisponible = false;

function valide(v) {
  return BOITES.includes(v) ? v : null;
}

/** Ce qu'on sait sans aller au serveur. */
export function boiteConnue() {
  return valide(_cache);
}

/** Efface le cache (déconnexion, changement de compte). */
export function oublierBoite() {
  _cache = undefined;
}

/**
 * @returns {Promise<'manuelle'|'auto'|null>} null si on ne sait pas.
 */
export async function chargerBoite() {
  if (_cache !== undefined) return valide(_cache);
  if (_indisponible) return null;

  const me = getCurUser();
  if (!me?.id) return null;

  try {
    const { data, error } = await sb
      .from("profiles")
      .select("transmission")
      .eq("id", me.id)
      .maybeSingle();
    if (error) {
      // 42703 = la colonne n'existe pas encore sur ce serveur.
      if (error.code === "42703") _indisponible = true;
      return null;
    }
    _cache = valide(data?.transmission);
    return _cache;
  } catch {
    return null;
  }
}

/**
 * @param {'manuelle'|'auto'} valeur
 * @returns {Promise<boolean>} vrai si le serveur a bien enregistré.
 */
export async function enregistrerBoite(valeur) {
  const v = valide(valeur);
  if (!v) return false;
  const me = getCurUser();
  if (!me?.id) return false;

  // On garde la valeur tout de suite : l'écran suivant doit être juste même
  // si le réseau traîne.
  _cache = v;
  try {
    const { error } = await sb
      .from("profiles")
      .update({ transmission: v })
      .eq("id", me.id);
    if (error) {
      if (error.code === "42703") _indisponible = true;
      console.warn("[transmission] enregistrement", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[transmission] enregistrement", e);
    return false;
  }
}
