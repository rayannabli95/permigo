# 02 — Spec de refonte · Côté élève · PermiGo

> Référence : `01-audit-statique.md`. Stack imposée : vanilla JS (ES modules), Vite, Supabase, hash router. Zéro React/TS. Tutoiement systématique. WCAG 2.2 AA.
>
> Microcopy : impératif tutoyé (référence Duolingo FR / Ornikar). Tout composant interactif ≥ 44×44. Toute animation a sa variante `prefers-reduced-motion`.

---

## Design system minimal

### Tokens couleur

```css
:root {
  /* Marque */
  --pg-primary:        #5145e0;   /* violet AA-safe, ratio 5.9:1 sur blanc */
  --pg-primary-600:    #6366f1;   /* accent clair, GRAND texte / fonds only */
  --pg-primary-700:    #4338ca;   /* hover */
  --pg-gold:           #f5c518;   /* récompenses */
  --pg-glow-cyan:      #4fd1ff;   /* magie / FX */

  /* Surfaces */
  --su:   #ffffff;
  --bg:   #f7f7fb;
  --bg2:  #eef0f6;
  --bo:   #e2e5ee;

  /* Texte */
  --tx:   #0b0d1a;   /* 16.8:1 */
  --mu:   #475569;   /* 7.5:1 */
  --mu2:  #64748b;   /* 4.8:1, mini AA texte normal */

  /* États */
  --gr:   #16a34a;
  --rd:   #dc2626;
  --am:   #b45309;   /* ambre AA sur surfaces claires (≥4.5:1) */

  /* Échelle z-index (T2 audit) */
  --z-base:    1;
  --z-sticky:  50;
  --z-nav:     300;
  --z-overlay: 800;
  --z-modal:   900;
  --z-toast:   1000;  /* toujours au-dessus */
}
```

