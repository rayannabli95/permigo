# Changelog v6.10 — Kill seed data (11 mai 2026)

## 🔴 BUG-01 — Données de démo supprimées

Avant : moniteur connecté voyait 12 faux élèves (Camélia Soumhi, Hiba Arrabii, Mohamed Bello…) et 5 faux moniteurs (Marco, Sarah, Aïcha…) qui n'existaient pas dans Supabase. Incohérent avec le Gérant qui voyait les 3 vrais.

Maintenant : démarrage à vide. Les fonctions `loadElevesFromDB()` / `loadMonsFromDB()` remplissent depuis la vraie base après login.

### Lignes modifiées (`autopilot.html`)

- **l. 2554** : `initEleves()` → `ELEVES = []` au lieu de `ELEVES_DEFAULT.map(...)`
- **l. 2571** : `initMons()` → `MONS = []` au lieu de `MONS_DEFAULT.map(...)`
- **l. 2718** : `EVENTS = []` (avant : seed avec Camélia 09h, Hiba 11h, Mohamed 14h)
- **l. 2720** : `ANNULATIONS = []`
- **l. 2721** : `NOTATIONS = []`

### Pour réactiver la démo (si Supabase down)

Remplace `ELEVES = [];` par `ELEVES = ELEVES_DEFAULT.map(o=>({...o}));` (idem MONS, EVENTS).
Les constantes `*_DEFAULT` sont conservées en mémoire.

## Synchro fichiers

`index.html` mis à jour avec le même contenu (GitHub Pages sert `/` = `index.html`).

## Toujours à faire

- **BUG-07** : migrer `events.mon_nom` (string) → `moniteur_id` UUID
- **BUG-08** : SMTP custom Supabase
- **REMC v4** : intégration du design timeline depuis le handoff Claude design
- Adapter `Mes élèves` côté moniteur pour aussi montrer seulement les élèves qui lui sont vraiment assignés (jointure via table `inscriptions`)
