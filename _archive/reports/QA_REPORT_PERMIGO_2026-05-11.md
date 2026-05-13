# PermiGo Autopilot — Rapport QA
**Date :** 11 mai 2026 · **Méthode :** audit statique (HTML 6 892 l. + SQL schema + RLS) · **Cible :** mobile

---

## Verdict global

🟡 **LIVRABLE SOUS CONDITIONS** — fondations solides, 3 correctifs critiques bloquants avant prod.

| Domaine | Note | Commentaire |
|---|---|---|
| Schéma DB | ✅ A | 9 tables, indexes pertinents, contraintes uniques en place |
| RLS Supabase | ✅ A− | Policies complètes par rôle, fonctions `security definer` anti-récursion |
| Auth | ⚠️ B | signIn OK, validation email OK — mais **pas d'`onAuthStateChange`** |
| Mobile UX | ⚠️ B− | Breakpoints OK, tailles tactiles ≥40 px — mais zoom bloqué + pas de safe-area |
| XSS / sécurité front | 🔴 C | `esc()` existe mais 10 `innerHTML` interpolés non échappés |
| Logique métier | ✅ A− | Anti-double-booking en triple-couche (DB + 3 checks JS) |

---

## 🚨 Pré-requis sécurité (à faire MAINTENANT)

Tu as collé en clair dans cette conversation :
- `service_role` JWT Supabase
- `sb_secret_jEf5Vc9N2aNIRWoRSBr98Q_TC3EMyAR`

Ces clés bypass RLS = accès admin total. **Va sur Supabase → Settings → API → Rotate** les deux. La conversation est potentiellement loggée.

---

## Bugs CRITIQUES (bloquants)

### 🔴 BUG-01 — XSS potentiel dans 10 templates `innerHTML`
**Sévérité :** Haute · **Surface :** noms d'élèves, motifs d'annulation, options `<select>`
**Fichier :** `autopilot.html` lignes 3608, 3656, 4129, 4152, 4161, 4287, 4351, 4364, 5506, 6282
**Détail :** `esc()` est défini ligne 2446 mais oublié dans ces 10 endroits. Si un nom d'élève contient `<img onerror=...>`, exécution arbitraire.
**Fix :** wrapper toutes les variables `${x}` dans ces lignes avec `${esc(x)}`.

### 🔴 BUG-02 — Aucun `onAuthStateChange` listener
**Sévérité :** Haute · **Impact :** Session expirée = utilisateur reste sur l'app sans état valide ; logout sur autre onglet pas propagé ; refresh token non écouté.
**Fix :** ajouter
```js
sb.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || !session) location.href = 'login.html';
});
```

### 🔴 BUG-03 — Schema `events` dénormalisé sur `mon_nom` (string)
**Sévérité :** Haute · **Risque :** si un moniteur est renommé, **tous ses events perdent leur lien** (les RLS comparent `mon_nom = get_my_nom()`). La migration v2 a ajouté `moniteur_id`/`eleve_id` mais le code utilise toujours `mon_nom` (28 occurrences).
**Fix :** migrer le code vers `moniteur_id` UUID, puis supprimer `mon_nom`.

---

## Bugs HAUTS (à corriger rapidement)

### ⚠️ BUG-04 — `maximum-scale=1` bloque le zoom utilisateur
**Ligne :** 12 · **Impact a11y WCAG 2.1 SC 1.4.4** · personnes malvoyantes ne peuvent pas zoomer.
**Fix :** retirer `maximum-scale=1` du viewport meta.

### ⚠️ BUG-05 — Pas de gestion safe-area iOS (notch / home bar)
**Impact :** sur iPhone X+ le contenu passe sous la barre dynamic island ou la home bar.
**Fix :** ajouter dans `body` :
```css
padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
```
+ `viewport-fit=cover` dans le meta.

### ⚠️ BUG-06 — 44 effets `:hover` sticky sur tactile
**Impact :** sur mobile, l'effet hover reste collé après tap. Mauvais ressenti.
**Fix :** wrapper dans `@media (hover:hover)` (déjà partiellement fait).

### ⚠️ BUG-07 — 18 `console.log` en prod
**Impact :** fuite d'info en DevTools.
**Fix :** strip via build ou wrap dans `if (window.DEBUG)`.

---

## Bugs MOYENS

| ID | Sujet | Fix |
|---|---|---|
| M-01 | 2 `confirm()` / `alert()` natifs (UX dépassé) | remplacer par toasts custom |
| M-02 | 39 `<input>` vs 56 `<label>` — mais 17 inputs probablement sans label associé | audit a11y manuel |
| M-03 | Pas de `loading state` détecté | ajouter spinners pendant les fetch |
| M-04 | Migration v2 `inscriptions` / `eleve_stats` créée mais pas exploitée par le code front | soit utiliser, soit supprimer |
| M-05 | `notations_update` policy = `false` (immutables) — mais aucune UI pour éditer non plus, OK | conforme |

---

## Ce qui est BIEN ✅

- **RLS exhaustives** : 9 tables × 4 policies (select/insert/update/delete) avec `get_my_role()` propre
- **Anti-double-booking** : unique index DB (`idx_events_no_double_booking`) + 3 checks JS (lignes 4601, 5958, 6378)
- **Soft-delete** : flag `is_deleted` sur events, indexé partiellement
- **Audit log** : table immuable (`audit_no_update` policy = false), policies cohérentes
- **CSP stricte** : `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net` — bon début (unsafe-inline reste un compromis)
- **Try/catch symétriques** : 61/61, gestion d'erreur cohérente
- **Validation email** : regex appliqué dans 3 flows (signup, login, reset)
- **70 `aria-label`** : effort a11y réel
- **Tailles tactiles ≥ 40 px** sur mobile (`@media max-width:768px`)

---

## Tests NON exécutés (et pourquoi)

Le sandbox d'exécution **bloque les domaines `*.supabase.co`** (allowlist proxy). Donc les tests live (login réel, RLS bout-en-bout, écriture en base, edge cases avec vraie data) **n'ont pas pu être exécutés depuis cette session**.

Pour les exécuter, deux options :
1. **Chrome MCP** depuis ce même contexte → naviguer sur `https://rayannabli95.github.io/Autopilot/` en viewport mobile, tester chaque persona. *Demande-le si tu veux que je le fasse maintenant.*
2. **Script Playwright** que je peux écrire — tu le lances en local, sortie JSON.

---

## Plan de correction priorisé

| Priorité | Action | Effort | Impact |
|---|---|---|---|
| 🚨 J+0 | Rotate clés Supabase (service_role + sb_secret) | 5 min | Sécurité |
| 🔴 J+1 | Fix BUG-01 (10 `esc()` manquants) | 30 min | XSS |
| 🔴 J+1 | Fix BUG-02 (`onAuthStateChange`) | 15 min | Sessions |
| 🔴 J+2-3 | Fix BUG-03 (migration `mon_nom` → `moniteur_id`) | 4-8h | Intégrité |
| ⚠️ J+1 | Fix BUG-04, BUG-05 (mobile a11y) | 30 min | a11y/UX |
| ⚠️ J+5 | Fix BUG-06, BUG-07, M-* | 2h | Polish |

Une fois 01-05 corrigés → **🟢 LIVRABLE**.
