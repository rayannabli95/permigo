# STARTUP.md — Comment lancer une nouvelle conv Claude sur ce projet

> **Ouvre ce fichier, copie le bloc qui correspond à ta situation, colle dans Claude. C'est tout.**

---

## Mode 1 — Cowork (interface graphique Claude)

Ouvre une nouvelle session Cowork sur le dossier `~/Desktop/permigo-v7`, puis colle ce message en premier :

```
On bosse sur PermiGo v7. Avant toute chose, lis dans cet ordre :
- CLAUDE.md
- COORDINATION.md
- OWNERSHIP.md
- FLOWS.md
- Les 3 skills dans .claude/skills/*/SKILL.md

Une fois lu, confirme que tu as compris l'architecture 3 bots
(élève / moniteur / admin) et le système anti-collision.
Ensuite je te donne ma première tâche.
```

Tu peux ouvrir **3 sessions Cowork en parallèle** sur le même dossier, et dans chacune dire "tu es le bot élève / moniteur / admin" pour qu'elles travaillent en parallèle sur 3 chantiers sans se marcher dessus.

---

## Mode 2 — Claude Code (terminal)

Installation une fois :
```bash
brew install claude
```

Ensuite, à chaque session :
```bash
cd ~/Desktop/permigo-v7
claude
```

Les skills se chargent automatiquement. Tu n'as rien à copier-coller. Tu dis juste ce que tu veux faire :

- "bot élève, polish le parcours"
- "bot moniteur, ajoute la file demandes en attente sur /aujourdhui"
- "bot admin, code la page /audit"

Pour faire bosser les 3 en parallèle : ouvre 3 onglets iTerm, dans chacun lance `claude` dans le dossier projet, et donne une tâche différente à chaque onglet.

---

## Mode 3 — Conv courte sur claude.ai web

Si tu veux juste poser une question rapide sans toucher le code, claude.ai web suffit. Mais **claude.ai web n'a pas accès aux fichiers du projet**. Donc :

- Pour discuter design / poser une question : ok
- Pour coder ou modifier des fichiers : utilise Mode 1 ou Mode 2

---

## Phrases-types pour parler aux bots

Tu n'as **jamais** à appeler un bot par son nom technique. Dis juste ce que tu veux dans tes mots :

| Tu veux ça | Tu écris |
|---|---|
| Améliorer un écran élève | "améliore l'écran [accueil/parcours/réservation/trophées]" |
| Coder une nouvelle page moniteur | "code une page [X] côté moniteur" |
| Ajouter un KPI dans le dashboard | "ajoute [le KPI] dans le tableau de bord admin" |
| Comprendre un bout du code | "explique-moi comment fonctionne [le fichier X]" |
| Faire un audit | "audit le code [côté X] et dis-moi les 3 priorités" |

Claude détecte tout seul quel bot activer.

---

## Comptes de test (à donner aux bots si besoin)

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | rayannabli27@gmail.com | Autopilot2025! |
| Moniteur | rayan.nabli@autopilot.fr | Autopilot2025! |
| Élève | latifa.sahli@autopilot.fr | Autopilot2025! |

App locale : `http://localhost:5173` après `npm run dev`.

---

## Si quelque chose part en vrille

- Bug bizarre après une modif : `git diff` pour voir ce qui a changé, demande au bot fautif de fixer
- Conflit Git entre 2 conv : pull/rebase, demande à Claude de résoudre les conflits
- Bot qui touche un dossier qu'il ne devrait pas : recolle-lui son skill (`.claude/skills/permigo-X-ux/SKILL.md`) et dis-lui "tu sors de ton scope, relis ta charte"

---

## Rappel important

Les bots = **outils de dev pour toi**. Tes utilisateurs (élèves, moniteurs) ne les voient jamais. L'app PermiGo finale n'a aucune IA dedans, aucun coût API. Les bots disparaissent une fois le code écrit.
