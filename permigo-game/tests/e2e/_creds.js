/**
 * Identifiants de test e2e — centralisés.
 *
 * Comptes de test réels (overridables par variables d'env) :
 *   Élève      : eleve@test.fr      / Autopilot2025!
 *   Enseignant : enseignant@test.fr / Autopilot2025!
 */
export const ELEVE = {
  email: process.env.E2E_ELEVE_EMAIL || "eleve@test.fr",
  pwd: process.env.E2E_PWD || "Autopilot2025!",
};

export const ENSEIGNANT = {
  email: process.env.E2E_ENSEIGNANT_EMAIL || "enseignant@test.fr",
  pwd: process.env.E2E_PWD || "Autopilot2025!",
};
