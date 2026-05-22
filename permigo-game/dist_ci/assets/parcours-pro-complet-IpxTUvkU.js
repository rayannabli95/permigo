import{E as k,j as p,u as m,z as y,C as $,e as g,d as S}from"./index-BAp2bzVE.js";import{g as L,b as I,o as q}from"./palier-sheet-D5S9iZ4K.js";import{haptic as b}from"./haptic-Cf_t5lnp.js";import"./supabase-D2gm834s.js";const v=`<style>
.epc-full {
  max-width: 580px;
  margin: 0 auto;
  padding: 0 0 120px;
  background: var(--bg);
  font-family: 'Inter', sans-serif;
  color: var(--ink);
}

/* Header sticky */
.epc-full-hd {
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 10;
  background: rgba(248,249,252,.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 12px 20px 10px;
  border-bottom: 1px solid var(--bo);
  display: flex;
  align-items: center;
  gap: 10px;
}
.epc-full-back {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--bg2);
  border: none;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--ink);
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: background .12s;
}
.epc-full-back:active { background: #e2e6f2; transform: scale(.93); }
.epc-full-hd-info { flex: 1; min-width: 0; }
.epc-full-h1 {
  font: 700 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -0.02em;
  margin: 0;
}
.epc-full-sub {
  font: 500 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  margin: 3px 0 0;
}

/* Progress pill */
.epc-full-pill {
  font: 700 12px/1 'IBM Plex Mono', monospace;
  color: #6366f1;
  background: rgba(99,102,241,.1);
  padding: 6px 10px;
  border-radius: 99px;
  flex-shrink: 0;
  white-space: nowrap;
}

/* Route card */
.epc-full-route {
  margin: 16px;
  padding: 20px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 24px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 2px 4px rgba(10,13,26,.06);
}

/* ── Stops timeline (mêmes règles que parcours.js) ── */
.epcf-stop {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 10px 0;
  position: relative;
}
.epcf-stop:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 17px;
  top: 38px;
  bottom: -10px;
  width: 2px;
  background: #e2e8f0;
}
.epcf-stop.done:not(:last-child)::before { background: #10b981; }
.epcf-stop-dot {
  width: 36px; height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--su);
  border: 2.5px solid #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  z-index: 1;
  color: var(--mu2);
  margin-top: 2px;
}
.epcf-stop.done .epcf-stop-dot {
  background: #10b981;
  border-color: #10b981;
  color: #fff;
}
.epcf-stop.now .epcf-stop-dot {
  background: var(--su);
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99,102,241,.2);
  width: 44px; height: 44px;
  margin-left: -4px;
  margin-top: -2px;
}
.epcf-stop.locked .epcf-stop-dot { opacity: .5; }
.epcf-stop-body { flex: 1; min-width: 0; padding: 2px 0; }
.epcf-stop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.epcf-stop-lvl {
  font: 700 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  text-transform: uppercase;
  letter-spacing: .06em;
}
.epcf-stop.now .epcf-stop-lvl  { color: #6366f1; }
.epcf-stop.done .epcf-stop-lvl { color: #10b981; }
.epcf-stop-cost {
  font: 600 11px/1 'Inter', sans-serif;
  padding: 4px 8px;
  border-radius: 99px;
  white-space: nowrap;
  flex-shrink: 0;
}
.epcf-stop-cost.done { color: #059669; background: rgba(16,185,129,.12); }
.epcf-stop-cost.now  { color: #fff; background: #6366f1; }
.epcf-stop-cost.todo { color: #64748b; background: var(--bg2); }
.epcf-stop-title {
  font: 600 14px/1.3 'Inter', sans-serif;
  color: var(--ink);
  margin-bottom: 6px;
}
.epcf-stop.locked .epcf-stop-title { color: #94a3b8; }
.epcf-stop.done  .epcf-stop-title  { color: #64748b; }
.epcf-stop-reward {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(99,102,241,.08);
  border: 1px solid rgba(99,102,241,.2);
  border-radius: 10px;
  color: #6366f1;
  margin-top: 4px;
}
.epcf-stop-reward.unlocked {
  background: rgba(16,185,129,.08);
  border-color: rgba(16,185,129,.2);
  color: #059669;
}
.epcf-stop-reward-ico { display: flex; align-items: center; flex-shrink: 0; }
.epcf-stop-skin-img {
  width: 22px; height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}
.epcf-stop-reward-txt {
  font: 500 12px/1.3 'Inter', sans-serif;
}
.epcf-stop-reward-txt strong { font-weight: 700; }

/* Stop cliquable → ouvre le détail du palier */
.epcf-stop[role="button"] { cursor: pointer; -webkit-tap-highlight-color: transparent; border-radius: 12px; transition: background .12s; }
.epcf-stop[role="button"]:active { background: rgba(99,102,241,.06); }
.epcf-stop:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }

/* Cercle Or halo */
.epcf-stop.cercle-or.done .epcf-stop-dot {
  background: radial-gradient(circle, rgba(245,158,11,.3), transparent 70%);
  animation: epcfGoldHalo 2.4s ease-in-out infinite;
}
@keyframes epcfGoldHalo {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,.5); }
  50%       { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
}

/* Skeleton */
.epcf-skel {
  background: linear-gradient(90deg, #f0f2f8 0%, #e4e8f4 50%, #f0f2f8 100%);
  background-size: 200% 100%;
  animation: epcfShim 1.4s ease-in-out infinite;
  border-radius: 20px;
}
@keyframes epcfShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

@media (prefers-reduced-motion: reduce) {
  .epcf-stop.cercle-or.done .epcf-stop-dot { animation: none !important; }
}
</style>`;async function H(e){var u,x;const s=S();if(!s||s.role!=="enseignant")return;k("page.view",{page:"enseignant_parcours_complet"}),e.innerHTML=`${v}
    <div class="epc-full">
      <div class="epc-full-hd">
        <button class="epc-full-back" aria-label="Retour au parcours" id="epcf-back">
          ${p("arrow-left",{size:18,strokeWidth:2.5})}
        </button>
        <div class="epc-full-hd-info">
          <h1 class="epc-full-h1">Tous les paliers</h1>
          <p class="epc-full-sub">Chargement…</p>
        </div>
      </div>
      <div class="epcf-skel" style="height:120px;margin:16px"></div>
      <div class="epcf-skel" style="height:200px;margin:16px"></div>
    </div>`,(u=e.querySelector("#epcf-back"))==null||u.addEventListener("click",()=>{b("select"),m("#/parcours")});const{count:f,error:r}=await y.from("validations").select("id",{count:"exact",head:!0}).eq("validated_by",s.id);if(r){$("Impossible de charger le parcours","error");return}const t=f??0,c=L(t),a=I(),n=a.filter(o=>t>=o.threshold).length;e.innerHTML=`${v}
    <div class="epc-full anim-slide-up">

      <div class="epc-full-hd">
        <button class="epc-full-back" aria-label="Retour au parcours" id="epcf-back">
          ${p("arrow-left",{size:18,strokeWidth:2.5})}
        </button>
        <div class="epc-full-hd-info">
          <h1 class="epc-full-h1">Tous les paliers</h1>
          <p class="epc-full-sub">${g(c.saison.name)} · ${t} validation${t>1?"s":""}</p>
        </div>
        <div class="epc-full-pill">${n}/${a.length}</div>
      </div>

      <div class="epc-full-route">
        ${a.map(o=>z(o,t)).join("")}
      </div>

    </div>`,(x=e.querySelector("#epcf-back"))==null||x.addEventListener("click",()=>{b("select"),m("#/parcours")});const l=o=>{const i=parseInt(o.dataset.tier,10),h=a.find(w=>w.tier.tier===i);h&&(b("select"),k("parcours_complet.tier_detail",{tier:i}),q(h.tier,t))};e.querySelectorAll(".epcf-stop[data-tier]").forEach(o=>{o.addEventListener("click",()=>l(o)),o.addEventListener("keydown",i=>{(i.key==="Enter"||i.key===" ")&&(i.preventDefault(),l(o))})});const d=e.querySelector(".epcf-stop.now");d&&setTimeout(()=>d.scrollIntoView({behavior:"smooth",block:"center"}),400)}function z(e,s){const f=e.tier.tier,r=s>=e.threshold?"done":"todo",t=f===10,c=e.tier.unlock.iconName,a=r==="done"?p("check",{size:16,strokeWidth:3}):p(c,{size:15,strokeWidth:2}),n=e.threshold-s,l=r==="done"?`<span class="epcf-stop-cost done">Atteint · ${e.threshold} valid.</span>`:`<span class="epcf-stop-cost todo">+${n} validation${n>1?"s":""}</span>`,d=`
    <div class="epcf-stop-reward ${r==="done"?"unlocked":""}">
      <span class="epcf-stop-reward-ico">${p(c,{size:14,strokeWidth:2.4})}</span>
      <span class="epcf-stop-reward-txt">
        ${r==="done"?"Débloqué : ":"Débloque : "}
        <strong>${g(e.tier.unlock.name)}</strong>
      </span>
    </div>
  `;return`
    <div class="${["epcf-stop",r,"tier",t?"cercle-or":""].filter(Boolean).join(" ")}" data-tier="${e.tier.tier}" role="button" tabindex="0" aria-label="Détail du palier ${e.tier.tier}">
      <div class="epcf-stop-dot">${a}</div>
      <div class="epcf-stop-body">
        <div class="epcf-stop-head">
          <span class="epcf-stop-lvl">Palier ${e.tier.tier}</span>
          ${l}
        </div>
        <div class="epcf-stop-title">${g(e.tier.title)}</div>
        ${d}
      </div>
    </div>
  `}export{H as mount};
