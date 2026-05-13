# PermiGo Autopilot — Design Context pour intégration

App vanilla HTML/CSS/JS dans un seul fichier `autopilot.html`. Pas de framework.
Données via Supabase. Mobile-first.

---

## Variables CSS (à réutiliser)

```css
:root{
  /* Accent indigo */
  --a:#6366f1; --adk:#4f46e5;
  --ap:rgba(99,102,241,.09);   /* accent pale */
  --ag:rgba(99,102,241,.14);   /* accent ghost */

  /* États */
  --gr:#10b981;  --grp:rgba(16,185,129,.09);   /* vert / success */
  --rd:#ef4444;  --rdp:rgba(239,68,68,.09);    /* rouge / danger */
  --am:#f59e0b;  --amp:rgba(245,158,11,.09);   /* ambre / warning */
  --bl:#0ea5e9;  --blp:rgba(14,165,233,.09);   /* bleu */
  --pu:#8b5cf6;  --pup:rgba(139,92,246,.09);   /* violet */

  /* Neutres (light) */
  --bg:#f4f5fb; --bg2:#eceef8;
  --su:#fff;    --su2:#f8f9fd;
  --bo:#e2e6f2; --bo2:#edf0f9;     /* borders */
  --ink:#0b0d1a; --ink2:#1a1d2e; --ink3:#2d3050;
  --mu:#7880a4;  --mu2:#9ba3c2;    /* muted text */

  /* Rayons */
  --r:10px; --rl:14px; --rx:20px;

  /* Ombres */
  --s1:0 2px 10px rgba(11,13,26,.07),0 1px 3px rgba(11,13,26,.04);
  --s2:0 6px 22px rgba(11,13,26,.09),0 2px 8px rgba(11,13,26,.05);
  --s3:0 14px 40px rgba(11,13,26,.13),0 4px 12px rgba(11,13,26,.07);

  /* Transitions */
  --t:.16s cubic-bezier(.4,0,.2,1);

  /* Fonts */
  --fd:'Archivo','Space Grotesk',system-ui,sans-serif;  /* display */
  --fb:'Space Grotesk','Inter',system-ui,sans-serif;    /* body */
  --fn:'JetBrains Mono',monospace;                       /* mono */
}

/* Dark mode (accent lime "Coach DA") */
body.dark{
  --bg:#0a0b0f; --su:#1c1e26;
  --ink:#f4f5f7; --mu:#7a7e8a;
  --a:#c5ff3d; --adk:#a8e000; --a-ink:#0a0b0f;  /* texte sur accent = noir */
}
```

---

## Classes utilitaires existantes

| Classe | Rôle |
|---|---|
| `.card` | Carte de base (fond `--su`, border `--bo`, radius `--rl`, shadow `--s1`) |
| `.btn` | Bouton de base (height ≥40px sur mobile pour a11y) |
| `.btn-g` | Vert (success) |
| `.btn-p` | Primary (indigo) |
| `.btn-sm` | Smaller (height 36px+) |
| `.bd` | Badge inline |
| `.bg` `.bam` `.br` | Couleurs badge : vert / ambre / rouge |
| `.fi` | Form input |
| `.tgl` | Toggle switch |
| `.mu` | Texte muted |
| `.fx` `.aic` `.jb` `.g2` | Flexbox helpers (flex / align-items-center / justify-between / gap) |
| `.mb4` `.mt3` | Margin bottom / top |
| `.kpi` | Bloc KPI |
| `.aip` | Bloc Assistance IA |

---

## Structure des pages

Pas de routing (pas de hash). Chaque écran = une `<div class="page" id="page-XYZ">` cachée par défaut. JS appelle `navTo('xyz','Titre')` pour switch.

Exemple :
```html
<div class="page" id="page-livret">
  <div class="card mb4">
    <div class="ch">
      <div class="ct">📅 Titre de la carte</div>
      <button class="btn btn-g btn-sm">Action</button>
    </div>
    <div class="cb">
      contenu...
    </div>
  </div>
</div>
```

