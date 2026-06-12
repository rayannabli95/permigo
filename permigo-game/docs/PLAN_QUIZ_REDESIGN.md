# Plan — Refonte UI/UX des quizz (PermiGo élève)

> **But** : rendre les quizz **lisibles, modernes et fun** — pas un révision « code de la route trauma ».
> **Exécutant** : Fable. **Auteur du plan** : audit du code existant + skill ui-ux-pro-max (2026-06-12).
> **Contrainte absolue** : vanilla JS + template literals, `esc()`/`richEsc()` sur toute donnée injectée, mobile-first 44px, `prefers-reduced-motion` respecté, events `track()` conservés. Pas de framework.

---

## 0. Recherche — ce qui fait un bon quiz (à appliquer)

Synthèse (Duolingo / Kahoot / Quizlet + ui-ux-pro-max) :
1. **Une question par écran**, plein focus, zéro distraction (déjà le cas dans l'overlay — à garder).
2. **Cibles de réponse énormes** et scannables (préfixe A/B/C/D), pas de pavés.
3. **Feedback immédiat** : bonne = célébration courte ; mauvaise = **douce et pédagogique**, jamais punitive.
4. **Progression visible** segmentée (pips), pas une barre fine.
5. **Mascotte réactive** (réfléchit → content / encourage) = chaleur sans infantiliser.
6. **Une seule idée par question**, langage simple (cf. workstream B).
7. **Mouvement spring + haptique légère** sur les bons moments ; sortie plus rapide que l'entrée.

---

## Workstream A — Refonte visuelle (priorité 1, c'est l'essentiel)

### A1. Unifier le moteur (racine du « incohérent »)
- Extraire un module partagé **`src/components/eleve/quiz-ui.js`** : styles `<style>` communs + helper `renderQuestionCard()` + `revealAnswer()` + `renderHero()` + `mascotReact(state)`.
- **`quiz-engine.js`** et **`flash-quiz.js`** consomment ce module → **un seul look** sur post-validation, consolidation, question du jour ET flash-quiz.
- `flash-quiz.js` : supprimer les styles `fqz-*` divergents, brancher sur le module commun. Conserver sa spécificité (auto-avance par timer) mais avec le même rendu.
- *Hors scope ici* : la page parcours (`parcours-quiz.js`, data shape `enonce` ≠ `question`) — alignement visuel possible en phase 2.

### A2. Lisibilité de la question
- Titre question : `clamp(20px, 5.2vw, 26px)`, `line-height:1.45`, mesure max ~32em (≈ 60-65 caractères/ligne).
- Conserver `richEsc()` (auto-bold chiffres/unités/mots-pièges) mais adoucir le surlignage jaune actuel (moins criard, plus « marqueur doux »).
- Espacement vertical généreux (rythme 8px : 16/24/32).

### A3. Options de réponse
- Cible **min 56px de haut**, padding confortable, gap 12px.
- **Badge lettre A/B/C/D** à gauche (pastille ronde) → scannable, ludique.
- État par défaut : remonter le contraste (fond plus opaque, bordure plus nette) — l'indigo translucide actuel est trop faible sur le fond sombre.
- `:active` scale 0.97, `touch-action:manipulation`.

### A4. ⭐ Hero dynamique sur BONNE réponse (demande explicite)
- L'option choisie **se transforme en héros** : pop scale spring + halo doré/vert + (option) micro-confetti localisé à l'endroit du tap.
- **Mascotte célèbre** (skin `mascot-celebrate`).
- **Phrase d'encouragement qui VARIE** (rotation aléatoire, ≥ 8 variantes) : « Dans le mille ! », « Tu gères. », « Pile poil ! », « Réflexe parfait. », « Comme un·e pro. », etc. — jamais 2 fois la même d'affilée.
- **Compteur de série (streak)** qui grandit visuellement (flamme/chiffre) à partir de 2 bonnes d'affilée — réutiliser le son `playStreak` déjà câblé.
- Haptique `navigator.vibrate?.(20)` sur bonne, motif court sur streak.

### A5. Mauvaise réponse = DOUCE (anti-trauma, demande explicite)
- **Supprimer le shake rouge agressif** (`optShake`). Remplacer par : la bonne réponse s'illumine calmement en vert, la mauvaise se grise/teinte ambre **sans secousse**.
- En-tête d'explication : « À retenir » → ton coach bienveillant (« Le bon réflexe 👉 » / « La prochaine fois… »), reformuler comme une astuce, pas un reproche.
- Mascotte : variante encourageante (pas déçue/triste).
- Aucune notion d'échec brutal ; rappel que l'important c'est d'apprendre.

### A6. Progression
- Remplacer la barre fine par des **pips segmentés** (1 par question) qui se remplissent — style Duolingo. Pip courant mis en avant.

### A7. Écran de résultat (`quiz.js` + fin d'overlay)
- Reskin cohérent avec le nouveau langage visuel : grand chiffre en police display, mascotte, message **varié**, CTA unique clair.
- Conserver la logique existante (coffre 100%, gain ligue théorique, `submit_competence_quiz`).

---

## Workstream B — Typographie & couleur

### B1. Police (le « belle police qui donne envie »)
- **Ajouter `Fredoka`** (variable, ronde, amicale, **moderne sans être bébé** — adaptée 16-25 ans) pour les **moments hero / gros chiffres / titres de célébration** uniquement.
- **Garder `Plus Jakarta Sans`** (titres question) + **`Inter`** (options, explication) pour la lisibilité du contenu dense.
- ❌ Ne PAS prendre Comic Neue / Baloo (trop enfantin — recommandé par défaut mais inadapté à un public permis).
- Un seul `@import` Google Fonts avec `display=swap` (index.html ou CSS global). Préload de la variante critique.

### B2. Couleur — accent de célébration
- Garder les tokens existants (indigo `#6366f1`, violet `#8b5cf6`).
- **Ajouter un accent doré `#F59E0B`** réservé aux moments hero / streak (célébration, série) — réchauffe l'expérience.
- Bonne réponse = vert chaleureux ; mauvaise = neutre/ambre doux (**jamais rouge vif agressif**).
- Contraste texte ≥ 4.5:1 sur fond sombre (vérifier les états).

---

## Workstream C — Contenu des questions (secondaire, « questions compliquées à comprendre »)

> ⚠️ C'est du **contenu**, pas du visuel — séparable, peut être une passe Fable distincte.
- Cible : `questions_competence` (Supabase) + `src/data/parcours-quiz.js`.
- Règle : **une seule idée par question**, français simple, phrases courtes, supprimer le jargon, options non ambiguës.
- Méthode proposée : extraire les questions, passe de réécriture (LLM + relecture humaine Rayan), réinjecter. **Ne pas inventer de règles de conduite** — rester fidèle au REMC.
- Faire APRÈS le visuel (le visuel est le quick-win le plus visible).

---

## Fichiers concernés (pour Fable)

| Fichier | Action |
|---|---|
| `src/components/eleve/quiz-ui.js` | **CRÉER** — styles + helpers partagés (carte question, reveal, hero, mascotte) |
| `src/services/quiz-engine.js` | Refondre `renderQuestion`/`handleAnswer`/`finish` sur le module commun + hero/streak/anti-trauma |
| `src/pages/eleve/flash-quiz.js` | Aligner sur le module commun, retirer styles `fqz-*` divergents |
| `src/pages/eleve/quiz.js` | Reskin welcome-card + result-card cohérent ; messages variés |
| `index.html` ou CSS global | Ajouter import `Fredoka` + token `--gold:#F59E0B` |
| `src/data/parcours-quiz.js` + DB | (Workstream C) simplification du wording — passe séparée |

## Garde-fous (ne pas casser)
- `esc()` / `richEsc()` sur **toute** donnée question/option/explication injectée en `innerHTML`.
- Pattern `mount(root, param)` inchangé ; pas d'effet de bord à l'import.
- `prefers-reduced-motion` : désactiver pop/confetti/shake-replacement.
- Cibles tactiles ≥ 44px, `touch-action:manipulation`.
- Tous les `track()` existants conservés (analytics).
- `npm run lint && npm run build` verts avant commit ; tester le flow quiz réel.

## Ordre d'exécution conseillé
1. A1 (module commun) → 2. A2/A3 (lisibilité) → 3. A4/A5 (hero + anti-trauma) → 4. A6/A7 (progression + résultat) → 5. B1/B2 (police + or) → 6. C (contenu, passe séparée).
