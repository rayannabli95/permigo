# Push — mise en service (≈10 min, une seule fois)

> Le code est complet (sw.js ✅, web-push.js ✅, table `push_subscriptions` ✅ en prod,
> edge function `dispatch-push` ✅, cron Vercel ✅). Il ne manque que **les clés et secrets**,
> que toi seul peux poser. Ordre exact :

## 1. Générer les clés VAPID (30 s)

```bash
npx web-push generate-vapid-keys
```

Note les deux clés. La **publique** est diffusable, la **privée** ne doit JAMAIS
apparaître côté client ni dans Git.

## 2. Côté Vercel (3 min)

Dashboard Vercel → projet → Settings → Environment Variables :

| Variable | Valeur | Environnements |
|---|---|---|
| `VITE_VAPID_PUBLIC_KEY` | la clé publique | Production + Preview |
| `CRON_SECRET` | une chaîne aléatoire longue (ex: `openssl rand -hex 32`) | Production |

> `CRON_SECRET` sert double : Vercel signe automatiquement ses requêtes cron
> avec `Authorization: Bearer $CRON_SECRET`, et `api/push-daily.js` relaie ce
> même secret vers Supabase en `x-cron-secret`.

Ajoute aussi `VITE_VAPID_PUBLIC_KEY` dans ton `.env` local (permigo-game/.env).

## 3. Côté Supabase (3 min)

```bash
cd permigo-game
supabase secrets set \
  VAPID_PUBLIC_KEY="<clé publique>" \
  VAPID_PRIVATE_KEY="<clé privée>" \
  VAPID_SUBJECT="mailto:rayannabli27@gmail.com" \
  CRON_SECRET="<même valeur que sur Vercel>"

supabase functions deploy dispatch-push --no-verify-jwt
```

(`SERVICE_ROLE_KEY` est déjà posé pour trigger-consolidation.)

## 4. Redéployer le front (1 min)

Merge/redeploy Vercel pour que `VITE_VAPID_PUBLIC_KEY` entre dans le bundle —
sans elle, `_ensureSubscription()` s'arrête avec un warn et personne ne s'abonne.

## 5. Tester (2 min)

1. Sur téléphone, app installée, compte élève : faire la question du jour →
   le banner « Active le rappel quotidien » apparaît → Activer.
2. Vérifier la ligne : `select user_id, updated_at from push_subscriptions;`
3. Test d'envoi manuel :
   ```bash
   curl -X POST "https://arrfmdagdqtrtfbhxlty.supabase.co/functions/v1/dispatch-push" \
     -H "x-cron-secret: <CRON_SECRET>" -H "Content-Type: application/json" \
     -d '{"mode":"daily"}'
   ```
   → réponse `{ ok, sent, comeback, skipped, expired, total }` et le ding sur le téléphone.

## Comportement en prod (rappel du plan rétention)

- **Cron** : tous les jours 17:00 UTC (≈18h hiver / 19h été, heure de Paris).
- Élève abonné qui a déjà fait un quiz dans la journée (heure de Paris) → **rien**.
- Inactif **≥3 jours** → relance douce « On t'a gardé ta place » (remplace le ding du jour).
- Inactif **≥30 jours** → silence total (anti-fatigue).
- Ton toujours doux, **jamais** « tu vas perdre ta série » (règle mineurs).

## Plus tard (déjà supporté par la fonction, pas encore branché)

Le mode événementiel `POST { user_id, type, data }` (types `post_validation_quiz`,
`consolidation_quiz`, `streak_risk`) est prêt — il suffira d'appeler `dispatch-push`
depuis `trigger-consolidation` et au moment de la validation moniteur
(cf. `.telemetry/push-spec.md` §2).
