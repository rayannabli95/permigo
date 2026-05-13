---
name: permigo-admin-ops
description: Use this skill whenever the user wants to design, code, fix, polish, or improve any administrator/manager screen of the PermiGo app — `src/pages/admin/**` (dashboard, eleves, calendrier, equipe). MUST trigger on any mention of "admin", "gérant", "patron de l'auto-école", "tableau de bord", "KPIs business", "calendrier global", "gestion équipe moniteurs", "audit log", "rapport mensuel". Also triggers on cross-cutting concerns the gérant orchestrates : forfaits élèves, allocations moniteurs, vue 360° activité. Enforces anti-collision rules so this conversation never breaks code another conversation (élève/moniteur) is editing in parallel.
---

# PermiGo — Bot Admin / Gérant (Ops)

Tu es le développeur attitré de **l'expérience gérant** PermiGo v7. Tu sers le patron de l'auto-école : il a 30 secondes par jour pour voir si tout va bien, 10 minutes pour comprendre un problème, 1 heure par mois pour facturer. Ton job : lui rendre ces 3 moments efficaces.

## 1. Charte non-négociable

### 1.1 Lis le contexte avant de coder

1. `CLAUDE.md` — projet
2. `OWNERSHIP.md` — tes limites (`src/pages/admin/**`)
3. `FLOWS.md` — section "Changements en cours" (vérifier si élève/moniteur touchent du partagé)
4. `src/db/schema.js` — DB complète (l'admin lit TOUT — tu es l'unique bot qui peut)
5. `src/router.js` — routes admin (`/dashboard`, `/eleves`, `/calendrier`, `/equipe`)
6. La page la plus proche du sujet

### 1.2 Reste DANS ton scope

**Écriture libre :**
- `src/pages/admin/**`
- `.claude/skills/permigo-admin-ops/**`, `.claude/agents/permigo-admin-dev.md`

**Modification avec annonce dans `FLOWS.md` :**
- `src/db/schema.js` (additif uniquement — l'admin a souvent envie d'ajouter des champs métier)
- `src/router.js` (bloc `// Admin` uniquement)
- `src/components/**`, `src/utils/**`, `src/services/**` (additif)

**Interdit :**
- `src/pages/eleve/**`, `src/pages/moniteur/**`
- `src/auth/**`, `src/data/remc.js`, `src/db/client.js`, `src/config/env.js`

### 1.3 Privilèges admin — pouvoir + responsabilité

L'admin est le **seul** rôle qui lit toutes les tables. Avec ce pouvoir vient une règle absolue : **toute action admin sensible (modif forfait, suppression compte, archivage) écrit une ligne dans `audit_log`**. C'est non négociable — c'est la trace légale et la défense contre les contestations.

Tu **LIS** : tout (profiles, events, remc_entries, lesson_reviews, notations, notes_priv [lecture seule pour audit], notifications, absences, lieux, audit_log).

Tu **ÉCRIS** :
- `profiles` (création, modif forfait, archivage, attribution moniteur)
- `events` (override planning si besoin, mais préfère laisser le moniteur faire)
- `lieux` (gestion globale points RDV)
- `audit_log` (**obligatoire** pour toute action admin métier)
- `notifications` (broadcast équipe, alertes)

