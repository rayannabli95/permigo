// ═══════════════════════════════════════════════════════════════
// Competence Unlock — écran plein écran "Compétence acquise" (élève)
//
// DA « Arène 3D / Coffre » (Supercell / Clash Royale) : nuit-violet + or,
// coffre qui s'ouvre, volants qui jaillissent, mascotte, bouton plastique
// 3D vert GO. Auto-suffisant (n'utilise PAS le moteur générique commun —
// celui-ci reste réservé au moniteur via tier-unlock.js).
//
// Récompense RÉELLE : +25 volants crédités (addGemmes) au moment de l'écran,
// une seule fois par compétence (les appelants gardent le ledger anti-doublon).
//
// Usage :
//   import { showCompetenceUnlock } from '@/components/eleve/competence-unlock.js';
//   await showCompetenceUnlock({ competenceCode: 'C2f', scorePct: 100, validatedCount: 12 });
// ═══════════════════════════════════════════════════════════════
import { findSubComp, findCategory } from "@/data/remc.js";
import { WORLDS } from "@/data/worlds.js";
import { track } from "@/services/analytics.js";
import { esc, escAttr } from "@/utils/escape.js";
import { refreshGemmes } from "@/utils/game-state.js";
import { playReward } from "@/utils/sound.js";

const STYLE_ID = "cwn-style";
const FONTS_ID = "cwn-fonts";

/** Volants crédités à chaque compétence validée. */
export const COMPETENCE_VOLANT_REWARD = 25;

// Catégorie REMC → monde (nom). C1→1, C2→2, …
function worldForCategory(catId) {
  const n = parseInt(String(catId || "").replace(/\D/g, ""), 10);
  return WORLDS.find((w) => w.id === n) || null;
}

