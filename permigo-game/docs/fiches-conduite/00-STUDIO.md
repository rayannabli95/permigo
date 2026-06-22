# 00 — Studio de contenu « fiches de révision conduite »

Organisation type « petite boîte de production de contenu pédagogique ».
Objectif : transformer le savoir de **vrais moniteurs** (vidéos YouTube, et plus tard la voix du moniteur) en **fiches de révision de conduite** + questions ciblées, mappées REMC, prêtes à brancher dans l'app.

## La chaîne de production (5 postes)

1. **Collecte** — `yt-dlp` aspire les sous-titres FR des vidéos (gratuit, local). Sortie : `sources/transcripts/<chaîne>/<videoId>.txt` (prose nettoyée).
2. **Desk de tri / catalogage** — chaque transcript est classé : sujet → **compétence(s) REMC** (C1a…C4x) ou **écarté** (code, moto, admin, hors-sujet). Tenu dans `sources/catalogue.md`.
3. **La meute (rédaction)** — 1 agent par monde (C1→C4). Chaque agent prend : la fiche consensus existante (`fiches/monde-X.md`) + `ARBITRAGES.md` + les transcripts retenus de ses compétences → produit la **fiche enrichie** (méthode, pourquoi, erreur, 3 questions), en **citant la vidéo source** par fiche.
4. **Contrôle qualité** — 1 agent QA : vérifie cohérence avec `ARBITRAGES.md`, exactitude (sécurité), zéro plagiat (reformulation), accents FR, ton tutoiement. Signale tout conflit méthode.
5. **Livraison** — fiches finales dans `fiches/`, prêtes pour le câblage dans l'app (`remc-details.js` + `questions_competence`).

## Règles maison (non négociables)

- **`ARBITRAGES.md` fait foi** sur tout point de méthode tranché.
- **Contenu 100 % original** : on s'inspire des transcripts, on **reformule**. Jamais de copier-coller (plagiat + crédibilité).
- **Conduite, pas code.** Questions = geste / méthode / situation. Jamais « c'est quoi ce panneau ».
- **Traçabilité** : chaque fiche enrichie cite la/les vidéo(s) source (id + chaîne).
- **Sécurité d'abord** : une info de conduite fausse = danger. En cas de doute, on flague, on n'invente pas.
- Ton : tutoiement, simple, une idée à la fois. Français propre (accents).

## Arborescence

```
docs/fiches-conduite/
├── 00-STUDIO.md          ← ce fichier (organisation)
├── ARBITRAGES.md         ← décisions de méthode (fait foi)
├── sources/
│   ├── catalogue.md      ← tri : vidéo → compétence / écarté
│   └── transcripts/
│       ├── playlist-cours-conduite/
│       ├── las-de-la-route/
│       └── evry-village/
└── fiches/               ← production finale (monde-1 → monde-4)
```
