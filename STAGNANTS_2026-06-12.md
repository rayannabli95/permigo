# Bilan hebdomadaire — élèves stagnants

**Date du rapport :** 12 juin 2026
**Projet Supabase :** `arrfmdagdqtrtfbhxlty` (le projet `ivtuheoyfgljujliscwf` mentionné dans la tâche n'existe pas dans ce compte — un seul projet PermiGo accessible)
**Critère :** dernière validation REMC > 7 jours OU aucune validation

> ⚠️ **Adaptations schéma** : le schéma réel n'a pas `profiles.tel`, `profiles.statut`, `profiles.forfait_h`, ni `remc_entries`. J'ai utilisé : `deleted_at IS NULL` (au lieu de `statut='Actif'`), `credit_heures` (au lieu de `forfait_h`), table `validations` avec `validated_at` et `statut='acquis'` (au lieu de `remc_entries.lv='v'`). La colonne `tel` n'existe pas → omise.

---

## 1. Total

**21 élèves stagnants** sur 36 élèves actifs (58 %).

Répartition :
- **11 élèves** sans aucune validation REMC depuis leur inscription
- **10 élèves** avec validations existantes mais arrêtées depuis ≥ 7 jours

---

## 2. Détail par élève

### 🔴 Priorité haute — 0 validation + inactivité ≥ 14 j

#### Aime
- **Email :** aime@gmail.com · **Tél :** non renseigné
- **Dernière validation :** jamais
- **Acquises :** 0 / 31
- **Crédit heures restant :** 0 h
- **Moniteur :** Rayan (rayannabli27@gmail.com)
- **Dernière activité :** 25 mai 2026 (il y a 18 j)
- **Actions :**
  1. Vérifier le statut d'inscription (crédit à 0 h = forfait jamais activé ?)
  2. Relancer Rayan pour confirmer si l'élève a démarré
  3. Email/SMS à l'élève pour relance directe

#### TestEleve2
- **Email :** eleve.test2.permigo@gmail.com · **Tél :** non renseigné
- **Dernière validation :** jamais · **Acquises :** 0 / 31 · **Crédit :** 0 h
- **Moniteur :** Rayan Nabli (enseignant@test.fr)
- **Dernière activité :** 24 mai 2026 (il y a 19 j)
- **Actions :** 1) Compte de test → exclure si confirmé ; 2) Sinon supprimer/archiver ; 3) Vérifier en base si compte de seed

#### TestEleve
- **Email :** non renseigné · **Tél :** non renseigné
- **Dernière validation :** jamais · **Acquises :** 0 / 31 · **Crédit :** 0 h
- **Moniteur :** aucun (`enseignant_id` NULL)
- **Dernière activité :** 24 mai 2026 (il y a 19 j)
- **Actions :** 1) Compte orphelin sans moniteur → archiver ; 2) Vérifier si compte de test ; 3) Si réel : assigner un moniteur

#### Betty
- **Email :** bettyntoni@gmail.com · **Tél :** non renseigné
- **Dernière validation :** jamais · **Acquises :** 0 / 31 · **Crédit :** 0 h
- **Moniteur :** Rayan (rayannabli27@gmail.com)
- **Dernière activité :** 25 mai 2026 (il y a 18 j)
- **Actions :** 1) Relancer le moniteur principal ; 2) Email de réengagement à l'élève ; 3) Vérifier si forfait souscrit (crédit 0 h suspect)

#### Sherine
- **Email :** sherinenabli953@gmail.com · **Tél :** non renseigné
- **Dernière validation :** jamais · **Acquises :** 0 / 31 · **Crédit :** 0 h
- **Moniteur :** Rayan (rayannabli27@gmail.com)
- **Dernière activité :** 25 mai 2026 (il y a 18 j)
- **Actions :** 1) Relancer Rayan ; 2) Vérifier statut d'inscription ; 3) Appel de réengagement

---

### 🟠 Priorité moyenne — validations existantes mais figées

