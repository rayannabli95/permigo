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
10. **ADN par persona** — Élève (Duolingo×Clash Royale×Apple Health) · Moniteur (Uber Driver×Linear×Apple) · Gérant (Tesla×Bloomberg×Notion)

---

## 1. Tokens fondamentaux

### Couleurs sémantiques (CSS vars, jamais hex en dur dans le code)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#fafafa` | `#0a0a0c` | Background page |
| `--bg2` | `#f4f4f5` | `#111114` | Background secondaire (skeletons, headers) |
| `--su` | `#ffffff` | `#161618` | Surface card |
| `--bo` | `#e5e7eb` | `#222226` | Border subtle |
| `--ink` | `#0f172a` | `#fafafa` | Texte principal |
| `--mu` | `#64748b` | `#a1a1aa` | Texte secondaire |
| `--mu2` | `#94a3b8` | `#71717a` | Texte tertiaire (labels uppercase) |
| `--pri` | `#6366f1` | `#818cf8` | Accent primaire PermiGo |
| `--ok` | `#10b981` | `#34d399` | Succès |
| `--err` | `#ef4444` | `#f87171` | Erreur |

**Règle absolue** : aucune couleur hardcodée dans `style=`. Toujours `var(--token)`.

### Couleurs émotionnelles (récompenses, gamification)

| Émotion | Token | Quand |
|---|---|---|
| Légendaire | `linear-gradient(135deg, #a855f7, #581c87)` | Coffres monde 4, trophées 31/31, milestones >800 XP |
| Or / Excellence | `linear-gradient(135deg, #facc15, #a16207)` | Coffres monde 3, quiz parfaits, streaks >14j |
| Argent / Progression | `linear-gradient(135deg, #94a3b8, #475569)` | Coffres monde 2, paliers intermédiaires |
| Bronze / Démarrage | `linear-gradient(135deg, #d97706, #7c2d12)` | Coffres monde 1, premiers trophées |
| Streak / Feu | `linear-gradient(135deg, #fb923c, #dc2626)` | Streak, flammes, urgence positive |
| Calme / Confiance | `linear-gradient(135deg, #6366f1, #4338ca)` | Validation compétence, sérénité élève |

### Rareté (catalog items)

| `rarity` | Label | Couleur | Glow |
|---|---|---|---|
| `commun` | Commun | `#475569` | aucune |
| `rare` | Rare | `#1d4ed8` | `rgba(59,130,246,.3)` subtle |
| `epique` | Épique | `#7c3aed` | `rgba(168,85,247,.4)` modéré |
| `legendaire` | Légendaire | `#facc15→#ec4899` | pulse animé `rgba(168,85,247,.55)` |

---

## 2. Spacing & rythme

Échelle 4px. Aucune valeur exotique (pas de `7px`, pas de `13px`).

| Token | Valeur | Usage |
|---|---|---|
| `--sp-1` | 4px | Détails fins |
| `--sp-2` | 8px | Gap intra-card |
| `--sp-3` | 12px | Gap entre items |
| `--sp-4` | 16px | Padding card / margin section |
| `--sp-5` | 24px | Margin block |
| `--sp-6` | 32px | Margin entre sections majeures |
| `--sp-7` | 48px | Hero / respiration premium |
| `--sp-8` | 64px | Empty state breathing |

**Container max-width mobile** : `480px` toujours (jamais full-width sur desktop).

---

## 3. Radius

| Token | Valeur | Usage |
|---|---|---|
| `--r-sm` | 8px | Chips, badges, pills |
| `--r-md` | 12px | Inputs, small cards |
| `--r-lg` | 16px | Cards standard |
| `--r-xl` | 20px | Cards premium (coffres, hero) |
| `--r-2xl` | 28px | Modals, bottom sheets |
| `--r-full` | 9999px | Avatars, FAB, ronds parfaits |

---

## 4. Shadows (mobile-first, sobres)

