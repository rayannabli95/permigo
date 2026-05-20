# Audit fonctionnel — Pages élève Permigo
Date : 2026-05-20 · Auditeur : Claude Code · Pages : 12 · Findings : 11

> Note méthode (franchise) : Phase 3 « happy paths live via Playwright » n'a **pas** pu être exécutée dans cet environnement — le réseau vers Supabase est bloqué (HTTP 000) et les navigateurs Playwright ne sont pas installés. Les 12 parcours ont donc été **tracés statiquement** (lecture intégrale de chaque `mount`, handler, et du routeur `src/router.js`), pas cliqués. Tout finding ci-dessous pointe du code réel avec file:line. La cartographie §5 distingue ce qui est prouvé du code de ce qui resterait à confirmer en run live.
> `npm run build` échoue dans le sandbox (rollup natif Linux absent — node_modules installé sur macOS), artefact d'environnement, pas un bug du code. `npm run lint` = `echo 'No lint configured yet'` (placeholder, contredit le CLAUDE.md qui annonce ESLint).

## 1. Résumé exécutif

Top findings 🔴 BLOQUANT :
1. `parcours.js:1155` — `error` ignoré sur le fetch `validations` : une erreur DB rend le parcours **entièrement verrouillé** sans aucun message.
2. `feedback.js:268` — échec du 1er chargement = **skeleton figé à vie**, aucune sortie d'erreur ni retry.

Distribution par catégorie : zombie **3** · parcours/route **1** · état **3** · silence **2** · incohérence **2**.
Distribution par sévérité : 🔴 **2** · 🟠 **5** · 🟡 **4**.

Parcours élève : happy paths **non exécutables en live ici** (réseau bloqué) → tracés statiquement. 2 chemins cassent sur erreur réseau (parcours, feedback) ; 2 pages terminées sont **inaccessibles** depuis l'UI (galerie, wrapped : aucun lien n'y mène).

Erreurs silencieuses à transformer en UX : **4** (parcours fetch, mes-coffres catch→empty, boutique catalogue→empty, session refus non traduit).

## 2. Tableau des findings (sévérité décroissante)

| # | Sév. | Page | Cat. | Temps | Titre |
|---|------|------|------|-------|-------|
| 1 | 🔴 | parcours.js | silence/état | 4 min | Erreur DB → parcours tout verrouillé |
| 2 | 🔴 | feedback.js | parcours/état | 5 min | Skeleton figé à vie sur erreur chargement |
| 3 | 🟠 | router.js (galerie+wrapped) | route morte | 6 min | Deux pages terminées inaccessibles |
| 4 | 🟠 | mes-coffres.js + boutique.js | état/silence | 8 min | Erreur réseau affichée comme « vide » |
| 5 | 🟠 | examen.js | zombie | 3 min | Critère « Révision complète » jamais validable |
| 6 | 🟠 | session-confirmation.js | silence | 3 min | Code d'erreur backend brut au refus |
| 7 | 🟡 | accueil.js | état | 2 min | Bouton gel série figé sur « ⏳ » après succès |
| 8 | 🟡 | galerie.js | zombie | 1 min | 4 imports zombies |
| 9 | 🟡 | cross-pages | incohérence | 15 min | Affordance « quitter » hétérogène (←/✕/texte) |
| 10 | 🟡 | cross-pages | incohérence | 10 min | Labels CTA « commencer » variables |
| 11 | 🟡 | wrapped.js + boutique.js | dette | 5 min | Commentaire RPC obsolète + handler achat dupliqué |

---

