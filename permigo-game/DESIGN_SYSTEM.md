# DESIGN_SYSTEM.md — Système de design

## 🎨 Palette de couleurs

### Couleurs principales

```css
:root {
  /* Primary brand */
  --indigo-primary: #6366f1;
  --violet-accent: #8b5cf6;
  --cyan-bright: #06b6d4;

  /* Backgrounds */
  --bg-dark: #0a0d1a;        /* fond principal */
  --bg-glass: rgba(255,255,255,.04); /* glassmorphism */

  /* Sémantique */
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #3b82f6;

  /* Texte */
  --text-primary: #ffffff;
  --text-secondary: rgba(255,255,255,.72);
  --text-muted: rgba(255,255,255,.5);

  /* Bordures */
  --border-default: rgba(255,255,255,.08);
  --border-hover: rgba(255,255,255,.16);
  --border-focus: rgba(165,180,252,.4);
}
```

### Mesh gradient (fond signature)

Réutilise le composant `mesh-bg.js` :
- 6 blobs colorés flous (indigo, violet, cyan, sky, emerald, fuchsia)
- Mouvement organique 30-45s
- Filtre blur 90px (60px sur mobile)
- Opacity .5

### Couleurs sémantiques par contexte

| Contexte | Couleur | Usage |
|---|---|---|
| Streak chaud | `#f59e0b` orange | Flames 🔥, jours d'affilée |
| Compétence acquise | `#10b981` vert | Badge ✓, animations succès |
| À retravailler | `#f59e0b` orange | Alerte douce |
| Verrouillé | `rgba(255,255,255,.3)` gris | Cadenas, indispo |
| Gemmes | `#a78bfa` violet pastel | Compteur, boutique |
| Vies | `#ef4444` rouge | Cœurs, restantes |

## ✍️ Typographie

### Familles de polices

```css
:root {
  --font-display: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'IBM Plex Mono', 'SF Mono', Monaco, monospace;
}
```

### Hiérarchie

| Élément | Police | Taille | Weight | Letter-spacing |
|---|---|---|---|---|
| Titre principal (h1) | Display | 32-48px | 900 | -.025em |
| Titre section (h2) | Display | 22-28px | 800 | -.02em |
| Sous-titre (h3) | Display | 18-20px | 700 | -.01em |
| Texte corps | Body | 14-15px | 400-500 | 0 |
| Petit texte | Body | 11.5-12.5px | 600 | 0 |
| Chiffres / KPIs | Mono | 24-44px | 700 | -.02em |
| Label / Caps | Mono | 10-11px | 800 | 1.5px |

### Règles d'usage

- **Display** : tout ce qui est titre + accroches + chiffres importants
- **Body** : texte courant, descriptions, paragraphes
- **Mono** : chiffres, scores, durées, données techniques (donne un côté "data viz")
- **JAMAIS** : Times, Georgia, Arial (interdits, ringards)

## 🖼 Composants visuels signature

### Cards (glassmorphism)

```css
.card {
  background: rgba(255,255,255,.05);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 14px;
  box-shadow: 0 8px 32px -8px rgba(0,0,0,.4);
}
```

### Boutons primaires

```css
.btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  padding: 14px 24px;
  border-radius: 12px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 14.5px;
  letter-spacing: .3px;
  box-shadow: 0 8px 24px -4px rgba(99,102,241,.55);
  transition: transform .15s, box-shadow .25s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -4px rgba(99,102,241,.7);
}
```

### Animations standard

| Animation | Durée | Easing |
|---|---|---|
| Pop modal | 350ms | cubic-bezier(.34,1.56,.64,1) |
| Fade in/out | 200ms | ease |
| Reveal trophy | 1500ms | cubic-bezier(.175,.885,.32,1.275) |
| Slide-up page | 400ms | ease-out |
| Streak count up | 1200ms | ease-out |
| Confetti | 1800ms | cubic-bezier(.2,.8,.4,1) |

## 🎵 Sons (à acheter ou créer)

Tous les sons sont stockés dans `public/sounds/`.

| Fichier | Usage | Durée |
|---|---|---|
| `ding-success.mp3` | Réponse correcte au quiz | 0.3s |
| `error-soft.mp3` | Réponse incorrecte (gentil, pas punitif) | 0.4s |
| `streak-up.mp3` | Streak augmenté de 1 | 0.6s |
| `reveal-trophy.mp3` | Trophée débloqué | 1.2s |
| `gentle-tap.mp3` | Sélection chip / option | 0.15s |
| `whoosh-trans.mp3` | Transition entre écrans | 0.5s |
| `level-up.mp3` | Nouveau niveau ou monde | 1.5s |
| `notif-soft.mp3` | Notif intra-app subtile | 0.4s |

**Règles** :
- Volume max 60% par défaut (réglable)
- Désactivables dans le profil utilisateur
- Pas de bruits agressifs / criards
- Cohérence : tous les sons doivent paraître appartenir à la même "famille" sonore

## 🎯 Iconographie

### Bibliothèque
- **SVG inline** (pas de Font Awesome, pas de bibliothèque externe)
- Style : line icons 2px stroke, coins arrondis
- Tailles standard : 16px / 20px / 24px / 32px

### Emojis (usage limité)
Seulement quand ça apporte une vraie valeur visuelle. Maximum 1-2 par écran. **Pas dans les titres.**

