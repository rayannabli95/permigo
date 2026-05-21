# 04 — Prompts génération d'images · PermiGo

> Cible : **gpt-image-1.5 via ChatGPT (GPT-5 Pro)**. Structure imposée (OpenAI Cookbook) : `background/scene → subject → key details → constraints + intended use`. Copy-paste tel quel, un prompt = un asset.
>
> Palette Permigo : violet primaire `#6366f1`, violet profond `#5145e0`, accent or `#f5c518`, glow cyan `#4fd1ff`, fond clair `#f7f7fb`.

---

## Style anchor (à coller EN PREMIER de chaque session ChatGPT)

```
You are generating a coherent visual asset set for "PermiGo", a French driving-school mobile app for ages 17-35. House style across ALL assets: 3D rendered, friendly cartoon, chibi proportions inspired by Clash Royale and Brawl Stars character portraits. Consistent color palette: primary purple #6366f1, deep purple #5145e0, gold accent #f5c518, cyan magic glow #4fd1ff. Soft studio lighting, warm key light front-left, soft rim light from behind. Clean, premium, high render quality. No text, no watermarks, no UI chrome, no realistic photography, no anime. Keep proportions and rendering identical between assets so they look like one family. Confirm you will keep this anchor for every image this session.
```

---

## A. Avatars (4) — 1024×1024 PNG alpha

### Guerrier
```
Background: transparent PNG, no scene.
Subject: a young confident "Warrior" mascot for a driving app, full body, isometric 3/4 view, chibi proportions.
Key details: modern sporty armor in deep purple #5145e0 with gold #f5c518 trims, holding a steering wheel like a shield, friendly determined smile, no helmet covering the face, short stylized hair. Soft rim light from behind, warm key light front-left.
Constraints: 1024x1024, transparent alpha, centered, no text, no watermark, no realistic photo, no anime. Same chibi proportions and render quality as a Clash Royale character portrait. Intended use: selectable avatar icon in a mobile app.
```

### Mage
```
Background: transparent PNG, no scene.
Subject: a young "Mage" mascot for a driving app, full body, isometric 3/4 view, chibi proportions.
Key details: modern hooded robe in purple #6366f1, holding a glowing steering wheel as a magic staff with cyan #4fd1ff glow, confident smile, no helmet, visible friendly face.
Constraints: 1024x1024, transparent alpha, centered, no text, no watermark, no realistic photo, no anime. Same proportions and render quality as a Clash Royale King portrait. Intended use: selectable avatar icon.
```

### Pilote
```
Background: transparent PNG, no scene.
Subject: a young "Racer/Pilote" mascot for a driving app, full body, isometric 3/4 view, chibi proportions.
Key details: sleek racing suit in purple #5145e0 and white with gold #f5c518 accents, racing gloves, holding a small steering wheel, racing goggles pushed up on the forehead (face fully visible), big friendly grin.
Constraints: 1024x1024, transparent alpha, centered, no text, no watermark, no realistic photo, no anime. Clash Royale render quality. Intended use: selectable avatar icon.
```

### Légende
```
Background: transparent PNG, no scene.
Subject: a prestige "Legend" mascot for a driving app, full body, isometric 3/4 view, chibi proportions.
Key details: premium outfit mixing purple #5145e0 and radiant gold #f5c518, subtle golden aura, a small floating crown, holding a glowing golden steering wheel, calm confident smile, face fully visible.
Constraints: 1024x1024, transparent alpha, centered, no text, no watermark, no realistic photo, no anime. Highest render quality of the set, clearly the rarest. Intended use: top-tier selectable avatar icon.
```

---

## B. Fonds de profil (4) — 1290×2796 (iPhone 15 Pro Max)

> Abstraits, mesh gradient, pas de sujet. Lisibilité du texte blanc par-dessus = zones sombres en bas.

### Coucher de soleil
```
Background/scene: full-screen abstract mesh gradient, vertical phone wallpaper.
Subject: warm sunset mood, smooth blended bands from deep purple #5145e0 at top to warm orange and soft gold #f5c518 near the horizon line at lower third.
Key details: subtle film grain, gentle light bloom, no sun disk, no objects. Darker toward the very bottom for white text legibility.
Constraints: 1290x2796, no text, no watermark, no people, no UI. Intended use: app profile background behind white text.
```

### Aurore boréale
```
Background/scene: full-screen abstract vertical wallpaper, night sky mood.
Subject: aurora borealis in cyan #4fd1ff and purple #6366f1 flowing ribbons over a dark navy sky.
Key details: soft glow, faint stars, smooth gradients, no landscape, no objects. Darker top and bottom edges for legibility.
Constraints: 1290x2796, no text, no watermark, no people. Intended use: app profile background behind white text.
```

