// ═══════════════════════════════════════════════════════════════
// Share Recap — la carte partageable (IMAGE) à la marque du moniteur.
//
// LE levier viral : après une perf (examen blanc, session…), l'élève partage
// une belle carte de son score AU NOM DE SON MONITEUR → la marque du moniteur
// se diffuse (story / WhatsApp). On partage une VRAIE image PNG (pas du texte),
// parce que c'est l'image qu'on partage, jamais le texte.
//
// openShareRecap({ kicker, big, sub, eleveName, moniteurName })
//   kicker      = surtitre (« Examen blanc de conduite »)
//   big         = le gros chiffre (« 27/31 »)
//   sub         = 1 ligne sous le score
//   eleveName   = prénom élève (optionnel)
//   moniteurName= nom du moniteur (optionnel → « ton moniteur »)
// ═══════════════════════════════════════════════════════════════
import { haptic } from "@/utils/haptic.js";
import { track } from "@/services/analytics.js";
import { toast } from "@/components/common/toast.js";
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";

// Résout la marque : prénom élève + prénom du moniteur (me.enseignant_id →
// profiles). Best-effort : si pas de moniteur → « ton moniteur ». Ainsi tout
// appelant n'a qu'à passer kicker/big/sub, la marque est gérée ici.
async function resolveBrand(data) {
  const me = getCurUser();
  const eleveName = data.eleveName ?? (me?.prenom || null);
  let moniteurName = data.moniteurName ?? null;
  if (!moniteurName && me?.enseignant_id) {
    try {
      const { data: m } = await sb
        .from("profiles")
        .select("prenom, nom")
        .eq("id", me.enseignant_id)
        .maybeSingle();
      if (m) moniteurName = (m.prenom || m.nom || "").trim() || null;
    } catch {
      /* repli « ton moniteur » */
    }
  }
  return { ...data, eleveName, moniteurName };
}

const W = 1080;
const H = 1350; // portrait « story »

function loadImg(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

function roundRect(x, rx, ry, rw, rh, r) {
  x.beginPath();
  x.moveTo(rx + r, ry);
  x.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
  x.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
  x.arcTo(rx, ry + rh, rx, ry, r);
  x.arcTo(rx, ry, rx + rw, ry, r);
  x.closePath();
}

function wrap(x, text, cx, cy, maxW, lh) {
  const words = String(text).split(" ");
  let line = "";
  let yy = cy;
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (x.measureText(t).width > maxW && line) {
      x.fillText(line, cx, yy);
      line = w;
      yy += lh;
    } else line = t;
  }
  if (line) x.fillText(line, cx, yy);
  return yy;
}

async function drawCard({ kicker, big, sub, eleveName, moniteurName }) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  try {
    await document.fonts.ready;
  } catch {
    /* fonts best-effort */
  }

  // ── Fond nuit-violet + halos ──
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1b1450");
  g.addColorStop(0.55, "#0c0a26");
  g.addColorStop(1, "#08071c");
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  const glow = x.createRadialGradient(W / 2, -60, 40, W / 2, -60, 720);
  glow.addColorStop(0, "rgba(255,180,60,.22)");
  glow.addColorStop(1, "rgba(255,180,60,0)");
  x.fillStyle = glow;
  x.fillRect(0, 0, W, 560);
  const glow2 = x.createRadialGradient(W / 2, 600, 40, W / 2, 600, 680);
  glow2.addColorStop(0, "rgba(110,70,220,.26)");
  glow2.addColorStop(1, "rgba(110,70,220,0)");
  x.fillStyle = glow2;
  x.fillRect(0, 120, W, 960);
  // étoiles
  x.fillStyle = "rgba(255,255,255,.5)";
  [
    [150, 250, 3],
    [930, 200, 3],
    [770, 360, 2],
    [220, 470, 2],
    [890, 620, 3],
    [120, 720, 2],
  ].forEach(([px, py, r]) => {
    x.beginPath();
    x.arc(px, py, r, 0, 7);
    x.fill();
  });

  // ── Header : logo + PermiGo ──
  x.textBaseline = "middle";
  try {
    const logo = await loadImg("/icon-192.png");
    roundRect(x, 80, 78, 92, 92, 24);
    x.save();
    x.clip();
    x.drawImage(logo, 80, 78, 92, 92);
    x.restore();
  } catch {
    /* logo indispo */
  }
  x.textAlign = "left";
  x.fillStyle = "#fff";
  x.font = "700 48px 'Archivo',sans-serif";
  x.fillText("PermiGo", 190, 126);

  // ── Kicker (pilule dorée) ──
  x.textAlign = "center";
  x.font = "800 30px 'Archivo',sans-serif";
  const k = (kicker || "").toUpperCase();
  const kw = x.measureText(k).width;
  roundRect(x, W / 2 - kw / 2 - 34, 286, kw + 68, 66, 33);
  x.fillStyle = "rgba(255,190,70,.16)";
  x.fill();
  x.lineWidth = 2;
  x.strokeStyle = "rgba(255,190,70,.32)";
  x.stroke();
  x.fillStyle = "#ffd06a";
  x.fillText(k, W / 2, 321);

  // ── Le gros score (or) ──
  const gold = x.createLinearGradient(0, 430, 0, 660);
  gold.addColorStop(0, "#ffe27a");
  gold.addColorStop(1, "#ff9b1e");
  x.fillStyle = gold;
  let fs = 230;
  x.font = `800 ${fs}px 'Archivo',sans-serif`;
  while (x.measureText(big).width > W - 200 && fs > 90) {
    fs -= 10;
    x.font = `800 ${fs}px 'Archivo',sans-serif`;
  }
  x.fillText(String(big), W / 2, 560);

  // ── Sous-titre ──
  x.fillStyle = "#d9d4f5";
  x.font = "500 42px 'Archivo',sans-serif";
  wrap(x, sub || "", W / 2, 730, W - 200, 56);

  // ── Élève ──
  if (eleveName) {
    x.fillStyle = "#fff";
    x.font = "700 52px 'Archivo',sans-serif";
    x.fillText(`${eleveName}, ça avance 🔥`, W / 2, 900);
  }

  // ── Bande « marque moniteur » ──
  x.strokeStyle = "rgba(255,255,255,.12)";
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(120, H - 372);
  x.lineTo(W - 120, H - 372);
  x.stroke();
  x.fillStyle = "#9a93cf";
  x.font = "600 32px 'Archivo',sans-serif";
  x.fillText("JE RÉVISE MA CONDUITE AVEC", W / 2, H - 300);
  x.fillStyle = "#ffd06a";
  x.font = "800 64px 'Archivo',sans-serif";
  x.fillText(moniteurName || "ton moniteur", W / 2, H - 222);
  x.fillStyle = "#8a83c0";
  x.font = "500 32px 'Archivo',sans-serif";
  x.fillText("entre les leçons, sur PermiGo", W / 2, H - 146);

  return c;
}

