# Audit accessibilité — Pages enseignant Permigo
Date : 2026-05-25 · Méthode : analyse statique du code (pas de test lecteur d'écran live) · Pages : 9 enseignant + communes

> Persona enseignant (bible) = sobre/dense, pro. Enjeu EAA : produit B2B commercial → l'accessibilité est dans le champ légal.
> Rappel : les correctifs **globaux** du lot élève s'appliquent aussi à l'enseignant → focus déplacé au changement de page (`router.js`), `:focus-visible` global (`base.css`), `prefers-reduced-motion` global, toasts avec `role/aria-live`. Donc plusieurs bases a11y sont déjà couvertes.

## 1. Résumé
- **🟠 h1 manquant** sur 3 pages : `bilan.js`, `livret-remc.js`, `log-session.js`.
- **🟠 Champs de formulaire sans label programmatique** : `log-session.js` (recherche, date, commentaire) — placeholder ≠ label.
- **🟠 Données tabulaires sans sémantique table/liste** : `mes-eleves`, `livret-remc`, `bilan`, `insights` (tout en `<div>`).
- **🟠 Cibles tactiles < 44px** : plusieurs boutons icône (20–38px).
- **🟡 aria-live en page = 0** : les retours d'action passent par le toast (aria-live global) → globalement OK ; à confirmer sur validation/log-session.
- ✅ RAS confirmés : aucun `onclick` inline ; h1 présents sur aujourdhui/parcours-pro/validation/insights/mes-eleves/parcours-pro-complet (les « multiples » sont des branches d'état, un seul rendu à la fois) ; focus/focus-visible/reduced-motion déjà globaux.

## 2. Findings

### 1 — `<h1>` manquant sur 3 pages
- **Pages** : `pages/enseignant/bilan.js`, `pages/enseignant/livret-remc.js`, `pages/enseignant/log-session.js`
- **Sévérité** : 🟠 (WCAG 1.3.1 A / RGAA 9.1) — pas de point d'entrée par titres pour lecteur d'écran ; et le focus-au-routage (`router.js`) retombe sur `root` au lieu d'un titre.
- **Fix** : convertir le titre principal de chaque page en `<h1 tabindex="-1">` (comme fait côté élève). Si la page a un titre rendu en `<div class="...title">`, le passer en `<h1>`.
- **Temps** : 10 min (3 pages)

### 2 — Champs de formulaire sans label programmatique (log-session)
- **Page** : `pages/enseignant/log-session.js`
  - l.204 `<input id="ls-search" type="search" placeholder="Chercher un élève…">` — pas de label
  - l.257 `<input type="date" id="ls-date-input">` — pas de label
  - l.299 `<textarea id="ls-textarea" placeholder="Observations…">` — pas de label
- **Sévérité** : 🟠 (WCAG 1.3.1 / 3.3.2 / 4.1.2) — le `placeholder` n'est pas un label ; un lecteur d'écran n'annonce pas fiablement le rôle du champ.
- **Fix** : ajouter `aria-label` sur chacun (ex. `aria-label="Chercher un élève"`, `aria-label="Date de la séance"`, `aria-label="Commentaire de séance"`), ou un `<label for="...">` visuellement masqué.
- **Temps** : 5 min

### 3 — Données tabulaires sans sémantique
- **Pages** : `mes-eleves.js` (liste élèves), `livret-remc.js` (matrice compétences), `bilan.js`, `insights.js` — `<table>`/`<th>`/`scope` = 0 partout, tout en `<div>`.
- **Sévérité** : 🟠 (WCAG 1.3.1 A) — pour un lecteur d'écran, la structure est plate : pas de navigation par ligne/colonne, pas d'en-têtes associés.
- **Fix** : pour les vraies grilles (livret REMC, listes élèves), utiliser soit `<table>` + `<th scope>`, soit a minima les rôles ARIA (`role="table"/"row"/"columnheader"/"cell"`, ou `role="list"/"listitem"` pour une liste simple). **Chantier moyen** — à faire page par page, pas en 5 min.
- **Temps** : ~2 h (réparti)

### 4 — Cibles tactiles < 44px
- **Pages** : plusieurs (boutons icône à 20/22/28/32/34/36/38 px détectés).
- **Sévérité** : 🟠 (WCAG 2.5.8 AA, plancher 24 ; cible 44). Côté enseignant l'usage est aussi mobile/tablette.
- **Fix** : porter les boutons interactifs icône à `min-width:44px;min-height:44px` (ou padding équivalent + zone de clic). À faire élément par élément après repérage de ceux qui sont **cliquables** (les avatars/décoratifs n'ont pas besoin).
- **Temps** : ~30 min (repérage + fix)

### 5 — Pas de région live en page (info)
- **Constat** : `aria-live` = 0 dans toutes les pages enseignant. Mais les confirmations (séance enregistrée, validation) passent par le composant `toast` qui a déjà `role="status"/alert"` + `aria-live`. Donc l'essentiel est annoncé.
- **Action** : vérifier que `validation.js` et `log-session.js` utilisent bien `toast()` pour leurs retours de succès/erreur (sinon ajouter). 🟡 mineur.

## 3. Quick wins (≈20 min)
1. h1 sur bilan/livret-remc/log-session (#1).
2. `aria-label` sur les 3 champs de log-session (#2).
3. (cibles 44px #4 = un peu plus long mais batchable).

## 4. Chantier
- Sémantique tabulaire (#3) : le vrai morceau a11y enseignant (livret REMC + listes). À planifier comme un lot dédié.

## 5. Limite de cet audit
Analyse **statique** uniquement. Non testé : lecteur d'écran réel (VoiceOver/NVDA), navigation clavier de bout en bout des formulaires (log-session, validation), contraste réel des textes gris sur fond clair. À compléter par un passage clavier + SR sur la preview avant de cocher « conforme ».