### Or pur
```
Background/scene: full-screen abstract vertical wallpaper, premium mood.
Subject: rich liquid-gold #f5c518 mesh gradient blended with deep purple #5145e0, luxury feel.
Key details: soft metallic sheen, smooth caustic-like highlights, no objects, no logo. Darker lower third for white text.
Constraints: 1290x2796, no text, no watermark. Intended use: prestige profile background.
```

### Cyberpunk
```
Background/scene: full-screen abstract vertical wallpaper, neon night mood.
Subject: cyberpunk gradient, deep purple #5145e0 base with neon cyan #4fd1ff and magenta highlights, soft bokeh light streaks.
Key details: subtle grid glow, smooth gradients, no city, no objects, no characters. Darker bottom for legibility.
Constraints: 1290x2796, no text, no watermark. Intended use: app profile background behind white text.
```

---

## C. Icônes de thèmes (6) — 512×512 PNG alpha

> Problème actuel : previews thèmes identiques (emoji 🎨). Chaque thème = icône distincte, même famille de rendu.

```
Background: transparent PNG.
Subject: a small glossy 3D theme icon for a mobile app theme selector, single centered object, chibi/clean style.
Key details: [REMPLACER par le thème] — ex: "Theme 1 = a rounded purple #6366f1 paint droplet with gold #f5c518 highlight"; "Theme 2 = a cyan #4fd1ff crystal"; "Theme 3 = a gold #f5c518 medal"; "Theme 4 = a purple #5145e0 night-mode crescent"; "Theme 5 = an orange sunset orb"; "Theme 6 = a holographic iridescent sphere". Soft studio lighting, subtle drop shadow.
Constraints: 512x512, transparent alpha, centered, no text, no watermark, all six must share identical lighting and bevel style so they read as one set. Intended use: theme preview tile in shop.
```

Génère les 6 en une seule conversation (anchor + ce prompt ×6 en changeant la ligne « Theme N = »), pour une cohérence de bevel/lumière.

---

## D. Coffres (4 tiers) — 1024×1024 PNG alpha

> Identité Permigo, anticipation Clash Royale. 4 tiers = 4 mondes.

```
Background: transparent PNG.
Subject: a treasure chest icon for a driving-app reward system, 3/4 view, chibi/glossy 3D style, closed.
Key details: [tier] — Bronze: brushed bronze with purple #6366f1 trim; Silver: silver with cyan #4fd1ff gem; Gold: gold #f5c518 with purple lock; Legendary: radiant gold + purple #5145e0 with cyan #4fd1ff energy glow and small floating particles. Subtle steering-wheel emblem embossed on the lid. Soft rim light.
Constraints: 1024x1024, transparent alpha, centered, no text, no watermark, no realistic photo. Four tiers must share identical shape and render, only material/color escalates. Intended use: chest reward icon.
```

Variante « ouvert » (anticipation) : ajouter `lid open with a burst of gold #f5c518 light and floating gems` en gardant le reste identique.

---

## E. Badges / trophées — 512×512 PNG alpha

> Passer d'emoji à SVG/PNG custom (cohérence : pas d'emoji mélangé aux SVG de la nav).

```
Background: transparent PNG.
Subject: a single achievement badge icon for a driving-learning app, centered, glossy 3D medal/shield, chibi style.
Key details: [REMPLACER] — ex "first lesson = purple #6366f1 shield with a small white steering wheel"; "7-day streak = gold #f5c518 flame medal"; "exam passed = laurel wreath gold medal with cyan #4fd1ff ribbon". Soft bevel, subtle inner glow, small drop shadow.
Constraints: 512x512, transparent alpha, centered, no text, no watermark. All badges share identical bevel, ribbon style and lighting so the trophy wall looks unified. Intended use: trophy grid icon, also exported as flat SVG-friendly silhouette.
```

---

## Checklist de cohérence (à vérifier après génération)

- Anchor collé en premier de CHAQUE session.
- Même lumière (key front-left, rim back) sur tous les avatars.
- Thèmes : 6 icônes au même bevel — sinon régénère le lot entier d'un coup.
- Coffres : forme identique, seul le matériau escalade.
- Aucun texte / watermark / photo réaliste / anime.
- Fonds : tiers inférieur assombri pour lisibilité du texte blanc.
- Export : avatars/coffres/badges en PNG alpha ; fonds en PNG/JPEG 1290×2796.

Fin des livrables. Voir `01` (audit), `02` (spec + design system), `03` (patches).
