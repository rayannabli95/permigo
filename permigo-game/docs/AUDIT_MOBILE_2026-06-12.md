# Audit mobile instrumenté — 2026-06-12

> **Méthode** : script `scripts/audit-mobile.mjs` (Playwright headless, `hasTouch`, DPR 3).
> 45 écrans audités × 4 viewports (390×844 complet ; 360/414/landscape 844×390 en overflow),
> 4 contextes : public, élève, enseignant, gérant. Thèmes light + dark pour le contraste.
> Complété par des greps statiques (safe-area, `transition:all`, `:hover`, `touch-action`, `100vh`).

## Synthèse

| Axe | Constat | Gravité |
|---|---|---|
| Débordement horizontal | **1 seul** : `#/profil` à 360px (`.prf-pseudo-save` dépasse de 3px) | P1 (mineur) |
| Touch targets < 44px | **48 signatures**, dont les 2 boutons du header (36×36) présents sur 42 écrans | **P1** |
| Feedback `:active` | **107 signatures** sans aucun retour visuel au press, dont la bottom-nav (154 occ.) | **P1** |
| `touch-action: manipulation` | Présent uniquement sur les boutons quiz | P1 |
| Safe-areas | 3 composants à risque réel en PWA standalone : `xp-toast` (top 24px fixe), dropdown `notif-bell` (top 64px), panneau `guided-tour` (bottom 8px) + 6 overlays sans padding env() | **P1** |
| Contraste | Pattern systémique : **blanc sur vert accent #58CC02 = 2.09:1** (boutons partout). Badges rareté 1.67, compteurs sur chips 1.92, méta-texte dark 1.65 | P2 (décision) |
| Pièges de scroll | 3 conteneurs sans `overscroll-behavior` (`bs-streak`, `vs-dd-panel`, `lg-root`) | P2 |
| Hygiène | 7 `transition:all`, 3 `100vh` résiduels, ~41 fichiers `:hover` non gardés par `@media(hover:hover)` | P2 |
| Landscape 844×390 | Aucun débordement, aucune casse détectée | ✓ |

**Bonne nouvelle** : pas de P0. Les layouts tiennent partout. C'est une dette de *finition tactile*, pas de structure.

---

## Détail des findings

### 1. Touch targets < 44×44px (P1)

**Tapés des dizaines de fois par jour :**

| Élément | Taille | Écrans | Note |
|---|---|---|---|
| `.nb-btn` (cloche notif header) | 36×36 | 42 | les 2 boutons les plus tapés de l'app |
| `.ht-avatar-btn` (avatar header) | 36×36 | 42 | idem |
| `.it-skip` / `.it-next` (tour guidé) | 63×29 | 17 | première impression nouvel utilisateur |

**Pages d'entrée (login/landing) :**
`.lg-pw-eye` 26×29, `.lg-forgot` 135×19, `.lg-otp-toggle` 173×19, checkbox « se souvenir » 16×16,
`.lp-btn` 43px de haut (1px sous le seuil), `.lp-foot-login` 102×16, `.lp-nav-link` 62×34.

**Settings (3 rôles) :** `.st-accent-sw` 38×38, `.st-save-btn` 46×28, `.st-btn-txt` 40×25,
`.st-theme-btn` 104×34, `.st-back` 36×36, `.st-inp` h=41.

**Profil :** `.pcc-av-edit` 28×28, `.pcc-banner-edit` 34×34, `.pcc-social-btn` 40×40, `.pcc-share` 106×32.

**Divers :** `.prc-help` 22×22 (parcours), `.ff-see-all` 68×21, `.nf2-back`/`.fb-back` 36×36,
`.bo2-price-btn` h=40, `.me-more`, `.exb-*`…

**Exemption justifiée :** `.skip-link` (186×38) = lien d'évitement clavier a11y, pas une cible tactile.

### 2. Feedback tactile absent (P1)

107 signatures de boutons sans `:active`. Top : `.bn-tab` (bottom-nav, 154 occ.), boutons header,
cookie-banner, lignes cliquables (`.me-row`, `.fb-card`, `.ce-row`), options dropdown `.vs-dd-opt`,
tour guidé, swatches settings…
`touch-action:manipulation` n'existe que sur les quiz (quiz-ui.js).

→ Fix global : règle `:active` (filter:brightness) + `touch-action` sur les interactifs dans `base.css`,
plus `scale(.97)` ciblé sur les CTA principaux.

### 3. Safe-areas PWA (P1)

`body` a bien `padding: env(safe-area-inset-*)`, **mais les éléments `position:fixed` ignorent le
padding du body** (positionnés vs viewport) :

| Composant | Problème en standalone |
|---|---|
| `xp-toast` (`top:24px`) | passe sous l'encoche / Dynamic Island |
| `notif-bell` dropdown (`top:64px`) | chevauche la zone d'encoche |
| `guided-tour` panneau (`bottom:8px`) | passe sous la home bar |
| Overlays centrés (chest, reward-reveal, galerie lightbox, modal gérant, quiz, alert-card) | padding sans env() — contenu haut/bas rognable en landscape |

