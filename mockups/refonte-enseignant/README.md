# Maquettes — Refonte espace enseignant (TEMPS 1)

Prototypes statiques produits **avant implémentation** (cf. `PROMPT_CLAUDE_CODE_REFONTE_ENSEIGNANT.md`, §7 « Approche en 2 temps »). Objectif : faire valider la **structure visuelle** de E1 et E2 par le fondateur avant tout code lourd dans `permigo-game/src/pages/enseignant/`.

## Comment regarder

Ouvrir `index.html` dans un navigateur, puis chaque maquette. Pensé mobile-first : réduire la fenêtre à ~420px de large, ou ouvrir sur téléphone. Un cadre téléphone et un ruban « Bénéfice moniteur » sont ajoutés **uniquement pour la présentation** (ils ne font pas partie de l'écran final).

| Fichier | Chantier | Contenu |
|---|---|---|
| `index.html` | — | Page d'accueil des maquettes + rappel des décisions figées |
| `e1-trophees.html` | **E1** | Trophées enseignant au moteur visuel des trophées élève (`tr2-*`) |
| `e2-parcours.html` | **E2** | Parcours-pro en route sinueuse à badges (moteur `prc`) |

## E1 — Trophées enseignant

Reprend le « beau » de `src/pages/eleve/trophees.js` : hero + barre de progression, grille 3 colonnes, cartes par tier avec glow (le tier Diamant pulse), états verrouillés visibles (`???` + progression — ADN Clash Royale, pas d'empty state qui tue la motivation), bottom-sheet de détail.

- **Contenu** : les 12 jalons pédagogiques de `trophees-moniteur.js` (Bronze → Diamant), libellés métier moniteur.
- **Décision figée** : la modale ne montre **aucune gemme, aucune boutique**. La récompense affichée = l'objectif en **validations** + le contexte (« débloqué le… », « parmi les plus actifs de ton école »).
- **Palette** : hero en accent **pro encre/sombre** (`--ink2`/`--ink3`) avec halo **vert de marque** (`--a` `#58CC02`) ; cartes en couleurs de médaille (bronze/argent/or/platine/diamant), traitées comme des raretés.
- **Bénéfice moniteur** : preuve concrète de son travail — valorisant à débloquer, beau à montrer au patron.

État simulé : moniteur à **38 validations** (5/12 trophées débloqués).

## E2 — Parcours-pro (route à badges)

Porte la route sinueuse de `src/pages/eleve/parcours.js` au moniteur : path SVG 4 couches (ombre / bord / surface / marquage), portion parcourue en vert, nodes animés (`pop`), états **done / next / todo / locked**, badge « PROCHAIN OUTIL » sur le node actif, fiche palier en bottom-sheet au clic.

- **Source de données** : `MONITEUR_TIERS` de `src/data/moniteur-levels.js` — **10 paliers, jalons = nombre de validations cumulées** (3 → 8 → 15 → 30 → 50 → 80 → 120 → 170 → 230 → 300). Aucun autre type de jalon (décision figée n°2).
- **Chaque node = un outil utile débloqué** (export PDF, tableaux de bord, mode examen, vue d'ensemble…). C'est l'argument « utilité » : monter de palier = gagner du temps réel.
- **Hero** : compteur de validations + palier courant + progression vers le prochain outil (« Plus que 12 validations »).
- **Bénéfice moniteur** : rend visible et gratifiant un parcours sinon abstrait ; chaque palier = un gain concret.

État simulé : **38 validations** → paliers 1-4 débloqués, palier 5 (50) = prochain, suite à venir / verrouillée.

## Décisions figées (rappel — ne pas rouvrir)

1. **Monnaie = validations** (pas de gemmes ni boutique côté moniteur).
2. **Jalons = validations cumulées** uniquement (`MONITEUR_TIERS`).
3. **Palette = langage visuel élève** (vert de marque) + accent pro discret (encre/sombre).
4. **Nav « Progression »** = Parcours + Trophées + Ligue sous un onglet unique (la barre d'onglets figure en tête des deux maquettes).

## Conformité technique visée (pour l'implémentation TEMPS 2)

- **Vanilla JS / ES modules**, page = `mount(root, param)`, rendu `innerHTML`. Les maquettes simulent ce rendu en JS pur.
- **`esc()`** sur toute donnée injectée (simulé ici par une fonction `esc` locale ; en prod → `src/utils/escape.js`).
- **Tokens uniquement** : couleurs via `var(--…)` copiées de `src/styles/base.css` ; zéro couleur de marque inventée.
- **Mobile-first** ≤ 480px, cibles tactiles ≥ 44px (nodes 62px, boutons 50px), `prefers-reduced-motion` désactive les animations.
- **WCAG AA** : `aria-label` FR sur nodes/cartes, `:focus-visible` (anneau `--a`), `role="dialog"`/`aria-modal` sur les sheets, fermeture clavier (`Échap`).

## Ce qui n'est PAS dans les maquettes (à faire en TEMPS 2)

- Branchement Supabase réel (`validations`, `getMoniteurState`, `get_my_achievements`-équivalent moniteur).
- Réutilisation de `palier-sheet.js` existant comme fiche détail.
- Intégration dans `nav-bottom.js` (onglet « Progression ») et suppression de l'onglet « Récompenses ».
- Fusion/suppression de `badges-moniteur.js` et `recompenses.js`.
- Icônes via `icon()` du projet (les maquettes inlinent des SVG feather équivalents).
- `npm run build` / tests axe-core sur le rendu réel.
