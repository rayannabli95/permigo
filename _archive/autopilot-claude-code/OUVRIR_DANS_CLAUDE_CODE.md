# Comment ouvrir Autopilot dans Claude Code

## Ce que tu as

Dans le dossier de sortie, tu as :

- 📦 **`autopilot-project-v2.zip`** — l'archive complète du projet (recommandé)
- 📦 **`autopilot-project.tar.gz`** — même chose en format Linux/Mac
- 📁 **`autopilot-project/`** — le dossier directement (si tu veux pas dézipper)

À l'intérieur :
- `autopilot.html` — l'application complète (3 400 lignes)
- `CLAUDE.md` — contexte que Claude Code lira automatiquement
- `README.md` — démarrage rapide
- `QUICKSTART_DEV.md` — guide étape par étape pour le dev
- `DEV_BRIEF.md` — spec backend complète (tables SQL, endpoints…)

## Étape 1 : Installer Claude Code (si ce n'est pas déjà fait)

Ouvre le **Terminal** sur ton Mac et tape :

```bash
npm install -g @anthropic-ai/claude-code
```

Si tu n'as pas Node.js, installe-le d'abord :
```bash
brew install node
```

## Étape 2 : Ouvrir le projet dans Claude Code

### Option A — Si tu as récupéré le zip

```bash
cd ~/Downloads                           # ou là où tu as mis le zip
unzip autopilot-project-v2.zip          # dézippe
cd autopilot-project                     # entre dans le dossier
claude                                   # ouvre Claude Code
```

### Option B — Si tu as récupéré le dossier directement

```bash
cd /chemin/vers/autopilot-project
claude
```

### One-liner Mac (à coller direct dans Terminal)

Si tu mets le `.zip` dans `~/Downloads` :

```bash
cd ~/Downloads && unzip -o autopilot-project-v2.zip && cd autopilot-project && claude
```

## Étape 3 : Premier prompt à donner à Claude Code

Une fois dans Claude Code, copie-colle ce prompt :

> Lis CLAUDE.md et DEV_BRIEF.md. Présente-moi un plan d'attaque pour transformer ce prototype en SaaS livrable à une auto-école : Supabase Auth, base de données, création de comptes (admin/moniteur/élève), notifications push, et brancher Claude API pour les agents IA. Donne-moi les étapes prioritaires et l'estimation effort.

Claude Code va lire tout le contexte et te proposer un plan structuré. Tu pourras ensuite lui dire d'attaquer l'étape 1, l'étape 2, etc.

## Étape 4 : Tester l'app avant de la confier au dev

Pour visualiser ce que ton dev va recevoir :

```bash
cd autopilot-project
python3 -m http.server 8080
# puis ouvre http://localhost:8080/autopilot.html dans Chrome
```

Choisis un rôle au splash (Gérant / Moniteur / Élève) et navigue. **Refresh la page : tout doit revenir comme avant.**

## Si Claude Code n'est pas dispo

Tu peux aussi :
1. Mettre le dossier `autopilot-project/` sur GitHub
2. Donner le lien à ton dev
3. Il `git clone` et `claude` sur le clone
4. Ou ouvre le dossier dans Cursor/VS Code, ça marche aussi

## Récap des commandes (Mac)

```bash
# 1. Installer Claude Code
npm install -g @anthropic-ai/claude-code

# 2. Aller dans le projet
cd ~/Downloads/autopilot-project    # adapter le chemin

# 3. Lancer
claude

# 4. (Optionnel) Tester le proto en local
python3 -m http.server 8080
```

Une fois `claude` lancé dans le bon dossier, il lira `CLAUDE.md` automatiquement.
