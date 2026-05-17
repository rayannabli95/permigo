import { defineConfig } from 'vite';
import path from 'path';

// Base : / par défaut (Vercel). Override possible via VITE_BASE.
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Force les bonnes valeurs Supabase (override env vars Vercel obsolètes).
  // Le anon key est public par design (côté client), donc safe à hardcoder.
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://arrfmdagdqtrtfbhxlty.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycmZtZGFnZHF0cnRmYmh4bHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTI5OTYsImV4cCI6MjA5NDQ2ODk5Nn0.E_X_1udLyqKUyBwaaAZ2702yBJFTmzRsh07POvHriWw'),
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