```css
--sh-1: 0 1px 2px rgba(0,0,0,.06);            /* élévation 1 — chips */
--sh-2: 0 2px 8px rgba(0,0,0,.08);            /* élévation 2 — cards */
--sh-3: 0 8px 24px rgba(0,0,0,.12);           /* élévation 3 — FAB, modals */
--sh-glow: 0 0 24px 4px rgba(168,85,247,.4); /* légendaire pulse */
```

Dark mode : remplacer alpha par `rgba(0,0,0,.4)` → `rgba(0,0,0,.5)`.

---

## 5. Typography

| Usage | Font | Taille | Weight | Line | Letter-spacing |
|---|---|---|---|---|---|
| Hero display | `Plus Jakarta Sans` | `clamp(56px,14vw,88px)` | 800 | 1 | -.04em |
| Page H1 | `Plus Jakarta Sans` | 22-28px | 700 | 1.15 | -.02em |
| Section title | `Plus Jakarta Sans` | 18-20px | 700 | 1.2 | -.01em |
| Body | `Inter` | 14-16px | 500 | 1.5 | 0 |
| Label uppercase | `Inter` | 11-12px | 700 | 1 | .08-.12em |
| Mono / stats | `IBM Plex Mono` | 18-22px | 700 | 1 | 0 |

Stack fallback systématique : `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`.

---

## 6. Motion (Loi 3)

### Quand animer (rare = récompense)

| Trigger | Animation | Durée | Easing |
|---|---|---|---|
| Unlock coffre | shake → crack → light burst → reveal | 1800ms | `cubic-bezier(.22,1,.36,1)` |
| Gain XP | counter increment + glow chip | 800ms | `ease-out` |
| Validation compétence | scale 0.95→1.05→1 + halo vert | 600ms | `cubic-bezier(.34,1.56,.64,1)` spring |
| Streak milestone | flame pulse + haptic | 1200ms | `ease-in-out` |
| Page enter | slide-up 16px + fade | 280ms | `ease-out` |
| Toast | slide-down + fade | 220ms | `ease-out` |
| Skeleton shimmer | gradient sweep | 1400ms loop | `ease-in-out` |

### Quand NE PAS animer

- Hover desktop (mobile-first, hover ne sert à rien)
- Float perpétuel sur des cards statiques
- Fade-in sur chaque card d'une liste
- Bounce sur boutons standards
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
border: 1.5px solid var(--bo);
border-radius: var(--r-xl);  /* 20px */
padding: var(--sp-4);         /* 16px */
box-shadow: var(--sh-2);
transition: transform .12s ease, box-shadow .2s ease;
```

Tap state : `transform: scale(.98)` (pas `.95`, trop agressif).

### Button primary (CTA)

```css
height: 48px;
padding: 0 24px;
border-radius: var(--r-full);
background: var(--pri);
color: #fff;
font: 700 15px 'Inter';
box-shadow: var(--sh-2);
```

Minimum touch target : **44×44px** (Apple HIG).

### Chip / Badge

```css
height: 24px;
padding: 0 8px;
border-radius: var(--r-sm);
font: 700 11px 'Inter';
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

- ❌ Hex en dur dans `style=`
- ❌ `margin: 7px` (hors échelle 4)
- ❌ Animation gratuite sur element non interactif
- ❌ Empty state vide (juste "Rien à afficher")
- ❌ Bouton < 44×44px touch target
- ❌ Texte gris sur gris (contraste WCAG AA mini 4.5:1)
- ❌ Modal qui se ferme au tap background sans confirmation pour action destructive
- ❌ Toast > 3 secondes (max 2.5s sauf erreur critique)
- ❌ Composant > 400 lignes — split en sous-composants
- ❌ Emoji en remplacement définitif d'asset visuel (toujours fallback acceptable)

---

## Maintenance

- À chaque nouveau token visuel : l'ajouter ici **avant** de coder
- Audit trimestriel : grep `style=` pour repérer les couleurs hardcodées qui ont échappé
- Ce fichier est versionné dans le repo (`/permigo-game/design-system/permigo-laws.md`)
