# Resync migrations ↔ prod — 2026-06-04

## Ce qui a changé
L'ancien dossier `migrations/` (0000→0026, numéros dupliqués, ~18 % de la prod) ne
reflétait PAS l'état réel. Il a été **archivé** dans `_archive_legacy/` (25 fichiers).
Il est remplacé par un snapshot unique : **`00000000000000_baseline_prod_snapshot.sql`**.

## Diagnostic (au moment du resync)
- Ledger prod réel : **115 migrations** appliquées (de `0003_xp_moniteur` à `fix_xp_moniteur_double_credit_0026`).
- Anciens fichiers locaux : 25, dont ~21 mappaient une entrée du ledger, 8 orphelins
  (initial_schema, seeds, recovery), ~94 migrations prod absentes en local.
- Doublons locaux : `0003`, `0007`, `0014`. Trous : 0004, 0009, 0012, 0019, 0025.

## Contenu de la baseline (introspection read-only de la prod)
Objets vérifiés 1:1 contre la prod :
44 tables · 157 contraintes (PK/UNIQUE/CHECK/FK) · 95 index · RLS sur 44 tables ·
72 policies · 25 triggers · 4 vues · 1 vue matérialisée · 156 fonctions (inventaire) · 23 jobs pg_cron.

⚠️ **Corps des 156 fonctions NON inlinés** (choix : baseline légère + fiable).
Seuls nom/signature/retour/volatility/security-definer sont listés. Pour le corps exact :
`SELECT pg_get_functiondef('public.<nom>'::regproc);` en prod.
→ Conséquence : **la baseline n'est PAS rejouable telle quelle** (policies & triggers
réfèrent des fonctions dont le corps manque). C'est un **document de référence**, pas un
script de reset. La prod, elle, a déjà tout appliqué — ne rien rejouer dessus.

## Source de vérité
- **Historique appliqué = le ledger prod** (`supabase_migrations.schema_migrations`),
  consultable via MCP `list_migrations`. C'est lui qui fait foi, pas ce dossier.
- La baseline = photo fidèle du schéma à la date ci-dessus, pour écrire les futures
  migrations sans se tromper (fini l'écriture « d'après des fichiers faux »).

## Workflow futur des migrations
1. Nouvelle migration = nouveau fichier **après** la baseline, timestamp normal
   (`AAAAMMJJHHMMSS_nom.sql`), appliqué via MCP `apply_migration`.
2. Avant d'écrire une migration qui touche une fonction/trigger : récupérer le corps
   réel via `pg_get_functiondef` (l'inventaire dit lesquels existent).
3. Garder `0026_fix_xp_moniteur_double_credit` (déjà dans le ledger live) : ne pas le rejouer.

## ⚠️ Constat sécurité (à auditer, hors scope resync)
Le rôle **`anon` détient toujours SELECT/INSERT/UPDATE/DELETE/TRUNCATE sur toutes les
tables + vues `public`**, malgré les migrations `security_lockdown_anon_revoke` et
`lockdown_gdpr_anon_revoke_v2`. Inerte tant que la RLS tient (toutes les tables ont RLS
activée), mais le `REVOKE` attendu n'a pas pris. À corriger dans une migration dédiée.
