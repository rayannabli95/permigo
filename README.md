# PermiGo Autopilot v7

Plateforme intelligente pour auto-écoles modernes. Frontend vanilla JS + Vite, backend Hono, base SQLite (dev) → Postgres (prod).

## Démarrage rapide

```bash
brew install node@20         # si pas déjà fait
cd ~/Desktop/permigo-v7
npm install
cp .env.example .env         # remplis avec tes clés Supabase
npm run db:migrate           # crée dev.db (SQLite)
npm run db:seed              # charge données de démo
npm run dev                  # http://localhost:5173
```

## Documentation

- **ARCHITECTURE.md** — structure du projet, choix techniques
- **MIGRATION_GUIDE.md** — comment migrer les sections de l'ancien `autopilot.html`
- **supabase/migrations/** — schéma versionné de la base

## Stack

- **Vite** + vanilla JS modules
- **CSS pur** (variables, animations natives)
- **Drizzle ORM** (SQLite dev ↔ Postgres prod)
- **Supabase Auth** (conservé)
- **Hono** (backend léger)

## Comptes de test (Supabase prod)

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin/Gérant | rayannabli27@gmail.com | Autopilot2025! |
| Moniteur | rayan.nabli@autopilot.fr | Autopilot2025! |
| Élève | latifa.sahli@autopilot.fr | Autopilot2025! |

## Production

```bash
npm run build
# → dist/ contient le frontend statique
# → déployer sur GitHub Pages, Vercel, ou Netlify
```

Pour le backend en prod, déployer `src/server/` sur Railway/Fly/Render avec la `DATABASE_URL` Supabase.
