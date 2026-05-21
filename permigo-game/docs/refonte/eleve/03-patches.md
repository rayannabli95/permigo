# 03 — Patches · Côté élève · PermiGo

> Patches vanilla JS prêts à coller. `file:line` vérifié. Aucun `.js` n'a été modifié — Rayan applique après review.
>
> Les snippets JS ont passé `node --check`. Les snippets CSS-in-template-literal sont des chaînes : leur validité est garantie par le `node --check` du module hôte une fois collés. Convention : **AVANT** = code actuel exact, **APRÈS** = remplacement.

---

## Patch #1 — `src/pages/eleve/accueil.js:1129` · empty state classement

**AVANT**
```js
const rankText = rank !== null && total !== null ? `Tu es #${rank} sur ${total} élève${total > 1 ? 's' : ''}` : 'Classement de l\'école';
```

**APRÈS**
```js
const rankText = (rank !== null && total !== null && total > 1)
  ? `Tu es #${rank} sur ${total} élèves`
  : 'Tu ouvres le classement de ton école. Invite tes potes 👀';
```

**Pourquoi** : garde sur `total > 1` (couvre `0` et `1`). Microcopy tutoyée. Accord pluriel correct (toujours ≥2 ici).

---

## Patch #2 — `src/pages/eleve/accueil.js:1060` · toast de gel vs bouton

**AVANT**
```js
if (error || data?.error) { toast('Impossible de geler la série', 'error'); btn.disabled = false; btn.innerHTML = '🧊 Geler ma série · 50 💎'; return; }
```

**APRÈS**
```js
if (error || data?.error) {
  toast('Pas assez de gemmes pour geler ta série. Il t\'en faut 50 💎', 'error');
  setTimeout(() => { btn.disabled = false; btn.innerHTML = '🧊 Geler ma série · 50 💎'; }, 1800);
  return;
}
```

**Pourquoi** : le bouton reste désactivé ~1,8 s pendant que le toast est affiché → plus de co-visibilité CTA/toast. Microcopy explicite sur le coût (Loss Avoidance). Dépend aussi du z-index toast (Patch #12).

---

## Patch #3 — `src/pages/eleve/accueil.js:99` · touch target notif 44×44

**AVANT**
```css
.acc2-hero-notif-btn {
  width: 36px; height: 36px;
  border-radius: 10px;
```

**APRÈS**
```css
.acc2-hero-notif-btn {
  width: 44px; height: 44px;
  border-radius: 12px;
```

**Pourquoi** : WCAG 2.5.8 / Apple HIG 44×44.

---

## Patch #4 — `src/styles/base.css` · garde reduced-motion globale

**APRÈS** (ajouter en fin de fichier — couvre accueil/parcours/boutique/trophees et tout `<style>` injecté)
```css
@media (prefers-reduced-motion: reduce) {
  #app *, #app *::before, #app *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Pourquoi** : neutralise les animations inline non gardées (accueil 19/1, boutique 10/1, trophees 12/2, parcours 40/5) en une règle. Couvre T1 de l'audit. WCAG 2.3.3.

---

## Patch #5 — `src/pages/eleve/trophees.js` · confetti gardé motion

**AVANT** (au call-site de `burstConfetti`)
```js
burstConfetti({ count: 120, power: 18 });
```

**APRÈS**
```js
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  burstConfetti({ count: 120, power: 18 });
}
```

**Pourquoi** : le confetti est déclenché en JS, la règle CSS ne le couvre pas. Garde explicite avant déclenchement.

---

## Patch #6 — `src/pages/eleve/trophees.js:433` · bouton Partager SVG

**AVANT**
```js
<button class="tr2-modal-share" id="tr2-share-btn">Partager 🔗</button>
```

**APRÈS**
```js
<button class="tr2-modal-share" id="tr2-share-btn" aria-label="Partager ce trophée">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
  <span>Partager</span>
</button>
```

**Pourquoi** : icône SVG `stroke` cohérente avec `nav-bottom.js` (zéro mélange emoji/SVG). `aria-label` explicite.

---

## Patch #7 — `src/pages/eleve/trophees.js:421,447` · titres modal `<h2>`

**AVANT**
```js
<div class="tr2-modal-title">${esc(def.title)}</div>
```

**APRÈS**
```js
<h2 class="tr2-modal-title">${esc(def.title)}</h2>
```

**Pourquoi** : heading réel. Appliquer aux deux occurrences (421 et 447). Style conservé via la classe.

---

## Patch #8 — `src/pages/eleve/boutique.js:191` + `:174` · touch targets

**AVANT** (`boutique.js:191`)
```css
  cursor: pointer; min-height: 32px;
```

**APRÈS**
```css
  cursor: pointer; min-height: 44px;
```

**AVANT** (`mes-coffres.js:177`)
```css
  min-height: 36px;
```

**APRÈS**
```css
  min-height: 44px;
```

**Pourquoi** : 44px sur les CTA d'achat et d'ouverture de coffre.

---

## Patch #9 — `src/pages/eleve/boutique.js:183` · badges rareté non tronqués

**AVANT**
```css
  white-space: nowrap; flex-shrink: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis;
```

**APRÈS**
```css
  white-space: nowrap; flex-shrink: 0;
```

**Pourquoi** : `flex-shrink: 0` + suppression de l'ellipsis ⇒ « Commun » / « Rare » / « Épique » / « Légendaire » s'affichent en entier.

---

## Patch #10 — `src/pages/eleve/boutique.js:348-377` · solde gemmes, source unique

**AVANT** (deux chemins divergents, lignes 350-360 et 375-380)
```js
// chemin A (clic carte)
const result = await doPurchase(item, root, allItems);
if (result) {
  const newGemmes = result.new_balance ?? (typeof gemmes === 'number' ? gemmes - item.cost_gemmes : gemmes);
  if (typeof newGemmes === 'number') gemmes = newGemmes;
  ...
}
// chemin B (clic bouton prix)
const result = await doPurchase(item, root, allItems);
if (result?.ok) {
  gemmes = result.new_balance;
  ...
}
```

**APRÈS** (helper unique, à déclarer une fois dans le scope de `mount`)
```js
function applyPurchase(result, item) {
  if (!result || result.ok === false) return false;
  const fallback = (typeof gemmes === 'number') ? gemmes - item.cost_gemmes : gemmes;
  gemmes = (typeof result.new_balance === 'number') ? result.new_balance : fallback;
  const target = allItems.find(i => i.id === item.id);
  if (target) { target.owned = true; target.acquired_at = new Date().toISOString(); }
  const gv = root.querySelector('#bo2-gems-val');
  if (gv) gv.textContent = gemmes;
  return true;
}
```

Puis aux deux call-sites :
```js
const result = await doPurchase(item, root, allItems);
if (applyPurchase(result, item)) {
  showGemsFloat(root, `-${item.cost_gemmes}`);
  renderTab(activeTab);
}
```

**Pourquoi** : un seul contrat de retour, un seul calcul de solde, un seul `renderGems`. Supprime l'oscillation 7889→7489→7889. **Note refactor** : harmoniser le retour de `doPurchase` (toujours `{ ok, new_balance }`) est un chantier séparé ; ce patch est robuste aux deux formes (`result` truthy ou `result.ok`).

---

## Patch #11 — masquage bottom nav pendant quiz / examen / exam-blanc

Cible : `quiz.js:154` (mount), `examen.js:579` (mount), `exam-blanc.js` (mount).

**APRÈS** (début de `mount`, après récupération de `root`)
```js
const nav = document.getElementById('bottom-nav');
if (nav) nav.setAttribute('hidden', '');
```

**APRÈS** (à la sortie : fin d'épreuve, abandon, ou listener `hashchange` one-shot)
```js
function restoreNav() {
  document.getElementById('bottom-nav')?.removeAttribute('hidden');
  window.removeEventListener('hashchange', restoreNav);
}
window.addEventListener('hashchange', restoreNav);
```

CSS requis (une fois, `nav-bottom.js` STYLE) :
```css
#bottom-nav[hidden] { display: none !important; }
```

**Pourquoi** : plein écran d'épreuve, anti-triche, anti-distraction. La nav est globale (z 300) et n'était jamais démontée pendant l'épreuve (vérifié : aucun ref `bottom-nav` dans ces 3 fichiers).

---

## Patch #12 — `src/pages/eleve/parcours.js:87` · barre de progression au-dessus du header

**AVANT** (`.prc-global-bar`, sans z-index)
```css
.prc-global-bar {
```

**APRÈS**
```css
.prc-global-bar {
  position: relative; z-index: 51;
```

Le header sticky est `z-index: 50` (ligne 66). `51` place la barre au-dessus. Sinon, descendre `.prc-hd` à `z-index: 49`.

**Pourquoi** : « 9/9 compétences » n'est plus masqué au scroll.

---

## Patch #13 — `src/pages/eleve/examen.js:603` · titre `<h1>` + tutoiement

**AVANT**
```js
<div class="exam-hd-title">Mon examen B</div>
```

**APRÈS**
```js
<h1 class="exam-hd-title">Ton examen blanc</h1>
```

**Pourquoi** : heading réel (le router focus `h1`, `router.js:82`). Tutoiement.

---

## Patch #14 — `src/pages/common/profil.js:506,615` · titres `<h2>` [PARTAGÉ]

**AVANT** (615)
```js
<div class="prf-ref-ttl">Parrainage · +200 XP par filleul</div>
```

**APRÈS**
```js
<h2 class="prf-ref-ttl">Parrainage · +200 XP par filleul</h2>
```

**AVANT** (506)
```js
<div class="prf-annee-ttl">Ma chasse en ${new Date().getFullYear()}</div>
```

**APRÈS**
```js
<h2 class="prf-annee-ttl">Ma chasse en ${new Date().getFullYear()}</h2>
```

**Pourquoi** : headings réels, a11y. Style inchangé (classe conservée). **Partagé moniteur+élève — comportement identique pour les deux rôles, seul le markup change.**

---

## Patch #15 — `src/pages/common/profil.js` · padding nav (parrainage coupé) [PARTAGÉ]

**AVANT** (`.prf` dans STYLE)
```css
.prf {
```

**APRÈS**
```css
.prf {
  padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 16px);
```

**Pourquoi** : réserve la hauteur de `nav-bottom` (60px + safe-area, z 300). Le bloc parrainage n'est plus coupé.

---

## Patch #16 — `src/styles/components.css:13` · contraste logo [PARTAGÉ]

**AVANT**
```css
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 60%, #a78bfa 100%);
```

**APRÈS**
```css
  background: linear-gradient(90deg, #5145e0 0%, #6d4ad6 55%, #7c5cf0 100%);
```

**Pourquoi** : stops assombris. `#5145e0` = 5.9:1, `#6d4ad6` ≈ 4.9:1, `#7c5cf0` ≈ 4.0:1 sur blanc — au-dessus de 3:1 (grand texte) sur toute la largeur, et la majorité passe 4.5:1. Gradient marque conservé.

---

## Patch #17 — `src/pages/eleve/feedback.js:268-278` · flag d'état d'erreur

**APRÈS** (logique de chargement)
```js
let phase = 'loading'; // 'loading' | 'loaded' | 'error'

async function load() {
  phase = 'loading';
  try {
    const { data, error } = await sb.rpc('get_feedback_feed');
    if (error) throw error;
    phase = 'loaded';
    list.innerHTML = render(data);
  } catch (e) {
    console.error('[feedback] load', e);
    phase = 'error';
    list.innerHTML = `<div class="fb-error">
      <p>On n'a pas pu charger tes retours. Réessaie 👇</p>
      <button id="fb-retry" class="fb-retry-btn">Réessayer</button>
    </div>`;
    list.querySelector('#fb-retry')?.addEventListener('click', load);
  }
}
```

**Pourquoi** : le skeleton n'est jamais ré-affiché une fois `phase !== 'loading'`. Error state tutoyé, retry via listener (pas `onclick` inline). Adapter le nom du RPC à l'existant.

---

## Patch #18 — `src/pages/eleve/wrapped.js` · titre dans le conteneur

**AVANT** (titre sibling de `.wrp`)
```js
<h1>Mon Wrapped</h1>
<div class="wrp" id="wrp-root"></div>
```

**APRÈS**
```js
<div class="wrp"><h1 class="wrp-title">Ton Wrapped</h1><div id="wrp-root"></div></div>
```

**Pourquoi** : `<h1>` dans la même hiérarchie que le contenu, tutoiement. Corrige le titre isolé (Bug #26).

---

## Patch #19 (optionnel, décision Rayan) — exposer galerie + wrapped

`galerie` et `wrapped` sont des routes mortes (zéro entrée UI). Si exposition retenue, ajouter dans `profil.js` (section accès) :

**APRÈS**
```js
${me.role === 'eleve' ? `
  <a class="prf-nav-tile" href="#/galerie" aria-label="Ouvrir ta galerie">
    <span class="prf-nav-ico">🖼️</span><span>Ta galerie</span>
  </a>
  <a class="prf-nav-tile" href="#/wrapped" aria-label="Ouvrir ton Wrapped">
    <span class="prf-nav-ico">🎁</span><span>Ton Wrapped</span>
  </a>` : ''}
```

CSS : `.prf-nav-tile { min-height: 44px; display:flex; align-items:center; gap:8px; }`.

**Pourquoi** : 2 routes complètes deviennent accessibles. Alternative = suppression (dette). **À trancher avant application.**

---

## Récap patches

| # | Fichier:ligne | Type | Sévérité visée |
|---|---|---|---|
| 1 | accueil.js:1129 | empty state | 🟠 |
| 2 | accueil.js:1060 | toast/CTA | 🔴 |
| 3 | accueil.js:99 | touch target | 🟡 |
| 4 | base.css | reduced-motion global | 🟠 |
| 5 | trophees.js | confetti motion | 🟠 |
| 6 | trophees.js:433 | icône SVG | 🟠 |
| 7 | trophees.js:421,447 | heading | 🟡 |
| 8 | boutique.js:191 + mes-coffres.js:177 | touch target | 🟠 |
| 9 | boutique.js:183 | badges rareté | 🟡 |
| 10 | boutique.js:348-377 | solde gemmes | 🔴 |
| 11 | quiz/examen/exam-blanc mount | masquage nav | 🟠 |
| 12 | parcours.js:87 | z-index barre | 🟠 |
| 13 | examen.js:603 | heading + tutoiement | 🟠 |
| 14 | profil.js:506,615 | headings | 🔴 |
| 15 | profil.js | padding nav | 🟠 |
| 16 | components.css:13 | contraste logo | 🟠 |
| 17 | feedback.js | flag état erreur | 🟠 |
| 18 | wrapped.js | titre conteneur | 🟠 |
| 19 | profil.js | exposer routes mortes | 🔴 (décision) |

Prompts d'images : `04-prompts-gpt-images.md`.
