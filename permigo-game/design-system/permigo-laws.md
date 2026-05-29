# PermiGo Design Laws

> Source de vérité visuelle. Toute UI dérive d'ici. Si une décision visuelle n'est pas couverte, on l'ajoute ici **avant** de coder.
>
> Lecture obligatoire avant tout nouveau composant/écran.

---

## 0. Les 10 lois fondamentales (rappel)

1. **Architecture modulaire** — pas de monolithe, découpe en sections / cards / hooks / animations / états
2. **Émotion avant code** — définir ce que l'user doit ressentir avant de coder
3. **Animations rares = récompenses** — pas de fade/hover/floating gratuit
4. **Design system strict** — ce fichier est la bible
5. **Dopamine intelligente** — héros = la conduite, jamais addiction vide
6. **Wrapped = screenshotable** — chaque slide compréhensible en 0.8s
7. **Empty states ont une émotion** — calme + anticipation, jamais vide froid
8. **Ship > Polish** — beta réelle avant énième gradient
9. **Prompts structurés** — OBJECTIF / CONTRAINTES / ÉMOTION / GARDE / BUGS À ÉVITER
10. **ADN par persona** — Élève (Duolingo×Clash Royale×Apple Health) · Moniteur (Uber Driver×Linear×Apple) · Gérant (Tesla×Bloomberg×Notion analytics)

---

## 1. Tokens fondamentaux

### Couleurs sémantiques (CSS vars — jamais hex en dur dans le code)

Fichier référence : `src/styles/base.css`

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#f4f5fb` | `#0b0d1a` | Background page |
| `--bg2` | `#eceef8` | `#13162a` | Background secondaire (skeletons) |
| `--su` | `#ffffff` | `#181b30` | Surface card |
| `--su2` | `#f8f9fd` | `#1f2238` | Surface secondaire |
| `--bo` | `#e2e6f2` | `#2a2e48` | Border principale |
| `--bo2` | `#edf0f9` | `#23263c` | Border subtile |
| `--ink` | `#0b0d1a` | `#f3f4f8` | Texte principal |
| `--mu` | `#7880a4` | `#9da3c0` | Texte secondaire |
| `--mu2` | `#94a3b8` | `#727896` | Texte tertiaire |
| `--a` | `#58CC02` | `#58CC02` | Accent primaire Duo (vert vif) |
| `--adk` | `#46A302` | `#46A302` | Accent dark (hover, ombres bouton) |
| `--ap` | `rgba(88,204,2,.09)` | `rgba(88,204,2,.15)` | Tint accent (fonds, focus rings) |
| `--gr` | `#22c55e` | `#22c55e` | Succès / validation (vert doux) |
| `--grd` | `#16a34a` | `#16a34a` | Succès dark |
| `--rd` | `#ef4444` | `#ef4444` | Erreur / danger |
| `--am` | `#f59e0b` | `#f59e0b` | Warning / gems |
| `--bl` | `#0ea5e9` | `#0ea5e9` | Info |
| `--pu` | `#8b5cf6` | `#8b5cf6` | Légendaire / rare |

> **Règle absolue** : aucune couleur hardcodée dans `style=` ni dans des propriétés CSS hors `src/styles/base.css`. Toujours `var(--token)`.

### Couleurs émotionnelles (récompenses, gamification)

| Émotion | Valeur | Quand |
|---|---|---|
| Légendaire | `linear-gradient(135deg, var(--pu), #581c87)` | Coffres monde 4, trophées 31/31, milestones >800 XP |
| Or / Excellence | `linear-gradient(135deg, var(--am), #a16207)` | Coffres monde 3, quiz parfaits, streaks >14j |
| Argent / Progression | `linear-gradient(135deg, var(--mu2), var(--mu4))` | Coffres monde 2, paliers intermédiaires |
| Bronze / Démarrage | `linear-gradient(135deg, var(--amk), #7c2d12)` | Coffres monde 1, premiers trophées |
| Streak / Feu | `linear-gradient(135deg, var(--or), var(--rd))` | Streak, flammes, urgence positive |
| Calme / Confiance | `linear-gradient(135deg, var(--a), var(--adk))` | Validation compétence, sérénité élève |

### Rareté (catalog items)

| `rarity` | Label | Couleur | Glow |
|---|---|---|---|
| `commun` | Commun | `var(--mu4)` | aucune |
| `rare` | Rare | `var(--bl2)` | `rgba(59,130,246,.3)` subtle |
| `epique` | Épique | `var(--puk)` | `rgba(168,85,247,.4)` modéré |
| `legendaire` | Légendaire | `var(--am)→var(--pul)` | pulse animé `rgba(168,85,247,.55)` |

