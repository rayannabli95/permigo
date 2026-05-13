# CHANGELOG Autopilot v6.2 → v6.3

**Date :** 1 mai 2026
**Focus :** Recentrage métier (logistique pure, plus de RH) + équilibre des rôles

## 🎯 Changements majeurs (5)

### 1. Côté MONITEUR — voit ses notes anonymement + son taux de réussite

Section "⭐ Mes évaluations" ajoutée dans le profil moniteur :
- Note moyenne calculée + nombre d'avis (gros chiffre)
- Taux de réussite examen affiché à côté (vert ≥51%, rouge sinon)
- Distribution des étoiles (5★ à 1★) en barres de progression
- Liste des commentaires reçus, **avec mention "Élève anonyme"** (les noms ne sont JAMAIS affichés)
- Note de transparence : "Les noms des élèves ne te sont jamais montrés pour préserver leur anonymat."

Fonction : `renderMonEvaluations()`

### 2. Côté GÉRANT — widget Gap offre/demande

Nouveau bloc sur le dashboard admin :
- **📤 Offre** : créneaux dispo cette semaine (capacité − planifié)
- **📥 Demande** : besoin estimé (heures restantes des élèves actifs × 8%)
- Banner statut : ✅ Équilibré / ⚠️ Sur-offre / ⚠️ Sous-tension / 🔴 Sous-offre
- Détail "À traiter en priorité" : élèves presque finis + inactifs à relancer
- Détail "Capacité disponible" : moniteurs avec heures dispo + alertes surchargés

Aide le gérant à décider : recruter un nouveau moniteur ? Relancer des élèves ? Étendre les horaires ?

Fonction : `renderAdminGap()`

### 3. ANNULATIONS remplacent les ABSENCES

Le concept "absence RH" n'avait pas sa place dans une appli logistique.

- `ABSENCES` → `ANNULATIONS` (compteur de leçons annulées par chaque moniteur)
- Tableau Assiduité : colonne "Absences" → "Annulations" (rouge si ≥3, orange si 1-2, vert si 0)
- Modal "Enregistrer une absence" → "Enregistrer une annulation" :
  - Moniteur + Date + Heure + **Élève impacté** + **Motif** (barre déroulante : Maladie / Imprévu personnel / Formation interne / Véhicule indisponible / Autre)
  - Toggle "Élève déjà replacé"
  - Note interne optionnelle
- Liste des annulations affichée avec : date, heure, élève impacté, état "remplacée" ou "non remplacée"
- Bouton topbar "+ Absence" → "+ Annulation"
- Sortie texte : "Aucune annulation moniteur récente 🎉" si vide

### 4. Annulation côté MONITEUR avec replacement automatique

Nouveau modal `m-mon-annul` :
- Quand le moniteur clique "Annuler" sur une de ses leçons (depuis le calendrier)
- Affiche les infos de la leçon (nom élève, jour, heure, durée)
- Sélecteur **motif obligatoire** (Maladie, Imprévu, Formation, Véhicule, Autre)
- Champ "Précisions" optionnel
- Bloc bleu "🔁 Proposer un replacement à l'élève" — propose 4 créneaux libres dans la semaine, pré-cochés
- Bouton désactivé tant que motif vide
- Sur confirmation : leçon retirée du planning, ANNULATIONS mis à jour, élève notifié avec les replacements suggérés, admin notifiée du motif

Fonction : `openMonAnnul(ev)` — appelée depuis `openEventActions` quand `isLecon`.

### 5. Export "📥 Heures" remplace "📥 Fiche paye"

- Bouton renommé : on n'aide plus à faire la fiche de paye (c'est un autre métier)
- Mais on garde l'export CSV des heures
- **L'export inclut maintenant les RDV perso** (colonne dédiée + total = conduite + perso)
- Format : `Moniteur,Heures conduite,Leçons,RDV perso,Total heures,Annulations,Taux réussite,Note moyenne`

### 6. BONUS — Compteur 35h proéminent dans la carte "Aujourd'hui"

Le moniteur se débrouille pour caler ses 35h. L'app lui donne tous les signaux :
- Barre de progression `XX/35h` en gros, dans la carte bleue Aujourd'hui
- Couleur dynamique : vert si <85%, orange si 85-100%, rouge si dépassement
- Message contextuel :
  - `✅ Encore Xh à caler cette semaine` (si beaucoup de marge)
  - `✅ Xh restantes · presque plein` (si peu de marge)
  - `⚠️ Bientôt au plafond · Xh restantes`
  - `⛔ Plafond dépassé · Xh en trop`

## 📊 Métriques

| | v6.2 | v6.3 | Δ |
|---|---|---|---|
| Lignes | 3 705 | 4 010 | +305 |
| Taille | 224 KB | 239 KB | +15 KB |
| Sections moniteur | 5 | 6 (+ Mes évaluations) | +1 |
| Modals | 8 | 9 (+ m-mon-annul) | +1 |
| Tests JS | OK | OK | ✓ |

## 🚫 Pas de régression

- ✅ Pas d'IA réintroduite
- ✅ Pas de CA / revenus
- ✅ Pas de "Congé"
- ✅ Calendrier sur vraies dates
- ✅ Statuts white/yellow/red
- ✅ Persistance localStorage (18 clés maintenant : +`ap-annulations` -`ap-absences`)
- ✅ Auth login/signup/démo
- ✅ Carte "Aujourd'hui" enrichie (pas remplacée)
- ✅ A11y (29+ aria-labels conservés)

## 🔄 Migration breaking (à savoir)

Si un user a l'ancienne version dans son localStorage avec `ap-absences`, cette clé sera ignorée silencieusement (pas de migration auto). On part de l'ANNULATIONS_DEFAULT pour tout le monde — c'est OK car les données sont mockées.

En production, prévoir un script de migration `absences → annulations` côté backend.

## 📝 Pour le dev backend

Nouvelle table à créer :

```sql
create table cancellations (
  id           serial primary key,
  monitor_id   uuid references users(id),
  student_id   uuid references users(id),
  date         date,
  start_time   time,
  duration_min int,
  reason       text,  -- 'maladie' | 'imprevu' | 'formation' | 'vehicule' | 'autre'
  internal_note text,
  replaced     boolean default false,
  replaced_to  uuid references events(id),  -- l'event de replacement
  created_at   timestamptz default now()
);
```

Endpoint à exposer :
```
POST   /api/cancellations          { monitor_id, student_id, date, start_time, reason, replaced_slots[] }
GET    /api/cancellations?month=
GET    /api/dashboard/gap          → { offre_h, demande_h, ratio, status, priority_students[], available_monitors[] }
GET    /api/monitor/:id/ratings    → { avg, count, distribution, comments[] (anonymized) }
```

Le service backend doit :
- Stripper systématiquement les `student_id` des commentaires retournés au moniteur
- Calculer le ratio offre/demande sur la base de la semaine courante
- Notifier l'élève via push avec les `replaced_slots[]` proposés
