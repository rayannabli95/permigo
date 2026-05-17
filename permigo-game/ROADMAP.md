# ROADMAP.md — Plan de bataille V1 → V3

## 🚀 V1 — MVP "Triple Validation" (3-4 semaines)

**Objectif** : un produit utilisable en beta par 3-5 auto-écoles.

### Sprint 1 (semaine 1) — Foundation ✅ SHIPPÉ

- [x] Clone composants réutilisables depuis permigo-v7 (auth, toast, modal, esc, mesh-bg)
- [x] Setup Vite + Supabase + Vercel
- [x] Schema DB initial (migrations supabase)
- [x] 31 compétences REMC en seed
- [x] Tracking analytics events_analytics
- [x] Login + logout fonctionnel
- [x] Routing simple par rôle (élève / enseignant / gérant)
- [x] Fix TDZ (const STYLE en haut des fichiers)
- [x] Dark mode forcé (data-theme="dark" + CSS override)
- [x] Trophées élève (src/data/trophees.js + trophees.js page)
- [x] Profil commun (src/pages/common/profil.js)
- [x] Dashboard gérant (src/pages/gerant/pulse.js)
- [x] Onboarding modal (src/components/onboarding-modal.js)
- [x] Animations streak flamme + world pulse (animations.css)
- [x] Offline/online toast (main.js)
- [x] Notif-listener fix (user_id = profiles.id + mark-read before quiz)

### Sprint 2 (semaine 2) — Module pédagogie + Moniteur XP ✅ EN COURS

- [x] Migration 0003_xp_moniteur.sql (streak_pro_days + trigger XP)
- [x] XP toast composant (src/components/xp-toast.js)
- [x] XP toast wiré dans validation.js
- [x] "Mon Année" profil enseignant (stats tableau de chasse)
- [x] Streak pro affiché dans profil enseignant
- [x] Pulse.js amélioré (alertes intelligentes + top 3 enseignants 30j + fix validated_by)
- [x] Edge function consolidation corrigée (bons noms de colonnes)
- [x] Web push service (src/services/web-push.js) — soft opt-in
- [x] Daily action module (src/modules/progression/daily-action.js)
- [x] Weekly replay enrichi (tracking + Web Share API)
- [x] MONITEUR_VISION_V3.md archivé dans docs/
- [x] 40 questions post_validation + 14 consolidation en DB
- [ ] Vérification columns DB + déploiement edge function en prod
- [ ] Tests E2E (Playwright) — repoussé à Sprint 3

### Sprint 3 (semaine 3) — Consolidation + Tests

- [ ] Deploy edge function trigger-consolidation sur Supabase prod
- [ ] Tests Playwright sur flows critiques
- [ ] 120 questions totales (31 comp × ~4)
- [ ] Examens blancs (type exam_blanc)
- [ ] Streak freeze (gemmes)

### Sprint 4 (semaine 4) — Gérant + polish

- [ ] Dashboard "Pulse école" heatmap SVG activité
- [ ] Page Équipe (liste enseignants + ajout)
- [ ] Polish landing + déploiement Vercel confirmed
- [ ] Tests sur 3-5 comptes démo réalistes
- [ ] Documentation utilisateur basique

**Critère de sortie V1** : 3 auto-écoles testent et donnent un avis. Au moins 1 utilise quotidiennement.

---

## 🎨 V2 — Polish + Gamification complète (1-2 semaines)

**Objectif** : produit vendable à 19€/mois.

### Features

- [ ] Trophées (4 trophées + 1 trophée final)
- [ ] Animation reveal trophy (déjà codée dans permigo-v7)
- [ ] Gemmes (système gain/dépense)
- [ ] Boutique avatars (8 avatars dont 4 payants)
- [ ] Sons (5 sons : ding, streak, reveal, tap, whoosh)
- [ ] Examens blancs (3 examens disponibles, 40 questions chacun)
- [ ] 120 questions complètes (31 comp × 4)
- [ ] Notifications smart (timing + messages contextuels)
- [ ] Page profil élève + édition avatar

### Marketing-ready

