# 🚧 CHANTIER — AVANT CONTACT CLIENTS

**Durée :** ~4-5h  
**Copie ce prompt entier dans Claude Code.**

---

## STATUS

App prête à pitcher mais **incomplet** sur moniteur + **Vercel bugué**.

---

## PRIORITÉ 1 : VERCEL DEPLOY FIX (15 min)

**Problème :** `DEPLOYMENT_NOT_FOUND` — deploy échoué ou URL mauvaise.

**À faire :**
1. Vérifier logs Vercel (https://vercel.com/dashboard)
2. Si build échoue → fix + redeploy
3. Si réussi → tester https://permigo-beryl.vercel.app/

**Suspect :** dist/ permissions ou chunk JS manquant.

---

## PRIORITÉ 2 : PAGES ÉLÈVE (VÉRIFIER) — 30 min

✅ **Ces pages EXISTENT et doivent marcher :**
- Login (`#/login`)
- Accueil élève (`#/accueil`)
- Parcours REMC (`#/parcours`)
- Validation quiz (`#/quiz`)
- Boutique élève (`#/boutique`)

**À tester :**
- [ ] Login → accueil fluide
- [ ] Clic "Parcours" → affiche 4 niveaux
- [ ] Clic niveau → fiche compétence + quiz
- [ ] Boutique → affiche skins (débloqués OK ?)
- [ ] Nav bottom (Accueil, Parcours, Boutique, Trophées, Profil) cliquable

**Si cassé :** DEBUG + FIX.

---

## PRIORITÉ 3 : PAGES MONITEUR ESSENTIELLES — 2h

✅ **Qui existe :**
- Accueil moniteur (`#/enseignant/`) — FAB "Séance" OK ?
- "Mes élèves" (`#/enseignant/eleves`)
- Log-session (`#/enseignant/log-session`) — validation flow
- Boutique moniteur (`#/enseignant/boutique`) — skins déblocables
- Insights (`#/enseignant/insights`) — stats
- Recompenses (`#/enseignant/recompenses`) — badges + gemmes

❌ **Qui manque (CRÉER si possible) :**
- `#/enseignant/parcours` — Parcours pro (4 niveaux, copier élève)
- `#/enseignant/trophees` — Achievements (copier élève, changer légende)

**À tester :**
- [ ] Nav bottom moniteur (5 tabs) : Aujourd'hui, Élèves, Parcours, Stats, Récompenses
- [ ] Clic "Séance" FAB → log-session s'ouvre (pas overlap)
- [ ] Validation flow fluide : élève (tri A→Z) → compétence (no zoom) → OK
- [ ] Boutique : 4 skins affichés (à adapter pour validations 50/100/150/300)
- [ ] Insights : KPI cards + chart + streaks
- [ ] Recompenses : gemmes + 4 badges

**Si pages manquent :** Créer les stubs au moins (vides mais routables).

---

## PRIORITÉ 4 : BUG FIX MAJEURS — 1.5h

```
1. BUG 1 : Musique d'accueil TRAP trop loud
   → src/utils/sound.js : autoplay OFF, volume 0.1
   
2. BUG 2 : FAB "Séance" superposé avec "+"
   → src/pages/enseignant/aujourdhui.js : supprimer ou repositionner bouton
   
3. BUG 3 : Élèves non triés + force swipe
   → src/pages/enseignant/log-session.js : .order('nom') + sélection directe
   
4. BUG 4 : Zoom chips compétence
   → CSS : touch-action: manipulation sur .comp-chip
   
5. BUG 5 : Tuto élève récurrent
   → game-state.js : flag localStorage permigo_eleve_onboarding_done
```

**SKIP pour maintenant :** Bug 6 (autres cachés), Boutique refactor validations.

---

## ORDRE EXÉCUTION

```
1. Vercel fix (15 min)
2. Test pages élève (30 min)
3. Test pages moniteur (45 min)
4. Fix bugs (1.5h) → priorité : musique, FAB, tri, zoom
5. Build + test (15 min)
6. Commit + push (10 min)
```

**TOTAL : ~4h**

---

## CHECKLIST AVANT PUSH

- [ ] Vercel deploy OK → URL live
- [ ] Login → accueil fluide (élève + moniteur)
- [ ] Élèves triés A→Z au log-session
- [ ] Clic élève = sélection directe (pas swipe)
- [ ] Compétence chip = pas de zoom
- [ ] Musique OFF par défaut
- [ ] FAB "Séance" sans overlap
- [ ] Tuto élève = une seule fois
- [ ] npm run build — 0 erreur
- [ ] Commit : `fix: pre-client-contact fixes — vercel, pages, bugs`
- [ ] Push → main

---

## CONTEXTE CLIENT

- **Pitch :** Livret REMC numérique + gamification + classement
- **Focus test :** Élève valide compétence → quiz → progression
- **Moniteur role :** Valide élèves, voit stats, se voit classé
- **Pas attendu (OK incomplet) :** Parcours moniteur, Trophées moniteur, Shop gemmes

---

## NOTES

- Si pages manquent : créer stubs vides (juste h1 + nav) → pas crasher
- Si Vercel toujours bugué : conseiller déployer sur autre (Netlify, etc.)
- Élèves DOIVENT pouvoir se valider (core flow)
- Moniteur DOIT pouvoir voir ses élèves + valider

---

**Go ! Envoie les premières retours. 🚀**
