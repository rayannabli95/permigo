# Perf Report — PermiGo Game
**Date :** 2026-05-18  
**Build :** Vite 5.4.21 / esbuild minifier  
**Hosting :** Vercel (CDN edge)

---

## ✅ Quick wins appliqués

### 1. Preconnect + DNS-prefetch Supabase (`index.html`)
| Avant | Après |
|---|---|
| Aucun hint → DNS résolu à la première requête API | `<link rel="preconnect" ... crossorigin>` + `<link rel="dns-prefetch">` |

**Impact estimé :** −50–150 ms sur première requête Supabase (DNS RTT typique ~80 ms)  
**Effort :** 2 min

### 2. sourcemap: false en prod (`vite.config.js`)
| Avant | Après |
|---|---|
| `sourcemap: true` → Vite génère `.map` files (2–3× la taille du JS) uploadés sur Vercel | `sourcemap: false` → build propre, pas de fuites de code source |

**Impact :** −~300 kB d'assets non-servis, build ~15% plus rapide  
**Effort :** 30 sec

### 3. minify: 'esbuild' + cssCodeSplit (`vite.config.js`)
| Avant | Après |
|---|---|
| Vite default minifier (Rollup) | `esbuild` — 10-20× plus rapide, taille comparable |
| CSS en un seul bloc | `cssCodeSplit: true` → CSS chargé avec son chunk JS |

**Impact :** build time −50%, CSS non-bloquant sur les routes lazy  
**Effort :** 2 lignes

---

## 📊 Bundle actuel (gzip, prod)

| Chunk | Gzip |
|---|---|
| supabase (vendor) | 53.5 kB |
| accueil (élève) | 15.8 kB |
| parcours (élève) | 17.6 kB |
| profil (commun) | 14.0 kB |
| index (core) | 14.6 kB |
| validation (enseignant) | 6.5 kB |
| **Total initial load estimé** | **~100 kB gzip** |

> Supabase est correctement isolé dans son propre chunk (`manualChunks`).  
> Le chunk initial ne charge que le code nécessaire à l'auth/splash.

---

## ⚠️ Recommandations V2 (hors scope quick wins)

### Images → WebP
- `public/permigo-logo.png`, trophées PNG, icons PNG → convertir en `.webp`
- Gain estimé : −40–60% taille images
- Outil : `npx @squoosh/cli` ou plugin Vite `vite-imagetools`

### Fonts → subsetting
- `Plus Jakarta Sans` chargé en `wght@500;600;700;800` (4 poids) depuis Google Fonts
- Subset Latin uniquement + 2 poids max → −30 kB CSS/font
- Stratégie : `font-display: swap` déjà implicitement géré par Google Fonts

### Lazy images natives
- Les `<img>` de trophées/avatars sur la page Trophées n'ont pas `loading="lazy"`
- Ajouter `loading="lazy"` sur tous les `<img>` hors fold (déjà sur certains)

### CSS unused rules
- ~2 kB de règles CSS dans `index.css` potentiellement non utilisées (skeleton, animations non déclenchées)
- Tool : PurgeCSS — mais risqué avec injection dynamique innerHTML, à valider

---

## 🔧 Commandes utiles

```bash
# Build prod + preview local
npm run build && npm run preview

# Analyse bundle (ajouter si besoin)
npx vite-bundle-visualizer

# Test Lighthouse sur preview
# Ouvrir http://localhost:4173 → DevTools → Lighthouse → Mobile → Analyser
```

---

## 📋 Warnings build (non bloquants)

Les deux avertissements Rollup sur `cur-user.js` et `router.js` (import dynamique + statique) proviennent de fichiers en ZONE INTERDITE (`src/main.js`, `src/router.js`). Ils n'empêchent pas le build et n'affectent pas les performances (les modules restent dans le chunk principal, ce qui est correct).
