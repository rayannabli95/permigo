# Audit élève — état final + plan (post-lot 1)

Date : 2026-05-25 · Base : `main` @ `67bd984` (lot 1 fusionné + déployé en prod)

## 1. Ce qui est LIVE (lot 1 — terminé)
Fonctionnel : erreur≠vide coffres/boutique (B2 + B2bis), critère révision (B3), erreur refus séance traduite (B4), parcours/feedback ne cassent plus sur erreur réseau, gel série + nettoyages (B5).
A11y : focus au routage, un `<h1>` par page, `prefers-reduced-motion`, cibles 44px (C3), aria-live résultats (C2), focus-visible global (C1, déjà présent).
Visuel : fond accueil = image route (E2), opacité parcours augmentée (E3).
Cosmétiques : fonds permis + avatars **équipables et affichés** (header/HUD + carte permis) — E1 tranche 1.

## 2. Ce qui RESTE côté élève (vérifié dans le code actuel)

### 🟠 Lot 2 — Finir les cosmétiques (E1, en cours)
Le moteur d'équipement marche, mais il manque l'UX pour piloter et voir l'équipement partout.
1. **Galerie : bouton « Équiper »** sur les fonds + avatars possédés (aujourd'hui la galerie est en lecture seule — `0` bouton équiper).
2. **Boutique : badge « Équipé »** sur l'item actif + bouton **« Remettre par défaut »** (déséquiper).
3. **Profil : appliquer l'avatar équipé** (aujourd'hui `profil.js` / `profile-card.js` ne lisent pas `getEquippedAsset` → l'avatar équipé n'apparaît pas sur la fiche profil, seulement dans le header/HUD).
Effort : ~1 h. Sans risque (même mécanisme localStorage déjà prouvé, pas de base).

### 🟡 Lot 3 — Cohérence & finitions
4. **C5** — `accueil.js` : remplacer `onclick="location.reload()"` inline par `addEventListener` (durcissement CSP) ; `galerie.js` : ajouter un `toast` sur le `catch` silencieux. ~5 min.
5. **B6** — uniformiser l'affordance « retour » (← partout sur les pages profondes, pas ✕/texte) + harmoniser les libellés CTA (« Commencer » / « Démarrer »). ~25 min.

### 🤔 Décisions (à trancher avant de coder)
6. **B1 — galerie / wrapped** : un lien vers chacune a été détecté (à revérifier vs l'audit initial qui en trouvait 0). Action : confirmer qu'elles sont bien accessibles depuis la nav ; sinon câbler une entrée propre ou retirer les routes.
7. **C4 — notif tu/vous** : la notif de séance vouvoie alors que tout tutoie. Fix = migration SQL `notify_eleve_on_session_logged` **+ prod**. Décision : qui touche la prod.
8. **Bug Tomomi (coffres parcours)** : confirmé *pas un bug* — un coffre n'apparaît dans le parcours que pour un monde 100% terminé. Décision produit : laisser ainsi, OU afficher aussi les coffres streak/quiz dans le parcours (sinon ils ne sont visibles que dans « Mes coffres »).

### 🔵 Lot 4 — Dette de fond (optionnel, anti-récidive)
9. **Logger central** `src/utils/logger.js` (≈13 `console.*` dans les pages élève).
10. **Wrapper Supabase** uniforme (loading / error / empty) + composants `EmptyState` / `ErrorState` réutilisables → tue à la racine la classe « erreur = vide / skeleton infini ».
11. **Tests Playwright** (A3) jamais relancés cette session — à exécuter sur le Mac (`npm run test`) pour sécuriser les prochains merges.

## 3. Séquencement conseillé
1. **Lot 2** (cosmétiques finis) — le plus visible pour l'élève, sûr, ~1 h.
2. **Lot 3** (C5 + B6) — rapide, ~30 min.
3. **Décisions** B1 / C4 / Tomomi — trancher, puis exécuter (C4 = prudence prod).
4. **Lot 4** — quand tu veux consolider la base.

Chaque lot = 1 branche `fix/...` ou `feat/...` → PR → preview Vercel → merge (workflow validé au lot 1).

## 4. Verdict
Le côté élève est **sain et en prod**. Plus aucun bug bloquant connu. Ce qui reste = **finitions cosmétiques (lot 2), cohérence (lot 3), 3 décisions, et de la dette optionnelle**. Aucune urgence ; on avance lot par lot.
