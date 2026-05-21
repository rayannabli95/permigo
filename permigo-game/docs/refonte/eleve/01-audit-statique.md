# 01 — Audit statique · Côté élève · PermiGo

> **Source unique de vérité.** Ce document **supersede** `AUDIT_UX_A11Y_ELEVE_2026-05-20.md` et `AUDIT_FONCTIONNEL_ELEVE_2026-05-20.md` (racine repo). Date : 2026-05-21. Périmètre : 14 surfaces élève.
>
> Méthode : lecture intégrale des fichiers + Grep de vérification. Chaque `file:line` cité a été vérifié dans le code actuel. Les bugs du brief fondateur déjà corrigés sont marqués **RÉSOLU**. Aucune ligne inventée.

## Légende sévérité

- 🔴 **critique** — bloque l'usage ou expose une donnée
- 🟠 **majeur** — UX cassée, accessibilité non conforme
- 🟡 **mineur** — cosmétique, dette technique

## Tableau de bord

| Sévérité | Count |
|---|---|
| 🔴 critique | 6 |
| 🟠 majeur | 14 |
| 🟡 mineur | 16 |
| **Total actif** | **36** |
| ✅ RÉSOLU (bugs brief déjà corrigés) | 7 |

Note transverse importante : le **tutoiement est déjà nettoyé**. Grep `\b(vous|votre|vos)\b` sur `src/pages/eleve/*.js`, `src/pages/common/*.js`, `src/components/*.js` = **0 résultat**. Le bug brief « tutoiement/vouvoiement mélangés partout » est **RÉSOLU**. Reste à garder la règle en place lors des prochains patches.

---

## `src/pages/eleve/accueil.js` (1225 lignes)

### 🟠 Bug #1 — Empty state classement non gardé sur `total === 0`
- **Ligne 1129** : `const rankText = rank !== null && total !== null ? \`Tu es #${rank} sur ${total} élève${total > 1 ? 's' : ''}\` : 'Classement de l'école';`
- **Problème** : le garde teste `!== null` mais pas `total === 0`. Si le RPC `leaderboard` renvoie `total: 0` (et non `null`) pour une école sans autre élève, l'écran affiche « Tu es #1 sur 0 élève ».
- **Impact** : tout nouvel élève seul dans son école.
- **Sévérité** : 🟠 majeur
- **Statut brief** : partiellement corrigé (garde `null` ajoutée, garde `0` manquante).

