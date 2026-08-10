# 🌙 Night run — nuit du 10 au 11/08/2026

**Départ : 03 h 30.** Rayan dort. Consigne : « jv dormir gere seul ».

## État initial

- Branche `fix/epuration-app-eleve`, à jour avec `origin`, dernier commit `6f136a4`.
- La direction artistique vient d'être décidée et documentée (`72e14e4`), et les
  phases 0 et 1 du plan sont livrées (`6f136a4`) : palette, textures, recette
  « seize heures », route, capot Cupra, lint de teinte.
- Rayan a vu la première image et est allé dormir sans la valider ni la rejeter.

## Décision de cadrage (prise seul)

`.claude/NIGHT_RUN.md` décrit un programme écrit pour l'état du projet en
juillet : accueil élève, parcours, trophées, onboarding. Ces chantiers sont
périmés. J'applique donc **l'esprit** du protocole (autonomie, commits
incrémentaux, log, rapport au réveil) sur **la priorité réelle du moment** :
exécuter `docs/PERMIGO_DA_IMPLEMENTATION_PLAN.md`, qui a été écrit hier soir
exactement pour être exécuté sans supervision.

Ordre choisi, par impact visuel décroissant plutôt que par numéro (le plan
autorise explicitement de permuter les phases 2 à 5) :

1. **Phase 2 — les véhicules.** C'est le pire élément à l'écran aujourd'hui :
   des caisses à roues sans habitacle. Plus gros gain.
2. **Phase 4 — les personnages.** Notre gameplay est la lecture d'intentions,
   donc les corps qui les portent comptent autant que les voitures.
3. **Phase 3 — l'architecture.** Déjà correcte depuis la phase 1 (façades
   texturées) : il reste la grammaire modulaire.
4. **Phase 5 — végétation et mobilier urbain.**
5. QA, lints, rapport.

## Journal

- 03 h 30 — log créé, plan de nuit arrêté. Début phase 2.
- 04 h 10 — **Phase 2 livrée.** `src/game/da/vehicules.js`. Décision technique :
  une voiture est un PROFIL EXTRUDÉ avec biseau, pas un empilement de boîtes.
  Le biseau donne les arêtes cassées gratuitement, et changer de gabarit ne
  coûte que six nombres — donc un agent peut étendre la flotte sans modéliser.
  Cinq silhouettes : citadine, berline, SUV, utilitaire, bus.
  Deux corrections après rendu : les neutres partaient au blanc sous le soleil
  de seize heures (assombris d'environ 15 %), et un figurant doit être MAT
  (rugosité 0,55, reflet 0,5) pendant qu'un porteur de scène est laqué.
- 05 h 00 — **Phase 4 livrée.** `src/game/da/personnages.js`. Le parti pris :
  on ne modélise pas un humain, on grossit l'organe que le joueur doit LIRE.
  Tête à 20 % de la taille (26 % chez l'enfant), chevelure qui couvre
  l'arrière du crâne — sans elle une sphère tourne sans qu'on le voie, et
  « il a regardé derrière lui » devient invisible. Devant de torse plus clair
  pour distinguer un dos d'une face. Buste séparé du bassin, donc la tête
  tourne pendant que le corps continue tout droit.
  Le cycliste est reconstruit (vélo + quille) : c'est la meilleure leçon du
  jeu et elle était portée par un modèle qu'on ne pouvait tourner qu'entier.
  ⭐ La marche est pilotée par le DÉPLACEMENT MESURÉ de l'acteur, pas par un
  drapeau : un piéton ne peut donc plus glisser, et le rembobinage reste juste.
  Deux corrections après rendu : l'enfant à 1,15 m violait la loi de
  lisibilité (porté à 1,28 m), et le copain d'en face était caché derrière la
  file de stationnement opposée (les trous protègent désormais les DEUX côtés).
