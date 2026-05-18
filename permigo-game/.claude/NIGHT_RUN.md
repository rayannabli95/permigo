# 🌙 NIGHT RUN — Mode autonome 3h

> **Copie-colle TOUT ce fichier dans Claude Code après être dans le dossier `permigo-game/`. Le user dort. Tu bosses seul 3h. Tu lui montres ce que t'as fait au réveil.**

---

## 🎯 MISSION

Tu es Claude. Le user (Rayan) dort. Il a 3 heures devant lui avant de se réveiller. Pendant ces 3 heures tu vas :

1. **Améliorer** PermiGo Game (web app mobile-first auto-école)
2. **Sans aucune interruption** (sauf permissions critiques tout au début)
3. **En documentant** chaque action dans un fichier de log
4. **En finissant** par un commit + push complet + résumé clair

**Si tu te poses une question** type "*est-ce que je dois faire X ou Y ?*" → tu choisis l'option **la plus safe + la plus polish** et tu continues. Pas de pause pour demander.

---

## 🔐 ÉTAPE 0 — DEMANDE TOUTES LES PERMISSIONS EN UNE FOIS (30 sec)

**AVANT TOUT TRAVAIL**, présente au user (avant qu'il dorme) la liste exhaustive des permissions dont tu vas avoir besoin. Demande approbation **en masse** :

```
PERMISSIONS DEMANDÉES POUR LA NUIT (3h autonomes) :

✅ Lire/écrire/éditer TOUS les fichiers du projet permigo-game/
✅ Exécuter npm run dev, build, install, ci
✅ Exécuter git status, diff, log, add, commit, push (tous)
✅ Exécuter bash (find, grep, ls, cat, mkdir, mv, cp, rm sur le projet uniquement)
✅ Appeler tous les tools MCP Supabase (execute_sql, get_advisors, list_edge_functions, get_logs)
✅ Invoquer tous les sub-agents (Explore, general-purpose, Plan)
✅ Spawner skills (concise-planning, systematic-debugging, emil-design-eng, kaizen, etc.)
✅ Créer/éditer fichiers dans .claude/ (skills, hooks, settings, logs)

OK pour tout ?
```

Une fois validé → tu n'as plus le droit de demander quoi que ce soit pendant 3h.

---

## 📂 ÉTAPE 1 — CONTEXTE (5 min)

Avant de coder, lis dans cet ordre :

1. `CLAUDE.md` (règles non-négociables)
2. `ROADMAP.md` (avancement)
3. `ARCHITECTURE.md` (stack)
4. `.claude/skills/*/SKILL.md` (toutes tes skills installées)
5. Les **3 derniers commits Git** (`git log --oneline -10`)
6. État actuel : `git status`

Note dans `.claude/night-run-log.md` :
- Heure de start
- État initial (commits ahead/behind, fichiers modifiés)
- Plan détaillé que tu vas suivre

---

## 🛠 ÉTAPE 2 — TRAVAIL EN 4 PHASES (3h)

### PHASE 1 — Stabilisation (30 min)
**Objectif : 0 bug critique au matin.**

- Audit complet via skill `systematic-debugging` :
  - Page accueil élève (fix stale chunk + page blanche ?)
  - Page parcours (le nouveau design propre rend bien ?)
  - Page validation enseignant (sélection comp marche après fix RLS multi-moniteurs ?)
  - Page quiz (animations, tempo, contenu reformulé)
  - Page trophées (8 PNG bien affichés ?)
  - Page profil (avatar picker, carte permis avec backgrounds)
- Si bug trouvé → fix + commit avec message clair (`fix(scope): description`)
- Lance `npm run build` pour vérifier que ça compile
- **Skill obligatoire ici** : `lint-and-validate` après chaque fix

### PHASE 2 — Polish UX (1h)
**Objectif : améliorer le ressenti premium partout.**

Invoque obligatoirement la skill `emil-design-eng` avant tout changement visuel.

Liste prioritaire :
1. **Animations** : revue de tous les `transition: all` → spécifier (transform, opacity uniquement)
2. **Easings** : remplace les `ease-in` (sluggish) par `ease-out` custom (`cubic-bezier(0.23, 1, 0.32, 1)`)
3. **Bouton scale on :active** : `transform: scale(0.97)` partout où il manque
4. **Tempo** : aucune animation UI > 300ms
5. **scale(0)** → remplace par `scale(0.95) + opacity 0` (animation entrée naturelle)
6. **Popovers** : `transform-origin: var(--radix-popover-content-transform-origin)` au lieu de `center`
7. **prefers-reduced-motion** : check que toutes les anims respectent ça

Pour chaque page touchée → 1 commit `polish(scope): description`.

### PHASE 3 — Nouvelle fonctionnalité (1h)
**Objectif : pousser le produit en avant.**

Choisis **UNE** des features ci-dessous (priorité haut → bas, prends la première qui est réalisable en ~1h) :

1. **Onboarding élève premier login** — modal 3 slides : "Bienvenue / Triple Validation / Premier objectif" + animation festive. Trigger : `profile.first_value_action_at IS NULL`.
2. **Page enseignant "Aujourd'hui" en widgets Apple Health** — 3 cards : "À valider aujourd'hui (X)" / "Quiz consolidation à relancer (X)" / "Élèves inactifs (X)" avec actions directes.
3. **Système de rappels élève** — petite cloche flottante "Reviens demain à 18h" avec stockage local + Notification API (avec demande de permission propre).
4. **Refonte carte permis virtuel** avec animations subtiles selon palier + bouton "Partager ma carte" (Web Share API).

Si la feature est trop ambitieuse en 1h → fait la **moitié + TODO restant** clair, et passe à la phase 4.

### PHASE 4 — QA + Push + Report (30 min)
**Objectif : tout est mergeable et compréhensible au réveil.**

1. `npm run build` final → 0 error
2. Skill `kaizen` : passe 1 fois sur tout ce que t'as touché pour cherche les améliorations rapides
3. Vérif Supabase advisors (security + perf) : `mcp__supabase__get_advisors` → si nouveau warning, fix
4. **Skill `git-pushing`** : commit final + push origin
5. Génère `.claude/night-run-report.md` avec :
   - Heure début / fin / durée réelle
   - Liste des bugs fixés (titre + 1 ligne explication + sha commit)
   - Liste des polish appliqués
   - Feature nouvelle (description + screenshots ASCII si pertinent)
   - **À tester par toi au réveil** (checklist 5-8 items max)
   - Décisions prises seul + raison
   - Ce qui n'a pas été fait + pourquoi

---

## 🚦 RÈGLES STRICTES

### Tu n'as PAS le droit de :
- Demander une confirmation user (sauf l'approbation initiale des permissions)
- Modifier la DB Supabase sans backup d'abord (`pg_dump` ou copie de la requête)
- Supprimer un fichier non créé par toi cette nuit
- Toucher au schema DB sans migration explicite dans `supabase/migrations/`
- Toucher aux secrets (`.env`, clés API, tokens)
- Casser un test ou ignorer une erreur de build

### Tu DOIS :
- Invoquer la skill la plus pertinente AVANT chaque tâche (hook auto-scan-skills t'aide)
- Commit incrémental après chaque fix/polish (jamais un commit géant de 50 fichiers)
- Conventional commits (`fix(scope):`, `polish(scope):`, `feat(scope):`)
- Logger chaque action significative dans `.claude/night-run-log.md`
- Tester sur localhost (`npm run dev`) pour les changements visuels — au moins valider que ça démarre
- Si bug bloque → systematic-debugging + workaround + TODO clair
- Si tu doutes entre 2 options → la **plus safe + plus polish + plus mobile-first**

### Fallbacks intelligents (au lieu de demander)
- Pas sûr d'un wording ? → ton léger Duolingo, tutoiement, court
- Pas sûr d'une couleur ? → palette PermiGo existante (`#6366f1` indigo / `#10b981` emerald / `#f59e0b` amber / `#a855f7` violet)
- Pas sûr d'un timing ? → 200-250ms ease-out
- Pas sûr d'un padding ? → 16px ou 20px (8px multiples)
- Bug inattendu ? → revert le change, log dans report, passe à autre chose

---

## 🎁 BONUS — Si t'as fini les 4 phases avant 3h

Tasks bonus dans cet ordre :

1. **Tests E2E light** avec Playwright sur login → accueil → parcours → fiche comp (juste vérifier que les routes répondent)
2. **A11y audit** : tous les boutons ont aria-label, contrastes WCAG AA, focus visible
3. **Lighthouse** local sur la prod : note perf/a11y/SEO/best-practices et fix le low-hanging fruit
4. **Refacto** : sors les composants répétés en module (genre `<Section>`, `<Card>`, `<Pill>`) — skill `kaizen`
5. **Doc** : crée un `CHANGELOG.md` à la racine avec les changements de la session

---

## 📊 FORMAT DU REPORT FINAL (obligatoire)

```markdown
# 🌅 Night Run Report — [date]

## ⏱ Temps
- Start : 03:00
- Fin : 06:00
- Durée réelle code : Xh Ymin
- Phases complétées : 4/4 ou X/4

## ✅ Fait
### Bugs fixés (N)
- `fix(accueil): page blanche après deploy → auto-reload sur stale chunk` (a1b2c3d)
- ...

### Polish appliqué (N)
- `polish(quiz): easings ease-out custom + scale(0.97) sur boutons` (e4f5g6h)
- ...

### Feature nouvelle
- **Onboarding élève** : modal 3 slides + animation festive + tracking
  - Branchée dans `pages/eleve/accueil.js` au mount si `first_value_action_at` null
  - Slides : welcome.svg, triple-validation.svg, premier-objectif.svg
  - Tracking : `onboarding.started`, `onboarding.completed`, `onboarding.skipped`

## 🧪 À tester au réveil (5 items max)
- [ ] Accueil charge bien après push (pas de page blanche)
- [ ] Onboarding s'affiche pour un nouvel élève (test : reset `first_value_action_at` en DB)
- [ ] Quiz toujours fluide avec animations
- [ ] Validation enseignant marche comme avant (sélection comp OK)
- [ ] Build prod sans erreur

## 🤔 Décisions prises seul
- J'ai choisi le sablier d'icon SVG plutôt qu'un emoji pour l'état "en cours" (cohérence DA flat)
- J'ai utilisé `ease-out` cubic-bezier(0.23, 1, 0.32, 1) partout (recommandé par skill emil-design-eng)
- J'ai créé `<Section>` réutilisable car répété 6× dans les pages élève

## ⏸ Non fait + raison
- Refonte page enseignant "Aujourd'hui" : trop ambitieux pour le temps restant, marqué TODO
- Tests Playwright : skipé car npm install playwright = 5 min et risque casser node_modules

## 🔗 Commits (N)
- a1b2c3d fix(accueil): ...
- e4f5g6h polish(quiz): ...
- (liste complète)
```

---

## 🎬 GO

Une fois que t'as lu ce fichier en entier et que le user a approuvé les permissions :
1. Crée `.claude/night-run-log.md`
2. Démarre Phase 1
3. Bonne nuit Rayan ☕→🛌