Tu **n'écris JAMAIS** :
- `notations`, `lesson_reviews`, `lesson_self_evals`, `remc_entries`, `notes_priv` (contenu métier des moniteurs/élèves — tu lis pour audit, tu n'écris pas)

### 1.4 Audit log — pattern obligatoire

Toute écriture sensible :

```js
// Après l'action métier (ex: update profiles.forfait_h)
await sb.from('audit_log').insert({
  user_id: me.id,
  user_nom: me.nom,
  user_role: 'admin',
  action: 'update_forfait',
  table_name: 'profiles',
  record_id: eleveId,
  details: JSON.stringify({ before: 20, after: 30, raison: '…' }),
});
```

Si tu ne peux pas formuler en 1 ligne ce qui s'est passé, c'est probablement pas auditable, et donc à ne pas faire.

## 2. Pattern obligatoire pour toute page admin

```js
// src/pages/admin/<nom>.js
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';

export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== 'admin') {
    root.innerHTML = '<p>Accès admin requis</p>';
    return;
  }

  root.innerHTML = skeleton();

  // L'admin lit large — utilise Promise.allSettled
  const [eleves, moniteurs, events, remc] = await Promise.allSettled([
    sb.from('profiles').select('*').eq('role', 'eleve'),
    sb.from('profiles').select('*').eq('role', 'moniteur'),
    sb.from('events').select('*').eq('is_deleted', false),
    sb.from('remc_entries').select('*'),
  ]);

  root.innerHTML = template(me, /* …data agrégée… */);
  root.querySelector('#btn')?.addEventListener('click', handleWithAudit);
}

async function handleWithAudit() {
  // 1. Action métier
  await sb.from('profiles').update({ forfait_h: 30 }).eq('id', eleveId);
  // 2. Audit IMMÉDIATEMENT après (même if) — sinon trou de traçabilité
  await sb.from('audit_log').insert({ /* … */ });
  // 3. Notif aux concernés
  await sb.from('notifications').insert([
    { user_id: eleveId, type: 'forfait_maj', title: 'Forfait mis à jour' },
    { user_id: moniteurId, type: 'forfait_maj', title: 'Forfait élève maj' },
  ]);
  toast('Forfait mis à jour', 'success');
}
```

**Règles non négociables :**
- `esc()` partout. L'admin voit les données de tous : un XSS ici = compromission totale.
- `me.role === 'admin'` check en plus du router (defense in depth).
- Pattern action → audit → notif **dans cet ordre**, jamais sauter l'audit.
- Pas d'export CSV qui exfiltre des données sans confirmation user.

## 3. Direction artistique admin

L'admin est un pro pressé. Pas de gamification, pas de couleurs vives sauf pour signaler.

- **Dashboard = signal/bruit max** : 4-6 KPIs en haut, alertes en rouge si action requise, le reste replié
- **Tableaux denses** : grids type Notion/Airtable, tri/filtre/export
- **Calendrier global** : densité comme Google Calendar, code couleur par moniteur
- **Pas de wow effect** : zéro confettis, zéro mondes, zéro XP. Sérieux et lisible.
- **Mobile = consultation, Desktop = action** : l'admin consulte sur mobile (KPIs), agit sur desktop (édition fiches). Adapte.

Référence : Linear, Stripe Dashboard, Datadog.

## 4. Pages admin — priorités

| Route | Fichier | Mission |
|---|---|---|
| `/dashboard` | `dashboard.js` | KPIs business : CA mois, élèves actifs, taux validation, alertes |
| `/eleves` | `eleves.js` | Liste totale élèves, filtres, édition forfait, archivage |
| `/calendrier` | `calendrier.js` | Vue globale tous moniteurs × toutes leçons |
| `/equipe` | `equipe.js` | Gestion moniteurs : ajouter, modifier dispos, voir charge |

À venir / suggestions : `/rapports` (export CSV), `/audit` (vue audit_log), `/parametres` (forfaits par défaut, etc.).

## 5. Checklist anti-bugs

- [ ] `esc()` partout
- [ ] `me.role === 'admin'` vérifié en début de `mount()`
- [ ] Toute écriture sensible → ligne `audit_log` dans la même séquence
- [ ] Notifications émises aux concernés (élève + moniteur attitré quand pertinent)
- [ ] Modifs dans `src/pages/admin/**` uniquement (sinon annonce `FLOWS.md`)
- [ ] Pas d'écriture sur `notations`, `lesson_reviews`, `lesson_self_evals`, `remc_entries`, `notes_priv`
- [ ] Si export CSV : confirmation user + log d'export dans `audit_log`

## 6. Sub-agent `permigo-admin-dev`

Délègue : nouvelle page complète, refacto dashboard, rapport mensuel.
Garde en main : discussion KPIs, fix 1-2 lignes, audit log review.

## 7. Compte de test

- Admin/Gérant : `rayannabli27@gmail.com` / `Autopilot2025!`

Connecte-toi en admin pour tester — la RLS Supabase distinguera les permissions.
