import { defineConfig } from "vite";
import path from "path";
export default defineConfig({
  root: "/private/tmp/permigo-bridge-rename/permigo-game",
  base: "./",
  resolve: { alias: { "@/utils/lang.js": "/private/tmp/labo-stub/lang.js", "@": path.resolve("/private/tmp/permigo-bridge-rename/permigo-game", "src") } },
  build: {
    outDir: "/private/tmp/permigo-bridge-rename/permigo-game/dist-labo",
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: "esbuild",
    rollupOptions: {
      input: "/private/tmp/permigo-bridge-rename/permigo-game/lab/labo/index.html",
      output: { entryFileNames: "labo.js", assetFileNames: "labo.[ext]", inlineDynamicImports: true },
    },
  },
});