#### Latifa Sahli (eleve@test.fr)
- **Email :** eleve@test.fr · **Tél :** non renseigné
- **Dernière validation :** 14 mai 2026 (il y a 29 j)
- **Acquises :** **31 / 31** ✅ (livret complet)
- **Crédit :** 20 h restantes
- **Moniteur :** Rayan Nabli (enseignant@test.fr)
- **Dernière activité :** 16 mai 2026
- **Actions :** 1) **Présenter à l'examen pratique** (livret 100 % validé) ; 2) Programmer un examen blanc ; 3) Confirmer disponibilité avec Rayan

#### Rezah Bensalem
- **Email :** rezah.bensalem@test.fr · **Tél :** non renseigné
- **Dernière validation :** 24 mai 2026 (il y a 19 j) · **Acquises :** 4 / 31 · **Crédit :** 0 h
- **Moniteur :** Lassaad Sahli (lassaad.sahli@test.fr)
- **Actions :** 1) Relancer Lassaad ; 2) Vérifier renouvellement forfait (0 h restantes) ; 3) Email de relance progression

#### Tomomi
- **Email :** tomomi.mawatari2103@gmail.com · **Tél :** non renseigné
- **Dernière validation :** 25 mai 2026 (il y a 18 j) · **Acquises :** 1 / 31 · **Crédit :** 0 h
- **Moniteur :** Rayan
- **Actions :** 1) Relancer Rayan ; 2) Vérifier renouvellement forfait ; 3) Proposer leçon de reprise

#### loic.tse@gmail.com
- **Email :** loic.tse@gmail.com · **Tél :** non renseigné
- **Dernière validation :** 30 mai 2026 (il y a 13 j) · **Acquises :** 1 / 31 · **Crédit :** 0 h
- **Moniteur :** Rayan
- **Actions :** 1) Relancer Rayan ; 2) Vérifier statut forfait ; 3) Email de relance

#### Pierre
- **Email :** pierre.cova@gmail.com · **Tél :** non renseigné
- **Dernière validation :** 1 juin 2026 (il y a 11 j) · **Acquises :** 9 / 31 · **Crédit :** 0 h
- **Moniteur :** Rayan Nabli
- **Actions :** 1) Relancer Rayan ; 2) Renouvellement forfait ; 3) Proposer plan de progression

#### Nahomie
- **Email :** elnaha869@gmail.com · **Tél :** non renseigné
- **Dernière validation :** 1 juin 2026 (il y a 11 j) · **Acquises :** 7 / 31 · **Crédit :** 0 h
- **Moniteur :** Rayan Nabli
- **Actions :** 1) Relancer Rayan ; 2) Renouvellement forfait ; 3) Relance élève

#### Lakika
- **Email :** kheroua.adam@gmail.com · **Tél :** non renseigné
- **Dernière validation :** 2 juin 2026 (il y a 10 j) · **Acquises :** 2 / 31 · **Crédit :** 0 h
- **Moniteur :** Rayan Nabli
- **Actions :** 1) Relancer Rayan ; 2) Renouvellement forfait ; 3) Vérifier abandon potentiel (faible progression)

#### CADET BENOÎT Mendy
- **Email :** mendycadet7@gmail.com · **Tél :** non renseigné
- **Dernière validation :** 3 juin 2026 (il y a 9 j) · **Acquises :** **31 / 31** ✅
- **Crédit :** 0 h
- **Moniteur :** Rayan Nabli
- **Actions :** 1) **Présenter à l'examen pratique** ; 2) Programmer examen blanc ; 3) Renouvellement forfait si nécessaire pour heures avant l'épreuve

#### Delphine Tourneur
- **Email :** tourneur.delphine@gmail.com · **Tél :** non renseigné
- **Dernière validation :** 3 juin 2026 (il y a 9 j) · **Acquises :** 18 / 31 · **Crédit :** 0 h
- **Moniteur :** Rayan Nabli
- **Actions :** 1) Relancer Rayan (élève bien engagée, à ne pas perdre) ; 2) Renouvellement forfait ; 3) Proposer planning de leçons régulier

