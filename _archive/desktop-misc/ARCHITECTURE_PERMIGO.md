# 🏗️ ARCHITECTURE PERMIGO - Documentation Technique

**Version:** 2.0  
**Date:** 10 mai 2026  
**Environnement:** Supabase PostgreSQL + GitHub Pages (vanilla JS)

---

## 📐 Vue d'ensemble

```
┌─────────────────────────────────────────┐
│   Frontend (index.html - GitHub Pages)  │
│   • 6800+ lignes vanilla JS             │
│   • Single Page App (SPA)               │
│   • Responsive mobile-first             │
└────────────────┬────────────────────────┘
                 │
                 ↓ API REST
┌─────────────────────────────────────────┐
│     Supabase Backend (PostgreSQL)       │
│   • Auth (JWT-based)                    │
│   • Database + RLS Policies             │
│   • Real-time triggers                  │
└─────────────────────────────────────────┘
```

---

## 🔐 Système d'Authentication

### Flux de Connexion
```
1. User tape email + password
2. FE envoie à Supabase Auth API (/token)
3. Supabase retourne JWT + user_id
4. FE récupère profil depuis "profiles" table
5. RLS policies valident l'accès
6. FE stocke JWT + role dans localStorage
7. UI bascule selon le rôle
```

### Comptes Actuels
```
┌──────────┬─────────────────────────┬──────────┬─────────────────────┐
│ Role     │ Nom                     │ Email    │ Status              │
├──────────┼─────────────────────────┼──────────┼─────────────────────┤
│ admin    │ PermiGo Admin           │ rayan... │ ✅ Connecté         │
│ eleve    │ Elyne Semaan            │ elyne... │ ✅ Ready (0h)       │
│ eleve    │ Sherine Nabli           │ sheri... │ ✅ Ready (7h)       │
│ eleve    │ Latifa Sahli            │ latif... │ ✅ Ready (22h)      │
│ moniteur │ Rayan Nabli             │ rayan... │ ✅ Ready            │
│ moniteur │ Lassaad Sahli           │ lassa... │ ✅ Ready            │
└──────────┴─────────────────────────┴──────────┴─────────────────────┘
```

---

## 📊 Modèle de Données

### Tables Principales

#### `profiles`
```sql
id              uuid PRIMARY KEY
auth_id         uuid (FK → auth.users)
role            enum('admin', 'moniteur', 'eleve')
nom             text
email           text
tel             text
forfait_h       int (default: 20)  -- heures de conduite
neph            text                -- numéro de permis
dob             date
created_at      timestamptz
```

#### `events` (Historique des leçons/absences)
```sql
id              uuid PRIMARY KEY
eleve_id        uuid (FK → profiles)
moniteur_id     uuid (FK → profiles)
type_event      varchar (leçon | absence)
dur             numeric (heures)
h               text (horaire: "10:00")
d               int (jour du mois)
comment         text
lieu            text (lieu de conduite)
is_deleted      boolean
created_at      timestamptz
```

#### `inscriptions` (Parcours de l'élève)
```sql
id                      uuid PRIMARY KEY
eleve_id                uuid (FK → profiles)
moniteur_principal_id   uuid (FK → profiles)
forfait_heures          int (default: 20)
statut                  varchar ('en_cours', 'réussi', 'échoué')
date_examen             date
result_examen           varchar
inscription_date        timestamptz
created_at              timestamptz
```

#### `eleve_stats` (Stats auto-calculées)
```sql
id                  uuid PRIMARY KEY
eleve_id            uuid (FK → profiles, UNIQUE)
heures_suivies      numeric (calculée depuis events)
heures_planifiees   numeric (du profil forfait_h)
presence_percent    numeric (heures_suivies / heures_planifiees * 100)
etat                varchar ('nouveau' | 'en_formation' | 'prêt_examen')
nb_absences         int (compté depuis events)
updated_at          timestamptz (auto-maj via trigger)
```

---

## ⚙️ Système Auto-Calcul (Triggers)

### Fonction: `recalculate_eleve_stats(p_eleve_id uuid)`

**Logique:**
```
1. Récupère forfait_h du profil (default: 20h)
2. Somme dur des events où type_event='leçon' → heures_suivies
3. Compte events où type_event='absence' → nb_absences
4. presence_percent = (heures_suivies / forfait_h) * 100
5. etat = CASE
     WHEN heures_suivies >= 20 THEN 'prêt_examen'
     WHEN heures_suivies >= 10 THEN 'en_formation'
     ELSE 'nouveau'
   END
6. INSERT/UPDATE eleve_stats
```

### Trigger: `trg_recalc_stats`

**Déclenché par:**
- AFTER INSERT on events
- AFTER UPDATE on events
- AFTER DELETE on events

**Action:** Appelle `recalculate_eleve_stats(NEW.eleve_id)` ou `OLD.eleve_id`

**Effet:** Stats toujours cohérentes avec events

---

## 🔒 Row-Level Security (RLS)

### Politique: `inscriptions_select`
```sql
-- Un élève voit ses propres inscriptions
-- Un moniteur voit les élèves assignés
-- L'admin voit tout
SELECT allowed IF:
  eleve_id = current_user
  OR moniteur_principal_id = current_user
  OR current_role = 'admin'
```

### Politique: `eleve_stats_select`
```sql
-- Un élève voit ses stats
-- Un moniteur voit les stats de ses élèves
-- L'admin voit tout
SELECT allowed IF:
  eleve_id = current_user
  OR eleve's_moniteur = current_user
  OR current_role = 'admin'
```

