# 03 — Patches code · Côté enseignant · PermiGo

> Date : 2026-05-21. Format AVANT/APRÈS, `file:line` vérifiés. **Aucun fichier `.js` ni migration n'est modifié par ce document** — ce sont des patches à appliquer après validation, sur une branche dédiée. Stack : vanilla JS, Supabase. Les snippets respectent `esc()`, le singleton `sb`, le pattern `{ data, error }`.
>
> Ordre d'application recommandé : DB-001 (débloque le RPC) → #P1, #P2 → #P3 → #P4/DB-002 → #P5..#P9.

---

## DB-001 — Résoudre la surcharge `log_session` (🔴 Bugs #7, #9, #14)

**Problème** : deux signatures `public.log_session` coexistent en prod (`0007_rpc_recovery.sql`, ≈ lignes 2087 et 2151). L'appel nommé est ambigu → `Could not choose the best candidate function`.

**Migration** (nouveau fichier `supabase/migrations/0008_log_session_v2.sql`) — à valider sur branche Supabase avant prod, **ne pas toucher la prod directement** :

```sql
-- 0008_log_session_v2.sql
-- Signature UNIQUE, remplace la surcharge ambiguë de log_session.
-- p_comment = commentaire visible élève ; p_notes = note interne moniteur.

CREATE OR REPLACE FUNCTION public.log_session_v2(
  p_eleve_id          uuid,
  p_duration_minutes  integer,
  p_session_date      date          DEFAULT CURRENT_DATE,
  p_competence_ids    text[]        DEFAULT NULL,
  p_comment           text          DEFAULT NULL,   -- visible élève
  p_notes             text          DEFAULT NULL    -- interne moniteur
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  -- Corps repris VERBATIM de la signature B existante (0007 ≈ ligne 2151),
  -- avec p_comment et p_notes désormais stockés dans leurs colonnes
  -- respectives (commentaire visible vs note interne), sans COALESCE qui
  -- écrasait l'un par l'autre.
  -- … (copier la logique d'insertion validations + session existante) …
  RETURN v_result;
END;
$function$;

-- Filet de sécurité : on garde temporairement les anciennes signatures,
-- mais le front n'appelle plus que log_session_v2. Drop des surcharges
-- APRÈS confirmation que plus aucun client n'appelle log_session :
-- DROP FUNCTION IF EXISTS public.log_session(uuid, integer, date, text);
-- DROP FUNCTION IF EXISTS public.log_session(uuid, integer, date, text, text[], text);
```

