import{E as f,z as g,e as s,j as d,u,d as m}from"./index-BAp2bzVE.js";import{g as v,b as h,o as k}from"./palier-sheet-D5S9iZ4K.js";import{animateCounter as y}from"./gestures-CSoaZJ63.js";import"./supabase-D2gm834s.js";import"./haptic-Cf_t5lnp.js";const b=`<style>
.pcp {
  max-width: 580px;
  margin: 0 auto;
  padding: 0 0 100px;
  background: var(--bg);
  font-family: 'Inter', sans-serif;
  color: var(--ink);
}

/* ═══════════════════════════ BLOC 1 — HERO ═══════════════════════ */
.pcp-hero {
  position: relative;
  overflow: hidden;
  padding: 48px 24px 32px;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  /* Ton sobre « Linear » : slate profond neutre, pas de néon */
  background: linear-gradient(165deg, #1e293b 0%, #0f172a 100%);
  border-bottom: 1px solid rgba(255,255,255,.06);
}

/* Fine ligne d'accent en haut — discrète, pas de mesh ni de grain */
.pcp-hero::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(99,102,241,.6), transparent);
  pointer-events: none;
}

.pcp-hero-content { position: relative; z-index: 1; }

.pcp-hero-label {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(255,255,255,.55);
  margin-bottom: 8px;
}
.pcp-hero-title {
  font: 800 44px/1.05 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  letter-spacing: -0.03em;
  margin: 0 0 20px;
  text-shadow: 0 2px 24px rgba(0,0,0,.3);
}
.pcp-hero-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}
.pcp-hero-stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.pcp-hero-stat-val {
  font: 700 24px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  letter-spacing: -0.02em;
}
.pcp-hero-stat-lbl {
  font: 500 11px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.6);
}
.pcp-hero-sep {
  width: 1px; height: 32px;
  background: rgba(255,255,255,.2);
  flex-shrink: 0;
}
.pcp-streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 99px;
  padding: 6px 12px;
  backdrop-filter: blur(8px);
}
.pcp-streak-fire {
  font-size: 16px;
  line-height: 1;
  filter: drop-shadow(0 0 6px rgba(251,146,60,.8));
}
.pcp-streak-val {
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
}
.pcp-streak-lbl {
  font: 500 11px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.7);
}

/* ═══════════════════════ BLOC 2 — NEXT UNLOCK ════════════════════ */
.pcp-next {
  margin: 20px 16px 0;
  border-radius: 28px;
  overflow: hidden;
  position: relative;
  min-height: 220px;
  /* Accent indigo sobre — outil utile, pas une loot box */
  background: linear-gradient(150deg, #4f46e5 0%, #6366f1 100%);
  box-shadow:
    0 12px 28px -14px rgba(79,70,229,.45),
    0 4px 10px -4px rgba(10,13,26,.12);
  animation: pcpNextIn .6s .1s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes pcpNextIn {
  from { opacity: 0; transform: translateY(16px) scale(.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.pcp-next::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 80% at 85% 20%, rgba(255,255,255,.18) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 15% 90%, rgba(255,255,255,.1) 0%, transparent 50%);
  pointer-events: none;
}

.pcp-next-inner {
  position: relative;
  z-index: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.pcp-next-label {
  font: 600 10px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(255,255,255,.6);
  margin-bottom: 20px;
}
.pcp-next-top {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.pcp-next-icon-wrap {
  width: 64px; height: 64px;
  border-radius: 20px;
  background: rgba(255,255,255,.18);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,.28);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}
.pcp-next-info { flex: 1; min-width: 0; }
.pcp-next-remaining {
  font: 800 28px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  letter-spacing: -0.03em;
  margin-bottom: 6px;
}
.pcp-next-remaining span {
  font: 500 13px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.7);
  letter-spacing: 0;
  margin-left: 4px;
}
.pcp-next-reward-label {
  font: 700 16px/1.3 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  margin-bottom: 3px;
}
.pcp-next-reward-desc {
  font: 500 12px/1.4 'Inter', sans-serif;
  color: rgba(255,255,255,.7);
}

/* Mystery mode */
.pcp-next-mystery .pcp-next-icon-wrap {
  filter: blur(2px);
}
.pcp-next-mystery .pcp-next-reward-label,
.pcp-next-mystery .pcp-next-reward-desc {
  filter: blur(5px);
  user-select: none;
}
.pcp-mystery-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 99px;
  padding: 4px 10px;
  font: 700 11px/1 'Inter', sans-serif;
  color: #fff;
  letter-spacing: .06em;
  text-transform: uppercase;
  margin-top: 8px;
}

/* Barre de progression */
.pcp-next-prog {
  margin-top: 4px;
}
.pcp-next-prog-track {
  height: 8px;
  background: rgba(255,255,255,.18);
  border-radius: 99px;
  overflow: hidden;
}
.pcp-next-prog-fill {
  height: 100%;
  background: var(--su);
  border-radius: 99px;
  width: 0; /* animé via JS */
  transition: width .9s cubic-bezier(.2,.7,.3,1);
  box-shadow: 0 0 12px rgba(255,255,255,.5);
}
.pcp-next-prog-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font: 500 11px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.7);
}
.pcp-next-prog-meta strong { color: #fff; }

/* All done */
.pcp-next-alldone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 24px;
  color: rgba(255,255,255,.9);
  text-align: center;
}
.pcp-next-alldone-ico {
  font-size: 48px;
  line-height: 1;
}
.pcp-next-alldone-title {
  font: 700 20px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #fff;
}
.pcp-next-alldone-sub {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: rgba(255,255,255,.7);
}

/* ═══════════════════════ BLOC 3 — ROADMAP MINI ═══════════════════ */
.pcp-road {
  margin: 20px 16px 0;
}
.pcp-road-title {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--mu2);
  margin-bottom: 12px;
}
.pcp-road-stops {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(10,13,26,.06);
}
.pcp-road-stop {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  position: relative;
  border-bottom: 1px solid var(--bo2);
  transition: background .12s;
}
.pcp-road-stop:last-of-type { border-bottom: none; }
.pcp-road-stop[role="button"] { cursor: pointer; -webkit-tap-highlight-color: transparent; }
.pcp-road-stop[role="button"]:active { background: rgba(99,102,241,.07); }
.pcp-road-stop:focus-visible { outline: 2px solid #6366f1; outline-offset: -2px; }
.pcp-road-stop.pcp-now { background: rgba(99,102,241,.04); }
.pcp-road-stop.pcp-blurred { opacity: .45; filter: blur(1.5px); pointer-events: none; user-select: none; }

.pcp-road-dot {
  width: 36px; height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.pcp-road-dot.done  { background: #10b981; color: #fff; }
.pcp-road-dot.now   { background: #fff; border: 2.5px solid #6366f1; color: #6366f1;
                       box-shadow: 0 0 0 4px rgba(99,102,241,.15); }
.pcp-road-dot.todo  { background: var(--bg2); border: 2px solid #e2e6f2; color: #94a3b8; }

.pcp-road-body { flex: 1; min-width: 0; }
.pcp-road-tier {
  font: 600 10px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--mu2);
  margin-bottom: 4px;
}
.pcp-road-stop.done .pcp-road-tier  { color: #10b981; }
.pcp-road-stop.pcp-now .pcp-road-tier { color: #6366f1; }

.pcp-road-name {
  font: 600 14px/1.3 'Inter', sans-serif;
  color: var(--ink);
}
.pcp-road-stop.done .pcp-road-name { color: #64748b; }

.pcp-road-reward {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  font: 500 11.5px/1 'Inter', sans-serif;
  color: #6366f1;
  background: rgba(99,102,241,.08);
  border-radius: 8px;
  padding: 3px 8px;
}
.pcp-road-stop.done .pcp-road-reward { color: #059669; background: rgba(16,185,129,.08); }

.pcp-road-badge {
  flex-shrink: 0;
  font: 600 11px/1 'Inter', sans-serif;
  padding: 4px 8px;
  border-radius: 99px;
}
.pcp-road-badge.done  { color: #059669; background: rgba(16,185,129,.1); }
.pcp-road-badge.now   { color: #fff; background: #6366f1; }
.pcp-road-badge.todo  { color: #94a3b8; background: var(--bg2); }

/* Bouton voir tout */
.pcp-see-all {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 14px;
  background: none;
  border: 1.5px solid var(--bo);
  border-radius: 14px;
  color: var(--mu);
  font: 600 13px/1 'Inter', sans-serif;
  cursor: pointer;
  transition: border-color .15s, color .15s, background .15s;
}
.pcp-see-all:hover { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,.04); }
.pcp-see-all:active { transform: scale(.98); }

/* Skeletons */
.pcp-skel {
  background: linear-gradient(90deg, #f0f2f8 0%, #e4e8f4 50%, #f0f2f8 100%);
  background-size: 200% 100%;
  animation: pcpShim 1.4s ease-in-out infinite;
  border-radius: 20px;
}
@keyframes pcpShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* Hero : slide only — toujours visible (pas de flash opacity: 0) */
.pcp-hero { animation: pcpHeroIn .4s cubic-bezier(.2,.7,.3,1) forwards; }
@keyframes pcpHeroIn {
  from { transform: translateY(10px); }
  to   { transform: translateY(0); }
}
/* Next + Road : fade-up séquentiels (.pcp-next garde pcpNextIn défini plus haut) */
.pcp-road { animation: pcpBlockIn .5s 240ms cubic-bezier(.2,.7,.3,1) both; }
@keyframes pcpBlockIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .pcp-hero, .pcp-next, .pcp-road { animation: none; }
  .pcp-next-prog-fill { transition: none; }
}
</style>`;let c=null;async function E(e){if(c=m(),!c||c.role!=="enseignant")return;f("page.view",{page:"parcours_pro"}),e.innerHTML=`${b}
    <div class="pcp">
      <div class="pcp-skel" style="height:300px;margin:0;border-radius:0"></div>
      <div class="pcp-skel" style="height:260px;margin:20px 16px 0"></div>
      <div class="pcp-skel" style="height:180px;margin:20px 16px 0"></div>
    </div>`;const[o,a]=await Promise.all([g.from("profiles").select("prenom, xp, streak_pro_days").eq("id",c.id).maybeSingle(),g.from("validations").select("id",{count:"exact",head:!0}).eq("validated_by",c.id)]),t=o.data||{},p=t.streak_pro_days??0,n=a.count??0,r=v(n),i=h();w(e,{me:t,streak:p,totalVals:n,state:r,stops:i})}function w(e,{me:o,streak:a,totalVals:t,state:p,stops:n}){var x;const r=((x=p.tier)==null?void 0:x.title)??"Débutant",i=t,l=o.xp??t*10;e.innerHTML=`${b}
    <div class="pcp">

      <!-- ══ BLOC 1 — HERO ══ -->
      <div class="pcp-hero">
        <div class="pcp-hero-content">
          <div class="pcp-hero-label">Niveau actuel</div>
          <h1 class="pcp-hero-title">${s(r)}</h1>
          <div class="pcp-hero-stats">
            <div class="pcp-hero-stat">
              <span class="pcp-hero-stat-val" data-counter="${i}">0</span>
              <span class="pcp-hero-stat-lbl">validations</span>
            </div>
            <div class="pcp-hero-sep"></div>
            <div class="pcp-hero-stat">
              <span class="pcp-hero-stat-val">${l.toLocaleString("fr-FR")}</span>
              <span class="pcp-hero-stat-lbl">XP total</span>
            </div>
            ${a>0?`
            <div class="pcp-hero-sep"></div>
            <div class="pcp-streak-badge">
              <span class="pcp-streak-fire">🔥</span>
              <span class="pcp-streak-val">${a}</span>
              <span class="pcp-streak-lbl">j. de suite</span>
            </div>`:""}
          </div>
        </div>
      </div>

      <!-- ══ BLOC 2 — NEXT UNLOCK ══ -->
      ${I(p)}

      <!-- ══ BLOC 3 — ROADMAP MINI ══ -->
      ${$(n,t)}

    </div>`,N(e,p.pctToNextReward??0,n,t)}function I(e){if(!e.nextReward)return`
      <div class="pcp-next">
        <div class="pcp-next-inner pcp-next-alldone">
          <div class="pcp-next-alldone-ico">🏆</div>
          <div class="pcp-next-alldone-title">Tous les paliers atteints</div>
          <div class="pcp-next-alldone-sub">Statut Expert REMC certifié débloqué.</div>
        </div>
      </div>`;const o=e.nextReward.data,a=o.unlock.iconName??"star",t=o.unlock.name??"—",p=o.title??"—",n=e.nextReward.missing??0,r=e.pctToNextReward??0;return`
    <div class="pcp-next">
      <div class="pcp-next-inner">
        <div class="pcp-next-label">Prochaine récompense</div>
        <div class="pcp-next-top">
          <div class="pcp-next-icon-wrap">
            ${d(a,{size:28,strokeWidth:2})}
          </div>
          <div class="pcp-next-info">
            <div class="pcp-next-remaining">
              ${n}<span>validation${n>1?"s":""} restantes</span>
            </div>
            <div class="pcp-next-reward-label">${s(t)}</div>
            <div class="pcp-next-reward-desc">${s(p)}</div>
          </div>
        </div>
        <div class="pcp-next-prog">
          <div class="pcp-next-prog-track">
            <div class="pcp-next-prog-fill" id="pcp-prog-fill" style="width:0%"></div>
          </div>
          <div class="pcp-next-prog-meta">
            <span>Progression</span>
            <strong>${r}%</strong>
          </div>
        </div>
      </div>
    </div>`}function $(e,o){const a=e.findIndex(p=>o<p.threshold);if(a===-1)return"";const t=[];return a>0&&t.push({...e[a-1],state:"done"}),t.push({...e[a],state:"now"}),a+1<e.length&&t.push({...e[a+1],state:"todo"}),`
    <div class="pcp-road">
      <div class="pcp-road-title">Ma route</div>
      <div class="pcp-road-stops">
        ${t.map(p=>S(p)).join("")}
      </div>
      <button class="pcp-see-all" id="pcp-see-all">
        Voir tous les paliers ${d("chevron-right",{size:14,strokeWidth:2.5})}
      </button>
    </div>`}function S(e){const o=`Palier ${e.tier.tier}`,a=e.tier.title,t=e.tier.unlock.name,p=e.tier.unlock.iconName,n=e.state==="done"?"Atteint":e.state==="now"?"Prochain":o,r=e.state,i=e.state==="done"?d("check",{size:15,strokeWidth:3}):d(p,{size:15,strokeWidth:2});return`
    <div class="pcp-road-stop ${r} ${e.state==="now"?"pcp-now":""}" data-tier="${e.tier.tier}" role="button" tabindex="0" aria-label="Détail du palier ${e.tier.tier}">
      <div class="pcp-road-dot ${r}">${i}</div>
      <div class="pcp-road-body">
        <div class="pcp-road-tier">${s(o)}</div>
        <div class="pcp-road-name">${s(a)}</div>
        <div class="pcp-road-reward">
          ${d(p,{size:11,strokeWidth:2.4})} ${s(t)}
        </div>
      </div>
      <span class="pcp-road-badge ${r}">${s(n)}</span>
    </div>`}function N(e,o,a=[],t=0){var n;requestAnimationFrame(()=>{setTimeout(()=>{const r=e.querySelector("#pcp-prog-fill");r&&(r.style.width=`${Math.min(100,o)}%`)},150)}),setTimeout(()=>{const r=e.querySelector("[data-counter]");r&&y(r,0,parseInt(r.dataset.counter,10)||0,800)},100);const p=r=>{const i=parseInt(r.dataset.tier,10),l=a.find(x=>x.tier.tier===i);l&&(f("parcours_pro.tier_detail",{tier:i}),k(l.tier,t))};e.querySelectorAll(".pcp-road-stop[data-tier]").forEach(r=>{r.addEventListener("click",()=>p(r)),r.addEventListener("keydown",i=>{(i.key==="Enter"||i.key===" ")&&(i.preventDefault(),p(r))})}),(n=e.querySelector("#pcp-see-all"))==null||n.addEventListener("click",()=>{f("parcours_pro.see_all"),u("#/parcours-complet")})}export{E as mount};
