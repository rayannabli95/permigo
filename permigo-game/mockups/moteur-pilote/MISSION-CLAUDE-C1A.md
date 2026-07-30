# Mission confiée à Claude — assembler le premier vrai jeu C1a

## Le mandat

Tu interviens comme **indépendant senior en pédagogie active et architecture de
systèmes de jeu**. Ton résultat ne doit pas être une belle démo isolée. Il doit
prouver qu’une personne peut assembler les 30 missions suivantes à partir de
données et de composants, sans recopier une scène.

Construis la mission pilote **C1a — Inspection 360** dans le prototype
`mockups/moteur-pilote/`.

Le résultat attendu est une session mobile complète qui apprend à l’élève à
observer une voiture avant de partir. Elle fonctionne en boîte manuelle et
automatique, utilise les lots graphiques 2 et 3 déjà validés et se termine par
« prêt·e à pratiquer ». Elle ne certifie rien.

Lis d’abord :

1. `CLAUDE.md`
2. `WORKFLOW.md`
3. `mockups/moteur-pilote/CARTOGRAPHIE-31.md`
4. `mockups/moteur-pilote/README.md`
5. `mockups/moteur-pilote/art-library/README.md`
6. `mockups/moteur-pilote/art-library/LOT2.md`
7. `mockups/moteur-pilote/art-library/LOT3.md`

## Résultat pédagogique

À la fin, l’élève doit pouvoir expliquer ces quatre décisions avant sa prochaine
leçon :

1. un voyant rouge persistant se traite avant de partir ;
2. un feu qui ne fonctionne pas se repère avant de rouler ;
3. un pneu au témoin d’usure ne se considère pas comme sûr ;
4. un niveau anormal sous le capot se signale avant le départ.

La mission prépare le contrôle réel. Elle ne remplace ni la pratique avec
l’enseignant, ni le quiz de certification, ni la consolidation.

## Parcours exact à construire

### Brief

- **Titre :** Inspection 360
- **Accroche :** « La voiture t’attend. Quatre détails décident si elle peut
  partir. »
- **CTA :** « Commencer le contrôle »
- **Durée indicative :** 2 à 3 minutes, sans compte à rebours.

### Temps 1 — Le tableau parle

- Mécanique : `diagnostic`.
- Objet :
  `renderDashboardElement("instrument-cluster", { warning: "oil", lit: true,
  speed: 0, rpm: 0, state: "active" })`.
- Consigne : « Ce voyant rouge reste allumé après le contact. Que fais-tu ? »
- Choix :
  - `drive` — « Je pars doucement et je surveille »
  - `hide` — « Je coupe l’affichage »
  - `stop` — « Je ne pars pas et je le signale »
- Solution : `stop`.
- Retour à consolider : « Le voyant reste une alerte même si la voiture semble
  rouler normalement. »
- Pourquoi : « Une alerte d’huile persistante peut annoncer un défaut qui
  endommage le moteur et compromet le trajet. »

### Temps 2 — Le feu muet

- Mécanique : `spot`.
- Objets : deux instances de `headlight-front`, l’une avec `lit: true`, l’autre
  avec `lit: false`.
- Consigne : « Les feux sont commandés. Lequel dois-tu signaler ? »
- Réponses : deux boutons HTML « gauche » et « droit » placés dans la bande
  inférieure du cadre. Ils ne recouvrent pas les optiques.
- Solution : l’identifiant de l’optique éteinte.
- Retour à consolider : « Compare l’émission de lumière, pas la forme du bloc. »
- Pourquoi : « Le contrôle à l’arrêt évite de découvrir trop tard que tu vois
  moins bien ou que les autres te voient mal. »

### Temps 3 — Le contact avec la route

- Mécanique : `spot` puis `diagnostic`.
- Objets :
  - `renderVehicleElement("tyre-wear", { wear: 20, state: "idle" })`
  - `renderVehicleElement("tyre-wear", { wear: 88, state: "active" })`
- Consigne : « Lequel ne doit pas être considéré comme prêt à rouler ? »
- Réponses : boutons HTML « pneu A » et « pneu B » hors des dessins.
- Solution : le pneu au témoin d’usure.
- Retour à consolider : « Regarde la profondeur des rainures et le témoin, pas
  seulement la propreté du pneu. »
- Pourquoi : « Un pneu usé évacue moins bien l’eau et réduit l’adhérence. »

### Temps 4 — Sous le capot

- Mécanique : `diagnostic`.
- Objet :
  `renderVehicleElement("hood-levels", { fluid: "brake", level: 18,
  state: "active" })`.
- Consigne : « Le liquide de frein est anormalement bas. Quelle décision
  prends-tu ? »
- Choix :
  - `top-up-drive` — « Je complète au hasard et je pars »
  - `ignore` — « Le freinage ne dépend pas de ce niveau »
  - `signal` — « Je ne pars pas sans contrôle adapté »
- Solution : `signal`.
- Retour à consolider : « Un niveau bas est un symptôme à comprendre, pas à
  masquer. »
- Pourquoi : « Le circuit de freinage est un organe de sécurité. Une anomalie
  se traite avant de rouler. »

### Sortie

