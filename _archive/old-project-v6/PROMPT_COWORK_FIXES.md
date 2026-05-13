# PROMPT COWORK — Autopilot v6.1 → v6.2

> Copie-colle ce prompt dans Cowork (ou Claude Code) et l'agent exécutera toutes les corrections du rapport QA en autonomie.

---

## 🤖 RÔLE & CONTEXTE

Tu es **engineering agent** sur le projet **Autopilot** — application de gestion d'auto-école.

**Ta mission :** corriger les 23 issues identifiées dans `TEST_REPORT.md` pour passer la version de **v6.1 → v6.2 production-ready**.

**Fichier principal :** `autopilot.html` (mono-fichier HTML+CSS+JS, ~3500 lignes)
**Spec officielle :** `PROMPT_COWORK_FRONTEND.md` (couleurs, statuts white/yellow/red, palette bleue #2563eb — NE PAS CHANGER)
**Contraintes :**
- Ne casser aucune fonctionnalité existante
- Garder le mono-fichier (pas de build step)
- Ne réintroduire **aucune IA** (purgée volontairement en v6.1)
- Ne réintroduire **aucun CA / revenus** (appli logistique, pas compta)
- Pas de "Congé" dans les types d'absence (Maladie / Formation / Autre uniquement)
- Garder les vraies dates (jamais "33 avril")

**Vérifie après chaque tâche :**
```bash
node -e "const h=require('fs').readFileSync('autopilot.html','utf8');const m=h.match(/<script>([\s\S]+?)<\/script>/);try{new Function(m[1]);console.log('JS OK')}catch(e){console.log('ERR:',e.message)}"
```

---

## 🎯 TÂCHES À EXÉCUTER (priorité décroissante)

### ━━━ P1 — BLOQUANT POUR PROD ━━━

#### TASK-01 — Date du modal créneau dynamique [BUG-01]

**Fichier :** `autopilot.html` ligne ~1149
**Actuel :** `<input class="fi" type="date" id="c-date" value="2026-04-03">`
**Action :** Au moment d'`openCreneau()`, set `document.getElementById('c-date').value` à la date d'aujourd'hui au format `YYYY-MM-DD`.

**Code à ajouter dans `openCreneau(hour)` (ligne ~2105) :**
```js
const dateInp=document.getElementById('c-date');
if(dateInp){
  const t=new Date();
  const iso=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  dateInp.value=iso;
  // Min date = aujourd'hui (pas de dates passées)
  dateInp.min=iso;
}
```

**Critère d'acceptation :** Ouvrir modal +Créneau → champ Date pré-rempli avec date du jour, non modifiable vers le passé.

---

#### TASK-02 — Liste élèves modal dynamique [BUG-02]

**Fichier :** `autopilot.html` ligne ~1167
**Actuel :** `<select class="fi fsel" id="c-elv"><option>Arnaud Kenfack</option>... (6 hardcoded)`
**Action :** Vider la liste hardcodée et la remplir dynamiquement depuis `ELEVES` au moment d'ouvrir le modal.

**Modifier `openCreneau(hour)` :**
```js
const elvSel=document.getElementById('c-elv');
if(elvSel){
  elvSel.innerHTML='<option value="">Sélectionner…</option>';
  // Ne lister que les élèves actifs
  ELEVES.filter(e=>e.s==='Actif').forEach(e=>{
    const o=document.createElement('option');o.value=e.n;o.textContent=e.n;elvSel.appendChild(o);
  });
}
```

**Critère d'acceptation :** Modal créneau → 10 élèves actifs (pas 6), aucun inactif. Si on ajoute un élève dans ELEVES, il apparaît.

---

#### TASK-03 — Aria-labels sur tous les boutons icon-only [A11Y-01]

**Action :** Ajouter `aria-label="..."` sur **tous les boutons emoji-only** ou icon-only.

**Liste exhaustive (à grep dans le code) :**
- `tb-menu` ☰ → `aria-label="Ouvrir le menu"`
- `sb-logout` ↩ → `aria-label="Se déconnecter"`
- `cal-prev` ◀ → `aria-label="Semaine précédente"`
- `cal-next` ▶ → `aria-label="Semaine suivante"`
- `acal-prev` ◀ → `aria-label="Semaine précédente"`
- `acal-next` ▶ → `aria-label="Semaine suivante"`
- Boutons `data-close="..."` ✕ → `aria-label="Fermer"`
- Boutons photo 📷 → `aria-label="Changer la photo"`
- `fiche-back` ← → `aria-label="Retour"`
- `livret-back` ← → `aria-label="Retour"`
- Liens téléphone 📞 → `aria-label="Appeler {nom}"`
- Liens itinéraire 🗺 → `aria-label="Voir l'itinéraire"`
- Boutons étoiles `.star` → `aria-label="{n} étoiles"`
- Boutons compétence rouge/orange/vert dans livret → `aria-label="Marquer rouge/orange/vert"`

**Critère d'acceptation :** Lighthouse a11y score ≥ 90.

---

#### TASK-04 — Escape ferme les modals + focus trap [A11Y-04]

**Fichier :** `autopilot.html` — fonction `bind()` ligne ~3000

**Action :** Ajouter un listener global qui ferme la modal ouverte quand on appuie Escape.

```js
// Dans bind()
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    const openModal=document.querySelector('.mb.on');
    if(openModal){closeM(openModal.id);e.preventDefault();}
  }
});
```

**Bonus focus trap minimal :**
```js
function trapFocus(modalId){
  const m=document.getElementById(modalId);if(!m)return;
  const focusables=m.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]');
  if(!focusables.length)return;
  const first=focusables[0],last=focusables[focusables.length-1];
  setTimeout(()=>first.focus(),100);
  m.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    if(e.shiftKey && document.activeElement===first){last.focus();e.preventDefault();}
    else if(!e.shiftKey && document.activeElement===last){first.focus();e.preventDefault();}
  });
}
// Appeler trapFocus(id) dans openM(id)
```

**Aussi :** Ajouter à chaque `<div class="mb" id="m-...">` les attributs `role="dialog"` et `aria-modal="true"`.

**Critère d'acceptation :** Tab dans modal ne sort pas, Escape ferme.

---

#### TASK-05 — Photos : ne plus stocker en localStorage [SEC-01]

**Fichier :** `autopilot.html` — fonctions `renderProfilMon`, `renderProfilAdmin`, `renderProfilEleve`

**Problème :** Photos encodées en base64 dans localStorage → quota 5-10 Mo facilement atteint avec 3 photos HD.

**Action immédiate (v6.2) :** Compresser avant stockage.

```js
function compressImage(file, maxW=300){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        const scale=Math.min(1,maxW/img.width);
        canvas.width=img.width*scale;
        canvas.height=img.height*scale;
        const ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/jpeg',0.78));
      };
      img.onerror=reject;
      img.src=e.target.result;
    };
    r.onerror=reject;
    r.readAsDataURL(file);
  });
}
// Remplacer le FileReader direct par :
fileInp.addEventListener('change',async ev=>{
  const f=ev.target.files?.[0];if(!f)return;
  if(f.size>5*1024*1024){toast('⚠️ Image trop lourde (max 5 Mo)');return;}
  const compressed=await compressImage(f,300);
  av.style.backgroundImage='url('+compressed+')';av.textContent='';
  try{localStorage.setItem('ap-mon-photo',compressed);}catch(_){toast('⚠️ Stockage plein');}
  toast('📷 Photo mise à jour');
});
```

**Action V2 (backend prêt) :** TODO — remplacer par upload vers Supabase Storage.

**Critère d'acceptation :** Une photo 4 Mo est compressée à <100 Ko, l'app ne plante pas.

---

### ━━━ P2 — UX & SÉCURITÉ ━━━

#### TASK-06 — Plaque immat dynamique modal créneau [BUG-03]

**Fichier :** `autopilot.html` ligne ~1177
**Actuel :** `<div ... id="c-remun-line">🚗 HE-466-ZC · ...</div>`
**Action :** Remplacer la plaque hardcodée par celle du moniteur connecté.

```js
// Dans openCreneau, après buildLieux() :
const userPlate=MONS[0].pl; // V2: depuis session.user.plate
const remunLine=document.getElementById('c-remun-line');
if(remunLine){
  // Préserver le span avec id=c-remun
  remunLine.innerHTML='🚗 '+esc(userPlate)+' · <b id="c-remun" style="color:var(--mu)">Sélectionner un lieu</b>';
}
```

---

#### TASK-07 — Désactiver "Annuler quand même" sans motif [BUG-04]

**Fichier :** `autopilot.html` modal `m-annul`
**Action :** Le bouton `btn-conf-annul` doit être disabled tant que `annul-mot` est vide.

```js
// Dans bind()
const annulMot=document.getElementById('annul-mot');
const annulBtn=document.getElementById('btn-conf-annul');
function refreshAnnulBtn(){if(annulBtn)annulBtn.disabled=!annulMot?.value;}
annulMot?.addEventListener('change',refreshAnnulBtn);
// Reset à l'ouverture
const origOpenAnnul=openM;
// (intégrer dans openM ou faire un hook custom — simplifier : reset dans le toggle)
```

**Plus simple :** Ajouter `disabled` par défaut sur le bouton dans le HTML, et l'activer via JS quand le select change.

```html
<button class="btn btn-p" id="btn-conf-annul" style="background:var(--rd)" disabled>Annuler quand même</button>
```

---

#### TASK-08 — Mode démo : 3 boutons stylés au lieu de prompt [UX-01]

**Fichier :** `autopilot.html` — auth screen + buildSplash

**Action :** Remplacer le `window.prompt()` du `btn-demo` par un mini-popup visuel.

Modifier le HTML pour ajouter un mini-modal ou panneau dépliable :

```html
<div id="demo-panel" style="display:none;background:var(--bg);border:1px solid var(--bo);border-radius:9px;padding:10px;margin-top:8px;text-align:center">
  <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Choisis un rôle de démo :</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
    <button type="button" class="auth-btn-ghost demo-role" data-role="admin">👔 Gérant</button>
    <button type="button" class="auth-btn-ghost demo-role" data-role="moniteur">🧑‍🏫 Moniteur</button>
    <button type="button" class="auth-btn-ghost demo-role" data-role="eleve">🎓 Élève</button>
  </div>
</div>
```

JS :
```js
document.getElementById('btn-demo')?.addEventListener('click',()=>{
  document.getElementById('demo-panel').style.display='block';
});
document.querySelectorAll('.demo-role').forEach(b=>{
  b.addEventListener('click',()=>{
    const r=b.dataset.role;
    try{localStorage.setItem('ap-role',r);}catch(_){}
    hideAuth();switchRole(r);toast('🎭 Mode démo : '+r);
  });
});
```

**Critère d'acceptation :** Cliquer "🎭 Mode démo" → 3 boutons stylés bleus apparaissent en dessous, un clic = entrée dans le rôle.

---

#### TASK-09 — Trier "Aussi aujourd'hui" + état leçon [UX-02]

**Fichier :** `autopilot.html` — fonction `renderToday()`

**Action :** Trier les leçons restantes par heure et afficher leur état (passée / en cours / à venir).

```js
const nowMin=today.getHours()*60+today.getMinutes();
function lessonState(ev){
  const startMin=parseInt(ev.h.split(':')[0])*60+parseInt(ev.h.split(':')[1]||0);
  const endMin=startMin+(ev.dur||1)*60;
  if(endMin<=nowMin)return 'past';
  if(startMin<=nowMin)return 'current';
  return 'future';
}
// Trier
dayEvts.sort((a,b)=>a.h.localeCompare(b.h));
// Dans la liste "Aussi aujourd'hui", ajouter un badge selon state
const st=lessonState(e);
const stColor=st==='past'?'rgba(255,255,255,.4)':st==='current'?'#fbbf24':'#fff';
const stIco=st==='past'?'✓':st==='current'?'⏱':'';
// Inclure stIco + dim opacity si past
```

---

#### TASK-10 — Confirmation suppression stylisée [UX-03]

**Fichier :** `autopilot.html` — fonction `openEventActions`

**Action :** Remplacer `window.confirm()` par un petit modal in-line.

Une approche simple : ajouter une étape dans le modal `m-event` lui-même.

```js
delBtn.addEventListener('click',()=>{
  // Étape 1 : remplacer le footer par confirmation
  const ft=document.getElementById('m-event-ft');
  ft.innerHTML='<div style="flex:1;font-size:13px;font-weight:600;color:var(--rd);text-align:left">Confirmer la suppression ?</div>';
  const cancelB=document.createElement('button');cancelB.className='btn btn-g';cancelB.textContent='Annuler';
  const confirmB=document.createElement('button');confirmB.className='btn btn-p';confirmB.style.background='var(--rd)';confirmB.textContent='✓ Supprimer';
  cancelB.addEventListener('click',()=>openEventActions(ev)); // reset
  confirmB.addEventListener('click',()=>{
    EVENTS=EVENTS.filter(e=>e!==ev);persistEvents();
    closeM('m-event');
    if(curPage==='planning'){buildCalendar('cal-head','cal-body',calOff);renderToday();}
    if(curPage==='cal-admin')renderCalAdmin();
    toast('🗓 Événement supprimé');
  });
  ft.appendChild(cancelB);ft.appendChild(confirmB);
});
```

---

#### TASK-11 — Pénalité chiffrée modal annulation [UX-04]

**Fichier :** `autopilot.html` modal `m-annul` ligne ~1190
**Action :** Calculer et afficher le montant de la facturation.

```html
<div style="background:var(--amp)..."><div>...
  <div style="font-size:14px;font-weight:800;color:var(--rd);margin-top:8px" id="annul-cost">Cette leçon de 1h sera facturée 22,50 €</div>
</div>
```

JS dans `checkAnnul(free)` :
```js
function checkAnnul(free,ev){
  if(free){toast('✅ Annulation gratuite');return;}
  const cost=document.getElementById('annul-cost');
  if(cost && ev){
    const dur=ev.dur||1;
    const rate=LIEUX_DATA[0]?.r||22.5;
    cost.textContent=`Cette leçon de ${dur}h sera facturée ${(dur*rate).toFixed(2).replace('.',',')} €`;
  }
  openM('m-annul');
}
```

---

#### TASK-12 — Contraste --mu2 [A11Y-02]

**Fichier :** `autopilot.html` ligne ~15
**Actuel :** `--mu2:#9CA3AF` (ratio 2.85:1 sur blanc — fail WCAG AA 4.5:1)
**Action :** Passer à `#6B7280` (ratio 4.69:1 — pass AA)

```css
/* Avant */
--mu2:#9CA3AF;
/* Après */
--mu2:#6B7280;
```

**Vérifier :** que tout le texte gris reste lisible mais pas trop foncé.

---

#### TASK-13 — Labels sur tous les inputs [A11Y-07]

**Fichier :** `autopilot.html` — recherche `<input` sans `aria-label` ni `<label for>`

**Action :** Pour chaque input qui a un placeholder mais pas de label associé, ajouter un `aria-label`.

Exemples :
```html
<input class="fi" id="elv-srch" ... placeholder="Rechercher…" aria-label="Rechercher un élève">
<input class="fi" id="login-email" ... placeholder="vous@exemple.fr" aria-label="Adresse email">
<input class="fi" id="signup-pwd" ... placeholder="8 caractères min." aria-label="Mot de passe">
```

**12 inputs concernés.** Faire un grep `<input` et ajouter aria-label.

---

#### TASK-14 — Audit innerHTML : esc() partout [SEC-02]

**Fichier :** `autopilot.html` — chercher `innerHTML` avec `${...}` qui contient des données utilisateur.

**Action :** Vérifier que chaque variable interpolée est passée par `esc()`.

Exemples à corriger :
```js
// AVANT (risqué)
heroDiv.innerHTML=`<div>${user.name}</div>`;
// APRÈS
heroDiv.innerHTML=`<div>${esc(user.name)}</div>`;
```

**Vérification :** chercher `\$\{[a-z]\w*\.[a-z]` dans les `innerHTML` et s'assurer que le contenu est wrappé.

---

#### TASK-15 — Content Security Policy [SEC-03]

**Fichier :** `autopilot.html` — `<head>`

**Action :** Ajouter une CSP stricte.

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://maps.google.com;
  connect-src 'self';
  frame-ancestors 'none';
">
```

**Vérifier :** que tout marche encore (notamment polices Google, photos en data:URL).

---

### ━━━ P3 — POLISH ━━━

#### TASK-16 — Persistance "lu" notifications [UX-05]

```js
// Au chargement, restaurer
const readNotifs=STORE.get('ap-notifs-read',[]);
NOTIFS.forEach((n,i)=>{if(readNotifs.includes(i))n.u=false;});
// Au clic
row.addEventListener('click',()=>{
  dot.className='ni-dot r';n.u=false;
  const arr=STORE.get('ap-notifs-read',[]);
  if(!arr.includes(NOTIFS.indexOf(n))){arr.push(NOTIFS.indexOf(n));STORE.set('ap-notifs-read',arr);}
});
```

#### TASK-17 — ⌘K = recherche globale OU retirer

Décision : **retirer** le bouton `⌘K` (pas implémenté = noise).

**Fichier :** `autopilot.html` — `renderTopActs()`
```js
// Retirer la ligne :
if(pg==='planning'){addBtn('tb-ghost','⌘K',()=>toast('⌘K bientôt disponible'));...}
// → 
if(pg==='planning'){addBtn('tb-p','＋ Créneau',()=>openCreneau(null));notifBtn();}
```

#### TASK-18 — Spinner upload photo [UX-07]

```js
fileInp.addEventListener('change',async ev=>{
  const f=ev.target.files?.[0];if(!f)return;
  av.style.opacity='0.5';avEdit.textContent='⏳';
  const compressed=await compressImage(f,300);
  av.style.backgroundImage='url('+compressed+')';av.textContent='';av.style.opacity='1';avEdit.textContent='📷';
  // ...
});
```

#### TASK-19 — Collapse sections REMC [UX-08]

Dans `renderCompGrid`, wrapper chaque section C1/C2/C3/C4 dans un `<details>` HTML5.

```js
REMC.forEach(comp=>{
  const sec=document.createElement('details');
  sec.open=comp.id==='C1'; // C1 ouvert par défaut
  const summary=document.createElement('summary');
  summary.style.cssText='font-family:var(--fd);font-size:12px;font-weight:700;cursor:pointer;padding:6px 10px;background:var(--bg);border-radius:var(--r);';
  summary.textContent=comp.ico+' '+comp.id+' — '+comp.name;
  sec.appendChild(summary);
  // ... contenu existant
  g.appendChild(sec);
});
```

#### TASK-20 — Undo dans toast pour suppression [UX-09]

Faire un `toast()` enrichi avec bouton Undo.

```js
function toastUndo(msg,undoFn){
  const t=document.getElementById('toast');
  t.innerHTML=esc(msg)+' <button id="undo-btn" style="margin-left:10px;background:rgba(255,255,255,.2);color:#fff;border:none;padding:3px 9px;border-radius:5px;font-size:11px;cursor:pointer">Annuler</button>';
  t.classList.add('on');
  document.getElementById('undo-btn').addEventListener('click',()=>{undoFn();t.classList.remove('on');});
  clearTimeout(tTO);tTO=setTimeout(()=>t.classList.remove('on'),5000);
}
// Usage : sauvegarder l'event avant suppr, puis :
const removed=ev;
EVENTS=EVENTS.filter(e=>e!==ev);persistEvents();
toastUndo('🗓 Leçon supprimée',()=>{EVENTS.push(removed);persistEvents();/* refresh views */});
```

#### TASK-21 — NOTIFS dynamiques [BUG-06]

Remplacer les `tm:'Hier 18:45'` par des timestamps relatifs calculés.

```js
const NOTIFS=[
  {u:true,ico:'📖',t:'Livret rempli — Arnaud Kenfack',b:'...',ts:Date.now()-5*60*1000},
  // ...
];
function relTime(ts){
  const d=Date.now()-ts;const m=d/60000;
  if(m<1)return 'À l\'instant';if(m<60)return 'Il y a '+Math.round(m)+' min';
  const h=m/60;if(h<24)return 'Il y a '+Math.round(h)+'h';
  const j=h/24;return 'Il y a '+Math.round(j)+'j';
}
// Dans renderNotifs : tm.textContent=relTime(n.ts);
```

#### TASK-22 — Limiter MutationObserver scope [PERF]

**Fichier :** `bootRippleObserver()`
```js
// AVANT
mo.observe(document.body,{childList:true,subtree:true});
// APRÈS
['#pw','#auth-screen','.mb'].forEach(sel=>{
  document.querySelectorAll(sel).forEach(el=>mo.observe(el,{childList:true,subtree:true}));
});
```

#### TASK-23 — Skip-to-content link [A11Y bonus]

Ajouter en début de `<body>` :
```html
<a href="#pw" class="skip-link">Aller au contenu</a>
<style>
.skip-link{position:absolute;top:-40px;left:0;background:var(--a);color:#fff;padding:8px 14px;z-index:9999;text-decoration:none;border-radius:0 0 8px 0;}
.skip-link:focus{top:0;}
</style>
```

---

## ✅ CRITÈRES DE FIN DE MISSION

L'agent considère la mission accomplie quand :

```
[ ] Toutes les TASK-01 à TASK-15 (P1+P2) sont implémentées
[ ] JS valide (node check passe)
[ ] L'app charge sans erreur console
[ ] Smoke test manuel : login moniteur → créer leçon → remplir livret → OK
[ ] Lighthouse a11y score ≥ 85 (depuis 50)
[ ] Aucune régression sur les fonctionnalités v6.1 (carte Aujourd'hui, calendrier réel, status white/yellow/red, taux 51%, persistance, dark mode)
[ ] CHANGELOG.md mis à jour avec les changements
[ ] Le zip final est généré
```

---

## 📝 LIVRABLES ATTENDUS

À la fin de la mission, l'agent fournit :

1. `autopilot.html` modifié (avec toutes les corrections)
2. `CHANGELOG_v6.2.md` listant les TASK-XX traitées
3. Un mini-rapport de smoke-test (résultat de chaque test du checklist ci-dessus)
4. Un nouveau zip `autopilot-v6.2.zip`
5. Si certaines tâches sont skipped, expliquer pourquoi

---

## 🚦 ORDRE D'EXÉCUTION RECOMMANDÉ

```
1. P1 (TASK 01 → 05) — bloquants
   ↓ tester
2. P2 sécurité + a11y (TASK 12, 13, 14, 15)
   ↓ tester
3. P2 UX (TASK 06 → 11)
   ↓ tester
4. P3 polish (TASK 16 → 23)
   ↓ smoke test final
5. CHANGELOG + zip
```

---

## ⚠️ PIÈGES À ÉVITER

- **Ne pas réintroduire l'IA** — `AI_SIM`, `AGENTS`, `runAgent`, etc. Si tu vois une référence, c'est qu'elle a été oubliée → la retirer.
- **Ne pas réintroduire le CA** — pas de KPI "CA semaine", pas d'export avec colonnes financières.
- **Ne pas casser le calendrier réel** — `getWeekDates()`, `DATES`, `MONTHS_DISP` doivent rester en place.
- **Garder mono-fichier** — pas de `<script src="...">` externe (sauf Google Fonts).
- **Tester sur 3 rôles** — chaque modif doit marcher pour admin/moniteur/élève.
- **Préserver la persistance** — chaque mutation d'état (EVENTS, LIEUX_DATA, etc.) doit appeler son `persist*()`.

---

## 💡 BONUS (si temps disponible)

- Tests Playwright minimaux : `npx playwright codegen` sur les 3 parcours
- Lighthouse audit avant / après dans le CHANGELOG
- Service Worker basique pour offline first
- PWA manifest pour install mobile

---

**Bonne mission.** En cas de doute sur une tâche, demande à l'utilisateur avant de modifier.
