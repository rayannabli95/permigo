# Audit UX + Accessibilité — Pages élève Permigo
Date : 2026-05-20 · Auditeur : Claude · Pages : 12 · Findings : 9 (batchés)

## 1. Résumé exécutif

Top 5 🔴 / 🟠 :
- Focus jamais déplacé au changement de route hash → `src/router.js:50`.
- Aucun `<h1>` : titres rendus en `<div>` sur 7 pages → ex. `parcours.js:1392`.
- `prefers-reduced-motion` absent sur 6 pages, 2 animations infinies → `trophees.js:55,143`.
- Aucun `:focus-visible` sur les 12 pages → indicateur de focus à la merci du reset UA.
- Cibles icônes < 44 px → `parcours.js:852` (32 px), `exam-blanc.js:106`.

Score axe-core : **non mesuré** dans le sandbox (navigateurs Playwright absents, `node_modules` natif macOS sur Linux). Script livré : `permigo-game/scripts/audit-a11y.mjs` — `npm run dev` puis `node scripts/audit-a11y.mjs` en local produit `audit-results.json` (violations + LCP/INP/CLS + cibles < 24 px + focus au routage). Les findings ci-dessous viennent de la lecture statique du code (Deque : l'automatisé ne couvre que 57 % des défauts ; le reste est manuel par nature).

Conformité RGAA 4.1.2 estimée : **~62 %** (méthode : critères validés / applicables sur l'échantillon 12 pages ; 4 critères structurants en échec — 7.3 focus, 9.1 titres, 12.8 ordre, 13.x mouvement). Chiffre indicatif, à confirmer par l'audit RGAA complet (106 critères).

Risque EAA : **élevé** — absence de gestion de focus + titres non structurés bloquent lecteur d'écran et clavier sur un parcours d'achat (cible B2B auto-écoles → produit commercial dans le champ EAA).

Métriques mobile (LCP / INP / CLS) : **non mesurées ici** — à remplir via le script local.

## 2. Tableau des findings

| # | Sév. | Page(s) | Cat. | Critère |
|---|---|---|---|---|
| 1 | 🔴 | router.js (12 pages) | a11y | WCAG 2.4.3 A / RGAA 12.8 |
| 2 | 🔴 | 7 pages | a11y | WCAG 1.3.1 A / COGA 4.2.1 |
| 3 | 🔴 | 6 pages | a11y | WCAG 2.3.3 + 2.2.2 |
| 4 | 🟠 | 12 pages | a11y | WCAG 2.4.7 AA / RGAA 10.7 |
| 5 | 🟠 | quiz/examen/boutique/coffres | a11y | WCAG 4.1.3 AA |
| 6 | 🟠 | parcours/exam-blanc/trophees | mobile | WCAG 2.5.8 AA |
| 7 | 🟠 | session-confirmation (notif) | cognitif | COGA 4.4.1 |
| 8 | 🟡 | accueil | a11y | best-practice / CSP |
| 9 | 🟡 | galerie | UX | feedback erreur |

Distribution : 🔴 ×3 · 🟠 ×4 · 🟡 ×2.

## 3. Quick wins (batchables < 2 h)

---

### 1 — Focus perdu au changement de route
- **Page** : `src/router.js` ligne 50
- **Catégorie** : a11y · **Sévérité** : 🔴 CRITIQUE — exclut clavier + lecteur d'écran
- **Critère** : WCAG 2.4.3 (A) / RGAA 12.8
- **Description** : Au passage `#/eleve/parcours` → `#/eleve/quiz`, le DOM est remplacé mais le focus reste sur l'ancien élément (souvent `<body>`). L'utilisateur clavier/SR ne sait pas que la page a changé.
- **FIX** :
  - Fichier : `src/router.js` ligne 50, juste après `await mod.mount(root, param);`
  - Avant :
    ```js
    await mod.mount(root, param);
    ```
  - Après :
    ```js
    await mod.mount(root, param);
    const heading = root.querySelector('h1') || root;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: false });
    ```
- **Temps** : 5 min

---

### 2 — Aucun titre `<h1>` sur la page
- **Pages** : `accueil.js:783`, `parcours.js:1392`, `quiz.js`, `trophees.js`, `boutique.js`, `wrapped.js`, `session-confirmation.js`
- **Catégorie** : a11y · **Sévérité** : 🔴 CRITIQUE — navigation par titres SR impossible
- **Critère** : WCAG 1.3.1 (A) / RGAA 9.1 / COGA 4.2.1
- **Description** : Le titre principal est un `<div class="...title">`. Aucun `<h1>` : le lecteur d'écran n'a pas de point d'entrée, le finding #1 n'a pas de cible focus.
- **FIX** (1 `<h1>` par page = titre principal ; titres de section → `<h2>`) :
  - `parcours.js` ligne 1392
  - Avant : `<div class="prc-title">Mon parcours</div>`
  - Après : `<h1 class="prc-title" tabindex="-1">Mon parcours</h1>`
  - Idem : `accueil.js:783` (`acc2-hero-title` → `h1`), et `acc2-section-title` lignes 812/830 → `<h2>`.
  - Pages sans titre (`quiz.js`, `boutique.js`, `wrapped.js`, `session-confirmation.js`) : ajoute un `<h1 tabindex="-1">` en tête de `root.innerHTML`.
  - CSS : `h1.prc-title{margin:0;font:inherit}` pour neutraliser le style UA.
- **Temps** : 20 min (7 fichiers)

---

### 3 — Animations non coupées, 2 boucles infinies
- **Pages** : `exam-blanc.js`, `trophees.js` (`tr2Shim` infinite ligne 55, `tr2GoldGlow` infinite ligne 143), `galerie.js`, `boutique.js`, `wrapped.js`, `session-confirmation.js`
- **Catégorie** : a11y · **Sévérité** : 🔴 CRITIQUE — nausée vestibulaire + risque photosensible
- **Critère** : WCAG 2.3.3 + 2.2.2 (A)
- **Description** : 6 pages déclarent `animation`/`transition` sans garde `prefers-reduced-motion`. `trophees.js` a 2 animations en boucle infinie (`tr2Shim`, `tr2GoldGlow`).
- **FIX** :
  - À la fin du bloc de styles de chacun des 6 fichiers (après la dernière règle CSS), ajoute :
    ```css
    @media (prefers-reduced-motion: reduce){
      *,*::before,*::after{
        animation-duration:.001ms!important;animation-iteration-count:1!important;
        transition-duration:.001ms!important;scroll-behavior:auto!important}
    }
    ```
  - `trophees.js` : avant tout déclenchement de confettis/son, garde `if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;`
- **Temps** : 18 min (6 fichiers)

---

### 4 — Indicateur de focus absent
- **Pages** : les 12 (`:focus-visible` = 0 partout ; seul `examen.js` a un `outline`)
- **Catégorie** : a11y · **Sévérité** : 🟠 IMPORTANT
- **Critère** : WCAG 2.4.7 (AA) / RGAA 10.7
- **Description** : Aucune règle `:focus-visible` sur boutons/cartes custom. Le focus clavier dépend du défaut navigateur, invisible dès qu'un reset l'enlève.
- **FIX** :
  - Dans `src/styles/` (feuille globale) ou en tête de chaque `STYLE`, ajoute :
    ```css
    :focus-visible{outline:3px solid #6366f1;outline-offset:2px;border-radius:4px}
    ```
- **Temps** : 8 min

---

### 5 — Mises à jour non annoncées au lecteur d'écran
- **Pages** : `quiz.js` (résultat), `examen.js` (verdict), `boutique.js` (achat), `mes-coffres.js` (ouverture coffre)
- **Catégorie** : a11y · **Sévérité** : 🟠 IMPORTANT
- **Critère** : WCAG 4.1.3 (AA)
- **Description** : Score, gemmes gagnées, achat, coffre ouvert s'affichent sans région live → silencieux pour SR.
- **FIX** :
  - Sur le conteneur de résultat (ex. `quiz.js`, élément de `renderResult`) :
  - Avant : `<div class="quiz-result">`
  - Après : `<div class="quiz-result" role="status" aria-live="polite">`
  - Idem `examen.js` verdict, `boutique.js` retour achat, `mes-coffres.js` résultat coffre.
- **Temps** : 12 min

---

### 6 — Cibles tactiles icônes < 44 px
- **Pages** : `parcours.js:852` (`.fiche-close` 32×32), `exam-blanc.js:106` (`.exb-quit-btn` ✕, sans dimension fixe), `trophees.js:239` (`.tr2-modal-close`)
- **Catégorie** : mobile · **Sévérité** : 🟠 IMPORTANT (90 % mobile, pouce)
- **Critère** : WCAG 2.5.8 (AA, plancher 24 px) ; cible Apple HIG 44×44
- **Description** : Le bouton fermer fiche fait 32×32 (passe le plancher 24 mais sous 44) ; le bouton quitter examen n'a pas de taille minimale garantie.
- **FIX** :
  - `parcours.js` ligne 852
  - Avant : `width: 32px; height: 32px;`
  - Après : `width: 44px; height: 44px;`
  - `exam-blanc.js` `.exb-quit-btn` (ligne 394) : ajoute `min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;`
- **Temps** : 6 min

---

### 7 — Notification en vouvoiement, le reste tutoie
- **Page** : notification affichée dans `session-confirmation.js` — source : trigger `notify_eleve_on_session_logged` (`permigo-game/supabase/migrations/0008_demo_core_recovery.sql`, + prod)
- **Catégorie** : cognitif · **Sévérité** : 🟠 IMPORTANT — rupture de ton (cible 16-25, réf. Duolingo/Ornikar)
- **Critère** : COGA 4.4.1 / cohérence éditoriale
- **Description** : Les 12 pages tutoient (vous = 0 occurrence). Cette notif dit « Confirmez votre séance », « Votre moniteur », « Confirmez-la pour valider vos compétences » — seul point de vouvoiement du parcours élève.
- **FIX** (dans `0008_demo_core_recovery.sql`, fonction `notify_eleve_on_session_logged`, + appliquer en prod) :
  - Avant : `'Confirmez votre séance'` / `COALESCE(v_moniteur_prenom, 'Votre moniteur')` / `'. Confirmez-la pour valider vos compétences.'`
  - Après : `'Confirme ta séance'` / `COALESCE(v_moniteur_prenom, 'Ton moniteur')` / `'. Confirme-la pour valider tes compétences.'`
- **Temps** : 3 min

---

### 8 — Handler inline `onclick` sur bouton recharger
- **Page** : `accueil.js` ligne 712
- **Catégorie** : a11y/best-practice · **Sévérité** : 🟡 NICE-TO-HAVE
- **Critère** : best-practice axe / durcissement CSP
- **Description** : `onclick="location.reload()"` inline bloque toute CSP stricte sans `unsafe-inline`.
- **FIX** :
  - Avant : `<button onclick="location.reload()" ...>Recharger</button>`
  - Après : `<button id="acc-reload" ...>Recharger</button>` + après injection : `root.querySelector('#acc-reload')?.addEventListener('click', () => location.reload());`
- **Temps** : 3 min

---

### 9 — Échec réseau silencieux sur la galerie
- **Page** : `galerie.js` ligne 209
- **Catégorie** : UX · **Sévérité** : 🟡 NICE-TO-HAVE
- **Critère** : COGA 4.5.10 (feedback) / RGAA état
- **Description** : `catch` qui ne fait que `console.warn` ; en cas d'échec, les compteurs trophées tombent à 0 sans message → l'élève croit avoir perdu sa progression.
- **FIX** :
  - Avant : `} catch (e) { console.warn('[galerie] fetch failed', e); }`
  - Après : `} catch (e) { console.warn('[galerie] fetch failed', e); toast('Connexion instable — compteurs indisponibles', 'warning'); }`
- **Temps** : 2 min

---

Cumul quick wins : **~77 min**.

## 4. Recommandations long terme

1. **Focus-management global au routeur** : généraliser le fix #1 + landmark `<main id="app" tabindex="-1">` + skip-link « Aller au contenu ». Couvre 2.4.1 / 2.4.3 d'un coup.
2. **Design tokens cibles & focus** : variables CSS `--tap-min:44px` et un mixin `:focus-visible` unique, appliqués via une feuille partagée plutôt que des `STYLE` inline par page (supprime les findings #4 et #6 à la racine).
3. **Composant `<Heading>` + structure imposée** : helper qui force un `<h1>` unique et une hiérarchie h2/h3 par page (élimine #2 structurellement).
4. **Logger central** : remplacer les 105 `console.*` par `src/utils/logger.js` couplé à un `toast()` systématique sur `catch` réseau (élimine la classe « échec silencieux » #9).
5. **Garde mouvement globale** : injecter le bloc `prefers-reduced-motion` une fois dans la feuille globale au lieu de 6 fichiers (#3 ne se reproduit plus à la création de page).

## 5. Personas exclus aujourd'hui

- **Clavier seul** : bloqué — findings #1, #4 (focus perdu au routage + invisible).
- **Lecteur d'écran (NVDA/VoiceOver/TalkBack)** : bloqué — findings #1, #2, #5 (pas de titre, pas d'annonce des résultats).
- **Basse vision (zoom 200 %)** : friction — #4 (focus invisible) ; cibles #6.
- **Trouble moteur (cibles < 24 px, tremblements)** : friction — #6 (icônes 32 px / sans plancher).
- **ADHD / dyslexie** : friction — #3 (2 animations infinies non coupables), #7 (rupture de ton).
- **Photosensibilité épileptique** : risque — #3 (`trophees.js` `tr2Shim`/`tr2GoldGlow` infinies).

## Annexe — couverture par page

| Page | Findings applicables |
|---|---|
| accueil.js | 1, 2, 4, 8 |
| parcours.js | 1, 2, 4, 6 |
| quiz.js | 1, 2, 4, 5 |
| examen.js | 1, 4, 5 |
| exam-blanc.js | 1, 3, 4, 6 |
| trophees.js | 1, 2, 3, 4, 6 |
| galerie.js | 1, 3, 4, 9 |
| boutique.js | 1, 2, 3, 4, 5 |
| mes-coffres.js | 1, 4, 5 |
| wrapped.js | 1, 2, 3, 4 |
| feedback.js | 1, 4 |
| session-confirmation.js | 1, 2, 3, 4, 7 |

RAS confirmés (preuve) : tutoiement cohérent dans les 12 pages (vous = 0 occurrence) ; aucun `placeholder` utilisé comme label ; aucun `<div onclick>` interactif (sauf le `<button onclick>` #8).
