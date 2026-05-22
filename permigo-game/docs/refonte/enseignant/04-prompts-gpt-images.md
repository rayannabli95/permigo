# 04 — Prompts GPT-5 images · Côté enseignant · PermiGo

> Date : 2026-05-21. Prompts prêts à coller. Structure OpenAI Cookbook : **background/scene → subject → key details → constraints**.
>
> **Style anchor (à inclure dans chaque prompt)** : « Permigo Pro — outil B2B prosumer pour moniteur d'auto-école français. Jamais infantilisant, jamais arc-en-ciel, jamais cartoon. Palette : violet sobre `#6366F1`, gris pro `#475569`/`#C8C9CD`, accents or `#D4AF37` réservés aux paliers hauts. Registre Notion/Linear : propre, sobre, professionnel. »
>
> Convention : médaillons 512×512 PNG alpha · badges LinkedIn 1200×627 · stories 1080×1920 · avatars 512×512 · icônes SVG line. Aucun texte intégré aux médaillons sauf indication contraire.

---

## A. 10 skins de paliers (médaillons 512×512 PNG transparent)

Style commun : insigne circulaire type médaillon, finition métal brossé, sobre, sans cartoon/néon/glitter, sans ombre de fond, sujet isolé. Progression : paliers bas = argent/violet ; paliers hauts = or.

### Palier 1 — Premier kilomètre
```
Background/scene: transparent PNG, no background, no shadow.
Subject: medallion-style insignia, circular, 512px diameter, brushed silver finish with a thin deep-violet inner ring.
Key details: center motif = a single milestone marker / kilometer post stylized as a clean geometric pillar, with a subtle road line at its base. Minimal, flat-relief engraving look.
Palette: Permigo deep violet #6366F1 inner ring, brushed silver #C8C9CD body. No gold.
Style anchor: Permigo Pro, sober professional medallion, no cartoon, no neon, no glitter.
Constraints: 512x512 PNG with alpha, no text, no watermark, isolated subject only.
```

### Palier 2 — Volant souple
```
Background/scene: transparent PNG, no background, no shadow.
Subject: circular medallion, 512px, brushed silver with violet inner ring (same family as palier 1).
Key details: center motif = a steering wheel with a soft motion arc suggesting smooth, fluid handling. Clean flat-relief.
Palette: violet #6366F1 ring, brushed silver #C8C9CD. No gold.
Style anchor: Permigo Pro, sober medallion, matches the previous palier skin.
Constraints: 512x512 PNG alpha, no text, no watermark, isolated subject.
```

### Palier 3 — Phares allumés
```
Background/scene: transparent PNG, no background, no shadow.
Subject: circular medallion, 512px, brushed silver, violet inner ring.
Key details: center motif = a pair of stylized car headlights casting two subtle light cones forward, geometric and restrained (no glow burst).
Palette: violet #6366F1 ring, brushed silver #C8C9CD, faint cool-white light cones. No gold.
Style anchor: Permigo Pro, sober medallion, same family as previous skins.
Constraints: 512x512 PNG alpha, no text, no watermark, isolated subject.
```

### Palier 4 — Boîte fluide
```
Background/scene: transparent PNG, no background, no shadow.
Subject: circular medallion, 512px, brushed silver, violet inner ring.
Key details: center motif = a manual gear shift knob with a clean H-pattern shift gate, lines suggesting fluid movement.
Palette: violet #6366F1 ring, brushed silver #C8C9CD. No gold.
Style anchor: Permigo Pro, sober medallion, consistent with the series.
Constraints: 512x512 PNG alpha, no text, no watermark, isolated subject.
```

### Palier 5 — Carte ouverte
```
Background/scene: transparent PNG, no background, no shadow.
Subject: circular medallion, 512px, transition silver-to-warmer-silver, violet inner ring.
Key details: center motif = an unfolded road map with a route line and a small location pin, geometric flat-relief.
Palette: violet #6366F1 ring, brushed silver #C8C9CD, a faint warm tint hinting the climb toward gold tiers. No full gold yet.
Style anchor: Permigo Pro, sober medallion, series-consistent.
Constraints: 512x512 PNG alpha, no text, no watermark, isolated subject.
```

