# 🌙 Night Run — Report SEO (2026-06-18)

**Durée** : ~1 session autonome. **Branche** : `feat/seo-static-content`. **Aucun merge auto** (PR ouverte, à relire au réveil).

## Ce qui a été fait

### 1. Verrou technique levé — couche de contenu statique (SSG)
L'app étant un SPA hash-router (1 seule URL indexable), j'ai ajouté un générateur statique qui écrit de **vraies pages HTML** dans `dist/` **après** `vite build`, sans toucher au SPA.
- `scripts/build-seo.mjs` — lit les données, génère 13 pages + `sitemap.xml`.
- `package.json` : `build` = `vite build && node scripts/build-seo.mjs` (+ `build:seo` pour régénérer seul).
- Chaque page : `<title>`/meta/canonical/OG propres, **contenu visible sans JS**, JSON-LD, maillage interne, CTA → `/#/signup`. Mobile-first, charte indigo/dark.

### 2. Contenu généré (13 pages)
- **Pari A — Centres d'examen** : hub `/centres-examen/` + 6 fiches IDF (Cergy, Argenteuil, Bobigny, Créteil, Nanterre, Trappes) depuis `src/data/centres-examen.js` (contenu existant de Rayan).
- **Guides élève** : hub `/guides/` + 4 guides evergreen rédigés cette nuit (réviser le code, examen blanc, fautes éliminatoires, déroulement examen pratique). Faits permis vérifiés (40Q/35, ~32 min, /31 seuil 20).
- **Pari B — Moniteur** : pilier `/pour-moniteurs/` (reprend la copy GTM validée).

### 3. Quick wins SEO (index.html)
- Meta description/keywords/OG/Twitter **recentrées sur le cap** (moniteur indé + élève) — la home disait encore « pour les auto-écoles ».
- JSON-LD `Organization` + `SoftwareApplication` (prix 9,99 €) ajoutés sur la home.

### 4. Docs & mémoire
- `docs/SEO_STRATEGY.md` créé (plan complet, mapping de l'arborescence Twitter) + bloc statut.
- Mémoire projet mise à jour.

## Fichiers touchés
- `scripts/build-seo.mjs` (nouveau)
- `src/data/seo-pages.js` (nouveau — guides + pilier moniteur)
- `package.json` (script build)
- `index.html` (meta + JSON-LD)
- `docs/SEO_STRATEGY.md` (nouveau)

## Vérifications faites
- ✅ `npm run build` passe (build Vite OK + 13 pages générées).
- ✅ Tous les JSON-LD parsent (validés via `JSON.parse`).
- ✅ `vite preview` : `/centres-examen/`, `/centres-examen/cergy/`, `/guides/reviser-le-code/`, `/pour-moniteurs/`, `/sitemap.xml` → **HTTP 200** avec bons titres.
- ✅ Aucune fuite du bundle SPA dans les pages statiques. Contenu visible présent (h1/lead/pièges/FAQ/CTA).
- ✅ Aucune modif DB, aucun nouveau positionnement (alignement cap + copy GTM existante).

## À tester par toi au réveil (checklist)
1. **Relire le wording** : meta home (`index.html`) + page `/pour-moniteurs/` → conforme à ta voix ? (positionnement = ta décision).
2. **Preview Vercel** : ouvrir `…/centres-examen/cergy/` et `…/guides/reviser-le-code/` → ça doit afficher la **page statique**, pas l'app. ⚠️ Si ça charge le SPA, il faudra ajuster le `rewrites` du `vercel.json` actif (Vercel sert normalement le fichier statique avant le rewrite — à confirmer en preview).
3. **Lighthouse / "Inspecter l'URL"** dans Google Search Console sur une page → vérifier l'indexabilité.
4. **Brancher Google Search Console + Bing** et soumettre `sitemap.xml`.
5. Vérifier le rendu mobile d'une fiche centre (esthétique, lisibilité).

## Décisions prises seul (+ raison)
- **SSG découplé plutôt que SSR** : zéro réécriture du SPA, suffisant pour du contenu figé. (cf. doc §1)
- **6 centres IDF seulement** (pas 30 villes inventées) : garde-fou anti-doorway — je n'invente pas de « pièges » sur des centres que je ne connais pas. La machine scale dès que tu ajoutes des données réelles dans `centres-examen.js`.
- **Meta home recentrée** : la version « pour les auto-écoles » contredisait le cap verrouillé ; j'ai réutilisé ta promesse GTM (pas un nouveau positionnement). Reste relisable/réversible.
- **vercel.json non modifié** : Vercel priorise le filesystem sur les rewrites → les fichiers statiques gagnent. Touché à rien pour éviter de casser le SPA. À confirmer en preview.

## Pas fait (et pourquoi)
- **Pages centres hors IDF** : besoin de données réelles (anti-contenu inventé). Prochaine vague.
- **Comparatifs moniteur** (vs Ornikar/EVS) : à écrire, mais positionnement sensible → te laisser valider l'angle d'abord.
- **robots.txt** : déjà correct (autorise tout + pointe le sitemap), pas touché.
