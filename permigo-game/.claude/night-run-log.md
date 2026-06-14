# 🌙 Night Run Log — 2026-06-15

## Scope imposé par Rayan
« Trouve une méthode pour vraiment faire installer à l'écran d'accueil aux gens,
utilise toutes les ressources nécessaires — c'est la clé du métier. »

→ Night run mono-objectif : **maximiser la conversion A2HS (install écran d'accueil)**.
Discipline NIGHT_RUN conservée (commits incrémentaux conventionnels, build, PR
mergeable au réveil, PAS de merge auto, choix safe).

## État initial
- Branche : main @ 56dca16 (PR #190 mergée)
- Composants A2HS existants : install-nudge.js (bottom-sheet boot), push-prime.js
  (standalone), add-to-home.js (signup), a2hs-steps.js (guide visuel), pwa.js
  (détection). Coordination tuto via intro-overlays.js (PR #190).

## Recherche (web.dev, MDN, retours terrain)
1. Les prompts au **moment de valeur** (après une victoire) convertissent bien
   mieux que les prompts froids au boot.
2. iOS Safari : pas de beforeinstallprompt → A2HS manuel, et SEUL Safari le permet
   (Chrome/Firefox/Edge iOS = impossible).
3. **In-app browsers** (Instagram, Facebook, TikTok, WhatsApp webview…) : A2HS
   IMPOSSIBLE → tunnel mort si on montre les étapes. Levier le plus négligé,
   critique pour une acquisition par liens partagés (Le Bon Coin, DM, réseaux).
4. Entrée d'install **permanente** (réglages) pour les motivés.

## Plan (par levier, 1 commit chacun)
- [ ] Lever 1 — détection in-app / iOS non-Safari → écran « ouvre dans ton navigateur » + copier le lien (pwa.js + install-nudge.js). LE plus gros levier GTM.
- [ ] Lever 2 — déclencheur « moment de valeur » (export + wiring succès séance moniteur).
- [ ] Lever 3 — entrée permanente « Installer l'app » dans Réglages.
- [ ] Lever 4 — copy bénéfice/aversion à la perte + social proof + cadence re-prompt.
- [ ] QA — build + PR (pas de merge) + report.

## Journal
- 00:00 — log créé, contexte lu (pwa, install-nudge, push-prime, a2hs-steps, add-to-home), recherche faite. Démarrage Lever 1.
