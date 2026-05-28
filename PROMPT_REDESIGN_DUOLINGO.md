# PROMPT — Redesign PermiGo style "Duolingo-vibes"

> À coller dans Claude Code (VS Code) à la racine du repo `permigo-v7`.
> Lire et suivre **strictement** ce prompt avant tout code.

---

## CONTEXTE

PermiGo est un SaaS B2B pour auto-écoles françaises. Stack : **Vanilla JS (ES modules) + Vite + Supabase + Vercel**. Pas de framework front.
Lire en premier : `permigo-game/CLAUDE.md` et `permigo-game/design-system/permigo-laws.md`.

Audience visée : apprentis du permis 16-25 ans. On veut un look **ludique, énergique, accessible** inspiré de Duolingo : couleurs vives, formes rondes, gros contrastes, polices chaleureuses, animations bouncy, boutons "3D" avec ombre solide.

## OBJECTIF

Redesign visuel **sans casser une seule fonctionnalité backend ni front**.

## RÈGLES NON-NÉGOCIABLES — NE PAS TOUCHER

- ❌ Aucun changement de logique JS (handlers, state, requêtes Supabase, RPCs, routes, router, listeners).
- ❌ Aucun changement de la structure HTML des composants (les classes CSS existantes restent, les `data-*` restent, les IDs restent).
- ❌ Aucun renommage de fonction, classe CSS, fichier, variable JS.
- ❌ Aucun changement dans `src/auth/`, `src/services/`, `src/utils/game-state.js`, `src/router.js`, `src/main.js`, ni aucun fichier qui parle à Supabase.
- ❌ Aucun changement de table Supabase, RPC, ou policy RLS.
- ❌ Aucune migration SQL.
- ❌ Aucun ajout de dépendance npm (sauf police Google Fonts via `@import` CSS).
- ❌ Aucun changement à `vite.config.*`, `package.json`, `.eslintrc`, ou aux scripts de build.

## CE QUE TU PEUX FAIRE

- ✅ Modifier les valeurs des variables CSS dans `permigo-game/src/styles/base.css`.
- ✅ Modifier les autres fichiers dans `permigo-game/src/styles/`.
- ✅ Remplacer les `style="background:#xxxxxx"` (et autres hex inline) dans les templates JS par des `var(--xxx)`.
- ✅ Ajouter un `@import` Google Fonts dans le CSS racine.
- ✅ Mettre à jour `permigo-game/design-system/permigo-laws.md` avec la nouvelle palette + nouvelles "lois" si pertinent.

---

## WORKFLOW STRICT — DEUX PHASES SÉPARÉES

> **TRÈS IMPORTANT** : les 2 phases sont 2 PR distinctes. Phase 1 doit être mergée AVANT de commencer la phase 2.

### PHASE 1 — Refactor hex hardcodés vers variables CSS (pure hygiène)

Branche : `refactor/css-vars-hardcoded`

Avant tout redesign, nettoie. La règle "jamais de hex en dur" de `permigo-laws.md` est largement violée (au dernier comptage : ~325 `#6366f1`, ~88 `#8b5cf6`, ~80 `#10b981`, etc. — au total plus de 800 hex en dur dans `src/`). Si on change juste les variables sans ce nettoyage, environ 60 % de l'app garde l'ancien look.

**Étapes :**

1. Inventaire :
   ```bash
   grep -rohE "#[0-9a-fA-F]{6}\b" permigo-game/src/ | sort | uniq -c | sort -rn
   ```