### 1. Erreur DB → parcours entièrement verrouillé
- **Page** : `permigo-game/src/pages/eleve/parcours.js` ligne 1155-1158
- **Catégorie** : silence + état
- **Sévérité** : 🔴 BLOQUANT
- **Reproduction** : 1) Supabase renvoie une erreur sur `validations` (réseau, RLS, timeout). 2) L'écran « Chargement… » est remplacé par un parcours **tout verrouillé**. 3) L'élève croit avoir perdu toute sa progression, aucun message, aucun retry.
- **Description** : le `await` ne récupère que `data`, jamais `error`. Sur erreur, `valData` est `undefined` → `(valData || [])` → maps vides → `computeWorldStates` produit un parcours 100 % locked. L'erreur réelle est avalée.
- **FIX EXACT** :
  - Fichier : `parcours.js` ligne 1155-1158
  - Avant :
    ```js
    const { data: valData } = await sb
      .from('validations')
      .select('competence_id, validated_at, statut, score_cognitif, score_consolidation, teacher:profiles!validated_by(prenom, nom)')
      .eq('eleve_id', me.id);
    ```
  - Après :
    ```js
    const { data: valData, error: valErr } = await sb
      .from('validations')
      .select('competence_id, validated_at, statut, score_cognitif, score_consolidation, teacher:profiles!validated_by(prenom, nom)')
      .eq('eleve_id', me.id);
    if (valErr) {
      root.innerHTML = `${STYLE}<div class="prc"><div class="prc-hd"><div><div class="prc-title">Mon parcours</div></div></div>
        <div style="padding:48px 24px;text-align:center;color:#64748b">
          <div style="font-size:40px;margin-bottom:12px">📡</div>
          <p style="font:600 15px/1.4 'Inter',sans-serif">Ton parcours n'a pas pu se charger.</p>
          <button onclick="location.reload()" style="margin-top:14px;padding:12px 24px;border:0;background:#6366f1;color:#fff;border-radius:12px;cursor:pointer">Réessayer</button>
        </div></div>`;
      return;
    }
    ```
- **Temps** : 4 min

### 2. Skeleton figé à vie sur erreur de chargement
- **Page** : `permigo-game/src/pages/eleve/feedback.js` ligne 254-272
- **Catégorie** : parcours + état
- **Sévérité** : 🔴 BLOQUANT
- **Reproduction** : 1) Ouvre `#/feedback`. 2) Le 1er `get_eleve_feedback_feed` échoue (réseau). 3) Les 3 cartes skeleton **pulsent indéfiniment**, aucun message, aucun bouton retry.
- **Description** : au 1er appel, `btn` (`#fb-load-btn`) n'existe pas encore, donc `if (btn) btn.disabled = false` ne fait rien, et `renderList` n'est jamais appelé (il est dans le `try` après succès). Le skeleton initial n'est jamais remplacé.
- **FIX EXACT** :
  - Fichier : `feedback.js` ligne 268-271
  - Avant :
    ```js
    } catch (e) {
      console.error('[feedback] load error', e);
      if (btn) btn.disabled = false;
    }
    ```
  - Après :
    ```js
    } catch (e) {
      console.error('[feedback] load error', e);
      const lb = root.querySelector('#fb-load-btn');
      if (lb) { lb.disabled = false; return; }            // pagination : on garde l'existant
      const list = root.querySelector('.fb-list');         // 1er chargement : on tue le skeleton
      if (list) {
        list.innerHTML = `<div class="fb-empty"><div class="fb-empty-ico">📡</div>
          Impossible de charger tes retours.<br>
          <button class="fb-load-more" id="fb-retry" style="margin-top:12px">Réessayer</button></div>`;
        root.querySelector('#fb-retry')?.addEventListener('click', () => { offset = 0; allEvents = []; loadMore(); });
      }
    }
    ```
- **Temps** : 5 min

### 3. Deux pages terminées inaccessibles (routes mortes)
- **Page** : `permigo-game/src/router.js` lignes 14 (`galerie`) et 19 (`wrapped`)
- **Catégorie** : route morte
- **Sévérité** : 🟠 MAJEUR
- **Reproduction** : grep de `#/galerie` et `#/wrapped` dans tout `src/` → **0 lien** (vérifié : `nav-bottom.js`, `header-top.js`, `game-hud.js`, pages élève, `profil.js`, `settings.js`). On ne peut atteindre `galerie.js` (« Ma collection ») et `wrapped.js` (récap annuel) qu'en tapant le hash à la main.
- **Description** : les deux routes sont déclarées et les pages sont complètes/fonctionnelles, mais aucun point d'entrée UI n'y mène. Travail livré mais invisible pour l'élève.
- **FIX EXACT** (recommandé : câbler une entrée, les pages sont prêtes) :
  - Fichier : `permigo-game/src/components/game-hud.js` (à côté du lien `#/boutique` déjà présent, ~ligne 79) — ajouter :
    - Avant : `<a href="#/boutique" ...>Boutique</a>`
    - Après :
    ```html
    <a href="#/boutique" ...>Boutique</a>
    <a href="#/galerie" class="hud-link">Ma collection</a>
    <a href="#/wrapped" class="hud-link">Mon récap</a>
    ```
  - Alternative cheap si abandon assumé : supprimer les lignes 14 et 19 de `router.js` (`galerie:` et `wrapped:`) pour ne pas laisser de routes orphelines.
