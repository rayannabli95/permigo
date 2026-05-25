# PermiGo — Board des tâches (pages élève)

Mis à jour : 2026-05-21 · Source du code exact : `AUDIT_FONCTIONNEL_ELEVE_2026-05-20.md` (FONC) + `AUDIT_UX_A11Y_ELEVE_2026-05-20.md` (A11Y), tous deux à la racine.

**Comment l'utiliser dans VS Code** : tu coches `[ ]` → `[x]` au fur et à mesure, et tu passes le `Statut` de chaque carte de `TODO` → `EN COURS` → `À RELIRE`. Quand une tâche est `À RELIRE`, je la relis (voir `SUPERVISION.md`) et je la passe en `VALIDÉ` ou `À CORRIGER`.

## Vue d'ensemble

| # | Tâche | Phase | Sév. | Statut |
|---|-------|-------|------|--------|
| A1 | Commiter les 5 corrections déjà faites | A | — | TODO |
| A2 | Prouver les états d'erreur en live | A | — | TODO |
| A3 | build + tests Playwright avant push | A | — | TODO |
| B1 | Câbler ou retirer galerie + wrapped | B | 🟠 | **DÉCISION** |
| B2 | Erreur ≠ vide (mes-coffres + boutique) | B | 🟠 | TODO |
| B3 | Critère « Révision complète » mort (examen) | B | 🟠 | TODO |
| B4 | Traduire l'erreur de refus (session) | B | 🟠 | TODO |
| B5 | Cosmétiques (gel, zombies, RPC, doublon) | B | 🟡 | TODO |
| B6 | Incohérences cross-pages (retour, CTA) | B | 🟡 | TODO |
| C1 | :focus-visible sur 12 pages | C | 🟠 | TODO |
| C2 | Régions aria-live | C | 🟠 | TODO |
| C3 | Cibles tactiles 44px | C | 🟠 | TODO |
| C4 | Vouvoiement notif (SQL + prod) | C | 🟠 | **DÉCISION** |
| C5 | onclick inline accueil + toast galerie | C | 🟡 | TODO |
| D | Chantiers de fond | D | — | BACKLOG |
| BUG | Coffres parcours (compte Tomomi) | — | ? | **EN ATTENTE INFO** |

Ordre conseillé : **A1 → A2 → B2 → B3 → B4 → C1 → C2 → C3 → C5 → B5 → B6 → (décisions B1, C4) → A3 → D**.

---

## Phase A — Sécuriser l'existant

