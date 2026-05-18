# Cowork TODOs — Demandes de Claude Code

> Fichier géré par Claude Code pour signaler des modifications dans la ZONE INTERDITE.
> Cowork applique ces changements.

---

## [2026-05-18] 🆕 CHANTIER PERMIGO LOG — Sessions moniteur (zéro planning, full gamif)

> **Concept :** PermiGo n'est PAS un outil de planning. Le moniteur log ses sessions APRÈS coup en 3 taps. L'élève confirme (anti-triche). Ranking moniteur 4-dim. ADN = Uber Driver + Apple.
> **Détail produit complet** dans la conversation Cowork du 2026-05-18.

### ✅ Backend DÉPLOYÉ en prod le 2026-05-18 (Cowork)

**Table `sessions_moniteur`** :
```sql
CREATE TABLE sessions_moniteur (
  id uuid PK,
  moniteur_id uuid → profiles,
  eleve_id uuid → profiles,
  duration_minutes int CHECK (IN (30,45,60,90,120,150,180)),
  session_date date,            -- jour réel de la session
  logged_at timestamptz,        -- horodatage saisie
  confirmation_status text,     -- 'pending'|'confirmed'|'refused'|'auto'
  confirmed_at timestamptz,
  flagged boolean,
  notes text
);
```

**RPC disponibles (à utiliser côté Claude Code) :**

```js
// 1. Logger une session (côté moniteur)
const { data, error } = await sb.rpc('log_session', {
  p_eleve_id: eleveId,
  p_duration_minutes: 120,    // 30|45|60|90|120|150|180
  p_session_date: '2026-05-18', // YYYY-MM-DD, max 48h ago
  p_notes: null
});
// Retour : { ok: true, session: {...} } OU { error: 'cap_daily_exceeded'|'cap_weekly_exceeded'|'session_too_old'|'invalid_duration' }

// 2. Confirmer/refuser une session (côté élève)
await sb.rpc('confirm_session', {
  p_session_id: id,
  p_status: 'confirmed'  // 'confirmed' | 'refused'
});

// 3. Sessions à confirmer pour l'élève (banner home élève)
const { data } = await sb.rpc('get_my_pending_sessions');
// Retour : [{ id, moniteur_prenom, duration_minutes, session_date }]

// 4. Récap journée moniteur (widget soir accueil)
const { data } = await sb.rpc('get_my_today_sessions');
// Retour : [{ id, eleve_prenom, duration_minutes, confirmation_status }]

// 5. Suggestions smart (habitudes)
const { data } = await sb.rpc('suggest_next_session', {
  p_day_of_week: 2  // 0=dimanche, 1=lundi...
});
// Retour : [{ eleve_id, eleve_prenom, typical_duration, last_seen_at, score }]

// 6. Ranking moniteurs du mois (Pulse gérant + Profil moniteur)
const { data } = await sb.rpc('get_moniteur_ranking', {
  p_month: '2026-05-01'  // 1er du mois, défaut = mois courant
});
// Retour : [{ moniteur_id, moniteur_prenom, score_total, hours_confirmed, n_validations, n_eleves_diff, n_jours_actifs, rank }]
```

**Garde-fous appliqués côté DB (CHECK + trigger BEFORE INSERT) :**
- Cap 10h/jour par moniteur (CHECK contre SUM existant)
- Cap 50h/semaine par moniteur
- Session date max 48h dans le passé
- Duration valide uniquement (30/45/60/90/120/150/180 min)
- Insert auto crée une notif `session_confirmation` pour l'élève
- pg_cron `auto-confirm-sessions-daily` à 03h UTC qui passe `pending` → `auto` après 7j

**dispatch-push v4** ajoute le type `session_confirmation` qui rend :
- title : `Confirme ta session avec {moniteur_prenom}`
- body : `{duration_minutes} min · {date_lisible}`
- route : `#/` (accueil élève — la bannière de confirmation se trouve là)

### 🎨 Frontend à faire (pour Claude Code)

#### 3.1 FAB "+ Session" — composant `src/components/log-session-fab.js`

Bouton flottant rond en bas-droite, visible sur **toutes les pages moniteur** (enseignant + gerant si gérant fait aussi de la conduite). Icône `plus`, accent indigo, animation pulse subtile.

