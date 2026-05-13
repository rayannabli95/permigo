# 🚀 Plan prochaine session — PermiGo v7

> Préparé le 13 mai 2026 — à lire en rentrant de la salle.

---

## 🎯 Objectif session

**Boucler la boucle commerciale** : un visiteur landing → devient lead → l'app est en prod accessible publiquement.

Sans ces 2 morceaux, l'app reste un beau prototype local. Avec, tu peux la montrer à un vrai gérant demain.

---

## 📋 Ordre d'exécution (3h max)

### 1️⃣ SLICE 7.1 — Form inscription auto-école *(45 min)*

**Pourquoi en premier** : c'est la pièce qui manque pour convertir la landing (déjà shippée) en machine à leads.

**Scope :**
- Nouvelle page `src/pages/public/inscription.js`
- Form : nom auto-école, ville, nb moniteurs, email, téléphone
- Insert dans nouvelle table Supabase `leads` (status: `nouveau` / `contacté` / `converti`)
- Notif admin (Rayan) à chaque nouveau lead
- Page de confirmation "Merci, on te recontacte sous 24h"
- Brancher TOUS les CTAs de la landing dessus (actuellement toast placeholder)

**Migration Supabase :**
```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  ecole_nom text not null,
  ville text,
  nb_moniteurs int,
  email text not null,
  telephone text,
  status text default 'nouveau',
  created_at timestamptz default now()
);
```

**Bonus** : section "Mes Leads" côté admin dashboard (juste une liste simple).

---

### 2️⃣ SLICE 8 — Déploiement prod *(1h)*

**Pourquoi maintenant** : tant que c'est en `localhost:5173`, ça n'existe pas pour le monde.

**Plan :**
1. `npm run build` → vérifier qu'aucune erreur Vite
2. Push sur GitHub (nouveau repo `permigo-v7` ou branche)
3. **Vercel** (recommandé > Netlify pour Vite) :
   - Connect GitHub repo
   - Framework preset : Vite
   - Env vars : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Deploy auto à chaque push main
4. Domaine custom : `permigo.fr` (ou `app.permigo.fr`)
5. Supprimer l'ancien GitHub Pages v6 (https://rayannabli95.github.io/Autopilot/)
6. Mettre à jour `README.md` avec lien prod

**Pièges à anticiper :**
- Le hash router doit bien gérer le `404 fallback` sur Vercel (ajouter `vercel.json` avec rewrite vers `/index.html`)
- Vérifier les CORS Supabase pour le nouveau domaine

---

### 3️⃣ SLICE 9c — Examen blanc + Taux de réussite *(1h, si temps)*

**Pourquoi** : c'est LE KPI commercial #1. Un gérant qui voit "78% de réussite" sur ton dashboard → il sort la carte bleue.

**Scope :**
- Nouvelle table `examens` (eleve_id, date, type=`code/conduite/blanc`, resultat=`reussi/echec/en_attente`, note)
- Page admin "Examens" : liste + bouton "Programmer un examen"
- Côté élève : carte "Mon prochain examen" sur dashboard avec compte à rebours
- Côté moniteur : voir les examens de ses élèves
- **KPI dashboard admin** : taux de réussite calculé sur les 12 derniers mois (avec comparaison vs moyenne nationale ~60%)

---

## 🧠 Réflexions stratégiques (à digérer pendant la salle)

### Ce qui manque vraiment pour un MVP commercial
1. ✅ Le produit est solide techniquement
2. ❌ Aucune URL publique = invendable
3. ❌ Pas de form lead = pas de pipeline
4. ❌ Pas de taux de réussite = pas d'argument chiffré
5. ❌ Pas de stripe = pas de paiement (mais ça vient après les 3 premiers clients)

### Ce qu'on N'a PAS besoin de faire maintenant
- Dark mode (cosmétique)
- Tests unitaires (premature optimization)
- Backend Hono (Supabase suffit jusqu'à 100 clients)
- Realtime (polling marche)
- Accessibilité WCAG (v2)

### La vraie question pour la suite
**Qui est ton premier client cible ?**
- Une auto-école que tu connais → tu peux lui faire la démo en direct
- Si oui, focus sur ce qui le fera dire OUI :
  - Importer ses élèves (CSV) → 30 min
  - Lui faire essayer le planning sur SES vraies données
  - Lui montrer le dashboard avec SES KPIs

→ **Si tu as un prospect identifié, on shift le plan vers "Onboarding express auto-école pilote"** au lieu de 7.1/8/9c.

---

## ⚡ Quick wins si t'es fatigué après la salle (15-20 min chacun)

Si t'as pas l'énergie pour une slice complète, tu peux faire :

- **Favicon + meta tags SEO** (manque actuellement, fait peu sérieux)
- **OG image** pour le partage WhatsApp/LinkedIn de la landing
- **Page 404 custom** (actuellement la nav casse silencieusement)
- **Loader global** quand on change de route (transition cleaner)
- **Animation confettis** quand un élève valide une sous-compétence (dopamine)

---

## 🎬 Commande de démarrage de session

> "Reprends le projet PermiGo v7. Lis `PLAN_PROCHAINE_SESSION.md` puis attaque la slice 7.1 (form inscription auto-école)."

---

**Bonne séance bro 💪 Push fort, code après.**
