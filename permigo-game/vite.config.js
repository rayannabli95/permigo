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
