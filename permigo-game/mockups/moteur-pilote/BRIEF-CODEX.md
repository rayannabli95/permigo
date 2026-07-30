# Brief pour Codex — dessiner tous les éléments du Mode Pilote

> Décision de Rayan, 30/07/2026 : « il fait ça mieux, au pire on lui demande de
> créer tous les éléments ». Va pour toi.

## Ce qui change par rapport à GALERIE.md

La galerie prévoyait 31 photos à générer. **La plupart tombent.** Les scènes de
jeu sont dessinées en code, comme tu l'as fait : c'est plus cohérent, ça se
décline (boîte auto, nuit, pluie, voyant allumé) et ça ne coûte pas une image
par variante.

Les photos ne servent plus qu'aux **vignettes de briefing**, avant d'entrer dans
la scène. On en a déjà 20 dans `public/art/fiches/`, elles suffisent pour
démarrer.

## Ce que tu as déjà

12 scènes, 81 classes de décor, aucune image : cockpit, démarrage, alerte,
intersection, giratoire, virage, nuit, pluie, urgence, GPS, ville dense,
extérieur. C'est la base. On l'étend, on ne la refait pas.

## Ce qu'il manque, par ordre d'utilité

**Lot 1 · les pieds et la boîte** (débloque C1d, C1e, C1f, C3d et toute la voie
boîte automatique)
1. pédalier boîte manuelle, 3 pédales, vue du siège
2. pied gauche enfoncé à fond sur l'embrayage
3. pédalier boîte automatique, 2 pédales
4. pied droit à fond sur le frein
5. sélecteur P/R/N/D, chaque position pouvant s'allumer
6. levier manuel avec sa grille, chaque rapport pouvant s'allumer

**Lot 2 · le tableau de bord** (débloque toute la mécanique « diagnostiquer »)
7. bloc compteurs complet, **tous voyants éteints**, chaque voyant pouvant
   s'allumer indépendamment
8. les 12 voyants : moteur, huile, batterie, ABS, airbag, température, pression
   des pneus, frein à main, réserve, ESP, ceinture, feux
9. compte-tours avec zone rouge, aiguille pilotable

**Lot 3 · le tour de voiture** (débloque C1g, aujourd'hui impossible)
10. voiture vue 3/4 avant · 11. 3/4 arrière · 12. de profil
13. pneu avec témoin d'usure · 14. feu avant · 15. feu arrière
16. capot ouvert, les niveaux

**Lot 4 · les réglages du poste** (débloque C1b, C1c)
17. siège et sa commande · 18. rétroviseur intérieur réglable
19. appui-tête · 20. mains en 9h15 sur le volant

**Lot 5 · les manœuvres vues de dessus** (débloque C1h, C1i)
21. créneau · 22. épi · 23. bataille · 24. demi-tour en trois temps

## Les règles de dessin

Elles comptent autant que les éléments.

1. **Un élément se décline, il ne se duplique pas.** Un voyant allumé n'est pas
   un deuxième tableau de bord, c'est le même avec une classe en plus. Pareil
   pour la nuit, la pluie, la boîte auto.
2. **La zone cliquable ne doit jamais recouvrir l'objet.** Le repère se pose
   dans un coin du cadre. Erreur commise deux fois, une par chacun de nous.
3. **Position en pourcentage**, jamais en pixels : l'élément doit tenir de 320
   à 520 px de large.
4. **Palette, la tienne** : `--night #100922`, `--n2 #1a1038`, `--n3 #281957`,
   `--a #8b6dff`, `--gold #f4c75e`, `--green #38d994`, `--red #ff766e`. L'or
   porte l'action, le violet porte le décor, rien d'autre ne brille.
5. **Aucun texte dans le dessin.** Les libellés sont posés par-dessus, sinon
   l'arabe et l'anglais sont impossibles.
6. **Le décor doit vivre un peu** : la route défile, une aiguille bouge, un
   reflet balaie la vitre. Trois animations lentes suffisent, au-delà ça fait
   sapin de Noël.
7. **Respecter `prefers-reduced-motion`.**

## Qui fait quoi

- **Codex** : les 24 éléments ci-dessus, dans la continuité de ses 12 scènes.
- **Claude** : la finition (matières, profondeur, lumière), la palette de nuit
  du moteur isométrique, le branchement dans le parcours, les volants.
- **Rayan** : valide chaque lot à l'écran avant le suivant.

## Deux points à ne pas casser

- Les missions **préparent**, elles ne certifient pas. Elles ne touchent ni
  `validations` ni `self_validations`.
- Les récompenses sont des **volants**. Pas un deuxième XP : celui de l'app est
  un calcul, pas une cagnotte.
