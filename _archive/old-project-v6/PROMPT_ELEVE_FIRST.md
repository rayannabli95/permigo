# PROMPT v6.4 — "Élève-First" pour Autopilot

> Tient la promesse principale : **placer / modifier / annuler / programmer** une leçon avec un élève en 1-3 clics max, depuis n'importe où dans l'app.

## 🎯 OBJECTIF

Réduire de **8 clics → 2 clics** l'action "programmer une leçon avec un élève donné".
Faire passer le score UX moniteur de **6.5 → 8.5/10**.

## 📋 6 TÂCHES — par ordre d'impact

### TASK-EF-01 — Bouton "Modifier" dans modal m-event ⭐⭐⭐

Le bouton est manquant. Aujourd'hui : pour décaler une leçon, on supprime + recrée.

**Action :** dans `openEventActions(ev)`, ajouter un bouton **"✏️ Modifier"** entre Fermer et Annuler. Il ferme m-event et rouvre m-cren pré-rempli avec les données de l'événement (date, heure, durée, élève, lieu, type).

```js
const editBtn=document.createElement('button');
editBtn.className='btn btn-p';editBtn.textContent='✏️ Modifier';
editBtn.addEventListener('click',()=>{
  closeM('m-event');
  setTimeout(()=>{
    openCreneau(ev.h);
    // Pré-remplir les champs
    document.getElementById('c-elv').value=ev.n;
    document.getElementById('c-dur').value=ev.dur||1;
    // Marquer pour update au lieu de push
    window._editingEvent=ev;
  },200);
});
```

Et dans le handler `btn-valider`, si `window._editingEvent` existe : retirer l'ancien event puis push le nouveau.

### TASK-EF-02 — Section "⏳ Demandes en attente" en haut du planning ⭐⭐⭐

Ajouter une bannière au-dessus de la carte "Aujourd'hui" qui liste les leçons `t==='pend'` (en attente de confirmation moniteur). Pour chaque, deux boutons inline ✅ Confirmer / ❌ Refuser.

```html
<div id="pending-requests" style="display:none"></div>
```