**Pourquoi** : (1) une seule signature → fin de l'ambiguïté Postgres ; (2) `p_comment` et `p_notes` séparés → le commentaire élève cesse d'être écrasé/mal routé (Bug #9) ; (3) drop différé = pas de coupure pour d'anciens clients.

---

## #P1 — `src/pages/enseignant/log-session.js:629-660` (🔴 Bugs #7, #9)

**AVANT** (lignes 626-636 + gestion d'erreur 637-660)
```js
const compIds  = _comps.size > 0 ? [..._comps] : undefined;
const noteVal  = _comment.trim() || null;

try {
  const { data, error } = await sb.rpc('log_session', {
    p_eleve_id:        _eleve,
    p_duration_minutes: _duration,
    p_session_date:    _date,
    p_notes:           noteVal,
    ...(compIds ? { p_competence_ids: compIds } : {}),
  });

  if (error || data?.error) {
    const rawCode = error?.code || '';
    const rawMsg  = error?.message || data?.error || '';
    // …
    friendlyMsg = RPC_ERRORS[rawMsg] ?? RPC_ERRORS[rawCode] ?? rawMsg ?? "Erreur lors de l'enregistrement";
    toast(friendlyMsg, 'error');           // ← expose rawMsg brut si non mappé
    if (btn) { btn.disabled = false; btn.classList.remove('ls-loading'); }
    return;
  }
```

**APRÈS**
```js
const compIds   = _comps.size > 0 ? [..._comps] : undefined;
const commentVal = _comment.trim() || null;   // commentaire VISIBLE élève

try {
  const { data, error } = await sb.rpc('log_session_v2', {
    p_eleve_id:         _eleve,
    p_duration_minutes: _duration,
    p_session_date:     _date,
    p_competence_ids:   compIds ?? null,
    p_comment:          commentVal,   // → colonne commentaire visible élève
    p_notes:            null,         // note interne réservée à un futur champ dédié
  });

  if (error || data?.error) {
    // Trace technique réservée au dev — jamais affichée à l'utilisateur
    console.error('[log-session] log_session_v2 error', {
      code: error?.code, message: error?.message,
      details: error?.details, hint: error?.hint, dataError: data?.error,
    });
    // Message générique vouvoyé, sans exposition technique
    const friendly = RPC_ERRORS[error?.code] ?? RPC_ERRORS[data?.error]
      ?? "Enregistrement impossible pour le moment. Veuillez réessayer.";
    toast(friendly, 'error');
    if (btn) { btn.disabled = false; btn.classList.remove('ls-loading'); }
    return;
  }
```

**Pourquoi** : (1) appelle la signature unique `log_session_v2` → plus d'overload ; (2) le commentaire part dans `p_comment` (visible élève, Bug #9) ; (3) `RPC_ERRORS` clés **par code** uniquement, fallback générique → `error.message` brut n'atteint jamais l'UI (Bug #7).

---

## #P2 — `src/components/log-session-modal.js:682-692` (🟠 Bug #14)

**AVANT**
```js
const { data, error } = await sb.rpc('log_session', {
  p_eleve_id: selectedEleve,
  p_duration_minutes: selectedDuration,
  p_session_date: sessionDate,
  p_notes: commentVal,
  ...(compIds ? { p_competence_ids: compIds } : {}),
  ...(commentVal ? { p_comment: commentVal } : {}),   // ← p_notes + p_comment = overload ambigu
});

if (error) {
  toast(ERROR_MSG[error.message] || error.message || 'Erreur lors du log', 'error');   // ← message brut
```

**APRÈS**
```js
const { data, error } = await sb.rpc('log_session_v2', {
  p_eleve_id:         selectedEleve,
  p_duration_minutes: selectedDuration,
  p_session_date:     sessionDate,
  p_competence_ids:   compIds ?? null,
  p_comment:          commentVal,   // visible élève
  p_notes:            null,
});

if (error) {
  console.error('[log-session-modal] log_session_v2 error', { code: error.code, message: error.message });
  toast(ERROR_MSG[error.code] || "Enregistrement impossible pour le moment. Veuillez réessayer.", 'error');
```

**Pourquoi** : aligne le modal sur la signature unique (supprime la cause de l'ambiguïté) et coupe l'exposition de `error.message`.

---

## #P3 — FAB vs bottom nav (🔴 Bug #15)

**Option retenue** : un seul FAB, le bouton central de la nav (`nav-bottom.js`, M3 Expressive). On retire le FAB flottant.

**AVANT** — `src/components/log-session-fab.js:30-33`
```js
#log-session-fab {
  position: fixed;
  right: 20px;
  bottom: calc(86px + env(safe-area-inset-bottom, 0px));
  z-index: 250;          /* < nav (300) → passe dessous + chevauche la nav */
```

**APRÈS — variante A (recommandée)** : ne plus monter le FAB flottant ; le bouton « + Séance » central de la nav (`nav-bottom.js` tab `__fab__`, lignes 27/148-150) devient l'unique point d'entrée. Supprimer l'appel de montage du FAB dans le routeur (`router.js:75` gère déjà `unmountLogSessionFab()` ; retirer le mount correspondant).

**APRÈS — variante B (si le FAB flottant doit rester temporairement)** :
```js
#log-session-fab {
  position: fixed;
  right: 20px;
  bottom: calc(76px + 16px + env(safe-area-inset-bottom, 0px)); /* au-dessus de la nav */
  z-index: 320;          /* > nav (300) → toujours au-dessus */
```

**Pourquoi** : élimine le doublon de FAB et le passage sous la nav. Variante A = cohérente M3 Expressive (5 tabs + FAB central) et évite deux boutons pour la même action.

---

## #P4 — `src/pages/enseignant/parcours.js:566-569` (🔴 Bug #20)

**AVANT**
```js
const [validationsRes, profileRes] = await Promise.all([
  sb.from('validations')
    .select('id, eleve_id, statut, validated_at')
    .eq('validated_by', _me.id)
    .order('validated_at', { ascending: false }),   // ← aucun .limit(), tout chargé + agrégé en JS
  // …
]);
```

**APRÈS** — déléguer l'agrégation au serveur + cache local :
```js
// Cache 5 min pour éviter le refetch à chaque montée de page
const CACHE_KEY = `parcours_agg_${_me.id}`;
const cached = readCache(CACHE_KEY, 5 * 60 * 1000);   // util local sessionStorage
let agg = cached;

if (!agg) {
  const { data, error } = await sb.rpc('get_moniteur_parcours_agg', { p_moniteur_id: _me.id });
  if (error) {
    console.error('[parcours] agg error', { code: error.code });
    toast('Chargement du parcours impossible pour le moment.', 'error');
    return;
  }
  agg = data;                       // { total_validations, par_eleve, top_eleves, palier, skin_active, … }
  writeCache(CACHE_KEY, agg);
}
// agg fournit déjà les compteurs → plus de boucle O(n) sur des centaines de lignes
```

**Migration associée DB-002** (`supabase/migrations/0009_parcours_agg.sql`) :
```sql
-- Index pour les requêtes par moniteur
CREATE INDEX IF NOT EXISTS idx_validations_validated_by_at
  ON public.validations (validated_by, validated_at DESC);

-- RPC d'agrégation : renvoie les compteurs déjà calculés côté serveur
CREATE OR REPLACE FUNCTION public.get_moniteur_parcours_agg(p_moniteur_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT jsonb_build_object(
    'total_validations', COUNT(*),
    'par_eleve', jsonb_object_agg(eleve_id, n) FILTER (WHERE eleve_id IS NOT NULL),
    'top_eleves', (… top 10 …)
  )
  FROM (
    SELECT eleve_id, COUNT(*) n
    FROM validations
    WHERE validated_by = p_moniteur_id AND statut = 'acquis'
    GROUP BY eleve_id
  ) s;
$function$;
```

**Pourquoi** : l'agrégation passe du client (boucle JS sur tout l'historique) au serveur (une requête indexée), + cache 5 min. Cible < 1,5 s contre ~5 min.

---

## #P5 — `src/pages/enseignant/log-session.js:297` (🔴 Bug #10)

**AVANT**
```js
<div class="ls-visibility-tag">${icon('eye', { size: 11, strokeWidth: 2, color: '#94a3b8' })} Visible par l'élève et l'auto-école</div>
```

**APRÈS**
```js
<div class="ls-visibility-tag">
  ${icon('eye', { size: 14, strokeWidth: 2, color: '#475569' })}
  <span>Visible par l'élève et l'auto-école</span>
</div>
```
CSS associé :
```css
.ls-visibility-tag {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-radius: 8px;
  background: #EEF0FF; color: #475569;          /* contraste ≥ 4.5:1 sur #EEF0FF */
  font: 600 13px/1.4 'Inter', sans-serif;
}
```

**Pourquoi** : remonte une info de confidentialité critique de gris pâle (≈ 2.8:1, échec AA) à un bandeau lisible conforme WCAG 2.2 AA.

---

## #P6 — `src/pages/enseignant/livret-remc.js:219-240` + `:762` (🔴 Bug #28)

**AVANT (CSS 219-240)** : `.lr-overlay` et `.lr-sheet` animées, **sans** garde.
**APRÈS** — ajouter après les keyframes :
```css
@media (prefers-reduced-motion: reduce) {
  .lr-overlay, .lr-sheet { animation: none !important; }
  .lr-sheet { transform: translateY(0); }
}
```

**AVANT (JS ≈762)**
```js
function closeSheet(overlay) {
  overlay.style.animation = 'lr-overlay-in .18s ease reverse';
  setTimeout(() => overlay.remove(), 180);
}
```
**APRÈS**
```js
function closeSheet(overlay) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { overlay.remove(); return; }
  overlay.style.animation = 'lr-overlay-in .18s ease reverse';
  setTimeout(() => overlay.remove(), 180);
}
```

**Pourquoi** : conformité WCAG 2.2 SC 2.3.3, côté CSS **et** JS.

---

## #P7 — `src/components/header-top.js:71-83` (🔴 Bug #30)

**AVANT** — logo seul, aucun menu compte :
```js
<button class="pg-logo-btn" id="ht-logo" aria-label="Accueil PermiGo">
  <span class="pg-logo-txt sm">PermiGo</span>
</button>
```

**APRÈS** — ajouter un avatar utilisateur + menu (à droite du header) :
```js
<button class="ht-avatar-btn" id="ht-account" aria-haspopup="menu" aria-expanded="false"
        aria-label="Menu du compte">
  <span class="ht-avatar">${esc(initials(_me.prenom, _me.nom))}</span>
</button>
<!-- menu rendu à l'ouverture -->
<div class="ht-menu" id="ht-menu" role="menu" hidden>
  <button role="menuitem" data-go="#/profil">Profil</button>
  <button role="menuitem" data-go="#/auto-ecole">Auto-école</button>
  <button role="menuitem" id="ht-logout">Déconnexion</button>
</div>
```
Comportement : ouverture au clic (`aria-expanded` synchronisé), fermeture Échap + clic extérieur, focus trap, items 44 px, `data-go` → `navigate(...)`, `ht-logout` → `sb.auth.signOut()`.

**Pourquoi** : ajoute Profil / Auto-école / Déconnexion, aujourd'hui inaccessibles depuis l'UI. Le logo gauche reste le retour accueil.

---

## #P8 — Vouvoiement (🔴/🟠 Bugs #3, #5, #13, #19, #25)

| Fichier:ligne | AVANT | APRÈS |
|---|---|---|
| `aujourdhui.js:563` | `par tes élèves` | `par vos élèves` |
| `aujourdhui.js:641` | `clique pour voir` | `cliquez pour voir` |
| `aujourdhui.js:652` | `Enregistre ta première séance` | `Enregistrez votre première séance` |
| `mes-eleves.js:554` & `:827` | `Ton gérant doit t'attribuer…` | `Votre gérant doit vous attribuer…` |
| `log-session-modal.js:546` & `:628` | `Pourquoi tu valides ces compétences ?` | `Pourquoi validez-vous ces compétences ?` |
| `log-session.js:711` | `Que veux-tu faire ?` | `Que souhaitez-vous faire ?` |
| `validation.js:377` | `Tu débloques la compétence…` | `Vous débloquez la compétence…` |
| `insights.js:590-593` | `Lance ta semaine` / `…ton streak pro.` | `Lancez votre semaine` / `…votre série pro.` |
| `insights.js:~619` | `Tes élèves progressent bien. Continue…` | `Vos élèves progressent bien.` |

**Pourquoi** : vouvoiement 100 % côté pro (réf. Ornikar/Doctolib). Suppression du registre « coach/streak » infantilisant.

---

## #P9 — `src/pages/enseignant/aujourdhui.js:362-365` + `:730` (🟠 Bug #1)

**AVANT** — heure seule, ambiguë sur plusieurs jours :
```js
function formatHeure(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
```
**APRÈS** — libellé relatif daté :
```js
function formatHeure(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const j0 = new Date(); j0.setHours(0,0,0,0);
  const dj = new Date(d); dj.setHours(0,0,0,0);
  const diffJ = Math.round((j0 - dj) / 86400000);
  if (diffJ === 0) return `Aujourd'hui ${heure}`;
  if (diffJ === 1) return `Hier ${heure}`;
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} ${heure}`;
}
```
Optionnel (spec) : regrouper l'activité récente par jour avec en-têtes. Render ligne 730 inchangé (consomme `formatHeure`).

**Pourquoi** : lève l'illusion de tri cassé en datant chaque entrée. La liste reste triée serveur par `validated_at` desc.

---

## Vérification avant merge (rappel CLAUDE.md)

Depuis `permigo-game/` :
```
npm run lint && npm run build
npm run test        # flows critiques : log-session, validation
```
- Migrations `0008`/`0009` : valider sur **branche Supabase** avant prod (ne pas toucher la prod directement).
- Vérifier `esc()` sur toute donnée injectée dans les nouveaux snippets (avatar initiales, menu).
- Vérifier le rendu sur preview Vercel avant merge ; une branche par patch (`fix/`).