Règle contraste : `--pg-primary-600` (#6366f1) **interdit** pour du texte normal sur blanc (4.05:1). Réservé aux fonds, gros titres ≥24px, et FX. Texte courant violet → `--pg-primary` (#5145e0).

### Échelle typo (mobile-first)

| Rôle | font |
|---|---|
| h1 | 28 / 700 / 1.2 |
| h2 | 22 / 600 / 1.3 |
| h3 | 18 / 600 / 1.4 |
| body | 16 / 400 / 1.5 |
| caption | 13 / 500 / 1.4 |

### Spacing & forme

- Spacing : `4 · 8 · 12 · 16 · 24 · 32 · 48`
- Radius : `sm 8 · md 12 · lg 16 · pill 999`
- Shadows : `sm 0 1px 3px rgba(11,13,26,.08)` · `md 0 6px 16px -4px rgba(11,13,26,.12)` · `lg 0 16px 40px -8px rgba(11,13,26,.2)`

### Composants normés

- **Card** : radius lg, shadow sm, padding 16. Pas de titre en `<div>` → `<h2>`/`<h3>`.
- **Bouton** : `min-height: 44px; min-width: 44px; padding: 12px 20px;`. Icônes = SVG `stroke`, jamais emoji.
- **Modal** : centrée, `backdrop-filter: blur(8px)`, `aria-modal="true"`, focus trap, `Escape` ferme. `z-index: var(--z-modal)`.
- **Toast** : `z-index: var(--z-toast)`, ancré au-dessus de la nav, jamais sur un CTA actif.
- **Empty state** : icône + titre `<h2>` + 1 phrase tutoyée + 1 CTA.
- **Error state** : message + bouton « Réessayer » (listener, pas `onclick` inline).
- **Skeleton** : 3 cards max, animation gardée `prefers-reduced-motion`.
- **Tab bar** : 4 onglets max, target 44, indicateur actif.

### Garde animation globale (à poser dans `base.css`)

```css
@media (prefers-reduced-motion: reduce) {
  #app *, #app *::before, #app *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
```

---

## accueil.js — REFONTE

### Avant
- Hero avec badge niveau qui déborde, bouton notif 36px.
- Classement « #1 sur 0 élève » possible.
- Toast de gel qui chevauche le bouton réactivé.

### Après
- Hero : badge niveau dans un conteneur `max-width` + `overflow: clip`. Bouton notif 44×44.
- Classement : empty state tutoyé quand `total <= 1`.
- Gel : sur erreur, le bouton **reste désactivé 2s** + toast au-dessus de la nav (pas de co-visibilité avec le CTA).

### Microcopy

| Avant | Après |
|---|---|
| `Tu es #1 sur 0 élève` | `Tu ouvres le classement de ton école. Invite tes potes 👀` |
| `Impossible de geler la série` | `Pas assez de gemmes pour geler ta série. Il t'en faut 50 💎` |
| `Classement de l'école` | `Ton école n'a pas encore de classement. Reviens vite` |

### Composants impactés
Hero badge (clamp largeur), `.acc2-hero-notif-btn` (44×44), bloc `<style>` (garde reduced-motion), toast (z-index).

### Animations
`next-glow`, `next-pop`, `stagger`, `.qa-btn::before` → enveloppés `prefers-reduced-motion`.

---

## parcours.js — REFONTE

### Avant
- Header sticky (z 50) recouvre `.prc-global-bar` (sans z) au scroll.
- Badge « CARTE D'APPRENTISSAGE » recouvre visuellement le contenu.

### Après
- `.prc-global-bar` reçoit `position: relative; z-index: var(--z-sticky)` + 1 (au-dessus du header) **ou** le header passe sous la barre. Barre toujours lisible.
- Badge en flux normal ou `z-index` aligné, sans recouvrement.

### Microcopy
Aucun « vous » présent. RAS.

### Composants impactés
`.prc-hd`, `.prc-global-bar`, `.prc-map-badge`. 40 animations → garde globale.

### Animations
`portal-pulse`, reveals, unlock cinematic → garde reduced-motion (via la règle globale `base.css`).

---

## quiz.js + examen.js + exam-blanc.js — REFONTE

### Avant
- Titre examen en `<div>` (examen).
- Bottom nav visible pendant quiz/examen/exam-blanc (z 300, jamais démontée).

### Après
- Titre en `<h1>` réel (focus router + lecteurs d'écran).
- **Masquage nav** : `document.getElementById('bottom-nav')?.setAttribute('hidden','')` au `mount` du quiz/examen, restauration au démontage / fin. Plein écran d'épreuve, anti-triche.
- `.qp-result-card` / `.exam-card` : garde reduced-motion + suppression des `animation-delay` résiduels.

### Microcopy

| Avant | Après |
|---|---|
| `Mon examen B` | `Ton examen blanc` (cohérence tutoiement, titre `<h1>`) |

### Composants impactés
Header sticky quiz/examen, bouton « Suivant » (44×44, visible sous le sticky via `padding-top`), `#bottom-nav` (hidden pendant l'épreuve).

---

## trophees.js — REFONTE

### Avant
- Bouton « Partager 🔗 » emoji brut.
- Titres modal en `<div>`.
- Confetti sans garde motion.

### Après
- Bouton « Partager » + **icône SVG share** (cohérence iconographie SVG de la nav). Partage Web Share API si dispo, sinon copie lien.
- Titres modal en `<h2>`.
- `burstConfetti` gardé : `if (!matchMedia('(prefers-reduced-motion: reduce)').matches) burstConfetti(...)`.

### Microcopy

| Avant | Après |
|---|---|
| `Partager 🔗` | `Partager` (+ icône SVG) |
| `Continue pour débloquer plus de trophées !` | `Continue, d'autres trophées t'attendent 🏆` |

### Composants impactés
`.tr2-modal-share`, `.tr2-modal-title`, déclenchement confetti.

---

## galerie.js + wrapped.js — DÉCISION D'EXPOSITION

### Avant
Deux pages complètes, **zéro entrée UI** (routes mortes).

### Après — deux options, à trancher par Rayan
1. **Exposer** : ajouter un point d'entrée.
   - `galerie` → bouton « Galerie » dans `profil.js` (section collection) ou onglet dédié.
   - `wrapped` → carte « Ton Wrapped » sur `accueil.js` (saisonnier) + lien profil.
2. **Retirer** : supprimer route + fichier (dette).

Spec si exposition retenue : tuiles d'accès depuis profil, target 44, titre `<h1>` dans le conteneur de contenu (corrige le titre isolé de `wrapped.js`).

### Wrapped — correctif titre
Le `<h1>` « Mon Wrapped » doit vivre **dans** `.wrp` (même hiérarchie que `#wrp-root`), pas en sibling.

---

## boutique.js — REFONTE

### Avant
- Solde gemmes oscille (deux chemins d'écriture).
- Badges rareté tronqués « C… ».
- Previews thèmes identiques.
- Bouton prix 32px.

### Après
- **Source unique du solde** : après achat, relire `result.new_balance` via un seul helper `applyPurchaseResult(result)`, fallback `gemmes - cost`, et un seul `renderGems()`. Les deux call-sites appellent ce helper.
- Badges rareté : largeur auto, pas d'ellipsis. Couleurs par rareté (Commun gris, Rare bleu, Épique violet, Légendaire or).
- Previews thèmes : visuels distincts (cf. `04-prompts-gpt-images.md`), pas la même image.
- État « équipé » : badge « Équipé » + libellé « Avatar actif sur ton profil et le classement ».
- `.bo2-price-btn` → 44px.

### Microcopy

| Avant | Après |
|---|---|
| `C...` / `R...` | `Commun` / `Rare` / `Épique` / `Légendaire` |
| (état flou) | `Équipé · visible sur ton profil` |

### Composants impactés
Helper solde, `.bo2-rarity-pill`, `.bo2-price-btn`, carte preview thème.

---

## mes-coffres.js — REFONTE

### Avant
- Bouton « Ouvrir » 36px.
- Pas d'explication de déblocage.

### Après
- Bouton « Ouvrir » 44px.
- Coffre verrouillé : libellé « Termine le Monde {N} pour débloquer ce coffre » + progression `{done}/{total}`.
- Pattern Clash Royale : anticipation (coffre fermé visible) + déblocage à la complétion de monde.

### Microcopy

| Avant | Après |
|---|---|
| (silence) | `Termine le Monde 2 pour débloquer ce coffre 🎁` |

---

## feedback.js — REFONTE

### Avant
Logique d'erreur fragile (skeleton ré-apparaît au 2ᵉ échec).

### Après
Flag d'état `phase = 'loading' | 'loaded' | 'error'`. Sur erreur : `phase='error'`, rendu d'un error state (message + « Réessayer » via listener). Le skeleton n'est jamais ré-affiché une fois `phase !== 'loading'`.

### Microcopy

| Avant | Après |
|---|---|
| (skeleton figé) | `On n'a pas pu charger tes retours. Réessaie 👇` |

---

## mes-coffres / session-confirmation — touch & badges

- `session-confirmation.js` : tutoiement déjà propre. Badge « non lues » : marqueur visuel (pastille), mais le compteur réel vit dans `common/notifications.js` (hors périmètre élève strict — à traiter séparément).
- Badge `.fb-badge` (28px) : agrandir la zone tactile à 44 via `::before` invisible si le badge reste petit visuellement.

---

## profil.js — REFONTE (page partagée)

### Avant
- Titres de bloc en `<div>` (`.prf-annee-ttl:506`, `.prf-ref-ttl:615`).
- Logo contraste 4.05:1.
- Bloc parrainage coupé par la nav.

### Après
- `.prf-annee-ttl` et `.prf-ref-ttl` → `<h2>` (style conservé via la classe).
- Logo `--pg-primary` (#5145e0) pour le texte, gradient réservé au grand format.
- `.prf` (conteneur page) : `padding-bottom: calc(60px + env(safe-area-inset-bottom) + 16px)`.
- Note : le rendu profil est déjà conditionné par `me.role === 'eleve'` (383/400/446). **Comportement moniteur inchangé.**

### Microcopy
Tutoiement déjà appliqué. RAS sur le texte ; correctif structurel/contraste uniquement.

### Composants impactés
`.pr-sec-h` (heading), `.pg-logo-txt` (couleur), `.prf-wrap` (padding nav), rendu conditionnel lien moniteur.

---

## Frameworks appliqués (rappel d'intention, pas de jargon dans l'UI)

- **Hook Model** par page : Accueil = trigger (notif streak) → action (CTA leçon) → reward (XP/coffre) → investment (série).
- **Anti-démotivation classement** (Hamari 2014) : empty state encourageant + classement intra-école (déjà le cas), pas de global brut.
- **Loss Avoidance** : streak + gel, microcopy claire sur le coût (50 💎).

Fin de la spec. Patches : `03-patches.md`.
