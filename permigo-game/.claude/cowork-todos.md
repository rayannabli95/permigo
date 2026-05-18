# Cowork TODOs — Demandes de Claude Code

> Fichier géré par Claude Code pour signaler des modifications dans la ZONE INTERDITE.
> Cowork applique ces changements.

---

## [2026-05-18] Route insights enseignant ✅ TRAITÉ

**Fichier :** `src/router.js`  
**Demande :** Ajouter la route `'insights'` qui pointe vers `src/pages/enseignant/insights.js`

```js
// Dans le router, section routes enseignant :
'insights': () => import('./pages/enseignant/insights.js'),
```

Et dans la nav bar enseignant (si elle existe dans `src/components/` ou `src/main.js`) :
- Ajouter un lien "Insights" avec l'icon `chart-bar` ou `activity`
- Route : `#/insights`

**Contexte :** La page `insights.js` est complète et déployée. Elle ne sera accessible qu'une fois la route câblée.

---
