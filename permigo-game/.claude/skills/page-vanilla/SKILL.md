---
name: page-vanilla
description: Cree une nouvelle page PermiGo (Vite + vanilla JS modules + CSS scoped). A UTILISER IMPERATIVEMENT des que l'utilisateur dit "cree une page", "ajoute un ecran", "nouvelle vue" pour role eleve/enseignant/gerant. Genere le squelette complet avec pattern mount(root), esc() XSS-safe, fetch Supabase, skeleton, render, animations, et CSS scoped Plus Jakarta / Inter / indigo.
allowed-tools: Read, Edit, Write, Grep, Glob
---

# Page vanilla PermiGo

## Pattern OBLIGATOIRE (non-negociable)

```js
// src/pages/<role>/<nom>.js
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';

export async function mount(root, ...args) {
  const me = getCurUser();
  if (!me) return;

  track('page_view', { page: '<nom>', user_role: me.role });

  // 1. Skeleton
  root.innerHTML = `<div class="skel skel-page"></div>`;

  // 2. Fetch
  try {
    const data = await loadData(me);
    // 3. Render
    root.innerHTML = renderTemplate(me, data);
    // 4. Wire
    wire(root, me, data);
  } catch (e) {
    console.error('[<nom>]', e);
    toast('Erreur de chargement', 'error');
    root.innerHTML = `<div class="err">Impossible de charger.</div>`;
  }
}

async function loadData(me) {
  const { data, error } = await sb.from('table').select('*').eq('user_id', me.id);
  if (error) throw error;
  return data;
}

function renderTemplate(me, data) {
  return `
    <style>/* CSS scoped ici, prefix .page-<nom> */</style>
    <div class="page-<nom> anim-slide-up">
      <h1>${esc(me.prenom)}</h1>
    </div>
  `;
}

function wire(root, me, data) {
  root.querySelector('#btn-action')?.addEventListener('click', () => {
    // ...
  });
}
```

## Regles absolues

1. **`esc()` partout** sur les donnees user dans innerHTML. JAMAIS de string user brute. XSS = revert immediat.
2. **`mount(root, ...args)` exporte** uniquement. PAS de side-effects au import.
3. **CSS scoped** via `<style>` inline + prefix de classe `.page-<nom>`. Evite collisions.
4. **`class="anim-slide-up"`** sur le container racine pour la transition d'entree.
5. **try/catch** autour de TOUT appel Supabase. Toast en cas d'erreur.
6. **Branche dans `src/router.js`** sinon la page n'est jamais chargee.
7. **Mobile-first** : min touch target 44x44px, safe areas `env(safe-area-inset-*)`.

## Design system (impose)

- **Fond page** : `#f8f9fc` ou `#0a0d1a` (selon contexte light/dark)
- **Cards** : `#fff` (light) ou `#1a1d2e` (dark)
- **Texte primaire** : `#0a0d1a` (light) ou `#fff` (dark)
- **Texte secondaire** : `#94a3b8`
- **Accent** : indigo `#6366f1`. Gradient indigo->violet `linear-gradient(135deg,#6366f1,#8b5cf6)` UNIQUEMENT sur CTA principal de la page.
- **Radius** : 12px (small) ou 20px (cards). Rien d'autre.
- **Spacing** : multiples de 8 STRICT (8/16/24/32). Padding cards = 20 ou 24px.
- **Shadow** : `box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06)`. Une seule regle, appliquee aux cards.
- **Fonts** : Plus Jakarta Sans (titres H1/H2) + Inter (TOUT le reste). JAMAIS IBM Plex Mono sauf chiffres techniques code.

## Routing

Branche la route dans `src/router.js` :
```js
const ROUTES = {
  <role>: {
    <nom>: () => import('@/pages/<role>/<nom>.js'),
  }
};
```

## Tracking

Tracker MINIMUM dans chaque page :
- `page_view` au mount
- Chaque action significative (clic CTA, submit, validation)

Voir `src/services/analytics.js` pour l'API `track(name, props)`.

## Checklist avant commit

- [ ] esc() sur toutes les donnees user
- [ ] try/catch sur Supabase
- [ ] page branchee dans router.js
- [ ] CSS scoped (prefix de classe)
- [ ] tracking page_view + actions cles
- [ ] Test sur viewport 375x812 (iPhone)
- [ ] anim-slide-up sur container racine
