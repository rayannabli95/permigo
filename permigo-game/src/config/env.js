/**
 * Centralise la lecture des variables d'environnement.
 * Côté frontend (Vite) → import.meta.env.VITE_*
 * Côté backend (Node)   → process.env.*
 *
 * ⚠️ CHAQUE CLÉ SE LIT EN ACCÈS STATIQUE, JAMAIS PAR UNE VARIABLE.
 *
 * Ce fichier lisait `import.meta.env[`VITE_${key}`]`. Une clé calculée ne peut
 * pas être remplacée au build : Vite renonce et sérialise TOUT l'objet
 * d'environnement dans le bundle. Or Vercel y injecte automatiquement ses
 * variables système préfixées VITE_, dont VITE_VERCEL_GIT_COMMIT_MESSAGE. Le
 * message de commit complet, le nom de l'auteur et la branche partaient donc
 * dans le JavaScript téléchargé par chaque visiteur.
 *
 * Toute nouvelle variable s'ajoute ici en clair ET dans le `define` de
 * vite.config.js. Sans le define, une clé absente de l'environnement laisse
 * `import.meta.env.VITE_X` dans le code compilé, et l'objet entier revient.
 */

const isBrowser = typeof window !== "undefined";

// Les valeurs du navigateur, chacune remplacée à la compilation.
const BROWSER = {
  NODE_ENV: import.meta.env.VITE_NODE_ENV,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  API_URL: import.meta.env.VITE_API_URL,
  DATABASE_URL: import.meta.env.VITE_DATABASE_URL,
  TURNSTILE_SITEKEY: import.meta.env.VITE_TURNSTILE_SITEKEY,
  META_PIXEL_ID: import.meta.env.VITE_META_PIXEL_ID,
  VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY,
};

function getEnv(key, fallback = undefined) {
  const raw = isBrowser ? BROWSER[key] : process.env[key];
  // Une variable déclarée mais vide vaut absente : Vercel sert "" pour une
  // clé créée sans valeur, et "" doit retomber sur le fallback.
  return raw === undefined || raw === null || raw === "" ? fallback : raw;
}

export const env = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  SUPABASE_URL: getEnv("SUPABASE_URL"),
  SUPABASE_ANON_KEY: getEnv("SUPABASE_ANON_KEY"),
  API_URL: getEnv("API_URL", "http://localhost:3001"),
  DATABASE_URL: getEnv("DATABASE_URL", "file:./dev.db"),
  TURNSTILE_SITEKEY: getEnv("TURNSTILE_SITEKEY", ""), // Cloudflare Turnstile (optionnel)
  META_PIXEL_ID: getEnv("META_PIXEL_ID", ""), // Pixel Facebook/Instagram — vide = mesure pub désactivée
  VAPID_PUBLIC_KEY: getEnv("VAPID_PUBLIC_KEY", ""), // Notifications push
  IS_PROD: getEnv("NODE_ENV") === "production",
  IS_BROWSER: isBrowser,
};

// Validation minimale au boot
if (isBrowser && !env.SUPABASE_URL) {
  console.error("[env] VITE_SUPABASE_URL manquante — login désactivé.");
}
