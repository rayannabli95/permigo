// Enseignant — Ligue moniteur RETIRÉE (pivot 17/07 : le moniteur observe ; la
// ligue était scorée par « 1 pt = 1 compétence validée », or la validation
// moniteur n'existe plus → plus aucun point, la ligue est morte).
//
// La route #/ligue-semaine reste déclarée dans router.js (hors couloir night
// run) → on garde ce fichier comme STUB qui renvoie vers le blason. La
// suppression de la route se fera dans le lot router.
export function mount() {
  location.hash = "#/mon-blason";
}