### A1 — Commiter les 5 corrections déjà appliquées
- [ ] Créer une branche `fix/audit-eleve-batch1` (penser à `git pull` sur main d'abord, cf. CLAUDE.md mémoire)
- [ ] Vérifier le diff des 10 fichiers : `router.js`, `accueil.js`, `parcours.js`, `quiz.js`, `trophees.js`, `boutique.js`, `wrapped.js`, `session-confirmation.js`, `exam-blanc.js`, `galerie.js`, `feedback.js`
- [ ] Commit conventionnel : `fix(eleve): error-states parcours/feedback` + `feat(a11y): focus routage, h1 par page, prefers-reduced-motion`
- **Done quand** : branche poussée, diff propre, build OK.
- **Statut** : TODO

### A2 — Prouver les états d'erreur en live
- [ ] Couper la requête Supabase (DevTools offline OU override fetch) et ouvrir `#/parcours` → doit afficher « Ton parcours n'a pas pu se charger » + bouton Réessayer
- [ ] Idem `#/feedback` au 1er chargement → état d'erreur + Réessayer (pas de skeleton figé)
- **Done quand** : capture des 2 écrans d'erreur.
- **Statut** : TODO

### A3 — build + e2e avant push
- [ ] `cd permigo-game && npm run build` (doit finir par `✓ built`)
- [ ] `npm run test` (Playwright e2e) si flow critique touché
- **Statut** : TODO

---

## Phase B — Findings fonctionnels (réf. FONC)

### B1 — Câbler ou retirer galerie + wrapped — DÉCISION
- Contexte : FONC #3. 2 pages finies, **0 lien** y mène (routes mortes `router.js:14,19`).
- [ ] **Décider** : (a) câbler une entrée de nav (recommandé) — ex. `components/eleve/game-hud.js` près du lien `#/boutique` ; ou (b) retirer les 2 routes de `router.js`.
- **Done quand** : galerie + wrapped accessibles depuis l'UI, OU routes retirées.
- **Statut** : DÉCISION (attend ton choix)

### B2 — Erreur ≠ vide (mes-coffres + boutique)
- Réf. code exact : **FONC #4** (avant/après fourni).
- [ ] `mes-coffres.js:279-311` : flag `loadFailed` + branche erreur avec Réessayer
- [ ] `boutique.js:307,319` : flag `catalogFailed` + message « Boutique indisponible »
- **Done quand** : réseau coupé → message d'erreur (pas « Aucun coffre » / « Bientôt disponible »).
- **Statut** : TODO

### B3 — Critère « Révision complète » mort (examen)
- Réf. : **FONC #5**. `permigo:has_revised` lu (`examen.js:349`) jamais écrit.
- [ ] Option A : écrire le flag dans `components/eleve/revision-cards.js` à l'ouverture d'une fiche
- [ ] Option B : retirer le 4ᵉ critère + `isRevised()` et passer `passCount>=3` → `>=2`
- **Done quand** : le critère peut passer à ✓, OU il est retiré proprement.
- **Statut** : TODO

### B4 — Traduire l'erreur de refus (session-confirmation)
- Réf. : **FONC #6**. `session-confirmation.js:539-543`.
- [ ] Utiliser `translateSessionError(err?.message)` + garder la modale ouverte + réactiver le bouton
- **Done quand** : refuser une séance déjà traitée affiche un message FR (plus « already_decided »).
- **Statut** : TODO

### B5 — Cosmétiques fonctionnels
- Réf. : **FONC #7/#8/#11**.
- [ ] `accueil.js:1061` : bouton gel → `'✓ Série gelée'` après succès
- [ ] `galerie.js:10-12` : supprimer 4 imports zombies (`RARITY_COLOR`, `RARITY_LABEL`, `getPermisBg`, `ELEVE_SKINS`)
- [ ] `wrapped.js:3` : corriger commentaire RPC → `get_wrapped_eleve(p_year)`
- [ ] `boutique.js:343/369` : factoriser les 2 handlers d'achat en un seul `applyPurchase()`
- **Statut** : TODO

### B6 — Incohérences cross-pages
- Réf. : **FONC #9/#10**.
- [ ] Uniformiser l'affordance « retour » (← partout sur pages profondes, pas ✕/texte)
- [ ] Uniformiser les labels CTA « Commencer » / « Démarrer »
- **Statut** : TODO

---

## Phase C — Findings a11y (réf. A11Y)

### C1 — :focus-visible sur 12 pages
- Réf. : **A11Y #4**.
- [ ] Ajouter `:focus-visible{outline:3px solid #6366f1;outline-offset:2px;border-radius:4px}` dans une feuille globale (`src/styles/`) ou en tête de chaque `STYLE`
- **Done quand** : focus clavier visible sur boutons/cartes custom.
- **Statut** : TODO

### C2 — Régions aria-live
- Réf. : **A11Y #5**.
- [ ] `quiz.js` (résultat), `examen.js` (verdict), `boutique.js` (achat), `mes-coffres.js` (coffre) : `role="status" aria-live="polite"` sur le conteneur de résultat
- **Done quand** : un lecteur d'écran annonce score/achat/coffre.
- **Statut** : TODO

### C3 — Cibles tactiles 44px
- Réf. : **A11Y #6**.
- [ ] `parcours.js` `.fiche-close` 32→44px
- [ ] `exam-blanc.js` `.exb-quit-btn` : `min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center`
- [ ] `trophees.js` `.tr2-modal-close` : vérifier ≥44px
- **Statut** : TODO

### C4 — Vouvoiement notif (SQL + prod) — DÉCISION
- Réf. : **A11Y #7**. Fonction `notify_eleve_on_session_logged` dans `supabase/migrations/0008_demo_core_recovery.sql` **+ prod**.
- [ ] **Décider** qui touche la prod (toi/Rayan vs moi)
- [ ] Remplacer « Confirmez votre séance / Votre moniteur / vos compétences » → tutoiement
- [ ] Appliquer la migration en prod
- **Statut** : DÉCISION (touche la prod)

### C5 — onclick inline + toast galerie
- Réf. : **A11Y #8/#9**.
- [ ] `accueil.js:712` : remplacer `onclick="location.reload()"` par `id` + `addEventListener` (CSP)
- [ ] `galerie.js:209` : ajouter un `toast(...)` sur le catch silencieux
- **Statut** : TODO

---

## Phase D — Chantiers de fond (backlog, anti-récidive)
- [ ] Wrapper Supabase uniforme (loading / error / empty)
- [ ] Composants `EmptyState` / `ErrorState` réutilisables
- [ ] Logger central `src/utils/logger.js`
- [ ] Focus-management global au routeur + skip-link « Aller au contenu »
- [ ] Garde `prefers-reduced-motion` injectée une seule fois (feuille globale)
- **Statut** : BACKLOG

---

## BUG — Coffres absents du parcours (compte Tomomi)
- Diagnostic : **pas un bug a priori**. Un coffre n'apparaît dans le parcours que pour un monde 100% complété (`parcours.js:1609`). Vérifié OK sur latifa (4 mondes complets → 4 coffres).
- [ ] **Info requise** : Tomomi a-t-elle au moins un monde 100% validé ?
  - Non → comportement normal, fermer.
  - Oui → vrai bug : fournir `eleve_id` ou accès de Tomomi pour inspecter ses validations (`computeWorldStates`).
- **Statut** : EN ATTENTE INFO
