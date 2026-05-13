/**
 * Hero Key Scrub — vidéo cinématographique pilotée par le scroll/swipe.
 *
 * Inspiré de l'approche Apple : la vidéo MP4 reste en position sticky pendant
 * que l'utilisateur scroll, et chaque pixel de scroll avance la `currentTime`
 * de la vidéo. Résultat : la clé se rapproche au rythme du scroll.
 *
 * Usage :
 *   import { mountHeroKeyScrub } from '@/components/hero-key-scrub.js';
 *   mountHeroKeyScrub(rootEl);  // monte le composant en début de rootEl
 *
 * Le markup attendu (inséré par mountHeroKeyScrub) :
 *   <section class="hks-section">              ← 240vh de hauteur (drives scroll)
 *     <div class="hks-sticky">                  ← sticky top:0, 100vh
 *       <video class="hks-video" />
 *       <div class="hks-overlay">…</div>
 *     </div>
 *   </section>
 *
 * Accessibility :
 *  - prefers-reduced-motion → vidéo joue une fois en lecture normale (pas de scrub)
 *  - `aria-label` sur la vidéo
 *  - Texte overlay reste lisible par lecteur d'écran
 *
 * Performance :
 *  - `preload="auto"` + premier `load()` au mount
 *  - `requestAnimationFrame` throttle des updates
 *  - `playsinline` + `muted` pour autoplay mobile
 */

const SECTION_VH = 100; // 1 écran exactement — pas besoin de scroll-area géante
const VIDEO_SRC = 'hero-key-1080.mp4'; // 1920x1080, 6s, 24fps (path relatif → compatible GitHub Pages base)

// Détection appareil — params adaptés (mobile = plus rapide à compléter, seek plus tolérant)
const IS_TOUCH = (typeof navigator !== 'undefined') && (
  /iPad|iPhone|iPod|Android/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
  (typeof window !== 'undefined' && window.matchMedia('(pointer:coarse)').matches)
);

const LERP_FACTOR     = IS_TOUCH ? 0.18 : 0.10; // smoothing interne — plus agressif sur mobile pour rattraper
const STEPS_PER_SCROLL = IS_TOUCH ? 1100 : 2200; // pixels de swipe pour finir l'anim
const TOUCH_MULTIPLIER = 2.2;                    // amplifie le delta touch
const SEEK_THRESHOLD  = IS_TOUCH ? 0.05 : 0.02;  // évite re-decode inutile sur iOS
// 5 steps espacés (~20% de scroll chacun) — laisse le temps de lire
const OVERLAY_STEPS = [
  { from: 0.00, to: 0.22, eyebrow: 'PERMIGO',     title: 'Ton permis.',                sub: 'Sans détour.' },
  { from: 0.22, to: 0.42, eyebrow: 'PROGRESSION', title: 'Compétence par compétence.', sub: '31 sous-compétences validées par ton enseignant.' },
  { from: 0.42, to: 0.62, eyebrow: 'ACCOMPAGNÉ',  title: 'Un enseignant dédié.',       sub: 'Qui te guide à chaque virage.' },
  { from: 0.62, to: 0.82, eyebrow: 'LA CLÉ',      title: 'Près du but.',               sub: 'Ton autonomie se rapproche.' },
  { from: 0.82, to: 1.01, eyebrow: 'TON TOUR',    title: 'Elle est à toi.',            sub: 'Démarre maintenant.' },
];

