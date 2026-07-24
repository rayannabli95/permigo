# WORKFLOW.md — Protocole Claude ↔ Codex ↔ Rayan

> **Source de vérité unique du « comment on bosse ensemble ».**
> `AGENTS.md` (Codex) et `permigo-game/CLAUDE.md` (Claude) pointent ici.
> Mêmes règles des deux côtés. Écrit pour rester valable quel que soit le prochain modèle.

---

## La boucle (4 temps, on répète palier par palier)
1. **Plan + confrontation** — Claude (architecte) écrit le cahier des charges d'UN palier, puis le fait **attaquer par des avocats du diable** avant de lancer quoi que ce soit.
2. **Exécution du palier** — Codex (exécutant) enchaîne **toutes** les tâches du palier, seul, sans intervention.
3. **Audit du palier** — Claude vérifie, documente, réajuste le plan, **corrige la dérive** avant de repartir.
4. **Palier suivant** — Codex repart sur un plan propre. On recommence.

## Les rôles
- **Claude = architecte + œil + prod + juge.** Conçoit le plan, screenshote le rendu réel, merge/migration/deploy, tranche le produit/pédago.
- **Codex = exécutant à l'aveugle.** Texte/code mécanique, scope **nommé**, sur **sa** branche. Ne voit pas l'écran.
- **Rayan = le patron.** Donne les GO. Quand Claude n'est pas là, **c'est Rayan l'œil** (il regarde le build avant tout merge).

## ⚠️ Le risque n°1 : le génie trop littéral (« 1+1=3 »)
Codex prend l'objectif **au pied de la lettre** et a tendance à **déborder l'intention** — polir, ajouter, « améliorer » au-delà du demandé (tendance documentée par OpenAI sur les longs runs). 
**Parade :** un cahier des charges **serré** + une **fin vérifiable**. Ce qui n'est pas écrit dans le scope, Codex ne le fait pas.

## Les 4 garde-fous d'un long run
1. **Branche isolée** — Codex travaille sur une **copie** (sa branche depuis `origin/main`), jamais sur le code sûr.
2. **Fin vérifiable** — le run s'arrête sur une **PREUVE** (build vert **+ un check précis** : tests passent, `ar`==`en`, capture du rendu…), pas sur une impression.
3. **Audit à chaque palier** — Claude relit, documente, corrige **avant** de repartir (jamais deux paliers d'affilée sans audit).
4. **Quota** — un œil sur la **jauge d'usage** avant de lancer un long run (limite hebdo Claude, budget de la session).

## Anti-collision (le prix du sang)
- **1 chantier = 1 outil = 1 branche = 1 worktree**, fichiers **disjoints**.
- Deux chantiers qui partagent un fichier → **même branche** (jamais deux branches concurrentes).
- **Jamais** de git destructif (`reset --hard`) ni `git stash` en dossier sale. **Jamais `git add -A`** (stage explicite).
- **Merge / migration / deploy = seulement après check vert + GO Rayan nommé** (par lot).

## Rapport de fin (imposé aux deux, recopié dans l'autre outil)
> Il n'y a **pas d'intégration directe** Codex ↔ Claude. Le pont = git + rapports recopiés à la main.

`CHANTIER / BRANCHE / FAIT / RESTE / FICHIERS TOUCHÉS / MIGRATIONS (aucune·appliquée·en attente) / BLOQUEURS-RISQUES / DÉLÉGABLE.` — FR simple, court.

## Où lit-on quoi
- **Codex** entre par **`AGENTS.md`** (racine).
- **Claude** entre par **`permigo-game/CLAUDE.md`** (produit/technique) + mémoire perso.
- Les deux pointent **ici** pour le protocole commun. Ce fichier = la seule source de vérité du *comment*.
