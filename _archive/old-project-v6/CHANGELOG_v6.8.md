# CHANGELOG v6.7 → v6.8 "Bleu/Orange/Vert + auto-confirm + accueil clean"

**P0 + P1 + P2 appliqués** · 10/10 checks ✓ · 0 régression R1-R10

## 🎨 Nouveau code couleur planning (R5 mise à jour)

| Statut | Couleur | Détection |
|---|---|---|
| Leçon avec élève (à venir) | 🔵 **bleu plein, texte blanc** | `t='conf'` ou `lecon` non-passée |
| En attente confirmation élève | 🟢 **vert plein** | `t='pend'` (proposée par moniteur) |
| Effectuée ✓ | 🟠 **orange + ✓** | `endMin <= nowMin` (semaine actuelle) |
| Disponibilité moniteur | ⬜ **blanc avec + dashed bleu** | `t='dispo'` |
| Slot vide | transparent | non utilisé |
| RDV perso | violet pâle | inchangé |
| Annulation | rouge pâle | inchangé |

## 🚗 Picto boîte automatique/manuelle

Nouveau cercle gris foncé en haut-droite des cellules leçon :
- 🅰️ **A** = boîte automatique
- 🅼 **M** = boîte manuelle

Source : `ev.box` ou par défaut `MONS[i].box`. Le moniteur switch ses cours auto/manuels facilement.

## ⚡ Auto-confirm élève

L'élève qui réserve sur un slot **dispo** du moniteur → leçon **directement confirmée** (`t='conf'`), pas en attente. Toast moniteur en temps réel "Marco prévenu". Champ `autoConfirmed:true` pour traçabilité.

## 🐛 Bugs fixés

- Bug `+` planning : day-view passe `captureDayIdx`
- Livret : clic direct sur 🔴/🟠/🟢 active la compétence (1 clic au lieu de 2)
- Opacity .35 inactives retirée

## 🧹 Accueil moniteur allégé

- Retiré "Bonjour Marco 👋"
- Retiré doublon "X leçons aujourd'hui"
- Retiré bouton "🗺 Itinéraire" (point de RDV connu)
- Garde uniquement : date + "Xh prévues" + prochaine leçon

## 📊 Métriques

| | v6.7 | v6.8 |
|---|---|---|
| Lignes | 4 529 | 4 590 |
| Taille | 271 KB | 275 KB |
| Couleurs statuts | blanc/jaune/rouge | **bleu/vert/orange** |
| Clics livret/compétence | 2 | **1** |
| Clics réservation élève | 3 + attente | **2 directs** |