function ensureStyle() {
  if (document.getElementById("srk-style")) return;
  const s = document.createElement("style");
  s.id = "srk-style";
  s.textContent = `
.srk-bg{position:fixed;inset:0;z-index:10080;display:flex;align-items:flex-end;justify-content:center;
  background:rgba(8,7,28,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  padding-bottom:env(safe-area-inset-bottom,0);animation:srkFade .2s ease both;}
@keyframes srkFade{from{opacity:0}to{opacity:1}}
.srk{width:100%;max-width:480px;background:var(--su);border-radius:26px 26px 0 0;padding:18px 18px max(16px,env(safe-area-inset-bottom));
  animation:srkUp .3s cubic-bezier(.32,.72,0,1) both;}
@keyframes srkUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.srk-h{font:800 17px/1.2 'Archivo',sans-serif;color:var(--ink);text-align:center;margin:4px 0 12px;}
.srk-prev{display:block;width:62%;max-width:240px;margin:0 auto 16px;border-radius:18px;
  box-shadow:0 18px 44px -14px rgba(0,0,0,.6);}
.srk-act{display:flex;gap:10px;}
.srk-share{flex:1;border:0;border-radius:16px;min-height:52px;cursor:pointer;
  font:800 15px 'Archivo',sans-serif;color:#3a1d00;
  background:linear-gradient(180deg,#ffd24a,#ff9c1c);box-shadow:0 4px 0 #b85e00;
  display:flex;align-items:center;justify-content:center;gap:8px;}
.srk-share:active{transform:translateY(3px);box-shadow:0 1px 0 #b85e00;}
.srk-close{padding:0 20px;min-height:52px;border:1.5px solid var(--bo4);border-radius:16px;background:var(--bg);
  color:var(--mu3);font:700 15px 'Archivo',sans-serif;cursor:pointer;}
@media (prefers-reduced-motion:reduce){.srk-bg,.srk{animation:none}}`;
  document.head.appendChild(s);
}

async function shareCanvas(canvas, data) {
  const blob = await new Promise((res) =>
    canvas.toBlob(res, "image/png", 0.95),
  );
  if (!blob) return;
  const file = new File([blob], "permigo-recap.png", { type: "image/png" });
  const text = `${data.big} — ${data.kicker}. Je révise ma conduite avec ${data.moniteurName || "mon moniteur"} sur PermiGo 🚗`;
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text });
      track("recap.shared", { kind: "image", kicker: data.kicker });
      return;
    }
    if (navigator.share) {
      await navigator.share({ text, url: location.origin });
      track("recap.shared", { kind: "text", kicker: data.kicker });
      return;
    }
  } catch {
    /* partage annulé — silencieux */
    return;
  }
  // Fallback : téléchargement de l'image
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "permigo-recap.png";
  a.click();
  toast("Image enregistrée 📲", "success");
  track("recap.shared", { kind: "download", kicker: data.kicker });
}

export async function openShareRecap(rawData) {
  haptic("select");
  ensureStyle();
  track("recap.open", { kicker: rawData.kicker });
  // Résout la marque (prénom élève + moniteur) une fois ; tout le reste s'en sert.
  const data = await resolveBrand(rawData);

  const overlay = document.createElement("div");
  overlay.className = "srk-bg";
  overlay.innerHTML = `<div class="srk" role="dialog" aria-modal="true" aria-label="Partager ma carte">
    <div class="srk-h">Ta carte est prête 🎉</div>
    <div class="srk-prev-host"></div>
    <div class="srk-act">
      <button class="srk-share" id="srk-share">📲 Partager</button>
      <button class="srk-close" id="srk-close">Fermer</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector("#srk-close").addEventListener("click", close);
  window.addEventListener("hashchange", close, { once: true });

  let canvas = null;
  try {
    canvas = await drawCard(data);
    canvas.className = "srk-prev";
    overlay.querySelector(".srk-prev-host").appendChild(canvas);
  } catch (e) {
    console.error("[share-recap] draw", e);
  }

  overlay.querySelector("#srk-share").addEventListener("click", async () => {
    haptic("tap");
    if (canvas) await shareCanvas(canvas, data);
  });
}
