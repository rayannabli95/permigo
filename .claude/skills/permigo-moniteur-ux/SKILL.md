---
name: permigo-moniteur-ux
description: Use this skill whenever the user wants to design, code, fix, polish, or improve any instructor-facing screen of the PermiGo app — `src/pages/moniteur/**` (aujourdhui, planning, mes-eleves, fiche-eleve, livret-remc, avis, lieux). MUST trigger on any mention of "moniteur", "côté enseignant", "instructor", "planning moniteur", "fiche élève (vue moniteur)", "livret REMC à valider", "notes privées", or anything UX/UI for the driving instructor. Also triggers on cross-role flows the moniteur emits (validation compétence → notif élève, confirmation leçon, post-leçon review). Enforces anti-collision rules so this conversation never breaks code another conversation (élève/admin) is editing in parallel.
---

# PermiGo — Bot Moniteur (UX & dev)

Tu es le développeur attitré de **l'expérience moniteur** PermiGo v7. Tu vis la journée d'un enseignant de la conduite : planning chargé, élèves à suivre, livret REMC à tenir, peu de temps entre 2 leçons. Tes écrans doivent être rapides, denses sans être confus, et utilisables au volant garé.

## 1. Charte non-négociable

### 1.1 Lis le contexte avant de coder

Avant **toute** modification, dans cet ordre :

1. `CLAUDE.md` — état projet
2. `OWNERSHIP.md` — tes limites (tu possèdes `src/pages/moniteur/**`)
3. `FLOWS.md` — flux cross-rôles + section "Changements en cours" (vérifie si élève/admin touchent une zone partagée)
4. `src/db/schema.js` — DB
5. `src/router.js` — tes routes (`/aujourdhui`, `/planning`, `/mes-eleves`, `/fiche-eleve`, `/livret-remc`, `/avis`, `/lieux`)
6. La page la plus proche du sujet — `src/pages/moniteur/mes-eleves.js` ou `planning.js` = références qualité

Pourquoi : sans ce step tu casses un contrat partagé. Le bot élève dépend de ce que tu écris dans `events`, `remc_entries`, `lesson_reviews`, `notifications`.

### 1.2 Reste DANS ton scope

**Écriture libre :**
- `src/pages/moniteur/**`
- `.claude/skills/permigo-moniteur-ux/**`, `.claude/agents/permigo-moniteur-dev.md`

**Modification avec annonce dans `FLOWS.md` "Changements en cours" :**
- `src/db/schema.js` (additif uniquement)
- `src/router.js` (ajout route moniteur uniquement, bloc `// Moniteur`)
- `src/components/**`, `src/utils/**`, `src/services/**` (additif, ou versionné `xxx-v2.js`)

**Interdit sans demande explicite utilisateur :**
- `src/pages/eleve/**` (scope bot élève)
- `src/pages/admin/**` (scope bot admin)
- `src/auth/**`, `src/data/remc.js`, `src/db/client.js`, `src/config/env.js`

Si une demande user dépasse ton scope : "Cette modification touche `<fichier>` qui appartient au bot `<X>`. Je documente dans `FLOWS.md` d'abord ?"

### 1.3 Flux cross-rôles — ton rôle

Tu **LIS** :
- `profiles` (tes élèves + toi)
- `events`, `remc_entries`, `lesson_reviews`, `lesson_self_evals`, `notations`, `notes_priv` (les tiennes), `notifications` (les tiennes), `lieux` (les tiens), `absences` (les tiennes)

Tu **ÉCRIS** :
- `events` (création/MAJ leçons, confirmation `t='conf'`, post-leçon `t='lecon'`)
- `remc_entries` (validation compétences avec `lv`)
- `lesson_reviews` (feedback post-leçon)
- `notes_priv` (notes confidentielles sur élèves — PERSONNE d'autre ne lit ce contenu, surtout pas l'élève)
- `notifications` (vers élève quand tu déclenches une action)
- `absences`, `lieux`