---

## 2. Spacing & rythme

Échelle 4px. Aucune valeur exotique (pas de `7px`, pas de `13px`).

| Valeur | Usage |
|---|---|
| 4px | Détails fins |
| 8px | Gap intra-card |
| 12px | Gap entre items |
| 16px | Padding card / margin section |
| 24px | Margin block |
| 32px | Margin entre sections majeures |
| 48px | Hero / respiration premium |
| 64px | Empty state breathing |

> Pas de tokens `--sp-*` dans le code — utiliser les valeurs directes ou les propriétés `gap`/`padding` CSS.

**Container max-width mobile** : `480px` toujours (jamais full-width sur desktop).

---

## 3. Radius

Tokens réels dans `base.css` :

| Token | Valeur | Usage |
|---|---|---|
| `--r` | 12px | Boutons, inputs, badges, petits éléments |
| `--rl` | 18px | Cards standard, panels |
| `--rx` | 24px | Cards premium (coffres, hero), modals |
| — | `999px` | Avatars, pills, FAB (pas de token dédié) |

---

## 4. Shadows (mobile-first, sobres)

Tokens réels dans `base.css` :

```css
--s0: 0 1px 3px rgba(11,13,26,.05);                                      /* micro — focus rings */
--s1: 0 2px 10px rgba(11,13,26,.07), 0 1px 3px rgba(11,13,26,.04);      /* cards standard */
--s2: 0 6px 22px rgba(11,13,26,.09), 0 2px 8px rgba(11,13,26,.05);      /* FAB, popovers */
--s3: 0 14px 40px rgba(11,13,26,.13), 0 4px 12px rgba(11,13,26,.07);    /* modals, drawers */
--s4: 0 28px 60px rgba(11,13,26,.17), 0 8px 22px rgba(11,13,26,.08);    /* full overlays */
```

Dark mode : alphas majorés automatiquement via `[data-theme="dark"]` dans `base.css`.

Bouton 3D Duo-style (définis dans `base.css`) :
```css
--s-btn-rest:   0 4px 0 0 var(--adk);   /* ombre solide au repos */
--s-btn-active: 0 1px 0 0 var(--adk);   /* ombre écrasée au clic */
```

---

## 5. Typography

Fichier référence : variables `--fd` / `--fb` / `--fn` dans `base.css`.

| Usage | Font | Taille | Weight | Letter-spacing |
|---|---|---|---|---|
| Hero display | Nunito | `clamp(48px,12vw,80px)` | 900 | -.03em |
| Page H1 | Nunito | 22-28px | 800 | -.02em |
| Section title | Nunito | 18-20px | 700 | -.01em |
| Body | Nunito | 14-16px | 600 | 0 |
| Label uppercase | Nunito | 11-12px | 800 | .06-.10em |
| Mono / stats | JetBrains Mono | 18-22px | 700 | 0 |

Stack font : `--fd / --fb : 'Nunito', 'Plus Jakarta Sans', -apple-system, sans-serif`
Mono : `--fn : 'JetBrains Mono', 'IBM Plex Mono', 'SF Mono', Menlo, monospace`

---

## 6. Motion (Loi 3)

### Quand animer (rare = récompense)

| Trigger | Animation | Durée | Easing |
|---|---|---|---|
| Unlock coffre | shake → crack → light burst → reveal | 1800ms | `cubic-bezier(.22,1,.36,1)` |
| Gain XP | counter increment + glow chip | 800ms | `ease-out` |
| Validation compétence | scale 0.95→1.05→1 + halo vert | 600ms | `--ease-bounce` |
| Streak milestone | flame pulse + haptic | 1200ms | `ease-in-out` |
| Page enter | slide-up 12px + fade | 200ms | `var(--t)` |
| Toast | slide-down + fade | 160ms | `var(--t)` |
| Skeleton shimmer | gradient sweep | 1400ms loop | `ease-in-out` |

Easing bouncy (actions positives uniquement) : `--ease-bounce: cubic-bezier(.5,1.8,.5,1)` défini dans `base.css`.

### Quand NE PAS animer

- Hover desktop (mobile-first, hover ne sert à rien)
- Float perpétuel sur des cards statiques
- Fade-in sur chaque card d'une liste
- Bounce sur boutons standards (réservé aux confirmations positives)
- Parallax scroll
- Animations "pour faire premium" sans signification

### Haptic mobile

