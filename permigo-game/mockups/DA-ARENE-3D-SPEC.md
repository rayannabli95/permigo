# DA QUIZZ ÉLÈVE — « Arène 3D » (choisie par Rayan 2026-06-24)

Référence visuelle = `mockups/quiz-da1.html` (ouvrir à 390px). À appliquer au **vrai quizz** :
`src/pages/eleve/quiz.js` + `src/components/eleve/quiz-ui.js` (+ `flash-quiz.js` qui réutilise quiz-ui).
**Esprit** : jeu vidéo mobile premium type Clash Royale / Supercell — sombre, doré, boutons « plastique » 3D, jutosité, mascotte. Anti-trauma conservé (jamais punitif).

## Tokens couleur
```
--bg-0:#0a0a1f  --bg-1:#141135  --bg-2:#1d1850        (fond nuit violet)
--gold:#ffcb3d  --gold-2:#ff9b1e  --gold-deep:#e07b00 (accent doré chaud)
--text:#f4f1ff  --text-dim:#b9b2e8
Bouton réponse (repos):  haut #3a3470 → bas #231d4f, tranche #15113a, highlight rgba(255,255,255,.28)
Bouton sélectionné (or): haut #ffd24a → bas #ff9c1c, tranche #b85e00
```
Fond écran = superposition de 2 `radial-gradient` (halo chaud haut + nappe violette) sur `linear-gradient(#181241→#0c0a26→#08071c)` + vignette `inset 0 0 140px 30px rgba(2,1,14,.85)` + fines étoiles (radial-gradient points).

## Typo (Google Fonts)
- **Baloo 2** (700/800) → titres, question, chips lettre, tag « Question X / Y ».
- **Fredoka** (500/600) → libellés de réponse, corps.

## Composants (recette)
- **Pips de progression** : barres `flex:1` h=11px, fond `#251f56` creusé ; *filled* = dégradé or + glow ; *active* = or clair + glow + `pipPulse` (brightness) + balayage `pipShine`.
- **Tag question** : pilule « Question 2 / 5 » or translucide, bord doré, uppercase, letter-spacing .6px.
- **Panneau STOP = trophée 3D** : SVG octogone à 3 couches (back foncé extrudé `#6a0008` décalé → biseau doré `stopRim` fff1c2→ffcb3d→c97e00 → face rouge `stopFace` ff5a4f→e21f1f→a90d12 + liseré blanc 3.4px + gloss spéculaire) ; `drop-shadow` chaud + `float` (translateY + rotate) + **halo** radial doré qui respire derrière.
- **Mascotte** : petite voiture cartoon (gyrophare jaune auto-école), SVG inline, coin haut-droite, `mascotFloat`. (cf. SVG dans la maquette, réutilisable tel quel ou en asset.)
- **Question** : Baloo 2 700 ~22px centré, `text-shadow` douce ; le mot-clé `.hl` = pastille dorée (fond ffe27a→ffb02e, `box-shadow:0 3px 0 var(--gold-deep)`, légère rotation -1deg) — c'est l'équivalent du `<strong>` actuel (richEsc).
- **Réponses (boutons plastique 3D)** : `linear-gradient(top→bot)`, `border-radius:18px`, ombre = **tranche dure** `0 7px 0 var(--btn-edge)` + ombre portée + inset highlight haut + inset shadow bas ; `:active` → `translateY(5px)` et la tranche passe à `0 2px 0` (le bouton s'enfonce). Apparition `popIn` en cascade (delay .10→.34s).
- **Chip lettre A/B/C/D** : carré 38px arrondi 12px, fond violet foncé, `box-shadow:0 3px 0 #110d35` (relief).
- **État sélectionné (neutre, AVANT validation)** : bouton OR + ring `0 0 0 3px rgba(255,210,90,.25)` + chip blanc/or + glint qui balaye. ⚠️ Le ✓ rond dans la maquette = juste l'état « choisi » — **dans le vrai quizz, ne mettre le ✓ vert / rouge qu'APRÈS la réponse** (logique applyReveal existante), pas sur la simple sélection.
- **Footer** : « Touche une réponse pour **valider** ta manche » (or sur le mot-clé).

## Garde-fous
- Garder la logique JS existante (quiz-engine, applyReveal, pips, mascotte states, son) — on **réhabille le CSS/markup**, on ne casse pas le moteur.
- Respecter `esc()`/`richEsc()` pour tout texte injecté.
- Contraste AA (texte clair sur fond sombre OK ; sur le bouton or sélectionné, texte foncé #3a1d00).
- Reduced-motion : couper les `float`/`pulse`/`sweep` sous `prefers-reduced-motion`.
- Mobile-first 390px, zones tactiles ≥ 56-60px.
