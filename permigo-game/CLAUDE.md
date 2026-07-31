# CLAUDE.md — PermiGo

> **Lu à chaque session. Source de vérité unique du projet.**
> Le `/CLAUDE.md` à la racine n'est qu'un pointeur vers ce fichier.

⚠️ **Emplacement** : le projet vivant est **`permigo-game/`**. La racine `permigo-v7/` héberge un vieux projet Drizzle + Hono + SQLite (`dev.db`) **inutilisé** + des docs legacy. **Ne pas modifier le code à la racine** sans validation explicite. Tous les chemins ci-dessous sont relatifs à `permigo-game/`.

---

## 🧠 RÈGLE #0 — Scanner les skills avant de répondre

Avant de répondre à un message, regarde si une **skill** colle à la demande et **invoque-la** — sans attendre que l'utilisateur la nomme. Tu peux en combiner plusieurs (ex : `systematic-debugging` + `supabase-permigo`).

| Skill | Quand l'utiliser |
|---|---|
| `permigo-eleve-ux` | écran/UX **élève** (accueil, parcours, quizz, boutique, trophées) |
| `permigo-moniteur-ux` | écran/UX **moniteur** (aujourd'hui, mes-élèves, fiche, livret, classement) |
| `permigo-admin-ops` | écran **gérant/owner** (tableau de bord, équipe) — rare, espace dormant |
| `page-vanilla` | créer une **nouvelle page** vanilla |
| `supabase-permigo` | **DB / RLS / migration / edge function / auth** |
| `triple-validation` | flow **pédagogique** (validation compétence, quizz, consolidation) |
| `systematic-debugging` | « ça marche pas », bug, erreur, « pourquoi… » |
| `lint-and-validate` | valider (build / tests) après un change de code |
| `emil-design-eng` · `ui-ux-pro-max` | **polish UI**, animations, micro-interactions, design |
| `concise-planning` | « fais un plan », « découpe ça » |
| `grill-me` | stress-tester un plan / une décision **avant** de coder |
| `llm-council` | décision à fort enjeu (« X ou Y ») |
| `kaizen` | « améliore », refactor, réduire la dette |
| `git-pushing` · `permigo-ship` | commit, push, ouvrir une PR |
| `permigo-rls-audit` | audit sécurité RLS |
| `permigo-feature` · `permigo-demo` · `permigo-customer-onboard` | démarrer une feature / compte démo / setup client |

**Mode NIGHT RUN** : si l'utilisateur dit « night run », « bosse seul », « je dodo », « go autonome » → lis `.claude/NIGHT_RUN.md` et applique-le à la lettre.

---

## 🎯 La mission (le cap — PIVOT du 17/07/2026)

PermiGo = **le compagnon qui prépare l'élève avant chaque heure de conduite et l'accompagne entre deux leçons.** L'élève est le moteur ; le moniteur est **observateur et bénéficiaire** — il ne remplit RIEN d'obligatoire (la double saisie tue l'adoption, Rayan parle d'expérience de moniteur).

**La boucle produit — filtre de TOUTE feature** :

> **Préparer → Conduire → Débriefer → Consolider ou passer à la suite.**

Si un écran, un bouton ou une mécanique ne renforce pas cette boucle, on ne le développe pas. Chaque heure de conduite est un événement : avant, je me prépare ; après, je fais le bilan ; entre les deux, je progresse.

**Règles de ton** : jamais « échec » → « consolidation » (2-3 leçons sur un giratoire = NORMAL) ; jamais « compétence maîtrisée » → « certifiée par toi / prêt·e à pratiquer » ; éviter le mot « quiz » nu (l'élève fuit les « apps de code ») ; le cycle de l'élève n'attend JAMAIS le moniteur.

**Modèle** : Pass Permis **élève** (pré-vente live, cf. Monétisation) + abonnement moniteur 9,99 €/mois (dashboard passif : élèves mieux préparés, alertes, image moderne — proposition de valeur à re-tester depuis le pivot).

**Trou de marché** : les concurrents font réviser « le permis » (code) ; PermiGo prépare **la prochaine leçon de conduite**. Concurrents : Ornikar/EVS (à leur marque, code d'abord), éditeurs B2B (Codes Rousseau, Ediser), SaaS (Stych).

> 📜 L'ancien cap (« l'outil DU moniteur, à sa marque ») a été abandonné le 17/07/2026 — décision Rayan, détails dans la mémoire `vision_pivot_coach_eleve_2026_07_17.md`.

---

## 👥 Les rôles

- **élève** (apprenti) — **le moteur & le payeur principal** (Pass Permis). Il prépare ses leçons, se débriefe, **certifie lui-même** ses compétences (« Tu te sens prêt·e à passer à la suite ? ») — rattaché ou solo, même parcours.
- **moniteur** (`enseignant`) — **observateur & bénéficiaire** (abonnement 9,99 €). Dashboard en lecture : qui prépare, qui avance, qui bloque. Sa validation de séance existe encore mais n'est JAMAIS bloquante (retrait progressif en cours — lot 4 du pivot).
- **gérant** (auto-école) — **dormant / hors-cible**. ⚠️ On n'investit pas, on ne le route pas en avant, MAIS **on ne le supprime pas** : le rôle `gerant` est branché à l'auth, la nav ET au RLS (la policy `leads_select` — lecture des leads de la landing — en dépend). Retrait = chantier DB dédié, jamais un cleanup au passage. Détails GTM : `docs/GTM_PREMIERS_CLIENTS.md`.
- **owner** (= Rayan) — vue **plateforme** (tous les agrégats). Helpers DB : `is_owner()`, `get_owner_overview()`.

---

## 🎨 Le style par rôle (la DA)

Chaque rôle a son univers. **Côté moniteur : liberté totale** (aucune règle ne bride — fais le plus beau et le plus pro possible).

- **élève** : **violet** (accent `--a`) + premium ludique. Le **quizz est en « Arène 3D »** (nuit-violet + or, boutons plastique 3D, mascotte — esprit Clash Royale / Supercell). Accueil & boutique = clair premium.
- **moniteur** : **indigo `#4f46e5`** premium (Néo-arcade : panneaux routiers en fond, trophée 3D, classement local/national). Aucune contrainte de ton ou de mécanique.
- **gérant / owner** : **command-center** (tableau de bord, agrégats).

**🔤 UNE SEULE POLICE, PARTOUT : `Archivo`** (décision Rayan, 30/07/2026 — celle du hero « Prépare ta leçon »). Elle est chargée seule dans `index.html`, avec l'axe de graisses `400..900`.
⚠️ **N'introduis JAMAIS une 2e famille de texte**, y compris côté moniteur : c'est exactement ce qu'on vient de défaire (5 familles selon la page côté élève, 6 côté moniteur — dont 2 jamais téléchargées). Passe par `var(--fd)` / `var(--fb)`, ou écris `'Archivo'`. Les deux monos (`--fn`) restent, mais **pour les chiffres uniquement** (compteurs, scores, dates) : chasse fixe = les nombres ne dansent pas quand ils changent.

**✍️ COMMENT ON ÉCRIT DANS L'APP** (décision Rayan, 31/07/2026) : **zéro tiret** (`—`, `–`, `-` en séparateur) dans un texte affiché — ça fait « écrit par une IA ». Deux idées = deux phrases courtes. Et **pas de virgule dans un titre** : un titre, un bouton ou un sous-titre de carte tient sans ponctuation (« Une scène. Une décision. », « 3 min comme sur la route », « Noté sur 31 comme le jour J »). Pour accoler un prix ou une info à un libellé, le point médian `·` (« S'abonner · 9,99 €/mois »). La virgule reste normale dans les textes longs (fiches, FAQ, mentions légales). Le tiret n'a plus qu'un usage : le `—` placeholder d'une valeur absente dans un tableau.

**Tokens couleur (theme-aware, dans `base.css`)** : accent = `--a` / `--adk` / `--a-lt` / `--a-ink` / `--a-txt` · neutres = `--su` / `--mu` / `--bo` / `--ink` / `--gr-txt`.
**Pages « nuit »** (fond sombre plein écran) : colle `${chromeNight(hautHex, basHex)}` (`src/utils/chrome-night.js`) dans le `<style>` de la page — sinon le bandeau du haut et la barre du bas restent blancs et on voit la couture. À poser au niveau de la **vue**, pas du fichier : une page qui a aussi une vue claire (squelette, erreur) ne doit pas teinter le chrome pour tout le monde.
⚠️ **N'invente JAMAIS** `--surface` / `--border` / `--muted` → bug blanc-sur-blanc en dark mode. Pour du texte sur fond accent, utilise `--a-txt`.

---

## 🔒 Règles non-négociables (les seules qui restent)

1. **Pas de planning / réservation** — PermiGo n'est pas Doctolib. L'élève voit son **crédit d'heures** ; il prend RDV en dehors de l'app.
2. **Pas de données perso élève** — jamais de téléphone, adresse, NEPH, ni **paiement élève**. (L'email d'auth de l'élève est OK ; l'**abonnement moniteur via Stripe est OK** — c'est le produit. **Exception** : la pré-vente « Pass Permis » élève via `#/pass` / `pass-checkout` — test de demande décidé le 15/07/2026, cf. Monétisation.)
3. **Sécurité** :
   - **XSS** : toute donnée user injectée en `innerHTML` passe par **`esc()`** (`src/utils/escape.js`). _(`richEsc()` = variante du quizz qui gère le **gras** — elle vit dans `src/components/eleve/quiz-ui.js`, pas dans escape.js.)_
   - **RLS activée sur TOUTES les tables** (schema public, aucune exception).
   - `SUPABASE_SERVICE_ROLE_KEY` **jamais** côté client. Backend only.
   - Env client = préfixe **`VITE_`**.
   - Supabase = **singleton `sb`** (`src/auth/auth.js`). Pattern : `const { data, error } = await sb.from(...)` — toujours gérer `error` (try/catch autour de l'`await`).
4. **Mobile d'abord** — conçu/testé iPhone d'abord. Touch ≥ 44px. Safe areas (`env(safe-area-inset-*)`) partout.
5. **Mesurable** — toute action significative est trackée (`src/services/analytics.js`).

> 🗑️ Les anciens « antipatterns moniteur » (pas de jeu / points / classement / streak / ton fun) sont **supprimés** : le moniteur a déjà trophées, classement local+national, série et premium. **Liberté totale assumée.**

---

## 💳 Monétisation

- **Abonnement moniteur 9,99 €/mois** via **Stripe** (en place, en test — passage live à finaliser). C'est LE modèle.
- **Pré-vente « Pass Permis » ÉLÈVE (test de demande, lancé le 15/07/2026)** : page publique `#/pass` — 3 paliers (mensuel 9,99 €/mois · Pass 3 mois 24,99 € ⭐ cible · Pass 6 mois 39,99 €), pré-commande 100 % remboursable. Circuit : edge function `pass-checkout` (prix inline, marche invité ou connecté) → webhook → table `pass_purchases`. **Objectif : 5 payeurs réels.** ⚠️ Ce test lève l'interdit « pas de paiement élève » de la règle #2 — uniquement via ce circuit.
- **PermiGo+ élève** (~4,99 €/mois, optionnel, résiliable, zéro commission moniteur) = **gelé** (remplacé par le test Pass Permis ci-dessus).
- Offre « auto-école / per-seat » = **option lointaine**, jamais mise en avant.

---

## 🏗 Stack & emplacements

- Front : `src/` — **Vanilla JS (ES modules)** + **Vite**. Pas de TypeScript, React, react-query, shadcn.
- Pages : `src/pages/<role>/` — chaque page exporte **`mount(root, param)`**, rendu via `innerHTML`.
- Routing : **hash router maison** `src/router.js` (`#/route/{param}`, écoute `hashchange`).
- Auth + DB : **Supabase**. Singleton `sb` (`src/auth/auth.js`), user courant `getCurUser()` (`src/auth/cur-user.js`).
- Composants : `src/components/{common,eleve,enseignant}/` · utils : `src/utils/` · métier/réseau : `src/services/` (ex : `quiz-engine.js`).
- Alias import : `@/` → `src/`.
- DB : migrations `supabase/migrations/*.sql` (**jamais** modifier la prod à la main — passe par une migration). Edge functions `supabase/functions/`. Env `src/config/env.js` (`VITE_`).
- ⚠️ `src/db/client.js` = façade Drizzle legacy **non utilisée** par le front. Ignorer.

## ⌨️ Commandes (depuis `permigo-game/`)

- `npm run dev` · `npm run build` · `npm run preview`
- `npm run lint` → ⚠️ **stub** (« No lint configured yet ») : ne te fie pas à sa sortie verte, ce n'est pas un vrai lint.
- `npm run test` → Playwright e2e (`tests/e2e/*.spec.js`, dont `a11y.spec.js` via axe-core) · `npm run test:ui` en mode UI.
- Pas de `typecheck` ni `db:types`.
- **Avant un commit** : `npm run build` (vert obligatoire) + `npm run test` si tu touches un flow critique.

## 🧰 Outils locaux & savoir partagé (ce que les sous-agents ne devinent pas)

> Les **accès** (MCP, terminal) sont automatiques à chaque session. Le **savoir** ci-dessous ne l'est pas — il vit ici pour que **tous les agents l'aient**.

- **Transcripts YouTube** : `yt-dlp` (+ `ffmpeg`, installés via brew — local, gratuit, **sans clé ni compte**) récupère les **sous-titres auto** (le texte, pas la vidéo). ⚠️ YouTube **ne marche PAS** en web fetch (page en JS) → **toujours `yt-dlp`**. (C'est ce qui a produit les transcripts qui ont nourri les fiches de conduite.)
- **MCP branchés** : Supabase · Vercel · GitHub (+ CLI `gh` authentifié → Claude gère le Git/GitHub direct) · Playwright (navigateur) · Figma.
- **Stack = vanilla, PAS de React** (figé) : pour s'inspirer de 21st.dev / shadcn → **recoder en vanilla**, ne jamais importer du React (un 2e framework = poids + incohérence + réécriture). Persos/PNJ = images externes (PNG transparent) dans `public/skins/`.
- **Comptes** (identités — **jamais de mot de passe ici**) : owner `rayannabli27@gmail.com` · test moniteur `enseignant@test.fr` · test élève `eleve@test.fr`. Projet Supabase `arrfmdagdqtrtfbhxlty`.
- **Secrets** (clés, mots de passe) → `.env` (ignoré par Git) + dashboards Supabase/Stripe/Vercel. **Jamais dans ce fichier** (il est sur Git).

## 📄 Pattern d'une page

```js
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";

export async function mount(root, param) {
  const me = getCurUser();
  if (!me) return;
  track("page_view", { page: "<nom>", role: me.role });
  root.innerHTML = `<style>/* CSS scoped */</style><div class="skel">…</div>`; // skeleton
  const data = await load();          // try/catch + toast en cas d'erreur
  root.innerHTML = render(me, data);  // esc() sur TOUTE donnée user
  wire(root);                         // listeners
}
```

- Un module par fichier, fonctions camelCase. **CSS scoped** via `<style>` inline dans la page.
- i18n : **français pour l'UI**, anglais pour commentaires/variables.
- Logging : pas de logger central (des `console.*` traînent). Pas de règle « zéro console » en vigueur.

## 🔁 Boucle de vérification

- Modif d'une table → **migration SQL** dans `supabase/migrations/`.
- Donnée user en `innerHTML` → vérifier l'`esc()`.
- Build casse → on fixe **avant** de continuer (pas de « TODO fix later »).
- Avant « c'est fini » → `npm run build` (+ `npm run test` sur flows critiques) et **reporter la vraie sortie** (jamais prétendre que c'est vert sans avoir lancé).

## 🌳 Workflow Git / PR

- Une branche par feature (`feat/` `fix/` `chore/`). **Jamais de push direct sur `main`.**
- Conventional commits. Vérifier la **preview Vercel** avant merge (déploiement auto au push).

## 💬 Communication

- **Français simple, zéro jargon/anglicisme, réponses courtes.** Pour un choix produit, montre le **concret** (avant/après + pour/contre), pas des termes abstraits.
- Direct, pas de flatterie. **Challenge** poliment ce qui contredit le cap.
- Prends l'**initiative** (fais le premier pas, rapport complet) ; ne demande pas « je peux ? » pour un oui évident.

## 🚗 Domaine métier (REMC)

- **REMC** = Référentiel pour l'Éducation à une Mobilité Citoyenne (arrêté 13/05/2013).
- 4 compétences **C1–C4**. Livret officiel = **30 objectifs** (arrêté 29/07/2013, annexe III).
- Cœur pédagogique = **Triple Validation** (`src/services/quiz-engine.js`), **amendée par le pivot 17/07** : la phase 1 n'est plus la saisie moniteur mais la **pratique vécue en leçon + certification par l'élève** (quiz ≥ 80 % corrigé serveur, puis « Tu te sens prêt·e ? ») ; les quiz post-validation et consolidation 48 h sont inchangés. Détails : `.claude/skills/triple-validation/SKILL.md`. Toute mécanique gamifiée doit avoir une **vraie conséquence pédagogique**.

## ⚠️ Erreurs récurrentes (compléter quand Claude se trompe 2×)

- N'invente pas de tokens CSS (`--surface` / `--border` / `--muted`) → bug dark mode. Utilise `--su` / `--bo` / `--mu`.
- Tests e2e : le login attend **`body.has-chrome`** (et **non** `.acc2-hero-hi`, périmé). Les `.prc-node` du parcours animent → cliquer en DOM direct `locator.evaluate(el => el.click())`.
