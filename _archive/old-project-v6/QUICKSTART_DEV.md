# Quickstart pour le développeur

Tu reprends Autopilot. Voici la marche à suivre **étape par étape** pour passer du prototype actuel à une livraison auto-école.

## Étape 0 — Ouvrir le projet

```bash
cd autopilot-project
claude   # ouvre Claude Code dans ce dossier
```

Claude Code lira automatiquement `CLAUDE.md`. Pose-lui des questions du genre :
- "Explique-moi la structure du fichier autopilot.html"
- "Comment ajouter un nouveau rôle ?"
- "Où est la persistance des événements ?"

## Étape 1 — Setup Supabase (1-2 jours)

```bash
npm i -g supabase
supabase init
supabase start   # lance Postgres + Auth + Storage en local
```

Créer les tables (voir DEV_BRIEF.md §2.1.2) :

```sql
-- Voir DEV_BRIEF.md pour le SQL complet
create table users (...);
create table monitors (...);
create table students (...);
create table events (...);
-- etc.
```

Activer Row Level Security (RLS) :
```sql
alter table events enable row level security;

-- Moniteur ne voit que ses événements
create policy "monitor_own" on events for all
  using (monitor_id = auth.uid());

-- Admin voit tout
create policy "admin_all" on events for all
  using ((select role from users where id = auth.uid()) = 'admin');
```

## Étape 2 — Brancher le front (2-3 jours)

Dans `autopilot.html`, **remplacer le bloc `STORE`** (lignes ~1095) par :

```js
import { createClient } from '@supabase/supabase-js';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORE = {
  async get(k, def) {
    const { data } = await sb.from('user_state').select('value').eq('key', k).single();
    return data?.value ?? def;
  },
  async set(k, v) {
    await sb.from('user_state').upsert({ key: k, value: v, user_id: sb.auth.user().id });
  },
};
```

Pour les arrays (EVENTS, ABSENCES, etc.), remplacer par appels typés :

```js
async function loadEvents() {
  const { data } = await sb.from('events').select('*').eq('monitor_id', currentUser.id);
  return data;
}
async function saveEvent(ev) {
  return sb.from('events').insert(ev);
}
```

## Étape 3 — Auth (1 jour)

Remplacer le splash par un vrai écran de login :

```js
async function login(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return toast('❌ ' + error.message);
  const { data: profile } = await sb.from('users').select('role').eq('id', data.user.id).single();
  switchRole(profile.role);  // déjà existant
}
```

Activer biométrie (WebAuthn) — déjà préparé dans le proto, juste à brancher.

## Étape 4 — Création de comptes (2 jours)

Pages **MANQUANTES** dans le proto, à créer :

### Admin → Créer un moniteur
```html
<form id="form-new-monitor">
  <input name="email" required />
  <input name="phone" required />
  <input name="plate" required />
  <input name="bepecaser" required />
  <input name="max_hours_week" type="number" value="35" />
  <button>Inviter le moniteur</button>
</form>
```

```js
form.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(form);
  // Créer le user via Supabase Admin API (côté Edge Function)
  await fetch('/api/invite-monitor', { method: 'POST', body: fd });
});
```

### Admin → Créer un élève
Même principe, avec : email, téléphone, NEPH, forfait (heures), code obtenu/non.

### Edge Function `/api/invite-monitor`
```typescript
// Supabase Edge Function (Deno)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { email, phone, plate, bepecaser, max_hours_week } = await req.json();

  // 1. Créer le user
  const { data: user, error } = await sb.auth.admin.createUser({
    email,
    email_confirm: false,  // envoie un email d'invitation
    user_metadata: { role: 'moniteur' },
  });
  if (error) return new Response(error.message, { status: 400 });

  // 2. Insérer dans la table monitors
  await sb.from('monitors').insert({ user_id: user.user.id, plate, bepecaser, max_hours_week, phone });

  // 3. Envoyer l'invitation
  await sb.auth.admin.inviteUserByEmail(email);

  return Response.json({ ok: true });
});
```

## Étape 5 — Notifications push (2 jours)

```js
// Service Worker (sw.js)
self.addEventListener('push', e => {
  const data = e.data.json();
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: '/icon-192.png', tag: data.tag,
  }));
});

// Front
const reg = await navigator.serviceWorker.register('/sw.js');
const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC });
await sb.from('push_subs').insert({ user_id: currentUser.id, endpoint: sub.endpoint, keys: sub.toJSON().keys });
```

Côté serveur (Edge Function), envoyer un push via `web-push` quand :
- Un événement est créé/modifié/annulé
- Un livret est rempli (notif élève)
- Une notation est reçue (notif admin)
- Le plafond est atteint (notif moniteur + admin)

## Étape 6 — Brancher les agents IA (2 jours)

Dans `autopilot.html`, remplacer `AGENTS` (lignes ~2510) par :

```js
async function runAgent(agentKey, outId, arg) {
  FX.thinkingStart(outId);
  const { data } = await fetch('/api/ai/agent/' + agentKey, {
    method: 'POST',
    body: JSON.stringify({ context: arg, role: currentRole }),
  }).then(r => r.json());
  FX.thinkingStop(outId);
  renderAgentResult(outId, data);
}
```

Edge Function `/api/ai/agent/:name` :
```typescript
import Anthropic from 'npm:@anthropic-ai/sdk';

const client = new Anthropic();

const SYSTEM_PROMPTS = {
  optimiseur: `Tu es l'agent Optimiseur d'Autopilot. Analyse les données du planning et propose 3 actions à fort impact pour maximiser le remplissage. Réponds en JSON {title, summary, list[{ico,t,d}], actions[{label,kind,cb_id}]}.`,
  // etc.
};

Deno.serve(async (req) => {
  const { name } = req.params;
  const ctx = await req.json();
  const events = await sb.from('events').select(...).slice(...);
  const r = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPTS[name],
    messages: [{ role: 'user', content: JSON.stringify(ctx) }],
  });
  return Response.json({ data: JSON.parse(r.content[0].text) });
});
```

## Étape 7 — Tests (3 jours)

Tester chaque rôle, chaque action :
- [ ] Inscription nouvel admin
- [ ] Admin crée 3 moniteurs
- [ ] Chaque moniteur reçoit invitation, se connecte
- [ ] Admin crée 10 élèves
- [ ] Moniteur planifie 5 leçons → notif élèves
- [ ] Élève réserve un créneau libre
- [ ] Élève annule (test 48h+ et 48h-)
- [ ] Moniteur remplit livret → notif élève
- [ ] Élève évalue moniteur → notif admin
- [ ] Admin enregistre absence → recalcul paye
- [ ] Plafond atteint → alerte
- [ ] Refresh : aucune donnée perdue
- [ ] Logout/login : reprise propre
- [ ] Mobile : tout fonctionne en bottom nav

## Estimation totale

| Étape | Effort | Cumul |
|---|---|---|
| 1. Supabase setup | 2j | 2j |
| 2. Brancher front | 3j | 5j |
| 3. Auth | 1j | 6j |
| 4. Créa comptes | 2j | 8j |
| 5. Push | 2j | 10j |
| 6. IA | 2j | 12j |
| 7. Tests | 3j | 15j |
| **Total MVP** | | **~3 semaines** |

Pour V2 (Stripe, code, examen, multi-tenant) : **+4 semaines**.

## Premier prompt à donner à Claude Code

> "Je reprends ce projet Autopilot. Lis CLAUDE.md et DEV_BRIEF.md, puis propose-moi un plan d'implémentation pour brancher Supabase Auth et migrer la couche STORE vers des appels API."

Bon courage 🚀
