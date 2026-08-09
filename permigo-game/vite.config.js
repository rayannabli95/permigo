import { defineConfig, loadEnv } from "vite";
import path from "path";

// Toutes les variables VITE_ que le code lit, en clair. Chacune DOIT figurer
// ici : une clé absente de l'environnement laisserait `import.meta.env.VITE_X`
// dans le code compilé, et Vite y sérialiserait alors l'objet d'environnement
// ENTIER — dont les variables système que Vercel injecte automatiquement
// (VITE_VERCEL_GIT_COMMIT_MESSAGE, l'auteur, la branche…). C'est exactement la
// fuite corrigée le 09/08/2026 : le message de commit complet était lisible
// dans le JavaScript servi à chaque visiteur.
const CLES = [
  "VITE_NODE_ENV",
  "VITE_API_URL",
  "VITE_DATABASE_URL",
  "VITE_TURNSTILE_SITEKEY",
  "VITE_META_PIXEL_ID",
  "VITE_VAPID_PUBLIC_KEY",
];

export default defineConfig(({ mode }) => {
  // Base : / par défaut (Vercel). Override possible via VITE_BASE.
  const base = process.env.VITE_BASE || "/";

  // loadEnv lit les fichiers .env ; process.env porte les variables du tableau
  // de bord Vercel. Les deux sont nécessaires, l'un ne remplace pas l'autre.
  const fichiers = loadEnv(mode, __dirname, "");
  const valeur = (cle) => process.env[cle] ?? fichiers[cle] ?? "";

  const define = {
    // Force les bonnes valeurs Supabase (override env vars Vercel obsolètes).
    // Le anon key est public par design (côté client), donc safe à hardcoder.
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      "https://arrfmdagdqtrtfbhxlty.supabase.co",
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycmZtZGFnZHF0cnRmYmh4bHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTI5OTYsImV4cCI6MjA5NDQ2ODk5Nn0.E_X_1udLyqKUyBwaaAZ2702yBJFTmzRsh07POvHriWw",
    ),
  };
  for (const cle of CLES) {
    define[`import.meta.env.${cle}`] = JSON.stringify(valeur(cle));
  }

  return {
    base,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    define,
    server: {
      port: 5173,
    },
    build: {
      outDir: "dist",
      sourcemap: false, // prod: off (Vercel ne les sert pas, pèse 2-3x le JS)
      minify: "esbuild", // esbuild >> terser en vitesse, comparable en taille
      cssCodeSplit: true, // CSS par chunk → évite un gros bloc bloquant
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            supabase: ["@supabase/supabase-js"],
          },
        },
      },
    },
  };
});
