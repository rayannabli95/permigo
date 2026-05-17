# CLAUDE.md — Contexte projet PermiGo Game

> **Lu automatiquement par Claude Code à chaque session.** Source de vérité unique.

---

## 🎯 Mission (ne JAMAIS perdre de vue)

> **PermiGo transforme l'apprentissage du permis de conduire en habitude quotidienne.**

C'est la **couche d'engagement pédagogique** entre l'élève, son enseignant et son auto-école. **Pas un CRM. Pas une plateforme de réservation. Pas un système de paiement.**

## 🔒 RÈGLES NON-NÉGOCIABLES

### 1. Pas de données sensibles élèves
**Tu ne dois JAMAIS** créer une table, un champ ou une UI qui stocke :
- ❌ Numéro de téléphone élève
- ❌ Adresse postale élève
- ❌ NEPH (Numéro d'Enregistrement Préfectoral Harmonisé)
- ❌ Données bancaires / paiements
- ❌ Email personnel (juste un email d'invitation auto-écolé éphémère)

**Pourquoi** : l'auto-école garde la propriété de ses données clients. PermiGo = outil pédagogique pur. **Aucune exception.**

### 2. Pas de planning
**Tu ne dois JAMAIS** créer :
- ❌ Système de planning enseignant avec créneaux
- ❌ Réservation autonome élève
- ❌ Gestion d'horaires

L'élève voit son **crédit d'heures** (ex: "8h restantes"). Il prend RDV en dehors de l'app (WhatsApp, téléphone). PermiGo n'est pas Doctolib.

### 3. La pédagogie d'abord, le fun ensuite
Chaque mécanique gamifiée DOIT avoir une **conséquence pédagogique réelle**. Si tu codes un truc cosmétique sans valeur d'apprentissage → tu dégages.

Test à appliquer : *"Est-ce que cette feature aide à mémoriser/réussir le permis ?"*. Si non → tu poses la question à l'utilisateur avant.

### 4. Mobile-first absolu
Chaque écran codé doit être conçu et testé pour un iPhone d'abord. Min touch target : 44×44px. Safe areas (`env(safe-area-inset-*)`) gérées partout.

### 5. Mesurable dès le départ
Toute action utilisateur significative est trackée dans la table `events_analytics` avec event_name + properties. **Tu n'ajoutes pas une feature sans tracker son usage.**

---

## 🏗 Architecture technique

### Stack
- **Frontend** : Vite + JS vanilla modules + CSS scoped (pas de framework lourd)
- **Backend / DB** : Supabase (Postgres + Auth + Storage + Realtime)
- **Hosting** : Vercel (déploiement auto via GitHub push)
- **Domain** : permigo-game.vercel.app (custom plus tard)

### Stack interdite
- ❌ React / Vue / Angular (pas nécessaire, on garde vanilla)
- ❌ Express / Node serveur (Supabase suffit pour tout)
- ❌ JSX (tout reste en `.js` avec template literals)

### Modules métier (organisation `src/modules/`)
1. **pedagogie** : système Triple Validation (quiz post-validation, consolidation 48h, score cognitif)
2. **progression** : parcours REMC visuel, streak, XP, trophées, gemmes
3. **enseignant** : 1 écran simple "Mes élèves + bouton valider compétence"
4. **gerant** : dashboard "Pulse école" avec 4 KPI

---

## 📋 Workflow obligatoire à chaque session

### Quand tu ouvres une session
1. Lis ce fichier (déjà fait)
2. Lis `PRODUCT.md` et `ROADMAP.md` (pour comprendre où on en est)
3. Vérifie `git status` (commits non poussés)
4. Annonce à l'utilisateur : "*Je reprends sur [contexte]. Voici ce que je vais faire : [plan]*"

### Avant de coder une feature
1. Vérifie qu'elle correspond à `ROADMAP.md` (V1 / V2 / V3)
2. Vérifie qu'elle respecte les 5 règles non-négociables ci-dessus
3. Cherche dans le code existant si un composant similaire existe (réutiliser > recoder)
4. Code, teste localement, commit avec message descriptif

### Pattern obligatoire pour chaque page
```js
// src/pages/<role>/<nom>.js
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { trackEvent } from '@/services/analytics.js';

export async function mount(root, ...args) {
  const me = getCurUser();
  if (!me) return;

  trackEvent('page_view', { page: '<nom>', user_role: me.role });

  root.innerHTML = `<div class="skel"></div>`;  // skeleton
  const data = await loadData();                 // fetch
  root.innerHTML = renderTemplate(me, data);     // render
  wire(root);                                    // listeners
}
```

### Règles de code (non-négociables)
- **`esc()` partout** sur les données user dans `innerHTML` (sinon XSS)
- **`mount(root)` exporté** (pas de side effects au import)
- **CSS scoped** via `<style>` inline dans la page
- **Animations** : utilise les composants de `src/components/` (mesh-bg, reward-reveal, etc.)
- **Erreurs** : `try/catch` autour de chaque opération Supabase. Toast en cas d'erreur.

---

## 🗃 Structure DB Supabase (cf. `ARCHITECTURE.md` pour détails)

**Tables principales** :
- `profiles` (auth + rôles + crédit d'heures)
- `competences_remc` (31 sous-compétences officielles)
- `questions_competence` (3-5 questions par sous-compétence)
- `validations` (statut + score cognitif + consolidation)
- `quiz_attempts` (logs de toutes les tentatives)
- `streaks` (streak par élève)
- `leçons_realisees` (log simple, pas planning)
- `events_analytics` (tracking exhaustif)

**RLS obligatoire** sur toutes les tables. Pas d'accès "always true". Cf. `ARCHITECTURE.md` section RLS.

---

## 🎨 Design system (cf. `DESIGN_SYSTEM.md`)

- **Couleurs** : indigo `#6366f1`, violet `#8b5cf6`, cyan `#06b6d4`, fond `#0a0d1a`
- **Typo** : Plus Jakarta Sans (titres) + Inter (corps) + IBM Plex Mono (chiffres)
- **Tone copy** : sérieux mais chaleureux, tutoiement élève, vouvoiement gérant
- **Animations** : mesh gradient, glassmorphism, transitions cubic-bezier
- **Sons** : ding-success, streak-up, reveal-trophy (dossier `public/sounds/`)

---

## 🚀 Roadmap (cf. `ROADMAP.md` pour détails)

### V1 (en cours) — Le MVP "Triple Validation"
- Module pedagogie complet
- Module progression partiel (parcours + streak + XP)
- Module enseignant simplifié
- Module gerant : 4 KPI
- 30 questions sur 8 compétences

### V2 — Polish + gamification complète
- Trophées + gemmes + avatars
- Sons + animations premium
- 120 questions complètes
- Examens blancs

### V3 — Croissance
- Leagues + classements
- Page publique école
- Programme parrainage

**TU NE DOIS PAS coder une feature V2 si V1 n'est pas finie.** Toujours valider avec l'utilisateur si tu veux dévier.

---

## ❌ ANTIPATTERNS MONITEUR À NE JAMAIS FAIRE

Ces règles s'appliquent à tout ce qui touche au côté enseignant/moniteur. Violation = revert immédiat.

1. **Pas de mascottes, confettis enfantins, ton "Bravo champion"** — le moniteur est un professionnel adulte. Le ton est Linear/Notion, pas Duolingo enfant.
2. **Pas de monnaie virtuelle** (gemmes, coffres, points échangeables) — infantilise et dilue le sens de l'XP métier.
3. **Pas de leaderboard global brut** — toujours percentile relatif + cohorte homogène. Jamais "tu es 247e sur 3000" sans contexte.
4. **Pas de streak punitif** — jamais "tu vas perdre ton streak", jamais de notif culpabilisante. Le streak est un indicateur neutre, pas une menace.
5. **Pas de récompense pour vitesse de validation** — incite à bâcler des validations REMC. L'XP récompense le geste métier, pas la rapidité.
6. **Pas de surveillance managériale** — le gérant voit des agrégats d'auto-école uniquement. Jamais les stats nominatives d'un moniteur individuel sans son opt-in explicite.
7. **Pas de notif agressive** — max 1 push/jour côté moniteur, ton factuel ("3 compétences validées aujourd'hui"). Jamais émotionnel ou urgent.
8. **Pas de pay-to-win** — la monétisation est un abonnement auto-école. Aucune feature ne s'achète à la carte par le moniteur ; tout est inclus dans l'abonnement école.

Référence complète : `docs/MONITEUR_VISION_V3.md` section "8 antipatterns".

---

## 🔁 Workflow Git / Vercel

- **Branch principale** : `main`
- **Commits descriptifs** : `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- **Push** : déclenche un build Vercel automatique
- **Test** : toujours `npm run dev` localement avant de push
- **Si build foire** : check les logs Vercel via MCP, fix, re-push

---

## 💬 Communication avec l'utilisateur

### Style de réponse
- **Concis et direct** (l'utilisateur préfère économiser les tokens)
- **Pas de bullshit motivationnel** ("super idée !" sans valeur ajoutée)
- **Challenge poliment** quand l'utilisateur propose quelque chose qui contredit la mission
- **Propose des AskUserQuestion** quand il y a un choix produit à faire

### Quand demander confirmation
- Avant toute modification du **schéma DB** (migration)
- Avant toute **suppression de feature** existante
- Avant un **changement de positionnement** du produit
- Avant un **changement de prix**

### Quand agir en autonomie
- Bug fix sur du code existant
- Petite amélioration UX (animations, micro-interactions)
- Refactor interne sans changement de comportement
- Ajout de tracking / analytics

---

## 🎯 Le mantra à se répéter

Avant chaque feature, pose-toi 3 questions :

1. **Ça déclenche l'envie ?** (élève : clarté/contrôle, gérant : peur de perdre)
2. **Ça génère une métrique ?** (KPI mesurable)
3. **Ça simplifie la vie d'au moins 1 persona ?**

Si NON aux 3 → on dégage. Anti-scope-creep.

---

## 📞 En cas de doute

Si tu hésites sur une décision (technique ou produit), **demande à l'utilisateur** plutôt que d'assumer. Une question coûte moins qu'un refactor.

Bon code 🚀
