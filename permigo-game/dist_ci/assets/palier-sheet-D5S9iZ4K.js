import{j as k,e as b}from"./index-BAp2bzVE.js";const i=[{tier:1,threshold:3,title:"Enseignant — Démarrage",unlock:{iconName:"file-text",name:"Export PDF du livret élève",desc:"Génère un PDF propre du livret REMC d'un élève (compétences acquises, dates, commentaires). Pratique pour un point parent ou un dossier examen."}},{tier:2,threshold:8,title:"Enseignant confirmé",unlock:{iconName:"chart-bar",name:"Tableaux de bord détaillés par élève",desc:"Une vue par élève : progression compétence par compétence, rythme d'acquisition et points à retravailler, pour préparer la prochaine séance."}},{tier:3,threshold:15,title:"Enseignant confirmé",unlock:{iconName:"clipboard",name:"Modèles de bilans mensuels",desc:"Des trames prêtes à remplir pour le bilan mensuel d'un élève. Tu gagnes du temps et tu gardes une trace structurée de son évolution."}},{tier:4,threshold:30,title:"Enseignant chevronné",unlock:{iconName:"target",name:"Mode préparation à l'examen",desc:"Un mode dédié à l'approche de l'examen : check-list des points sensibles et suivi des dernières compétences à sécuriser avant le jour J."}},{tier:5,threshold:50,title:"Enseignant chevronné",unlock:{iconName:"trending-up",name:"Comparaison avec d'autres écoles (anonyme)",desc:"Situe tes indicateurs (rythme, validations) par rapport à d'autres auto-écoles, de façon totalement anonyme. Aucune donnée nominative."}},{tier:6,threshold:80,title:"Référent pédagogique",unlock:{iconName:"award",name:"Profil visible par les nouveaux élèves",desc:"Ton profil enseignant peut être mis en avant auprès des nouveaux élèves de l'école, avec ton expérience et tes spécialités."}},{tier:7,threshold:120,title:"Référent pédagogique",unlock:{iconName:"book",name:"Formation continue",desc:"Accès aux modules de formation continue PermiGo : mises à jour REMC, pédagogie et nouveautés réglementaires."}},{tier:8,threshold:170,title:"Référent pédagogique",unlock:{iconName:"users",name:"Mentorat de nouveaux moniteurs",desc:"Tu peux accompagner les enseignants débutants de ton réseau : partage de méthodes et suivi de leurs premiers mois."}},{tier:9,threshold:230,title:"Expert REMC",unlock:{iconName:"shield",name:"Communauté privée experts REMC",desc:"Rejoins l'espace privé des enseignants experts : échanges de cas concrets, ressources avancées et entraide entre pairs."}},{tier:10,threshold:300,title:"Expert REMC certifié",unlock:{iconName:"sparkle",name:"Statut Expert REMC certifié",desc:"Le palier le plus élevé : statut Expert REMC certifié PermiGo, qui reconnaît ton expérience et la qualité de ton suivi pédagogique."}}],f=i[i.length-1].threshold,E=[{month:0,name:"Janvier — Nouveau départ",accent:"#0ea5e9",badge:"Saisonnier hiver"},{month:1,name:"Février — Cap maintenu",accent:"#6366f1",badge:"Saisonnier hiver"},{month:2,name:"Mars — Premier souffle",accent:"#10b981",badge:"Saisonnier printemps"},{month:3,name:"Avril — Élan",accent:"#84cc16",badge:"Saisonnier printemps"},{month:4,name:"Mai — Pleine accélération",accent:"#f59e0b",badge:"Saisonnier printemps"},{month:5,name:"Juin — Examen blanc",accent:"#f97316",badge:"Saisonnier été"},{month:6,name:"Juillet — Permanence",accent:"#eab308",badge:"Saisonnier été"},{month:7,name:"Août — Repli stratégique",accent:"#a855f7",badge:"Saisonnier été"},{month:8,name:"Septembre — Rentrée",accent:"#3b82f6",badge:"Saisonnier automne"},{month:9,name:"Octobre — Cadence",accent:"#d946ef",badge:"Saisonnier automne"},{month:10,name:"Novembre — Concentration",accent:"#0891b2",badge:"Saisonnier automne"},{month:11,name:"Décembre — Wrapped",accent:"#ec4899",badge:"Saisonnier hiver"}];function y(e=0){const s=Math.max(0,Math.floor(e)),a=Math.min(f,s);let n=null;for(const r of i)if(a>=r.threshold)n=r;else break;const p=n?i.findIndex(r=>r.tier===n.tier):-1,o=p+1<i.length?i[p+1]:null;let d=null;o&&(d={kind:"tier",threshold:o.threshold,label:o.unlock.name,data:o,missing:o.threshold-a});let t=100;if(d){const r=n?n.threshold:0,c=d.threshold-r,u=a-r;t=c>0?Math.max(0,Math.min(100,Math.round(u/c*100))):100}const m=E[new Date().getMonth()];return{tier:n,nextTier:o,nextReward:d,pctToNextReward:t,isMax:a>=f,saison:m,validations:a,maxVal:f}}function M(){return i.map(e=>({threshold:e.threshold,kind:"tier",tier:e})).sort((e,s)=>e.threshold-s.threshold)}let x=!1,v=null,l=null;const w=`<style id="palier-sheet-style">
.psheet-ov {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(15,23,42,.5);
  backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
  display: flex; align-items: flex-end; justify-content: center;
  opacity: 0; transition: opacity .2s ease;
}
.psheet-ov.show { opacity: 1; }
.psheet {
  width: 100%; max-width: 580px;
  background: var(--su, #fff);
  border-radius: 24px 24px 0 0;
  padding: 8px 20px calc(24px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -8px 32px rgba(10,13,26,.18);
  transform: translateY(100%); transition: transform .26s cubic-bezier(.2,.7,.3,1);
  font-family: 'Inter', sans-serif; color: var(--ink, #0f172a);
}
.psheet-ov.show .psheet { transform: translateY(0); }
.psheet-grab {
  width: 38px; height: 4px; border-radius: 99px;
  background: var(--bo, #e2e6f2);
  margin: 8px auto 16px;
}
.psheet-head { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.psheet-icon {
  width: 52px; height: 52px; border-radius: 16px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(99,102,241,.1); color: #6366f1;
}
.psheet-icon.done { background: rgba(16,185,129,.1); color: #059669; }
.psheet-head-info { flex: 1; min-width: 0; }
.psheet-tier {
  font: 600 11px/1 'Inter', sans-serif; letter-spacing: .08em;
  text-transform: uppercase; color: var(--mu2, #94a3b8); margin-bottom: 4px;
}
.psheet-title {
  font: 700 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink, #0f172a); letter-spacing: -0.02em; margin: 0;
}
.psheet-badge {
  flex-shrink: 0; font: 600 11px/1 'Inter', sans-serif;
  padding: 5px 9px; border-radius: 99px; white-space: nowrap;
}
.psheet-badge.done { color: #059669; background: rgba(16,185,129,.12); }
.psheet-badge.todo { color: #4f46e5; background: rgba(99,102,241,.1); }
.psheet-reward-lbl {
  font: 600 10px/1 'Inter', sans-serif; letter-spacing: .1em;
  text-transform: uppercase; color: var(--mu2, #94a3b8); margin-bottom: 6px;
}
.psheet-reward-name {
  font: 700 16px/1.3 'Plus Jakarta Sans', sans-serif;
  color: var(--ink, #0f172a); margin-bottom: 8px;
}
.psheet-reward-desc {
  font: 500 13.5px/1.55 'Inter', sans-serif; color: var(--mu, #64748b);
}
.psheet-meta {
  margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--bo2, #eef1f7);
  font: 500 12.5px/1.4 'Inter', sans-serif; color: var(--mu2, #94a3b8);
}
.psheet-meta strong { color: var(--ink, #0f172a); font-weight: 700; }
.psheet-close {
  width: 100%; margin-top: 18px; padding: 13px;
  background: var(--bg2, #f1f3f9); border: none; border-radius: 14px;
  color: var(--ink, #0f172a); font: 600 14px/1 'Inter', sans-serif;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background .12s;
}
.psheet-close:active { background: #e2e6f2; }
@media (prefers-reduced-motion: reduce) {
  .psheet-ov, .psheet { transition: none; }
}
</style>`;function R(e,s=0){var m,r,c,u;if(!e)return;!x&&!document.getElementById("palier-sheet-style")&&(document.head.insertAdjacentHTML("beforeend",w),x=!0),h();const a=s>=e.threshold,n=Math.max(0,e.threshold-s),p=((m=e.unlock)==null?void 0:m.iconName)??"star",o=a?'<span class="psheet-badge done">Atteint</span>':`<span class="psheet-badge todo">+${n} validation${n>1?"s":""}</span>`,d=a?`Palier débloqué à <strong>${e.threshold} validation${e.threshold>1?"s":""}</strong>.`:`Encore <strong>${n} validation${n>1?"s":""}</strong> pour débloquer ce palier (seuil : ${e.threshold}).`,t=document.createElement("div");t.className="psheet-ov",t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),t.innerHTML=`
    <div class="psheet" role="document">
      <div class="psheet-grab"></div>
      <div class="psheet-head">
        <div class="psheet-icon ${a?"done":""}">
          ${k(p,{size:26,strokeWidth:2})}
        </div>
        <div class="psheet-head-info">
          <div class="psheet-tier">Palier ${e.tier}</div>
          <h2 class="psheet-title">${b(e.title)}</h2>
        </div>
        ${o}
      </div>
      <div class="psheet-reward-lbl">${a?"Récompense débloquée":"Récompense à débloquer"}</div>
      <div class="psheet-reward-name">${b(((r=e.unlock)==null?void 0:r.name)??"—")}</div>
      <div class="psheet-reward-desc">${b(((c=e.unlock)==null?void 0:c.desc)??"")}</div>
      <div class="psheet-meta">${d}</div>
      <button class="psheet-close" type="button">Fermer</button>
    </div>`,document.body.appendChild(t),v=t,t.addEventListener("click",g=>{g.target===t&&h()}),(u=t.querySelector(".psheet-close"))==null||u.addEventListener("click",h),l=g=>{g.key==="Escape"&&h()},document.addEventListener("keydown",l),requestAnimationFrame(()=>t.classList.add("show"))}function h(){l&&(document.removeEventListener("keydown",l),l=null);const e=v;if(!e)return;v=null,e.classList.remove("show");const s=()=>e.remove();e.addEventListener("transitionend",s,{once:!0}),setTimeout(s,320)}export{M as b,y as g,R as o};
