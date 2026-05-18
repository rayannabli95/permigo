# Push Notifications — Spec DB + Edge Function

> **Destinataire : Cowork**
> Ce fichier décrit ce que le frontend s'attend à trouver côté Supabase
> pour que les Web Push Notifications fonctionnent de bout en bout.
> Le code frontend est terminé — il manque uniquement la couche DB + dispatch.

---

## 1. Table `push_subscriptions`

```sql
CREATE TABLE push_subscriptions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    text        NOT NULL,
  p256dh      text        NOT NULL,  -- clé publique DH (base64url)
  auth        text        NOT NULL,  -- secret auth (base64url)
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_user_id_key UNIQUE (user_id)
);

-- Index pour lookup rapide par user_id (upsert onConflict: 'user_id')
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
```

**RLS :**
```sql
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Élève lit/écrit uniquement sa propre ligne
CREATE POLICY "eleve own push sub"
  ON push_subscriptions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Edge function service_role peut tout lire (pour dispatch)
-- (service_role bypasse RLS par défaut)
```

---

## 2. Edge Function `dispatch_push`

Appelée par `trigger-consolidation` (pg_cron) et par `validate-competence` quand une compétence est validée.

### Signature attendue

```ts
// POST /functions/v1/dispatch_push
// Body: { user_id: string, type: NotifType, data?: Record<string, any> }

type NotifType = 'post_validation_quiz' | 'consolidation_quiz' | 'streak_risk';
```

### Logique interne

1. Lookup `push_subscriptions` WHERE `user_id = $user_id`
2. Si aucune subscription → log + return 200 (silencieux)
3. Construire le payload push selon le type :

```ts
const PAYLOADS: Record<NotifType, object> = {
  post_validation_quiz: {
    title: '🎉 Compétence validée !',
    body:  'Ton moniteur a validé une compétence. Lance le quiz maintenant !',
    data:  { route: `#/quiz/${data?.competence_id}/post_validation` },
  },
  consolidation_quiz: {
    title: '🔄 Consolide tes acquis',
    body:  'Il est temps de revoir une compétence. 2 questions, 2 minutes.',
    data:  { route: `#/quiz/${data?.competence_id}/consolidation` },
  },
  streak_risk: {
    title: '🔥 Ta série t\'attend',
    body:  `Ne perds pas ta flamme ! Une session rapide suffit.`,
    data:  { route: '#/accueil' },
  },
};
```

4. Envoyer via Web Push Protocol (VAPID) :
   - `VAPID_PRIVATE_KEY` = secret Supabase (ne jamais exposer côté frontend)
   - `VAPID_PUBLIC_KEY`  = `VITE_VAPID_PUBLIC_KEY` (même valeur que l'env var Vite)
   - `VAPID_SUBJECT`    = `mailto:rayan@permigo.fr`

### Exemple de déclenchement depuis trigger-consolidation

```sql
-- Dans la pg_cron function, après insert dans notifications :
SELECT net.http_post(
  url     := current_setting('app.supabase_url') || '/functions/v1/dispatch_push',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.service_role_key')
  ),
  body    := jsonb_build_object(
    'user_id', NEW.user_id,
    'type',    NEW.type,
    'data',    NEW.data
  )
);
```

---

## 3. Clé VAPID

Générer avec :
```bash
npx web-push generate-vapid-keys
```

- **Public key** → `VITE_VAPID_PUBLIC_KEY` dans `.env` (Vercel env + local)
- **Private key** → `VAPID_PRIVATE_KEY` dans les secrets Supabase Edge Functions UNIQUEMENT

---

## 4. Résumé des dépendances

| Composant | État | Responsable |
|---|---|---|
| `public/sw.js` — handler `push` + `notificationclick` | ✅ Terminé | Claude |
| `src/services/web-push.js` — subscription VAPID + save to DB | ✅ Terminé | Claude |
| `src/services/notif-listener.js` — `markHasValidated()` | ✅ Terminé | Claude |
| `src/pages/common/profil.js` — toggle UI | ✅ Terminé | Claude |
| Table `push_subscriptions` | ⏳ À créer | **Cowork** |
| Edge function `dispatch_push` | ⏳ À créer | **Cowork** |
| Clé VAPID (generate + configurer) | ⏳ À faire | **Cowork** |
| Connecter `trigger-consolidation` → `dispatch_push` | ⏳ À faire | **Cowork** |
| Connecter `validate-competence` → `dispatch_push` | ⏳ À faire | **Cowork** |