- Titre : « Ton contrôle a du sens »
- Récapitulatif : voyant → feux → pneus → niveaux.
- Texte : « Tu es prêt·e à pratiquer ce tour de contrôle en leçon. »
- Transfert : « À l’arrêt, montre ces quatre contrôles à ton enseignant et
  explique ce qui te ferait ne pas partir. »
- CTA principal : « Revenir aux missions »
- CTA secondaire : « Rejouer sans indice »

Ne pas afficher « C1a validée », « compétence maîtrisée », une note publique ou
une récompense liée à la rapidité.

## Architecture demandée

Créer une petite couche d’assemblage indépendante des dessins :

```text
mockups/moteur-pilote/assembly/
  mission-schema.js
  mission-resolver.js
  scene-assembler.js
  missions/
    c1a-inspection-360.js
  README.md

mockups/moteur-pilote/assembly-lab/
  c1a.html
  c1a-demo.js
  validate-c1a.mjs
```

### Responsabilité des fichiers

- `mission-schema.js` valide les champs, les modes, les réponses et les
  solutions. Une erreur de contenu échoue avec un message lisible.
- `mission-resolver.js` reçoit une mission et une transmission. Il fusionne la
  base avec la surcharge de boîte sans modifier la donnée source.
- `scene-assembler.js` rend n’importe quel temps de jeu à partir du schéma. Il
  connaît les familles de composants, pas l’identifiant `c1a`.
- `c1a-inspection-360.js` ne contient que les données et les appels déclaratifs
  aux éléments.
- `c1a.html` démontre le parcours complet à 390 px et permet de basculer
  manuelle/automatique.
- `validate-c1a.mjs` apporte les preuves automatiques.

Le moteur existant peut être étendu ou adapté, mais le rendu final ne doit
contenir aucun `if (mission.id === "c1a-inspection-360")`.

## Forme minimale de la donnée

```js
export const C1A_INSPECTION_360 = {
  id: "c1a-inspection-360",
  competence: "C1a",
  phase: "preparation",
  transmissions: ["manual", "automatic"],
  estimatedMinutes: 3,
  certification: false,
  title: "Inspection 360",
  objective:
    "Décider si la voiture peut partir après quatre contrôles de sécurité.",
  beats: [
    {
      id: "dashboard-alert",
      mode: "diagnostic",
      scene: "cockpit",
      assets: [
        {
          family: "dashboard",
          type: "instrument-cluster",
          anchor: { x: 50, y: 48, scale: 1 },
          options: {
            warning: "oil",
            lit: true,
            speed: 0,
            rpm: 0,
            state: "active",
          },
        },
      ],
      // prompt, choices, solution, hint, retry, success, why
    },
    // headlight-check, tyre-check, hood-check
  ],
  outcome: {
    claim: "ready-to-practice",
    transfer:
      "À l’arrêt, montre ces quatre contrôles à ton enseignant.",
  },
};
```

Toutes les coordonnées d’assemblage sont en pourcentage. `scale` est un rapport
sur `ART_SCALE`, pas une largeur choisie en pixels.

## Exigences de système

- Importer les fonctions publiques des lots. Ne copier aucun SVG ni recette de
  matière dans l’assembleur.
- Piloter `idle`, `active`, `found` et `error` par les options des composants.
- Conserver les textes hors des SVG et prévoir `dir="auto"`.
- Faire apparaître le « pourquoi » avant la sortie de chaque temps.
- Donner l’indice à la demande et automatiquement après deux hésitations.
- Ne retirer ni points ni progression après une réponse à consolider.
- Ne créer ni minuterie, ni combo, ni classement, ni récompense de vitesse.
- Limiter la scène à trois animations lentes et respecter
  `prefers-reduced-motion`.
- Garder les cibles à 44 px minimum et la navigation clavier complète.
- Ne modifier ni `src/`, ni Supabase, ni le routeur.
- Ne démarrer ni le lot 4 ni le lot 5.

## Preuves obligatoires

Le travail est fini uniquement si :

1. la même mission se résout pour `manual` et `automatic` sans duplication ;
2. les quatre temps se jouent jusqu’à la sortie, avec réussite et nouvel essai ;
3. l’indice apparaît après deux réponses à consolider ;
4. tous les types d’assets, réponses et identifiants de solution sont validés ;
5. aucune cible ne recouvre son objet ;
6. les largeurs 320, 390 et 520 n’ont aucun débordement ;
7. le clavier, les noms accessibles et le mouvement réduit sont contrôlés ;
8. la console reste vide ;
9. une capture 390 px réunit les quatre temps et la sortie ;
10. `npm run build` est vert.

## Périmètre hors mission

- pas d’intégration en production ;
- pas de base de données, d’analytics réelles ni de route ;
- pas de certification ou de modification de la Triple Validation ;
- pas de nouveau dessin ;
- pas d’assemblage des 30 autres missions ;
- pas de merge, migration ou déploiement sans GO nommé de Rayan.

## Rapport attendu

Terminer avec :

```text
CHANTIER / BRANCHE / FAIT / RESTE / FICHIERS TOUCHÉS /
MIGRATIONS / BLOQUEURS-RISQUES / DÉLÉGABLE
```

Dans `RESTE`, indiquer explicitement : audit visuel par Rayan, audit
pédagogique du pilote, puis seulement réplication de la grammaire sur la vague A.
