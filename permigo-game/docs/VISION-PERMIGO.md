# PermiGo — Dossier stratégique « toute l'entreprise »
*Rédigé en mode war-room : chaque département de la boîte donne son verdict, puis on synthétise une vision et un scénario d'avenir. Date : 2026-06-15.*

---

## 0. Statut Stripe (factuel)
- **Fait** : code complet (PR #192) — Checkout + webhook + table `subscriptions` + RLS + UI Réglages + service `billing.js`. Bug `current_period_end` (API Stripe 2025) corrigé. Produit Stripe créé : `price_1TigYlHdSCNAySUyVsatMJXa` (9,99 €/mois, test).
- **Bloqué pour moi** (garde-fou « jamais la prod directement ») : appliquer la migration + déployer les 2 functions.
- **Forcément toi** (ta clé `sk_test_` ne doit pas passer par moi) : poser les secrets + créer le webhook.
- **Rien n'est cassé** : `main` est intact, PR #192 non mergée. Quand tu reviens : 4 actions de ~5 min et c'est live (détail dans `STRIPE-SETUP.md`).

---

## 1. Le marché (chiffres réels)
- **~12 500 auto-écoles** en France, **80 % indépendantes** (souvent 1–3 moniteurs).
- **~1,8 Md€** de CA secteur, **~1 M candidats/an**, ~180 k€ de CA moyen/école.
- **Pénurie chronique de moniteurs** + **numérisation obligatoire qui avance** = vent dans le dos pour un outil qui fait gagner du temps et fidélise.
- Abaissement de l'âge du permis (17 ans) → afflux de jeunes candidats, nés mobile.

**TAM / SAM / SOM**
- **TAM** : ~1,8 Md€ (toute la dépense permis) — pas notre cible directe.
- **SAM (logiciel)** : la couche outil/SaaS du secteur. Si 12 500 écoles dépensent ~50 €/mois en logiciel pédagogique → ~7,5 M€/an, hors candidats libres + moniteurs indés.
- **SOM 36 mois (réaliste)** : 1 000–3 000 moniteurs/écoles payants → **120 k€–600 k€ ARR**.

---

## 2. War room — le verdict de chaque département

### 🛠 Engineering
- **État** : 46 909 lignes (vanilla JS + Vite + Supabase + Vercel), 46 tables, RLS partout, PWA installable + push, 4 edge functions. Architecture **adaptée au stade** : pas de sur-ingénierie, déploiement instantané, coût marginal ~0.
- **Forces** : simplicité radicale (pas de framework lourd), sécurité sérieuse (RLS, secrets backend), edge functions Deno propres.
- **Dette** : pas de tests automatisés au-delà d'a11y Playwright ; vanilla JS sans types (vélocité OK aujourd'hui, friction à 5+ devs) ; logique métier dans de gros fichiers pages (mes-eleves 1,5k lignes).
- **Scalabilité** : Supabase/Vercel tiennent largement des dizaines de milliers d'utilisateurs sans rearchi. Le mur n'est pas technique, il est **go-to-market**.
- **Verdict** : **A−**. Solide pour le stade. Ne pas réécrire en React « par principe » : ce serait brûler du temps que le marché récompense ailleurs.

### 📦 Product
- **Cœur livré** : livret REMC numérique + validation moniteur + suivi élève + analyses + boucle quotidienne élève (quiz/streak/push) + install A2HS musclé.
- **Trou n°1** : la **réputation/ligue moniteur sonne creux** (1 moniteur = « 1ᵉ sur 1 »). Promesse différenciante encore vaporeuse.
- **Tension** : moniteur = pro (Linear/Notion) **vs** mécaniques de jeu (paliers Duolingo, trophées). À trancher.
- **Verdict** : **B+**. Le produit *fait le job pédagogique*. Il lui manque une raison de revenir qui ne dépende pas que de l'élève.

### 🎨 Design / UX
- Craft **au-dessus** des concurrents (incumbents = écrans austères des années 2010).
- Côté élève = excellent (de l'aveu du fondateur). Côté moniteur = beau mais parfois surchargé (« Aujourd'hui » empile trop), et l'identité jeu/pro n'est pas tranchée.
- **Verdict** : **A− élève / B moniteur**.

### 📊 Data / Analytics
- Tracking présent (events). Mais la **North Star n'est pas câblée en dashboard** : il faut piloter **activation** (1ʳᵉ valeur < 24 h) et **rétention J7/J30**.
- Métrique reine proposée : **% d'élèves actifs ≥ 4 j/semaine** (l'habitude = le produit). Côté moniteur : **% revenant valider chaque semaine**.
- **Verdict** : **C+** — instrumenté mais pas encore *piloté*. Priorité post-revenus.

### 🔒 Security / RGPD
- RLS sur 46 tables, secrets backend, advisors quasi clos, **règle d'or respectée** : zéro donnée bancaire/NEPH/perso élève (l'auto-école garde ses données).
- Stripe : clé secrète backend only, webhook signé, table abonnement non-écrivable par le client. **Propre.**
- **Verdict** : **A**. C'est un *atout commercial* face aux écoles (RGPD = peur n°1 des patrons).

