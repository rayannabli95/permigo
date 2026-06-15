# 🌅 Night Run Report — 2026-06-15

## 🎯 Objectif imposé
« Faire vraiment installer l'app à l'écran d'accueil — c'est la clé du métier. »
→ Night run mono-objectif : **maximiser la conversion A2HS**.

## ⏱ Résumé
- Branche : `feat/a2hs-install-conversion` (depuis `main` @ 56dca16)
- 6 commits, build OK à chaque étape, **PR ouverte, PAS mergée** (à toi de merger au réveil)
- Recherche web faite (web.dev / MDN) pour valider les leviers
- 0 changement DB, 0 schema, tout additif

## ✅ Fait — 4 leviers de conversion

### Lever 1 — Rescue des contextes non-installables  ⭐ le plus gros levier GTM
`feat(a2hs): rescue les contextes non-installables` (aaedce2)
- **Le problème invisible** : un lien ouvert depuis Instagram / Facebook / TikTok /
  WhatsApp / un DM Le Bon Coin s'ouvre dans une **webview** où « Ajouter à l'écran
  d'accueil » est **impossible**. Idem iPhone hors Safari (Chrome/Firefox iOS).
  Ces gens voyaient des étapes qui ne marchent jamais → 100 % de perte.
- **Fix** : `pwa.js` détecte (`isInAppBrowser`, `isIosNonSafari`, `installBlockedReason`),
  et l'install-nudge affiche alors **« Ouvre PermiGo dans ton navigateur / Safari »**
  + bouton **Copier le lien**. C'est LE tunnel qui sauve l'acquisition par liens partagés.

### Lever 2 — Prompt au moment de valeur  (vs prompt froid au boot)
`feat(a2hs): déclencheur install au moment de valeur` (76eba03)
- `promptInstallAtValueMoment(me, reason)` : propose l'install après une **vraie
  victoire** (cadence 1/24 h, respecte l'opt-out, bypasse le snooze de boot).
- Câblé sur le **succès de validation de séance moniteur** (log-session).
- `openInstallSheet(me)` exporté aussi (pour l'entrée Réglages, Lever 3).

### Lever 3 — Entrée permanente dans Réglages
`feat(a2hs): entrée permanente « Ajouter à l'écran d'accueil »` (64b049a)
- Section **Application → « Ajouter à l'écran d'accueil »** (masquée si déjà
  installée / sur desktop). Les motivés peuvent installer quand ils veulent.

### Lever 4 — Copy bénéfice / aversion à la perte
`polish(a2hs): copy bénéfice/aversion à la perte` (d1c9eba)
- Élève : « Ouvre l'app d'un geste, garde ta série 🔥 et reçois tes rappels. »
- Moniteur : « Vos validations à confirmer en 1 tap — comme une vraie app, sans store. »
- **Pas de faux chiffres / faux social proof** (cf. ton audit : on ne refait pas
  l'erreur des faux témoignages).

### Kaizen
`fix(a2hs): évite faux positifs in-app (DuckDuckGo) + masque entrée desktop` (83b0eee)

## 🧪 À tester au réveil (mobile réel, le timing ne se simule pas en CI)
- [ ] Ouvre la preview depuis un **DM Instagram / WhatsApp** → tu dois voir
      « Ouvre dans ton navigateur » + Copier le lien (pas les étapes A2HS).
- [ ] iPhone **Chrome** (pas Safari) → même écran « Ouvre dans Safari ».
- [ ] iPhone **Safari** normal → les étapes A2HS animées (inchangé).
- [ ] **Réglages → Application → Ajouter à l'écran d'accueil** ouvre bien la sheet.
- [ ] **Valide une séance** (moniteur) → ~1,4 s après le succès, la sheet install
      apparaît (1×/24 h max). Reset `localStorage` `permigo-a2hs-*` pour rejouer.
- [ ] Déjà installée (standalone) → aucune sheet, entrée Réglages masquée.

## 🤔 Décisions prises seul (sans te réveiller)
- **PR, pas merge** : je ne merge jamais en autonomie. Tu valides au réveil.
- **Value-moment câblé côté moniteur uniquement** (tu as dit « focus enseignant ;
  l'élève est royal » → je n'ai pas touché au flow élève la nuit). Voir follow-up.
- **Pas de social proof chiffré** : risque de faux (ton audit). Copy bénéfice only.
- **Snooze de boot inchangé (3 j)** : le value-moment (1/24 h) gère la relance.
- **DuckDuckGo retiré** de la liste in-app (c'est un vrai navigateur, il sait installer).

## ⏭ Follow-ups (faciles — pour quand tu veux)
1. **Câbler le value-moment côté élève** (le plus gros volume retention) : 1 appel
   `promptInstallAtValueMoment(me, 'quiz_reussi')` après une victoire quiz/récompense.
   Volontairement laissé de côté cette nuit (ne pas toucher l'élève sans toi).
2. Bouton natif d'install desktop (Chrome desktop sait via `beforeinstallprompt`).
3. A/B le wording du moment de valeur.

## 🔗 Commits (6)
- aaedce2 feat(a2hs): rescue les contextes non-installables vers le vrai navigateur
- d1c9eba polish(a2hs): copy bénéfice/aversion à la perte
- 76eba03 feat(a2hs): déclencheur install au moment de valeur + entrée à la demande
- 64b049a feat(a2hs): entrée permanente « Ajouter à l'écran d'accueil » dans Réglages
- 83b0eee fix(a2hs): évite faux positifs in-app + masque entrée desktop
- (+ commit FLOWS/log/report de clôture)
