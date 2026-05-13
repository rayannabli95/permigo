# Guide de migration v6 → v7

Comment découper `autopilot.html` (6900 lignes) en modules.

## Méthode

Pour chaque section de l'ancien `autopilot.html`, créer un nouveau module en respectant le pattern suivant :

```js
// src/pages/<role>/<nom>.js
import { db, schema } from '@/db/client.js';
import { eq } from 'drizzle-orm';
import { esc } from '@/utils/escape.js';
import { getCurUser } from '@/auth/cur-user.js';

export function mount(root) {
  // Render initial
  root.innerHTML = `<div class="page anim-slide-up">…</div>`;

  // Attach listeners
  root.querySelector('#btn-xxx').addEventListener('click', handleClick);

  // Charger data
  loadData();
}

export function unmount() {
  // Cleanup (timers, observers)
}
```

## Mapping détaillé

| Ancien (autopilot.html) | Nouveau emplacement | Statut |
|---|---|---|
| Variables CSS (`:root` l. 22-58) | `src/styles/base.css` | ✅ Migré |
| Dark mode (`body.dark`) | `src/styles/dark.css` | ⏳ À faire |
| `.btn`, `.card`, etc. | `src/styles/components.css` | ✅ Migré |
| `@media` mobile | `src/styles/layout.css` | ⏳ À faire |
| Auth init + login | `src/auth/auth.js` | ✅ Migré |
| `onAuthStateChange` | `src/auth/auth-listener.js` | ✅ Migré |
| `CUR_USER` global | `src/auth/cur-user.js` | ✅ Migré |
| `esc()` helper | `src/utils/escape.js` | ✅ Migré |
| Date helpers | `src/utils/format-date.js` | ✅ Migré (FIX BUG-06) |
| `const REMC = [...]` | `src/data/remc.js` | ✅ Migré |
| `MONS_DEFAULT`, `ELEVES_DEFAULT` | **SUPPRIMÉ** (v6.10) | ✅ |
| `toast()` | `src/components/toast.js` | ✅ Migré |
| `ripple` | `src/components/ripple.js` | ⏳ À faire |
| Page LOGIN | `src/pages/auth/login.js` | ✅ Migré (exemple) |
| Page INSCRIPTION | `src/pages/auth/signup.js` | ⏳ À faire |
| Page PLANNING moniteur | `src/pages/moniteur/planning.js` | ⏳ À faire |
| Page MES ÉLÈVES | `src/pages/moniteur/mes-eleves.js` | ⏳ À faire |
| Page FICHE ÉLÈVE | `src/pages/moniteur/fiche-eleve.js` | ⏳ À faire |
| Page LIVRET REMC | `src/pages/moniteur/livret.js` | ⏳ À faire |
| Page ESPACE ÉLÈVE | `src/pages/eleve/accueil.js` | ⏳ À faire |
| Page RÉSERVATION | `src/pages/eleve/reservation.js` | ⏳ À faire |
| Page PARCOURS élève | `src/pages/eleve/parcours.js` | ⏳ À faire |
| Page TROPHÉES | `src/pages/eleve/trophees.js` | ⏳ À faire |
| Page TABLEAU BORD admin | `src/pages/admin/tableau-bord.js` | ⏳ À faire |
| Page CALENDRIER admin | `src/pages/admin/calendrier.js` | ⏳ À faire |
| `navTo()` router | `src/pages/router.js` | ⏳ À faire |
| Audit log | `src/utils/audit.js` | ⏳ À faire |

## Étapes recommandées

1. **Lancer le scaffold** : `npm install` puis `npm run dev`
2. **Vérifier que login marche** : la page Login est déjà migrée
3. **Migrer page par page** dans cet ordre :
   1. Router (`src/pages/router.js`)
   2. Espace Élève (la plus simple)
   3. Mes Élèves (moniteur)
   4. Fiche Élève
   5. Livret REMC (avec le nouveau design du handoff Claude design)
   6. Planning moniteur
   7. Inscription
   8. Pages admin
4. **Tester chaque page** : `npm run dev` permet le hot-reload, on voit instantanément les modifs

## Comment migrer UNE page (méthode)

Exemple pour migrer "Mes élèves" :

1. **Repérer** dans `autopilot.html` :
   - Le `<div class="page" id="page-eleves">` (HTML)
   - La fonction `renderEleves()` (JS)
   - Les styles `.eleve-row`, etc.

2. **Créer** `src/pages/moniteur/mes-eleves.js` avec le pattern `mount(root)` ci-dessus.

3. **Extraire** :
   - Le HTML → template literal dans `mount()`
   - Le JS de render → corps de `mount()`
   - Les styles → `src/styles/pages/eleves.css` (importé dans `main.css`)

4. **Remplacer** les accès direct à `ELEVES` par des fetch DB :
   ```js
   // Avant : const data = ELEVES;
   // Après :
   const data = await db.select().from(schema.profiles)
     .where(eq(schema.profiles.role, 'eleve'));
   ```

5. **Wrapper toutes les data user** dans `esc()` (corrige XSS).

6. **Tester** : `npm run dev` → ouvrir http://localhost:5173 → naviguer.

## Avantages obtenus après migration

- **Debug 100× plus rapide** : chaque fichier <200 lignes, erreur localisée
- **Hot reload <100ms** au lieu de reload complet du HTML
- **Type safety** possible (ajouter `tsconfig.json` + `.ts` extensions)
- **Tests** possibles (vitest, sur des fonctions isolées)
- **Code splitting** : chaque page chargée à la demande
- **Cache** : les chunks ne re-téléchargent que si modifiés
- **SQLite local** : reset DB en supprimant un fichier