---

## REMC — données hardcodées dans le HTML

`const REMC = [...]` (ligne ~2449). 4 catégories × ~8 sous-comp. = 31 total.

```js
const REMC = [
  {id:'C1', ico:'🏁', name:'Maîtrise du véhicule', tname:'Premiers Tours de Roues', subs:[
    {c:'C1a', n:'Organes, commandes, vérifications'},
    {c:'C1b', n:"S'installer au poste de conduite"},
    {c:'C1c', n:'Tenir le volant, trajectoire'},
    {c:'C1d', n:"Démarrer et s'arrêter"},
    {c:'C1e', n:'Doser accélération et freinage'},
    {c:'C1f', n:'Utiliser la boîte de vitesses'},
    {c:'C1g', n:'Contrôles de sécurité extérieure'},
    {c:'C1h', n:'Manœuvres : créneau, demi-tour'},
    {c:'C1i', n:'Autonomie sur manœuvres de base'},
  ]},
  {id:'C2', ico:'🛣️', name:'Circulation normale', tname:'Chasseur de Routes', subs:[
    {c:'C2a', n:'Infos visuelles'},
    {c:'C2b', n:'Adapter sa conduite'},
    // … 6 autres
  ]},
  {id:'C3', ico:'⚡', name:'Conditions difficiles', tname:'Maître des Conditions', subs:[
    // 7 entries
  ]},
  {id:'C4', ico:'👑', name:'Conduite autonome', tname:'As du Volant', subs:[
    // 7 entries
  ]},
];
```

---

## Schéma Supabase (tables pertinentes)

```sql
-- Profils (1 ligne par user)
profiles (
  id uuid PK, auth_id uuid FK,
  role text CHECK (role IN ('admin','moniteur','eleve')),
  nom text, email text, tel text,
  forfait_h int default 20,        -- nb heures payées
  max_heures int default 35,       -- pour les moniteurs
  statut text default 'Actif',
  code_statut text default 'En cours'
)

-- État des compétences par élève
remc_entries (
  id uuid PK,
  eleve_id uuid FK profiles,
  moniteur_id uuid FK profiles,
  comp_id text,                    -- ex: "C1a", "C2b"...
  checked boolean default false,
  lv text,                         -- 'v' = validé, 'p' = en cours
  note text,
  validated_at timestamptz,
  UNIQUE(eleve_id, comp_id)
)

-- Notes moniteur → élève (privé)
notes_priv (
  id uuid PK,
  moniteur_id uuid FK,
  eleve_id uuid FK,
  contenu text,
  UNIQUE(moniteur_id, eleve_id)
)

-- Notations élève → moniteur (étoiles)
notations (
  id uuid PK,
  eleve_id uuid FK, moniteur_id uuid FK,
  stars int CHECK (stars BETWEEN 1 AND 5),
  commentaire text
)
```

RLS active : chaque utilisateur voit uniquement les lignes dont il est propriétaire (eleve_id ou moniteur_id = `get_my_id()`).

---

## Contraintes intégration

1. **Pas de React** — fonctions vanilla qui retournent template literals
2. **Pas de localStorage/sessionStorage** pour la session app (utilisé seulement pour cache léger comme `ap-role`, `ap-nom`)
3. **Mobile-first** : breakpoints `@media (max-width: 768px)` et `@media (max-width: 480px)` déjà en place
4. **Échapper toujours** les données utilisateur via `esc(s)` (helper défini à la ligne 2446)
5. **Auth** : `sb` (client Supabase) déjà initialisé en haut, dispo globalement
6. **Profil actif** : `window.CUR_USER = {id, nom, email, role}` toujours défini après login

---

## Helpers JS dispos

```js
esc(s)                       // échappe HTML
toast(msg)                   // notification éphémère
navTo(pageId, title)         // change de page
logAction(action, table, recordId, details)  // audit log
sb.from('remc_entries').select().eq('eleve_id', CUR_USER.id)  // query Supabase
```
