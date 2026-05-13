# Changelog v6.9 — QA Fixes (11 mai 2026)

Corrections issues du rapport QA `QA_Report_PermiGo_2026-05-11.docx`.

## 🔴 Critiques

### BUG-02 — `ReferenceError: CUR_USER is not defined`
- **Avant :** `renderToday()` (l. ~4015) plantait après login car `CUR_USER` n'était jamais déclaré.
- **Fix :** introduction d'un alias global `window.CUR_USER` initialisé à `null` (l. 2009) + helper `setCurUser(profile)` (l. 2011) appelé aux 3 points d'entrée auth (signin, restore session, login alternatif).
- **Lignes :** 2009-2017 + 6541, 6748, 6873.

### BUG-03 — `TypeError: Cannot read properties of undefined (reading 'slice')`
- **Avant :** `coachExam.run()` plantait dans `REMC.forEach` quand une catégorie avait `c` ou `subs` undefined.
- **Fix :** garde `if(!cat||!cat.c||!Array.isArray(cat.subs))return;` (l. 3492).

### BUG-04 — XSS sur photo / initiales élève
- **Avant :** `elv-av-top.innerHTML = '<img src="${elvPhoto}">'` injectait des données potentiellement contrôlables.
- **Fix :** remplacement par `createElement('img')` + `textContent` (l. 5541-5542).

### BUG-05 — Pas d'`onAuthStateChange`
- **Avant :** logout sur autre onglet, refresh token expiré → app reste sur un état stale.
- **Fix :** listener ajouté juste après `createClient()` (l. 1856-1869). Gère `SIGNED_OUT` + session manquante. **Modifiable** : ajouter des cases pour `USER_UPDATED`, `MFA_CHALLENGE_VERIFIED`, etc.

### BUG-06 — Date affichée "Dim 11 mai" au lieu de "Lun 11 mai"
- **Avant :** formule `WEEK_DAYS[dayDate.getDay()-1||6]`. Pour lundi : `1-1=0`, `0||6` retourne **6 (Dim)**.
- **Fix :** `(dayDate.getDay()+6)%7` (l. 4772). Mappe correctement Dim=0→6, Lun=1→0, Mar=2→1…

## 🟠 Hauts

### BUG-09 — Zoom utilisateur bloqué (a11y WCAG 2.1 SC 1.4.4)
- **Fix :** retiré `maximum-scale=1` du meta viewport + ajouté `viewport-fit=cover` (l. 13).

### BUG-10 — Pas de safe-area iOS (notch / home bar)
- **Fix :** ajout de `padding-top/bottom: env(safe-area-inset-*)` sur `body` via `@supports` (l. 102-105). **Modifiable** : ajouter `padding-left/right` si besoin de marges latérales.

## ✅ Vérifications

| Check | Résultat |
|---|---|
| Balance accolades JS | 2 scripts, 0 déséquilibre |
| `maximum-scale=1` actif | retiré |
| `setCurUser()` appels | 6 (init + 3 logins + logout via onAuthStateChange + helper) |
| `onAuthStateChange` | 1 listener actif |
| `safe-area-inset` | 2 références (top + bottom) |

## Comment déployer

Ce fichier `autopilot.html` est servi via GitHub Pages. Pour livrer ces fixes :

```bash
cd ~/Desktop/autopilot-project-9
git add autopilot.html CHANGELOG_v6.9.md
git commit -m "v6.9 — QA fixes (CUR_USER, slice, XSS photo, auth listener, date Dim/Lun, viewport, safe-area)"
git push origin main
```

GitHub Pages se met à jour en ~1 min. Reload de https://rayannabli95.github.io/Autopilot/ avec **Cmd+Shift+R** (hard reload) pour bypass cache.

## Pour la suite (non bloquants)

Voir le rapport `QA_Report_PermiGo_2026-05-11.docx` pour la liste complète :
- BUG-01 : kill seed/demo data, basculer 100% sur DB (4-8h)
- BUG-07 : migration `mon_nom` → `moniteur_id` UUID (4h)
- BUG-08 : SMTP custom Supabase pour lever rate limit emails (1h)
- BUG-11 : doc des comptes test à corriger (5 min)
- BUGs 12-21 : polish moyen (3h cumulés)

## Backups

Le fichier original a été sauvegardé en `autopilot.html.bak.<timestamp>` avant modifications.
