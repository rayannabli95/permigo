// ═══════════════════════════════════════════════════════════════
// Enseignant — Radar de relance
// « Ce matin, X élèves à relancer » : élèves qui refroidissent (inactifs),
// score gradué + message pré-écrit (cadré VALIDATION, jamais de créneau) +
// 3 envois : WhatsApp · SMS · Notif directe (push si app installée).
// La relance part DU moniteur (pas un bot). RPC send_eleve_relance.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { fmtName } from "@/utils/fmt-name.js";
import { illus } from "@/components/enseignant/illus.js";

// Règle produit : relance élève à 14 jours (aligné sur mes-eleves
// INACTIF_SEUIL_MS et insights « à relancer > 14j » — le radar était le
// seul écran à 7j).
const COOL_SEUIL_J = 14;

// Graduation du refroidissement (couleur + libellé)
function coolGrade(jours) {
  if (jours >= 30) return { cls: "icy", label: "Très froid", c: "#b91c1c" };
  if (jours >= 21) return { cls: "cold", label: "Froid", c: "#dc2626" };
  return { cls: "warn", label: "Refroidit", c: "#d97706" };
}

// Messages pré-écrits — cadrés VALIDATION (révision / prochaine validation),
// jamais de créneau ni de date de leçon (charte : pas de planning).
// Variés par palier de refroidissement + variante STABLE par élève (sinon
// tous les élèves reçoivent le même texte mot pour mot = effet robot, à
// l'encontre du « le message part de toi, pas d'un robot »).
const MESSAGES = {
  // 14-20 j : reprise douce
  warn: [
    (p, j) =>
      `Salut ${p} ! Ça fait ${j} jours qu'on s'est pas vus sur PermiGo. Une petite session de révision et tu gardes ton avance — chaque quiz te rapproche de ta prochaine validation. 🚗`,
    (p, j) =>
      `Hello ${p} ! ${j} jours sans réviser, ça se rattrape vite : 5 minutes de quiz et t'es relancé. Ta prochaine validation n'attend que toi. 💪`,
  ],
  // 21-29 j : plus direct
  cold: [
    (p, j) =>
      `${p}, ça fait ${j} jours — tes acquis commencent à refroidir. Reprends une session de révision cette semaine, on revalide ça ensemble. 🚗`,
    (p, j) =>
      `Salut ${p} ! ${j} jours déjà… Ce que tu as validé mérite d'être entretenu. Un quiz rapide et la machine repart. 🔧`,
  ],
  // ≥ 30 j : réengagement empathique
  icy: [
    (p, j) =>
      `Salut ${p}, ça fait un moment (${j} jours) ! Pas de souci, on reprend là où tu t'es arrêté — commence par un petit quiz, le reste suivra. 🚗`,
    (p, j) =>
      `${p}, ton permis n'a pas bougé, il t'attend. ${j} jours de pause, ça arrive — 5 minutes de révision et tu reprends le fil. Je suis là si tu bloques. 👊`,
  ],
};

function defaultMessage(prenom, jours, eleveId = "") {
  const grade = jours >= 30 ? "icy" : jours >= 21 ? "cold" : "warn";
  const pool = MESSAGES[grade];
  // Variante stable par élève (déterministe : pas de texte qui change à
  // chaque rendu) — simple somme des codes du visible de l'id.
  let h = 0;
  for (let i = 0; i < eleveId.length; i++)
    h = (h + eleveId.charCodeAt(i)) % 997;
  return pool[h % pool.length](prenom, jours);
}

