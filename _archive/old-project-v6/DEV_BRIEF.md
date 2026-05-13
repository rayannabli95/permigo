# Autopilot — Dossier de mise en production

Application de gestion d'auto-école — front fonctionnel, prêt à être branché à un backend pour livraison à un client.

---

## 1. État actuel

Le fichier `autopilot.html` est un prototype mono-fichier complet :
- HTML + CSS + JavaScript dans un seul document (~3000 lignes)
- 3 rôles séparés (Admin / Moniteur / Élève) avec sidebar dédiée par rôle
- Toute la persistance utilise `localStorage` côté navigateur
- Aucun appel réseau — tout est mocké et fonctionne hors-ligne
- 5 agents IA simulés (réponses pré-rédigées avec effet typewriter)

---

## 2. Ce que le développeur doit faire pour passer en production

### 2.1 Backend à créer (priorité par ordre)

1. **Authentification** (Supabase Auth, Auth0 ou Firebase Auth)
   - 3 rôles : `admin`, `moniteur`, `eleve`
   - Email + mot de passe, magic link, biométrie (WebAuthn)
   - Endpoints : `POST /auth/login`, `/auth/logout`, `GET /auth/me`
   - Remplacer `localStorage.getItem('ap-role')` par session JWT

2. **Base de données** (Postgres recommandé via Supabase)

   Tables principales :

   ```sql
   users (id, role, email, phone, photo_url, created_at)
   monitors (user_id, plate, bepecaser, max_hours_week, hourly_rate)
   students (user_id, neph, package_hours, code_status, monitor_id)

   events (id, monitor_id, student_id, date, start_time, duration_min,
           type, comment, status, location_id, created_by, created_at)
     -- type : 'lecon' | 'perso' | 'absence' | 'dispo'
     -- status : 'pending' | 'confirmed' | 'cancelled'

   absences (id, monitor_id, type, start_date, end_date, hours,
             note, created_by_admin_id)

   ratings (id, student_id, monitor_id, lesson_id, stars, comment,
            visibility, created_at)
     -- visibility : 'admin_only' (par défaut)

   booklet_entries (id, student_id, monitor_id, lesson_id, date,
                    vu, a_revoir, comment, comp_levels JSONB,
                    student_visible, signed_at)
     -- comp_levels : { "C1a": "v", "C1b": "o", ... }

   locations (id, monitor_id, name, address, hourly_rate)

   private_notes (id, monitor_id, student_id, content, updated_at)

   notifications (id, user_id, type, title, body, link, read, created_at)
   ```

3. **Storage photos** (Supabase Storage ou S3)
   - Bucket `profile-photos/` accessible en signed URL
   - Endpoint upload : `POST /storage/upload`
   - Remplacer les `localStorage.setItem('ap-mon-photo', dataURL)` par upload réel

4. **Notifications push**
   - Service Worker + Web Push API
   - Triggers : leçon créée/modifiée/annulée, livret rempli, absence enregistrée, notation reçue, plafond atteint
   - Le code actuel utilise `toast()` pour simuler — remplacer par appels au serveur de push

5. **Agents IA** (Claude / GPT-4 / Mistral)
   - 5 agents implémentés dans le front (mock) :
     - `optimiseur` — admin : optimisation planning
     - `anomalies` — admin : détection anomalies
     - `prochaine` — moniteur : plan prochaine leçon
     - `risque` — moniteur : élèves à risque
     - `coachExam` — élève : préparation examen
   - Endpoint à créer : `POST /ai/agent/<name>` qui retourne `{title, summary, list[], actions[]}`
   - Les chips IA classiques utilisent `AI_SIM` — à remplacer par `POST /ai/chat`

### 2.2 Comptes à créer pour le client (auto-école)

À chaque déploiement chez une nouvelle auto-école :

1. Créer le tenant (auto-école : nom, ville, SIRET, logo)
2. Créer 1 compte **admin/gérant** avec invitation par email
3. L'admin créera ensuite ses moniteurs et élèves depuis l'interface

Pages admin à compléter (actuellement non incluses dans le prototype) :
- Création moniteur (nom, email, téléphone, plaque, BEPECASER, plafond hebdo)
- Création élève (nom, email, téléphone, NEPH, forfait, statut code)
- Gestion des forfaits / facturation (Stripe Connect recommandé)

### 2.3 Pages / fonctionnalités présentes mais à compléter en V2

- **Annulation tardive** : modal présente, mais pas de logique de facturation auto
- **Examen pratique** : statut affiché mais pas de workflow d'inscription
- **Code de la route** : statut affiché, mais pas de plateforme intégrée
- **Statistiques mensuelles** : tableau présent, à brancher sur SQL réel
- **Multi-école** (chaîne) : actuellement mono-tenant — prévoir si client gère plusieurs écoles

---

## 3. Persistance actuelle (clés localStorage)

Toutes ces clés sont à migrer vers la DB :