2. Mappe chaque hex récurrent à la variable existante dans `base.css` :

   | Hex en dur      | Variable cible | Sens                |
   | --------------- | -------------- | ------------------- |
   | `#6366f1`       | `var(--a)`     | Primaire (indigo)   |
   | `#4f46e5`       | `var(--adk)`   | Primaire foncé      |
   | `#10b981`       | `var(--gr)`    | Succès / vert       |
   | `#059669`       | `var(--gr)` (ou `var(--grd)` si on l'ajoute) | Vert foncé |
   | `#ef4444`       | `var(--rd)`    | Danger / rouge      |
   | `#f59e0b`       | `var(--am)`    | Warning / orange    |
   | `#0ea5e9`       | `var(--bl)`    | Info / bleu         |
   | `#8b5cf6`       | `var(--pu)`    | Violet / rare       |
   | `#0b0d1a` / `#0a0d1a` | `var(--ink)` | Texte principal |
   | `#1a1d2e`       | `var(--ink2)`  | Texte secondaire    |
   | `#7880a4`       | `var(--mu)`    | Muted               |
   | `#94a3b8` / `#9ba3c2` | `var(--mu2)` | Muted clair    |
   | `#e2e6f2`       | `var(--bo)`    | Bordure             |
   | `#f4f5fb`       | `var(--bg)`    | Background          |

3. Pour les hex qui n'ont pas de variable existante mais reviennent souvent, **ajoute une nouvelle variable** dans `base.css` plutôt que de laisser en dur. Documente-la.

4. Remplace partout : dans les fichiers JS (template strings `style="..."`) ET dans les fichiers CSS.

5. **ZÉRO changement visuel à cette étape.** C'est de l'hygiène pure. Si tu changes une teinte "par habitude", tu casses la promesse.

6. Vérification :
   - `cd permigo-game && npm run lint && npm run build` passe.
   - `cd permigo-game && npm run test` passe (Playwright e2e).
   - Re-grep des hex : devrait être proche de 0 (les seuls cas restants doivent être justifiés : couleurs uniques d'illustrations, gradients spéciaux d'un seul composant, etc.).
   - Compare 5 pages avant/après visuellement : doit être **identique au pixel près**.

7. Commit en plusieurs petits commits si besoin (`refactor(css-vars): mes-eleves.js`, `refactor(css-vars): accueil.js`, …) puis PR + merge.

### PHASE 2 — Redesign tokens (Duolingo-vibes)

Branche : `feat/redesign-duolingo-vibe` (créée APRÈS le merge de la Phase 1)

Maintenant que tout passe par variables, change les valeurs dans `base.css`.

#### Nouvelle palette — proposition

```css
:root {
  /* === Primaire = vert progression (signature Duo) === */
  --a:   #58CC02;
  --adk: #46A302;                  /* hover / 3D shadow */
  --ap:  rgba(88,204,2,.10);
  --ag:  rgba(88,204,2,.18);

  /* === Sémantique === */
  --gr:  #58CC02;   --grp: rgba(88,204,2,.10);   /* succès = primaire */
  --rd:  #FF4B4B;   --rdp: rgba(255,75,75,.10);  /* danger */
  --am:  #FFC800;   --amp: rgba(255,200,0,.14);  /* gemmes / récompenses */
  --bl:  #1CB0F6;   --blp: rgba(28,176,246,.10); /* info */
  --pu:  #CE82FF;   --pup: rgba(206,130,255,.10);/* rare / légendaire */
  --or:  #FF9600;   --orp: rgba(255,150,0,.10);  /* streak (à ajouter) */

  /* === Surfaces === */
  --bg:  #FFFFFF;   --bg2: #F7F7F7;
  --su:  #FFFFFF;   --su2: #FAFAFA;
  --bo:  #E5E5E5;   --bo2: #EEEEEE;

  /* === Texte === */
  --ink:  #3C3C3C;
  --ink2: #4B4B4B;
  --ink3: #777777;
  --mu:   #AFAFAF;
  --mu2:  #C7C7C7;

  /* === Radius (plus rond) === */
  --r:  12px;
  --rl: 18px;
  --rx: 24px;

  /* === Ombres "3D" signature Duo (boutons) === */
  --s-btn-rest:   0 4px 0 0 rgba(0,0,0,.12);
  --s-btn-active: 0 1px 0 0 rgba(0,0,0,.12);

  /* Ombres existantes — adoucies */
  --s0: 0 1px 2px rgba(0,0,0,.04);
  --s1: 0 2px 6px rgba(0,0,0,.06);
  --s2: 0 6px 16px rgba(0,0,0,.08);
  --s3: 0 14px 32px rgba(0,0,0,.10);
  --s4: 0 28px 50px rgba(0,0,0,.12);

  /* === Polices : Nunito ronde + chaleureuse === */
  --fd: 'Nunito', 'Plus Jakarta Sans', system-ui, sans-serif;
  --fb: 'Nunito', 'Inter', system-ui, sans-serif;
  --fn: 'JetBrains Mono', 'IBM Plex Mono', monospace;
}
```

Ajoute en haut de `base.css` :
```css
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
```

#### Mode sombre

Garde-le. Adapte les mêmes accents (#58CC02, #FFC800…) en gardant la sémantique. Les surfaces deviennent foncées (`#13162A` → garde, ou `#0B1320`), le texte clair (`#F3F4F8` → garde). Documente bien.

#### Effets "Duo-like" (cosmétique, surcouche CSS)

1. **Boutons primaires** : ajoute la classe `.btn-primary` (ou adapte la classe existante) :
   ```css
   .btn-primary {
     background: var(--a);
     color: #fff;
     border: 0;
     border-radius: var(--rl);
     padding: 14px 22px;
     font: 800 16px/1 var(--fd);
     letter-spacing: .01em;
     text-transform: uppercase;
     box-shadow: var(--s-btn-rest);
     transition: transform .08s ease, box-shadow .08s ease;
     cursor: pointer;
   }
   .btn-primary:active {
     transform: translateY(3px);
     box-shadow: var(--s-btn-active);
   }
   ```

2. **Radius bumpé** partout (cards, inputs, badges) via les variables `--r`, `--rl`, `--rx`.

3. **Animations bouncy** sur les actions positives (validation, équipement, achat) :
   ```css
   --ease-bounce: cubic-bezier(.5, 1.8, .5, 1);
   ```
   Utilise `transform: scale(1.06)` + `--ease-bounce` au lieu des transitions linéaires sur les feedbacks positifs.

4. **Pas de gradients** sur l'UI utilitaire (boutons, cards). Réserve les gradients aux illustrations / fonds décoratifs (hero, permis card, mondes).

#### Vérification stricte avant push

- `npm run lint && npm run build` passe.
- `npm run test` passe.
- Test manuel sur ces 5 pages clés (sur ton Mac, dans le navigateur, en mode mobile-emulé Chrome DevTools) :
  - `#/` (accueil élève)
  - `#/parcours`
  - `#/boutique`
  - `#/profil`
  - `#/enseignant` ou route équivalente (accueil moniteur)
- À chaque page, vérifie :
  - [ ] Aucune zone illisible (contraste WCAG AA = 4.5:1 sur le texte normal).
  - [ ] Aucun bouton invisible (couleur fond = couleur bouton).
  - [ ] Tous les clics fonctionnent (équipe un avatar, navigue, lance un quiz).
  - [ ] L'avatar équipé persiste après reload (test cross-device sanity).
  - [ ] Pas de régression en mode sombre.
- Met à jour `permigo-game/design-system/permigo-laws.md` avec la nouvelle palette + retire les anciennes valeurs.

## STYLE DE COMMITS

Conventional commits :
- Phase 1 : `refactor(css-vars): <fichier>`
- Phase 2 : `feat(design): nouvelle palette + Nunito`, `feat(design): boutons 3D Duo-style`, etc.

## CE QUE TU DOIS ME RÉPONDRE AVANT DE COMMENCER

1. Tu as bien lu `CLAUDE.md` et `permigo-laws.md` ? Résume en 3 lignes ce que t'as compris des règles.
2. La palette proposée te va, ou tu suggères des ajustements (HEX précis) ?
3. Tu commences par la Phase 1 (refactor) ou tu as une objection sur ce découpage ?

**NE COMMENCE PAS À CODER avant d'avoir eu mon "go" sur ces 3 points.**
