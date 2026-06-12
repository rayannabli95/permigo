# FABLE — Passe de durcissement mobile PermiGo (device-feel)

> **Modèle** : Fable. **Mode** : autonome, multi-PR, vérifié au navigateur.
> **Pourquoi cette tâche** : public 100% mobile, 16-25 ans. Toute friction tactile
> tue l'habitude quotidienne (= la métrique de rétention 40%). Les derniers bugs
> remontés par l'utilisateur étaient TOUS du ressenti mobile (splash, zoom, contraste).
> La prod (DB + sécu) est déjà saine — le levier restant est le *feel*.

---

## Mission

Faire une passe systématique de durcissement mobile sur toute l'app PermiGo,
écran par écran, à la qualité d'une app native iOS. Tu n'inventes pas de feature :
tu rends irréprochable ce qui existe déjà, sur un vrai iPhone.

**Stack rappel** : Vanilla JS (ES modules) + Vite + Supabase. Pas de React. Pages =
`export mount(root, param)`, CSS scoped en `<style>` inline. `esc()` obligatoire sur
toute donnée injectée en innerHTML. Client supabase singleton `sb` depuis `@/auth/auth.js`.

---

## Méthode (NON négociable — tu suis cet ordre)

### Phase 0 — Cartographie
Liste toutes les pages (`src/pages/**/mount`) et tous les overlays/modals/sheets
(`src/components/**`). Tu testeras chaque écran aux 3 rôles (élève / moniteur / gérant).
Comptes test : `eleve@test.fr`, `enseignant@test.fr`, gérant si dispo — mdp `Autopilot2025!`
(cf. `tests/e2e/_creds.js`).

### Phase 1 — Audit instrumenté (Playwright, AVANT de coder)
Tu écris un script de diagnostic qui, pour CHAQUE écran, à **360px ET 390px ET 414px**,
et en **landscape (844×390)**, mesure et reporte :

1. **Touch targets < 44×44px** : tout `button, a, [role=button], input, .clickable`
   dont `getBoundingClientRect()` fait moins de 44px dans une dimension ET qui n'a pas
   8px d'espacement avec son voisin. → liste `sélecteur + taille`.
2. **Débordement horizontal** : `scrollWidth > clientWidth + 2` (tu as déjà le pattern).
3. **Safe-area** : éléments fixes/sticky (`position:fixed/sticky`) dont le top < 0 ou le
   bottom dépasse `100dvh - env(safe-area-inset-bottom)` → risque masqué par notch/home bar.
4. **Contraste** : paires texte/fond sous 4.5:1 (réutilise un calcul WCAG simple) — surtout
   en dark mode (`data-theme=dark`) où les bugs comme le splash blanc-sur-blanc se cachent.
5. **Pièges de scroll** : conteneurs `overflow:auto/scroll` imbriqués qui peuvent bloquer
   le scroll vertical principal.
6. **Tap delay / feedback** : boutons sans état `:active` (pas de `transform:scale` ni
   changement visuel au press).

Sortie : un tableau de findings priorisés. **Tu ne corriges rien avant d'avoir ce rapport.**

### Phase 2 — Correctifs, par lots cohérents
Tu corriges par **thème** (1 PR par thème, pas 1 par écran — évite 40 PR) :

- **PR A — Touch targets** : remonte tout interactif à ≥44×44px (hit-area étendue via
  pseudo-élément si le visuel doit rester petit, façon `::before{inset:-8px}`). Espacement ≥8px.
- **PR B — Safe-areas & landscape** : chaque overlay/sheet/nav fixe respecte
  `env(safe-area-inset-*)`. Layout lisible et utilisable en landscape (pas de contenu coupé,
  pas de CTA hors écran). `min-h-dvh` plutôt que `100vh`.
- **PR C — Feedback tactile & motion** : tout bouton a un `:active{transform:scale(.97)}`
  (120-160ms ease-out). `touch-action:manipulation` pour tuer le délai 300ms. Respect
  `prefers-reduced-motion`. Aucune animation > 300ms sur du UI répété.
- **PR D — Contraste & dark mode** : corrige toute paire sous 4.5:1, en priorité dark mode.

Chaque PR : `npm run build` vert, vérif navigateur aux tailles cibles, description avec
avant/après chiffré.

### Phase 3 — Preuve
Re-run le script d'audit de Phase 1 après chaque PR. Le rapport final doit montrer
**0 touch target < 44px, 0 débordement, 0 paire sous contraste, 0 bouton sans feedback**
(ou justifier chaque exception : ex. fond décoratif clippé volontaire).

---

## Principes de craft (Emil Kowalski — applique-les)

- **Easing fort, jamais les courbes CSS par défaut** : `cubic-bezier(.23,1,.32,1)` pour
  l'entrée (ease-out punchy), `cubic-bezier(.34,1.56,.64,1)` pour les pops spring.
- **Jamais `transition:all`** → propriété explicite (`transform`, `opacity` only — GPU).
- **Jamais animer `width/height/top/left`** → `transform` uniquement.
- **Boutons** : `scale(.97)` au `:active`, exit plus rapide que l'entrée.
- **Durées** : press 100-160ms, sheets 200-300ms, rien > 300ms sur du UI fréquent.
- **`@media (hover:hover)`** autour de tout `:hover` (sinon état collant sur tactile).
- Détails invisibles qui s'additionnent : tu vises le « mille voix qui chantent juste ».

## Garde-fous produit (CLAUDE.md)

- Ne touche PAS à la logique métier, aux RPC, au schéma DB. C'est une passe **front/CSS**.
- Côté **moniteur** : ton pro (Linear/Notion), PAS de mascotte/confetti/“bravo champion”.
- `esc()` sur toute donnée user en innerHTML.
- Mobile-first absolu : iPhone d'abord, 44×44 min, safe-areas partout.

---

## Definition of Done

1. Rapport d'audit Phase 1 commité (`docs/AUDIT_MOBILE_<date>.md`).
2. PR A→D mergées, chacune buildée + vérifiée navigateur 360/390/414 + landscape.
3. Rapport final prouvant 0 régression sur les 6 axes (ou exceptions justifiées).
4. Une ligne de synthèse : « avant : N problèmes / après : 0 (ou X justifiés) ».

Commence par la **Phase 0 + Phase 1** et montre-moi le rapport AVANT de coder le moindre fix.