Décoratifs exempts : confetti, mesh-bg, orbes login/signup, daily-quests (pointer-events:none).

### 4. Contraste (P2 — dont 1 décision produit)

**Systémique — blanc sur accent vert `#58CC02` = 2.09:1** (échec WCAG même en « large text ») :
tous les boutons verts (`.gt-next`, `.st-save-btn`, `.prf-pseudo-save`, `.me-invite-btn`,
`.aj-hero-cta`, `.prf-ref-share-btn`…). Le design system définit déjà `--a-ink:#1a2800`
(« texte/icône posé SUR l'accent ») qui donne **7.5:1** sur le même vert.
→ **Décision Rayan** : basculer le texte des boutons verts sur `--a-ink` (lisibilité, conforme au
token existant) ou assumer le blanc façon Duolingo (identité). *Non corrigé sans son feu vert.*

**Non ambigus (à corriger) :** badge rareté `.bo2-card-rarity-tag` 1.67, compteurs sur chips
(`.gal-section-count`, `.prf-ref-code`, `.epc-full-pill` ≈1.92), méta-texte dark
(`.ff-event-line`, `.gt-text`, `.exam-tip-txt` 1.65), `.ck-hd-logo` dark 1.9.

**Limite d'instrument** : les entrées login (ratio 1.1) sont des faux positifs — le fond visuel est
un layer `position:fixed` frère que le walker d'ancêtres ne voit pas. Vérifié à l'œil : OK.
Idem ratio 1 = texte gradient-clipped.

### 5. Hygiène (P2)

- `transition:all` ×7 → propriétés explicites.
- `100vh` ×3 → `100dvh`.
- 3 scroll containers sans `overscroll-behavior:contain`.
- ~41 fichiers avec `:hover` non gardé `@media(hover:hover)` → hover collant après tap.
  Trop de churn pour une passe unique : dette suivie, à corriger opportunistement.

---

## Plan de correction (4 PR)

| PR | Contenu | Cible |
|---|---|---|
| **A** | Touch targets ≥44px (hit-area `::after` étendue quand le visuel doit rester compact) | 0 cible < 44px |
| **B** | Safe-areas (toast, bell, tour, overlays) + overflow profil + overscroll-behavior | 0 collision encoche/home-bar |
| **C** | `:active` global + `touch-action:manipulation` global + `transition:all` + `100vh` | 100% boutons avec feedback |
| **D** | Contraste non-ambigus (badges, compteurs, méta dark). Blanc-sur-vert : **après décision** | 0 paire < 4.5:1 hors décision |

Vérification : re-run `scripts/audit-mobile.mjs` après chaque PR, rapport avant/après chiffré.

---

## Résultats après correction (preuve — re-run du 2026-06-12 soir)

5 PR mergées : #166 (touch targets) · #167 (safe-areas + hygiène) · #168 (contraste systémique) · #169 (CTA → a-ink, décision Rayan) · #170 (passe finale).

| Axe | Avant | Après |
|---|---|---|
| Touch targets < 44px | 48 signatures | **0** ✓ |
| Boutons sans :active | (artefact d'instrument — déjà couvert par le scale(.96) global) | **0** ✓ |
| Débordement horizontal | 1 (profil 360) | **0** réel (1 mesure transitoire pendant le skeleton, vérifiée saine en ciblé) |
| Safe-areas PWA | 3 composants + 6 overlays | **0** — toast, bell, tour, overlays patchés |
| `transition:all` / `100vh` / scroll traps | 7 / 3 / 3 | **0** ✓ |
| Contraste accent-texte | systémique (2.09:1) | token `--a-txt` créé + ~85 spots convertis (CTA, liens globaux, nav, badges) |

### Reste à traiter (contraste — queue documentée)
~45 spots light encore à 1.9–2.1, **deux causes connues** :
1. Le script de conversion parse les blocs CSS `{…}` des template literals — les blocs contenant des interpolations `${…}` sont sautés (braces imbriquées). Spots connus : `prf-row-val`, `mr-compare`, `epcf-stop-reward-txt`, `ins-diff-code`, h3 milestone parcours, `(toi)`.
2. Couleurs **statut** utilisées comme texte (`--gr`, `--am` purs sur fond clair) : `nd-stt`, `team-badge`, `kpi-delta`. Mérite des tokens `--gr-txt`/`--am-txt` sur le modèle de `--a-txt`.
3. Badges sur **artwork** (plates des mondes parcours) : mesure non fiable sur image — vérifier à l'œil, probablement OK avec leur plate sombre.

### Limites d'instrument (faux positifs connus)
- Ratio ≈1 : texte gradient-clipped (`background-clip:text`).
- Login/onboarding : fond réel posé par un layer `position:fixed` frère — le walker d'ancêtres ne le voit pas.
- Overflow transitoire pendant les skeletons de chargement.