### ✅ QA
- Build vert constant cette session ; e2e a11y présent. Manque : tests de flux critiques (paiement, validation, install). Risque acceptable au stade, à muscler dès qu'il y a des € en jeu.
- **Verdict** : **B−**.

### 🚀 Growth / Marketing
- **Levier validé cette nuit** : l'install écran d'accueil (rescue webview Insta/WhatsApp/Le Bon Coin + moments de valeur). C'est *le* maillon qui rend l'acquisition par liens partagés viable.
- **GTM béta** : 9,99 €/mois, moniteurs indés via Le Bon Coin / groupes FB. Cycle court, willingness-to-pay testable en 2 semaines.
- **Boucle virale latente** : chaque moniteur invite ses élèves → élèves voient un outil pro → bouche-à-oreille moniteur↔moniteur.
- **Verdict** : **B+** côté produit-d'acquisition, **C** côté exécution (rien lancé encore — c'est l'urgence).

### 💼 Sales / BD
- Deux marchés : **indé self-serve** (rapide, faible ticket) **vs** **per-seat école** (gros contrat, cycle long, le patron décide).
- Séquence gagnante : **indés d'abord** (preuve + témoignages réels) → **puis écoles** (« vos moniteurs l'utilisent déjà »).
- **Verdict** : **B**. La bonne séquence est identifiée ; reste à signer les 10 premiers.

