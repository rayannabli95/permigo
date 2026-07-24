# PermiGo — pointeur

> 📖 **La source de vérité est [`permigo-game/CLAUDE.md`](permigo-game/CLAUDE.md)** — cap produit, rôles, règles, DA par rôle, archi, commandes, workflow. **Lis-le d'abord.**
> 🤝 **Comment on bosse à plusieurs agents (Claude ↔ Codex ↔ Rayan) : [`WORKFLOW.md`](WORKFLOW.md)** — la boucle 4 temps, les 4 garde-fous, l'anti-collision. Source unique du *comment*.

⚠️ **Emplacement** : le projet vivant est **`permigo-game/`**. La racine `permigo-v7/` héberge un ancien projet Drizzle + Hono + SQLite (`dev.db`) **inutilisé** + des docs legacy. **Ne pas modifier le code à la racine** sans validation explicite.

**En deux lignes** : PermiGo = **le compagnon qui prépare l'élève avant chaque heure de conduite** (boucle : Préparer → Conduire → Débriefer → Consolider ou suite — pivot 17/07/2026). Le moniteur observe (dashboard passif, abo 9,99 €/mois) ; l'élève certifie lui-même son parcours. Stack : **Vanilla JS (ES modules) + Vite + Supabase + Vercel**.