const STYLE = `<style>
  .rl-page { max-width: 600px; margin: 0 auto; padding: 0 0 110px; background: #f6f7f9; min-height: 100dvh; font-family: 'Inter', sans-serif; color: #1a1f2b; }
  .rl-hero { position: relative; overflow: hidden; margin-top: calc(-1 * (var(--th,52px) + env(safe-area-inset-top,0px))); padding: calc(env(safe-area-inset-top,0px) + var(--th,52px) + 18px) 18px 20px; color: #fff;
    background: linear-gradient(135deg, #4338ca 0%, #4f46e5 55%, #6d5ef0 100%); }
  .rl-hero::before { content: ''; position: absolute; right: -40px; top: -50px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.16), transparent 70%); pointer-events: none; }
  .rl-hero-kick { font: 800 10px/1 'Inter', sans-serif; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.8); margin-bottom: 8px; position: relative; }
  .rl-hero-title { font: 800 clamp(22px, 6.5vw, 27px)/1.12 'Fredoka', 'Manrope', sans-serif; letter-spacing: -.01em; position: relative; }
  .rl-hero-sub { font: 600 13px/1.5 'Inter', sans-serif; color: rgba(255,255,255,.85); margin-top: 6px; max-width: 42ch; position: relative; }

  .rl-body { padding: 16px 16px 0; display: flex; flex-direction: column; gap: 13px; }

  .rl-card { background: #fff; border: 1px solid #e6e9ef; border-radius: 18px; padding: 14px 15px; box-shadow: 0 8px 22px -14px rgba(26,31,43,.3); }
  .rl-card-top { display: flex; align-items: center; gap: 12px; }
  .rl-av { width: 46px; height: 46px; border-radius: 50%; flex-shrink: 0; overflow: hidden; box-shadow: 0 0 0 2px #eef0f6; }
  .rl-id { flex: 1; min-width: 0; }
  .rl-nom { font: 800 16px/1.15 'Manrope', 'Plus Jakarta Sans', sans-serif; color: #1a1c2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rl-meta { font: 600 12px/1.3 'Inter', sans-serif; color: #5a6188; margin-top: 3px; }
  .rl-badge { flex-shrink: 0; align-self: flex-start; display: inline-flex; align-items: center; gap: 5px; font: 800 10.5px/1 'Inter', sans-serif; padding: 5px 10px; border-radius: 999px; }
  .rl-badge.warn { color: #b45309; background: #fef3c7; }
  .rl-badge.cold { color: #b91c1c; background: #fee2e2; }
  .rl-badge.icy  { color: #fff; background: #b91c1c; }
  .rl-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

  /* Gauge de refroidissement */
  .rl-gauge { height: 6px; border-radius: 99px; background: #eef0f6; overflow: hidden; margin: 12px 0 12px; }
  .rl-gauge > i { display: block; height: 100%; border-radius: 99px; transition: width .5s var(--ease-out, ease); }

  .rl-msg-lbl { font: 700 10px/1 'Inter', sans-serif; letter-spacing: .06em; text-transform: uppercase; color: #5f6788; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .rl-msg { width: 100%; box-sizing: border-box; min-height: 76px; resize: vertical; padding: 11px 12px; border: 1.5px solid #e6e9ef; border-radius: 12px; background: #f7f8fc; color: #2d3050; font: 500 13.5px/1.5 'Inter', sans-serif; outline: none; transition: border-color .15s, box-shadow .15s; }
  .rl-msg:focus { border-color: #4f46e5; background: #fff; box-shadow: 0 0 0 3px rgba(79,70,229,.13); }

  .rl-actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 11px; }
  .rl-btn { min-height: 46px; border: 0; border-radius: 12px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font: 800 12.5px/1 'Inter', sans-serif; -webkit-tap-highlight-color: transparent; transition: transform .1s, filter .12s; }
  .rl-btn:active { transform: scale(.97); }
  .rl-btn.wa { color: #0a3d1c; background: #25d366; box-shadow: 0 4px 0 #1da851; }
  .rl-btn.wa:active { box-shadow: 0 1px 0 #1da851; transform: translateY(2px); }
  .rl-btn.sms { color: #1a1c2e; background: #fff; border: 1.5px solid #d8dceb; }
  .rl-btn.notif { color: #fff; background: linear-gradient(135deg, #4f46e5, #7c4dff); box-shadow: 0 4px 0 #3a32c4; }
  .rl-btn.notif:active { box-shadow: 0 1px 0 #3a32c4; transform: translateY(2px); }
  .rl-btn:disabled { opacity: .55; cursor: default; box-shadow: none; transform: none; }
  .rl-btn svg { flex-shrink: 0; }

  .rl-sent { margin-top: 11px; display: flex; align-items: center; gap: 7px; font: 700 12.5px/1 'Inter', sans-serif; color: #15803d; background: #dcfce7; padding: 10px 12px; border-radius: 11px; }

  /* État vide — inbox zéro */
  .rl-empty { text-align: center; padding: 48px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .rl-empty-t { font: 800 18px/1.2 'Manrope', sans-serif; color: #1a1c2e; }
  .rl-empty-d { font: 500 13.5px/1.6 'Inter', sans-serif; color: #5a6188; max-width: 32ch; }

  .rl-skel { height: 168px; background: #fff; border: 1px solid #e6e9ef; border-radius: 18px; animation: rlPulse 1.4s ease-in-out infinite; }
  @keyframes rlPulse { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
  @media (prefers-reduced-motion: reduce) { .rl-skel { animation: none; } }
</style>`;