---

## 🎨 Flux Frontend

### Structure de l'App (index.html)

```
┌─ Authentication
│  ├─ Login form (email + password)
│  ├─ JWT management
│  └─ RLS validation
│
├─ Roles
│  ├─ ADMIN (gestion complète)
│  ├─ MONITEUR (gestion de ses élèves)
│  └─ ÉLÈVE (suivi perso)
│
├─ Views
│  ├─ Planning (calendrier leçons)
│  ├─ Mes élèves (moniteur view)
│  ├─ Stats (progress tracking)
│  ├─ Livret REMC (compétences)
│  └─ Notifications
│
└─ Data Management
   ├─ localStorage (cache JWT + role)
   ├─ Supabase client SDK
   └─ Real-time subscriptions (si activé)
```

### Points d'Entrée Clés

| Function | Ligne | Rôle |
|----------|-------|------|
| `login()` | ~6500 | Authentifie user + récupère profil |
| `switchRole()` | ~3000 | Bascule l'interface selon le rôle |
| `loadEleves()` | ~4500 | Charge liste des élèves (moniteur) |
| `updateStats()` | ~2000 | Rafraîchit les stats depuis DB |
| `addEvent()` | ~5800 | Ajoute une leçon/absence |

---

## 🚀 Cycle de Vie d'une Leçon

```
1. Moniteur crée event via "Planning"
   ├─ Renseigne: date, heure, durée, type (leçon/absence)
   └─ Envoie à Supabase (events table)

2. Trigger `trg_recalc_stats` déclenché
   ├─ Appelle `recalculate_eleve_stats()`
   └─ Met à jour eleve_stats

3. Frontend rafraîchit
   ├─ Récupère heures_suivies mis à jour
   ├─ Affiche nouvelle presence_percent
   └─ Met à jour le badge "etat"

4. Élève voit ses stats rafraîchies
   ├─ Nouveau compteur d'heures
   ├─ Nouveau % présence
   └─ Nouveau statut (nouveau → en_formation → prêt_examen)
```

---

## 📱 Responsive Design

### Breakpoints
```
- Desktop:  > 1024px (2-column layout)
- Tablet:   768-1024px (stacked columns)
- Mobile:   < 768px (single column, vertical menu)
```

### Mobile Specifics
```
- Hamburger menu (hidden on desktop)
- Touch-friendly buttons (48px min)
- Single-column layout
- Bottom action buttons
- Optimized form inputs
```

---

## 🔄 État de la Synchronisation

### Frontend → Backend
```
localStorage              →  SESSION
  • JWT token
  • User role
  • User ID

form inputs               →  events table
  • Nouvelle leçon/absence

manual refresh            →  eleve_stats
  • Requête GET → stats recalculées
```

### Backend → Frontend
```
events table              ←  trigger `trg_recalc_stats`
                             ↓
eleve_stats table updated    ← auto-recalcul

Frontend polling/subscribe   ←  RLS policies
  • Fetch eleve_stats
  • Si user a accès: retour données
  • Sinon: 403 Forbidden
```

---

## ⚠️ Points de Fragilité Actuels

### 1. **Pas de Real-time (WebSocket)**
- Frontend poll manuellement (refresh button)
- Pas de notification live si stats changent
- Latence jusqu'à rafraîchissement manuel

**Fix:** Ajouter Supabase real-time subscriptions

### 2. **Pas de Retry Logic sur Auth**
- Si /token échoue temporairement → login échoue immédiatement
- Pas de backoff exponentiel

**Fix:** upgrade-login.py ajoute 2-attempt retry

### 3. **localStorage Pas Sécurisé**
- JWT stocké en plaintext
- Vulnérable à XSS

**Fix:** Migrer vers httpOnly cookies (nécessite backend)

### 4. **Pas de Validation Frontend**
- Email/password not validated clientside
- Peut envoyer requests invalides

**Fix:** Regex validation + field trimming

---

## 🧪 Checklists de Test

### Test de Création de Leçon
- [ ] Moniteur peut ajouter leçon pour élève
- [ ] Leçon sauvegardée en DB
- [ ] Stats de l'élève recalculées (trigger)
- [ ] Frontend affiche nouvelle durée
- [ ] Présence % mis à jour
- [ ] État peut passer de "nouveau" → "en_formation"

### Test de Présence
- [ ] 0-10h = "nouveau"
- [ ] 10-19h = "en_formation"
- [ ] >= 20h = "prêt_examen"
- [ ] % présence = (heures / forfait) * 100
- [ ] Absence comptée dans nb_absences

### Test RLS
- [ ] Élève ne peut voir que ses stats
- [ ] Moniteur voit ses élèves assignés
- [ ] Moniteur ne voit pas les élèves d'un autre
- [ ] Admin voit tout

---

## 📚 Références

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Triggers:** https://www.postgresql.org/docs/current/sql-createtrigger.html
- **JWT Auth:** https://supabase.com/docs/guides/auth
- **GitHub Pages:** https://docs.github.com/en/pages

---

## 🎯 Prochaines Améliorations (Post-v2)

1. **Real-time Updates** (WebSocket via Supabase)
2. **Mobile App** (React Native ou Flutter)
3. **Analytics Dashboard** (pour gestionnaire)
4. **Email Notifications** (progression élève)
5. **Offline Mode** (service worker)
6. **API Documentation** (OpenAPI/Swagger)

---

**Dernier update:** 10 mai 2026 à 10:24  
**Créé par:** Claude  
**Status:** ✅ Production Ready
