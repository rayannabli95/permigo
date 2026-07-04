# Prompt — Construire la bibliothèque UI « ultra qualité » de PermiGo

> À coller tel quel dans une nouvelle session Claude Code, à la racine du repo PermiGo.

---

Tu es un(e) **UI engineer + designer system senior**. Ta mission : construire pour PermiGo une **bibliothèque de composants UI de très haute qualité** — la référence unique où chaque élément de l'app existe, propre, cohérent, avec toutes ses variantes et tous ses états. Objectif : qu'on ne réinvente plus jamais un bouton ou une carte à la main, et que l'app arrête de « faire IA » (pictos génériques, styles disparates).

Travaille en **autonomie** : tu décides, tu construis, tu vérifies toi-même (build + captures), tu me montres le résultat. Ne me demande pas de valider chaque micro-choix ; prends l'initiative et rends un rapport clair à la fin.

## 1. Contexte projet (lis-le AVANT de coder)

- **Le projet vivant est `permigo-game/`.** Tous les chemins sont relatifs à ce dossier. Ne touche jamais au code à la racine `permigo-v7/` (vieux projet mort).
- **Source de vérité : lis `permigo-game/CLAUDE.md` en entier** (cap produit, rôles, DA par rôle, contraintes, commandes).
- **Stack figée : Vanilla JS (ES modules) + Vite. PAS de React, TypeScript, Tailwind, shadcn.** CSS **scoped** via `<style>` inline dans chaque page/composant. Import alias `@/` → `src/`.
- **Tokens couleur (theme-aware, dans `src/base.css`) — la fondation. NE LES INVENTE PAS, réutilise-les :**
  - Accent (par rôle) : `--a` / `--adk` / `--a-lt` / `--a-ink` / `--a-txt`
  - Neutres : `--su` (surface) / `--mu` (muted) / `--bo` (border) / `--ink` (texte) / `--gr-txt`
  - ⚠️ **N'invente JAMAIS `--surface` / `--border` / `--muted`** → bug blanc-sur-blanc en dark mode. C'est l'erreur n°1 à éviter.
  - Le thème **clair ET sombre** doit marcher partout, uniquement via ces tokens.
- **DA par rôle :**
  - **élève** : violet (accent `--a`) + premium ludique. Le monde quiz/révision = **« Arène 3D »** (nuit-violet `#1e1240`→`#0f0824` + or `#ffd24a`, boutons « plastique » relief, mascotte, esprit Clash Royale). Accueil & boutique = **clair premium**.
  - **moniteur** (`enseignant`) : **indigo `#4f46e5`** premium (Néo-arcade, Fredoka, trophées 3D).
- **Polices** : élève = Baloo 2 (titres) / Fredoka (labels) / Nunito (texte) ; moniteur = Fredoka / indigo ; commun = Plus Jakarta Sans / Inter.
- **Icônes** : il existe un **set « médaillon » cohérent** dans `src/pages/eleve/reviser.js` (fonction `med(id,stops,glyph)` + objet `MED`) — disque dégradé + biseau + reflet + glyphe blanc. Réutilise CE langage pour toute nouvelle icône. Assets réels servis depuis `public/` : `/skins/*.webp` (badges 3D, trophées, flamme, coin volant), `/signs/*.svg` (panneaux), `/worlds/volant.png`, mascottes `/skins/mascot-*.png`. Helper monnaie : `src/utils/volant.js` (`volantImg()`).

## 2. Contraintes NON-NÉGOCIABLES