### Palier 6 — Compas calé
```
Background/scene: transparent PNG, no background, no shadow.
Subject: circular medallion, 512px, brushed silver-gold finish, violet inner ring.
Key details: center motif = a magnetic compass needle pointing north, integrated with a steering wheel ring, subtle laurel leaves on the sides.
Palette: Permigo deep violet #6366F1 inner ring, brushed silver #C8C9CD outer ring, gold accent #D4AF37 for needle and laurel.
Style anchor: Permigo Pro, sober medallion, same family as the previous skins.
Constraints: 512x512 PNG with alpha, no text, no watermark, no shadow background, isolated subject only.
```

### Palier 7 — Tableau pro
```
Background/scene: transparent PNG, no background, no shadow.
Subject: circular medallion, 512px, brushed silver-gold, violet inner ring.
Key details: center motif = a stylized dashboard/instrument cluster (two clean gauges) signifying mastery of metrics, flat-relief.
Palette: violet #6366F1 ring, brushed silver #C8C9CD, gold accents #D4AF37 on gauge needles.
Style anchor: Permigo Pro, sober medallion, series-consistent.
Constraints: 512x512 PNG alpha, no text, no watermark, isolated subject.
```

### Palier 8 — Maître artisan
```
Background/scene: transparent PNG, no background, no shadow.
Subject: circular medallion, 512px, predominantly gold-on-silver, violet inner ring.
Key details: center motif = crossed artisan tools (a wrench and a steering wheel spoke) framed by a laurel half-wreath, conveying craftsmanship.
Palette: gold #D4AF37 dominant, brushed silver #C8C9CD secondary, violet #6366F1 ring.
Style anchor: Permigo Pro, sober prestige medallion, series-consistent.
Constraints: 512x512 PNG alpha, no text, no watermark, isolated subject.
```

### Palier 9 — Couronne discrète
```
Background/scene: transparent PNG, no background, no shadow.
Subject: circular medallion, 512px, gold finish with violet inner ring.
Key details: center motif = a small, understated crown (3 points, minimal), restrained and elegant, not flashy.
Palette: gold #D4AF37 dominant, violet #6366F1 ring, subtle silver #C8C9CD edge.
Style anchor: Permigo Pro, discreet prestige medallion, never gaudy.
Constraints: 512x512 PNG alpha, no text, no watermark, isolated subject.
```

### Palier 10 — Cercle Or
```
Background/scene: transparent PNG, no background, no shadow.
Subject: circular medallion, 512px, full polished gold with a violet inner ring, the apex skin of the series.
Key details: center motif = a steering wheel enclosed in a complete laurel wreath circle, refined engraving, sense of achievement without excess.
Palette: gold #D4AF37 dominant and polished, violet #6366F1 inner ring, fine silver #C8C9CD detailing.
Style anchor: Permigo Pro, apex prestige medallion, sober and premium, no neon, no glitter.
Constraints: 512x512 PNG alpha, no text, no watermark, isolated subject.
```

---

## B. Badges partageables LinkedIn / Instagram

### B1 — Carte LinkedIn (1200×627)
```
Background/scene: solid professional background, soft vertical gradient from #1E2030 (top) to #2A2D45 (bottom), subtle abstract road-line motif at low opacity, no photo.
Subject: a Permigo certification card layout, landscape 1200x627.
Key details: left = the equipped palier medallion (e.g. Cercle Or, gold) at ~360px; right = headline text block "Permigo Certified Moniteur" with a sub-line slot for the tier name (e.g. "Niveau Or"). Small Permigo logotype top-left. Clean grid, generous spacing, Notion/Linear typographic restraint.
Palette: dark navy base, violet #6366F1 accents, gold #D4AF37 for the tier name only.
Style anchor: Permigo Pro, professional B2B credential card, never playful.
Constraints: 1200x627 PNG, leave a clear text zone on the right for editable name/tier, no lorem text artifacts, high contrast for legibility.
```

### B2 — Story Instagram / partage vertical (1080×1920)
```
Background/scene: vertical poster, gradient #1E2030 to #2A2D45, faint road/route line motif, no photo.
Subject: a Permigo palier achievement story, portrait 1080x1920.
Key details: centered equipped medallion at ~640px in the upper third; below, a headline "Niveau [Palier]" zone and a one-line achievement slot (e.g. "75% de réussite au premier passage"); Permigo logotype small at bottom. Lots of negative space, premium feel.
Palette: dark navy base, violet #6366F1, gold #D4AF37 reserved for high tiers.
Style anchor: Permigo Pro, sober and premium, no confetti, no cartoon.
Constraints: 1080x1920 PNG, safe margins for story UI (top 250px / bottom 300px kept clear), editable text zones, no watermark.
```

