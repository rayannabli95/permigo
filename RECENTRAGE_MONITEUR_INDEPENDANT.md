# Recentrage stratégique — cap sur le moniteur indépendant

*Document de cadrage — 7 juin 2026. Fait suite à `ANALYSE_BESOINS_METIER_ENSEIGNANT.md`.*

Tu viens de trancher une question plus importante que tout le design réuni : **PermiGo vise le moniteur indépendant, pas le patron d'auto-école.** Ce document dit ce que ça implique, franchement, chiffres à l'appui.

> ⚠️ Note : le `CLAUDE.md` actuel décrit encore le modèle inverse (« SaaS B2B, acheteur = patron d'auto-école, abonnement per-seat »). Si on confirme ce cap, cette ligne devra être réécrite. Le code contient déjà un espace « gérant » (`src/pages/gerant/*`) qui deviendrait hors-cible.

---

## 1. Pourquoi c'est probablement le bon move

**Le décideur est l'utilisateur est le payeur.** Le plus gros frein du B2B auto-école, c'est le cycle de vente : convaincre un patron conservateur, comité, per-seat, intégration avec son logiciel de gestion (AGX, Ediser, Drivup). Avec l'indépendant, celui qui essaie l'appli est celui qui sort la carte bleue. Achat en minutes, pas en mois.

**Le marché existe et grossit.** 12 000 enseignants indépendants en 2025, +15 % en cinq ans, ~40 % de la profession. Ce n'est pas un marché de niche moribond, c'est le segment qui *gagne* du terrain.

**Ils cherchent activement à se différencier.** Contrairement au patron installé, l'indépendant est en quête permanente d'arguments pour exister face aux plateformes et aux auto-écoles physiques. C'est une population *demandeuse*, pas à convaincre de force.

**La faille concurrentielle est nette.** Ornikar et En Voiture Simone outillent le moniteur — mais l'outil est *à leur marque*, et c'est *elles* qui possèdent la relation élève (et prennent leur commission). Un moniteur qui veut être vraiment indépendant n'a aujourd'hui aucun outil **à lui** qui le rende crédible en son nom propre. C'est exactement le trou que PermiGo remplit.

---

## 2. Ton vrai différenciateur (sois honnête là-dessus)

Attention : « mon appli est plus belle que le livret d'En Voiture Simone » est un argument fragile. Les avis classent les apps d'Ornikar et EVS comme « intuitives » et bien notées (EVS 4,6/5 Trustpilot). Si tu te bats sur l'esthétique, tu te bats sur du subjectif et tu peux perdre.

Ton avantage réel, défendable, tient en trois points qu'**aucun** des outils de suivi concurrents n'a réunis :

1. **C'est l'outil DU moniteur, à sa marque.** Pas celui de la plateforme qui possède son élève. Il en sort gagnant en indépendance.
2. **Une couche d'engagement / de jeu côté élève.** Les concurrents font du *suivi* (cases à cocher). Toi tu fais *réviser et revenir* l'élève. C'est une différence de nature, pas de joliesse.
3. **De l'autorité et de la preuve pour le moniteur.** Le tableau « qui est prêt », le taux de réussite à son nom (cf. analyse besoins).

Reformule ta promesse comme ça, pas sur le « c'est joli ».

---

## 3. Le moteur de croissance : l'élève vend le moniteur

C'est l'intuition que tu as eue et elle est juste. La boucle :

> L'élève découvre un outil engageant → il révise plus et progresse → le moniteur a l'air pro et obtient de meilleurs résultats → sa réputation grimpe → il remplit son planning → il reste abonné et en parle à d'autres moniteurs.

Conséquence : l'intérêt élève et l'intérêt moniteur ne sont **pas** deux problèmes séparés. Le « wow » de l'élève EST l'outil commercial du moniteur. Donc on continue d'investir à fond dans l'expérience élève — non pas « pour faire joli », mais parce que c'est ce qui remplit l'agenda de Ryan. Ça justifie tout le travail de gamification déjà fait.

---

## 4. Ce que ça change concrètement

**Produit — ça SIMPLIFIE (bonne nouvelle).** L'espace « gérant / auto-école » (`pulse`, `equipe`, `eleves`, `cockpit`) sort de la cible : moins à construire, moins à maintenir. On se concentre sur deux rôles : **élève** (engagement) et **enseignant solo** (autorité + preuve). Le produit devient plus net.

**Pricing — par moniteur, pas par école.** Le forfait école (19/69/129) n'a plus de sens. Modèle pressenti : un abonnement individuel simple (un seul tarif, ou freemium → payant quand il passe un certain nombre d'élèves). À trancher.

**Acquisition — un par un, mais viral.** Pas de gros contrats. On recrute les moniteurs au détail. Le canal naturel : l'élève satisfait, les groupes Facebook/forums de moniteurs (ex. « galère de moniteur »), le bouche-à-oreille entre indépendants. Le produit doit être démontrable en 30 secondes.

---

## 5. Ce qu'on perd / les risques (à assumer)

- **Ticket plus petit.** Un moniteur paie moins qu'une école multi-sièges. Il faut du **volume** pour que ça pèse.
- **Modèle indépendant précaire.** La presse parle de « la précarité comme horizon » côté moniteur en ligne (annulations, discontinuité). Un moniteur qui galère résilie vite. Le produit doit l'aider à *gagner sa vie*, pas juste à cocher des cases — sinon il part.
- **Pas de barrière à l'entrée forte.** Si l'idée marche, un Ornikar peut copier la gamif. Ton avance = vitesse + le fait d'être « son » outil, hors plateforme.

---

## 6. Dimensionnement honnête (ordre de grandeur)

12 000 indépendants. Imaginons un abonnement ~25 €/mois.
- 5 % d'adoption = 600 moniteurs ≈ **15 000 €/mois** de revenu récurrent.
- 10 % = 1 200 ≈ **30 000 €/mois**.

Ce n'est pas une licorne, c'est un **vrai business solo solide et atteignable** — exactement le genre de cible réaliste pour un fondateur seul. Et ça peut grandir si tu ouvres ensuite l'acquisition d'élèves (le débat « marcher sur Ornikar »).

---

## 7. Décisions qui t'attendent (quand tu veux, pas maintenant)

1. **Confirmer le cap** : on enterre vraiment le B2B auto-école, ou on le garde en option lointaine ?
2. **Modèle de prix** : abonnement plat unique, ou freemium avec seuil ?
3. **Sort de l'espace gérant** : on l'archive proprement ou on le laisse dormir ?
4. Et la grande question de fond, toujours ouverte : **PermiGo aide-t-il seulement Ryan à être meilleur, ou aussi à trouver des élèves ?**

Rien à décider à chaud. Mais le cap « moniteur indépendant » est, à mon avis franc, le bon. Il colle au marché, au décideur, à la faille concurrentielle, et à ton intuition de terrain.
