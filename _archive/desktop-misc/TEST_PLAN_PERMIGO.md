# 🧪 PLAN DE TEST PERMIGO - Série Complète

**Date:** 10 mai 2026  
**Status:** En cours  
**Version App:** v6 (GitHub Pages)

---

## 📋 CHECKLIST - Comptes & Connexions

### Compte 1: ÉLÈVE - Elyne Semaan
- **Email:** elyne.semaan@autopilot.fr
- **Mdp:** Autopilot2025!
- **Attendu:** État = "nouveau", 0h, pas d'événements
- **Test Login:** [ ] Réussi / [ ] Échoué
- **Erreur:** _________________
- **Notes:** 

---

### Compte 2: ÉLÈVE - Sherine Nabli
- **Email:** sherine.nabli@autopilot.fr
- **Mdp:** Autopilot2025!
- **Attendu:** 7h, 35% présence, 1 absence, état = "nouveau"
- **Test Login:** [ ] Réussi / [ ] Échoué
- **Notes:**

**À vérifier après login:**
- [ ] Affiche 7 heures (4 leçons)
- [ ] Affiche 35% de présence
- [ ] Affiche 1 absence
- [ ] État = "nouveau"

---

### Compte 3: ÉLÈVE - Latifa Sahli
- **Email:** latifa.sahli@autopilot.fr
- **Mdp:** Autopilot2025!
- **Attendu:** 22h, 110% présence, état = "prêt_examen" ✅
- **Test Login:** [ ] Réussi / [ ] Échoué
- **Notes:**

**À vérifier après login:**
- [ ] Affiche 22 heures (11 leçons)
- [ ] Affiche 110% de présence
- [ ] État = "prêt_examen" (badge vert?)
- [ ] Message "Prêt pour l'examen" visible?

---

### Compte 4: MONITEUR - Rayan Nabli
- **Email:** rayan.nabli@autopilot.fr
- **Mdp:** Autopilot2025!
- **Attendu:** Voir ses élèves (Elyne + Sherine)
- **Test Login:** [ ] Réussi / [ ] Échoué
- **Notes:**

**À vérifier après login:**
- [ ] Voit "Mes élèves" menu
- [ ] Elyne Semaan dans la liste
- [ ] Sherine Nabli dans la liste
- [ ] Peut voir leurs stats respectives

---

### Compte 5: MONITEUR - Lassaad Sahli
- **Email:** lassaad.sahli@autopilot.fr
- **Mdp:** Autopilot2025!
- **Attendu:** Voir Latifa Sahli
- **Test Login:** [ ] Réussi / [ ] Échoué
- **Notes:**

**À vérifier après login:**
- [ ] Voit "Mes élèves" menu
- [ ] Latifa Sahli dans la liste
- [ ] Voit ses 22h et 110% présence

---

### Compte 6: ADMIN - PermiGo Admin
- **Email:** rayannabli27@gmail.com
- **Mdp:** (ton mot de passe)
- **Attendu:** Accès complet, gestion de tous les utilisateurs
- **Test Login:** [ ] Réussi / [ ] Échoué
- **Notes:**

---

## 📱 TEST RESPONSIVE (Mobile)

**À faire pour chaque compte:**

1. **Ouvre l'app:** https://rayannabli95.github.io/Autopilot/
2. **Redimensionne à 375px** (Cmd+Opt+I → Toggle device toolbar)
3. **Login avec le compte**
4. **Vérifications:**
   - [ ] Menu s'affiche correctement (vertical ou hamburger?)
   - [ ] Tous les éléments visibles sans scroll horizontal
   - [ ] Boutons cliquables
   - [ ] Texte lisible
   - [ ] Stats affichent correctement

---

## 🐛 Erreurs à Noter

**Si erreur 400 (Auth échoue):**
- [ ] Message exact: _________________
- [ ] Console error (Cmd+Opt+J): _________________

**Si erreur "Profil introuvable":**
- [ ] Compte créé dans Supabase? CHECK: https://app.supabase.com
- [ ] Email exact correspond?

**Autres bugs:**
- [ ] Décris l'erreur: _________________
- [ ] Étapes pour reproduire: _________________

---

## ✅ RÉSUMÉ FINAL

**Tests réussis:** __ / 6 comptes  
**Tests échoués:** __ / 6 comptes  
**Bugs trouvés:** __ 

**Prochaines étapes:**
- [ ] Tous les logins fonctionnent
- [ ] Tous les stats s'affichent correctement
- [ ] Responsive mobile OK
- [ ] Prêt pour déploiement prod

---

## 📊 DONNÉES ATTENDUES (Référence)

```
ÉLÈVES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nom              | Heures | Présence | État
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Elyne Semaan     | 0h     | N/A      | nouveau
Sherine Nabli    | 7h     | 35%      | nouveau
Latifa Sahli     | 22h    | 110%     | prêt_examen ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MONITEURS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nom              | Élèves assignés
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rayan Nabli      | Elyne, Sherine
Lassaad Sahli    | Latifa
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Finis tes tests et partage les résultats!** 🎯