const CSS = `
.cwn-ov{
  --night-core:#2d1b69; --night-mid:#1a1040; --night-edge:#0d0a1a;
  --gold-1:#ffe9a8; --gold-2:#ffcf52; --gold-3:#f0a818; --gold-deep:#b9760a;
  --violet-ink:#efe7ff; --violet-soft:#c9b8ff; --violet-mute:#9d8bd6;
  --go-1:#6fe016; --go-2:#58cc02; --go-shadow:#46A302;
  --cwn-ease:cubic-bezier(.22,.61,.36,1);
  --cwn-spring:cubic-bezier(.34,1.56,.64,1);

  position:fixed; inset:0; z-index:10050;
  overflow:hidden; isolation:isolate;
  font-family:"Nunito",system-ui,sans-serif;
  background:radial-gradient(120% 90% at 50% 40%, var(--night-core) 0%, var(--night-mid) 46%, var(--night-edge) 100%);
  opacity:0; transition:opacity .32s var(--cwn-ease);
  -webkit-font-smoothing:antialiased;
}
.cwn-ov.cwn-show{ opacity:1; }
.cwn-ov.cwn-closing{ opacity:0; }

.cwn-rays{
  position:absolute; left:50%; top:32%; width:760px; height:760px;
  transform:translate(-50%,-50%);
  background:repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,207,82,.20) 0deg 5deg, transparent 5deg 13deg);
  -webkit-mask-image:radial-gradient(closest-side,#000 6%,rgba(0,0,0,.55) 40%,transparent 72%);
          mask-image:radial-gradient(closest-side,#000 6%,rgba(0,0,0,.55) 40%,transparent 72%);
  opacity:0; animation:cwnRaysSpin 26s linear infinite, cwnRaysIn 1.1s var(--cwn-ease) .15s forwards;
  will-change:transform,opacity;
}
@keyframes cwnRaysSpin{ to{ transform:translate(-50%,-50%) rotate(360deg); } }
@keyframes cwnRaysIn{ to{ opacity:.85; } }

.cwn-glow{
  position:absolute; left:50%; top:32%; width:420px; height:420px;
  transform:translate(-50%,-50%) scale(.6);
  background:radial-gradient(closest-side, rgba(255,225,140,.55) 0%, rgba(255,190,80,.28) 38%, transparent 70%);
  filter:blur(6px); opacity:0;
  animation:cwnGlowIn 1s var(--cwn-ease) .2s forwards, cwnGlowBreath 4.2s var(--cwn-ease) 1.4s infinite;
}
@keyframes cwnGlowIn{ to{ opacity:1; transform:translate(-50%,-50%) scale(1); } }
@keyframes cwnGlowBreath{ 0%,100%{ opacity:.92; transform:translate(-50%,-50%) scale(1);} 50%{ opacity:1; transform:translate(-50%,-50%) scale(1.06);} }

.cwn-dust{ position:absolute; inset:0; pointer-events:none; }
.cwn-dust::before,.cwn-dust::after{ content:""; position:absolute; top:0; left:0; width:3px; height:3px; border-radius:50%; }
.cwn-dust::before{
  box-shadow:9vw 9vh 0 0 rgba(255,231,168,.9),21vw 5vh 0 0 rgba(255,207,82,.7),33vw 14vh 0 0 rgba(255,255,255,.6),46vw 7vh 0 0 rgba(255,225,140,.7),62vw 12vh 0 0 rgba(255,207,82,.75),74vw 5vh 0 0 rgba(255,255,255,.55),84vw 11vh 0 0 rgba(255,231,168,.7),91vw 17vh 0 0 rgba(255,207,82,.55),16vw 20vh 0 0 rgba(255,255,255,.5),55vw 19vh 0 0 rgba(255,225,140,.5),6vw 33vh 0 0 rgba(255,207,82,.5),88vw 30vh 0 0 rgba(255,231,168,.55);
  animation:cwnTwinkle 4.6s ease-in-out infinite;
}
.cwn-dust::after{
  box-shadow:12vw 26vh 0 0 rgba(255,231,168,.6),28vw 31vh 0 0 rgba(255,207,82,.5),40vw 4vh 0 0 rgba(255,255,255,.55),67vw 28vh 0 0 rgba(255,225,140,.45),79vw 24vh 0 0 rgba(255,207,82,.5),95vw 8vh 0 0 rgba(255,231,168,.5),50vw 13vh 0 0 rgba(255,255,255,.5),35vw 38vh 0 0 rgba(255,207,82,.4);
  animation:cwnTwinkle 6.2s ease-in-out infinite reverse;
}
@keyframes cwnTwinkle{ 0%,100%{ opacity:.45; } 50%{ opacity:1; } }

.cwn-vignette{ position:absolute; inset:0; z-index:1; pointer-events:none;
  background:radial-gradient(120% 95% at 50% 34%, transparent 42%, rgba(5,4,14,.66) 100%); }

.cwn-confetti{ position:absolute; inset:0; z-index:7; pointer-events:none; overflow:hidden; }
.cwn-confetti i{ position:absolute; top:30%; left:50%; width:9px; height:13px; border-radius:2px; opacity:0; will-change:transform,opacity; }

.cwn-close{
  position:absolute; top:max(16px,env(safe-area-inset-top)); right:16px; z-index:9;
  width:40px; height:40px; min-width:44px; min-height:44px; border-radius:50%;
  display:grid; place-items:center; cursor:pointer;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14); color:#fff;
  font-size:20px; line-height:1; opacity:0; animation:cwnFadeLate 1s ease 1.7s forwards;
  -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px);
}
.cwn-close:hover{ background:rgba(255,255,255,.16); }
.cwn-close:focus-visible{ outline:2px solid var(--gold-2); outline-offset:2px; }
@keyframes cwnFadeLate{ to{ opacity:1; } }

.cwn-stage{
  position:relative; z-index:2; height:100%;
  display:flex; flex-direction:column; align-items:center;
  padding:max(18px,env(safe-area-inset-top)) 24px max(20px,env(safe-area-inset-bottom));
  max-width:430px; margin:0 auto;
}

.cwn-brand{ width:100%; display:flex; justify-content:center; padding-top:6px;
  opacity:0; animation:cwnFadeDown .7s var(--cwn-ease) .1s forwards; }
.cwn-brand img{ height:22px; width:auto; filter:drop-shadow(0 3px 10px rgba(120,80,220,.6)); }
.cwn-brand img.cwn-broken{ display:none; }
.cwn-brand .cwn-brand-fb{ display:none; font-family:"Baloo 2",sans-serif; font-weight:800; font-size:18px; color:#fff; text-shadow:0 3px 10px rgba(120,80,220,.6); }
.cwn-brand img.cwn-broken + .cwn-brand-fb{ display:inline-block; }
@keyframes cwnFadeDown{ from{ opacity:0; transform:translateY(-8px);} to{ opacity:1; transform:translateY(0);} }

.cwn-kicker{
  margin-top:14px; display:inline-flex; align-items:center; gap:9px;
  padding:7px 16px 7px 11px; border-radius:999px;
  background:linear-gradient(180deg, rgba(255,207,82,.20), rgba(255,207,82,.07));
  border:1px solid rgba(255,207,82,.45);
  box-shadow:0 1px 0 rgba(255,255,255,.18) inset, 0 6px 18px -8px rgba(255,180,40,.6);
  opacity:0; animation:cwnPopIn .6s var(--cwn-spring) .25s forwards;
}
.cwn-kicker .cwn-tick{ width:22px; height:22px; flex:none; border-radius:50%; display:grid; place-items:center;
  background:linear-gradient(180deg, var(--go-1), var(--go-2)); box-shadow:0 2px 0 var(--go-shadow), 0 0 14px -2px rgba(110,224,22,.8); }
.cwn-kicker .cwn-tick svg{ width:13px; height:13px; color:#fff; }
.cwn-kicker span{ font-family:"Fredoka",sans-serif; font-weight:600; font-size:12.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--gold-1); text-shadow:0 1px 6px rgba(255,180,40,.4); }
@keyframes cwnPopIn{ 0%{ opacity:0; transform:scale(.7);} 100%{ opacity:1; transform:scale(1);} }

.cwn-focal{ position:relative; margin-top:8px; width:230px; height:200px; display:flex; align-items:flex-end; justify-content:center; }
.cwn-beam{
  position:absolute; left:50%; bottom:54px; width:160px; height:230px;
  transform:translateX(-50%) scaleY(0); transform-origin:bottom center;
  background:linear-gradient(180deg, rgba(255,236,170,0) 0%, rgba(255,221,120,.30) 45%, rgba(255,205,82,.55) 100%);
  clip-path:polygon(28% 100%, 72% 100%, 92% 0, 8% 0); filter:blur(3px); mix-blend-mode:screen; opacity:0;
  animation:cwnBeamUp .7s var(--cwn-spring) .55s forwards, cwnBeamFlicker 3.5s ease-in-out 1.3s infinite;
}
@keyframes cwnBeamUp{ to{ opacity:.9; transform:translateX(-50%) scaleY(1);} }
@keyframes cwnBeamFlicker{ 0%,100%{ opacity:.78;} 50%{ opacity:1;} }

.cwn-chest{ position:relative; width:172px; height:auto; transform:scale(.3) translateY(30px); opacity:0;
  filter:drop-shadow(0 14px 22px rgba(0,0,0,.55)) drop-shadow(0 0 26px rgba(255,200,90,.55));
  animation:cwnChestPop .85s var(--cwn-spring) .4s forwards, cwnChestFloat 4.5s ease-in-out 1.4s infinite; will-change:transform; }
@keyframes cwnChestPop{ 0%{ opacity:0; transform:scale(.3) translateY(30px);} 60%{ opacity:1;} 100%{ opacity:1; transform:scale(1) translateY(0);} }
@keyframes cwnChestFloat{ 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-6px);} }
.cwn-chest.cwn-broken{ display:none; }
.cwn-chest-fb{ display:none; width:150px; height:110px; margin-bottom:6px; border-radius:14px 14px 12px 12px;
  background:linear-gradient(180deg,#7a4a1c 0%,#5e3614 60%,#4a2a0f 100%); border:3px solid var(--gold-3); position:relative;
  box-shadow:0 14px 22px rgba(0,0,0,.5), 0 0 26px rgba(255,200,90,.5);
  transform:scale(.3) translateY(30px); opacity:0; animation:cwnChestPop .85s var(--cwn-spring) .4s forwards; }
.cwn-chest.cwn-broken + .cwn-chest-fb{ display:block; }
.cwn-chest-fb::before{ content:""; position:absolute; left:50%; top:42%; transform:translate(-50%,-50%); width:26px; height:30px; border-radius:6px; background:linear-gradient(180deg,var(--gold-1),var(--gold-3)); box-shadow:0 2px 0 var(--gold-deep); }
.cwn-chest-fb::after{ content:""; position:absolute; left:-3px; right:-3px; top:30%; height:8px; background:linear-gradient(180deg,var(--gold-2),var(--gold-deep)); }

.cwn-medal{ position:absolute; left:50%; top:-6px; transform:translateX(-50%) scale(0) rotate(-8deg);
  width:62px; height:62px; border-radius:50%; display:grid; place-items:center;
  background:radial-gradient(circle at 38% 32%, #fff4d2 0%, var(--gold-1) 22%, var(--gold-2) 55%, var(--gold-3) 100%);
  border:3px solid #fff7df;
  box-shadow:0 6px 0 var(--gold-deep), 0 12px 24px -6px rgba(180,118,10,.7), 0 0 26px -2px rgba(255,205,82,.85);
  z-index:3; animation:cwnMedalPop .7s var(--cwn-spring) .85s forwards, cwnMedalFloat 4.5s ease-in-out 1.7s infinite; }
.cwn-medal svg{ width:30px; height:30px; color:#7a4a05; }
@keyframes cwnMedalPop{ to{ transform:translateX(-50%) scale(1) rotate(0deg);} }
@keyframes cwnMedalFloat{ 0%,100%{ margin-top:0;} 50%{ margin-top:-5px;} }

.cwn-flash{ position:absolute; left:50%; top:42%; width:10px; height:10px; border-radius:50%;
  transform:translate(-50%,-50%) scale(0);
  background:radial-gradient(closest-side, rgba(255,255,255,.95), rgba(255,235,170,.6) 40%, transparent 70%);
  z-index:4; pointer-events:none; animation:cwnFlash .6s var(--cwn-ease) .55s forwards; }
@keyframes cwnFlash{ 0%{ opacity:0; transform:translate(-50%,-50%) scale(0);} 35%{ opacity:1; transform:translate(-50%,-50%) scale(34);} 100%{ opacity:0; transform:translate(-50%,-50%) scale(46);} }

.cwn-coin{ position:absolute; width:30px; height:30px; z-index:5;
  filter:drop-shadow(0 4px 8px rgba(0,0,0,.45)) drop-shadow(0 0 10px rgba(255,205,82,.6)); opacity:0; }
.cwn-coin.cwn-broken{ display:none; }
.cwn-coin.c1{ left:8%; top:18%; animation:cwnCoinFly .7s var(--cwn-spring) .9s forwards, cwnCoinA 3.6s ease-in-out 1.7s infinite; }
.cwn-coin.c2{ right:6%; top:12%; animation:cwnCoinFly .7s var(--cwn-spring) 1.0s forwards, cwnCoinB 4.0s ease-in-out 1.8s infinite; }
.cwn-coin.c3{ left:16%; top:52%; animation:cwnCoinFly .7s var(--cwn-spring) 1.05s forwards, cwnCoinB 3.3s ease-in-out 1.9s infinite; }
.cwn-coin.c4{ right:14%; top:48%; animation:cwnCoinFly .7s var(--cwn-spring) 1.12s forwards, cwnCoinA 3.9s ease-in-out 2.0s infinite; }
@keyframes cwnCoinFly{ 0%{ opacity:0; transform:scale(.2) translateY(20px);} 100%{ opacity:1; transform:scale(1) translateY(0);} }
@keyframes cwnCoinA{ 0%,100%{ transform:translateY(0) rotate(-6deg);} 50%{ transform:translateY(-9px) rotate(6deg);} }
@keyframes cwnCoinB{ 0%,100%{ transform:translateY(0) rotate(5deg);} 50%{ transform:translateY(-7px) rotate(-7deg);} }

.cwn-titleWrap{ text-align:center; margin-top:10px; }
.cwn-title{
  font-family:"Baloo 2",sans-serif; font-weight:800; font-size:clamp(26px,8.5vw,34px); line-height:1.05;
  letter-spacing:-.3px; max-width:13ch; margin:0 auto; text-wrap:balance;
  color:#fff;
  background:linear-gradient(180deg,#ffffff 0%,#fff7e0 58%,#ffd86b 100%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
  text-shadow:0 2px 0 rgba(70,38,6,.42), 0 4px 14px rgba(0,0,0,.5);
  filter:drop-shadow(0 1px 1px rgba(60,30,5,.45));
  transform:scale(.6); opacity:0; animation:cwnTitleSlam .7s var(--cwn-spring) .75s forwards;
}
@keyframes cwnTitleSlam{ 0%{ opacity:0; transform:scale(.6);} 60%{ opacity:1; transform:scale(1.08);} 100%{ opacity:1; transform:scale(1);} }
.cwn-sub{ margin-top:8px; font-family:"Fredoka",sans-serif; font-weight:500; font-size:15px; color:var(--violet-soft);
  opacity:0; animation:cwnFadeUp .6s var(--cwn-ease) .95s forwards; }
.cwn-sub b{ color:var(--gold-1); font-weight:600; }
@keyframes cwnFadeUp{ from{ opacity:0; transform:translateY(10px);} to{ opacity:1; transform:translateY(0);} }

.cwn-stats{ display:flex; gap:13px; margin-top:18px; width:100%; max-width:320px; }
.cwn-stat{ flex:1; padding:13px 10px 12px; border-radius:18px; text-align:center;
  background:linear-gradient(180deg, rgba(120,85,200,.34), rgba(50,30,100,.40));
  border:1.5px solid rgba(255,207,82,.40);
  box-shadow:0 1px 0 rgba(255,255,255,.22) inset, 0 -10px 18px -12px rgba(0,0,0,.5) inset, 0 10px 22px -10px rgba(0,0,0,.6);
  opacity:0; transform:translateY(14px); }
.cwn-stat.s1{ animation:cwnStatUp .55s var(--cwn-spring) 1.05s forwards; }
.cwn-stat.s2{ animation:cwnStatUp .55s var(--cwn-spring) 1.18s forwards; }
@keyframes cwnStatUp{ to{ opacity:1; transform:translateY(0);} }
.cwn-stat__v{ font-family:"Baloo 2",sans-serif; font-weight:800; font-size:27px; line-height:1; color:var(--gold-1);
  text-shadow:0 2px 0 rgba(90,50,10,.4), 0 5px 10px rgba(0,0,0,.4); font-variant-numeric:tabular-nums; }
.cwn-stat__l{ margin-top:5px; font-family:"Nunito",sans-serif; font-weight:700; font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--violet-soft); }

.cwn-permis{ width:100%; max-width:320px; margin-top:16px; opacity:0; transform:translateY(12px); animation:cwnStatUp .55s var(--cwn-spring) 1.3s forwards; }
.cwn-permis__top{ display:flex; align-items:baseline; justify-content:space-between; margin-bottom:8px; }
.cwn-permis__l{ font-family:"Fredoka",sans-serif; font-weight:600; font-size:13.5px; color:var(--violet-ink); display:inline-flex; align-items:center; gap:7px; }
.cwn-permis__l svg{ width:16px; height:16px; color:var(--gold-2); }
.cwn-permis__pct{ font-family:"Baloo 2",sans-serif; font-weight:800; font-size:16px; color:var(--gold-1); font-variant-numeric:tabular-nums; text-shadow:0 2px 6px rgba(0,0,0,.4); }
.cwn-permis__track{ position:relative; height:16px; border-radius:999px; background:linear-gradient(180deg,#1a1136,#2a1c52); border:1px solid rgba(255,207,82,.22); box-shadow:0 2px 6px rgba(0,0,0,.5) inset; overflow:hidden; }
.cwn-permis__fill{ position:absolute; left:0; top:0; bottom:0; width:0; border-radius:999px;
  background:linear-gradient(180deg, var(--gold-1) 0%, var(--gold-2) 48%, var(--gold-3) 100%);
  box-shadow:0 1px 0 rgba(255,255,255,.5) inset, 0 0 16px -1px rgba(255,200,70,.9); transition:width 1.1s var(--cwn-ease); }
.cwn-permis__fill::after{ content:""; position:absolute; inset:0; background:linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent); transform:translateX(-100%); animation:cwnShine 2.4s var(--cwn-ease) 1.9s infinite; }
@keyframes cwnShine{ 0%{ transform:translateX(-100%);} 60%,100%{ transform:translateX(220%);} }

.cwn-reward{ margin-top:16px; display:inline-flex; align-items:center; gap:10px; padding:9px 18px 9px 12px; border-radius:999px;
  background:linear-gradient(180deg, rgba(255,207,82,.22), rgba(255,180,40,.10)); border:1.5px solid rgba(255,207,82,.5);
  box-shadow:0 1px 0 rgba(255,255,255,.22) inset, 0 8px 20px -8px rgba(255,170,30,.6);
  opacity:0; transform:scale(.7); animation:cwnPopIn .6s var(--cwn-spring) 1.45s forwards, cwnRewardPulse 2.6s var(--cwn-ease) 2.1s infinite; }
@keyframes cwnRewardPulse{ 0%,100%{ box-shadow:0 1px 0 rgba(255,255,255,.22) inset, 0 8px 20px -8px rgba(255,170,30,.6);} 50%{ box-shadow:0 1px 0 rgba(255,255,255,.3) inset, 0 10px 28px -6px rgba(255,180,40,.9);} }
.cwn-reward img{ width:28px; height:28px; filter:drop-shadow(0 3px 6px rgba(0,0,0,.4)); }
.cwn-reward img.cwn-broken{ display:none; }
.cwn-reward .cwn-coin-fb{ display:none; width:28px; height:28px; border-radius:50%; background:radial-gradient(circle at 38% 32%, #fff4d2, var(--gold-2) 55%, var(--gold-3)); border:2px solid #fff7df; box-shadow:0 2px 0 var(--gold-deep); }
.cwn-reward img.cwn-broken + .cwn-coin-fb{ display:inline-block; }
.cwn-reward__n{ font-family:"Baloo 2",sans-serif; font-weight:800; font-size:20px; color:#fff; text-shadow:0 2px 0 rgba(90,50,10,.45), 0 4px 8px rgba(0,0,0,.4); font-variant-numeric:tabular-nums; }
.cwn-reward__l{ font-family:"Nunito",sans-serif; font-weight:800; font-size:13px; color:var(--gold-1); }

.cwn-ctaWrap{ margin-top:auto; padding-top:18px; width:100%; max-width:320px; }
.cwn-cta{ position:relative; width:100%; min-height:60px; border:0; border-radius:20px; cursor:pointer;
  font-family:"Baloo 2",sans-serif; font-weight:800; font-size:19px; letter-spacing:.3px; color:#fff;
  text-shadow:0 2px 0 rgba(40,90,5,.55);
  background:linear-gradient(180deg, var(--go-1) 0%, var(--go-2) 100%);
  box-shadow:0 1.5px 0 rgba(255,255,255,.5) inset, 0 6px 0 var(--go-shadow), 0 10px 22px -6px rgba(70,163,2,.7);
  transform:translateY(0); opacity:0;
  animation:cwnCtaIn .55s var(--cwn-spring) 1.6s forwards, cwnCtaBreath 2.8s var(--cwn-ease) 2.4s infinite;
  transition:transform .08s var(--cwn-ease), box-shadow .08s var(--cwn-ease), filter .15s var(--cwn-ease);
  -webkit-user-select:none; user-select:none; }
.cwn-cta:hover{ filter:brightness(1.05); }
.cwn-cta:active{ transform:translateY(4px); box-shadow:0 1.5px 0 rgba(255,255,255,.5) inset, 0 2px 0 var(--go-shadow), 0 5px 12px -6px rgba(70,163,2,.6); animation-play-state:paused; }
.cwn-cta:focus-visible{ outline:3px solid rgba(255,255,255,.6); outline-offset:3px; }
.cwn-cta svg{ width:20px; height:20px; vertical-align:-4px; margin-left:8px; }
@keyframes cwnCtaIn{ from{ opacity:0; transform:translateY(18px);} to{ opacity:1; transform:translateY(0);} }
@keyframes cwnCtaBreath{ 0%,100%{ transform:translateY(0) scale(1);} 50%{ transform:translateY(0) scale(1.018);} }

.cwn-mascot{ position:absolute; left:14px; bottom:84px; width:86px; height:auto; z-index:6;
  transform:translateY(30px); opacity:0; filter:drop-shadow(0 8px 14px rgba(0,0,0,.5));
  animation:cwnMascotIn .6s var(--cwn-spring) 1.5s forwards, cwnMascotBounce 1.6s var(--cwn-ease) 2.2s infinite; pointer-events:none; }
.cwn-mascot.cwn-broken{ display:none; }
@keyframes cwnMascotIn{ to{ transform:translateY(0); opacity:1; } }
@keyframes cwnMascotBounce{ 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-12px);} }

@media (max-height:760px){
  .cwn-focal{ height:172px; margin-top:2px; }
  .cwn-chest{ width:148px; }
  .cwn-mascot{ width:74px; bottom:78px; }
}
@media (prefers-reduced-motion: reduce){
  .cwn-ov *, .cwn-ov *::before, .cwn-ov *::after{ animation:none !important; transition:none !important; }
  .cwn-rays{ opacity:.7; }
  .cwn-glow,.cwn-chest,.cwn-medal,.cwn-coin,.cwn-title,.cwn-sub,.cwn-kicker,.cwn-stat,.cwn-permis,.cwn-reward,.cwn-cta,.cwn-mascot,.cwn-brand,.cwn-beam,.cwn-close{ opacity:1 !important; transform:none !important; }
  .cwn-flash,.cwn-confetti{ display:none !important; }
}
`;

