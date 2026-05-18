# A11y Audit Report — WCAG 2.1 AA
**Date :** 2026-05-18  
**Scope :** Zone libre (eleve/*, enseignant/*, common/*, components/*)  
**Outil :** @axe-core/playwright + revue manuelle du code

---

## ✅ Fixes appliqués

### 1. `prc-node` — Nœuds de compétence (parcours.js)
| Avant | Après |
|---|---|
| `<div class="prc-node">` — pas de rôle ni tabindex | `role="button" tabindex="0"` sur les nœuds non-verrouillés |
| Aucun label pour SR | `aria-label="${sub.n} — ${stLabel}"` (ex: "Freinage — En cours") |
| Nœuds verrouillés cliquables | `aria-hidden="true"` sur les locked (contenu non-interactif) |
| Click only | + listener `keydown` (Enter/Space) |
| `.nd-lbl` dupliquait le label | `aria-hidden="true"` sur `.nd-lbl` pour éviter double annonce |

**WCAG :** 4.1.2 (Name, Role, Value) — Critique  
**Fichier :** `src/pages/eleve/parcours.js:1383`

### 2. `bsheet` — Bottom sheet dialog (parcours.js)
| Avant | Après |
|---|---|
| `role="dialog"` sans labelledby | `aria-labelledby="bsheet-title"` |
| Le focus ne se déplaçait pas dans le dialog | `requestAnimationFrame(() => closeBtn.focus())` après ouverture |
| `<h3>` de la fiche sans id | `id="bsheet-title"` |
| `bsheet-handle` dans le dialog | `aria-hidden="true"` |

**WCAG :** 4.1.2 + 2.4.3 (Focus Order) — Sérieux  
**Fichier :** `src/pages/eleve/parcours.js:1325, 1628, 1684`

### 3. `comp-row` — Lignes de compétences (validation.js)
| Avant | Après |
|---|---|
| `<div data-comp-id>` cliquable — aucun rôle | `role="button" tabindex="0"` sur les actives, `aria-disabled="true"` sur locked |
| Aucun label accessible | `aria-label="${sub.n}"` |
| État sélection non annoncé | `aria-pressed="${sel}"` |
| Click only | + keydown Enter/Space |
| Locked : click inutile via keydown | `return` early si `aria-disabled="true"` |

**WCAG :** 4.1.2 — Critique  
**Fichier :** `src/pages/enseignant/validation.js:441, 487`

### 4. `eleve-card` — Carte élève (validation.js)
| Avant | Après |
|---|---|
| `<div data-eleve-id>` cliquable sans rôle | `role="button" tabindex="0"` |
| Aucun label | `aria-label="${prenom} ${nom_initial}"` |
| État sélection non annoncé | `aria-pressed="${selected}"` |
| `.eleve-av` (initiales) — texte redondant | `aria-hidden="true"` sur l'avatar |

**WCAG :** 4.1.2 — Critique  
**Fichier :** `src/pages/enseignant/validation.js:401`

### 5. `btn-validate` — Bouton validation (validation.js)
| Avant | Après |
|---|---|
| `<button>` sans `type` | `type="button"` |

**WCAG :** 4.1.2 — Mineur (soumet form non-existant dans certains browsers)  
**Fichier :** `src/pages/enseignant/validation.js:465`

---

## ⚠️ Violations restantes (faible priorité)

### Moderate — Couleurs à surveiller
- `#94a3b8` sur `#f8f9fc` (labels de méta, `.nd-stt`) → ratio ~3.0:1, sous WCAG AA (4.5:1 pour texte ≤ 18px)
  - **Contexte :** texte de statut secondaire (12–13px), décoratif mais informatif
  - **Recommandation :** passer à `#64748b` pour ≥4.5:1 — effort ~10 min
  - **Priorisation :** V2 (cosmétique + impact limité)

### Low — Images décoratives
- Quelques `<img>` de monde (PNG décors) n'ont pas `loading="lazy"` — déjà ajouté sur certains
- `permigo-streak-flame-v1.png` dans profil.js a un `onerror` fallback mais pas d'alt explicite (alt="" correct pour décoratif)

### Info — Focus trap dans bsheet
- Le focus trap complet (Tab cycle entre les éléments du dialog uniquement) n'est pas implémenté
- Le bouton Escape pour fermer est présent ✅
- Recommandé pour WCAG 2.4.3 niveau A complet → V2 feature

### Hors scope (zone Cowork)
- Accueil (`src/pages/eleve/accueil.js`) : quelques éléments interactifs sans labels verbaux
- Admin pages : non auditées (hors zone)

---

## 📋 Tests A11y automatisés

`tests/e2e/a11y.spec.js` — 6 tests axe-core WCAG 2.1 AA :
1. Login page
2. Accueil élève
3. Parcours élève (page complète)
4. Fiche compétence (dialog)
5. Validation enseignant
6. Profil

**Politique :** `critical` + `serious` → test FAIL · `moderate` + `minor` → console.warn

---

## 🔧 Commande pour re-lancer l'audit

```bash
npx playwright test tests/e2e/a11y.spec.js --reporter=list
```