let _root = null;
let _me = null;
let _cooling = [];

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;
  track("page.view", { page: "relances", role: _me.role });

  root.innerHTML = `${STYLE}
    <div class="rl-page anim-slide-up">
      <div class="rl-hero">
        <div class="rl-hero-kick">Radar de relance</div>
        <div class="rl-hero-title">Ce matin…</div>
        <div class="rl-hero-sub">Chargement de tes élèves qui refroidissent.</div>
      </div>
      <div class="rl-body">
        ${[1, 2, 3].map(() => `<div class="rl-skel"></div>`).join("")}
      </div>
    </div>`;

  await loadData();
  render();
  wire();
}

async function loadData() {
  // Élèves de l'auto-école (RLS partage l'école) + dernière activité.
  const { data, error } = await sb
    .from("profiles")
    .select("id, prenom, nom, avatar_url, last_active_at")
    .eq("role", "eleve");

  if (error) {
    console.error("[relances] query error", error);
    toast("Impossible de charger le radar", "error");
    _cooling = [];
    return;
  }

  const now = Date.now();
  _cooling = (data || [])
    .map((e) => {
      // Refroidit = a déjà utilisé l'app (last_active_at) mais inactif depuis N j.
      // (un élève jamais venu n'est pas « refroidi » : c'est un autre sujet.)
      if (!e.last_active_at) return null;
      const jours = Math.floor(
        (now - new Date(e.last_active_at).getTime()) / 86400000,
      );
      if (jours < COOL_SEUIL_J) return null;
      return { ...e, jours };
    })
    .filter(Boolean)
    .sort((a, b) => b.jours - a.jours);
}

function render() {
  const n = _cooling.length;
  const page = _root.querySelector(".rl-page");
  if (!page) return;

  const heroTitle =
    n === 0
      ? "Personne à relancer"
      : `${n} élève${n > 1 ? "s" : ""} à relancer`;
  const heroSub =
    n === 0
      ? "Tous tes élèves sont actifs — beau travail."
      : "Relance-les en 1 tap. Le message part de toi, pas d'un robot.";

  const cards =
    n === 0
      ? `<div class="rl-empty">
          ${illus("trophy", { size: 96 })}
          <div class="rl-empty-t">Inbox zéro 🎉</div>
          <div class="rl-empty-d">Aucun élève ne refroidit en ce moment. Reviens demain matin pour ton rituel.</div>
        </div>`
      : _cooling.map(renderCard).join("");

  page.innerHTML = `
    <div class="rl-hero">
      <div class="rl-hero-kick">Radar de relance</div>
      <div class="rl-hero-title">${esc(heroTitle)}</div>
      <div class="rl-hero-sub">${esc(heroSub)}</div>
    </div>
    <div class="rl-body">${cards}</div>`;
}

