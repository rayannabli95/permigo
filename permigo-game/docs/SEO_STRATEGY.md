# SEO / GEO — Stratégie Permigo

*Rédigé le 2026-06-18. Traduction de l'arborescence SEO (note Twitter transmise par Rayan) en plan d'opération concret pour Permigo. Source de vérité acquisition organique.*

> **Cap produit (verrouillé)** : on construit pour **2 rôles** — l'**élève** (carburant viral, volume de recherche massif) et le **moniteur indépendant** (cible & payeur, 9,99 €/mois). Le SEO doit servir ces deux-là, **pas** l'auto-école/gérant (dormant).
>
> **Règle d'or SEO de Permigo** : *le contenu élève capte le trafic de masse → l'app rend l'élève accro → l'engagement élève EST l'argument de vente du moniteur.* Le SEO élève et la vente moniteur ne sont pas deux canaux séparés : c'est **la même boucle**.

> ✅ **Statut 2026-06-18 (branche `feat/seo-static-content`)** — Phases 0 + 1 + amorce Phase 2/3 livrées en une PR :
> - **Verrou technique levé** : couche de contenu statique pré-rendue au build (`scripts/build-seo.mjs`, branché dans `npm run build`). 13 pages HTML complètes et indexables, hors SPA.
> - **Pari A** : hub `/centres-examen/` + **6 fiches centres IDF** (Cergy, Argenteuil, Bobigny, Créteil, Nanterre, Trappes) générées depuis `centres-examen.js`.
> - **Pari B** : pilier `/pour-moniteurs/` (copy GTM).
> - **Guides élève** : hub `/guides/` + 4 guides evergreen (réviser le code, examen blanc, fautes éliminatoires, déroulement examen pratique).
> - **Quick wins** : meta home recentrée sur le cap, JSON-LD (Organization + SoftwareApplication) sur la home + par page (BreadcrumbList/FAQPage/Article/SoftwareApplication), `sitemap.xml` régénéré.
> - **À faire (Rayan)** : (1) relire le wording meta home + pilier moniteur ; (2) vérifier sur le **preview Vercel** que les routes `/centres-examen/*` etc. servent bien le HTML statique (et non le SPA) ; (3) brancher Google Search Console + soumettre le sitemap ; (4) étendre les centres au-delà de l'IDF (vagues).

---

## 0. TL;DR — où mettre l'énergie

| Pari | Audience | Pourquoi | Volume | Valeur/lead | Vitesse de monétisation |
|---|---|---|---|---|---|
| **A. Centres d'examen par ville** (programmatique) | Élève | Actif déjà à moitié construit (`centres-examen.js`), longue traîne géo, SERP faible sur les petites villes | 🟢🟢🟢 Élevé | 🟡 Indirecte (viral) | 🟡 Moyen |
| **B. Money keywords moniteur** | Moniteur (payeur) | Peu de pages, intention d'achat forte, convertit en 9,99 € | 🟡 Faible | 🟢🟢🟢 Direct (abonnement) | 🟢 Rapide |
| **C. GEO / réponses IA** | Les deux | Frontière neuve, peu cher à démarrer, le contenu A+B est déjà citable par les LLM | 🟡 Croissant | 🟢 Élevé | 🟡 Moyen |

> **Le verrou avant tout** : aucun de ces paris n'indexe tant que le **contenu reste un SPA hash-router rendu en `innerHTML`**. La Phase 1 (couche de contenu statique) débloque A, B et C. **Ne pas démarrer A/B/C avant la Phase 1.**

---

## 1. Le verrou technique (Architecture / Technique / Indexation)

### Le problème
- Routing = `#/route/{param}` (hash). Google **n'indexe pas** un fragment comme une URL distincte.
- Tout le contenu est injecté client-side via `innerHTML` après exécution JS. Pas de HTML pré-rendu.
- `vercel.json` : `rewrites: [{ source: "/(.*)", destination: "/index.html" }]` → **une seule URL réelle**, un seul `<title>`, une seule meta description, un seul canonical (`permigo.vercel.app/`).
- Conséquence : impossible de servir 700 pages « centre d'examen » ou 30 guides avec leur propre title/meta/canonical/schema. **Le SEO de contenu est mort-né en l'état.**

