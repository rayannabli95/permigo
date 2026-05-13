# Autopilot

Application de gestion d'auto-école — prototype fonctionnel mono-fichier.

## Quickstart

```bash
# Servir en local (recommandé)
python3 -m http.server 8080
open http://localhost:8080/autopilot.html

# Ou ouvrir directement (certaines APIs comme localStorage marchent quand même via file://)
open autopilot.html
```

Au splash, choisir un rôle parmi **Gérant** (admin), **Moniteur** ou **Élève**, puis cliquer **Accéder →**.

## Comptes de démo

| Rôle | Nom | Spécifique |
|---|---|---|
| Gérant | Sophie Laurent | Voit tout, gère planning et paye |
| Moniteur | Marco Dominguez | 12 élèves, plafond 35h/sem |
| Élève | Arnaud Kenfack | 7h/30h, code obtenu |

Les états (planning, livret, photos, lieux RDV…) sont sauvegardés en `localStorage`. Refresh → on reprend où on s'était arrêté. Logout → splash réapparaît.

## Pour le développeur

- 📘 [`CLAUDE.md`](CLAUDE.md) — contexte complet pour Claude Code
- 📗 [`DEV_BRIEF.md`](DEV_BRIEF.md) — spec backend, tables SQL, estimation effort
- 📕 [`autopilot.html`](autopilot.html) — l'app complète (HTML+CSS+JS)

## Workflow recommandé pour livrer à un client

1. Brancher l'auth (Supabase Auth recommandé) — voir DEV_BRIEF §2.1
2. Migrer les `STORE.get/set` vers des appels API
3. Créer les formulaires d'admin pour ajouter moniteurs et élèves
4. Brancher Claude API pour les agents IA
5. Activer push notifications
6. Déployer (Vercel/Netlify pour le front, Supabase pour le back)

Estimation : **~3 semaines** pour un MVP livrable. **~7 semaines** pour V2 complète (facturation, code, examen).

## Stack actuelle

- HTML + CSS + JavaScript vanilla
- Aucune dépendance npm
- Aucun build step
- Compatible tout navigateur moderne (testé Chrome, Safari, Firefox)
- Polices : Bricolage Grotesque + Inter (Google Fonts)

## Stack cible recommandée

- **Front** : conserver le fichier ou migrer vers Astro/SvelteKit
- **Back** : Supabase (Auth + Postgres + Storage + Realtime + Edge Functions)
- **IA** : Anthropic Claude API
- **Push** : OneSignal ou Firebase Cloud Messaging
- **Paiements** : Stripe Connect

## Licence

Privé — Auto-École du Centre · Paris 15e (à adapter pour chaque client).
