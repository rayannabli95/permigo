# Autopilot v6

Application de gestion d'auto-école — prototype fonctionnel mono-fichier, aligné spec v6 (palette bleue, statuts white/yellow/red, écrans Login + Signup).

## Quickstart

```bash
# Servir en local (recommandé)
python3 -m http.server 8080
open http://localhost:8080/autopilot.html

# Ou ouvrir directement
open autopilot.html
```

À l'écran d'accueil :
- **Connexion** — email + mot de passe (n'importe quoi de valide, l'email détermine le rôle)
- **Créer un compte** — rôle + nom + email + mot de passe (force calculée, confirmation)
- **🎭 Mode démo** — passer outre l'auth pour tester les 3 rôles

> Mode démo : tape `admin`, `moniteur`, ou `eleve` quand on te demande.

## Comptes de démo

| Rôle | Nom | Spécifique |
|---|---|---|
| Gérant | Sophie Laurent | Voit tout, gère planning et paye |
| Moniteur | Marco Dominguez | 12 élèves, plafond 35h/sem |
| Élève | Arnaud Kenfack | 7h/30h, code obtenu |

Les états (planning, livret, photos, lieux RDV…) sont sauvegardés en `localStorage`. Refresh → on reprend où on s'était arrêté. Logout → splash réapparaît.

## Pour le développeur
## Utiliser Claude Pro avec ce projet

- Ouvre le dossier du projet dans VS Code via `File > Open Folder...`.
- Si tu utilises Claude / Copilot Chat, ajoute ta clé API Claude Pro dans les paramètres de l'extension.
- Ouvre `autopilot.html` pour travailler sur l'application.
- Ouvre `PROMPT_CLAUDE_PRO.md` pour copier le prompt prêt à l'emploi.
- Si tu veux connecter ton travail à une web app ou un dépôt GitHub, il faut d'abord pousser ce dossier sur GitHub, puis lier le dépôt à la web app.

Ce projet est actuellement local : tu peux l'ouvrir dans VS Code et tester avec `autopilot.html`.

- 🔵 [`PROMPT_COWORK_FRONTEND.md`](PROMPT_COWORK_FRONTEND.md) — **SPEC v6 OFFICIELLE** (couleurs, statuts, 8 écrans, timeline 4 sem.)
- 📘 [`CLAUDE.md`](CLAUDE.md) — contexte complet pour Claude Code
- 📗 [`DEV_BRIEF.md`](DEV_BRIEF.md) — spec backend, tables SQL, estimation effort
- 📙 [`QUICKSTART_DEV.md`](QUICKSTART_DEV.md) — guide étape par étape pour le dev
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
