# Bilan élèves stagnants — 2026-06-05

## ⚠️ Échec d'exécution

La requête n'a pas pu être lancée.

**Cause** : le projet Supabase ciblé `ivtuheoyfgljujliscwf` n'est pas accessible via le MCP Supabase connecté à ce compte (`rayannabli27@gmail.com`).

**Projets accessibles** :
- `arrfmdagdqtrtfbhxlty` — "rayannabli27@gmail.com's Project" (eu-west-1, ACTIVE_HEALTHY)

**Erreur retournée** lors du `execute_sql` sur `ivtuheoyfgljujliscwf` :
> MCP error -32600: You do not have permission to perform this action

## Actions à faire (côté utilisateur)

1. Vérifier l'ID du projet PermiGo en prod (probablement faux dans la définition de la tâche planifiée).
2. Si l'ID `arrfmdagdqtrtfbhxlty` est bien le projet PermiGo : corriger le SKILL.md de la tâche planifiée (`~/Library/.../uploads/SKILL.md`) pour utiliser ce ref.
3. Sinon : ajouter le bon projet à l'organisation Supabase connectée au MCP, ou reconnecter le MCP avec un compte ayant accès à `ivtuheoyfgljujliscwf`.

## Requête prévue (non exécutée)

```sql
SELECT p.nom, p.email, p.tel, MAX(r.updated_at) as derniere_validation,
       COUNT(r.id) FILTER (WHERE r.lv = 'v') as nb_validees, p.forfait_h
FROM profiles p
LEFT JOIN remc_entries r ON r.eleve_id = p.id
WHERE p.role = 'eleve' AND p.statut = 'Actif'
GROUP BY p.id, p.nom, p.email, p.tel, p.forfait_h
HAVING MAX(r.updated_at) < NOW() - INTERVAL '7 days' OR MAX(r.updated_at) IS NULL
ORDER BY derniere_validation NULLS FIRST;
```
