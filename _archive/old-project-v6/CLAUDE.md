# CLAUDE.md — Contexte projet Autopilot v6

> Ce fichier est lu automatiquement par Claude Code à l'ouverture du projet.
> Il fournit le contexte que tu dois avoir avant de toucher au code.

## ⚠️ SOURCE DE VÉRITÉ

**`PROMPT_COWORK_FRONTEND.md`** est la spec officielle (couleurs, statuts, écrans).
Tout dev sur ce projet doit s'y aligner. Si l'app diverge, c'est la spec qui gagne.

## C'est quoi ce projet

**Autopilot v6** est une application de gestion d'auto-école destinée à être livrée à des clients (auto-écoles) pour gérer planning, élèves, livret REMC, paye moniteurs et notation.

État actuel : **prototype mono-fichier ultra-fonctionnel** (`autopilot.html`, ~3600 lignes) déjà aligné v6 (palette bleue #2563eb, statuts blanc/jaune/rouge, écrans Login + Signup), prêt à être branché à un backend.

## Système de design v6 (LOCKED)

### Couleurs
- Primary Blue : `#2563eb` → variable CSS `--a`
- Primary Dark : `#1d4ed8` → `--adk`
- Pâle bleu fond : `#eff6ff` → `--ap`
- Success : `#10B981` → `--gr`
- Danger : `#EF4444` → `--rd`
- Warning : `#F59E0B` → `--am`

### Statuts de leçon (LOCKED)
| Statut | Background | Bordure |
|---|---|---|
| ⚪ Confirmed | `#ffffff` | `#d1d5db` + bord gauche bleu |
| 🟡 Pending | `#fef3c7` | bord gauche `--am` |
| 🔴 Cancelled | `#fee2e2` | bord gauche `--rd` |

### Typographie
- Headlines : 24px Bold
- Subheaders : 18px Semi-bold
- Body : 14px Regular
- Small : 12px Regular
- Boutons : 14px Semi-bold blanc sur bleu

### Spacing
- Padding interne : 16px
- Margin sections : 24px
- Gap grilles : 16px
- Border radius : 8px

## Architecture du fichier `autopilot.html`

Tout est dans un seul fichier HTML. Structure interne :

| Lignes | Contenu |
|---|---|
| 1-410 | CSS (variables, layout, composants, dark mode, animations) |
| 410-915 | HTML : splash, sidebar, 12 pages (admin/moniteur/élève), bottom nav |
| 920-1070 | Modals : créneau, annulation, absence, notation, trophée, lieu, réservation, action événement |
| 1070-1090 | CSS additionnels (cren-type, mon-choice-card, photo-hint) |
| 1095-1240 | JS : commentaire dev, STORE, FX (animations), REMC data |
| 1240-1320 | Data mocks : EVENTS, MONS, ELEVES, LIEUX_DATA, ABSENCES, NOTATIONS, HEURES_MOIS |
| 1320-1410 | Configuration rôles (ROLES, PT — page titles) |
| 1410-1500 | Navigation : renderSbNav, renderBnav, navTo, renderTopActs |
| 1500-1620 | Pages admin : renderAdmin, renderAssiduite |
| 1620-1810 | Calendrier (buildCalendar, buildDayView, renderCalAdmin, renderHebdoView) |
| 1810-1920 | Modal créneau (openCreneau, buildLieux, buildHoraires, validateCren, updateCrenModal) |
| 1920-1970 | Élèves : renderEleves, openFiche, buildHistTbl |
| 1970-2090 | Livret : renderCompGrid, updateLivretStats, renderTrophMini, saveLivret |
| 2090-2150 | Trophées + openTrophyModal |
| 2150-2350 | Profils : renderProfilMon, renderProfilAdmin, renderProfilEleve, renderLieuxManage |
| 2350-2450 | Notifs, Espace élève, slots réservation |
| 2450-2510 | Helpers : openM/closeM, dark mode, notation étoiles, char count, toast, plafond |
| 2510-2600 | Agents IA : AGENTS, runAgent, renderAgentResult |
| 2600-3050 | bind() — TOUS les event listeners |
| 3050-3300 | Splash + init |
| 3300+ | end script + body close |

## Écrans à livrer (8 selon spec v6)

1. **Login** ✅ — formulaire email/password, validation, états error/loading
2. **Signup** ✅ — sélecteur rôle + nom + email + password + force + match
3. **Admin Dashboard** ✅ — sidebar + KPIs + alertes + actions rapides + IA
4. **Instructor Calendar** ✅ — grille semaine, statuts white/yellow/red, plafond
5. **Create/Edit Lesson Modal** ✅ — type + date + durée + élève + lieu
6. **Lesson Detail Screen** ✅ — modal action (m-event) avec annuler/supprimer
7. **REMC Form Screen** ✅ — grille compétences, IA commentaire, save persistant
8. **Student Dashboard** ✅ — hero, prochains cours, livret, coach IA examen

(Tout est dans `autopilot.html` mono-fichier.)

## Rôles & écrans

```
ADMIN (Sophie Laurent)
├── Accueil       — hero dynamique, KPIs animés, alertes, actions rapides, IA
├── Assiduité     — activité hebdo, heures mois (paye), notation moniteurs, absences
├── Calendrier    — sélecteur moniteur, plafond, +Heures
├── Élèves        — liste avec recherche surlignée
├── Notifications
└── Profil        — photo upload, biométrie, récap heures mois

MONITEUR (Marco Dominguez)
├── Planning      — vue Semaine OU Hebdo, clic pour créer/modifier
├── Mes élèves    — recherche, filtre, fiche détaillée
├── Fiche élève   — historique, IA, livret, notes privées (persistées)
├── Livret REMC   — grille 31 compétences, IA commentaires, save → confetti
├── Notifications
└── Profil        — photo, lieux RDV éditables, dark mode, biométrie

ÉLÈVE (Arnaud Kenfack)
├── Espace        — hero, prochains cours, livret rempli, coach IA examen
├── Trophées      — grille REMC, modal détail
├── Réservation   — modal slots
├── Notifications
└── Profil        — photo, dark mode, sync status
```

## Persistance (toute en localStorage)

Couche d'accès : objet `STORE` (lignes ~1095). Clés :

| Clé | Type | Quand |
|---|---|---|
| `ap-role` | string | choix du rôle au splash |
| `ap-dark` | '0'\|'1' | toggle thème |
| `ap-events` | JSON array | création/suppression événement |
| `ap-absences` | JSON array | enregistrement absence |
| `ap-notations` | JSON array | élève évalue moniteur |
| `ap-lieux` | JSON array | add/edit/delete lieu RDV |
| `ap-cs` | JSON object | toggle compétence livret |
| `ap-notes-priv` | JSON object | save notes fiche élève |
| `ap-livret-filled` | '0'\|'1' | save livret |
| `ap-livret-date` | ISO string | save livret |
| `ap-mon-photo` / `ap-admin-photo` / `ap-elv-photo` | dataURL | upload photo |
| `ap-bio` / `ap-bio-admin` | '0'\|'1' | toggle biométrie |

Helpers : `persistEvents()`, `persistLieux()`, `persistAbsences()`, `persistNotations()`, `persistNotesPriv()`, `persistCS()`.

## Agents IA (5 agents structurés)

Définis dans l'objet `AGENTS` (lignes ~2510). Chacun renvoie `{title, summary, list[], actions[]}` :

- `optimiseur` (admin) — optimisation planning
- `anomalies` (admin) — détection anomalies
- `prochaine` (moniteur) — plan prochaine leçon
- `risque` (moniteur) — élèves à risque d'abandon
- `coachExam` (élève) — préparation examen

À remplacer par `POST /ai/agent/<name>` côté backend.

Les chips IA "classiques" utilisent `AI_SIM` (réponses pré-rédigées) — à remplacer par `POST /ai/chat`.

## Animations & interactivité

Objet `FX` (lignes ~1135) :
- `FX.ripple(e)` — effet ondulation au clic
- `FX.countUp(el,to,opts)` — count-up sur valeurs numériques
- `FX.confetti(count)` — célébration (livret save)
- `FX.thinkingStart/Stop(elId)` — état IA en réflexion
- `FX.haptic(ms)` — vibration mobile
- `FX.highlight(text,query)` — surbrillance recherche
- `FX.scrollTo(el)` — smooth scroll

Auto-attaché à toute la doc via `attachRipples()` + `MutationObserver`.

## Tests rapides à faire après modif

1. Ouvrir `autopilot.html` dans Chrome
2. Sélectionner chaque rôle au splash
3. **Admin** : voir hero animé, cliquer KPIs (count-up), naviguer Assiduité (sélecteur jour) puis Calendrier (sélecteur moniteur)
4. **Moniteur** : créer un créneau (tester chaque type), cliquer un événement existant (modal action), basculer Semaine/Hebdo, ouvrir Livret → cocher compétences → save (confetti !)
5. **Élève** : cliquer "🤖 Coach examen", "⭐ Évaluer Marco", "📅 Réserver une leçon"
6. Refresh → l'app reprend sur le rôle sélectionné, sans repasser par le splash
7. F12 → localStorage → vérifier que les clés `ap-*` sont peuplées

## Tâches restantes pour le dev backend

Voir `DEV_BRIEF.md` pour le détail (tables SQL, endpoints, stack recommandée, estimation effort).

Résumé court :
1. Auth multi-rôle (Supabase Auth recommandé)
2. Tables Postgres (events, monitors, students, ratings, booklet_entries, locations, absences, notifications)
3. Remplacer la couche `STORE` (lignes ~1095) par appels API
4. Créer les pages **Création moniteur** et **Création élève** côté admin (pas dans le proto)
5. Push notifs via Service Worker
6. Brancher Claude API pour les vrais agents IA
7. Stripe Connect pour la facturation (V2)

## Commandes utiles

```bash
# Ouvrir directement dans le navigateur
open autopilot.html              # Mac
xdg-open autopilot.html          # Linux

# Servir en local (recommandé pour tester localStorage proprement)
python3 -m http.server 8080
# puis http://localhost:8080/autopilot.html

# Vérifier la syntaxe JS
node -e "const h=require('fs').readFileSync('autopilot.html','utf8');const m=h.match(/<script>([\s\S]+?)<\/script>/);new Function(m[1]);console.log('OK')"
```

## Conventions de code

- Pas de framework — vanilla JS
- Pas de build step — édition directe du fichier
- Variables CSS pour le theming (préfixe `--`)
- Helpers globaux : `tx(id,val)` (textContent safe), `esc(s)` (HTML escape), `toast(msg)` (notification UI), `openM(id)` / `closeM(id)` (modals)
- Conventions de nommage : `btn-*` pour boutons, `m-*` pour modals, `page-*` pour pages, `ai-*` pour zones IA
- Données mockées en haut du `<script>` — à remplacer par fetch en prod

## Si tu modifies, attention à...

- **Ne pas casser le bind()** — tous les event listeners y sont attachés (lignes ~2600)
- **Toujours appeler les `persist*()`** après mutation des arrays (EVENTS, LIEUX_DATA, etc.)
- **Tester refresh** — le state doit survivre
- **Tester les 3 rôles** — pas seulement celui par défaut
- **Vérifier mobile** — le bottom nav (`bnav`) prend le relais en dessous de 768px

## Prêt pour livraison ?

✅ Front fonctionnel
✅ Persistance complète localStorage  
✅ Agents IA simulés (5)
✅ UI très interactive (ripples, counters, confetti, thinking states)
✅ Dark mode
✅ Responsive
✅ Documentation dev (ce fichier + DEV_BRIEF.md)
⏳ Backend (à faire — voir DEV_BRIEF.md)
⏳ Création de comptes utilisateurs (formulaires admin à ajouter)
⏳ Notifications push réelles
⏳ Facturation
