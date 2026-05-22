const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-BAp2bzVE.js","assets/supabase-D2gm834s.js","assets/index-95YKe9dn.css"])))=>i.map(i=>d[i]);
import{e as u,z as x,_ as g,A as G,b as Y,E as S,j as w,p as X,l as B,d as W,x as K,w as Q}from"./index-BAp2bzVE.js";import{g as Z,A as ee}from"./assets-BmjtGWPC.js";import{haptic as y}from"./haptic-Cf_t5lnp.js";import{a as P}from"./remc-Bj_VT2nz.js";import"./supabase-D2gm834s.js";const re=[{p:0,threshold:0,name:"Débutant",emoji:"🌱",accent:"#94a3b8"},{p:1,threshold:10,name:"Apprenti",emoji:"🌿",accent:"#10b981"},{p:2,threshold:20,name:"Confirmé",emoji:"🚗",accent:"#6366f1"},{p:3,threshold:30,name:"Expert",emoji:"👑",accent:"#f59e0b"}],ae=[{p:0,threshold:0,name:"Débutant",emoji:"✏️",accent:"#94a3b8"},{p:1,threshold:10,name:"Confirmé",emoji:"📘",accent:"#06b6d4"},{p:2,threshold:25,name:"Expert",emoji:"🎯",accent:"#0ea5e9"},{p:3,threshold:50,name:"Mentor",emoji:"🧭",accent:"#6366f1"},{p:4,threshold:100,name:"Coach",emoji:"🚀",accent:"#8b5cf6"},{p:5,threshold:200,name:"Maître",emoji:"🏅",accent:"#ec4899"},{p:6,threshold:350,name:"Légende",emoji:"⭐",accent:"#f59e0b"},{p:7,threshold:500,name:"Icône",emoji:"🌟",accent:"#f97316"},{p:8,threshold:750,name:"Mythique",emoji:"🔥",accent:"#ef4444"},{p:9,threshold:1e3,name:"Sage",emoji:"🦉",accent:"#db2777"},{p:10,threshold:1500,name:"Élite",emoji:"💎",accent:"#7c3aed"}];function te(r,a=0){const e=r==="enseignant"?ae:re,t=e[e.length-1].threshold;let c=e[0],i=e[1]||null;for(let l=0;l<e.length&&a>=e[l].threshold;l++)c=e[l],i=e[l+1]||null;let p=100;if(i){const l=i.threshold-c.threshold,n=a-c.threshold;p=Math.max(0,Math.min(100,Math.round(n/l*100)))}return{current:c,next:i,pctToNext:p,max:t}}const ne=`<style>
.pc-wrap {
  perspective: 1200px;
  padding: 16px 0;
  display: flex;
  justify-content: center;
}
.pc {
  position: relative;
  width: 100%;
  max-width: 340px;
  aspect-ratio: 1 / 1.58;
  border-radius: 24px;
  padding: 24px 20px 20px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform .4s cubic-bezier(.2,.7,.3,1), box-shadow .4s ease;
  isolation: isolate;
  user-select: none;
  -webkit-user-select: none;
}

/* Shine effect au touch / hover (skill emil-design-eng : ease-out custom, < 200ms entrée) */
.pc::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,.28) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform .65s cubic-bezier(0.23, 1, 0.32, 1);
  pointer-events: none;
  z-index: 1;
}
/* hover seulement sur device avec vrai pointer (évite faux trigger sur touch) */
@media (hover: hover) and (pointer: fine) {
  .pc:hover::before { transform: translateX(100%); }
}
.pc:active::before { transform: translateX(100%); }
.pc:active { transform: scale(0.985); transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1); }

/* Background image premium (mesh / route / holographic selon palier) */
.pc-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  opacity: .55;
  mix-blend-mode: overlay;
  pointer-events: none;
  animation: pcBgIn .6s cubic-bezier(.23,1,.32,1) both;
  transition: opacity .4s ease;
}
@keyframes pcBgIn {
  from { opacity: 0; transform: scale(1.08); }
  to   { opacity: .55; transform: scale(1); }
}
/* État "Prêt" (palier route) : opacité un poil + + très subtle shift */
.pc.s-pret .pc-bg { opacity: .62; }
/* État "Validé" (palier holographique) : opacité max + screen blend + shift animé */
.pc.s-valide .pc-bg {
  opacity: .78;
  mix-blend-mode: screen;
  animation: pcBgIn .6s cubic-bezier(.23,1,.32,1) both, pcHoloShift 9s ease-in-out infinite alternate;
}
@keyframes pcHoloShift {
  0%   { background-position: 0%   50%; filter: hue-rotate(0deg) saturate(1.05); }
  50%  { background-position: 100% 50%; filter: hue-rotate(15deg) saturate(1.15); }
  100% { background-position: 0%   50%; filter: hue-rotate(-10deg) saturate(1.05); }
}
@media (prefers-reduced-motion: reduce) {
  .pc-bg { animation: none !important; }
  .pc.s-valide .pc-bg { animation: none !important; filter: none !important; }
}

/* Grain texture pour effet matière (au-dessus du PNG) */
.pc::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255,255,255,.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,.04) 0%, transparent 50%);
  pointer-events: none;
  z-index: 1;
}

/* ─── États visuels ─── */
.pc.s-formation {
  background:
    linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%);
  box-shadow:
    0 10px 30px -10px rgba(100,116,139,.5),
    0 4px 12px rgba(10,13,26,.08);
}
.pc.s-pret {
  background:
    linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #8b5cf6 100%);
  box-shadow:
    0 16px 40px -12px rgba(99,102,241,.55),
    0 4px 12px rgba(10,13,26,.1);
}
.pc.s-valide {
  background:
    linear-gradient(135deg, #d97706 0%, #f59e0b 40%, #fde68a 100%);
  box-shadow:
    0 20px 50px -10px rgba(245,158,11,.6),
    0 0 0 1px rgba(254,243,199,.4),
    0 4px 12px rgba(10,13,26,.1);
  animation: pcGlow 3s ease-in-out infinite;
}
@keyframes pcGlow {
  0%, 100% {
    box-shadow:
      0 20px 50px -10px rgba(245,158,11,.5),
      0 0 0 1px rgba(254,243,199,.4),
      0 4px 12px rgba(10,13,26,.1);
  }
  50% {
    box-shadow:
      0 24px 60px -8px rgba(245,158,11,.75),
      0 0 0 1px rgba(254,243,199,.6),
      0 4px 12px rgba(10,13,26,.1);
  }
}

/* ─── Sections ─── */
.pc-inner { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; }

.pc-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: auto;
}
.pc-flag {
  width: 28px; height: 20px;
  border-radius: 4px;
  background: linear-gradient(90deg, #002395 33.33%, #fff 33.33% 66.66%, #ED2939 66.66%);
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,.15);
}
.pc-brand {
  font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: .04em;
  background: rgba(255,255,255,.18);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 99px;
  border: 1px solid rgba(255,255,255,.22);
}

.pc-label {
  font: 600 9.5px/1 'Inter', sans-serif;
  letter-spacing: .18em;
  text-transform: uppercase;
  opacity: .82;
  margin: 16px 0 4px;
}
.pc-title {
  font: 700 19px/1.15 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.01em;
  margin: 0 0 2px;
}
.pc-subtitle {
  font: 500 11px/1 'Inter', sans-serif;
  opacity: .75;
  margin: 0 0 18px;
}

/* Avatar + nom inline */
.pc-id {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.pc-av {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: rgba(255,255,255,.16);
  border: 1.5px solid rgba(255,255,255,.3);
  display: flex; align-items: center; justify-content: center;
  font: 700 18px/1 'Plus Jakarta Sans', sans-serif;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.pc-id-info { min-width: 0; }
.pc-nom {
  font: 700 16px/1.2 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-prenom {
  font: 500 12px/1 'Inter', sans-serif;
  opacity: .82;
  margin-top: 3px;
}

/* Meta rows */
.pc-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.pc-meta-item {
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 10px;
  padding: 8px 10px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.pc-meta-lbl {
  font: 600 9px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  opacity: .72;
  margin-bottom: 4px;
}
.pc-meta-val {
  font: 600 12px/1.2 'Inter', sans-serif;
}

/* Footer : progression + sceau */
.pc-foot { margin-top: auto; display: flex; align-items: flex-end; gap: 12px; }
.pc-prog { flex: 1; min-width: 0; }
.pc-prog-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}
.pc-prog-lbl {
  font: 600 9.5px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  opacity: .78;
}
.pc-prog-pct {
  font: 700 22px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.02em;
}
.pc-prog-bar {
  height: 5px;
  background: rgba(0,0,0,.18);
  border-radius: 99px;
  overflow: hidden;
}
.pc-prog-fill {
  height: 100%;
  background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,.85) 100%);
  border-radius: 99px;
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}

/* Sceau / cachet */
.pc-sceau {
  flex-shrink: 0;
  width: 70px; height: 70px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 2px solid currentColor;
  font: 800 8px/1.05 'Plus Jakarta Sans', sans-serif;
  letter-spacing: .04em;
  text-transform: uppercase;
  transform: rotate(-8deg);
  padding: 4px;
  background: rgba(255,255,255,.96);
}
.pc.s-formation .pc-sceau { color: #b91c1c; }
.pc.s-pret      .pc-sceau { color: #b45309; }
.pc.s-valide    .pc-sceau {
  color: #047857;
  animation: pcSceauPulse 2.4s ease-in-out infinite;
}
.pc-sceau-ico { font-size: 14px; line-height: 1; margin-bottom: 2px; }
@keyframes pcSceauPulse {
  0%, 100% { transform: rotate(-8deg) scale(1); }
  50%      { transform: rotate(-8deg) scale(1.06); }
}

/* Hint sous la carte */
.pc-hint {
  text-align: center;
  font: 500 11px/1.4 'Inter', sans-serif;
  color: #94a3b8;
  margin-top: 12px;
  padding: 0 24px;
}

@media (prefers-reduced-motion: reduce) {
  .pc, .pc::before, .pc.s-valide, .pc.s-valide .pc-sceau { animation: none !important; transition: none !important; }
}
</style>`;function ie(r){return r>=70?{key:"valide",label:"Validé",ico:"✓"}:r>=30?{key:"pret",label:"Prêt à l'examen",ico:"◐"}:{key:"formation",label:"En formation",ico:"◯"}}function oe(r,a){const e=(r||"").trim()[0]||"",t=(a||"").trim()[0]||"";return(e+t).toUpperCase()||"?"}function se(r){if(!r)return"—";try{return new Date(r).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"})}catch{return"—"}}function ce({prenom:r="",nom:a="",created_at:e=null,validated:t=0,total:c=31}){const i=Math.min(100,Math.round(t/c*100)),p=ie(i),l=oe(r,a),n=Z(t,"eleve");return`${ne}
<div class="pc-wrap">
  <div class="pc s-${p.key}" role="img" aria-label="Carte permis - ${u(p.label)}">
    <div class="pc-bg" style="background-image:url('${u(n)}')"></div>
    <div class="pc-inner">

      <div class="pc-top">
        <div class="pc-flag" aria-hidden="true"></div>
        <div class="pc-brand">PermiGo</div>
      </div>

      <div class="pc-label">Permis de conduire</div>
      <div class="pc-title">Catégorie B</div>
      <div class="pc-subtitle">Véhicules légers · Apprentissage</div>

      <div class="pc-id">
        <div class="pc-av">${u(l)}</div>
        <div class="pc-id-info">
          <div class="pc-nom">${u(a||r||"—")}</div>
          <div class="pc-prenom">${u(r||"")}</div>
        </div>
      </div>

      <div class="pc-meta">
        <div class="pc-meta-item">
          <div class="pc-meta-lbl">Début formation</div>
          <div class="pc-meta-val">${u(se(e))}</div>
        </div>
        <div class="pc-meta-item">
          <div class="pc-meta-lbl">Compétences</div>
          <div class="pc-meta-val">${t} / ${c}</div>
        </div>
      </div>

      <div class="pc-foot">
        <div class="pc-prog">
          <div class="pc-prog-row">
            <span class="pc-prog-lbl">Prêt examen</span>
            <span class="pc-prog-pct">${i}%</span>
          </div>
          <div class="pc-prog-bar">
            <div class="pc-prog-fill" style="width:${i}%"></div>
          </div>
        </div>
        <div class="pc-sceau" aria-hidden="true">
          <div class="pc-sceau-ico">${p.ico}</div>
          <div>${u(p.label)}</div>
        </div>
      </div>

    </div>
  </div>
</div>
<div class="pc-hint">Ta carte évolue à chaque compétence validée. Vise les 100% pour la passer en or.</div>`}function pe(r){if(typeof localStorage>"u")return null;const a="permigo:permis_bg_milestone_seen";let e=0;r>=20?e=2:r>=10&&(e=1);const t=parseInt(localStorage.getItem(a)||"0",10);return e>t?(localStorage.setItem(a,String(e)),e):null}function le(r,a){const t={1:{title:"Fond Route débloqué",sub:"Tu progresses bien — déjà 10 compétences acquises."},2:{title:"Fond Holographic débloqué",sub:"20 compétences acquises. Plus que la ligne d'arrivée !"}}[a];if(!t)return;const c=document.createElement("div");c.style.cssText=`
    position: absolute; left: 50%; top: -8px; transform: translate(-50%, -100%);
    background: rgba(15, 23, 42, .94); color: #fff; padding: 12px 16px; border-radius: 14px;
    font: 600 12px/1.3 'Inter', sans-serif; box-shadow: 0 12px 28px rgba(10,13,26,.32);
    z-index: 10; min-width: 220px; text-align: center; pointer-events: none;
    opacity: 0; transition: opacity .35s ease, transform .35s cubic-bezier(.23,1,.32,1);
    backdrop-filter: blur(8px);
  `,c.innerHTML=`
    <div style="font:800 13px/1.2 'Plus Jakarta Sans',sans-serif;margin-bottom:3px;color:#fde68a">🎴 ${t.title}</div>
    <div style="font:500 11px/1.4 'Inter',sans-serif;color:#cbd5e1">${t.sub}</div>
  `,r.style.position=r.style.position||"relative",r.appendChild(c),requestAnimationFrame(()=>{c.style.opacity="1",c.style.transform="translate(-50%, -110%)"}),setTimeout(()=>{c.style.opacity="0",c.style.transform="translate(-50%, -100%)",setTimeout(()=>c.remove(),380)},4500)}function de(r,a){r.innerHTML=ce(a);const e=r.querySelector(".pc");if(!e)return;const t=pe((a==null?void 0:a.validated)??0);if(t&&setTimeout(()=>le(e.parentElement||e,t),700),matchMedia("(prefers-reduced-motion: reduce)").matches)return;let c=null;function i(l){var b,m,v,h;const n=e.getBoundingClientRect(),o=(((m=(b=l.touches)==null?void 0:b[0])==null?void 0:m.clientX)??l.clientX)-n.left,s=(((((h=(v=l.touches)==null?void 0:v[0])==null?void 0:h.clientY)??l.clientY)-n.top)/n.height-.5)*-8,f=(o/n.width-.5)*8;cancelAnimationFrame(c),c=requestAnimationFrame(()=>{e.style.transform=`rotateX(${s}deg) rotateY(${f}deg)`})}function p(){cancelAnimationFrame(c),e.style.transform=""}e.addEventListener("mousemove",i),e.addEventListener("mouseleave",p),e.addEventListener("touchmove",i,{passive:!0}),e.addEventListener("touchend",p)}const T="animated-border-style",fe=`
  .ab-wrap {
    position: relative;
    display: inline-block;
    border: var(--ab-border-width, 2px) solid transparent;
    border-radius: var(--ab-radius, 20px);
    background-image:
      linear-gradient(var(--ab-bg, #fff), var(--ab-bg, #fff)),
      conic-gradient(
        from var(--gradient-angle, 0deg),
        var(--ab-primary, #6366f1) 0%,
        var(--ab-secondary, #8b5cf6) 37%,
        var(--ab-accent, #f9de90) 30%,
        var(--ab-secondary, #8b5cf6) 33%,
        var(--ab-primary, #6366f1) 40%,
        var(--ab-primary, #6366f1) 50%,
        var(--ab-secondary, #8b5cf6) 77%,
        var(--ab-accent, #f9de90) 80%,
        var(--ab-secondary, #8b5cf6) 83%,
        var(--ab-primary, #6366f1) 90%
      );
    background-clip: padding-box, border-box;
    background-origin: padding-box, border-box;
  }

  /* Modes d'animation */
  .ab-wrap.ab-auto-rotate {
    animation: ab-spin var(--ab-speed, 5s) linear infinite;
  }
  .ab-wrap.ab-rotate-on-hover:hover {
    animation: ab-spin var(--ab-speed, 5s) linear infinite;
  }
  .ab-wrap.ab-stop-rotate-on-hover {
    animation: ab-spin var(--ab-speed, 5s) linear infinite;
  }
  .ab-wrap.ab-stop-rotate-on-hover:hover {
    animation-play-state: paused;
  }

  @keyframes ab-spin {
    from { --gradient-angle: 0deg; }
    to   { --gradient-angle: 360deg; }
  }

  @property --gradient-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }

  @media (prefers-reduced-motion: reduce) {
    .ab-wrap { animation: none !important; }
  }
`;function ue(){if(typeof document>"u"||document.head.querySelector(`#${T}`))return;const r=document.createElement("style");r.id=T,r.textContent=fe,document.head.appendChild(r)}function be(r,a={}){ue();const{mode:e="auto-rotate",speed:t=5,primary:c="#6366f1",secondary:i="#8b5cf6",accent:p="#f9de90",bg:l="#fff",borderWidth:n=2,radius:o=20,className:d=""}=a,s={"auto-rotate":"ab-auto-rotate","rotate-on-hover":"ab-rotate-on-hover","stop-rotate-on-hover":"ab-stop-rotate-on-hover"}[e]||"ab-auto-rotate",f=`
    --ab-primary:${c};
    --ab-secondary:${i};
    --ab-accent:${p};
    --ab-bg:${l};
    --ab-border-width:${n}px;
    --ab-radius:${o}px;
    --ab-speed:${t}s;
  `.replace(/\s+/g,"");return`<div class="ab-wrap ${s} ${d}" style="${f}">${r}</div>`}const L={gold:{primary:"#584827",secondary:"#c7a03c",accent:"#f9de90",speed:6},cyan:{primary:"#0e7490",secondary:"#06b6d4",accent:"#67e8f9",speed:5},violet:{primary:"#6d28d9",secondary:"#8b5cf6",accent:"#c4b5fd",speed:4}},V="__permigo_upload_custom__",me=`<style>
.avpk-bg {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 9990;
  opacity: 0;
  transition: opacity .25s;
  backdrop-filter: blur(4px);
}
.avpk-bg.show { opacity: 1; }

.avpk-sheet {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 9991;
  background: #fff;
  border-radius: 28px 28px 0 0;
  transform: translateY(100%);
  transition: transform .32s cubic-bezier(.32,.72,0,1);
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  max-width: 480px;
  margin: 0 auto;
}
.avpk-sheet.show { transform: translateY(0); }

.avpk-handle {
  width: 36px; height: 4px;
  background: #e2e6f2;
  border-radius: 2px;
  margin: 12px auto 6px;
}
.avpk-hd {
  text-align: center;
  padding: 14px 20px 6px;
}
.avpk-title {
  font: 800 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #0b0d1a;
  letter-spacing: -.025em;
}
.avpk-sub {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: #64748b;
  margin-top: 4px;
}
.avpk-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  padding: 18px 20px;
}
.avpk-opt {
  aspect-ratio: 1;
  border-radius: 22px;
  border: 2.5px solid #e2e6f2;
  background: #f8f9fc;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: transform .15s, border-color .15s;
  padding: 0;
}
.avpk-opt:active { transform: scale(.94); }
.avpk-opt.selected {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99,102,241,.18);
}
.avpk-opt img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.avpk-opt.selected::after {
  content: '✓';
  position: absolute;
  top: 4px; right: 4px;
  width: 22px; height: 22px;
  background: #6366f1;
  color: #fff;
  border-radius: 50%;
  display: grid; place-items: center;
  font: 800 13px/1 'Inter', sans-serif;
}
.avpk-actions {
  display: flex; gap: 10px;
  padding: 0 20px 8px;
}
.avpk-btn {
  flex: 1;
  height: 50px;
  border-radius: 14px;
  border: 1.5px solid #e2e6f2;
  background: #f8f9fc;
  color: #0b0d1a;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  font-family: inherit;
  transition: background .12s;
}
.avpk-btn:hover { background: #f0f2f8; }
.avpk-btn.primary {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}
.avpk-btn.primary:hover { background: #4f46e5; }
.avpk-btn:disabled { opacity: .45; cursor: default; }
@media (prefers-reduced-motion: reduce) {
  .avpk-bg, .avpk-sheet { transition: none; }
}
</style>`;function ge(r={}){return new Promise(a=>{if(!document.getElementById("avpk-style")){const n=document.createElement("div");n.innerHTML=me;const o=n.querySelector("style");o&&(o.id="avpk-style",document.head.appendChild(o))}const e=document.createElement("div");e.innerHTML=`
      <div class="avpk-bg"></div>
      <div class="avpk-sheet" role="dialog" aria-label="Choisir un avatar">
        <div class="avpk-handle"></div>
        <div class="avpk-hd">
          <div class="avpk-title">Choisis ton avatar</div>
          <div class="avpk-sub">6 visuels au choix — change quand tu veux</div>
        </div>
        <div class="avpk-grid">
          ${ee.avatar.map((n,o)=>`
            <button class="avpk-opt ${n===r.currentUrl?"selected":""}"
                    data-url="${u(n)}"
                    aria-label="Avatar ${o+1}">
              <img src="${u(n)}" alt="" loading="lazy" />
            </button>
          `).join("")}
        </div>
        <div class="avpk-actions" style="flex-direction:column;gap:8px">
          <button class="avpk-btn primary" data-action="confirm" disabled>Choisir cet avatar</button>
          <div style="display:flex;gap:8px">
            <button class="avpk-btn" data-action="upload" style="flex:1">📷 Ma photo</button>
            <button class="avpk-btn" data-action="cancel" style="flex:1">Annuler</button>
          </div>
        </div>
      </div>
    `,document.body.appendChild(e);const t=e.querySelector(".avpk-bg"),c=e.querySelector(".avpk-sheet"),i=e.querySelector('[data-action="confirm"]');requestAnimationFrame(()=>{t.classList.add("show"),c.classList.add("show")});let p=r.currentUrl||null;p&&(i.disabled=!1),e.querySelectorAll(".avpk-opt").forEach(n=>{n.addEventListener("click",()=>{y("select"),e.querySelectorAll(".avpk-opt").forEach(o=>o.classList.remove("selected")),n.classList.add("selected"),p=n.dataset.url,i.disabled=!1})});const l=n=>{t.classList.remove("show"),c.classList.remove("show"),setTimeout(()=>{e.remove(),a(n)},280)};t.addEventListener("click",()=>l(null)),e.querySelector('[data-action="cancel"]').addEventListener("click",()=>{y("tap"),l(null)}),e.querySelector('[data-action="upload"]').addEventListener("click",()=>{y("select"),l(V)}),i.addEventListener("click",()=>{y("success"),l(p)})})}const ve=`<style>
.pcc { width: 100%; max-width: 380px; margin: 0 auto; padding: 0; }
.pcc-card {
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(10,13,26,.06), 0 10px 30px -12px rgba(10,13,26,.12);
  position: relative;
}

/* ── Bannière ── */
.pcc-banner {
  position: relative;
  height: 140px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #0891b2);
  overflow: hidden;
}
.pcc-banner img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.pcc-banner::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(255,255,255,.0) 100%);
  pointer-events: none;
}
.pcc-banner-edit {
  position: absolute;
  top: 12px; left: 12px;
  width: 34px; height: 34px;
  border-radius: 50%;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(8px);
  border: 0;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 14px;
  color: #0a0d1a;
  box-shadow: 0 2px 8px rgba(10,13,26,.15);
  transition: transform .15s ease;
}
.pcc-banner-edit:hover { transform: scale(1.06); }
.pcc-banner-edit:active { transform: scale(.94); }

/* ── Bouton partager (remplace Follow) ── */
.pcc-share {
  position: absolute;
  top: 12px; right: 12px;
  padding: 9px 18px 9px 14px;
  border-radius: 99px;
  background: rgba(255,255,255,.95);
  backdrop-filter: blur(10px);
  border: 0;
  font: 600 13px/1 'Inter', sans-serif;
  color: #0a0d1a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(10,13,26,.12);
  transition: transform .15s ease, background .15s ease;
}
.pcc-share:hover { background: #fff; transform: translateY(-1px); }
.pcc-share:active { transform: scale(.96); }
.pcc-share-ico { font-size: 14px; }

/* ── Body ── */
.pcc-body {
  padding: 0 20px 20px;
  margin-top: -42px;
  position: relative;
}

/* ── Avatar ── */
.pcc-av-wrap {
  position: relative;
  width: 84px; height: 84px;
  margin-bottom: 14px;
}
.pcc-av {
  width: 100%; height: 100%;
  border-radius: 50%;
  border: 4px solid #fff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(10,13,26,.12);
  display: flex; align-items: center; justify-content: center;
  font: 700 28px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
}
.pcc-av img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.pcc-av-edit {
  position: absolute;
  bottom: 0; right: 0;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #6366f1;
  color: #fff;
  border: 2.5px solid #fff;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  box-shadow: 0 2px 6px rgba(10,13,26,.2);
  transition: transform .15s ease;
}
.pcc-av-edit:hover { transform: scale(1.1); }
.pcc-av-edit:active { transform: scale(.94); }

/* ── Barre XP ── */
.pcc-xp {
  margin-bottom: 16px;
}
.pcc-xp-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pcc-xp-lbl {
  font: 600 10.5px/1 'Inter', sans-serif;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: .12em;
  flex-shrink: 0;
}
.pcc-xp-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
}
.pcc-xp-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}
.pcc-xp-fill.gradient-rainbow {
  background: linear-gradient(90deg, #8b5cf6, #ec4899, #f97316, #f59e0b, #10b981, #06b6d4, #6366f1);
}
.pcc-xp-fill.gradient-indigo {
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
}
.pcc-xp-val {
  font: 600 11px/1 'Inter', sans-serif;
  color: #0a0d1a;
  flex-shrink: 0;
}

/* ── Badge prestige ── */
.pcc-prestige {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 99px;
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .04em;
  margin-bottom: 12px;
  border: 1px solid;
}
.pcc-prestige-ico { font-size: 13px; line-height: 1; }
.pcc-prestige-num {
  font: 700 10px/1 'Inter', sans-serif;
  background: rgba(0,0,0,.06);
  padding: 3px 6px;
  border-radius: 6px;
}

/* ── Nom + bio ── */
.pcc-name {
  font: 700 22px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  margin: 0 0 6px;
  letter-spacing: -0.022em;
}
.pcc-bio {
  font: 500 13px/1.5 'Inter', sans-serif;
  color: #64748b;
  margin: 0 0 20px;
}

/* ── Stats grid ── */
.pcc-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 16px 0;
  margin: 0 -4px 16px;
  border-top: 1px solid #e2e6f2;
  border-bottom: 1px solid #e2e6f2;
}
.pcc-stat {
  text-align: center;
  padding: 0 8px;
}
.pcc-stat + .pcc-stat {
  border-left: 1px solid #e2e6f2;
}
.pcc-stat-val {
  font: 700 22px/1 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  margin-bottom: 4px;
  letter-spacing: -0.022em;
}
.pcc-stat-lbl {
  font: 500 11px/1 'Inter', sans-serif;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: .04em;
}

/* ── Actions partage social ── */
.pcc-social {
  display: flex;
  justify-content: center;
  gap: 20px;
}
.pcc-social-btn {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: #f8f9fc;
  border: 1px solid #e2e6f2;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #0a0d1a;
  transition: background .12s ease, border-color .12s ease, transform .12s ease;
}
.pcc-social-btn:hover { background: #fff; border-color: #6366f1; color: #6366f1; }
.pcc-social-btn:active { transform: scale(.94); }
.pcc-social-btn svg { width: 18px; height: 18px; }

/* ── Hidden file input ── */
.pcc-file-input { display: none; }

@media (prefers-reduced-motion: reduce) {
  .pcc-card, .pcc-xp-fill, .pcc-share, .pcc-av-edit, .pcc-banner-edit {
    transition: none !important;
  }
}
</style>`;function xe({me:r,avatarUrl:a,avatarPreset:e=null,bannerUrl:t,count:c=0,stats:i=[],bio:p=""}){const l=r.role||"eleve",{current:n,next:o,pctToNext:d}=te(l,c),s=l==="enseignant"?"gradient-indigo":"gradient-rainbow",f=((r.prenom||"")[0]||"")+((r.nom||"")[0]||""),b=`${r.prenom||""} ${r.nom||""}`.trim()||"Élève",m=i.slice(0,3);for(;m.length<3;)m.push({label:"—",value:0});const v=e?G.find(k=>k.id===e):null,h=a?`<img src="${u(a)}" alt="${u(b)}" />`:v?Y(v):u((f||"?").toUpperCase()),_=l==="enseignant"?L.cyan:l==="gerant"?L.gold:L.violet;return`${ve}
<div class="pcc">
  ${be(`<div class="pcc-card">
    <div class="pcc-banner">
      ${t?`<img src="${u(t)}" alt="" />`:""}
      <button class="pcc-banner-edit" data-action="edit-banner" aria-label="Modifier la bannière" title="Modifier la bannière">✎</button>
      <button class="pcc-share" data-action="share" aria-label="Partager mon profil">
        <span class="pcc-share-ico">↗</span> Partager
      </button>
    </div>

    <div class="pcc-body">
      <div class="pcc-av-wrap">
        <div class="pcc-av">
          ${h}
        </div>
        <button class="pcc-av-edit" data-action="edit-avatar" aria-label="Modifier la photo" title="Modifier la photo">✎</button>
      </div>

      <div class="pcc-prestige" style="color:${u(n.accent)};background:${u(n.accent)}1a;border-color:${u(n.accent)}40">
        <span class="pcc-prestige-ico">${n.emoji}</span>
        <span>${u(n.name)}</span>
        <span class="pcc-prestige-num">P${n.p}</span>
      </div>

      <h2 class="pcc-name">${u(b)}</h2>
      ${p?`<p class="pcc-bio">${u(p)}</p>`:""}

      <div class="pcc-xp">
        <div class="pcc-xp-row">
          <span class="pcc-xp-lbl">${o?"Prog.":"Max"}</span>
          <div class="pcc-xp-bar">
            <div class="pcc-xp-fill ${s}" style="width:${d}%"></div>
          </div>
          <span class="pcc-xp-val">${o?`→ ${u(o.name)}`:"✓ Élite"}</span>
        </div>
      </div>

      <div class="pcc-stats">
        ${m.map(k=>`
          <div class="pcc-stat">
            <div class="pcc-stat-val" data-target="${k.value}">0</div>
            <div class="pcc-stat-lbl">${u(k.label)}</div>
          </div>
        `).join("")}
      </div>

      <div class="pcc-social">
        <button class="pcc-social-btn" data-action="share-whatsapp" aria-label="Partager sur WhatsApp" title="WhatsApp">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9s-.5-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1c-.3-.1-1.2-.5-2.3-1.4-.8-.8-1.4-1.7-1.5-2s0-.3.1-.5c.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5s-.6-1.4-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.2-1 1-1 2.4s1 2.8 1.2 3 2.1 3.1 5.1 4.3c.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.5.8 3.1 1.3 4.9 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
        </button>
        <button class="pcc-social-btn" data-action="share-instagram" aria-label="Partager sur Instagram" title="Instagram">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
        </button>
        <button class="pcc-social-btn" data-action="copy-link" aria-label="Copier le lien" title="Copier le lien">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </button>
      </div>
    </div>
  </div>`,{..._,radius:28,borderWidth:2.5,bg:"#fff"})}

  <input type="file" class="pcc-file-input" accept="image/*" data-target="avatar" />
  <input type="file" class="pcc-file-input" accept="image/*" data-target="banner" />
</div>`}function he(r){if(matchMedia!=null&&matchMedia("(prefers-reduced-motion: reduce)").matches){r.querySelectorAll("[data-target]").forEach(i=>{i.textContent=I(parseFloat(i.dataset.target))});return}const a=1200,e=performance.now(),t=[...r.querySelectorAll("[data-target]")].map(i=>({el:i,target:parseFloat(i.dataset.target)||0}));function c(i){const p=Math.min(1,(i-e)/a),l=1-Math.pow(1-p,3);t.forEach(n=>{n.el.textContent=I(Math.round(n.target*l))}),p<1?requestAnimationFrame(c):t.forEach(n=>{n.el.textContent=I(n.target)})}requestAnimationFrame(c)}function I(r){return r>=1e6?`${(r/1e6).toFixed(1)}M`:r>=1e3?`${(r/1e3).toFixed(r>=1e4?0:1)}K`:String(r)}async function A(r,a,e,t){if(!a)return null;if(a.size>5*1024*1024){const{toast:s}=await g(async()=>{const{toast:f}=await import("./index-BAp2bzVE.js").then(b=>b.D);return{toast:f}},__vite__mapDeps([0,1,2]));return s("Image trop grosse (max 5 MB)","error"),null}const c=(a.name.split(".").pop()||"jpg").toLowerCase(),i=`${r}/${e}-${Date.now()}.${c}`,{error:p}=await x.storage.from("user-media").upload(i,a,{cacheControl:"3600",upsert:!0,contentType:a.type});if(p){const{toast:s}=await g(async()=>{const{toast:f}=await import("./index-BAp2bzVE.js").then(b=>b.D);return{toast:f}},__vite__mapDeps([0,1,2]));return s("Échec upload : "+(p.message||""),"error"),null}const{data:l}=x.storage.from("user-media").getPublicUrl(i),n=l==null?void 0:l.publicUrl;if(!n)return null;const o=e==="avatar"?"avatar_url":"banner_url",{error:d}=await x.from("profiles").update({[o]:n}).eq("id",r);if(d){const{toast:s}=await g(async()=>{const{toast:f}=await import("./index-BAp2bzVE.js").then(b=>b.D);return{toast:f}},__vite__mapDeps([0,1,2]));return s("URL non persistée — réessaie","error"),null}return n}async function C(r,a="handler"){try{await r()}catch(e){console.error(`[profile-card] ${a} failed`,e);const{toast:t}=await g(async()=>{const{toast:c}=await import("./index-BAp2bzVE.js").then(i=>i.D);return{toast:c}},__vite__mapDeps([0,1,2]));t("Action impossible — réessaie","error")}}function ye(r,a){const{me:e,shareUrl:t,shareText:c,avatarUrl:i}=a;r.innerHTML=xe(a);const p=r.querySelector(".pcc");if(!p)return;setTimeout(()=>he(p),200);const l=p.querySelector('.pcc-file-input[data-target="avatar"]');p.querySelector('[data-action="edit-avatar"]').addEventListener("click",async()=>{y("select");try{const d=await ge({currentUrl:i??e.avatar_url??null});if(!d)return;if(d===V){l.click();return}await C(async()=>{const{error:s}=await x.from("profiles").update({avatar_url:d}).eq("id",e.id);if(s)throw s;const f=p.querySelector(".pcc-av");f.innerHTML=`<img src="${u(d)}" alt="" />`,y("success");const{toast:b}=await g(async()=>{const{toast:m}=await import("./index-BAp2bzVE.js").then(v=>v.D);return{toast:m}},__vite__mapDeps([0,1,2]));b("Avatar mis à jour ✓","success",2500)},"avatar default pick")}catch(d){console.warn("[profile-card] avatar picker failed",d)}}),l.addEventListener("change",d=>{var f;const s=(f=d.target.files)==null?void 0:f[0];s&&C(async()=>{const b=await A(e.id,s,"avatar");if(b){const m=p.querySelector(".pcc-av");m.innerHTML=`<img src="${b}" alt="" />`,y("success");const{toast:v}=await g(async()=>{const{toast:h}=await import("./index-BAp2bzVE.js").then(_=>_.D);return{toast:h}},__vite__mapDeps([0,1,2]));v("Photo mise à jour ✓","success",2500)}},"avatar upload").finally(()=>{l.value=""})});const n=p.querySelector('.pcc-file-input[data-target="banner"]');p.querySelector('[data-action="edit-banner"]').addEventListener("click",()=>{y("select"),n.click()}),n.addEventListener("change",d=>{var f;const s=(f=d.target.files)==null?void 0:f[0];s&&C(async()=>{const b=await A(e.id,s,"banner");if(b){const m=p.querySelector(".pcc-banner"),v=m.querySelector("img");v?v.src=b:m.insertAdjacentHTML("afterbegin",`<img src="${b}" alt="" />`),y("success");const{toast:h}=await g(async()=>{const{toast:_}=await import("./index-BAp2bzVE.js").then(k=>k.D);return{toast:_}},__vite__mapDeps([0,1,2]));h("Bannière mise à jour ✓","success",2500)}},"banner upload").finally(()=>{n.value=""})});const o={title:"PermiGo",text:c||"Suis ma progression sur PermiGo",url:t||window.location.origin};p.querySelector('[data-action="share"]').addEventListener("click",async()=>{if(y("select"),navigator.share)try{await navigator.share(o)}catch{}else await q(o.url)}),p.querySelector('[data-action="share-whatsapp"]').addEventListener("click",()=>{y("tap");const d=`https://wa.me/?text=${encodeURIComponent(o.text+" "+o.url)}`;window.open(d,"_blank","noopener")}),p.querySelector('[data-action="share-instagram"]').addEventListener("click",async()=>{y("tap"),await q(o.url);const{toast:d}=await g(async()=>{const{toast:s}=await import("./index-BAp2bzVE.js").then(f=>f.D);return{toast:s}},__vite__mapDeps([0,1,2]));d("Lien copié — colle-le dans Instagram","info",3e3)}),p.querySelector('[data-action="copy-link"]').addEventListener("click",async()=>{y("tap"),await q(o.url)})}async function q(r,a){try{await navigator.clipboard.writeText(r);const{toast:e}=await g(async()=>{const{toast:t}=await import("./index-BAp2bzVE.js").then(c=>c.D);return{toast:t}},__vite__mapDeps([0,1,2]));e("Lien copié ✓","success",2e3)}catch{const{toast:e}=await g(async()=>{const{toast:t}=await import("./index-BAp2bzVE.js").then(c=>c.D);return{toast:t}},__vite__mapDeps([0,1,2]));e("Impossible de copier","error")}}const D="moniteur-ranking-style";function ke(){if(document.head.querySelector(`#${D}`))return;const r=document.createElement("style");r.id=D,r.textContent=`
  @keyframes mrIn {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }

  .mr-wrap {
    margin-bottom: 24px;
  }
  .mr-sec-title {
    font: 600 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #94a3b8;
    margin: 0 0 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .mr-sec-title::after {
    content: ''; flex: 1;
    height: 1px; background: #e2e6f2;
  }

  /* Ma position highlight */
  .mr-my-position {
    background: #fff;
    border: 1.5px solid rgba(99,102,241,.3);
    border-radius: 20px;
    padding: 16px;
    margin-bottom: 10px;
    box-shadow: 0 2px 12px -4px rgba(99,102,241,.15);
    animation: mrIn .4s cubic-bezier(.34,1.56,.64,1) both;
  }
  .mr-my-top {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 12px;
  }
  .mr-rank-badge {
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
    flex-shrink: 0;
  }
  .mr-rank-badge.rank-1 { background: linear-gradient(135deg,#f59e0b,#d97706); color:#fff; }
  .mr-rank-badge.rank-2 { background: linear-gradient(135deg,#94a3b8,#64748b); color:#fff; }
  .mr-rank-badge.rank-3 { background: linear-gradient(135deg,#b45309,#92400e); color:#fff; }
  .mr-rank-badge.rank-other { background: rgba(99,102,241,.1); color:#6366f1; border:1.5px solid rgba(99,102,241,.2); }
  .mr-name {
    font: 700 15px/1.2 'Plus Jakarta Sans', sans-serif;
    color: #0a0d1a;
    flex: 1;
  }
  .mr-score {
    font: 800 18px/1 'Plus Jakarta Sans', sans-serif;
    color: #6366f1;
    letter-spacing: -.02em;
    flex-shrink: 0;
  }
  .mr-score-lbl {
    font: 500 10px/1 'Inter', sans-serif;
    color: #94a3b8;
    text-align: right;
    margin-top: 2px;
  }

  .mr-metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .mr-metric {
    text-align: center;
    padding: 8px 4px;
    background: #f8f9fc;
    border-radius: 12px;
  }
  .mr-metric-val {
    font: 700 16px/1 'Plus Jakarta Sans', sans-serif;
    color: #0a0d1a;
    letter-spacing: -.02em;
  }
  .mr-metric-lbl {
    font: 500 10px/1.3 'Inter', sans-serif;
    color: #94a3b8;
    margin-top: 3px;
  }

  /* Comparaison vs n+1 */
  .mr-compare {
    font: 500 12px/1.4 'Inter', sans-serif;
    color: #6366f1;
    background: rgba(99,102,241,.05);
    border-radius: 10px;
    padding: 8px 12px;
    margin-top: 10px;
    text-align: center;
  }

  /* Top 3 leaderboard */
  .mr-list {
    background: #fff;
    border: 1.5px solid #e2e6f2;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(10,13,26,.06);
    animation: mrIn .4s cubic-bezier(.34,1.56,.64,1) .1s both;
  }
  .mr-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f2f8;
    transition: background .12s;
  }
  .mr-row:last-child { border-bottom: none; }
  .mr-row.mr-row-me {
    background: rgba(99,102,241,.04);
  }
  .mr-row-rank {
    font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
    width: 24px; text-align: center;
    flex-shrink: 0;
  }
  .mr-row-rank.r1 { color: #d97706; }
  .mr-row-rank.r2 { color: #64748b; }
  .mr-row-rank.r3 { color: #b45309; }
  .mr-row-rank.rn { color: #94a3b8; }
  .mr-row-info { flex: 1; min-width: 0; }
  .mr-row-name {
    font: 600 13px/1.2 'Inter', sans-serif;
    color: #0a0d1a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .mr-row-sub {
    font: 500 11px/1 'Inter', sans-serif;
    color: #94a3b8;
    margin-top: 2px;
  }
  .mr-row-score {
    font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
    color: #6366f1;
    flex-shrink: 0;
  }
  `,document.head.appendChild(r)}function we(r){return r===1?"rank-1":r===2?"rank-2":r===3?"rank-3":"rank-other"}function _e(r){return r===1?"r1":r===2?"r2":r===3?"r3":"rn"}function M(r){return`#${r}`}function j(r){if(!r)return"0h";const a=parseFloat(r);return a<1?`${Math.round(a*60)}min`:Number.isInteger(a)?`${a}h`:`${a.toFixed(1)}h`}async function $e(r,{myId:a}){ke(),r.innerHTML=`<div style="padding:12px 0;text-align:center;color:#94a3b8;font:500 13px/1 'Inter',sans-serif">Chargement du ranking…</div>`;let e=[];try{const o=new Date().toISOString().slice(0,7)+"-01",{data:d}=await x.rpc("get_moniteur_ranking",{p_month:o});e=d||[]}catch(o){console.error("[moniteur-ranking] error",o),r.innerHTML="";return}if(e.length===0){r.innerHTML=`<div style="text-align:center;color:#94a3b8;font:500 13px/1.5 'Inter',sans-serif;padding:16px">Aucune donnée ce mois-ci encore.</div>`;return}S("moniteur_ranking.viewed",{user_id:a});const t=e.find(o=>o.moniteur_id===a),c=e.slice(0,3),i=t?e.findIndex(o=>o.moniteur_id===a):-1,p=i>0?e[i-1]:null,l=new Date().toLocaleDateString("fr-FR",{month:"long",year:"numeric"}),n=!(t!=null&&t.hours_confirmed)||parseFloat(t.hours_confirmed)===0;r.innerHTML=`
  <div class="mr-wrap">
    <div class="mr-sec-title">
      ${w("award",{size:12,strokeWidth:2.4})}
      Classement · ${u(l)}
    </div>

    ${t?`
    <div class="mr-my-position">
      <div class="mr-my-top">
        <div class="mr-rank-badge ${we(t.rank)}">${M(t.rank)}</div>
        <div class="mr-name">Ma position</div>
        <div>
          <div class="mr-score">${t.score_total}</div>
          <div class="mr-score-lbl">pts</div>
        </div>
      </div>
      <div class="mr-metrics">
        ${n?`
        <div class="mr-metric" style="grid-column:span 2">
          <div class="mr-metric-val" style="color:#94a3b8;font-size:13px">${t.n_validations??0} val. · pas encore de session enregistrée</div>
          <div class="mr-metric-lbl" style="margin-top:4px">Enregistre une session pour débloquer ce compteur</div>
        </div>`:`
        <div class="mr-metric">
          <div class="mr-metric-val">${j(t.hours_confirmed)}</div>
          <div class="mr-metric-lbl">confirmées</div>
        </div>
        <div class="mr-metric">
          <div class="mr-metric-val">${t.n_validations??0}</div>
          <div class="mr-metric-lbl">validations</div>
        </div>`}
        <div class="mr-metric">
          <div class="mr-metric-val">${t.n_eleves_diff??0}</div>
          <div class="mr-metric-lbl">élèves</div>
        </div>
        <div class="mr-metric">
          <div class="mr-metric-val">${t.n_jours_actifs??0}j</div>
          <div class="mr-metric-lbl">actifs</div>
        </div>
      </div>
      ${p?`
      <div class="mr-compare">
        ${w("trending-up",{size:12,strokeWidth:2.4})}
        Tu es à <strong>${Math.round((p.score_total-t.score_total)*10)/10} pts</strong> derrière ${u(p.moniteur_prenom)}
      </div>`:t.rank===1?'<div class="mr-compare">🏆 Tu es en tête ce mois-ci !</div>':""}
    </div>`:""}

    ${c.length>0?`
    <div class="mr-list">
      ${c.map(o=>`
        <div class="mr-row${o.moniteur_id===a?" mr-row-me":""}">
          <span class="mr-row-rank ${_e(o.rank)}">${M(o.rank)}</span>
          <div class="mr-row-info">
            <div class="mr-row-name">${u(o.moniteur_prenom)}${o.moniteur_id===a?' <span style="font-size:10px;color:#6366f1">(toi)</span>':""}</div>
            <div class="mr-row-sub">${j(o.hours_confirmed)} · ${o.n_validations??0} val. · ${o.n_eleves_diff??0} élèves</div>
          </div>
          <div class="mr-row-score">${o.score_total} pts</div>
        </div>
      `).join("")}
    </div>`:""}
  </div>`}const z=`<style>
.prf {
  padding: 20px 16px calc(60px + env(safe-area-inset-bottom, 0px) + 24px); /* #15 — clearance bottom nav */
  max-width: 480px;
  margin: 0 auto;
  color: var(--ink);
  font-family: 'Inter', sans-serif;
  background: var(--bg);
}
.prf-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
}
.prf-avatar {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font: 700 32px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  box-shadow: 0 8px 24px rgba(99,102,241,.25);
}
.prf-name {
  font: 700 22px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  text-align: center;
  letter-spacing: -0.022em;
}
.prf-role-badge {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #6366f1;
  background: rgba(99,102,241,.1);
  border-radius: 99px;
  padding: 6px 12px;
}

/* #19 — tuiles d'accès galerie + wrapped (élève only) */
.prf-nav-tiles { display: flex; gap: 10px; margin: 16px 0; }
.prf-nav-tile {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; padding: 12px;
  background: var(--su); border: 1px solid var(--bo); border-radius: 16px;
  color: var(--tx, #0b0d1a); text-decoration: none;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  box-shadow: 0 1px 3px rgba(10,13,26,.06);
  transition: transform .12s, box-shadow .2s;
}
.prf-nav-tile:active { transform: scale(.98); }
.prf-nav-ico { font-size: 18px; line-height: 1; }

/* Info section */
.prf-section {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--bo2);
}
.prf-row:last-child { border-bottom: none; }
.prf-row-ico { font-size: 18px; line-height: 1; flex-shrink: 0; }
.prf-row-body { flex: 1; min-width: 0; }
.prf-row-lbl { font: 500 11px/1 'Inter', sans-serif; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .04em; }
.prf-row-val { font: 600 14px/1.3 'Inter', sans-serif; color: #0a0d1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Buttons */
.prf-btn-logout {
  width: 100%;
  padding: 16px;
  background: rgba(239,68,68,.08);
  border: 1.5px solid rgba(239,68,68,.25);
  border-radius: 16px;
  color: #ef4444;
  font: 700 15px/1 var(--fd);
  cursor: pointer;
  transition: background .2s, transform .15s;
  margin-bottom: 10px;
  min-height: 52px;
}
.prf-btn-logout:hover { background: rgba(239,68,68,.14); }
.prf-btn-logout:active { transform: scale(.98); }

.prf-btn-delete {
  width: 100%;
  padding: 14px;
  background: none;
  border: 0;
  color: var(--mu2);
  font: 500 13px/1 'Inter', sans-serif;
  cursor: pointer;
  text-decoration: underline;
}

/* Mon Année — enseignant only */
.prf-annee {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-annee-ttl {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--mu2);
  margin: 0 0 16px;
}
.prf-annee-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.prf-kpi {
  background: var(--bg);
  border: 1px solid var(--bo);
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
}
.prf-kpi-n {
  font: 700 28px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  display: block;
  margin-bottom: 6px;
  letter-spacing: -0.025em;
}
.prf-kpi-lbl {
  font: 500 11px/1.3 'Inter', sans-serif;
  color: var(--mu2);
}
.prf-streak {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-streak-ico { font-size: 24px; line-height: 1; }
.prf-streak-body { flex: 1; }
.prf-streak-n {
  font: 700 20px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -0.022em;
}
.prf-streak-lbl {
  font: 500 12px/1.3 'Inter', sans-serif;
  color: var(--mu2);
  margin-top: 4px;
}

/* Version */
.prf-version {
  text-align: center;
  font: 500 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  padding: 20px 0 0;
}

/* ── Notification toggle ── */
.prf-notif-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--bo2);
  cursor: pointer;
  transition: background .15s;
  min-height: 60px;
}
.prf-notif-row:active { background: var(--bg); transform: scale(.99); }
@media(hover:hover)and(pointer:fine){.prf-notif-row:hover{background:#f8f9fc}}
.prf-notif-ico { font-size: 18px; line-height: 1; flex-shrink: 0; }
.prf-notif-body { flex: 1; min-width: 0; }
.prf-notif-lbl { font: 600 14px/1.3 'Inter', sans-serif; color: #0a0d1a; }
.prf-notif-sub { font: 500 12px/1.3 'Inter', sans-serif; color: #94a3b8; margin-top: 2px; }
/* iOS-style toggle pill */
.prf-toggle {
  flex-shrink: 0;
  position: relative;
  width: 44px; height: 26px;
  background: #d1d8ee;
  border-radius: 13px;
  transition: background .2s cubic-bezier(.23,1,.32,1);
  pointer-events: none; /* le click est géré par la row */
}
.prf-toggle.on { background: #6366f1; }
.prf-toggle::after {
  content: '';
  position: absolute;
  top: 3px; left: 3px;
  width: 20px; height: 20px;
  background: var(--su);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
  transition: transform .2s cubic-bezier(.23,1,.32,1);
}
.prf-toggle.on::after { transform: translateX(18px); }
/* État "bloqué par le navigateur" */
.prf-notif-denied { font: 500 12px/1.3 'Inter', sans-serif; color: #f97316; margin-top: 2px; }
@media(prefers-reduced-motion:reduce){.prf-toggle,.prf-toggle::after{transition:none}}

/* ── Parrainage (élève) ── */
.prf-ref {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-ref-ttl {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--mu2);
  margin: 0 0 14px;
}
.prf-ref-code-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg);
  border: 1.5px solid var(--bo);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
}
.prf-ref-code {
  flex: 1;
  font: 700 18px/1 'IBM Plex Mono', monospace;
  color: #6366f1;
  letter-spacing: .1em;
}
.prf-ref-copy-btn {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background .12s;
}
.prf-ref-copy-btn:active { background: rgba(99,102,241,.1); }
.prf-ref-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.prf-ref-stat {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--bo);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}
.prf-ref-stat-n {
  font: 700 22px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  display: block;
  margin-bottom: 4px;
}
.prf-ref-stat-lbl {
  font: 500 10px/1.3 'Inter', sans-serif;
  color: var(--mu2);
}
.prf-ref-share-btn {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 12px;
  color: #fff;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: transform 120ms cubic-bezier(.23,1,.32,1), opacity 120ms;
  min-height: 46px;
}
.prf-ref-share-btn:active { transform: scale(.97); }
.prf-ref-gen-btn {
  width: 100%;
  padding: 13px;
  background: rgba(99,102,241,.08);
  border: 1.5px solid rgba(99,102,241,.2);
  border-radius: 12px;
  color: #6366f1;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: background .15s;
  min-height: 46px;
}
.prf-ref-gen-btn:active { background: rgba(99,102,241,.15); }
.prf-ref-apply {
  margin-top: 14px;
  display: flex;
  gap: 8px;
}
.prf-ref-apply-input {
  flex: 1;
  padding: 12px 14px;
  background: var(--bg);
  border: 1.5px solid var(--bo);
  border-radius: 12px;
  font: 600 14px/1 'IBM Plex Mono', monospace;
  color: var(--ink);
  letter-spacing: .08em;
  text-transform: uppercase;
  outline: none;
  transition: border-color .14s;
  min-height: 44px;
}
.prf-ref-apply-input:focus { border-color: #6366f1; }
.prf-ref-apply-btn {
  padding: 0 16px;
  background: #0a0d1a;
  border: none;
  border-radius: 12px;
  color: #fff;
  font: 700 13px/1 'Inter', sans-serif;
  cursor: pointer;
  min-height: 44px;
  white-space: nowrap;
  transition: background .12s;
}
.prf-ref-apply-btn:active { background: #1e2235; }
.prf-ref-apply-btn:disabled { opacity: .5; cursor: not-allowed; }
</style>`,R={eleve:"Élève",enseignant:"Enseignant",gerant:"Gérant"};function Se(r){return`
    <button class="prf-btn-logout" id="btn-logout">Se déconnecter</button>
    ${r.role==="eleve"?'<button class="prf-btn-delete" id="btn-delete">Supprimer mon compte</button>':""}
  `}async function Ae(r){var o,d;const a=W();if(!a)return;S("page_view",{page:"profil",user_role:a.role}),r.innerHTML=`${z}<div class="prf"><div class="skel skel-card" style="height:180px;margin-bottom:14px"></div><div class="skel skel-card"></div></div>`;const{data:e}=await x.from("profiles").select("email, prenom, nom, xp, streak_pro_days, created_at, avatar_url, avatar_preset, banner_url").eq("id",a.id).single();let t=null;if(a.role==="eleve"){const{data:s}=await x.from("validations").select("competence_id").eq("eleve_id",a.id).eq("statut","acquis");t={prenom:(e==null?void 0:e.prenom)||"",nom:(e==null?void 0:e.nom)||"",created_at:(e==null?void 0:e.created_at)||null,validated:(s||[]).length,total:P}}let c=null;if(a.role==="eleve"){const{data:s}=await x.rpc("get_my_referral_stats");c=s&&!s.error?s:null}let i=null;if(a.role==="enseignant"){const s=`${new Date().getFullYear()}-01-01`,f=new Date().toISOString().slice(0,10),[{data:b},{data:m},{data:v}]=await Promise.all([x.from("validations").select("competence_id, eleve_id, validated_at").eq("validated_by",a.id).gte("validated_at",s),x.from("profiles").select("streak_pro_days").eq("id",a.id).single(),x.from("profiles").select("id").eq("role","eleve").eq("enseignant_id",a.id).is("deleted_at",null)]),h=b||[],_=h.length,k=new Set((v||[]).map($=>$.id));for(const $ of h)k.add($.eleve_id);const O=k.size,U=h.filter($=>{var E;return(E=$.competence_id)==null?void 0:E.startsWith("C3")}).length,F=h.some($=>{var E;return(E=$.validated_at)==null?void 0:E.startsWith(f)}),N=Math.max((m==null?void 0:m.streak_pro_days)??0,F?1:0);i={totalValidations:_,elevesCount:O,c3Count:U,streakDays:N}}const p=a.nom||(e==null?void 0:e.email)||a.email||"?",l=p.split(" ").map(s=>s[0]).filter(Boolean).slice(0,2).join("").toUpperCase()||"?";let n=null;if(a.role==="eleve"&&t?n={me:{...a,prenom:(e==null?void 0:e.prenom)||"",nom:(e==null?void 0:e.nom)||""},avatarUrl:(e==null?void 0:e.avatar_url)||null,avatarPreset:(e==null?void 0:e.avatar_preset)||null,bannerUrl:(e==null?void 0:e.banner_url)||null,count:t.validated,bio:`Apprenti permis B · ${t.validated}/${P} compétences`,stats:[{label:"Compétences",value:t.validated},{label:"Streak",value:(e==null?void 0:e.streak_days)??(e==null?void 0:e.streak_pro_days)??0},{label:"XP",value:(e==null?void 0:e.xp)||0}],shareUrl:window.location.origin,shareText:`Je suis à ${t.validated}/${P} compétences validées sur PermiGo 🚗`}:a.role==="enseignant"&&i&&(n={me:{...a,prenom:(e==null?void 0:e.prenom)||"",nom:(e==null?void 0:e.nom)||""},avatarUrl:(e==null?void 0:e.avatar_url)||null,avatarPreset:(e==null?void 0:e.avatar_preset)||null,bannerUrl:(e==null?void 0:e.banner_url)||null,count:i.totalValidations,bio:`Enseignant · ${i.elevesCount} élève${i.elevesCount>1?"s":""} suivi${i.elevesCount>1?"s":""}`,stats:[{label:"Validations",value:i.totalValidations},{label:"Élèves",value:i.elevesCount},{label:"Streak",value:i.streakDays}],shareUrl:window.location.origin,shareText:`${i.totalValidations} validations REMC sur PermiGo cette année 🎯`}),r.innerHTML=`${z}
<div class="prf anim-slide-up">
  ${n?'<div id="prf-social-card"></div>':`<div class="prf-avatar-wrap">
        <div class="prf-avatar">${u(l)}</div>
        <div class="prf-name">${u(p)}</div>
        <span class="prf-role-badge">${u(R[a.role]||a.role)}</span>
      </div>`}

  ${t?'<div id="prf-permis-card" style="margin-top:16px"></div>':""}

  ${a.role==="eleve"?`
  <div class="prf-nav-tiles">
    <a class="prf-nav-tile" href="#/galerie" aria-label="Ouvrir ta galerie">
      <span class="prf-nav-ico" aria-hidden="true">🖼️</span><span>Ta galerie</span>
    </a>
    <a class="prf-nav-tile" href="#/wrapped" aria-label="Ouvrir ton Wrapped">
      <span class="prf-nav-ico" aria-hidden="true">🎁</span><span>Ton Wrapped</span>
    </a>
  </div>`:""}

  ${c!==null?`<div id="prf-ref-section">${J(c)}</div>`:""}

  ${i?'<div id="prf-ranking-host"></div>':""}

  ${i?`
  <div class="prf-streak">
    <span class="prf-streak-ico" style="color:#f97316;display:flex;align-items:center" aria-hidden="true">${w("flame",{size:28,strokeWidth:2.2})}</span>

    <div class="prf-streak-body">
      <div class="prf-streak-n">${i.streakDays} jour${i.streakDays!==1?"s":""}</div>
      <div class="prf-streak-lbl">d'affilée cette semaine</div>
    </div>
  </div>

  <div class="prf-annee">
    <h2 class="prf-annee-ttl">Ma chasse en ${new Date().getFullYear()}</h2>
    <div class="prf-annee-grid">
      <div class="prf-kpi">
        <span class="prf-kpi-n">${i.totalValidations}</span>
        <div class="prf-kpi-lbl">compétences validées</div>
      </div>
      <div class="prf-kpi">
        <span class="prf-kpi-n">${i.elevesCount}</span>
        <div class="prf-kpi-lbl">élèves suivis</div>
      </div>
      <div class="prf-kpi">
        <span class="prf-kpi-n">${i.c3Count}</span>
        <div class="prf-kpi-lbl">C3 Maîtrise atteints</div>
      </div>
      <div class="prf-kpi">
        <span class="prf-kpi-n">—</span>
        <div class="prf-kpi-lbl">réussites permis (bientôt)</div>
      </div>
    </div>
  </div>
  `:""}

  <div class="prf-section">
    <div class="prf-row">
      <span class="prf-row-ico">${w("mail",{size:18})}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">Email</div>
        <div class="prf-row-val">${u((e==null?void 0:e.email)||a.email||"—")}</div>
      </div>
    </div>
    <div class="prf-row">
      <span class="prf-row-ico">${w("user",{size:18})}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">Rôle</div>
        <div class="prf-row-val">${u(R[a.role]||a.role)}</div>
      </div>
    </div>
    ${(e==null?void 0:e.xp)!=null?`
    <div class="prf-row">
      <span class="prf-row-ico">${w("zap",{size:18})}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">XP total</div>
        <div class="prf-row-val" style="color:#6366f1">${u(String(e.xp))} XP</div>
      </div>
    </div>`:""}
    <div class="prf-row">
      <span class="prf-row-ico">${w("key",{size:18})}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">ID profil</div>
        <div class="prf-row-val" style="font-size:11px;color:#94a3b8">${u(a.id)}</div>
      </div>
    </div>
  </div>

  ${Ee()}

  ${Se(a)}

  <div class="prf-version">PermiGo v7 · Sprint 2</div>
</div>`,n){const s=r.querySelector("#prf-social-card");s&&ye(s,n)}if(t){const s=r.querySelector("#prf-permis-card");s&&de(s,t)}if(a.role==="enseignant"){const s=r.querySelector("#prf-ranking-host");s&&$e(s,{myId:a.id}).catch(()=>{})}a.role==="eleve"&&H(r,a),(o=r.querySelector("#btn-logout"))==null||o.addEventListener("click",async()=>{S("auth.logout",{user_role:a.role});try{await X()}catch(s){console.error("[profil] logout failed",s);const{toast:f}=await g(async()=>{const{toast:b}=await import("./index-BAp2bzVE.js").then(m=>m.D);return{toast:b}},__vite__mapDeps([0,1,2]));f("Déconnexion impossible — réessaie","error")}}),(d=r.querySelector("#btn-delete"))==null||d.addEventListener("click",()=>{alert("La suppression de compte est gérée par l'administrateur de ton auto-école. Contacte-le directement.")}),Pe(r)}function J(r){const a=r==null?void 0:r.code,e=(r==null?void 0:r.n_referrals)??0,t=(r==null?void 0:r.xp_earned)??0;return`
<div class="prf-ref">
  <h2 class="prf-ref-ttl">Parrainage · +200 XP par filleul</h2>

  ${a?`
  <div class="prf-ref-code-wrap">
    <span class="prf-ref-code" id="prf-ref-code">${u(a)}</span>
    <button class="prf-ref-copy-btn" id="prf-ref-copy" title="Copier le code">📋</button>
  </div>
  <div class="prf-ref-stats">
    <div class="prf-ref-stat">
      <span class="prf-ref-stat-n">${e}</span>
      <div class="prf-ref-stat-lbl">filleul${e!==1?"s":""}</div>
    </div>
    <div class="prf-ref-stat">
      <span class="prf-ref-stat-n">${t}</span>
      <div class="prf-ref-stat-lbl">XP gagnés</div>
    </div>
  </div>
  <button class="prf-ref-share-btn" id="prf-ref-share">Partager mon code 🔗</button>
  `:`
  <button class="prf-ref-gen-btn" id="prf-ref-gen">Générer mon code de parrainage</button>
  `}

  <div class="prf-ref-apply">
    <input class="prf-ref-apply-input" id="prf-ref-input" type="text"
           placeholder="Code d'un ami…" maxlength="12" autocomplete="off">
    <button class="prf-ref-apply-btn" id="prf-ref-apply-btn">Appliquer</button>
  </div>
</div>`}function H(r,a){var i,p,l;const e=r.querySelector("#prf-ref-section");if(!e)return;(i=e.querySelector("#prf-ref-copy"))==null||i.addEventListener("click",async()=>{var o,d;const n=(d=(o=e.querySelector("#prf-ref-code"))==null?void 0:o.textContent)==null?void 0:d.trim();if(n)try{await navigator.clipboard.writeText(n);const s=e.querySelector("#prf-ref-copy");s&&(s.textContent="✓",setTimeout(()=>{s.textContent="📋"},1500)),S("referral.code_copied",{})}catch{}}),(p=e.querySelector("#prf-ref-share"))==null||p.addEventListener("click",async()=>{var o,d;const n=(d=(o=e.querySelector("#prf-ref-code"))==null?void 0:o.textContent)==null?void 0:d.trim();if(n)if(navigator.share)try{await navigator.share({title:"Rejoins PermiGo !",text:`Utilise mon code ${n} sur PermiGo et gagne 200 XP 🚗`,url:window.location.origin}),S("referral.shared",{code:n})}catch{}else try{await navigator.clipboard.writeText(`Mon code PermiGo : ${n} — ${window.location.origin}`);const{toast:s}=await g(async()=>{const{toast:f}=await import("./index-BAp2bzVE.js").then(b=>b.D);return{toast:f}},__vite__mapDeps([0,1,2]));s("Lien copié 📋","success")}catch{}}),(l=e.querySelector("#prf-ref-gen"))==null||l.addEventListener("click",async()=>{const n=e.querySelector("#prf-ref-gen");if(n){n.disabled=!0,n.textContent="Génération…";try{const{data:o,error:d}=await x.rpc("generate_referral_code");if(d||o!=null&&o.error){const{toast:f}=await g(async()=>{const{toast:b}=await import("./index-BAp2bzVE.js").then(m=>m.D);return{toast:b}},__vite__mapDeps([0,1,2]));f((o==null?void 0:o.error)||"Impossible de générer le code","error"),n.disabled=!1,n.textContent="Générer mon code de parrainage";return}S("referral.code_generated",{});const{data:s}=await x.rpc("get_my_referral_stats");s&&!s.error&&(e.innerHTML=J(s),H(r,a))}catch{n.disabled=!1,n.textContent="Générer mon code de parrainage"}}});const t=e.querySelector("#prf-ref-apply-btn"),c=e.querySelector("#prf-ref-input");t==null||t.addEventListener("click",async()=>{var o;const n=(o=c==null?void 0:c.value)==null?void 0:o.trim().toUpperCase();if(!(!n||n.length<4)){t.disabled=!0,t.textContent="…";try{const{data:d,error:s}=await x.rpc("apply_referral",{code:n}),{toast:f}=await g(async()=>{const{toast:b}=await import("./index-BAp2bzVE.js").then(m=>m.D);return{toast:b}},__vite__mapDeps([0,1,2]));s||d!=null&&d.error?f((d==null?void 0:d.error)||"Code invalide ou déjà utilisé","error"):(f("Code appliqué ! +200 XP et +50 💎","success",4e3),S("referral.applied",{code:n}),c&&(c.value=""))}catch{const{toast:d}=await g(async()=>{const{toast:s}=await import("./index-BAp2bzVE.js").then(f=>f.D);return{toast:s}},__vite__mapDeps([0,1,2]));d("Erreur de connexion","error")}finally{t.disabled=!1,t.textContent="Appliquer"}}})}function Ee(){if(!("Notification"in window))return"";const r=Notification.permission==="denied",a=B();return`
  <div class="prf-section">
    <div class="prf-notif-row" id="prf-notif-row" role="button" tabindex="0"
         aria-pressed="${a}" aria-label="Notifications ${a?"activées":"désactivées"}">
      <span class="prf-notif-ico">${w("bell",{size:18})}</span>
      <div class="prf-notif-body">
        <div class="prf-notif-lbl">Notifications</div>
        ${r?'<div class="prf-notif-denied">Bloquées par le navigateur — autorise-les dans les réglages</div>':`<div class="prf-notif-sub">${a?"Quiz et streak actifs":"Désactivées"}</div>`}
      </div>
      ${r?"":`<div class="prf-toggle ${a?"on":""}" aria-hidden="true"></div>`}
    </div>
  </div>`}function Pe(r){const a=r.querySelector("#prf-notif-row");if(!a||Notification.permission==="denied")return;const e=a.querySelector(".prf-toggle"),t=a.querySelector(".prf-notif-sub");async function c(){const i=B();a.setAttribute("aria-pressed",String(!i)),i?(await K(),e==null||e.classList.remove("on"),t&&(t.textContent="Désactivées")):await Q()?(e==null||e.classList.add("on"),t&&(t.textContent="Quiz et streak actifs")):Notification.permission==="denied"&&(t&&(t.outerHTML='<div class="prf-notif-denied">Bloquées par le navigateur — autorise-les dans les réglages</div>'),e==null||e.remove())}a.addEventListener("click",c),a.addEventListener("keydown",i=>{(i.key==="Enter"||i.key===" ")&&(i.preventDefault(),c())})}export{Ae as mount};