---

## C. 4 avatars moniteur (512×512 PNG transparent)

Génériques, divers, neutres, pros. Style flat illustration moderne ou 3D rendered subtil, fond transparent.
```
Background/scene: transparent PNG, no background.
Subject: a professional driving instructor avatar, head-and-shoulders, neutral friendly expression, 512x512.
Key details: VARIANT 1 = woman, ~40s, short dark hair; VARIANT 2 = man, ~50s, grey hair, glasses; VARIANT 3 = man, ~30s, beard, North-African features; VARIANT 4 = woman, ~35s, hijab, warm tone. All wearing a simple professional polo/shirt. Subtle violet accent in clothing. Flat modern illustration with soft shading, NOT cartoonish, no exaggerated features.
Palette: natural skin tones, muted clothing with a violet #6366F1 accent, neutral.
Style anchor: Permigo Pro, respectful professional portrait, diverse, never caricatural.
Constraints: 512x512 PNG alpha, isolated subject, consistent illustration style across all 4 variants, no text.
```
> Générer les 4 variantes dans une même passe pour garantir un style homogène.

---

## D. Icônes des 31 sous-compétences REMC (SVG line, style cohérent)

Style commun : icône line, stroke 2px, coins arrondis, monochrome `#475569` (ou `#6366F1` à l'état actif), grille 24×24, cohérence Linear/Notion. Métaphores concrètes de conduite. Exporter en SVG (pas PNG) pour le rendu inline.
```
Background/scene: transparent, single-color line icon, 24x24 grid, 2px stroke, rounded joins.
Subject: a REMC driving sub-competency icon set, consistent line style.
Key details: generate one icon per concept — examples: vehicle controls (steering wheel), mirrors & checks (rear-view mirror), starting/stopping (key + road), gear shifting (gear lever), road position (lane with car), speed adaptation (speedometer), intersections (crossroads), roundabouts (roundabout arrows), overtaking (two cars + arrow), night driving (car with headlight beams + moon), highway (motorway sign), adverse weather (cloud + rain), eco-driving (leaf + wheel), parking (P + car), emergency stop (triangle), sharing the road with pedestrians (pedestrian + crossing), cyclists (bicycle), heavy vehicles (truck), tunnels (tunnel arch), hazard anticipation (eye + road), etc.
Palette: monochrome #475569 default, #6366F1 active.
Style anchor: Permigo Pro, Linear/Notion line-icon system, sober and uniform.
Constraints: SVG line icons, 24x24, 2px stroke, no fill, no text, visually consistent set, exportable individually.
```
> Mapper chaque icône au code REMC réel (C1.x à C4.x) lors de l'intégration ; la liste ci-dessus est indicative — l'aligner sur les 31 sous-compétences exactes de la base.

---

## E. Icônes outils pro (SVG line, style Linear/Notion)

```
Background/scene: transparent, single-color line icons, 24x24 grid, 2px stroke.
Subject: a small pro-tool icon set for the instructor app navigation.
Key details: Calendar/Today (calendar with a dot), Students (two person silhouettes), Log session / + Séance (clipboard with a check, or plus-in-circle for the FAB), Validation (shield with check), Insights/Stats (bar chart trending up), Career path / Parcours (flag on a road / milestone), Account (user circle).
Palette: monochrome #475569 default, #6366F1 active, gold #D4AF37 only for the career/parcours top state.
Style anchor: Permigo Pro, Linear/Notion line-icon system, uniform stroke and corner radius.
Constraints: SVG line icons, 24x24, 2px stroke, no text, consistent set, FAB icon optically centered for a 56px button.
```

---

## Notes d'intégration

- Médaillons : nommer `skin-01-premier-kilometre.png` … `skin-10-cercle-or.png`, aligner sur les slugs de `moniteur-levels.js`.
- Cartes partageables : générées à la volée côté client (canvas) en injectant nom + palier dans les zones de texte réservées — l'image GPT sert de gabarit de fond.
- Icônes : préférer le SVG inline (cohérent avec `icon()` existant) pour le theming par `currentColor`.
- Aucun texte dans les médaillons (le palier est libellé par l'UI), pour éviter les artefacts de rendu de texte.