```js
import { mountLogSessionFab } from '@/components/log-session-fab.js';

// Dans router.js ou main.js, après route enseignant/gerant :
if (me.role === 'enseignant' || me.role === 'gerant') {
  mountLogSessionFab(document.body);
}
```

Tap → ouvre modal `log-session-modal.js`.

#### 3.2 Modal log session — `src/components/log-session-modal.js`

3 sections, scroll vertical :

**A. Choix élève** : liste avec dernière session pré-cochée. Pull suggestions de `suggest_next_session(today_day_of_week)`. Search box si beaucoup d'élèves.

**B. Durée** : 7 chips one-tap : `30min · 1h · 1h15 · 1h30 · 2h · 2h30 · 3h`. Sélection par défaut = 1h30. Style chips ronds avec accent quand sélectionnés.

**C. Jour** : 3 chips horizontaux : `Aujourd'hui · Hier · Avant-hier`. Par défaut "Aujourd'hui". Au-delà = 48h = bloqué côté DB.

**Submit** :
- Toast vert "+10 XP · Session loggée" 
- Appel `log_session()` 
- Si error : affiche raison ('cap_daily_exceeded' → "Tu as déjà 10h aujourd'hui", etc.)
- Si success : ferme modal + maj cache local si dispo

#### 3.3 Bannière confirmation élève — `src/components/session-confirmation-banner.js`

Sur l'accueil élève, si `get_my_pending_sessions()` retourne >=1 session :

Carte premium avec :
- "Rayan a déclaré 2h de conduite avec toi mardi"
- 2 boutons : `[✓ Oui c'est juste]` (vert) · `[✗ Non]` (rouge léger)
- Tap → `confirm_session(id, 'confirmed'|'refused')` + retire de la liste
- Si plusieurs sessions à confirmer : stack vertical

#### 3.4 Widget récap soir — `src/pages/enseignant/aujourdhui.js`

Si l'heure locale > 18h, afficher en haut un widget :
```
🌙 Ta journée
3 sessions loggées · 6h totales
[2 confirmées par tes élèves]
```

Si gap >48h sans log un jour habituel : afficher "💭 Tu as fait conduire hier ? Tape pour logger."

#### 3.5 Ranking moniteur

**Côté Pulse gérant** : section "🏆 Top moniteurs ce mois" avec top 3, chacun avec son score + 4 sous-métriques (heures · validations · élèves · jours actifs).

**Côté Profil moniteur** : sa position dans le ranking + ses 4 métriques perso + comparaison vs moniteur n+1.

### 📋 Order recommandé

1. 3.2 Modal (cœur du flow)
2. 3.1 FAB (déclencheur)
3. 3.3 Bannière confirmation élève (boucle anti-triche)
4. 3.5 Ranking (le truc gratifiant)
5. 3.4 Widget récap soir (cherry on top)

### 🚫 Hors-scope (ne PAS faire)

- ❌ Pas de calendrier ni planning à l'avance
- ❌ Pas de récurrence hebdo
- ❌ Pas de sync Google Calendar
- ❌ Pas de géoloc

### 📋 Demandes Claude Code → router.js / main.js

#### FAB log session ✅ TRAITÉ (router.js : mount/unmount selon role)

```js
// Dans router.js, après le mount de chaque page enseignant :
import { mountLogSessionFab, unmountLogSessionFab } from '@/components/log-session-fab.js';

// À ajouter dans le beforeUnmount / unmount de chaque page enseignant :
unmountLogSessionFab();

// À ajouter après le mount de chaque page enseignant :
mountLogSessionFab();

// Pages concernées : tous les hash routes #/enseignant/* 
// (aujourd'hui, mes-eleves, fiche-eleve, livret-remc, planning, validation)
```

---

## [2026-05-18] 🆕 CHANTIER COFFRES + NOTIFS ÉMOTIONNELLES — pour Claude Code

> **Contexte :** Cowork prépare le backend (table `chest_unlocks`, RPC `unlock_chest` / `open_chest` / `get_my_chests`, edge function `send-emotional-nudge` + pg_cron 11h Paris). Claude Code prend tout le frontend.