| Clé | Description | Cible DB |
|---|---|---|
| `ap-role` | Rôle actif | session JWT |
| `ap-dark` | Thème sombre | `users.preferences.dark_mode` |
| `ap-events` | Planning | table `events` |
| `ap-absences` | Absences | table `absences` |
| `ap-notations` | Évaluations | table `ratings` |
| `ap-lieux` | Lieux RDV | table `locations` |
| `ap-cs` | Compétences livret | `booklet_entries.comp_levels` |
| `ap-notes-priv` | Notes privées | table `private_notes` |
| `ap-livret-filled` | État livret | table `booklet_entries` |
| `ap-mon-photo` / `ap-admin-photo` / `ap-elv-photo` | Photos | bucket storage |
| `ap-bio` / `ap-bio-admin` | Préférence biométrie | `users.preferences.biometric` |

Le code expose déjà une couche `STORE` :
```js
STORE.get(key, defaultValue)
STORE.set(key, value)
STORE.del(key)
```
À remplacer par un wrapper qui appelle l'API.

---

## 4. Architecture cible recommandée

```
┌─────────────────────────────────────────┐
│  Front (React/Vue/Svelte ou HTML actuel)│
└────────────────┬────────────────────────┘
                 │ REST/GraphQL
┌────────────────▼────────────────────────┐
│   API (Node/Bun + Express ou Hono,      │
│   ou directement Supabase Edge Funcs)   │
└────────────────┬────────────────────────┘
                 │
   ┌─────────────┼──────────────┬──────────────┐
   ▼             ▼              ▼              ▼
Postgres      Storage         Auth         Agents IA
(Supabase)   (photos)      (Supabase)   (Claude API)
```

Stack recommandée pour un MVP rapide :
- **Front** : conserver le HTML actuel et créer une API JS qui remplace `STORE`
- **Backend** : Supabase (Auth + DB + Storage + Realtime + Edge Functions)
- **IA** : Anthropic Claude API (Sonnet pour rapports, Haiku pour chat)
- **Push** : OneSignal ou Firebase Cloud Messaging
- **Paiements** : Stripe Connect (auto-école = compte connecté)

---

## 5. Boutons et flux fonctionnels

Tous les boutons listés ci-dessous sont **fonctionnels** dans le prototype actuel (avec persistance localStorage) :

### Admin
- Hero accueil : bonjour dynamique + horloge live + tags cliquables
- Boutons quick action : Voir planning, Rapport IA, Planning moniteur, Liste élèves, Ajouter absence
- Assiduité : sélecteur jour, export CSV paye, voir notation moniteur, ajouter absence
- Calendrier : sélecteur moniteur (filtre planning), ajouter heures, navigation semaine
- Profil : photo upload, biométrie toggle, modifier infos en place

### Moniteur
- Planning : ajouter créneau / leçon / RDV perso / absence / dispo
- Vue Semaine ↔ Hebdo (toggle)
- Clic sur événement existant → modal action (annuler/supprimer)
- Mes élèves : recherche, filtres, ouvre fiche
- Fiche élève : remplir livret, proposer leçon, sauver notes privées (persistées)
- Livret : grille REMC interactive (rouge/orange/vert), génération IA commentaire, save persistant
- Profil : photo upload, lieux ajout/édition/suppression, dark mode, biométrie

### Élève
- Réserver leçon (modal slots)
- Voir trophées, voir livret rempli
- Évaluer son moniteur (modal notation 5 étoiles + commentaire)
- Coach IA examen (panel rétractable avec actions)
- Profil : photo upload, dark mode, sync status

---

## 6. Ce qui manque clairement (V2)

- Création de comptes utilisateur depuis l'admin (formulaires non présents)
- Facturation et paiement
- Module code de la route
- Module examen pratique avec inscription
- Multi-tenant (plusieurs auto-écoles)
- Export PDF du livret REMC
- Application mobile native (l'actuelle est responsive mais pas PWA)
- Logs d'audit (qui a fait quoi)

---

## 7. Pour démarrer le dev

```bash
# 1. Cloner le HTML
cp autopilot.html app/index.html

# 2. Setup Supabase
npx supabase init
# Créer les tables avec le SQL ci-dessus

# 3. Remplacer la couche STORE par appels API
# Dans autopilot.html, remplacer le bloc STORE par :
const STORE = {
  async get(k) { return await api.fetch(k); },
  async set(k, v) { return await api.save(k, v); },
};

# 4. Ajouter Auth + RLS dans Supabase
# 5. Déployer (Vercel / Netlify pour le front, Supabase pour le back)
```

---

## 8. Estimation effort dev

| Tâche | Effort |
|---|---|
| Auth + DB + RLS | 3-4 jours |
| Migration STORE → API | 2-3 jours |
| Création comptes admin/moniteur/élève | 2 jours |
| Notifications push | 2 jours |
| Photos upload réel | 1 jour |
| Branchement Claude API (vrais agents) | 2 jours |
| Tests + correctifs | 3 jours |
| **Total MVP livrable** | **~3 semaines** |

Pour V2 (facturation, code, examen) : compter +4 semaines.
