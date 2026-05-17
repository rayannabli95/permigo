# 🎮 PermiGo Game

> **L'app qui transforme l'apprentissage du permis en habitude quotidienne.**

PermiGo est la couche d'engagement pédagogique pour les auto-écoles françaises.
Système **Triple Validation** : Pratique (enseignant) → Cognitive (quiz 30s) → Consolidation (48h).

## 🚀 Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Remplis VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 3. Run
npm run dev
# → http://localhost:5173

# 4. Build
npm run build
```

## 📚 Documentation

| Fichier | Contenu |
|---|---|
| **CLAUDE.md** | Système prompt pour Claude Code (lu à chaque session) |
| **PRODUCT.md** | Mission, personas, positioning, pricing |
| **FLOWS.md** | User journeys détaillés (élève / enseignant / gérant) |
| **ROADMAP.md** | Plan V1 / V2 / V3 |
| **DESIGN_SYSTEM.md** | Couleurs, typo, composants, sons, tone of voice |
| **ARCHITECTURE.md** | Stack, structure dossier, schéma DB, RLS |
| **KPI.md** | Métriques à tracker |
| **.telemetry/tracking-plan.yaml** | Plan tracking complet en YAML |

## 🏗 Architecture

```
src/
├── modules/        Logique métier (pedagogie, progression, enseignant, gerant)
├── components/     UI réutilisable (toast, modal, mesh-bg, reward-reveal...)
├── pages/          Écrans par rôle
├── services/       Analytics, audio, notifications
├── styles/         Design system CSS
├── data/           Référentiel REMC + questions
└── utils/          Helpers (esc, format-date, count-up, game-state)
```

## 🎯 Mission

Construire la couche d'engagement pédagogique des auto-écoles françaises.
Réduire l'anxiété de l'élève, optimiser le temps de l'enseignant, donner au gérant des données actionnables.

Cible 6 mois : **75% d'élèves "actifs hebdomadaires"**.

## 📊 Métrique North Star

% d'élèves qui ouvrent l'app + complètent ≥1 action / semaine.

## 🤝 Contribuer

Voir `CLAUDE.md` pour les règles de code (pattern obligatoire, esc() partout, mobile-first).

## 📝 License

Privé / propriétaire — © Rayan Nabli 2026