### ✅ BACKEND DISPONIBLE (déployé en prod le 2026-05-18)

- ✅ Table `chest_unlocks` (RLS user reads own) + CHECK constraint sur les 8 types valides
- ✅ RPC `unlock_chest(p_chest_type text, p_rewards jsonb)` → idempotent, retourne `{unlocked|already_unlocked, chest}`
- ✅ RPC `open_chest(p_chest_type text)` → retourne `{opened, chest}` ou `{error: 'already_opened'|'not_unlocked', chest?}`
- ✅ RPC `get_my_chests()` → SETOF chest_unlocks ORDER BY unlocked_at DESC
- ✅ Types valides : `world_1`, `world_2`, `world_3`, `world_4`, `streak_7`, `streak_14`, `streak_30`, `perfect_quiz`
- ✅ Edge function `dispatch-push` v3 (handle `emotional_nudge` en lisant title/body/route/tone/cta depuis data)
- ✅ Trigger DB `send_push_on_notification_insert` whitelist mise à jour avec `emotional_nudge`
- ✅ Edge function `send-emotional-nudge` v1 déployée (verify_jwt=false)
- ✅ pg_cron `send-emotional-nudge-daily` actif à `0 10 * * *` UTC (11h Paris été, 12h hiver)
- ✅ Anti-spam : skip si emotional_nudge déjà envoyée dans les 36h précédentes
- ✅ Templates côté edge function (5 + 1 fallback) : `palier_1`, `palier_2`, `come_back_3d`, `come_back_7d`, `week_summary`, `micro_victoire`

Le payload `data` de la notif émotionnelle a cette shape :
```json
{
  "template_id": "palier_2",
  "tone": "celebrate",         // 'urgent' | 'celebrate' | 'warm' | 'gentle'
  "title": "🔥 Tu y es presque !",
  "body":  "Plus que 2 compétences pour atteindre le palier 10",
  "cta":   "Continuer",
  "route": "#/parcours"
}
```

**Logique de sélection (priorité descendante) côté edge function :**
1. `come_back_7d` si 7-30 jours sans validation
2. `come_back_3d` si 3-6 jours sans validation
3. `palier_1` si 1 comp avant palier (10/15/20/25/30)
4. `palier_2` si 2 comp avant palier
5. `week_summary` si dimanche UTC + ≥1 validation cette semaine
6. `micro_victoire` (fallback) si 5+ comp acquises et activité <= 2j

Le frontend `emotional-banner.js` doit donc juste lire `notifications WHERE type='emotional_nudge' AND read_at IS NULL` et rendre selon `data.tone`.

### 🎁 PARTIE 1 — Coffres (persistance DB + extension triggers)

#### 1.1 Migrer `game-state.js` localStorage → DB

**Fichier :** `src/utils/game-state.js`

Remplacer le système localStorage `LS_CHESTS_OPENED` par les RPC Supabase :

```js
// Nouvelle API attendue (utilise les RPC qui seront dispo bientôt côté Cowork) :

// Récupère tous les coffres (débloqués + ouverts) de l'utilisateur
export async function getMyChests() {
  const { data, error } = await sb.rpc('get_my_chests');
  if (error) { console.error('[chests]', error); return []; }
  return data; // [{ id, user_id, chest_type, unlocked_at, opened_at, rewards }]
}

// Débloque un coffre (idempotent — si déjà débloqué, retourne l'existant)
export async function unlockChest(chestType, rewards) {
  const { data, error } = await sb.rpc('unlock_chest', {
    p_chest_type: chestType,  // 'world_1' | 'world_2' | 'world_3' | 'world_4' | 'streak_7' | 'streak_14' | 'streak_30' | 'perfect_quiz'
    p_rewards: rewards         // { xp: 200, gemmes: 50, title: '...' }
  });
  if (error) { console.error('[chests]', error); return null; }
  return data; // { unlocked: true, chest: {...} } OU { already_unlocked: true, chest: {...} }
}

// Marque un coffre comme ouvert (déclenché par la modal)
export async function openChest(chestType) {
  const { data, error } = await sb.rpc('open_chest', {
    p_chest_type: chestType
  });
  if (error) { console.error('[chests]', error); return null; }
  return data; // { opened: true, chest: {...} }
}
```