Liste validée :
- 🔥 streak / chaud
- ✓ acquis
- 💎 gemmes
- ❤️ vies
- 🎉 célébration (animations seulement)
- 🏆 trophée (jamais en titre)

**Interdit** :
- 😀 😃 😄 (trop enfantin)
- 🚗 🛣 (cliché auto-école)
- ⚡ 🔥 dans les titres (startup bullshit)
- Emojis colorés natifs Apple en gros (toujours en SVG si possible)

## 🗣 Tone of voice (copy)

### Personnalité de la marque

| Adjectif | Pourquoi |
|---|---|
| **Sérieux** | On parle d'un permis légal, pas d'un jeu vidéo |
| **Chaleureux** | L'élève est anxieux, on le rassure |
| **Direct** | Phrases courtes, pas de blabla |
| **Honnête** | Si l'élève bug, on dit pourquoi |
| **Encourageant** | Mais sans flatter ("bien joué" pas "EXCEPTIONNEL!!!") |

### Règles de copy

**OUI** :
- ✅ "Tu as validé 12 compétences"
- ✅ "Petit rappel sur les giratoires ?"
- ✅ "Bravo, score 3/3"
- ✅ "Compétence à retravailler — on s'y remet ?"

**NON** :
- ❌ "WOW INCROYABLE !!! 🤩🎉"
- ❌ "Réinventez votre auto-école !"
- ❌ "Disruptez le permis !"
- ❌ "L'IA révolutionnaire qui..."

### Tutoiement / vouvoiement

- **Élève** : tutoiement (jeune, contexte ludique)
- **Enseignant** : tutoiement (collègues)
- **Gérant** : vouvoiement (relation pro)

### Longueur des messages

- Titres : 5-8 mots max
- Boutons : 2-4 mots max
- Notifs push : 60 caractères max
- Toast : 1 ligne, 80 caractères max
- Modal description : 2 phrases max

## 📐 Espacements & layout

### Grille mobile

```
viewport iPhone 14 Pro: 393×852
padding latéral standard: 14-18px
safe area top: 47px (notch)
safe area bottom: 34px (home indicator)
```

### Spacing scale (multiples de 4)

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Border-radius scale

```css
--radius-sm: 6px;     /* badges, chips */
--radius-md: 11px;    /* boutons, inputs */
--radius-lg: 14px;    /* cards */
--radius-xl: 18px;    /* modals */
--radius-2xl: 22px;   /* hero cards */
--radius-full: 99px;  /* pills, avatars */
```

## 🎬 Composants déjà codés (réutilisables)

Voici les composants déjà fonctionnels qu'on importe depuis l'ancien projet :

| Composant | Fichier | Usage |
|---|---|---|
| Mesh background | `components/mesh-bg.js` | Fond animé 6 blobs |
| Reward reveal | `components/reward-reveal.js` | Animation trophée débloqué |
| Alert card | `components/alert-card.js` | Alerte obligatoire (livret, notation) |
| Avatar modal | `components/avatar-modal.js` | Boutique avatars avec gemmes |
| Stacked cards | `components/stacked-cards.js` | Choix entre options visuelles |
| Toast | `components/toast.js` | Notification éphémère |
| Notif bell | `components/notif-bell.js` | Cloche avec badge non lus |
| Date picker | `components/date-time-picker.js` | (NON UTILISÉ ICI, on a pas de planning) |
| Lamp section | `components/lamp-section.js` | Hero section type Aceternity |
| Confetti | `components/confetti.js` | Particles célébration |
| Cosmos bg | `components/cosmos-bg.js` | Starfield parallax (option) |

## 📱 Responsive

### Breakpoints

```css
/* Mobile first par défaut */
@media (min-width: 560px) { /* phablet */ }
@media (min-width: 720px) { /* tablet */ }
@media (min-width: 920px) { /* desktop small */ }
@media (min-width: 1200px) { /* desktop */ }
```

### Touch targets

- **Min 44×44px** pour tout élément cliquable (iOS guideline)
- **Min 8px de gap** entre 2 targets

### Tests obligatoires

- iPhone SE (375×667) — le plus petit
- iPhone 14 Pro (393×852) — le standard
- iPad Mini (768×1024) — le plus large
- iPhone Pro Max (430×932) — le plus haut

## 🌗 Dark mode

PermiGo est en **dark mode par défaut** (l'app s'utilise souvent le soir, surtout par les élèves jeunes).

Pas de light mode pour V1. Peut-être V2 si demande utilisateur.

## ⚡ Performance

- **First Contentful Paint** : < 1.5s
- **Time to Interactive** : < 3s
- **Lighthouse mobile** : > 85

### Optimisations clés
- Lazy load des images / vidéos
- Pas de polices > 100kb
- CSS scopé inline dans chaque page (évite cascading)
- Service Worker pour PWA + offline basique
- Compression Brotli sur Vercel

## ♿️ Accessibilité (WCAG AA minimum)

- Contraste texte/fond ≥ 4.5:1
- Tab navigation fonctionnelle
- ARIA labels sur tout élément interactif
- `aria-live="polite"` sur les toasts
- Skip link "Aller au contenu principal"
- `prefers-reduced-motion` respecté (anime moins si user a configuré)

## 🎨 Pour Claude Code — règle d'or

> **Quand tu codes un nouvel écran, tu DOIS d'abord regarder si un composant équivalent existe dans `src/components/`. Réutiliser > recoder.**

Si tu refais un mesh-bg ou un reward-reveal alors qu'il existe → tu détruis le projet.