1. **Sécurité XSS** : toute donnée dynamique injectée en `innerHTML` passe par `esc()` (`src/utils/escape.js`).
2. **Mobile d'abord** : conçu/testé iPhone. Cibles tactiles ≥ 44px. Safe areas `env(safe-area-inset-*)`.
3. **Accessibilité** : contraste AA, focus visible, `aria-*` corrects, respect de `prefers-reduced-motion`. (Le projet vise **0 violation axe-core** — ne le casse pas.)
4. **Theme-aware** : chaque composant rendu correct en clair **et** sombre via les tokens. Aucun token inventé.
5. **Zéro « effet IA »** : pas de picto trait monochrome nu flottant dans un carré. Iconographie « branded » (médaillons, vrais assets), profondeur maîtrisée.
6. **Ne casse pas la prod** : ce chantier construit une **galerie de référence + des primitives opt-in**. Tu peux extraire des primitives réutilisables, mais **ne refactore pas au passage les pages existantes en production** (c'est un autre chantier). Concentre-toi sur la galerie et des helpers réutilisables.

## 3. Livrable

**A. Une « galerie vivante » (le cœur du livrable)** — un seul fichier autonome `permigo-game/mockups/ui-kit.html` qui :
- importe les vrais tokens (`<link rel="stylesheet" href="../src/base.css">` ou copie les variables si l'import échoue au rendu statique),
- rend **chaque composant avec TOUTES ses variantes ET tous ses états côte à côte**,
- a un **toggle clair/sombre** et un **toggle rôle (élève / moniteur)** en haut, pour tout vérifier d'un coup,
- est organisé en sections claires (Fondations → Boutons → Formulaires → … voir §4),
- pour chaque composant : un petit titre, le rendu, et en commentaire le snippet HTML/CSS à copier.

**B. Un catalogue court** `permigo-game/mockups/ui-kit.md` : pour chaque composant → nom, quand l'utiliser, variantes/états, 1 snippet minimal.

**(Optionnel, seulement si le temps le permet)** Miroir dans Figma : une bibliothèque de composants + tokens. Ne le fais QUE si la galerie code est finie et vérifiée.

## 4. Composants à couvrir (« la plupart des éléments »)

Inventorie d'abord l'existant dans `src/components/{common,eleve,enseignant}/` et le CSS scoped des pages, puis couvre au minimum :

- **Fondations** : palette de tokens (accent par rôle + neutres), échelle de rayons, échelle d'ombres, échelle typo (tailles/poids), espacements, z-index.
- **Boutons** : primaire (plein accent ; + variante « plastique 3D » Arène vert/or), secondaire, ghost/tertiaire, danger, icône-seul ; tailles sm/md/lg ; pleine largeur ; états hover/active/disabled/loading.
- **Formulaires** : input texte, mot de passe (avec œil), textarea, select, checkbox, radio, switch/toggle, **segment control 2/3 segments**, recherche. Avec label + aide + message d'erreur ; états focus/error/disabled.
- **Cartes** : carte de base, carte cliquable (affordance : chevron plein + profondeur), carte média, **tuile Arène « plastique »**, carte stat/KPI.
- **Chips / badges / pastilles** : chip filtre, badge compteur, badge statut (« Nouveau », « Mini-jeu »), **pastille volants** (via `volantImg`), tag.
- **Icônes** : le **set médaillon** (au moins 6-8 glyphes cohérents), rappel des badges 3D & panneaux réels.
- **Navigation** : bottom-nav 5 portes (état actif), header-top (logo + solde + avatar), tabs, bouton retour, **FAB**.
- **Overlays** : bottom-sheet, modal/dialog, **toast** (succès/erreur/info), tooltip/popover, une étape de tuto guidé, confirmation.
- **États & feedback** : skeleton (plusieurs formes), **empty-state** (illus + titre + sous-titre + CTA), error-state, spinner + écran de chargement « feu vert », **barre de progression** (piste + remplissage), anneau de progression, flamme de série, compteur animé.
- **Listes** : ligne de liste (média + titre + sous-titre + action à droite), ligne cliquable, séparateur, en-tête de section, accordéon.
- **Avatars** : avatar user, groupe d'avatars, sélecteur d'avatar.
- **Bannières** : alerte, nudge d'installation, bandeau émotionnel, bandeau cookies.

## 5. Barre de qualité « ultra »

- Chaque composant montre **toutes ses variantes et tous ses états** (pas juste l'état par défaut).
- **Profondeur réelle mais maîtrisée** : ombres multi-couches + highlight interne quand c'est justifié ; jamais plat sans vie, jamais néon criard partout.
- **Micro-interactions** (principes Emil Kowalski) : transitions 150–250ms, easing naturel (`cubic-bezier(.23,1,.32,1)`), feedback `:active` (léger scale/translate), tout coupé sous `prefers-reduced-motion`.
- **Cohérence** : mêmes rayons, même échelle d'ombres, même grammaire d'un composant à l'autre.
- **Lisibilité** : hiérarchie typo nette, contraste AA en clair comme en sombre.
- **Copie FR** dans les exemples : français simple, zéro anglicisme.

## 6. Méthode

1. **Lis** `CLAUDE.md` + `src/base.css` (tokens) + parcours `src/components/**` et le CSS scoped de 4-5 pages représentatives (`accueil.js`, `reviser.js`, `boutique.js` côté élève ; `aujourdhui.js` côté moniteur). Note les incohérences et doublons.
2. **Construis la galerie** section par section (fondations d'abord). Réutilise les tokens, jamais d'invention.
3. **Vérifie visuellement** : sers `mockups/` (`python3 -m http.server`) et **capture avec Playwright** en clair ET sombre, rôle élève ET moniteur (largeur 390px). Corrige ce qui est plat, incohérent, ou cassé en dark mode.
4. **Build** : `npm run build` doit être **vert** (reporte la vraie sortie).
5. **Documente** : écris `ui-kit.md`.
6. **Rends un rapport** : ce qui est couvert, captures clair/sombre, incohérences repérées dans l'existant (liste pour un futur chantier de refonte), et ce qui reste.

## 7. Definition of Done

- [ ] `mockups/ui-kit.html` couvre la liste du §4, avec variantes + états, toggles clair/sombre + rôle.
- [ ] Rendu vérifié par captures (clair & sombre, élève & moniteur) — fournies dans le rapport.
- [ ] `npm run build` vert.
- [ ] `ui-kit.md` écrit.
- [ ] Aucune page en production modifiée (galerie + primitives opt-in uniquement).
- [ ] Rapport final avec la liste des incohérences repérées dans l'existant.

Commence par lire `CLAUDE.md` et `src/base.css`, puis inventorie l'existant avant d'écrire la moindre ligne de composant.
