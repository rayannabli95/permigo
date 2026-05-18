# Spec DB — Insights Enseignant
**Date :** 2026-05-18  
**Page :** `src/pages/enseignant/insights.js`  
**Demandeur :** Claude Code (chantier Insights)

---

## Colonnes manquantes requises

### Table `profiles`

| Colonne | Type | Default | Description |
|---|---|---|---|
| `streak_pro_days` | `INT` | `0` | Jours consécutifs avec ≥ 1 validation faite par l'enseignant. Mis à jour par un trigger ou edge function daily. Si NULL → affiché "—" côté UI (graceful fallback déjà codé). |

**Migration suggérée :**
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_pro_days INT DEFAULT 0;
```

### Table `quiz_attempts`

La page utilise les colonnes suivantes — vérifier qu'elles existent :

| Colonne | Type | Utilisée pour |
|---|---|---|
| `user_id` | UUID | Identifier l'élève |
| `score` | INT (0-100) | Taux réussite quiz (seuil : 60) |
| `created_at` | TIMESTAMPTZ | Filtre 30 derniers jours |

Si `score` n'existe pas → la query retourne NULL, le UI affiche "—" (fallback codé).

---

## RLS à vérifier

- `quiz_attempts` : l'enseignant doit pouvoir lire les tentatives de SES élèves attitrés  
  Policy existante ou à créer : `enseignant peut SELECT sur quiz_attempts WHERE user_id IN (SELECT id FROM profiles WHERE enseignant_id = auth.uid())`

---

## Logique streak_pro_days (pour l'edge function ou trigger)

```
Pour chaque enseignant, chaque soir à minuit :
1. Compter les jours depuis aujourd'hui en remontant
2. Pour chaque jour : vérifier si ≥ 1 validation dans la table `validations` avec validated_by = enseignant.id
3. Arrêter au premier jour sans validation
4. streak_pro_days = nombre de jours consécutifs (y compris aujourd'hui si déjà validé)
```