- **Temps** : 6 min

### 4. Erreur réseau affichée comme « vide »
- **Pages** : `permigo-game/src/pages/eleve/mes-coffres.js` ligne 280-311 · `permigo-game/src/pages/eleve/boutique.js` ligne 301-325
- **Catégorie** : état + silence
- **Sévérité** : 🟠 MAJEUR
- **Reproduction** : 1) coupe le réseau. 2a) `mes-coffres` : affiche « Aucun coffre encore » (alors que l'élève en a). 2b) `boutique` : affiche « Bientôt disponible — arrivent dans la prochaine mise à jour » sur **toutes** les tabs.
- **Description** : même cause racine sur 2 pages — le `catch` (mes-coffres) / `allSettled` rejeté (boutique) retombe sur un tableau vide, et le code ne distingue pas « 0 donnée » de « échec de chargement ». L'erreur est masquée par l'empty-state.
- **FIX EXACT** :
  - Fichier : `mes-coffres.js` ligne 279-284 puis 304-311
    - Avant :
      ```js
      let chests = [];
      try {
        chests = await getMyChests();
      } catch (e) {
        console.error('[mes-coffres] load failed', e);
      }
      ```
    - Après :
      ```js
      let chests = [];
      let loadFailed = false;
      try {
        chests = await getMyChests();
      } catch (e) {
        console.error('[mes-coffres] load failed', e);
        loadFailed = true;
      }
      ```
    - Avant (l.304) : `if (chests.length === 0) { html = \`...🎁 Aucun coffre encore...\`; }`
    - Après :
      ```js
      if (chests.length === 0) {
        html = loadFailed
          ? `<div class="mc-empty"><div class="mc-empty-ico">📡</div>Impossible de charger tes coffres.<br>
             <button class="mc-open-btn" id="mc-retry" style="margin-top:12px">Réessayer</button></div>`
          : `<div class="mc-empty"><div class="mc-empty-ico">🎁</div>Aucun coffre encore — complète des mondes<br>et construis ton streak !</div>`;
      }
      ```
      (+ après `insertAdjacentHTML` : `page.querySelector('#mc-retry')?.addEventListener('click', () => mount(root));`)
  - Fichier : `boutique.js` ligne 307 puis 319-326
    - Avant (l.307) : `const allItems = itemsRes.value?.data ?? [];`
    - Après :
      ```js
      const catalogFailed = itemsRes.status === 'rejected' || !!itemsRes.value?.error;
      const allItems = itemsRes.value?.data ?? [];
      ```
    - Avant (l.319, branche `if (!items.length)`) : message « Bientôt disponible ».
    - Après :
      ```js
      if (!items.length) {
        content.innerHTML = catalogFailed
          ? `<div style="text-align:center;padding:56px 24px;color:var(--mu)">
               <div style="font-size:48px;margin-bottom:12px">📡</div>
               <div style="font:700 16px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:6px">Boutique indisponible</div>
               <div style="font:500 13px/1.5 'Inter',sans-serif">Vérifie ta connexion et réessaie.</div>
             </div>`
          : `<div style="text-align:center;padding:56px 24px;color:var(--mu)">
               <div style="font-size:48px;margin-bottom:12px">🛒</div>
               <div style="font:700 16px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:6px">Bientôt disponible</div>
               <div style="font:500 13px/1.5 'Inter',sans-serif">Ces items arrivent dans la prochaine mise à jour !</div>
             </div>`;
        return;
      }
      ```
- **Temps** : 8 min (les deux)

### 5. Critère « Révision complète » jamais validable
- **Page** : `permigo-game/src/pages/eleve/examen.js` lignes 308, 348-350, 512-518
- **Catégorie** : zombie (état mort)
- **Sévérité** : 🟠 MAJEUR
- **Reproduction** : la checklist « Suis-je prêt ? » affiche « Révision complète » avec badge « — » de façon permanente, quoi que fasse l'élève.
- **Description** : `LS_KEY_REVISED = 'permigo:has_revised'` est **lu** par `isRevised()` mais n'est **jamais écrit** nulle part dans `src/` (vérifié par grep). Le 4ᵉ critère est donc bloqué sur `false` à vie — il plafonne artificiellement le score de préparation à 3/4 max.
- **FIX EXACT** (option A — câbler l'écriture, recommandée) :
  - Fichier : `permigo-game/src/components/revision-cards.js`, dans le handler d'ouverture d'une fiche, ajouter :
    ```js
    try { localStorage.setItem('permigo:has_revised', '1'); } catch {}
    ```
  - Option B (cheap, si le flow révision n'existe pas encore) — supprimer le critère mort dans `examen.js` : retirer le 4ᵉ objet du tableau `criteria` (lignes 512-518) et la fonction `isRevised()` (lignes 348-350) + la variable `const revised = isRevised();` (ligne 487). Ajuster `passCount >= 3` → `>= 2` (lignes 522-525) car il ne reste que 3 critères.
- **Temps** : 3 min

### 6. Code d'erreur backend brut affiché au refus de séance
- **Page** : `permigo-game/src/pages/eleve/session-confirmation.js` ligne 539-543
- **Catégorie** : silence (mauvais message)
- **Sévérité** : 🟠 MAJEUR
- **Reproduction** : refuse une séance déjà traitée → toast « Impossible de refuser — already_decided » (code technique en anglais).
- **Description** : le chemin **confirm** traduit l'erreur via `translateSessionError()` (ligne 482), mais le chemin **refus** affiche `err.message` brut et ferme la modale, empêchant tout retry. Incohérence directe entre deux handlers du même fichier.
- **FIX EXACT** :
  - Fichier : `session-confirmation.js` ligne 539-543
  - Avant :
    ```js
    } catch (err) {
      console.error('[session-confirmation] refuse', err);
      toast(`Impossible de refuser — ${err?.message || 'réessaie'}`, 'error');
      modal.remove();
    }
    ```
  - Après :
    ```js
    } catch (err) {
      console.error('[session-confirmation] refuse', err);
      const msg = translateSessionError(err?.message) || 'réessaie dans un instant';
      toast(`Impossible de refuser — ${msg}`, 'error');
      btn.disabled = false;
      btn.innerHTML = `${icon('x-circle', { size: 16 })} Oui, refuser`;
    }
    ```
- **Temps** : 3 min

### 7. Bouton gel série figé sur « ⏳ » après succès
- **Page** : `permigo-game/src/pages/eleve/accueil.js` ligne 1057-1063
- **Catégorie** : état
- **Sévérité** : 🟡 MINEUR
- **Reproduction** : ouvre le streak sheet → « Geler ma série » → succès → ferme. Rouvre le sheet : le bouton reste sur « ⏳ Gel en cours… » désactivé.
- **Description** : sur succès, seul `closeBS()` est appelé ; le texte du bouton (mis à « ⏳ Gel en cours… » ligne 1057) n'est jamais remis à un état de succès. Le sheet n'étant pas re-rendu, l'élève retrouve un bouton bloqué incompréhensible. (Pas de compteur gemmes visible sur l'accueil — `gemmes` ne sert qu'à gater l'affichage du bouton ligne 886 — donc pas de débit visuel à corriger.)
- **FIX EXACT** :
  - Fichier : `accueil.js` ligne 1061-1063
  - Avant :
    ```js
    track('streak.freeze_used', {});
    toast('Série gelée pour 24h 🧊', 'success');
    closeBS();
    ```
  - Après :
    ```js
    track('streak.freeze_used', {});
    toast('Série gelée pour 24h 🧊', 'success');
    btn.textContent = '✓ Série gelée';   // évite de laisser "⏳ Gel en cours…" figé
    closeBS();
    ```
- **Temps** : 2 min

### 8. 4 imports zombies dans galerie
- **Page** : `permigo-game/src/pages/eleve/galerie.js` lignes 10-12
- **Catégorie** : zombie (import mort)
- **Sévérité** : 🟡 MINEUR
- **Reproduction** : `RARITY_COLOR`, `RARITY_LABEL`, `getPermisBg`, `ELEVE_SKINS` sont importés mais aucune occurrence ailleurs que la ligne d'import (vérifié par grep : 1 seule occurrence chacun).
- **Description** : restes d'une version précédente. `TROPHEES` et `ASSETS` sont, eux, utilisés.
- **FIX EXACT** :
  - Fichier : `galerie.js` lignes 10-12
  - Avant :
    ```js
    import { TROPHEES, RARITY_COLOR, RARITY_LABEL } from '@/data/trophees.js';
    import { ASSETS, getPermisBg } from '@/utils/assets.js';
    import { ELEVE_SKINS } from '@/data/prestige.js';
    ```
  - Après :
    ```js
    import { TROPHEES } from '@/data/trophees.js';
    import { ASSETS } from '@/utils/assets.js';
    ```
- **Temps** : 1 min

### 9. Affordance « quitter la page » hétérogène
- **Pages** : `feedback.js`/`mes-coffres.js`/`parcours.js`/`session-confirmation.js` (flèche `←`/`arrow-left`) · `exam-blanc.js:106` (`✕` quit) · `quiz.js:188,290` (« Plus tard »/« Retour accueil » en texte) · `trophees.js`/`examen.js`/`boutique.js`/`galerie.js` (aucun retour, dépendent de la nav du bas).
- **Catégorie** : incohérence
- **Sévérité** : 🟡 MINEUR
- **Reproduction** : naviguer entre les 12 pages — le geste « sortir » change de forme et d'emplacement à chaque écran.
- **Description** : 4 conventions différentes pour la même action. Sur mobile (90 % du trafic) ça casse l'automatisme du pouce.
- **FIX EXACT** : adopter une convention unique = bouton `←` en haut à gauche pour toute page « profonde » (hors onglets de la nav du bas). Exemple sur `boutique.js` (qui n'en a pas), dans `.bo2-hd-row` ligne 280 :
  - Avant : `<div class="bo2-hd-title">Boutique</div>`
  - Après :
    ```html
    <button class="bo2-back" id="bo2-back" aria-label="Retour" style="background:none;border:0;color:#fff;font-size:20px;cursor:pointer">←</button>
    <div class="bo2-hd-title">Boutique</div>
    ```
    (+ `root.querySelector('#bo2-back')?.addEventListener('click', () => navigate('#/'));`). Aligner `exam-blanc` (remplacer `✕` par `←` quand pas en plein quiz) et standardiser quiz.
- **Temps** : 15 min (les pages concernées)

### 10. Labels CTA « commencer » variables
- **Pages** : `quiz.js:187` (« Commencer 🚀 ») · `exam-blanc.js:53` (« Commencer l'examen ») · `accueil.js:985/991/998/1009` (« Faire le quiz → » / « Commencer → » / « Commencer maintenant → » / « Démarrer → » selon branche).
- **Catégorie** : incohérence
- **Sévérité** : 🟡 MINEUR
- **Reproduction** : la même intention (« lancer une activité ») porte 5 libellés différents selon l'écran.
- **Description** : pas un bug fonctionnel mais une dette de cohérence verbale. Recommandé : un verbe par type d'action (quiz = « Commencer », examen = « Démarrer l'examen »).
- **FIX EXACT** : aligner les branches de `renderActionDuJour` dans `accueil.js` lignes 985-1009 sur 2 libellés canoniques.
  - Avant : `btnText = 'Commencer →';` … `btnText = 'Commencer maintenant →';` … `btnText = 'Démarrer →';`
  - Après : `btnText = 'Commencer →';` partout pour quiz/quête, et `btnText = 'Démarrer l\'examen →';` pour la branche exam-blanc (ligne 1009).
- **Temps** : 10 min

### 11. Commentaire RPC obsolète + handler d'achat dupliqué
- **Pages** : `wrapped.js:3` · `boutique.js:343-356` et `369-380`
- **Catégorie** : dette
- **Sévérité** : 🟡 MINEUR
- **Reproduction** : lecture du code.
- **Description** : (a) `wrapped.js` ligne 3 documente `RPC : get_my_wrapped(year?)` alors que le code appelle `get_wrapped_eleve` (ligne 28) — commentaire trompeur. (b) `boutique.js` a deux handlers d'achat quasi identiques (clic carte vs clic bouton prix) avec un `onConfirm` dupliqué qui diverge légèrement (`acquired_at` posé dans l'un, pas l'autre) → risque de drift.
- **FIX EXACT** :
  - Fichier : `wrapped.js` ligne 3
    - Avant : `// RPC : get_my_wrapped(year?)`
    - Après : `// RPC : get_wrapped_eleve(p_year)`
  - Fichier : `boutique.js` — extraire un seul `onPurchaseSuccess(item)` appelé par les deux listeners (lignes 343-356 et 369-380), corps unifié :
    ```js
    function applyPurchase(item, result) {
      gemmes = (typeof result?.new_balance === 'number') ? result.new_balance : gemmes - item.cost_gemmes;
      const target = allItems.find(i => i.id === item.id);
      if (target) { target.owned = true; target.acquired_at = new Date().toISOString(); }
      const gv = root.querySelector('#bo2-gems-val'); if (gv) gv.textContent = gemmes;
      showGemsFloat(root, `-${item.cost_gemmes}`);
      renderTab(activeTab);
    }
    ```
    et remplacer les deux blocs `if (result) {...}` / `if (result?.ok) {...}` par `if (result?.ok) applyPurchase(item, result);`.
- **Temps** : 5 min

## 3. Quick wins (≤10 min, batchables < 90 min)

Ordre conseillé (suppressions/corrections sûres d'abord) :

1. **#8** galerie — supprimer 4 imports zombies (1 min).
2. **#11** wrapped — corriger le commentaire RPC (1 min).
3. **#7** accueil — label bouton gel après succès (2 min).
4. **#5** examen — câbler `permigo:has_revised` ou retirer le critère mort (3 min).
5. **#6** session-confirmation — traduire l'erreur de refus (3 min).
6. **#1** parcours — gérer `error` du fetch validations (4 min).
7. **#2** feedback — état d'erreur + retry au 1er chargement (5 min).
8. **#4** mes-coffres + boutique — distinguer erreur vs vide (8 min).
9. **#3** galerie+wrapped — câbler les entrées de nav (6 min).

Total ~33 min de fixes ciblés (hors #9/#10 cosmétiques, +25 min si inclus).

## 4. Chantiers structurants

1. **Wrapper Supabase uniforme `loadOr(state)`** — un helper qui retourne `{ data, error, empty }` et impose 3 branches UI (loading / error+retry / empty). Tuerait à la racine les findings #1, #2, #4 (4 pages partagent ce même pattern « error avalé / error=empty / skeleton infini »).
2. **Composant `EmptyState`/`ErrorState` réutilisable** — aujourd'hui chaque page réinvente l'empty-state inline (galerie, feedback, mes-coffres, boutique, trophees) avec des markups divergents. Un composant unique (icône + texte + bouton retry optionnel) standardise et permet de différencier vide/erreur partout.
3. **Logger central `src/utils/logger.js`** — 14 `console.*` dans les pages élève (et ~105 dans `src/`) sans contexte ni reporting. Un logger qui, en prod, route les `error` vers un sink (et ne loggue rien en silence sans UX associée).
4. **Convention de navigation « page profonde »** — règle unique : toute page hors onglets de la nav du bas porte un `←` en haut à gauche → `navigate('#/')`. Résout #9 durablement.
5. **Audit des routes vs points d'entrée (CI)** — un test qui échoue si une route de `router.js` n'a aucun lien `#/<route>` dans `src/` (aurait attrapé galerie/wrapped, #3).

## 5. Cartographie des parcours testés

Tracés **statiquement** (réseau Supabase bloqué, Playwright indispo dans le sandbox). ✅ = chemin nominal cohérent dans le code · ⚠️ = défaut sur un état non-nominal · 🔴 = casse / inaccessible.

| Page | Verdict | Détail |
|---|---|---|
| accueil.js | ✅ (⚠️ #7) | mount + 6 fetches en `allSettled`, fallbacks complets, error-state global présent (l.707). Seul défaut : bouton gel figé. |
| parcours.js | 🔴 #1 | happy path OK ; **error DB non géré** → tout verrouillé. |
| quiz.js | ✅ | submit_competence_quiz géré (error→toast+fallback résultat), branches passed/validated/reason claires. RAS. |
| examen.js | ⚠️ #5 | rendu OK ; critère checklist mort. Pas d'error-state mais dégradation gracieuse (zéros). |
| exam-blanc.js | ✅ | start/submit/timer/abandon tous gérés via toast. Correction par question affichée (sans la bonne réponse — amélioration possible, non bloquante). RAS. |
| trophees.js | ✅ | error→toast + body de repli ; modal verrouillé→« Aller au parcours ». RAS (body de repli un peu trompeur, toléré car toast présent). |
| galerie.js | 🔴 #3 | page fonctionnelle mais **inaccessible** (aucun lien). + imports zombies #8. |
| boutique.js | ⚠️ #4/#11 | achat/modal/insufficient_gemmes gérés correctement ; erreur catalogue=empty ; handlers dupliqués. |
| mes-coffres.js | ⚠️ #4 | ouverture coffre (modal monde + persist) solide ; erreur de chargement=empty. |
| wrapped.js | 🔴 #3 | gère error+empty proprement (data||{}), mais **inaccessible** (aucun lien). |
| feedback.js | 🔴 #2 | pagination OK ; **skeleton figé** sur erreur 1er chargement. |
| session-confirmation.js | ⚠️ #6 | confirm impeccable ; refus n'aligne pas la traduction d'erreur. |

À confirmer en run live (non testable ici) : déclenchement réel de la notif moniteur à `confirm_session`, jeu des animations coffres/quiz, calcul serveur `get_wrapped_eleve` sur compte neuf.

## 6. Dette détectée (info)

- **Code mort à supprimer** : 4 imports galerie (#8, ~3 lignes) ; 1 critère + 1 fonction `isRevised` examen si option B (#5, ~10 lignes) ; 2 routes orphelines si abandon galerie/wrapped (#3, 2 lignes).
- **`console.*` sans UX associée (pages élève)** : 14 occurrences — `exam-blanc` 2, `feedback` 1, `wrapped` 1, `galerie` 1, `boutique` 2, `quiz` 1, `mes-coffres` 2, `accueil` 2, `session-confirmation` 2, `trophees` 1. À router vers logger central (chantier #3).
- **RPC référencées vs versionnées** : **0 RPC fantôme**. Les 14 `sb.rpc(...)` des pages élève (`confirm_session`, `get_eleve_feedback_feed`, `get_items_catalog`, `get_my_achievements`, `get_my_leaderboard_position`, `get_pending_sessions_eleve`, `get_today_quests`, `get_wrapped_eleve`, `predict_exam_ready_date`, `purchase_item`, `start_exam_blanc`, `submit_competence_quiz`, `submit_exam_blanc`, `use_streak_freeze`) sont toutes définies dans `supabase/migrations/0007_rpc_recovery.sql`/`0008`. `claim_quest` (versionnée) est bien appelée mais via `components/daily-quests.js`, pas une page — RAS.
- **Process** : `npm run lint` est un placeholder (`echo 'No lint configured yet'`) alors que `CLAUDE.md` annonce ESLint — la « vérification avant commit » du CLAUDE.md ne lint donc rien aujourd'hui.