#### Nazim
- **Email :** nazimbouskra@gmail.com · **Tél :** non renseigné
- **Dernière validation :** 5 juin 2026 (il y a 7 j) · **Acquises :** 6 / 31 · **Crédit :** 0 h
- **Moniteur :** Rayan Nabli
- **Actions :** 1) Relancer Rayan ; 2) Renouvellement forfait ; 3) Email d'encouragement

---

### 🟡 À surveiller — 0 validation mais activité récente

#### Antoine Pallandre
- **Email :** bgghh@gmail.com · **Dernière activité :** 12 juin 2026 (aujourd'hui)
- **Acquises :** 0 / 31 · **Crédit :** 0 h · **Moniteur :** Rayan Nabli
- **Actions :** 1) Élève connecté mais aucune validation → vérifier blocage ; 2) Relancer Rayan pour première validation ; 3) Onboarding-check

#### Antoine Millet
- **Email :** jeandelatour@gmail.com · **Dernière activité :** 11 juin 2026 (1 j)
- **Acquises :** 0 / 31 · **Crédit :** 0 h · **Moniteur :** Rayan Nabli
- **Actions :** 1) Vérifier si leçons effectives ; 2) Relancer Rayan ; 3) Onboarding-check

#### Audit Flow
- **Email :** audit.flow@permigo-test.fr · **Dernière activité :** 12 juin 2026
- **Acquises :** 0 / 31 · **Moniteur :** Rayan Nabli
- **Actions :** Compte de test/QA → exclure du suivi

#### Sourour Sourour
- **Email :** souroursourour27420@gmail.com · **Dernière activité :** 8 juin 2026 (4 j)
- **Acquises :** 0 / 31 · **Crédit :** 0 h · **Moniteur :** Rayan Nabli
- **Actions :** 1) Vérifier progression réelle ; 2) Relancer Rayan ; 3) Email onboarding

#### Mehdi Suares
- **Email :** ajdhdh@gmail.com · **Dernière activité :** 2 juin 2026 (10 j)
- **Acquises :** 0 / 31 · **Crédit :** 0 h · **Moniteur :** Rayan Nabli
- **Actions :** 1) Relancer Rayan ; 2) Vérifier statut élève ; 3) Email réengagement

#### Latifa Sahli (sans email)
- **Tél :** non renseigné · **Dernière activité :** 5 juin 2026 (7 j)
- **Acquises :** 0 / 31 · **Moniteur :** Rayan Nabli
- **Actions :** 1) Compléter email (vide en base) ; 2) Doublon possible avec eleve@test.fr → vérifier ; 3) Relancer Rayan

---

## 3. Recommandation finale — qui contacter cette semaine

**Top 3 prioritaires :**

1. **Latifa Sahli (eleve@test.fr) & CADET BENOÎT Mendy** — livret REMC à 31/31. Ce sont des examens prêts à passer. Prendre contact aujourd'hui pour caler la date d'épreuve pratique. Risque sinon : décrochage après avoir tout validé.

2. **Delphine Tourneur** (18/31, active jusqu'à 9 j) — élève engagée qui ralentit. Crédit à 0 h : c'est probablement la cause. Lui proposer le renouvellement forfait + relancer Rayan pour reprendre les leçons rapidement.

3. **Aime, Betty, Sherine** (0 validation, 18 j d'inactivité, moniteur = Rayan) — pattern identique : élèves du même moniteur, jamais validé, silence prolongé. Faire un point direct avec Rayan : ces 3 élèves sont-ils encore actifs réellement ?

**Pattern général à corriger :**
- **20/21 élèves stagnants ont 0 h de crédit restantes** → le vrai blocage n'est pas la stagnation, c'est le **non-renouvellement de forfait**. Mettre en place une alerte automatique quand `credit_heures = 0` avant que l'élève ne décroche.
- **Rayan Nabli (enseignant@test.fr) suit 14 des 21 stagnants** → surcharge probable. Audit de portefeuille à faire.

**Comptes à nettoyer :** TestEleve, TestEleve2, Audit Flow → comptes de QA/test à exclure des rapports futurs (filtre `email NOT LIKE '%test%'` à ajouter au scheduler).