function ensureStyle() {
  if (typeof document === "undefined") return;
  if (!document.getElementById(FONTS_ID)) {
    const link = document.createElement("link");
    link.id = FONTS_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800&display=swap";
    document.head.appendChild(link);
  }
  if (!document.getElementById(STYLE_ID)) {
    const tag = document.createElement("style");
    tag.id = STYLE_ID;
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }
}

const TICK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const CARD_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><circle cx="8" cy="12" r="2.4"/><path d="M13 10h6M13 14h4"/></svg>`;
const ARROW_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
const VOLANT_SRC = "/skins/volant-coin.webp";

function countUp(el, to, durationMs, reduce) {
  if (!el) return;
  const target = Number(to);
  if (!Number.isFinite(target)) return;
  if (reduce || target <= 0) {
    el.textContent = String(target);
    return;
  }
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / durationMs);
    const e = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(target * e));
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = String(target);
  }
  requestAnimationFrame(frame);
}

function fireConfetti(wrap, reduce) {
  if (reduce || !wrap) return;
  const colors = [
    "#ffcf52",
    "#ffe9a8",
    "#8b6cff",
    "#c9b8ff",
    "#f0a818",
    "#ffffff",
  ];
  for (let i = 0; i < 26; i++) {
    const c = document.createElement("i");
    const angle = (Math.random() * 2 - 1) * 70;
    const dist = 120 + Math.random() * 160;
    const dx = Math.sin((angle * Math.PI) / 180) * dist;
    const dy =
      -Math.cos((angle * Math.PI) / 180) * dist * (0.6 + Math.random() * 0.6);
    const rot = (Math.random() * 2 - 1) * 540;
    const delay = Math.random() * 80;
    const dur = 900 + Math.random() * 700;
    c.style.background = colors[i % colors.length];
    c.style.left = 48 + Math.random() * 4 + "%";
    c.style.top = "34%";
    if (Math.random() > 0.5) c.style.borderRadius = "50%";
    c.style.width = 6 + Math.random() * 6 + "px";
    c.style.height = 8 + Math.random() * 8 + "px";
    c.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${dx}px,${dy * 0.4}px) rotate(${rot * 0.4}deg)`,
          opacity: 1,
          offset: 0.35,
        },
        {
          transform: `translate(${dx * 1.3}px,${dy + 260}px) rotate(${rot}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: dur,
        delay,
        easing: "cubic-bezier(.2,.7,.3,1)",
        fill: "forwards",
      },
    );
    wrap.appendChild(c);
    setTimeout(() => c.remove(), dur + delay + 60);
  }
}

/**
 * Affiche l'écran plein écran "Compétence acquise" (DA Arène / Coffre).
 * @param {Object} opts
 * @param {string}  [opts.competenceCode]  ex: 'C2f' (résout nom + monde)
 * @param {string}  [opts.competenceName]  override du nom affiché
 * @param {number}  [opts.scorePct]        score du quiz (0-100)
 * @param {number}  [opts.validatedCount]  total acquis APRÈS celle-ci
 * @param {number}  [opts.totalComps=31]
 * @param {number}  [opts.volantReward]    volants crédités (défaut 25 ; 0 = aucun)
 * @param {string}  [opts.ctaLabel='Continuer']
 * @param {string}  [opts.source]          analytics : 'quiz' | 'parcours'
 * @param {Function}[opts.onCta]
 * @param {Function}[opts.onClose]
 * @returns {Promise<'cta'|'close'>}
 */
export function showCompetenceUnlock(opts = {}) {
  const {
    competenceCode,
    competenceName,
    scorePct,
    validatedCount,
    totalComps = 31,
    volantReward = COMPETENCE_VOLANT_REWARD,
    ctaLabel = "Continuer",
    source = null,
    onCta,
    onClose,
  } = opts;

  ensureStyle();

  const sub = competenceCode ? findSubComp(competenceCode) : null;
  const cat = competenceCode ? findCategory(competenceCode) : null;
  const world = worldForCategory(cat?.id || competenceCode);
  const name = competenceName || sub?.n || competenceCode || "Compétence";
  const catId = cat?.id || "";
  const worldNom = world?.nom || "";

  const hasScore = typeof scorePct === "number" && Number.isFinite(scorePct);
  const hasCount =
    typeof validatedCount === "number" && Number.isFinite(validatedCount);
  const permisPct = hasCount
    ? Math.max(
        0,
        Math.min(100, Math.round((validatedCount / totalComps) * 100)),
      )
    : null;

  try {
    track("eleve.competence_unlock_shown", {
      competence_id: competenceCode || null,
      score_pct: hasScore ? scorePct : null,
      volant_reward: volantReward || 0,
      source,
    });
  } catch {
    /* best-effort */
  }

  // Crédit RÉEL des volants — SERVEUR, idempotent : une seule récompense par
  // (élève, compétence), même en multi-appareils ou ré-affichage. L'ancien
  // crédit local (addGemmes → UPDATE profiles.gemmes) était bloqué en silence
  // par le trigger protect_profile_fields : le solde montait puis disparaissait.
  // Si le RPC échoue (migration pas encore appliquée / réseau), on garde la
  // célébration sans mentir sur le solde.
  if (volantReward > 0 && competenceCode) {
    (async () => {
      try {
        const { sb } = await import("@/auth/auth.js");
        const { data, error } = await sb.rpc("claim_competence_reward", {
          p_competence_id: competenceCode,
        });
        if (error || data?.error) {
          console.warn(
            "[competence-unlock] claim refusé",
            error || data?.error,
          );
          return;
        }
        // Aligne le cache local sur la vérité serveur, puis rafraîchit la
        // pastille du header (même pattern que open_chest).
        const bal = await refreshGemmes();
        window.dispatchEvent(
          new CustomEvent("pg-gemmes-changed", { detail: { balance: bal } }),
        );
      } catch (e) {
        console.warn("[competence-unlock] claim échec", e);
      }
    })();
  }

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  return new Promise((resolve) => {
    const ov = document.createElement("div");
    ov.className = "cwn-ov";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", `Compétence acquise : ${name}`);

    const subHtml =
      catId || worldNom
        ? `<p class="cwn-sub">${catId ? `<b>${esc(catId)}</b>` : ""}${catId && worldNom ? " · " : ""}${esc(worldNom)}</p>`
        : "";

    const statsHtml = `
      <div class="cwn-stats">
        ${
          hasScore
            ? `<div class="cwn-stat s1"><div class="cwn-stat__v"><span data-count="${escAttr(String(Math.round(scorePct)))}">0</span>%</div><div class="cwn-stat__l">Score</div></div>`
            : ""
        }
        ${
          hasCount
            ? `<div class="cwn-stat s2"><div class="cwn-stat__v"><span data-count="${escAttr(String(validatedCount))}">0</span> / ${esc(String(totalComps))}</div><div class="cwn-stat__l">Acquises</div></div>`
            : ""
        }
      </div>`;

    const permisHtml =
      permisPct != null
        ? `
      <div class="cwn-permis">
        <div class="cwn-permis__top">
          <span class="cwn-permis__l">${CARD_SVG} Permis virtuel</span>
          <span class="cwn-permis__pct"><span data-count="${permisPct}">0</span>%</span>
        </div>
        <div class="cwn-permis__track"><div class="cwn-permis__fill" data-pct="${permisPct}"></div></div>
      </div>`
        : "";

    const rewardHtml =
      volantReward > 0
        ? `
      <div class="cwn-reward">
        <img src="${VOLANT_SRC}" alt="" onerror="this.classList.add('cwn-broken')" />
        <span class="cwn-coin-fb" aria-hidden="true"></span>
        <span class="cwn-reward__n">+<span data-count="${escAttr(String(volantReward))}">0</span></span>
        <span class="cwn-reward__l">volants</span>
      </div>`
        : "";

    ov.innerHTML = `
      <div class="cwn-rays" aria-hidden="true"></div>
      <div class="cwn-glow" aria-hidden="true"></div>
      <div class="cwn-dust" aria-hidden="true"></div>
      <div class="cwn-vignette" aria-hidden="true"></div>
      <div class="cwn-confetti" aria-hidden="true"></div>

      <button class="cwn-close" type="button" aria-label="Fermer">×</button>

      <main class="cwn-stage">
        <div class="cwn-brand">
          <img src="/permigo-logo.png" alt="PermiGo" onerror="this.classList.add('cwn-broken')" />
          <span class="cwn-brand-fb" aria-hidden="true">PermiGo</span>
        </div>

        <div class="cwn-kicker">
          <span class="cwn-tick" aria-hidden="true">${TICK_SVG}</span>
          <span>Compétence acquise</span>
        </div>

        <div class="cwn-focal" aria-hidden="true">
          <div class="cwn-beam"></div>
          <div class="cwn-flash"></div>
          <img class="cwn-chest" src="/skins/chest-open.png" alt="" onerror="this.classList.add('cwn-broken')" />
          <div class="cwn-chest-fb"></div>
          <div class="cwn-medal">${TICK_SVG}</div>
          <img class="cwn-coin c1" src="${VOLANT_SRC}" alt="" onerror="this.classList.add('cwn-broken')" />
          <img class="cwn-coin c2" src="${VOLANT_SRC}" alt="" onerror="this.classList.add('cwn-broken')" />
          <img class="cwn-coin c3" src="${VOLANT_SRC}" alt="" onerror="this.classList.add('cwn-broken')" />
          <img class="cwn-coin c4" src="${VOLANT_SRC}" alt="" onerror="this.classList.add('cwn-broken')" />
        </div>

        <div class="cwn-titleWrap">
          <h1 class="cwn-title">${esc(name)}</h1>
          ${subHtml}
        </div>

        ${statsHtml}
        ${permisHtml}
        ${rewardHtml}

        <div class="cwn-ctaWrap">
          <button type="button" class="cwn-cta">${esc(ctaLabel)} ${ARROW_SVG}</button>
        </div>
      </main>

      <img class="cwn-mascot" src="/skins/mascot-celebrate.png" alt="" onerror="this.classList.add('cwn-broken')" aria-hidden="true" />
    `;

    document.body.appendChild(ov);

    // son + vibration à l'ouverture
    try {
      if (navigator.vibrate) navigator.vibrate([0, 30, 40, 60]);
    } catch {
      /* noop */
    }
    try {
      playReward();
    } catch {
      /* noop */
    }

    void ov.offsetWidth; // reflow → transition fade-in
    ov.classList.add("cwn-show");

    // Confettis au « slam » du titre
    setTimeout(
      () => fireConfetti(ov.querySelector(".cwn-confetti"), reduce),
      780,
    );

    // Compteurs en cascade + remplissage de la barre
    const counts = ov.querySelectorAll("[data-count]");
    setTimeout(() => {
      counts.forEach((el) =>
        countUp(el, el.getAttribute("data-count"), 900, reduce),
      );
      const fill = ov.querySelector(".cwn-permis__fill");
      if (fill) fill.style.width = `${fill.getAttribute("data-pct")}%`;
    }, 1100);

    let done = false;
    const close = (src) => {
      if (done) return;
      done = true;
      ov.classList.remove("cwn-show");
      ov.classList.add("cwn-closing");
      document.removeEventListener("keydown", onKey);
      try {
        onClose?.();
      } catch {
        /* noop */
      }
      setTimeout(() => {
        ov.remove();
        resolve(src);
      }, 300);
    };

    ov.querySelector(".cwn-cta").addEventListener("click", () => {
      try {
        if (navigator.vibrate) navigator.vibrate(20);
      } catch {
        /* noop */
      }
      try {
        onCta?.();
      } catch {
        /* noop */
      }
      close("cta");
    });
    ov.querySelector(".cwn-close").addEventListener("click", () =>
      close("close"),
    );

    const onKey = (e) => {
      if (e.key === "Escape") close("close");
    };
    document.addEventListener("keydown", onKey);
  });
}