⚠️ Garder une **cache localStorage** par-dessus pour éviter les flash (fetch initial → cache → invalidation à chaque unlock/open).

#### 1.2 Étendre les triggers de coffres

Actuellement : 1 coffre par monde REMC complété (4 mondes). À ajouter :

| Trigger | chest_type | Rewards |
|---|---|---|
| Streak 7 jours | `streak_7` | `{ xp: 150, gemmes: 30, title: 'Persévérant' }` |
| Streak 14 jours | `streak_14` | `{ xp: 350, gemmes: 80, title: 'Constant' }` |
| Streak 30 jours | `streak_30` | `{ xp: 800, gemmes: 200, title: 'Inarrêtable' }` |
| Quiz parfait (100%) | `perfect_quiz` | `{ xp: 100, gemmes: 25, title: 'Précision' }` |

**Où câbler :**
- Streak : dans `updateStreak()` de `game-state.js`, après increment, check si le nouveau count = 7/14/30 → `unlockChest('streak_X', rewards)`
- Quiz parfait : dans la page quiz (`src/pages/eleve/quiz.js`), à la fin du quiz si score = 100% → `unlockChest('perfect_quiz', rewards)` — UNIQUE par utilisateur (déjà géré par la contrainte UNIQUE de la table, l'appel est idempotent)

#### 1.3 Vérifier câblage parcours

**Fichier :** `src/pages/eleve/parcours.js`

S'assurer que `renderChest({ worldNum, worldName })` est bien appelé à la fin de chaque monde quand les 8 sous-comp sont validées. Au mount, appeler `unlockChest('world_X', { xp: ..., gemmes: ... })` pour persister.

---

### 🔔 PARTIE 2 — Notifs émotionnelles intelligentes

#### 2.1 Library de templates émotionnels

**Fichier à créer :** `src/data/emotional-nudges.js`

```js
/**
 * Templates émotionnels intelligents pour push + bannière in-app.
 * Le sélecteur côté edge function choisit selon le contexte utilisateur
 * (streak, comp count, jour, heure, dernière activité).
 *
 * Catégories :
 *  - palier_proche    : "à X comp du palier suivant"
 *  - record           : "personne n'a battu ton record"
 *  - validation_mono  : "ton moniteur t'a validé X"
 *  - streak_warm      : "garde la flamme"
 *  - retour           : "ça fait Xj, viens 5min"
 *  - examen_proche    : "plus que Xj avant ton examen"
 *  - micro_victoire   : "tu as fait X cette semaine"
 *
 * Chaque template :
 *   - title (max 50 chars, emoji autorisé en tête)
 *   - body (max 100 chars)
 *   - cta (label bouton bannière)
 *   - route (hash route si cta cliqué)
 *   - tone : 'warm' | 'urgent' | 'celebrate' | 'gentle'
 */

export const EMOTIONAL_NUDGES = [
  // ── palier_proche ──
  { id: 'palier_2', cat: 'palier_proche', tone: 'celebrate',
    title: '🔥 Tu y es presque !',
    body: 'Plus que {n} compétences pour atteindre le palier {target}',
    cta: 'Continuer', route: '#/parcours' },
  { id: 'palier_1', cat: 'palier_proche', tone: 'urgent',
    title: '⚡ Une seule compétence',
    body: 'Une seule compétence te sépare du palier {target} 💪',
    cta: 'Y aller', route: '#/parcours' },

  // ── streak_warm ──
  { id: 'streak_save', cat: 'streak_warm', tone: 'urgent',
    title: '🔥 Ta flamme s\'éteint',
    body: 'Plus que quelques heures pour garder ta série de {streak} jours',
    cta: 'Sauver ma série', route: '#/parcours' },
  { id: 'streak_milestone_close', cat: 'streak_warm', tone: 'celebrate',
    title: '🔥 Tu touches le jalon',
    body: 'Demain c\'est le palier {milestone} jours. Tu vas y arriver',
    cta: 'Garder la flamme', route: '#/parcours' },

  // ── record ──
  { id: 'record_week', cat: 'record', tone: 'celebrate',
    title: '👑 Personne ne fait mieux',
    body: 'Tu es l\'élève le plus actif cette semaine dans ton école',
    cta: 'Voir mon profil', route: '#/profil' },

  // ── validation_mono ──
  { id: 'validation_fresh', cat: 'validation_mono', tone: 'celebrate',
    title: '🎉 Validation !',
    body: '{teacher_name} vient de te valider "{competence_name}"',
    cta: 'Voir', route: '#/parcours' },

  // ── retour ──
  { id: 'come_back_3d', cat: 'retour', tone: 'gentle',
    title: '👋 Ton parcours t\'attend',
    body: 'Ça fait 3 jours. 5 minutes suffisent pour reprendre le rythme',
    cta: 'Reprendre', route: '#/parcours' },
  { id: 'come_back_7d', cat: 'retour', tone: 'warm',
    title: '💙 On pense à toi',
    body: 'Une semaine sans toi. Reviens quand tu veux, on est là',
    cta: 'Revenir', route: '#/accueil' },

  // ── examen_proche ──
  { id: 'exam_30d', cat: 'examen_proche', tone: 'celebrate',
    title: '🎯 J-30 examen',
    body: 'Plus qu\'un mois ! Tu en es à {acquired}/31. Continue comme ça',
    cta: 'Mon examen', route: '#/examen' },
  { id: 'exam_7d', cat: 'examen_proche', tone: 'urgent',
    title: '⏰ J-7 examen',
    body: 'Dernière semaine. Révise les compétences clés',
    cta: 'Réviser', route: '#/parcours' },

  // ── micro_victoire ──
  { id: 'week_summary', cat: 'micro_victoire', tone: 'celebrate',
    title: '✨ Belle semaine',
    body: 'Tu as validé {n_comp} compétences et joué {n_quiz} quiz. Bravo',
    cta: 'Voir mon bilan', route: '#/accueil' },
];

/**
 * Hydrate le template avec les variables du contexte utilisateur.
 * @example
 *   hydrate(template, { n: 2, target: 10 })
 *   → { title: '🔥 Tu y es presque !', body: 'Plus que 2 compétences pour atteindre le palier 10', ... }
 */
export function hydrate(template, vars = {}) {
  const replace = (str) => str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  return {
    ...template,
    title: replace(template.title),
    body: replace(template.body),
  };
}

export function findById(id) {
  return EMOTIONAL_NUDGES.find(n => n.id === id) || null;
}
```

#### 2.2 Composant bannière in-app émotionnelle

**Fichier à créer :** `src/components/emotional-banner.js`

Bannière premium qui apparaît en haut de l'accueil élève si une notif émotionnelle non-lue est dispo (lookup `notifications` WHERE `type LIKE 'emotional_%' AND read_at IS NULL`).

Specs :
- Apparaît avec animation slide-down + halo selon `tone`
- Tone `warm` → dégradé orange/rouge
- Tone `urgent` → pulse subtle + chrono visible si streak risk
- Tone `celebrate` → confetti micro + gradient violet/rose
- Tone `gentle` → bleu doux, slow fade-in
- CTA → `navigate(template.route)` + `mark_as_read`
- Croix discrete top-right → `mark_as_read` sans naviguer
- Auto-dismiss après 12s si pas interaction (mais reste dans bell)

Pattern attendu :
```js
import { emotionalBanner } from '@/components/emotional-banner.js';

// Dans accueil.js mount() :
await emotionalBanner.checkAndRender(root);
```

#### 2.3 Câblage accueil élève

**Fichier :** `src/pages/eleve/accueil.js`

Ajouter au début du `mount()`, après le check user :
```js
import { emotionalBanner } from '@/components/emotional-banner.js';
// ...
await emotionalBanner.checkAndRender(root);
```

---

### 📋 Coordination

**Côté Cowork (zone interdite — en cours) :**
- [ ] Migration `chest_unlocks` table + RLS
- [ ] RPC `unlock_chest`, `open_chest`, `get_my_chests`
- [ ] Edge function `send-emotional-nudge` (sélecteur de templates contextuels)
- [ ] pg_cron : `0 10 * * *` (= 11h Paris, sweet spot pause matinée)

**Côté Claude Code (à toi) :**
- [ ] 1.1 — Migrer `game-state.js` localStorage → DB
- [ ] 1.2 — Étendre triggers (streak 7/14/30 + quiz parfait)
- [ ] 1.3 — Vérifier câblage parcours
- [ ] 2.1 — `src/data/emotional-nudges.js`
- [ ] 2.2 — `src/components/emotional-banner.js`
- [ ] 2.3 — Câblage accueil élève

**Pré-requis avant de coder :**
Attendre que Cowork ait push le commit avec les 3 RPC + edge function. Cowork écrira ✅ DISPONIBLE ici quand prêt.

---

## [2026-05-18] RPC `get_bilan_data` disponible pour LIVRABLE 3 (bilan trimestriel)

**Pour Claude Code :** pour ta page `src/pages/enseignant/bilan.js`, utilise la RPC
Supabase plutôt que de faire 5-6 queries séparées (gain perf énorme + comment
pédagogique auto-généré côté DB).

**Usage** :
```js
const { data, error } = await sb.rpc('get_bilan_data', {
  p_eleve_id: eleveId,
  // p_trimestre_start optionnel — défaut = trimestre en cours
});
```

**Retour** (jsonb) :
```ts
{
  eleve: { id, prenom, nom },
  trimestre_start, trimestre_end,
  kpi: {
    acquises_now, acquises_prev, delta_pct,
    quiz_total, quiz_reussis, score_moyen,
    jours_actifs, jours_total
  },
  by_monde: { "C1": [{competence_id, validated_at}, ...], "C2": [...], ... },
  evolution: [{ month: "janv.", count: 3 }, { month: "févr.", count: 5 }, ...],
  comment: "Bonne dynamique. 12 compétences..."
}
```

**Avantages** :
- 1 round-trip DB au lieu de 5
- Index optimisés sur validations.validated_at + (eleve_id, validated_at)
- Commentaire pédago auto rule-based (5 paliers)
- Delta % vs trimestre précédent pré-calculé

---

## [2026-05-18] Route bilan trimestriel enseignant ✅ TRAITÉ
*(route `bilan` ajoutée dans enseignant + gerant. Pattern : `#/bilan/{eleveId}` — le param est passé en 2e arg de mount)*

**Fichier :** `src/router.js`  
**Demande :** Ajouter la route `'bilan/:eleveId'` qui pointe vers `src/pages/enseignant/bilan.js`

```js
// Dans le router, section routes enseignant (avec param eleveId) :
'bilan/:eleveId': (params) => import('./pages/enseignant/bilan.js').then(m => m.mount(root, params.eleveId)),
```

Ou équivalent selon le pattern de paramètres du router actuel.

**Contexte :** `bilan.js` attend `mount(root, eleveId)`. La page est print-friendly (@media print). La RPC `get_bilan_data` est documentée dans le TODO ci-dessus (section "RPC get_bilan_data disponible").

---

## [2026-05-18] Route examen élève ✅ TRAITÉ
*(route `examen` ajoutée dans eleve)*

**Fichier :** `src/router.js`  
**Demande :** Ajouter la route `'examen'` qui pointe vers `src/pages/eleve/examen.js`

```js
// Dans le router, section routes élève :
'examen': () => import('./pages/eleve/examen.js'),
```

Et dans la nav bar élève (si elle existe) :
- Ajouter un lien "Mon examen" avec l'icon `award` ou `graduation-cap`
- Route : `#/examen`

**Contexte :** La page `examen.js` est complète. Elle affiche le compte à rebours jusqu'à l'examen B (date stockée dans localStorage), une checklist "Suis-je prêt ?" (5 critères) et des conseils.

---

## [2026-05-18] Route insights enseignant ✅ TRAITÉ

**Fichier :** `src/router.js`  
**Demande :** Ajouter la route `'insights'` qui pointe vers `src/pages/enseignant/insights.js`

```js
// Dans le router, section routes enseignant :
'insights': () => import('./pages/enseignant/insights.js'),
```

Et dans la nav bar enseignant (si elle existe dans `src/components/` ou `src/main.js`) :
- Ajouter un lien "Insights" avec l'icon `chart-bar` ou `activity`
- Route : `#/insights`

**Contexte :** La page `insights.js` est complète et déployée. Elle ne sera accessible qu'une fois la route câblée.

---
