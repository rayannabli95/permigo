# Edge Function — trigger-consolidation

Envoie des notifications de quiz de consolidation aux élèves dont une compétence
a été validée il y a 48h sans consolidation faite.

## Déployer

```bash
# Depuis la racine du projet
supabase functions deploy trigger-consolidation --no-verify-jwt
```

Le `--no-verify-jwt` est requis car la fonction est appelée par un cron Supabase
(pas par un utilisateur authentifié).

## Scheduler le cron (Supabase Dashboard)

1. Ouvrir https://supabase.com/dashboard → ton projet → **Database → Extensions**
2. Activer `pg_cron` si pas déjà actif
3. **Database → SQL Editor**, exécuter :

```sql
select cron.schedule(
  'consolidation-48h',              -- nom du job
  '0 8 * * *',                      -- chaque jour à 8h UTC (10h Paris)
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/trigger-consolidation',
    headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
  );
  $$
);
```

Remplace `<PROJECT_REF>` et `<SERVICE_ROLE_KEY>` par les valeurs du projet.

## Tester localement

```bash
# 1. Démarrer Supabase en local
supabase start

# 2. Servir la fonction en local
supabase functions serve trigger-consolidation --no-verify-jwt

# 3. Appeler avec curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/trigger-consolidation'
```

## Ce que fait la fonction

1. Cherche dans `validations` les lignes où :
   - `statut = 'acquis'`
   - `created_at` est entre 48h et 49h passées
   - `consolidation_done_at IS NULL`
2. Pour chaque ligne, insère une notification `type = 'consolidation_quiz'`
   dans `notifications` pour l'élève concerné
3. Le `notif-listener` côté client (polling 30s) ramasse la notif et lance le quiz

## Logs

```bash
supabase functions logs trigger-consolidation --tail
```
