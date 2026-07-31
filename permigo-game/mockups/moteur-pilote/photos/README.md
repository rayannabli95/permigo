# Les photos du Mode Pilote

## La règle

On **dessine** ce qui change d'état (tableau de bord, voyants, aiguilles,
pédales, levier) : ça se décline sans une image par variante.
On **photographie** ce qu'on regarde sans le transformer (la voiture, le pneu,
les feux, le compartiment moteur) : dessinée, une voiture fera toujours cheap.

Une photo peut quand même s'allumer : un halo en `position:absolute` avec
`mix-blend-mode:screen` posé sur les phares, plus un faisceau flouté.

## La voiture de référence

Toutes les photos doivent montrer **le même véhicule**. Il est enregistré comme
élément réutilisable chez Higgsfield :

- nom : `permigo-voiture`
- identifiant : `c5516205-55db-4c6c-ab4a-748690b005ba`
- fabriqué à partir des deux vues large déjà générées (avant et arrière)

**Comment s'en servir** : coller `<<<c5516205-55db-4c6c-ab4a-748690b005ba>>>`
dans le texte du prompt, à l'endroit où on parle de la voiture. Le service
remplace tout seul par la référence.

⚠️ Les modèles qui acceptent les références : `nano_banana_2`, `gpt_image_2`,
`seedream_v4_5`, `seedream_v5_lite`. **Pas** `nano_banana` (le modèle à
1 crédit utilisé pour les 4 premières images) : lui ne connaît pas les
références, chaque image donnerait une voiture différente.

## Où générer

L'illimité de l'abonnement Plus fonctionne **sur higgsfield.ai, pas depuis
l'assistant**. Toutes les lignes « unlimited » de l'offre précisent « available
on web ». Donc :

- **séries d'images → sur le site**, en illimité, gratuit ;
- depuis l'assistant → seulement du coup par coup, payé en crédits
  (1,5 crédit l'image avec référence).

Modèles à la fois **illimités** et **compatibles avec la référence** :
**Seedream 4.5**, Seedream 5.0 Lite, GPT Image.

## Ce qui existe

| Fichier | Sert à |
|---|---|
| `voiture-avant.png` | vue d'ensemble, feux avant |
| `voiture-arriere.png` | feux arrière, coffre |
| `pneu.png` | usure, pression |
| `moteur.png` | les quatre niveaux |

## Ce qui manque

À générer avec la référence, dès qu'il y a des crédits :

1. **profil** — `Photograph of <<<ELEMENT>>>, the same silver-grey compact
   European hatchback, seen exactly from the side, parked on clean empty
   asphalt. Neutral flat overcast daylight. Plain pale grey wall far behind,
   slightly out of focus. Entire car in frame with space around it. No text, no
   logos, blank unmarked plate. Sharp clean documentary product photography.`
2. **gros plan feu avant** — même formule, `tight close-up of the front left
   headlight unit, switched off`.
3. **gros plan feu arrière** — `tight close-up of the rear right tail light
   unit, switched off`.
4. **poste de conduite** — on en a déjà un dans `public/art/fiches/`
   (`geste-poste-conduite.webp`), inutile d'en générer un.

## Poser les zones cliquables

**Ne jamais placer une zone à l'estime.** Poser une grille 10×10 en SVG
(`preserveAspectRatio="none"`) par-dessus la photo, faire une capture, lire les
coordonnées, les écrire en pourcentage. Sur la première tentative du tour de
voiture, 3 zones sur 4 tombaient à côté de l'objet.

## L'étalonnage nuit

Les photos sont générées en **jour neutre**. C'est le CSS qui fait la nuit :

```css
.scene img{ filter: saturate(.38) contrast(1.12) brightness(.68); }
.scene::after{                     /* par-dessus, sans capter les clics */
  background:
    radial-gradient(120% 70% at 50% 0%, rgba(139,109,255,.34), transparent 60%),
    radial-gradient(150% 110% at 50% 105%, transparent 34%, rgba(12,7,26,.94));
}
```

⚠️ Ne pas ajouter de calque violet plat par-dessus : ça éclaircit les noirs et
toute l'image vire au mauve.