- [ ] OG image + meta SEO
- [ ] Page publique auto-école (`permigo.app/<slug>`)
- [ ] Témoignages élèves intégrés
- [ ] Sticker "Certifié PermiGo" téléchargeable
- [ ] QR code auto-école

**Critère de sortie V2** : NPS élève > 70. 10 auto-écoles clients à 19€/mois.

---

## 📈 V3 — Croissance & viralité (1-2 mois)

**Objectif** : 50+ auto-écoles, début de viralité.

### Engagement

- [ ] Leagues (Bronze → Diamant) + classement hebdo
- [ ] Top 10 école + Top 100 national (anonymisé)
- [ ] Quêtes journalières
- [ ] Coffres / loot boxes
- [ ] Streak protection (50 gemmes pour geler 1 jour)

### Acquisition

- [ ] Programme parrainage (élève → ami + école → école)
- [ ] Stratégie TikTok organique (vidéos cas d'usage)
- [ ] Partenariats moniteurs influenceurs (Boris Permis, etc.)
- [ ] Cas clients vidéos (3 témoignages d'écoles)

### Pédagogie avancée

- [ ] Mémoire espacée intelligente (algorithme Anki simplifié)
- [ ] Recommandations IA "Qu'est-ce que je dois réviser ?"
- [ ] Stats avancées élève (point fort, point faible, etc.)
- [ ] Examens blancs adaptatifs (difficulté ajustée)

### Vue gérant

- [ ] Export CSV élèves
- [ ] Statistiques avancées (rétention, abandons, etc.)
- [ ] Benchmark vs auto-écoles similaires (anonyme)
- [ ] Programme de fidélité élève

**Critère de sortie V3** : 100 auto-écoles. Modèle commercial validé.

---

## 🔮 V4+ — Long terme (1 an+)

- App mobile native (PWA → iOS/Android via Capacitor)
- Extension à d'autres permis (A, A2, BSR, Permis bateau)
- Module "PostPermis" (révision conduite, perfectionnement)
- Marketplace pédagogique (cours vidéo, ebooks)
- Partenariats institutionnels (sécurité routière, mutuelles)
- B2C pur (élève autonome 4.99€/mois)
- API publique pour intégrateurs

---

## ❌ Hors scope (ce qu'on NE FAIT PAS)

| Feature | Pourquoi non |
|---|---|
| Système de paiement intégré | Casse-tête juridique + non aligné avec la mission |
| Planning enseignants avec créneaux | Complexifie + l'école a déjà ses outils |
| Réservation autonome élève | Idem, pas notre métier |
| Gestion comptable | Cible Logipermis, on ne se positionne pas là |
| Contenu code de la route complet | Cible Codes Rousseau, on est complémentaire |
| Auto-école en ligne | Cible Ornikar, on est l'inverse (renforce l'école physique) |
| Système d'examen pratique | Domaine de l'État, on ne touche pas |
| Donner un permis virtuel | Légal seulement via État |

---

## 🎯 Priorités absolues

### Top 3 features pour V1
1. **Quiz post-validation** (la magie pédagogique unique)
2. **Streak quotidien** (la mécanique d'addiction utile)
3. **Pulse école** (la donnée que le gérant ne peut pas ignorer)

### Le reste = nice to have, peut attendre

---

## 📅 Calendrier idéal

| Mois | Étape | Objectif |
|---|---|---|
| **M+0 à M+1** | V1 dev | Code MVP fonctionnel |
| **M+1 à M+3** | Beta privée 3-5 écoles | Premiers feedbacks + témoignages |
| **M+3 à M+4** | V2 dev | Polish + gamification |
| **M+4 à M+6** | Lancement public | 10-20 écoles payantes |
| **M+6 à M+12** | V3 + croissance | 50-100 écoles, viralité |

---

## 🛑 Quand reconsidérer la roadmap

Tu DOIS appeler l'utilisateur si :
- Une feature V1 prend > 5 jours (trop complexe)
- Un retour utilisateur invalide une assumption majeure
- Un concurrent sort un truc identique
- Un nouveau insight pédagogique change la donne

Sinon, on suit le plan.