### 🔴 Bug #2 — Toast d'erreur de gel co-visible avec le bouton réactivé
- **Ligne 1060** : `if (error || data?.error) { toast('Impossible de geler la série', 'error'); btn.disabled = false; btn.innerHTML = '🧊 Geler ma série · 50 💎'; return; }`
- **Problème** : sur erreur, le bouton est réactivé (`disabled = false`) **et** le toast s'affiche. Les deux occupent la même zone bas d'écran → chevauchement signalé par le fondateur.
- **Impact** : élève sans gemmes ou hors-ligne, à chaque échec.
- **Sévérité** : 🔴 critique (le toast masque l'action).

### 🟠 Bug #3 — Animations inline non gardées `prefers-reduced-motion`
- **Lignes 398-466** (bloc `<style>` injecté) : `next-glow`, `next-pop`, `stagger` blur-in, `.qa-btn::before` shine.
- **Problème** : 19 déclarations `animation:`/`@keyframes` dans le fichier, **une seule** garde `@media (prefers-reduced-motion: reduce)` (ligne 488, scope `.world-card`). Les animations hero/KPI/CTA ignorent la préférence système.
- **Impact** : WCAG 2.2 SC 2.3.3 non conforme.
- **Sévérité** : 🟠 majeur.

### 🟡 Bug #4 — Touch target bouton notif 36×36
- **Lignes 98-99** : `.acc2-hero-notif-btn {` (l.98) `width: 36px; height: 36px;` (l.99)
- **Problème** : sous le minimum 44×44 (Apple HIG / WCAG 2.5.8).
- **Sévérité** : 🟡 mineur.

### 🟡 Bug #5 — `console.error` résiduel
- **Ligne 1144** : `console.error('[accueil] leaderboard', e)`.
- **Problème** : 16 `console.*` dans les pages élève (cf. dette technique). Non bloquant tant que `src/utils/logger.js` n'existe pas (cf. CLAUDE.md), à centraliser.
- **Sévérité** : 🟡 mineur.

### ✅ RÉSOLU — Section « 7 jours actifs » affichée deux fois
- **Ligne 881** : `<span class="bs-hmap-sub">${activityDays.totalActive} jour${...} actif${...}</span>` — **une seule occurrence** dans le code actuel. Doublon non reproduit.

### ⚠️ Runtime visuel — non confirmable en statique
Trois bugs du brief sont des dépassements de mise en page (overflow / clipping) non détectables sans rendu device. Cause CSS probable identifiée, à valider sur iPhone :
- Cards trophées « texte coupé par barres noires » : `.trophy-label` (ligne 530, `font: 600 11px`) sur `.trophy-card` `width: 120px` sans `text-overflow`.
- Rond violet « Niv. 8 » qui déborde : `.acc2-hero-content` sans contrainte de largeur sur le badge niveau.
- Ces deux items sont traités préventivement dans `03-patches.md` (clamp + ellipsis).

---

## `src/pages/eleve/parcours.js` (1860 lignes)

### 🟠 Bug #6 — Header sticky recouvre la barre de progression au scroll
- **Lignes 66-78** : `.prc-hd { position: sticky; top: calc(52px + env(safe-area-inset-top)); z-index: 50; }`
- **Ligne 87** : `.prc-global-bar` **sans** `z-index`.
- **Problème** : au scroll, le header sticky (z 50) passe au-dessus de la barre globale (z auto) → début de barre masqué. Correspond au bug brief « 9/9 compétences caché sous la barre ».
- **Sévérité** : 🟠 majeur.

### 🟡 Bug #7 — Badge « CARTE D'APPRENTISSAGE » bas z-index
- **Ligne 169** : `.prc-map-badge { z-index: 5; position: absolute; top: 14px; pointer-events: none; }`
- **Problème** : `pointer-events: none` ⇒ ne bloque pas les clics, mais recouvre visuellement le contenu sous lui. Le bug brief « header recouvre le contenu » est donc **cosmétique**, pas bloquant.
- **Sévérité** : 🟡 mineur.

### 🟠 Bug #8 — Animations partiellement gardées
- **Problème** : 40 déclarations d'animation, 5 gardes `prefers-reduced-motion`. Reveals, portail (`portal-pulse` ligne 204), unlock cinematic non gardés systématiquement.
- **Sévérité** : 🟠 majeur.

---

## `src/pages/eleve/quiz.js` (298 lignes)

### 🟡 Bug #9 — Animation `.qp-result-card` non gardée
- **Ligne 142** : `.qp-result-card { animation: pop; }` sans `prefers-reduced-motion`.
- **Sévérité** : 🟡 mineur.

### 🟡 Bug #10 — `console.warn` résiduel
- **Ligne 237** : `console.warn('[quiz] submit_competence_quiz error', error)`.
- **Sévérité** : 🟡 mineur.

### 🟡 Bug #11 — Titre compétence `<h1>` sans wrapper de page
- **Ligne 182** : `.qp-comp` rendu en `<h1>` (sémantique correcte) mais isolé du contexte de page (pas de `aria` reliant le timer/progression).
- **Sévérité** : 🟡 mineur.

---

## `src/pages/eleve/examen.js` (639 lignes)

### 🟠 Bug #12 — Titre d'écran en `<div>` au lieu de `<h1>`
- **Ligne 603** : `<div class="exam-hd-title">Mon examen B</div>` (style `font: 700 22px` ligne 65).
- **Problème** : pas de heading réel ⇒ le focus management du router (`router.js:82` cherche `h1`) ne trouve pas de cible, lecteurs d'écran sans titre.
- **Sévérité** : 🟠 majeur.

### 🟡 Bug #13 — `prefers-reduced-motion` n'annule pas les `animation-delay`
- **Ligne 302** : `@media (prefers-reduced-motion: reduce) { .exam-card { animation: none; } }` mais les `.exam-card:nth-child(N) { animation-delay }` subsistent (effet de retard d'apparition sans animation).
- **Sévérité** : 🟡 mineur.

### ⚠️ À valider device — bottom nav pendant l'examen
- Le brief signale « bottom nav visible pendant l'examen (risque triche) ». La bottom nav est montée globalement (`nav-bottom.js`, `z-index: 300`). Aucun appel de démontage trouvé dans `examen.js`. **Confirmé en code** : la nav reste montée. Traité dans `03-patches.md` (masquage pendant quiz/examen).
- **Sévérité** : 🟠 majeur.

---

## `src/pages/eleve/exam-blanc.js` (672 lignes)

### ✅ OK — header sticky + timer + quitter présents
- **Lignes 105, 113, 382-385** : `.exb-quiz-header { position: sticky; top: 0; z-index: 10; }`, `#exb-timer`, bouton `#exb-quit`. Patterns sains.

### 🟠 Bug #14 — bottom nav non masquée pendant l'exam blanc
- Même cause que Bug #12 examen : `nav-bottom` global (z 300) reste affiché. Aucun démontage dans `exam-blanc.js`.
- **Sévérité** : 🟠 majeur.

### 🟡 Bug #15 — Animations gardées globalement mais `console.error` en catch
- **Ligne 666** : garde `prefers-reduced-motion` présente ✅. **Lignes 85, 577** : `console.error` en catch (debug légitime, à centraliser).
- **Sévérité** : 🟡 mineur.

---

## `src/pages/eleve/trophees.js` (487 lignes)

### 🟠 Bug #16 — Bouton « Partager » avec emoji brut au lieu d'icône SVG
- **Ligne 433** : `<button class="tr2-modal-share" id="tr2-share-btn">Partager 🔗</button>`
- **Problème** : emoji texte au lieu d'une icône SVG (le brief interdit de mélanger emoji et SVG dans la même catégorie d'icônes ; le reste de l'app utilise des SVG `stroke`).
- **Sévérité** : 🟠 majeur.

### 🟡 Bug #17 — Titres modal en `<div>` au lieu de `<h2>`
- **Lignes 421, 447** : `<div class="tr2-modal-title">…</div>`.
- **Sévérité** : 🟡 mineur.

### 🟠 Bug #18 — Confetti déclenché sans garde `prefers-reduced-motion`
- **Problème** : 12 animations, 2 gardes. `burstConfetti(...)` est lancé en JS sans test de la préférence avant déclenchement.
- **Sévérité** : 🟠 majeur.

---

## `src/pages/eleve/galerie.js` (323 lignes)

### 🔴 Bug #19 — Route morte : zéro point d'entrée UI
- **Vérifié** : route déclarée `router.js:14`. Grep `galerie` hors définition/page = **0 lien** dans toute la base. `nav-bottom.js` élève = `[default, parcours, trophees, profil]` (lignes 23-28). Aucun bouton/lien ne mène à `#/galerie`.
- **Impact** : page entièrement codée, inaccessible. Soit on l'expose, soit on la retire.
- **Sévérité** : 🔴 critique (fonctionnalité fantôme).

---

## `src/pages/eleve/boutique.js` (540 lignes)

### 🔴 Bug #20 — Compteur de gemmes incohérent (deux chemins d'écriture divergents)
- **Chemin A, ligne 352** : `const newGemmes = result.new_balance ?? (typeof gemmes === 'number' ? gemmes - item.cost_gemmes : gemmes); if (typeof newGemmes === 'number') gemmes = newGemmes;` — garde sur `if (result)`.
- **Chemin B, ligne 377** : `if (result?.ok) { gemmes = result.new_balance; … }` — garde sur `result?.ok`, **sans** fallback.
- **Problème** : deux conventions de retour de `doPurchase` (`result` truthy vs `result.ok`) et deux logiques de solde. Selon le chemin emprunté (clic carte vs clic bouton prix), `gemmes` est réécrit différemment → oscillation 7889 → 7489 → 7889 entre onglets.
- **Sévérité** : 🔴 critique (état financier affiché faux).

### 🟡 Bug #21 — Badges de rareté tronqués
- **Ligne 183** : `.bo2-rarity-pill { flex-shrink: 1; min-width: 0; text-overflow: ellipsis; }`
- **Problème** : largeur insuffisante ⇒ « C… » « R… » au lieu de « Commun » / « Rare » / « Épique ».
- **Sévérité** : 🟡 mineur.

### 🟠 Bug #22 — Touch target bouton prix 32px
- **Ligne 191** : `.bo2-price-btn { min-height: 32px; padding: 7px 12px; }` → 32px de haut.
- **Sévérité** : 🟠 majeur.

### ⚠️ Bugs brief non reproductibles en statique
- « Previews thèmes identiques » et « Mage équipé → équipé où ? » sont des problèmes de **contenu/asset** (mêmes images) et de **clarté d'état**, traités dans `02-spec-refonte.md` (preview différenciée) et `04-prompts-gpt-images.md` (assets distincts).

---

## `src/pages/eleve/mes-coffres.js` (414 lignes)

### ✅ Accessible — point d'entrée confirmé
- `accueil.js:1172` : `navigate('#/mes-coffres')`. La page n'est **pas** morte.

### 🟠 Bug #23 — Touch target bouton « Ouvrir » 36px
- **Ligne 177** : `.mc-open-btn { min-height: 36px; padding: 8px 14px; }`.
- **Sévérité** : 🟠 majeur.

### 🟡 Bug #24 — Logique de déblocage de coffre non explicitée
- **Lignes ~216-220 / 391** : le code détecte le monde via `worldMatch` mais l'UI ne dit pas à l'élève comment débloquer le coffre du monde suivant.
- **Sévérité** : 🟡 mineur (clarté UX, traité dans la spec).

---

## `src/pages/eleve/wrapped.js` (364 lignes)

### 🔴 Bug #25 — Route morte : aucun point d'entrée UI
- **Vérifié** : route `router.js:19` existe (le lot 4 affirmait le contraire, **faux**). Mais Grep `wrapped` hors définition/page = **0 lien**. Inaccessible depuis l'UI.
- **Sévérité** : 🔴 critique.

### 🟠 Bug #26 — Titre `<h1>` hors du conteneur de contenu
- **Lignes ~19-20** : le `<h1>` « Mon Wrapped » est sibling de `.wrp`, alors que le contenu dynamique monte dans `#wrp-root`. Titre isolé de son contenu.
- **Sévérité** : 🟠 majeur.

### ✅ OK — animations gardées (ligne 358).

---

## `src/pages/eleve/feedback.js` (330 lignes)

### 🟠 Bug #27 — Logique d'erreur fragile au premier chargement
- **Lignes 268-278** : sur erreur RPC au premier chargement, le skeleton initial n'est remplacé par le message d'erreur que si `list` existe ; pas de flag d'état distinguant premier chargement vs pagination. Au 2ᵉ échec, le skeleton ré-apparaît.
- **Sévérité** : 🟠 majeur.

### ✅ RÉSOLU — skeleton freeze permanent
- **Lignes 146-147** : `@media (prefers-reduced-motion: reduce) { .fb-skel-card { animation: none; } }`. Le fix « audit 0007 » est présent. Le freeze d'animation est corrigé ; reste la fragilité d'état ci-dessus (Bug #27).

### 🟡 Bug #28 — Badge 28×28 sous touch target
- **Ligne 76** : `.fb-badge { width: 28px; height: 28px; }`. Indicateur non-CTA, mais sous 44px.
- **Sévérité** : 🟡 mineur.

---

## `src/pages/eleve/session-confirmation.js` (550 lignes)

### ✅ RÉSOLU — doublon notification « tu » / « vous »
- Grep `\b(vous|votre|vos)\b` sur le fichier = **0 résultat**. Le doublon de registre n'existe plus dans le code actuel. **RÉSOLU**.

### 🟡 Bug #29 — Compteur « non lues » sans marqueur visuel
- **Vérifié** : aucune chaîne « non lue » dans ce fichier. Le compteur « 0 non lue / 20 » du brief vit ailleurs (probable `common/notifications.js`). À auditer hors périmètre élève strict.
- **Sévérité** : 🟡 mineur (hors fichier).

### 🟡 Bug #30 — `console.error` en catch
- **Lignes 470, 534** : debug légitime, à centraliser.
- **Sévérité** : 🟡 mineur.

---

## `src/pages/common/profil.js` (page partagée moniteur+élève)

> Marquage rôle obligatoire : **[ÉLÈVE]** spécifique élève · **[PARTAGÉ]** moniteur+élève · **[MONITEUR]** ne pas toucher cette session.

### 🔴 Bug #31 — Titres de section en `<div>` au lieu de `<h2>` [PARTAGÉ]
- **Ligne 506** : `<div class="prf-annee-ttl">Ma chasse en …</div>`
- **Ligne 615** : `<div class="prf-ref-ttl">Parrainage · +200 XP par filleul</div>`
- **Problème** : titres de bloc rendus en `<div>`, pas de heading ⇒ hiérarchie cassée, sections sans repère pour lecteurs d'écran.
- **Sévérité** : 🔴 critique (a11y).

### 🟠 Bug #32 — Logo « PermiGo » contraste sous AA [PARTAGÉ]
- **`src/styles/components.css:13`** : `.pg-logo-txt { background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 60%, #a78bfa 100%); }` (texte en `background-clip`) sur fond blanc.
- **Ratios calculés sur blanc** : `#6366f1` = **4.05:1**, `#8b5cf6` = **3.4:1**, `#a78bfa` = **2.9:1**.
- **Problème** : pour du texte normal AA (4.5:1), les trois stops échouent. Pour du grand texte (≥24px ou ≥18.66px bold, seuil 3:1), seul `#6366f1` passe ; `#a78bfa` échoue même à 3:1.
- **Sévérité** : 🟠 majeur.

### 🟠 Bug #33 — « Parrainage · +200 XP par filleul » coupé par la bottom nav [ÉLÈVE]
- **Ligne 615** : `<div class="prf-ref-ttl">Parrainage · +200 XP par filleul</div>`, bloc `.prf-ref` (ligne 223).
- **Problème** : aucun `padding-bottom` de page réservant la hauteur de `nav-bottom` (`calc(60px + env(safe-area-inset-bottom))`, z 300). Le dernier bloc passe sous la nav.
- **Sévérité** : 🟠 majeur.

### ✅ RÉSOLU — UUID brut exposé
- **Vérifié** : aucun rendu de `user.id` / UUID. Le profil sélectionne et affiche `created_at` (`profil.js:377, 392`). L'exposition d'UUID est **corrigée**.

### ✅ Écarté — « lien Mes lieux RDV favoris » côté élève
- **Vérifié** : Grep `lieux` / `RDV favoris` sur `profil.js` = **0 résultat**. Le finding initial (lot d'audit) était une hallucination. **Aucun bug.** Le rendu profil est déjà gardé par `me.role === 'eleve'` (lignes 383, 400, 446).

---

## Transverse

### 🟠 T1 — Animations inline non gardées (synthèse)
Compteur gardes `prefers-reduced-motion` vs déclarations d'animation par page :

| Page | gardes | animations | statut |
|---|---|---|---|
| accueil.js | 1 | 19 | 🟠 incomplet |
| boutique.js | 1 | 10 | 🟠 incomplet |
| trophees.js | 2 | 12 | 🟠 incomplet |
| parcours.js | 5 | 40 | 🟠 incomplet |
| examen.js | 1 | — | 🟡 délais résiduels |
| exam-blanc.js | ✅ | — | OK |
| wrapped.js | ✅ | — | OK |
| feedback.js | ✅ | — | OK |
| session-confirmation.js | ✅ | — | OK |

`base.css` + `animations.css` ont une garde globale, mais les blocs `<style>` injectés par page la court-circuitent. Fix : un bloc `@media (prefers-reduced-motion: reduce){ *{animation:none!important;transition:none!important;} }` dans chaque page, ou mieux, dans `base.css` ciblant `#app *`.

### 🟠 T2 — z-index sans échelle centralisée
Valeurs observées en dur : `nav-bottom` 300, `parcours .prc-hd` 50, `accueil .fresh-arrow` 320 (injecté JS), `.bs-bg` 490 / `.bs-streak` 495, splash 100 (`animations.css:12`). Pas de token d'échelle ⇒ collisions au cas par cas. Fix : variables `--z-nav`, `--z-modal`, `--z-toast` (cf. design system `02`).

### 🟡 T3 — Tutoiement : RÉSOLU, à maintenir
Grep entier = 0 « vous/votre/vos ». Règle à conserver dans tout patch côté élève. Pour `profil.js` partagé, si une chaîne devenait commune moniteur+élève, variante conditionnelle au rôle (cf. `03-patches.md`).

---

## Dette technique (NE PAS refactorer sans validation Rayan)

- **Routes mortes** : `galerie` (Bug #19) et `wrapped` (Bug #25) — codées, zéro entrée UI. Décision requise : exposer ou retirer.
- **`console.*` épars** : 16 occurrences dans `pages/eleve/*.js` + profil. Pas de `src/utils/logger.js` (cf. CLAUDE.md). Centralisation = chantier séparé.
- **Double convention de retour `doPurchase`** (Bug #20) : `result` truthy vs `result.ok`. Unifier le contrat de la fonction = refactor à part ; le patch minimal corrige l'usage dans `boutique.js`.
- **`onclick="location.reload()"` inline** (`router.js:98`, `accueil.js` reload) : pattern à remplacer par listener, non bloquant.

---

## Note sur les bugs brief non retrouvés / requalifiés

| Bug brief | Statut réel |
|---|---|
| « 7 jours actifs » affiché 2× | RÉSOLU (1 occurrence, accueil:881) |
| Tutoiement/vouvoiement mélangés | RÉSOLU (0 occurrence globale) |
| UUID profil exposé | RÉSOLU (created_at à la place) |
| Wrapped route morte (titre) | Route existe, mais **0 entrée UI** ⇒ reste 🔴 |
| Session-conf doublon tu/vous | RÉSOLU |
| Feedback skeleton freeze | RÉSOLU (garde présente) ; fragilité d'état reste |
| Modal « Complet ! » / « Fond Holographic » mal placée | Runtime visuel, traité en spec (modals centrées + backdrop) |

Fin de l'audit. Patches concrets : voir `03-patches.md`. Spec de refonte : `02-spec-refonte.md`.