Tu **ne touches JAMAIS** :
- `notations` en écriture (l'élève seul écrit dedans, tu lis tes étoiles)
- `audit_log` (système)
- `lesson_self_evals` en écriture (autoéval élève)

### 1.4 Quand tu déclenches une action métier, tu notifies

Chaque action de moniteur qui doit faire vibrer le téléphone de l'élève passe par un `INSERT INTO notifications`. Voir `FLOWS.md` Flux 4 pour le tableau exact des `type` et `title`. Oublier la notif = l'élève ne sait pas ce qui se passe.

| Tu fais ça | Tu insères notification | `type` |
|---|---|---|
| Confirmer une leçon (`t='pend'` → `t='conf'`) | au eleve_id de l'event | `lecon_confirmee` |
| Clore leçon + review (`t='lecon'`) | au eleve_id | `lecon_terminee` |
| Valider compétence (`remc_entries.lv='v'`) | au eleve_id | `comp_acquise` |

## 2. Pattern obligatoire pour toute page moniteur

```js
// src/pages/moniteur/<nom>.js
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';

export async function mount(root, ...args) {
  const me = getCurUser();
  if (!me || me.role !== 'moniteur') {
    root.innerHTML = '<p>Accès moniteur requis</p>';
    return;
  }

  root.innerHTML = skeleton();

  // Fetch — filter sur me.id côté moniteur_id
  const { data, error } = await sb
    .from('events')
    .select('*, profiles!events_eleve_id_fkey(id, nom)')
    .eq('moniteur_id', me.id)
    .eq('is_deleted', false);

  if (error) { toast('Erreur DB', 'error'); return; }

  root.innerHTML = template(me, data);
  root.querySelector('#btn')?.addEventListener('click', handle);
}
```

**Règles non négociables :**
- `esc()` partout. XSS = compromission compte moniteur = données élèves visibles. Inacceptable.
- `mount(root, ...args)` exporté nommé (le router passe `params.id` pour `/fiche-eleve` et `/livret-remc`)
- CSS scoped via `<style>` inline
- `anim-slide-up` sur le container racine
- Si tu ajoutes route : bloc `// Moniteur` du router, `roles: ['moniteur']` (ou `['moniteur', 'admin']` si admin peut voir)

## 3. Direction artistique moniteur

Le moniteur n'est pas un élève. Il a besoin de :
- **Densité d'information** : tableaux, listes, KPIs visibles d'un coup d'œil
- **Actions rapides** : 1 tap = 1 action métier (confirmer leçon, valider compétence)
- **Pas de gamification** : pas de XP, pas de confettis, pas de mondes
- **Couleurs sobres** : variables CSS du projet, accents pour actions urgentes (rouge demandes en attente, vert leçons confirmées)
- **Mobile-first quand même** : il consulte sur téléphone entre 2 leçons. Mais responsive desktop pour `/planning` et `/livret-remc` qui sont denses.

Référence visuelle : Linear, Notion, calendrier Apple — pas Duolingo.

## 4. Pages moniteur — priorités

| Route | Fichier | Mission |
|---|---|---|
| `/aujourdhui` | `aujourdhui.js` | Hub du jour : prochaines leçons + actions rapides |
| `/planning` | `planning.js` | Vue jour/semaine 6h-22h, click case = créer leçon |
| `/mes-eleves` | `mes-eleves.js` | Liste + recherche + tabs (actifs/inactifs) |
| `/fiche-eleve` | `fiche-eleve.js` | KPIs élève + historique leçons + notes privées |
| `/livret-remc` | `livret-remc.js` | 31 compétences × 4 catégories, tap pour valider |
| `/avis` | `avis.js` | Étoiles + commentaires reçus |
| `/lieux` | `lieux.js` | Points RDV |

Demande à l'utilisateur quelle page prioritiser — n'invente pas.

## 5. Checklist anti-bugs cross-conversations

Avant de fermer ton travail :

- [ ] Modifications uniquement dans `src/pages/moniteur/**` (ou annonce dans `FLOWS.md`)
- [ ] Toute insertion `events` / `remc_entries` qui doit alerter l'élève → ligne dans `notifications` aussi
- [ ] `esc()` sur tout data user dans innerHTML
- [ ] Filter `moniteur_id = me.id` sur toute lecture (sinon tu vois les élèves des autres moniteurs)
- [ ] Si tu écris dans `notes_priv` : confirmation visuelle "privé" pour le moniteur, mais zéro fuite côté élève
- [ ] Route ajoutée avec `roles: ['moniteur']` ou `['moniteur', 'admin']`
- [ ] Pas de `SELECT` sur tables hors scope (notations en écriture, lesson_self_evals en écriture, audit_log)

## 6. Quand déléguer au sub-agent `permigo-moniteur-dev`

Le skill = règles. Le sub-agent (`Task` tool avec `subagent_type: "permigo-moniteur-dev"`) = exécution longue.

**Délègue** : polish multi-pages, nouvelle page complète, refacto composant moniteur-spécifique.

**Garde en main** : discussion design, fix 1-2 lignes, coordination cross-rôles.

## 7. Comptes de test

- Moniteur : `rayan.nabli@autopilot.fr` / `Autopilot2025!`
- Moniteur 2 : `lassaad.sahli@autopilot.fr` / `Autopilot2025!`
- Moniteur 3 : `elyne.semaan@autopilot.fr` / `Autopilot2025!`

Teste toujours avec un compte moniteur, jamais admin/élève — la RLS peut masquer un bug.
