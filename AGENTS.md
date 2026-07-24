# AGENTS.md — PermiGo · guide pour Codex (et tout agent IA)

> Ce fichier est lu automatiquement par ChatGPT Codex à chaque session.
> Il te dit **comment travailler sur PermiGo sans rien casser ni écraser le travail des autres**.
> Écrit le 24/07/2026. La section « État » en bas est datée → à rafraîchir.
>
> 🤝 **Le protocole de collaboration commun (Claude ↔ Codex ↔ Rayan) vit dans [`WORKFLOW.md`](WORKFLOW.md) — lis-le : c'est la source de vérité du *comment on bosse ensemble*.** Ce fichier-ci ne garde que ce qui est propre à Codex.

---

## Le projet en 4 lignes
PermiGo = **le compagnon qui prépare l'élève avant chaque heure de conduite** (boucle : Préparer → Conduire → Débriefer → Consolider — pivot du 17/07/2026). Le moniteur **observe** (dashboard passif, abo 9,99 €/mois) ; l'élève **certifie lui-même** son parcours.
Stack : **Vanilla JS (ES modules) + Vite + Supabase + Vercel**. Langue du projet : **français** (UI, commits, docs).
⚠️ **Le projet vivant est `permigo-game/`.** La source de vérité produit/technique est `permigo-game/CLAUDE.md` — **lis-le avant de coder.**

---

## Qui fait quoi (Codex ⇄ Claude ⇄ Rayan)
Il n'y a **pas d'intégration directe** entre Codex et Claude Code. Le pont = **le dépôt git + les rapports que Rayan recopie d'un outil à l'autre**.
- **Toi, Codex = le travail à la chaîne, mécanique, sur du texte/code** : traductions i18n, tests, corrections de bugs bien décrits, optimisation d'assets, application d'une maquette/spéc déjà décidée, refactors répétitifs. Tu travailles **à l'aveugle** (tu ne vois pas le rendu).
- **Claude Code = tout ce qui se juge à l'œil** (design, animations, images, DA) **+ la mise en prod** (merges, migrations, Stripe, deploy) **+ le jugement produit/pédago**. Claude peut lancer l'app, screenshoter et itérer.
- **Rayan = le patron.** Il donne les GO. **Quand Claude n'est pas là, c'est RAYAN qui est l'œil** : tu builds, il regarde le rendu réel avant tout merge.

---

## ✅ Ce que tu peux faire seul
- Coder une tâche **clairement délimitée** (fichiers nommés) sur **ta propre branche**.
- Traductions i18n (clés miroir, `ar`/`en` = même nombre de clés, RTL par `<span dir="rtl">`).
- Corriger un bug **avec repro claire** ; écrire des tests ; optimiser des assets.
- Appliquer une **maquette/spéc déjà validée** par Rayan/Claude (ex : « colonne gauche = X, droite = Y »).
- Toujours : `npm run build` **vert** avant de finir.

## ⛔ Ce que tu ne fais JAMAIS sans le GO nommé de Rayan
- **Merger** sur `main` / ouvrir-fusionner une PR. (Tu pushes ta branche, tu t'arrêtes.)
- **Migrations Supabase** / **deploy** / toucher **Stripe / paiement**.
- **Décider un design** ou juger un rendu « à l'œil » (tu ne le vois pas → tu te tromperas). Demande la maquette d'abord.
- Toucher au **code à la racine `permigo-v7/`** (ancien projet Drizzle mort — tout se passe dans `permigo-game/`).
- Toucher aux **fichiers/dossiers d'un autre chantier en cours** sans l'annoncer.

---

## Règles absolues (le prix du sang — déjà payé, ne pas refaire)
- **Jamais** de commande git destructive (`reset --hard`, etc.) ni de `git stash` dans un dossier sale. Travaille sur ta branche à toi.
- **Jamais `git add -A`** (des symlinks/fichiers parasites se glissent) → stage **explicite** des fichiers voulus.
- **Tokens couleur** : utilise `--su / --mu / --bo / --ink` (+ `--a` accent). **JAMAIS** `--surface/--muted/--border` (ils cassent le thème boutique). `escAttr()` dans les attributs HTML, `esc()` dans le contenu.
- **Piège animation** : une animation en `transform` sur un parent **casse `position:fixed`** (les overlays sautent). Si tu animes près d'un overlay fixed → préviens, c'est un terrain Claude.
- **Mots bannis** : « gemme » (dire « volant »). Jamais afficher d'« heures » dans les célébrations.
- **Ne recrée pas** ce qui a été supprimé exprès : landing moniteur, validation de séance moniteur, coaching moniteur, ligue moniteur.
- Le repo **ne reflète pas 100% de la prod** : ~10 edge functions push sont déployées mais absentes du repo — ne les modifie pas à l'aveugle.

---

## Branche + rapport (obligatoire)
1. Nouvelle branche : `git fetch origin && git switch -c codex/<sujet> origin/main`.
2. Ne touche **que** les fichiers de ta tâche. Build vert. Commit + push. **Pas de merge, pas de PR.**
3. Termine TOUJOURS par un **RAPPORT à recoller dans Claude/Rayan** :
   `CHANTIER / BRANCHE / FAIT / RESTE À FAIRE / FICHIERS TOUCHÉS / MIGRATIONS (aucune/appliquée/en attente) / BLOQUEURS-RISQUES / DÉLÉGABLE.` FR simple, court.

Mode Codex conseillé : **Auto** (workspace-write) — tu codes/builds seul, tu demandes l'accord seulement pour le `push` (réseau).

---

## État au 24/07/2026 (snapshot — à rafraîchir)
**En prod aujourd'hui** : traduction arabe page Pass · desktop moniteur 2 colonnes · fix « chunks périmés » du router · gros lot i18n EN/AR (accueil, récompenses, classement, exam, notifs). Moniteur = observation, fiche élève en lecture seule.

**Décisions produit tranchées (24/07)** :
- Après certif : le hero accueil **AUTO-AVANCE** au thème suivant (on efface le thème par défaut au moment de la certif). « Consolider » reste dispo en 1 tap dans « changer de thème ». (Lane Claude.)
- Mascottes à fond opaque (`coffre`, `competence-debloquee`, `quiz-parfait`) : **détourage** (enlever le fond) — pas de cartes encadrées.

**Chantiers en cours** :
- **Mascotte** : optimisation des images (Codex, Lot 0) → puis branchement animé sur ~20 écrans (Claude choréographie 1 référence, Codex réplique).
- **Liste des thèmes** (accueil « changer de thème ») : refonte design → Claude fait la maquette d'abord.

**i18n** : quasi fini ; restent des miettes (profil, formulaire inscription). Notifs serveur = FR en dur (fix = serveur, lire `user_preferences.language`).

**Bugs/backlog** : paiement côté serveur (webhook Stripe), légal LCEN — chantiers de Rayan.

**Repères** : comptes test `eleve@test.fr` / `enseignant@test.fr` · code rattachement moniteur **RAYAN75** (`#/rejoindre`, `?solo=1` pour solo) · « suppression de compte » = **anonymise** (ne DELETE pas ; finir un compte test au `DELETE` SQL) · site = **permigo.fr** (pas .com) · hôte canonique `www.permigo.fr`.
