# La couche d'assemblage

Une mission Mode Pilote n'est pas une page dessinée à la main. C'est une
**donnée** que trois modules transforment en session jouable. Aucun d'eux ne
connaît de mission en particulier : c'est ce qui permet d'écrire les trente
suivantes sans retoucher le rendu.

```text
missions/<id>.js      la donnée seule       « ce que l'élève doit décider »
mission-schema.js     le contrat            « cette donnée est-elle jouable ? »
mission-resolver.js   la boîte de vitesses  « la même mission en BVA »
scene-assembler.js    le rendu              « pose les objets et les réponses »
```

Le déroulé (quel écran, quand l'indice, quand on avance) vit dans
`../assembly-lab/c1a-demo.js`. Il ne contient aucun `if (mission.id === …)`.

## Écrire une mission

```js
export const MA_MISSION = {
  id: "c1d-depart",
  competence: "C1d",
  phase: "preparation",       // toujours : une mission prépare
  certification: false,       // toujours : elle ne certifie rien
  transmissions: ["manual", "automatic"],
  estimatedMinutes: 3,

  title: "…", hook: "…", cta: "…", objective: "…",

  beats: [ /* 2 à 4 temps de jeu */ ],

  outcome: {
    claim: "ready-to-practice",
    title: "…",
    recap: [ /* une ligne par temps */ ],
    body: "…",
    transfer: "…",            // ce qu'il fera dans la vraie voiture
  },
};
```

Un temps de jeu :

```js
{
  id: "headlight-check",
  mode: "spot",               // spot decision sequence trajectory diagnostic dosage
  scene: "exterieur-avant",
  assets: [{
    family: "vehicle",        // driving (lot 1) · dashboard (lot 2) · vehicle (lot 3)
    type: "headlight-front",
    id: "phare-droit",        // requis si deux objets partagent le même type
    anchor: { x: 73, y: 50, scale: 0.9 },   // en POURCENTAGE, jamais en pixels
    options: { lit: false, state: "idle" }, // options du composant, rien d'autre
  }],
  prompt: "…",
  answers: {
    kind: "target",           // "target" désigne un objet · "choice" une phrase
    options: [{ id: "phare-droit", label: "Celui de droite" }],
  },
  solution: "phare-droit",
  hint: "…",                  // recentre l'attention, ne donne pas la réponse
  retry: "…",                 // dit OÙ regarder, jamais « faux »
  success: "…",
  why: "…",                   // le pourquoi passe avant les points
}
```

## Ce que le contrat refuse

Le schéma échoue avec un message lisible, à l'écriture et pas à l'écran :

- un mot qui promet une certification (« validée », « maîtrisée », « acquis ») ;
- `phase` autre que `preparation`, `certification` autre que `false` ;
- moins de deux ou plus de quatre temps de jeu ;
- une solution qui ne fait partie d'aucune réponse ;
- une réponse `target` qui désigne un objet absent de la scène ;
- deux objets ou deux réponses avec le même identifiant ;
- un ancrage hors de 0–100 ;
- un rappel de sortie qui ne compte pas une ligne par temps.

## La boîte de vitesses

Une mission n'est **jamais dupliquée** pour changer un pédalier ou une phrase.
Elle porte une base commune, plus une surcharge optionnelle :

```js
variants: {
  automatic: {
    beats: [{ id: "dashboard-alert", prompt: "Sélecteur sur P, contact mis : …" }],
  },
}
```

`resolveMission(mission, "automatic")` fusionne en profondeur sans toucher à la
source, et refuse une surcharge qui viserait un temps de jeu inexistant. Les
tableaux sont remplacés, jamais concaténés.

C1a ne porte aucune surcharge, et c'est volontaire : un tour de contrôle à
l'arrêt est identique dans les deux boîtes. Le mécanisme est prouvé sur une
mission d'essai dans `validate-c1a.mjs` — c'est lui qui portera C1d et C1f, où
les gestes diffèrent vraiment.

## Deux règles qui ne se voient pas dans le code

- **La réponse ne recouvre jamais l'objet.** Les boutons vivent sous le cadre,
  et un contrôle automatique compare les rectangles à chaque temps de jeu.
- **La proportion d'un objet est une connaissance de bibliothèque**, pas de
  mission : `scene-assembler.js` sait qu'un bloc compteurs est large. La donnée
  n'a donc pas à le dire, mais peut le corriger avec `anchor.ratio`.

## Contrôler

Depuis `permigo-game/`, avec un serveur statique sur le port 4181 :

```bash
PILOTE_C1A_CAPTURE=/tmp/c1a.png \
  node mockups/moteur-pilote/assembly-lab/validate-c1a.mjs
```

Le contrôle vérifie la donnée, les deux boîtes, les quatre temps jusqu'à la
sortie, le nouvel essai, l'indice à la demande et après deux hésitations, le
non-recouvrement, les cibles de 44 px, les largeurs 320/390/520, le clavier, le
mouvement réduit, l'accessibilité et la console. Il produit une planche unique
avec les quatre temps et la sortie.