| Event | Pattern (`navigator.vibrate`) |
|---|---|
| Tap CTA primaire | `[10]` |
| Succès léger | `[30]` |
| Succès majeur (validation, level up) | `[60, 40, 80]` |
| Streak milestone | `[50, 80, 50, 80, 50]` |
| Erreur | `[150, 60, 150]` |

---

## 7. Empty states (Loi 7)

Format obligatoire :

```
[ Illustration ~140px ]
[ Titre 18px bold ]
[ Body 14px mu, max 280px ]
[ CTA optionnel (sortir du vide) ]
```

Chaque vide doit donner une **direction** (que faire maintenant ?) et une **émotion** (calme, pas anxiogène).

Illustrations centralisées dans `/public/skins/empty-states/`.

---

## 8. Composants standards

### Card

```css
background: var(--su);
border: 1px solid var(--bo);
border-radius: var(--rl);     /* 18px */
padding: 16px;
box-shadow: var(--s1);
transition: transform var(--t), box-shadow var(--t);
```

Tap state : `transform: scale(.98)` (pas `.95`, trop agressif).

### Button primary (CTA Duo-style)

```css
height: 48px;
padding: 0 24px;
border-radius: var(--r);           /* 12px */
background: var(--a);              /* #58CC02 Duo green */
color: var(--ink);                 /* #0b0d1a — WCAG AA 5.4:1 ✓ */
font: 800 15px var(--fd);
box-shadow: var(--s-btn-rest);     /* 0 4px 0 0 var(--adk) */
transition: transform var(--t), box-shadow var(--t);
```

`:active` → `transform: translateY(3px); box-shadow: var(--s-btn-active);`

Minimum touch target : **44×44px** (Apple HIG).

> ⚠️ `color: #fff` sur fond `var(--a)` (#58CC02) = rapport 2.05:1 — échec WCAG AA. Utiliser `color: var(--ink)` obligatoire sur tous les éléments avec `background: var(--a)`.

### Chip / Badge

```css
height: 24px;
padding: 0 8px;
border-radius: var(--r);
font: 700 11px var(--fd);
letter-spacing: .08em;
text-transform: uppercase;
```

---

## 9. Persona-specific (Loi 10)

### Élève — Duolingo × Clash Royale × Apple Health

- **Couleurs vives** sur récompenses (jaune/orange/violet)
- **Animations marquantes** sur unlock (coffres, badges)
- **Streak visible** partout (flamme + nombre de jours)
- **XP/Niveau** dans la nav (toujours rappeler la progression)
- **Tone** : encourageant, ludique, jamais infantilisant

### Moniteur — Uber Driver × Linear × Apple

- **Sobre, dense** : beaucoup d'info en peu d'espace
- **Couleurs neutres** (gris, blanc, bleu froid)
- **1-tap actions** : valider, log session, contacter élève
- **Pas de gamification** apparente (ranking caché dans Insights)
- **Tone** : pro, factuel, efficace

### Gérant — Tesla cockpit × Bloomberg × Notion analytics

- **Dark mode par défaut** sur cockpit (immersif)
- **KPI grands** + sparklines minimalistes
- **Couleur = donnée** (vert = positif, rouge = alert, jaune = warn)
- **Densité maximale** (pas de "beau gradient sans data")
- **Tone** : analytique, brut, sans bullshit

---

## 10. Anti-patterns (à fuir absolument)

- ❌ Hex en dur dans `style=` ou dans des fichiers CSS autres que `src/styles/base.css`
- ❌ `margin: 7px` (hors échelle 4)
- ❌ Animation gratuite sur element non interactif
- ❌ Empty state vide (juste "Rien à afficher")
- ❌ Bouton < 44×44px touch target
- ❌ Texte gris sur gris (contraste WCAG AA mini 4.5:1)
- ❌ `color: #fff` sur fond `var(--a)` (#58CC02) — contraste 2.05:1 insuffisant
- ❌ Modal qui se ferme au tap background sans confirmation pour action destructive
- ❌ Toast > 3 secondes (max 2.5s sauf erreur critique)
- ❌ Composant > 400 lignes — split en sous-composants
- ❌ Emoji en remplacement définitif d'asset visuel (toujours fallback acceptable)

---

## Maintenance

- À chaque nouveau token visuel : l'ajouter dans `src/styles/base.css` ET ici **avant** de coder
- Audit trimestriel : grep `style=` pour repérer les couleurs hardcodées qui ont échappé
- Ce fichier est versionné dans le repo (`/permigo-game/design-system/permigo-laws.md`)