```js
function renderPendingRequests(){
  const w=document.getElementById('pending-requests');if(!w)return;
  const pending=EVENTS.filter(e=>e.t==='pend');
  if(!pending.length){w.style.display='none';return;}
  w.style.display='block';
  w.innerHTML=`<div style="background:#fef3c7;border:1.5px solid #fcd34d;border-radius:var(--rl);padding:12px 14px;margin-bottom:10px">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#92400E;letter-spacing:.5px;margin-bottom:8px">⏳ ${pending.length} demande${pending.length>1?'s':''} en attente</div>
    ${pending.map((e,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid rgba(146,64,14,.15)">
      <div style="flex:1"><b>${esc(e.n)}</b> <span style="color:var(--mu);font-size:12px">· ${WEEK_DAYS[e.d-1]||''} ${e.h} · ${e.dur||1}h</span></div>
      <button class="pend-confirm btn btn-sm" data-i="${i}" style="background:var(--gr);color:#fff;border:none">✅ Confirmer</button>
      <button class="pend-reject btn btn-sm" data-i="${i}" style="background:var(--rd);color:#fff;border:none">✗ Refuser</button>
    </div>`).join('')}
  </div>`;
  w.querySelectorAll('.pend-confirm').forEach(b=>b.addEventListener('click',()=>{
    const ev=pending[parseInt(b.dataset.i)];if(!ev)return;
    ev.t='conf';persistEvents();renderPendingRequests();buildCalendar('cal-head','cal-body',calOff);renderToday();
    toast('✅ Confirmé · '+ev.n+' notifié(e)');
  }));
  w.querySelectorAll('.pend-reject').forEach(b=>b.addEventListener('click',()=>{
    const ev=pending[parseInt(b.dataset.i)];if(!ev)return;
    EVENTS=EVENTS.filter(e=>e!==ev);persistEvents();renderPendingRequests();buildCalendar('cal-head','cal-body',calOff);renderToday();
    toast('✗ Refusé · '+ev.n+' notifié(e)');
  }));
}
// Appeler renderPendingRequests() dans navTo('planning') et après toute mutation EVENTS
```

### TASK-EF-03 — Bouton "📅 Proposer 3 créneaux" sur fiche élève ⭐⭐⭐

Sur la fiche élève (sous "Proposer une leçon"), ajouter un bouton qui :
1. Trouve 3 créneaux libres dans la semaine (priorité aux mêmes plages horaires que les anciennes leçons de cet élève)
2. Affiche un mini-modal avec les 3 propositions
3. Valider crée 3 events `t='pend'` qui partent à l'élève pour confirmation

```html
<button class="btn btn-ai btn-w" id="btn-propose-3">📅 Proposer 3 créneaux</button>
```

```js
function suggest3Slots(eleveName){
  const occupied=new Set(EVENTS.map(e=>e.h+'_'+e.d));
  // Heures préférentielles : créneaux historiques de cet élève (pour démo : 9h, 14h, 16h)
  const preferred=['09:00','14:00','16:00','11:00','17:00'];
  const slots=[];
  for(let d=1;d<=5&&slots.length<3;d++){
    for(const h of preferred){
      if(!occupied.has(h+'_'+d)){slots.push({d,h,dur:1});break;}
    }
  }
  return slots.slice(0,3);
}
```

### TASK-EF-04 — Replacements intelligents (proximité temporelle)

Dans `openMonAnnul(ev)`, prioriser les créneaux libres les plus proches de l'heure annulée.

```js
function smartReplacements(ev){
  const occupied=new Set(EVENTS.map(e=>e.h+'_'+e.d));
  const refMin=parseInt(ev.h)*60;
  const candidates=[];
  // Même horaire les jours suivants
  for(let dOff=1;dOff<=5;dOff++){
    const d=ev.d+dOff;if(d>7)break;
    if(!occupied.has(ev.h+'_'+d))candidates.push({d,h:ev.h,score:100-dOff*10});
  }
  // Horaires proches le même jour ou le lendemain
  for(let d=ev.d;d<=Math.min(7,ev.d+2);d++){
    ['09:00','11:00','14:00','16:00','17:00'].forEach(h=>{
      if(h===ev.h&&d===ev.d)return;
      if(!occupied.has(h+'_'+d)){
        const diff=Math.abs(parseInt(h)*60-refMin)/60;
        candidates.push({d,h,score:50-diff*5-(d-ev.d)*10});
      }
    });
  }
  return candidates.sort((a,b)=>b.score-a.score).slice(0,4);
}
// Remplacer le scan brut dans openMonAnnul par smartReplacements(ev)
```

### TASK-EF-05 — Calendrier compact par défaut (8h-20h, Lun-Sam)

Réduire `HOURS` affiché par défaut. Toggle "🌙 Heures étendues" pour basculer.

```js
const HOURS_FULL=['06:00',...,'23:00']; // existant
const HOURS_COMPACT=['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
let extendedHours=STORE.getStr('ap-extended-hours','0')==='1';
let HOURS=extendedHours?HOURS_FULL:HOURS_COMPACT;
// Cacher dimanche par défaut : modifier WEEK_DAYS rendering pour dim conditionnel
```

Ajouter dans la barre du calendrier :
```html
<button id="btn-extend-hours" aria-label="Étendre les heures">🌙</button>
```

### TASK-EF-06 — Messages rapides élève sur fiche élève

Bloc "💬 Message rapide" avec 4 boutons :
- "🚗 J'arrive dans 5 min"
- "⏱ Je suis en retard de 10 min"
- "📍 Êtes-vous au point de RDV ?"
- "✓ Bien reçu, à demain"

Chaque bouton fait `toast('📲 SMS envoyé à '+studentName)` (en prod : appel API SMS).

```html
<div class="card mt3">
  <div class="ch"><div class="ct">💬 Message rapide</div></div>
  <div class="cb" id="quick-msg"></div>
</div>
```

```js
function renderQuickMsg(){
  const QM=['🚗 J\'arrive dans 5 min','⏱ Je suis en retard de 10 min','📍 Êtes-vous au point de RDV ?','✓ Bien reçu, à demain'];
  const w=document.getElementById('quick-msg');if(!w)return;w.innerHTML='';
  QM.forEach(m=>{
    const b=document.createElement('button');b.className='btn btn-g btn-sm';b.style.cssText='margin:3px;font-size:12px';b.textContent=m;
    b.addEventListener('click',()=>toast('📲 SMS envoyé : « '+m+' »'));w.appendChild(b);
  });
}
```

## ✅ CRITÈRES DE FIN

- [ ] Toutes les 6 tâches implémentées
- [ ] JS valide
- [ ] Aucune régression v6.3
- [ ] Smoke test moniteur : modifier une leçon = 2 clics, programmer = 2 clics depuis fiche élève
- [ ] CHANGELOG_v6.4.md mis à jour
- [ ] Zip généré
