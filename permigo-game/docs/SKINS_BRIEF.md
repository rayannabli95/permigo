# PermiGo — Brief des 9 skins moniteur

> Document à compléter avec les images générées via ChatGPT / DALL-E / Sora.
> Une fois les 9 images créées, place-les dans `permigo-game/public/skins/`.

---

## 🎨 DA & contraintes visuelles

**Style général :**
- Flat 2D illustration, minimaliste, no shadow, no gradient
- Centered subject sur fond TRANSPARENT
- Inspiration : Apple SF Symbols × Linear app icons
- 2-3 couleurs max par image, soft / sobres
- Format : PNG 512×512, fond transparent
- Aucun élément enfantin (pas de paillettes, pas de mascotte)

**Cible utilisateur :**
- Moniteur d'auto-école PRO ADULTE
- Ton "Linear / Notion", pas "Duolingo / Clash Royale"

---

## 📋 Prompt ChatGPT de base (à copier-coller)

```
Flat 2D illustration, minimalist style, no shadow, no gradient.
Centered subject on transparent background (PNG).
Style: Apple SF Symbols × Linear app icons.
Color palette: 2 colors max, sober pastels.
Format: 512x512 PNG, transparent background.
No childish elements, no glitter, professional tone.

Subject: [REMPLACER ICI]
Primary color: [REMPLACER PAR LE HEX DU SKIN]
```

---

# Les 9 skins à créer

## SKIN 1 — Premier kilomètre

| Champ | Valeur |
|---|---|
| **Threshold** | 25 validations cumulées |
| **Couleur accent** | `#6366f1` (indigo) |
| **Fichier image attendu** | `/public/skins/skin-01.png` |
| **Symbolique** | Le démarrage. Le 1er petit jalon après le 1er outil. |

**Prompt ChatGPT (idée)** :
> Subject: A single odometer / counter showing a low number like "25 km", with a forward arrow suggesting progress. Sober, minimal.
> Primary color: #6366f1 (indigo)

**Mon image (collée dans Word ici)** : _________________

---

## SKIN 2 — Volant souple

| Champ | Valeur |
|---|---|
| **Threshold** | 55 validations cumulées |
| **Couleur accent** | `#8b5cf6` (violet) |
| **Fichier image attendu** | `/public/skins/skin-02.png` |
| **Symbolique** | La maîtrise gestuelle. Volant tenu avec confiance. |

**Prompt ChatGPT (idée)** :
> Subject: A steering wheel viewed from above, with two hands holding it at 10 and 2 o'clock positions. Clean lines, minimal.
> Primary color: #8b5cf6 (violet)

**Mon image** : _________________

---

## SKIN 3 — Phares allumés

| Champ | Valeur |
|---|---|
| **Threshold** | 85 validations cumulées |
| **Couleur accent** | `#06b6d4` (cyan) |
| **Fichier image attendu** | `/public/skins/skin-03.png` |
| **Symbolique** | La vigilance, l'attention permanente. |

**Prompt ChatGPT (idée)** :
> Subject: Two car headlights illuminating, with light beams forward. Front view, minimal.
> Primary color: #06b6d4 (cyan)

**Mon image** : _________________

---

## SKIN 4 — Boîte fluide

| Champ | Valeur |
|---|---|
| **Threshold** | 115 validations cumulées |
| **Couleur accent** | `#10b981` (vert émeraude) |
| **Fichier image attendu** | `/public/skins/skin-04.png` |
| **Symbolique** | La transmission, le passage de vitesses sans heurts. |

**Prompt ChatGPT (idée)** :
> Subject: A manual gear stick (shifter) with the H pattern visible. Side view, clean.
> Primary color: #10b981 (emerald)

**Mon image** : _________________

---

## SKIN 5 — Carte ouverte

| Champ | Valeur |
|---|---|
| **Threshold** | 155 validations cumulées |
| **Couleur accent** | `#0ea5e9` (sky) |
| **Fichier image attendu** | `/public/skins/skin-05.png` |
| **Symbolique** | Mi-parcours. La vision d'ensemble se dessine. |

**Prompt ChatGPT (idée)** :
> Subject: An unfolded paper map with a route drawn on it. Top-down view, minimal lines.
> Primary color: #0ea5e9 (sky blue)

**Mon image** : _________________

---

## SKIN 6 — Compas calé

| Champ | Valeur |
|---|---|
| **Threshold** | 205 validations cumulées |
| **Couleur accent** | `#a855f7` (purple) |
| **Fichier image attendu** | `/public/skins/skin-06.png` |
| **Symbolique** | Direction sûre, sens pédago aiguisé. |

**Prompt ChatGPT (idée)** :
> Subject: A compass with the needle pointing firmly North. Geometric, clean.
> Primary color: #a855f7 (purple)

**Mon image** : _________________

---

## SKIN 7 — Tableau pro

| Champ | Valeur |
|---|---|
| **Threshold** | 255 validations cumulées |
| **Couleur accent** | `#ec4899` (pink) |
| **Fichier image attendu** | `/public/skins/skin-07.png` |
| **Symbolique** | Maîtrise de tous les indicateurs. Cockpit complet. |

**Prompt ChatGPT (idée)** :
> Subject: A car dashboard with speedometer and indicators, simplified. Front view.
> Primary color: #ec4899 (pink)

**Mon image** : _________________

---

## SKIN 8 — Maître artisan

| Champ | Valeur |
|---|---|
| **Threshold** | 305 validations cumulées |
| **Couleur accent** | `#f59e0b` (amber) |
| **Fichier image attendu** | `/public/skins/skin-08.png` |
| **Symbolique** | Expertise reconnue, savoir-faire artisanal. |

**Prompt ChatGPT (idée)** :
> Subject: A medal or hand-tool icon symbolizing craftsmanship. Minimal.
> Primary color: #f59e0b (amber)

**Mon image** : _________________

---

## SKIN 9 — Couronne discrète

| Champ | Valeur |
|---|---|
| **Threshold** | 355 validations cumulées |
| **Couleur accent** | `#d946ef` (fuchsia) |
| **Fichier image attendu** | `/public/skins/skin-09.png` |
| **Symbolique** | À 25 validations du Cercle Or. Dernier palier avant l'élite. |

**Prompt ChatGPT (idée)** :
> Subject: A simple, geometric crown with 3 points. Minimal, no jewels.
> Primary color: #d946ef (fuchsia)

**Mon image** : _________________

---

# Workflow pour toi

1. **Pour chaque skin** ouvre ChatGPT (avec accès image-gen / DALL-E / Sora)
2. **Copie le prompt de base** + remplace `Subject` et `Primary color` par celui du skin
3. **Génère 2-3 variantes** et garde la meilleure
4. **Télécharge le PNG** avec le bon nom (ex: `skin-01.png`)
5. **Place dans** `permigo-game/public/skins/skin-XX.png`
6. **Pings-moi quand t'as fini** — je vérifie que tout s'affiche bien dans la timeline

---

# Variables CSS / code (déjà en place)

Les couleurs et thresholds sont déjà câblés dans `src/data/moniteur-levels.js`.
Tu n'as **PAS besoin de toucher au code** — il suffit de déposer les PNG au bon endroit.

Si l'image n'existe pas, la timeline affichera juste le nom du skin avec sa couleur (fallback propre).

---

> **Astuce** : pour ouvrir ce .md dans Word, glisse-le simplement sur l'icône Word, ou ouvre Word → Fichier → Ouvrir → sélectionne ce .md. Word le convertit automatiquement.