### La décision (recommandée)
**Découpler la surface SEO du SPA applicatif.** L'app reste un SPA (aucune réécriture). On ajoute **une couche de contenu statique pré-rendue au build**, sur des URLs *path-based* réelles :

```
permigo.app/                         → landing (SPA, déjà là)
permigo.app/app/#/...                → l'application élève/moniteur (SPA, inchangée)
permigo.app/centres-examen/cergy/    → page statique pré-rendue (HTML complet)
permigo.app/guides/reviser-le-code/  → page statique pré-rendue
permigo.app/pour-moniteurs/...       → page statique pré-rendue
permigo.app/blog/...                 → page statique pré-rendue
```

**Comment, sans framework** (on reste Vanilla + Vite) :
- Option recommandée : **petit générateur statique au build** (script Node dans `scripts/build-seo.mjs`) qui lit les données (`centres-examen.js`, fichiers Markdown de guides) et **écrit des `.html` complets** dans `dist/` (title, meta, canonical, JSON-LD, contenu visible sans JS, + un CTA vers l'app). Vite gère le multi-page via `rollupOptions.input`, ou on génère le HTML nous-mêmes après `vite build`.
- Chaque page statique = **HTML lisible sans JS** (le contenu éditorial est dans le HTML), + un bundle léger pour l'interactivité (CTA, mini-quiz). Pas besoin de SSR runtime : tout est figé au build (SSG), parfait pour Vercel.
- Ajuster `vercel.json` : **ne pas** catch-all-rewrite les chemins `/centres-examen/*`, `/guides/*`, `/pour-moniteurs/*`, `/blog/*` (ils doivent servir leur vrai HTML), garder le rewrite uniquement pour `/app/*` et la racine SPA.

### Quick wins techniques (faisables AVANT la Phase 1, sans SSG)
- [ ] **Corriger la meta de la home** (`index.html`) : retirer *« pour les auto-écoles »*, recentrer sur **moniteur indé + élève** (cf. cap). ⚠️ Positionnement = valider le wording avec Rayan avant de coder (règle landing).
- [ ] `robots.txt` + `sitemap.xml` (même minimal au début).
- [ ] **JSON-LD** sur la landing : `Organization` + `SoftwareApplication` (nom, prix 9,99 €, catégorie, plateforme) + `FAQPage`.
- [ ] Vérifier l'`og-image.png` (référencée mais à confirmer présente).
- [ ] Brancher **Google Search Console** + **Bing Webmaster** (indispensable pour la boucle de mesure).
- [ ] `Schema` produit clair = base du GEO (les LLM lisent les entités structurées).

---

## 2. Pari A — Centres d'examen par ville (le silo phare)

**Idée → Niche → Opportunité cachée.** Tu as déjà `src/data/centres-examen.js` : structure éditoriale (résumé, accès, pièges réels, difficulté /5, quizTags) + contenu **100 % original** dans la voix Permigo. **Aujourd'hui : 1 centre (Cergy).** Il y a ~700 centres d'examen du permis B en France.

**Intention de recherche.** « centre examen permis [ville] », « centre permis [ville] difficile ou pas », « adresse examen permis [dept] », « pièges examen permis [ville] ». Intention forte (candidat à 1–6 semaines de l'examen), SERP souvent faible sur les villes moyennes (contenu officiel sec, pas d'angle « pièges + révision »).

**Structure de page (chaque centre = page money satellite) :**
1. H1 « Centre d'examen du permis à [Ville] ([dept]) » + résumé.
2. Accès / adresse / transports (faits publics réécrits).
3. **Les pièges réels du secteur** (ton vrai différenciateur — personne d'autre ne l'écrit).
4. Difficulté observée + conseils.
5. **CTA boucle virale** : « Révise les pièges de ce centre dans Permigo » → mini-quiz ciblé (`quizTags`) → inscription élève.
6. Maillage interne : centres du même département, guides liés (« combien de fautes éliminatoires », « déroulement de l'examen pratique »).
7. **Schema** : `Place` / `LocalBusiness`-like + `FAQPage` (« Le centre de [Ville] est-il difficile ? »).

**Garde-fous (anti-pénalité « doorway pages »)** :
- Chaque page doit avoir une **vraie valeur unique** (les pièges/conseils par centre, pas un template vide rempli au copier-coller). Tu as déjà cette discipline éditoriale — la tenir.
- Déployer **par vagues** (top 30 villes par volume d'abord), pas 700 pages thin d'un coup.
- Ne pas cannibaliser la future feature **premium** « fiches centre » in-app : la page SEO = teaser top-of-funnel gratuit (accès, réputation, 1–2 pièges), la **profondeur** (parcours d'entraînement complet ciblé, tous les pièges, examen blanc du centre) reste **dans l'app/premium**. Le SEO nourrit, le premium monétise.

**Priorisation des villes** : Île-de-France d'abord (volume + tu connais Cergy/95), puis grandes métropoles, puis villes moyennes à SERP faible (meilleur ratio effort/position).

---

## 3. Pari B — Money keywords moniteur (la conversion directe)

**Peu de pages, forte intention, monétisation rapide.** Le moniteur indé qui cherche ces requêtes est un lead chaud à 9,99 €.

**Page pilier** : `/pour-moniteurs/` — « L'app à TA marque pour moniteur indépendant » (reprend la plateforme de marque du GTM : ton outil, pas Ornikar ; engagement élève ; preuve/autorité).

**Money keywords & pages satellites :**
- « logiciel auto-école indépendant » / « application moniteur auto-école »
- « livret REMC numérique » / « suivi pédagogique permis en ligne »
- « se mettre à son compte moniteur auto-école » (guide métier = haut de funnel chaud)
- « comment fidéliser ses élèves auto-école » / « élèves qui ne révisent pas entre les leçons »
- **Comparatifs** (intention transactionnelle ++) : « alternative Ornikar pour moniteur », « Permigo vs En Voiture Simone (côté moniteur) », « Permigo vs livret papier ». Angle : *eux possèdent ton élève ; Permigo te le rend, à ta marque.*

**Conversion** : chaque page → CTA essai / démo Loom (réutilise les assets GTM) → signup 9,99 €. **Revenu par page** mesurable directement (Pari B = le plus lisible côté ROI).

---

## 4. Pari C — GEO / présence dans les réponses IA

**La frontière neuve** (= dossiers « GEO » + « Contenu Pensé Pour Les LLM » de la note). Quand quelqu'un demande à ChatGPT/Claude/Perplexity/Google AI Overviews *« comment réviser le code efficacement »*, *« quel centre d'examen est le plus facile en Île-de-France »*, *« meilleure app pour un moniteur indépendant »* — on veut que **Permigo soit cité**.

**Leviers (le contenu A+B fait déjà le gros du travail) :**
- **Clarté d'entité** : schema `Organization` + `SoftwareApplication` cohérents, page « À propos » qui définit Permigo sans ambiguïté (qui, pour qui, prix).
- **Contenu structuré et réellement utile** : réponses directes en début de page, `FAQPage` schema, listes/tableaux que les LLM citent facilement.
- **Mentions de marque** : cohérence du nom « Permigo » partout (annuaires, réseaux, GMB le jour venu).
- Les pages « centres » et « guides » sont des **réponses factuelles** = exactement ce que les moteurs génératifs aiment citer.

> Mesure GEO = présence dans les réponses IA (test manuel récurrent sur 10 prompts cibles) + trafic référent depuis chatgpt.com / perplexity.ai dans GSC/PostHog.

---

## 5. Architecture des silos (carte cible)

```
/                          landing (SPA)         → conversion moniteur + élève
/pour-moniteurs/           PILIER moniteur (B)   → money pages + comparatifs
  ├─ /alternative-ornikar/
  ├─ /livret-remc-numerique/
  ├─ /fideliser-eleves/
  └─ /se-mettre-a-son-compte/
/centres-examen/           PILIER élève géo (A)  → programmatique par ville
  └─ /[ville]/             satellites (×N villes)
/guides/                   PILIER élève evergreen
  ├─ /reviser-le-code/
  ├─ /examen-blanc-gratuit/
  ├─ /30-objectifs-livret/
  ├─ /fautes-eliminatoires-permis/
  └─ /deroulement-examen-pratique/
/blog/                     Discover / fraîcheur  → actus permis, réformes, saisonnalité
/app/#/...                 l'application (SPA, inchangée)
```

**Maillage** : pilier ↔ satellites bidirectionnel ; centres d'un même département entre eux ; guides ↔ centres (« avant ton examen à [Ville], révise [le déroulement] »). **Profondeur de clic ≤ 3** depuis la home.

---

## 6. Roadmap par phases

**Phase 0 — Quick wins (cette semaine, sans nouvelle infra)**
Meta home recentrée (à valider), `robots.txt`, `sitemap.xml`, JSON-LD landing, GSC + Bing branchés, og-image vérifiée.

**Phase 1 — Débloquer le contenu (l'unlock)**
Couche de contenu statique pré-rendue (`scripts/build-seo.mjs` + ajustement `vercel.json`). Une page pilote (`/centres-examen/cergy/`) qui prouve l'indexation. **Ne rien lancer à l'échelle avant que cette page soit indexée dans GSC.**

**Phase 2 — Le silo phare (A) + guides élève**
Top 30 centres d'examen + 5 guides piliers élève. Mesurer impressions/positions à 4–6 semaines.

**Phase 3 — Money pages moniteur (B)**
Pilier `/pour-moniteurs/` + 4 satellites + 2 comparatifs. Brancher CTA → signup, mesurer revenu/page.

**Phase 4 — GEO + Discover + boucle d'optimisation**
Schema/entité durcis, cadence blog (fraîcheur/Discover), boucle Mesure→Optimisation (contenus à renforcer, pages à fusionner/supprimer, tests SEO).

---

## 7. Boucle de mesure (Mesure → Objectif)

Funnel unique, pas de vanity metric :

```
Impressions (GSC) → Clics (CTR) → Sessions app (PostHog) → Signups → Moniteurs payants 9,99 €
                                                          └→ Élèves actifs (carburant viral)
```

- **Pari A** : KPI = élèves inscrits via pages centres (carburant viral) + assist sur les ventes moniteur.
- **Pari B** : KPI = **revenu par page** (le plus direct).
- **Pari C** : KPI = citations IA + trafic référent LLM.
- Cadence : revue mensuelle GSC (requêtes sous-exploitées, pages à renforcer, SERP gagnées/perdues).

---

## 8. Ce qu'on ne fait PAS (anti-objectifs)

- ❌ Réécrire le SPA en SSR : surdimensionné. La couche statique découplée suffit.
- ❌ Pondre 700 pages centres thin d'un coup : pénalité doorway. Par vagues, valeur unique par page.
- ❌ Investir le SEO « auto-école / gérant » : hors-cap.
- ❌ Cannibaliser le premium « fiches centre » : SEO = teaser gratuit, profondeur = in-app/premium.
- ❌ Mettre en avant l'offre per-seat/école dans le contenu : 9,99 € self-serve uniquement.

---

## 9. Première action concrète proposée (au réveil)

1. **Valider** ce plan + le wording de la nouvelle meta home (positionnement moniteur indé).
2. Je livre la **Phase 0** (robots/sitemap/JSON-LD/meta) en une PR — zéro risque, débloque GSC.
3. On choisit ensemble la **page pilote Phase 1** (Cergy) pour prouver l'indexation avant d'industrialiser.
```
```

> Mapping note Twitter → ce doc : *Idée/Validation* = §0+§2+§3 ; *Architecture/Mots-clés* = §5 ; *Contenu* = §2/§3/§4 ; *Technique/Indexation* = §1 ; *GEO/Discover/Contenu LLM* = §4 ; *Mesure/Optimisation/Objectif* = §7. *Autorité/Backlinks* et *Automatisation (génération de pages)* = chantiers post-Phase 2.