### 💰 Finance (modèle réel)
- Prix : **9,99 €/mois**. Frais Stripe (carte EU, self-managed, sans le +3,5 %) : ~**0,40 €** → **net ~9,59 €**.
- Coût infra/user : **~0 €** (Supabase Pro 25 $/mois couvre des milliers d'users ; Vercel idem) → **marge brute ~95 %**.
- **LTV** (rétention 12 mois) ≈ **115 €** ; CAC béta (Le Bon Coin manuel) ≈ temps, ~0 € cash → **ratio LTV/CAC excellent au début**, à surveiller quand on passe aux ads.
- **Verdict** : **A−**. Économie unitaire saine ; le risque est la **rétention**, pas la marge.

### 🤝 Customer Success
- Onboarding tuto + install : bon. Manque : **activation moniteur** (« valide ta 1ʳᵉ compétence en < 5 min ») et **relance des élèves dormants** (déjà esquissée côté analyses).
- **Verdict** : **B−**.

### ⚖️ Legal / Compliance
- **Question clé** : le livret REMC **papier** reste l'officiel ; PermiGo est aujourd'hui un *compagnon numérique*. Opportunité énorme **si** la dématérialisation devient acceptée/encouragée (tendance réglementaire). À sécuriser : positionnement « complément, pas substitut légal » tant que ce n'est pas tranché.
- **Verdict** : **B** — risque maîtrisable, **upside réglementaire majeur**.

---

## 3. Concurrence
| Acteur | Modèle | Ce qu'ils font | Notre angle |
|---|---|---|---|
| **AGX (Harmonie/Harmobil')**, **Ediser**, **Packsolo** | SaaS gestion auto-école | Admin, plannings, compta, contenu code | Ils gèrent l'**administratif**, pas l'**engagement**. On est la couche pédagogique gamifiée qu'ils n'ont pas. |
| **En Voiture Simone / Lepermislibre** | Auto-école **en ligne** B2C | Ils *sont* l'auto-école (candidat libre) | Eux désintermédient l'école ; nous **outillons** l'école et le moniteur (B2B/B2B2C). Canal possible plutôt que pur ennemi. |
| **Codes Rousseau / ENPC** | Contenu code | Banques de questions, séries | Contenu amont ; nous = suivi/engagement aval. Intégrable. |

**Notre fossé (moat) en construction** : (1) **habitude élève** (streak/quotidien = rétention), (2) **données d'engagement** (qui révise, qui bloque), (3) **effet réseau** école→moniteur→élève, (4) **marque/UX** très au-dessus du secteur.

---

## 4. POV client (day in the life)

**Karim, moniteur indé, 38 ans.** Entre deux leçons, sur son tél. Avant : livret papier corné, élèves qu'il relance par SMS au feeling. Avec PermiGo : il valide une compétence en 2 taps, l'élève reçoit une notif fière, il voit qui décroche. *« J'ai l'air d'un pro, et je passe moins de temps en paperasse. »* Le déclic d'abonnement : quand il montre l'app à un élève et que l'élève dit « ah ouais c'est stylé ».

**Léa, élève, 18 ans.** Reçoit sa « question du jour », garde sa série 🔥, voit son permis virtuel se remplir. Le permis n'est plus une corvée opaque mais une progression visible. Elle parle de l'app à 2 amies qui passent le permis.

**Mme Diallo, patronne, 3 moniteurs.** Sa peur : perdre des élèves (qui abandonnent = CA perdu) et les contrôles RGPD. PermiGo lui montre l'engagement par moniteur, lui garde ses données, et différencie son école (« chez nous, suivi numérique »). Elle paie pour **dormir tranquille + se démarquer**.

---

## 5. Modèle financier — 3 scénarios

**Hypothèses** : net 9,59 €/mois indé ; per-seat ~15 €/moniteur/mois ; marge ~95 %.

| Scénario | Cible | Capture | MRR | ARR |
|---|---|---|---|---|
| **A — Béta indé** | ~30 000 moniteurs (dont indés) | 5 % = 1 500 | ~14 k€ | **~170 k€** |
| **B — Indé + écoles** | indés + 12 500 écoles | 3 000 moniteurs + 800 écoles (×3 sièges) | ~65 k€ | **~780 k€** |
| **C — Standard du secteur** | la couche engagement de référence | 1–2 % de la dépense logiciel + B2B2C | — | **plusieurs M€** |

Le saut A→B = **passer du self-serve au B2B école**. Le saut B→C = devenir **l'infrastructure** (API livret, intégrations AGX/Ediser, contenu, multi-permis).

---

## 6. Risques & parades
1. **Rétention faible** (le vrai juge). → Parade : habitude quotidienne élève + valeur hebdo moniteur (réputation réelle).
2. **Réputation/ligue creuse** tant qu'il n'y a qu'un moniteur. → Parade : livrer les **avis vérifiés** (élève→moniteur) ; masquer la ligue jusqu'à densité.
3. **Solo founder / bus factor.** → Parade : docs (déjà bonnes), automatisation, 1ʳᵉ recrue tech quand l'ARR le permet.
4. **Réglementaire** (livret papier officiel). → Parade : positionnement « complément », lobbying doux, prêt si dématérialisation.
5. **Dépendance à l'engagement élève** pour la valeur moniteur. → Parade : donner au moniteur une valeur *intrinsèque* (gain de temps, image pro, avis).

---

## 7. Vision long terme — le scénario « empire PermiGo »

**T0 — 2026 (maintenant).** Bêta payante. 10→50 moniteurs indés via Le Bon Coin. On apprend la rétention, on récolte de **vrais** témoignages (qui remplacent les faux de la page école). Install A2HS = clé d'entrée. Premier MRR.

**T+6 mois — 2026 H2.** 200–500 moniteurs. La réputation devient réelle (avis vérifiés). Première école signe parce que « ses moniteurs l'utilisent déjà » : bascule indé→école. ~10–30 k€ MRR.

**T+18 mois — 2027.** PermiGo = **le** livret REMC numérique de référence côté moniteur. Intégrations légères (import contenu code, export bilan élève). 1 000–3 000 comptes. ~100–250 k€ ARR. Première recrue. La data d'engagement devient un actif (benchmarks « tes élèves vs la moyenne »).

**T+3 ans — 2029.** Plateforme : API livret, marketplace de contenu, multi-permis (moto, BE, poids lourd → marché pro/CPF énorme). B2B2C : l'école achète, l'élève vit l'app, le candidat « post-permis » reste (conduite accompagnée, perfectionnement). Expansion **réglementaire** si la dématérialisation passe : PermiGo prêt = avantage de premier entrant. 7-chiffres ARR.

**T+5 ans — 2031 — l'empire.** PermiGo n'est plus « une app auto-école » : c'est **l'infrastructure d'engagement de l'apprentissage de la conduite** en France, puis dans les pays à référentiel équivalent (Belgique, Suisse, Maghreb francophone). Le livret est numérique par défaut. Le moniteur indé a une **réputation portable** (son score le suit d'école en école — son LinkedIn de la conduite). L'élève a un **profil de conducteur** réutilisable (assurance jeune conducteur, location). La marque PermiGo = « le permis, version 2030 ». Sortie possible : rachat par un acteur assurance/mobilité (Allianz, BlaBlaCar-like) ou EdTech, **ou** rester indépendant comme le standard de catégorie.

*Le fil rouge de l'empire : transformer une corvée administrative (le permis) en une habitude mesurable — et posséder la couche d'engagement + la donnée qui va avec.*

---

## 8. Les 5 prochains coups (priorisés)
1. **Encaisser** : finir Stripe (4 actions, 5 min) → lancer 10 moniteurs payants cette semaine. *Rien ne compte avant le 1ᵉʳ €.*
2. **Mesurer la rétention** : câbler activation + J7/J30 en dashboard. Sans ça, on pilote à l'aveugle.
3. **Rendre la réputation réelle** : avis vérifiés élève→moniteur (remplace les faux témoignages) ; masquer la ligue tant qu'elle est creuse.
4. **Trancher pro vs jeu** côté moniteur (cohérence = crédibilité = conversion).
5. **Boucle de témoignages** : chaque moniteur béta satisfait → 1 verbatim + 1 parrainage. C'est le carburant du B2B école.

> **Une phrase pour le mur** : *La techno est prête, la marge est belle, le marché a un vent dans le dos. Le seul juge maintenant, c'est la rétention — alors encaisse, mesure, itère.*