function renderCard(e) {
  const g = coolGrade(e.jours);
  const nm = esc(fmtName([e.prenom, e.nom].filter(Boolean).join(" ")) || "—");
  // Gauge : 14 j (seuil) = ~35%, 30 j = 100%
  const pct = Math.min(100, Math.round(35 + ((e.jours - 14) / 16) * 65));
  const msg = defaultMessage(fmtName(e.prenom) || "toi", e.jours, e.id);
  return `
    <div class="rl-card" data-eleve-id="${esc(e.id)}">
      <div class="rl-card-top">
        <div class="rl-av">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, 46)}</div>
        <div class="rl-id">
          <div class="rl-nom">${nm}</div>
          <div class="rl-meta">Dernière activité il y a <b>${e.jours} jours</b></div>
        </div>
        <span class="rl-badge ${g.cls}"><span class="dot" aria-hidden="true"></span>${esc(g.label)}</span>
      </div>
      <div class="rl-gauge"><i style="width:${pct}%;background:${g.c}"></i></div>
      <div class="rl-msg-lbl">${icon("edit-3", { size: 12, strokeWidth: 2.4 })} Message (modifiable)</div>
      <textarea class="rl-msg" data-msg aria-label="Message de relance pour ${nm}">${esc(msg)}</textarea>
      <div class="rl-actions">
        <button class="rl-btn wa" data-send="wa" type="button">${icon("message-circle", { size: 15, strokeWidth: 2.3 })} WhatsApp</button>
        <button class="rl-btn sms" data-send="sms" type="button">${icon("send", { size: 15, strokeWidth: 2.3 })} SMS</button>
        <button class="rl-btn notif" data-send="notif" type="button">${icon("bell", { size: 15, strokeWidth: 2.3 })} Notif</button>
      </div>
    </div>`;
}

function wire() {
  _root.querySelectorAll(".rl-card[data-eleve-id]").forEach((card) => {
    const id = card.dataset.eleveId;
    const ta = card.querySelector("[data-msg]");

    card.querySelectorAll("[data-send]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const mode = btn.dataset.send;
        const text = (ta?.value || "").trim();
        if (!text) {
          toast("Écris un petit mot d'abord", "info");
          return;
        }
        haptic("tap");

        if (mode === "wa") {
          track("relance.send", { eleve_id: id, via: "whatsapp" });
          window.open(
            "https://wa.me/?text=" + encodeURIComponent(text),
            "_blank",
          );
          markSent(card, "WhatsApp ouvert — choisis le contact");
        } else if (mode === "sms") {
          track("relance.send", { eleve_id: id, via: "sms" });
          // sms: en mode composition (aucun numéro stocké — charte)
          window.location.href = "sms:?&body=" + encodeURIComponent(text);
          markSent(card, "SMS ouvert — choisis le contact");
        } else if (mode === "notif") {
          btn.disabled = true;
          try {
            const { error } = await sb.rpc("send_eleve_relance", {
              p_eleve_id: id,
              p_message: text,
            });
            if (error) throw error;
            track("relance.send", { eleve_id: id, via: "notif" });
            haptic("success");
            markSent(card, "Notification envoyée à l'élève ✓");
          } catch (err) {
            console.error("[relances] send_eleve_relance", err);
            toast("Envoi impossible pour le moment", "error");
            btn.disabled = false;
          }
        }
      });
    });
  });
}

// Remplace les actions par un état « envoyé » (feedback clair, 1 relance / carte).
function markSent(card, label) {
  const actions = card.querySelector(".rl-actions");
  const ta = card.querySelector("[data-msg]");
  if (ta) ta.setAttribute("readonly", "readonly");
  if (actions) {
    actions.outerHTML = `<div class="rl-sent">${icon("check-circle", { size: 15, strokeWidth: 2.4 })} ${esc(label)}</div>`;
  }
}

export async function unmount() {
  _root = null;
  _cooling = [];
}
