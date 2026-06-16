// ═══════════════════════════════════════════════════════════════
// eleve-recovery — le moniteur déclenche l'envoi d'un email de récupération
// d'accès À L'ÉLÈVE (il ne voit jamais le lien). Toute la sécurité est dans
// l'edge function `eleve-recovery` (service role) : elle vérifie que l'appelant
// est enseignant/gérant et que l'élève appartient bien à son école.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";

/**
 * Déclenche l'envoi d'un email de connexion/réinitialisation à l'élève.
 * @param {string} eleveId profiles.id de l'élève
 * @returns {Promise<boolean>} true si l'envoi est parti
 */
export async function triggerEleveRecovery(eleveId) {
  try {
    const { data, error } = await sb.functions.invoke("eleve-recovery", {
      body: { eleve_id: eleveId },
    });
    if (error) {
      console.error("[eleve-recovery]", error);
      return false;
    }
    return data?.ok === true;
  } catch (e) {
    console.error("[eleve-recovery]", e);
    return false;
  }
}
