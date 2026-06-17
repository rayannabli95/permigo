# 🌙 Night Run — Chantier SEO (2026-06-18)

**Start** : nuit du 2026-06-18. User (Rayan) dort. Consigne : « occupe-toi de tout ce que tu peux, gros chantier » à partir d'une arborescence SEO transmise via Twitter.

**Cadrage** : la consigne redirige la nuit vers le **SEO de contenu**. Je garde la discipline NIGHT_RUN (autonomie, log, build, report, commit+push+PR) mais le travail = bâtir la machine SEO décrite dans `docs/SEO_STRATEGY.md`.

## État initial
- Branche : `feat/seo-static-content` (créée depuis `feat/ligue-revision-enchainement`).
- App = SPA hash-router, contenu `innerHTML`, rewrite catch-all → 1 seule URL indexable. **Verrou SEO #1.**
- Actif dormant : `src/data/centres-examen.js` = **6 centres IDF déjà rédigés** (Cergy, Argenteuil, Bobigny, Créteil, Nanterre, Trappes), contenu 100 % original.
- Meta home = « pour les auto-écoles » → **hors-cap** (cible = moniteur indé).

## Plan (autonome, options safe + polish)
1. **Couche de contenu statique pré-rendue** (SSG sans framework) : `scripts/build-seo.mjs` qui écrit du vrai HTML indexable dans `dist/` après `vite build`.
   - `/centres-examen/` (hub) + `/centres-examen/{slug}/` ×6 (depuis les données existantes).
   - `/guides/` (hub) + 4 guides élève evergreen (contenu original, faits vérifiés).
   - `/pour-moniteurs/` (pilier money, reprend la copy GTM validée par Rayan).
   - `sitemap.xml` régénéré avec toutes les URLs.
2. **Quick wins** `index.html` : meta recentrée (réutilise la promesse GTM) + JSON-LD (Organization + SoftwareApplication + FAQPage).
3. Câbler `package.json` (`build` = `vite build && node scripts/build-seo.mjs`).
4. Build + vérif `dist/`. Lint (no-op) OK.
5. Report + commit + push + PR.

## Garde-fous respectés
- ❌ Aucune modif DB. ❌ Aucun nouveau positionnement (j'aligne sur le cap déjà verrouillé en réutilisant la copy GTM existante — à relire par Rayan).
- ✅ Contenu 100 % original, faits permis vérifiés (code 40Q/35 ✓, pratique ~32min ✓, /31 seuil 20 ✓).
- ✅ HTML échappé dans le générateur. Mobile-first, charte indigo #6366f1 / fond #0a0d1a.
- ✅ Pas de page thin/doorway : chaque page a une vraie valeur unique.

## Journal
- [x] Branche + log créés.