export function mountHeroKeyScrub(rootEl, opts = {}) {
  // Skeleton HTML
  const host = document.createElement('section');
  host.className = 'hks-section';
  host.setAttribute('aria-label', 'Présentation PermiGo');
  host.innerHTML = `
    <style>
      .hks-section{position:relative;width:100%;height:${SECTION_VH}vh;z-index:5;background:#0b0d1a}
      /* Fond gradient dramatique derrière la vidéo "fenêtre" */
      .hks-sticky{position:sticky;top:0;width:100%;height:100vh;overflow:hidden;background:radial-gradient(45% 45% at 50% 30%,#1e1b4b 0%,#0f1234 30%,#070819 65%,#030412 100%)}
      .hks-sticky::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 20% 20%,rgba(99,102,241,.18) 0%,transparent 40%),radial-gradient(ellipse at 80% 70%,rgba(139,92,246,.16) 0%,transparent 45%);pointer-events:none;animation:hks-bg-shift 18s ease-in-out infinite alternate}
      @keyframes hks-bg-shift{0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.1) translate(-2%,3%)}}
      /* Wrapper vidéo : scale + clip-path inset animés via JS pour effet "fenêtre cinéma qui s'ouvre" */
      /* État initial moins agressif → la clé est lisible dès la 1ère frame */
      .hks-video-wrap{position:absolute;inset:0;overflow:hidden;will-change:transform,clip-path;transform-origin:50% 50%;background:#000;clip-path:inset(28% 18% 28% 18% round 280px);transform:scale(.92);box-shadow:0 30px 80px -20px rgba(0,0,0,.7),0 0 60px -10px rgba(139,92,246,.25)}
      /* object-position center : centre vraiment la clé */
      .hks-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;will-change:contents;background:#000}
      /* Voile dégradé pour lisibilité texte — SANS blend mode (qui causait le noir 10-30%) */
      .hks-veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.4) 0%,transparent 25%,transparent 65%,rgba(0,0,0,.55) 100%);pointer-events:none}
      /* Vignette dynamique qui s'intensifie au zoom */
      .hks-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.45) 100%);will-change:opacity;transition:opacity .15s linear}
      /* Grain cinéma subtil */
      .hks-grain{position:absolute;inset:0;pointer-events:none;opacity:.08;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/></svg>");background-size:220px 220px;animation:hks-grain 1.6s steps(6) infinite}
      @keyframes hks-grain{0%{transform:translate(0,0)}20%{transform:translate(-4%,3%)}40%{transform:translate(3%,-5%)}60%{transform:translate(-2%,2%)}80%{transform:translate(5%,-3%)}100%{transform:translate(0,0)}}
      /* Overlay textuel : centré, change selon la progression */
      .hks-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 24px 14vh;text-align:center;pointer-events:none;color:#fff}
      .hks-eyebrow{font-family:var(--fn,'JetBrains Mono',monospace);font-size:11px;font-weight:800;letter-spacing:.35em;color:rgba(255,255,255,.85);text-transform:uppercase;margin-bottom:14px;text-shadow:0 2px 12px rgba(0,0,0,.6);transition:opacity .4s cubic-bezier(.2,.7,.3,1),transform .4s cubic-bezier(.2,.7,.3,1)}
      .hks-title{font-family:var(--fd,'Archivo',sans-serif);font-weight:900;font-size:clamp(36px,7vw,72px);letter-spacing:-.03em;line-height:1.05;margin:0 0 12px;text-shadow:0 4px 24px rgba(0,0,0,.6);transition:opacity .4s cubic-bezier(.2,.7,.3,1),transform .4s cubic-bezier(.2,.7,.3,1)}
      .hks-sub{font-family:var(--fb,'Space Grotesk',sans-serif);font-weight:600;font-size:clamp(15px,2.2vw,20px);color:rgba(255,255,255,.9);max-width:520px;text-shadow:0 2px 12px rgba(0,0,0,.5);transition:opacity .4s cubic-bezier(.2,.7,.3,1),transform .4s cubic-bezier(.2,.7,.3,1)}

      .hks-text.entering{opacity:0;transform:translateY(8px)}
      .hks-text.active{opacity:1;transform:translateY(0)}
      .hks-text.leaving{opacity:0;transform:translateY(-8px)}

      /* Indicateur scroll en bas */
      .hks-scroll-hint{position:absolute;bottom:36px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;color:rgba(255,255,255,.7);font-family:var(--fn,monospace);font-size:10px;font-weight:800;letter-spacing:.3em;text-transform:uppercase;pointer-events:none;animation:hks-bounce 2.4s ease-in-out infinite}
      .hks-scroll-hint .arrow{display:block;width:1px;height:24px;background:linear-gradient(180deg,rgba(255,255,255,.8),transparent)}
      @keyframes hks-bounce{0%,100%{transform:translateX(-50%) translateY(0);opacity:.7}50%{transform:translateX(-50%) translateY(6px);opacity:1}}
      .hks-scroll-hint.hidden{opacity:0;transition:opacity .4s}

      /* Bouton Skip pour passer l'anim (accessibilité) */
      .hks-skip{position:absolute;top:24px;right:24px;z-index:10;padding:8px 14px;border-radius:99px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.85);font-family:var(--fn,monospace);font-size:11px;font-weight:800;letter-spacing:.15em;cursor:pointer;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:background .15s,transform .15s;text-transform:uppercase}
      .hks-skip:hover{background:rgba(255,255,255,.16);transform:translateY(-1px)}
      .hks-skip.hidden{opacity:0;pointer-events:none;transition:opacity .3s}

      /* Barre progression scrub (subtile, en bas) */
      .hks-progress{position:absolute;bottom:0;left:0;height:2px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#0ea5e9);width:0%;transition:width .08s linear;box-shadow:0 0 12px rgba(139,92,246,.6)}

      /* prefers-reduced-motion : skip scrub, juste loop la vidéo */
      @media (prefers-reduced-motion: reduce){
        .hks-section{height:100vh}
        .hks-sticky{position:relative}
        .hks-text{transition:none}
      }
    </style>

    <div class="hks-sticky">
      <div class="hks-video-wrap" id="hks-video-wrap">
        <video class="hks-video" muted playsinline webkit-playsinline="true" x5-playsinline="true" preload="auto" disablepictureinpicture aria-label="Démonstration : un enseignant tend les clés de la voiture">
          <source src="${VIDEO_SRC}" type="video/mp4">
        </video>
      </div>
      <div class="hks-veil" aria-hidden="true"></div>
      <div class="hks-vignette" id="hks-vignette" aria-hidden="true"></div>
      <div class="hks-grain" aria-hidden="true"></div>

      <div class="hks-overlay" role="presentation">
        <div class="hks-text active" id="hks-text">
          <div class="hks-eyebrow">${OVERLAY_STEPS[0].eyebrow}</div>
          <h2 class="hks-title">${OVERLAY_STEPS[0].title}</h2>
          <p class="hks-sub">${OVERLAY_STEPS[0].sub}</p>
        </div>
      </div>

      <div class="hks-scroll-hint" id="hks-hint" aria-hidden="true">
        SCROLL POUR DÉCOUVRIR
        <span class="arrow"></span>
      </div>
      <button class="hks-skip" id="hks-skip" type="button" aria-label="Passer l'animation d'introduction">
        Passer ›
      </button>

      <div class="hks-progress" id="hks-progress" aria-hidden="true"></div>
    </div>
  `;

  // Insertion en première position du root (juste sous la nav)
  if (opts.insertAfter) {
    opts.insertAfter.after(host);
  } else {
    rootEl.prepend(host);
  }

  const video = host.querySelector('.hks-video');
  const videoWrap = host.querySelector('#hks-video-wrap');
  const vignette = host.querySelector('#hks-vignette');
  const textHost = host.querySelector('#hks-text');
  const progressBar = host.querySelector('#hks-progress');
  const hint = host.querySelector('#hks-hint');
  const skipBtn = host.querySelector('#hks-skip');

  // Skip : envoie directement à progress = 1 (fluide via lerp)
  skipBtn?.addEventListener('click', () => {
    accumulated = STEPS_PER_SCROLL;
    updateTargetFromAccumulated();
    ensureRafLoop();
    skipBtn.classList.add('hidden');
  });

  let videoDuration = 0;
  let curStepIdx = 0;
  let targetProgress = 0;
  let currentProgress = 0;
  let rafLoop = null;
  let accumulated = 0; // pixels de delta cumulés (notre "scroll virtuel")
  let touchY = 0;      // pour calculer delta touch

  // Reduce motion = juste laisser jouer en loop, pas de scrub
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    video.setAttribute('loop', '');
    video.setAttribute('autoplay', '');
    video.muted = true;
    video.play().catch(() => {});
    videoWrap.style.clipPath = 'inset(6% 4% 6% 4% round 36px)';
    videoWrap.style.transform = 'scale(1)';
    hint.classList.add('hidden');
    skipBtn?.classList.add('hidden');
    return { destroy: () => host.remove() };
  }

  // CTA "Voir la suite ↓" — toujours présent, fallback si l'user ne veut pas scrub
  const ctaBtn = document.createElement('button');
  ctaBtn.type = 'button';
  ctaBtn.className = 'hks-cta-skip';
  ctaBtn.innerHTML = 'Voir la suite ↓';
  ctaBtn.style.cssText = 'position:absolute;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 22px;border-radius:99px;background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.25);font-family:var(--fd,sans-serif);font-size:12.5px;font-weight:800;letter-spacing:.2px;cursor:pointer;z-index:11;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;transition:opacity .4s ease,background .15s;pointer-events:none';
  host.querySelector('.hks-sticky').appendChild(ctaBtn);
  // Affiche après 2.5s si l'user n'a pas commencé à scrub
  let ctaShown = false;
  setTimeout(() => {
    if (currentProgress < 0.05 && !ctaShown) {
      ctaShown = true;
      ctaBtn.style.opacity = '1';
      ctaBtn.style.pointerEvents = 'auto';
    }
  }, 2500);
  ctaBtn.addEventListener('click', () => {
    const top = host.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({ top, behavior: 'smooth' });
  });

  // Première frame en attendant le scroll
  video.addEventListener('loadedmetadata', () => {
    videoDuration = video.duration;
    // Hack iOS Safari : force un play+pause pour "déverrouiller" currentTime
    const unlockIOS = () => {
      video.play().then(() => {
        video.pause();
        video.currentTime = 0.01;
      }).catch(() => {
        // Si play refusé, attend un touch user
        video.currentTime = 0.01;
      });
    };
    unlockIOS();
  });

  // Sur iOS, le 1er touch user-activated permet de déverrouiller la vidéo
  const unlockOnTouch = () => {
    video.play().then(() => video.pause()).catch(() => {});
    window.removeEventListener('touchstart', unlockOnTouch);
    window.removeEventListener('click', unlockOnTouch);
  };
  window.addEventListener('touchstart', unlockOnTouch, { once: true, passive: true });
  window.addEventListener('click', unlockOnTouch, { once: true });

  // Évite que la vidéo joue en mode auto (on contrôle currentTime manuellement)
  video.addEventListener('play', () => {
    if (!reduceMotion && videoDuration > 0) video.pause();
  });

  /** Renvoie true si la section est "active" (top du viewport pile dessus). */
  function isInLockZone() {
    const rect = host.getBoundingClientRect();
    return rect.top <= 1 && rect.bottom > 1;
  }

  /** Met à jour targetProgress depuis l'accumulateur (clamped 0..1). */
  function updateTargetFromAccumulated() {
    accumulated = Math.max(0, Math.min(STEPS_PER_SCROLL, accumulated));
    targetProgress = accumulated / STEPS_PER_SCROLL;
  }

  /** Boucle RAF : interpole currentProgress vers targetProgress avec inertie. */
  function tick() {
    rafLoop = null;
    const delta = targetProgress - currentProgress;
    const absDelta = Math.abs(delta);

    if (absDelta > 0.0008) {
      currentProgress += delta * LERP_FACTOR;
      applyProgress(currentProgress);
      rafLoop = requestAnimationFrame(tick);
    } else {
      // Snap final pour éviter d'osciller sur des fractions
      currentProgress = targetProgress;
      applyProgress(currentProgress);
    }
  }

  function ensureRafLoop() {
    if (rafLoop) return;
    rafLoop = requestAnimationFrame(tick);
  }

  /** Applique l'état visuel pour un progress donné (smoothed). */
  function applyProgress(progress) {
    // Sync vidéo (seuil adapté à l'appareil → évite re-decode inutile sur iOS)
    if (videoDuration) {
      const t = progress * videoDuration;
      if (Math.abs(video.currentTime - t) > SEEK_THRESHOLD) {
        try { video.currentTime = t; } catch (_) {}
      }
    }

    // ─── Effet "fenêtre cinéma qui s'ouvre" — recalibré ───
    // État 0   : ovale large (28% Y / 18% X, round 280px) — la clé est DÉJÀ visible
    // État 70% : presque plein écran (6% / 4%, round 36px)
    // État 100%: léger zoom + petit translate up
    const openProgress = Math.min(progress / 0.7, 1);
    const ease = openProgress * openProgress * (3 - 2 * openProgress); // smoothstep

    const insetY = (1 - ease) * 22 + 6;   // 28% → 6%
    const insetX = (1 - ease) * 14 + 4;   // 18% → 4%
    const round  = (1 - ease) * 244 + 36; // 280px → 36px
    videoWrap.style.clipPath = `inset(${insetY.toFixed(1)}% ${insetX.toFixed(1)}% ${insetY.toFixed(1)}% ${insetX.toFixed(1)}% round ${round.toFixed(0)}px)`;

    const scale = openProgress < 1
      ? (0.92 + ease * 0.08)               // 0.92 → 1.0
      : (1.0 + (progress - 0.7) / 0.3 * 0.10); // 1.0 → 1.10 sur le dernier 30%
    const kbY = -progress * 14;
    videoWrap.style.transform = `scale(${scale.toFixed(3)}) translateY(${kbY.toFixed(1)}px)`;

    const vigOpacity = openProgress < 1 ? 0.12 : (0.12 + (progress - 0.7) / 0.3 * 0.45);
    vignette.style.opacity = vigOpacity.toFixed(2);

    progressBar.style.width = (progress * 100).toFixed(2) + '%';

    if (progress > 0.04) hint.classList.add('hidden');
    if (progress > 0.05 && ctaBtn) { ctaBtn.style.opacity = '0'; ctaBtn.style.pointerEvents = 'none'; }
    if (progress > 0.95 && skipBtn) skipBtn.classList.add('hidden');

    const stepIdx = OVERLAY_STEPS.findIndex(s => progress >= s.from && progress < s.to);
    const safeIdx = stepIdx >= 0 ? stepIdx : (progress >= 1 ? OVERLAY_STEPS.length - 1 : 0);
    if (safeIdx !== curStepIdx) {
      swapText(OVERLAY_STEPS[safeIdx]);
      curStepIdx = safeIdx;
    }
  }

  function swapText(step) {
    textHost.classList.remove('active');
    textHost.classList.add('leaving');
    setTimeout(() => {
      textHost.innerHTML = `
        <div class="hks-eyebrow">${step.eyebrow}</div>
        <h2 class="hks-title">${step.title}</h2>
        <p class="hks-sub">${step.sub}</p>
      `;
      textHost.classList.remove('leaving');
      textHost.classList.add('entering');
      // Force reflow puis trigger l'animation active
      void textHost.offsetWidth;
      requestAnimationFrame(() => {
        textHost.classList.remove('entering');
        textHost.classList.add('active');
      });
    }, 350);
  }

  // ─── Wheel desktop ───
  function onWheel(e) {
    if (!isInLockZone()) return;

    // Anim finie + scroll vers le bas → on laisse passer (libère la page)
    if (currentProgress >= 0.999 && e.deltaY > 0) return;
    // Anim au début + scroll vers le haut → on laisse passer (revient en arrière)
    if (currentProgress <= 0.001 && e.deltaY < 0) return;

    e.preventDefault();
    accumulated += e.deltaY;
    updateTargetFromAccumulated();
    ensureRafLoop();
  }

  // ─── Touch mobile ───
  function onTouchStart(e) {
    if (!isInLockZone()) return;
    touchY = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (!isInLockZone()) return;

    const newY = e.touches[0].clientY;
    const delta = (touchY - newY) * TOUCH_MULTIPLIER; // + = scroll vers le bas
    touchY = newY;

    if (currentProgress >= 0.999 && delta > 0) return;
    if (currentProgress <= 0.001 && delta < 0) return;

    e.preventDefault();
    accumulated += delta;
    updateTargetFromAccumulated();
    ensureRafLoop();
  }

  // ─── Clavier (Space, PageDown, Down) ───
  function onKey(e) {
    if (!isInLockZone()) return;
    let delta = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') delta = 200;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') delta = -200;
    else if (e.key === 'End') delta = STEPS_PER_SCROLL; // skip
    else if (e.key === 'Home') delta = -STEPS_PER_SCROLL;
    else return;

    if (currentProgress >= 0.999 && delta > 0) return;
    if (currentProgress <= 0.001 && delta < 0) return;

    e.preventDefault();
    accumulated += delta;
    updateTargetFromAccumulated();
    ensureRafLoop();
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('keydown', onKey);

  // Première passe
  applyProgress(0);

  return {
    destroy() {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
      if (rafLoop) cancelAnimationFrame(rafLoop);
      host.remove();
    },
  };
}
