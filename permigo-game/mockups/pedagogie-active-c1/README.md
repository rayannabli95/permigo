# Laboratoire pédagogique C1a

Prototype local de quatre méthodes actives appliquées au même objectif :
**C1a — Prendre en main le poste de conduite**.

## Ouvrir

Depuis le `permigo-game/` du worktree :

```bash
python3 -m http.server 4175 --bind 127.0.0.1
```

Puis ouvrir :

```text
http://127.0.0.1:4175/mockups/pedagogie-active-c1/
```

Dans un checkout normal du projet avec les dépendances installées,
`npm run dev` fonctionne aussi ; l’URL utilise alors le port `5173`.

Les liens directs sont :

- `#cockpit` — rappel actif dans un cockpit interactif ;
- `#mission` — transfert dans une vraie voiture stationnée ;
- `#erreur` — diagnostic puis réparation d’une erreur ;
- `#sequence` — démonstration puis retrait progressif des aides.

## Protocole de test conseillé

Faire tester une seule variante par élève, sans expliquer le principe :

1. observer s’il agit immédiatement ou cherche du texte à lire ;
2. lui demander de restituer un repère sans téléphone cinq minutes après ;
3. après la prochaine leçon, demander quel geste lui est revenu en situation ;
4. noter sa préférence seulement après ces mesures.

La préférence visuelle ne suffit pas : la bonne piste est celle qui transfère
le mieux dans la voiture.
