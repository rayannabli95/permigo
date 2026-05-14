import { defineConfig } from 'vite';
import path from 'path';

// Pour GitHub Pages : base = '/permigo-v7/' en prod, '/' en dev
// Override possible via env var VITE_BASE (utile si renommage du repo)
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
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
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
