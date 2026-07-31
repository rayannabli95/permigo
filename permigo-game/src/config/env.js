/**
 * Centralise la lecture des variables d'environnement.
 * Côté frontend (Vite) → import.meta.env.VITE_*
 * Côté backend (Node)   → process.env.*
 */

const isBrowser = typeof window !== 'undefined';

function getEnv(key, fallback = undefined) {
  if (isBrowser) {
    return import.meta.env[`VITE_${key}`] ?? fallback;
  }
  return process.env[key] ?? fallback;
}

export const env = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  SUPABASE_URL: getEnv('SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnv('SUPABASE_ANON_KEY'),
  API_URL: getEnv('API_URL', 'http://localhost:3001'),
  DATABASE_URL: getEnv('DATABASE_URL', 'file:./dev.db'),
  TURNSTILE_SITEKEY: getEnv('TURNSTILE_SITEKEY', ''), // Cloudflare Turnstile (optionnel)
  META_PIXEL_ID: getEnv('META_PIXEL_ID', ''), // Pixel Facebook/Instagram — vide = mesure pub désactivée
  IS_PROD: getEnv('NODE_ENV') === 'production',
  IS_BROWSER: isBrowser,
};

// Validation minimale au boot
if (isBrowser && !env.SUPABASE_URL) {
  console.error('[env] VITE_SUPABASE_URL manquante — login désactivé.');
}
