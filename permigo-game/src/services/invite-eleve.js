// ═══════════════════════════════════════════════════════════════
// Service — Invitation élève
// Modal bottom-sheet : génère un lien token + best-effort email
// Factorisé pour être appelé depuis mes-eleves.js et aujourdhui.js
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { toast } from "@/components/common/toast.js";
import { enableSheetSwipe } from "@/utils/sheet-swipe.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { icon } from "@/utils/icons.js";
import { playNotify } from "@/utils/sound.js";

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function parseEmails(raw) {
  return [
    ...new Set(
      raw
        .split(/[,;\n]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => EMAIL_RE.test(s)),
    ),
  ];
}

export function openInviteEleveModal(me) {
  if (!me?.auto_ecole_id) {
    toast(
      "Ton profil ne contient pas d'auto-école — contacte le gérant.",
      "error",
    );
    return;
  }

  const ov = document.createElement("div");
  ov.id = "me-inv-overlay";
  ov.style.cssText =
    "position:fixed;inset:0;z-index:9990;background:rgba(10,13,26,.55);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;animation:meInvFade .28s ease;";
  ov.innerHTML = `
    <style>
      @keyframes meInvSlide { from { transform:translateY(100%); } to { transform:translateY(0); } }
      @keyframes meInvFade  { from { opacity:0; } to { opacity:1; } }
      @keyframes meInvRowIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      @keyframes meInvTtlIn { from { opacity:0; transform:scale(.94); } to { opacity:1; transform:scale(1); } }
      .me-inv-sheet {
        width:100%; max-width:520px;
        background:var(--su,#fff);
        border-radius:28px 28px 0 0;
        padding:8px 20px calc(28px + env(safe-area-inset-bottom,0px));
        animation: meInvSlide .36s cubic-bezier(.32,.72,0,1);
        font-family:'Archivo',sans-serif; color:var(--ink);
        box-shadow:0 -8px 32px rgba(10,13,26,.14);
        /* Clavier mobile : la feuille doit tenir dans le viewport VISIBLE et
           défiler — sinon le clavier recouvre le champ email (saisie à
           l'aveugle, « ça ne marche pas »). */
        box-sizing:border-box;
        max-height:calc(100dvh - 24px);
        overflow-y:auto;
        -webkit-overflow-scrolling:touch;
        overscroll-behavior:contain;
      }
      .me-inv-grab {
        width:36px; height:4px; background:var(--bo);
        border-radius:2px; margin:8px auto 18px;
      }
      .me-inv-title {
        font:800 20px/1.2 'Archivo',sans-serif;
        color:var(--ink); margin:0 0 4px; letter-spacing:-.02em;
      }
      .me-inv-sub {
        font:500 13px/1.5 'Archivo',sans-serif; color:var(--mu,var(--mu3));
        margin:0 0 16px;
      }
      /* Bloc code élève — CTA principal */
      .me-inv-code-card {
        margin:4px 0 18px; padding:16px 16px 14px;
        border-radius:18px;
        background:color-mix(in srgb, var(--a) 8%, var(--su2));
        border:1px solid color-mix(in srgb, var(--a) 22%, transparent);
      }
      .me-inv-code-label {
        font:700 11px/1 'Archivo',sans-serif; color:var(--a-txt);
        text-transform:uppercase; letter-spacing:.06em; margin-bottom:8px;
      }
      .me-inv-code-value {
        font:800 30px/1 'IBM Plex Mono',monospace; color:var(--ink);
        letter-spacing:.1em; margin-bottom:6px; user-select:all;
      }
      .me-inv-code-hint {
        font:500 12px/1.45 'Archivo',sans-serif; color:var(--mu,var(--mu3));
        margin-bottom:12px;
      }
      .me-inv-code-edit {
        width:100%; margin-top:10px; padding:8px; border:0; background:none;
        color:var(--mu,var(--mu3)); font:600 12px/1 'Archivo',sans-serif;
        text-decoration:underline; text-underline-offset:2px; cursor:pointer;
        font-family:inherit;
      }
      .me-inv-code-edit:hover { color:var(--ink); }
      .me-inv-code-form { display:flex; gap:8px; align-items:center; }
      .me-inv-code-input {
        flex:1; padding:11px 13px; border-radius:11px;
        border:1.5px solid var(--bo); background:var(--su);
        font:800 16px/1 'IBM Plex Mono',monospace; color:var(--ink);
        letter-spacing:.08em; text-transform:uppercase; min-width:0;
      }
      .me-inv-code-input:focus {
        outline:0; border-color:var(--a);
        box-shadow:0 0 0 3px color-mix(in srgb, var(--a) 12%, transparent);
      }
      .me-inv-code-msg {
        font:500 12px/1.4 'Archivo',sans-serif; margin-top:8px; min-height:14px;
      }
      .me-inv-code-msg.err { color:var(--rd-txt); }
      .me-inv-code-msg.ok { color:var(--grd); }
      .me-inv-or {
        display:flex; align-items:center; gap:10px;
        font:700 10.5px/1 'Archivo',sans-serif; color:var(--mu2);
        text-transform:uppercase; letter-spacing:.1em; margin:0 0 14px;
      }
      .me-inv-or::before, .me-inv-or::after {
        content:''; flex:1; height:1px; background:var(--bo2,#eef1f7);
      }
      .me-inv-textarea {
        width:100%; min-height:110px; resize:vertical;
        padding:13px 14px; box-sizing:border-box;
        border:1.5px solid var(--bo); border-radius:14px;
        font:500 14px/1.55 'Archivo',sans-serif; color:var(--ink);
        background:var(--bg,var(--su2));
        transition:border-color .15s, box-shadow .15s;
        font-family:inherit;
      }
      .me-inv-textarea:focus {
        outline:0; border-color:var(--a);
        box-shadow:0 0 0 3px color-mix(in srgb, var(--a) 12%, transparent);
      }
      .me-inv-counter {
        font:500 12px/1 'Archivo',sans-serif; color:var(--mu2);
        margin:8px 0 18px; min-height:16px;
      }
      .me-inv-counter.ok { color:var(--grd); }
      .me-inv-actions { display:flex; gap:10px; }
      .me-inv-btn {
        flex:1; padding:15px; border-radius:14px;
        font:700 14px/1 'Archivo',sans-serif;
        cursor:pointer; transition:transform .12s, background .12s;
        border:0; font-family:inherit;
      }
      .me-inv-btn:active { transform:scale(.97); }
      .me-inv-cancel {
        background:var(--bg2,var(--bg4)); color:var(--mu,var(--mu4));
        border:1.5px solid var(--bo);
      }
      .me-inv-cancel:hover { background:var(--bo); }
      .me-inv-go {
        background:var(--a);
        color: var(--a-ink); box-shadow:0 6px 18px -6px color-mix(in srgb, var(--a) 45%, transparent);
      }
      .me-inv-go:hover { box-shadow:0 8px 22px -6px color-mix(in srgb, var(--a) 55%, transparent); }
      .me-inv-go:disabled { opacity:.35; cursor:default; box-shadow:none; }
      .me-inv-result-ttl {
        font:700 15px/1.3 'Archivo',sans-serif;
        color:var(--grd); margin:0 0 16px;
        display:flex; align-items:center; gap:8px;
        animation:meInvTtlIn .34s cubic-bezier(.32,.72,0,1) both;
      }
      .me-inv-result-hint {
        font:500 12.5px/1.45 'Archivo',sans-serif; color:var(--mu,var(--mu3));
        margin:0 0 16px;
      }
      .me-inv-link-row {
        margin-bottom:14px; padding-bottom:14px;
        border-bottom:1px solid var(--bo2,#eef1f7);
        animation:meInvRowIn .4s cubic-bezier(.32,.72,0,1) both;
      }
      .me-inv-link-row:last-of-type { border-bottom:0; }
      .me-inv-link-email {
        font:600 12px/1 'Archivo',sans-serif; color:var(--mu,var(--mu3));
        text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px;
      }
      .me-inv-link-email.err { color: var(--rd-txt); }
      .me-inv-link-wrap { display:flex; gap:8px; align-items:center; }
      .me-inv-link-input {
        flex:1; padding:9px 12px; border-radius:10px;
        border:1px solid var(--bo); background:var(--bg,var(--su2));
        font:500 11.5px/1 'IBM Plex Mono',monospace; color:var(--mu,var(--mu3));
        overflow:hidden; white-space:nowrap; text-overflow:ellipsis;
        cursor:text;
      }
      .me-inv-copy {
        flex-shrink:0; padding:9px 14px; border-radius:10px;
        background:color-mix(in srgb, var(--a) 10%, transparent); border:1px solid color-mix(in srgb, var(--a) 20%, transparent);
        color: var(--a-txt); font:600 12px/1 'Archivo',sans-serif;
        cursor:pointer; white-space:nowrap; transition:background .12s;
      }
      .me-inv-copy:active { background:color-mix(in srgb, var(--a) 20%, transparent); }
      .me-inv-copy.copied { background:rgba(16,185,129,.1); border-color:rgba(16,185,129,.2); color:var(--grd); }
      .me-inv-share-row { display:flex; gap:8px; margin-top:10px; }
      .me-inv-act {
        flex:1; padding:11px 8px; border-radius:11px; border:0; cursor:pointer;
        font:700 12.5px/1 'Archivo',sans-serif; font-family:inherit;
        display:inline-flex; align-items:center; justify-content:center; gap:6px;
        text-decoration:none; -webkit-tap-highlight-color:transparent;
        transition:transform .12s, filter .12s, background .12s;
      }
      .me-inv-act:active { transform:scale(.96); }
      .me-inv-act.share {
        color:var(--a-ink);
        background:linear-gradient(to bottom,var(--a-lt) 0%,var(--a) 48%,var(--adk) 100%);
        box-shadow:0 2px 8px 0 color-mix(in srgb, var(--adk) 35%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 6px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset;
      }
      .me-inv-act.share:hover { filter:brightness(1.04); }
      .me-inv-act.wa { color:#fff; background:#25D366; box-shadow:0 2px 8px 0 rgba(37,211,102,.3); }
      .me-inv-act.copy2 { color:var(--ink); background:var(--bg2,var(--bg4)); border:1px solid var(--bo); }
      .me-inv-act.copy2.copied { color:var(--grd); background:rgba(16,185,129,.1); border-color:rgba(16,185,129,.2); }
      .me-inv-err-msg {
        font:500 12px/1.4 'Archivo',sans-serif; color: var(--rd-txt);
        margin-top:4px;
      }
      .me-inv-close-btn {
        width:100%; margin-top:20px; padding:15px;
        border-radius:14px; border:0;
        background:var(--bg2,var(--bg4)); color:var(--ink);
        font:700 14px/1 'Archivo',sans-serif;
        cursor:pointer; font-family:inherit;
        transition:background .12s;
      }
      .me-inv-close-btn:hover { background:var(--bo); }
      @media (prefers-reduced-motion: reduce) {
        .me-inv-sheet, .me-inv-result-ttl, .me-inv-link-row { animation:none !important; }
        #me-inv-overlay { animation:none !important; }
      }
    </style>
    <div class="me-inv-sheet">
      <div class="me-inv-grab"></div>
      <h2 class="me-inv-title">Inviter des élèves</h2>
      ${codeBlockHtml(me)}
      <div class="me-inv-or">ou par email</div>
      <p class="me-inv-sub">
        Un email par ligne. PermiGo crée un lien d'accès pour chacun —
        ton élève clique, crée son compte, et apparaît dans ta liste.
      </p>
      <textarea
        class="me-inv-textarea"
        id="me-inv-ta"
        placeholder="cole@gmail.com&#10;paul@hotmail.fr&#10;lea.martin@yahoo.fr"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      ></textarea>
      <div class="me-inv-counter" id="me-inv-counter">Entre au moins un email valide</div>
      <div class="me-inv-actions">
        <button class="me-inv-btn me-inv-cancel" id="me-inv-cancel" type="button">Annuler</button>
        <button class="me-inv-btn me-inv-go" id="me-inv-go" type="button" disabled>Inviter</button>
      </div>
    </div>
  `;
  document.body.appendChild(ov);

  const sheet = ov.querySelector(".me-inv-sheet");
  const ta = ov.querySelector("#me-inv-ta");
  const counter = ov.querySelector("#me-inv-counter");
  const goBtn = ov.querySelector("#me-inv-go");

  const close = () => {
    cleanupViewport();
    sheet.style.transition = "transform .25s cubic-bezier(.4,0,1,1)";
    sheet.style.transform = "translateY(100%)";
    ov.style.transition = "opacity .25s";
    ov.style.opacity = "0";
    setTimeout(() => ov.remove(), 260);
  };

  // Clavier mobile (iOS surtout) : le clavier ne redimensionne PAS une feuille
  // en position:fixed — il recouvrait le champ email. On borne la hauteur de
  // la feuille au viewport VISIBLE (visualViewport) et on remonte le champ
  // au focus pour qu'on voie ce qu'on tape.
  const vv = window.visualViewport;
  const fitSheet = () => {
    sheet.style.maxHeight = Math.max(240, (vv?.height ?? 0) - 10) + "px";
  };
  if (vv) {
    vv.addEventListener("resize", fitSheet);
    fitSheet();
  }
  const cleanupViewport = () => vv?.removeEventListener("resize", fitSheet);
  ta.addEventListener("focus", () => {
    setTimeout(
      () => ta.scrollIntoView({ block: "center", behavior: "smooth" }),
      250,
    );
  });

  ov.addEventListener("click", (e) => {
    if (e.target === ov) close();
  });
  ov.querySelector("#me-inv-cancel").addEventListener("click", close);
  enableSheetSwipe(sheet, close, { overlay: ov });

  wireCodeBlock(sheet, me);

  ta.addEventListener("input", () => {
    const emails = parseEmails(ta.value);
    if (emails.length === 0) {
      counter.textContent = "Entre au moins un email valide";
      counter.classList.remove("ok");
      goBtn.disabled = true;
      goBtn.textContent = "Inviter";
    } else {
      counter.textContent = `${emails.length} adresse${emails.length > 1 ? "s" : ""} valide${emails.length > 1 ? "s" : ""}`;
      counter.classList.add("ok");
      goBtn.disabled = false;
      goBtn.textContent = `Inviter (${emails.length})`;
    }
  });

  goBtn.addEventListener("click", async () => {
    const emails = parseEmails(ta.value);
    if (emails.length === 0) return;

    goBtn.disabled = true;
    goBtn.textContent = "Création…";
    counter.classList.remove("ok");
    counter.textContent = `Envoi en cours…`;

    const results = [];
    for (const email of emails) {
      const invToken = crypto.randomUUID() + "-" + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 7 * 86400_000).toISOString();

      const { data: inv, error: invErr } = await sb
        .from("invitations")
        .insert({
          email,
          role: "eleve",
          auto_ecole_id: me.auto_ecole_id,
          enseignant_attitre_id: me.id,
          token: invToken,
          expires_at: expiresAt,
        })
        .select("id, email, token")
        .maybeSingle();

      if (invErr) {
        const isDup = /duplicate|unique/i.test(invErr.message || "");
        results.push({
          email,
          error: isDup ? "Déjà invité(e)" : invErr.message,
        });
        continue;
      }

      const link =
        window.location.origin + "/#/signup?token=" + (inv?.token ?? invToken);

      // Envoi d'email best-effort. La fonction répond honnêtement quand elle
      // ne peut PAS envoyer (clé RESEND_API_KEY absente) : on le remonte au
      // moniteur au lieu de le laisser croire que l'élève a reçu un email.
      let mailSent = false;
      try {
        const { data: mailRes } = await sb.functions.invoke(
          "send-invitation-email",
          {
            body: {
              invitation_id: inv?.id,
              token: inv?.token ?? invToken,
              email,
              role: "eleve",
            },
          },
        );
        mailSent =
          !!mailRes?.ok &&
          mailRes?.mode !== "dev" &&
          !/non envoyé/i.test(mailRes?.message || "");
      } catch {
        /* silencieux — le lien à partager reste le chemin fiable */
      }
      results.push({ email, link, mailSent });
    }

    const ok = results.filter((r) => r.link).length;
    if (ok > 0) playNotify();
    sheet.innerHTML = `
      <div class="me-inv-grab"></div>
      <p class="me-inv-result-ttl">
        ${
          ok > 0
            ? `${icon("check-circle", { size: 18, strokeWidth: 2, color: "var(--grd)" })} ${ok} invitation${ok > 1 ? "s" : ""} créée${ok > 1 ? "s" : ""}`
            : `${icon("alert-circle", { size: 18, strokeWidth: 2, color: "var(--rd)" })} Aucune invitation créée`
        }
      </p>
      ${
        ok > 0
          ? results.some((r) => r.link && !r.mailSent)
            ? `<p class="me-inv-result-hint">⚠️ L'email automatique n'est pas encore actif — <strong>envoie toi-même son lien à chaque élève</strong> (Partager ou WhatsApp). Dès qu'il l'ouvre et crée son compte, il apparaît dans ta liste.</p>`
            : `<p class="me-inv-result-hint">Un email avec son lien a été envoyé à chaque élève. Tu peux aussi le partager directement.</p>`
          : ""
      }
      ${results
        .map(
          (r, i) => `
        <div class="me-inv-link-row" style="animation-delay:${0.06 + i * 0.05}s">
          <div class="me-inv-link-email ${r.error ? "err" : ""}">${esc(r.email)}</div>
          ${
            r.link
              ? `<div class="me-inv-link-input" title="${escAttr(r.link)}">${esc(r.link)}</div>
               <div class="me-inv-share-row">
                 <button class="me-inv-act share" type="button" data-link="${escAttr(r.link)}">Partager</button>
                 <a class="me-inv-act wa" href="https://wa.me/?text=${encodeURIComponent("Voici ton accès à PermiGo pour suivre ta progression au permis 🚗\n" + r.link)}" target="_blank" rel="noopener">WhatsApp</a>
                 <button class="me-inv-act copy2" type="button" data-link="${escAttr(r.link)}">Copier</button>
               </div>`
              : `<div class="me-inv-err-msg">${esc(r.error || "Erreur inconnue")}</div>`
          }
        </div>
      `,
        )
        .join("")}
      <button class="me-inv-close-btn" type="button">Fermer</button>
    `;

    sheet.querySelector(".me-inv-close-btn").addEventListener("click", close);

    const SHARE_TEXT =
      "Voici ton accès à PermiGo pour suivre ta progression au permis 🚗";
    const doCopy = async (link, btn) => {
      try {
        await navigator.clipboard.writeText(link);
        if (btn) {
          btn.textContent = "Copié ✓";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = "Copier";
            btn.classList.remove("copied");
          }, 2000);
        }
        return true;
      } catch {
        toast(
          "Copie indisponible — sélectionne le lien à la main",
          "error",
          3500,
        );
        return false;
      }
    };

    sheet.querySelectorAll(".me-inv-act.copy2").forEach((btn) => {
      btn.addEventListener("click", () => doCopy(btn.dataset.link, btn));
    });

    // Partager : feuille de partage native (WhatsApp/SMS/Mail…) en 1 tap.
    // Fallback desktop sans navigator.share → copie.
    sheet.querySelectorAll(".me-inv-act.share").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const link = btn.dataset.link;
        if (navigator.share) {
          try {
            await navigator.share({
              title: "PermiGo",
              text: SHARE_TEXT,
              url: link,
            });
            track("invite_eleve.shared", { method: "native" });
          } catch {
            /* partage annulé par l'utilisateur */
          }
        } else {
          const ok = await doCopy(link, null);
          if (ok) toast("Lien copié — colle-le où tu veux", "info", 3000);
        }
      });
    });

    track("invite_eleve.created", { count: ok, total: results.length });
  });

  setTimeout(() => ta.focus(), 120);
}

// ═══════════════════════════════════════════════════════════════
// Bloc « code élève » du moniteur (chemin bis à l'invitation par email).
// L'élève tape ce code à l'inscription (#/rejoindre) → rattaché au moniteur,
// sans que le moniteur n'ait jamais son email.
// ═══════════════════════════════════════════════════════════════
const normJoinCode = (v) => (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

function codeBlockHtml(me) {
  return `<div class="me-inv-code-card" id="me-inv-code-card">${
    me?.join_code ? codeDisplayHtml(me.join_code) : codeFormHtml("")
  }</div>`;
}

function codeDisplayHtml(code) {
  return `
    <div class="me-inv-code-label">Ton code élève</div>
    <div class="me-inv-code-value">${esc(code)}</div>
    <div class="me-inv-code-hint">Tes élèves le tapent à l'inscription — tu n'as jamais besoin de leur email.</div>
    <div class="me-inv-share-row">
      <button class="me-inv-act share" type="button" data-act="code-share">Partager</button>
      <button class="me-inv-act copy2" type="button" data-act="code-copy">Copier le code</button>
    </div>
    <button class="me-inv-code-edit" type="button" data-act="code-edit">Modifier mon code</button>`;
}

function codeFormHtml(prefill) {
  return `
    <div class="me-inv-code-label">${prefill ? "Modifier ton code" : "Crée ton code élève"}</div>
    <div class="me-inv-code-hint">Un code court à ta marque (ex&nbsp;: PERMIS75). Tes élèves le tapent à l'inscription — pas besoin de leur email.</div>
    <div class="me-inv-code-form">
      <input class="me-inv-code-input" data-el="code-input" type="text" maxlength="16"
        autocapitalize="characters" autocomplete="off" spellcheck="false"
        placeholder="PERMIS75" value="${escAttr(prefill)}" />
      <button class="me-inv-act share" type="button" data-act="code-save">${prefill ? "Enregistrer" : "Créer"}</button>
    </div>
    <div class="me-inv-code-msg" data-el="code-msg"></div>`;
}

function wireCodeBlock(sheet, me) {
  const card = sheet.querySelector("#me-inv-code-card");
  if (!card) return;

  const codeLink = (code) =>
    window.location.origin + "/#/rejoindre?code=" + encodeURIComponent(code);
  const shareMsg = (code) =>
    `Rejoins-moi sur PermiGo pour réviser ton permis 🚗\nEntre le code ${code} ou ouvre ce lien :`;

  const renderDisplay = (code) => {
    card.innerHTML = codeDisplayHtml(code);
  };
  const renderForm = (prefill) => {
    card.innerHTML = codeFormHtml(prefill);
    setTimeout(() => card.querySelector('[data-el="code-input"]')?.focus(), 50);
  };

  card.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;

    if (act === "code-copy") {
      try {
        await navigator.clipboard.writeText(me.join_code);
        btn.textContent = "Copié ✓";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "Copier le code";
          btn.classList.remove("copied");
        }, 2000);
        track("invite_eleve.code_copied");
      } catch {
        toast(
          "Copie indisponible — sélectionne le code à la main",
          "error",
          3500,
        );
      }
      return;
    }

    if (act === "code-share") {
      const link = codeLink(me.join_code);
      if (navigator.share) {
        try {
          await navigator.share({
            title: "PermiGo",
            text: shareMsg(me.join_code),
            url: link,
          });
          track("invite_eleve.code_shared", { method: "native" });
        } catch {
          /* partage annulé */
        }
      } else {
        try {
          await navigator.clipboard.writeText(
            shareMsg(me.join_code) + "\n" + link,
          );
          toast("Message copié — colle-le où tu veux", "info", 3000);
          track("invite_eleve.code_shared", { method: "copy" });
        } catch {
          toast("Partage indisponible sur cet appareil", "error", 3000);
        }
      }
      return;
    }

    if (act === "code-edit") {
      renderForm(me.join_code || "");
      return;
    }

    if (act === "code-save") {
      const input = card.querySelector('[data-el="code-input"]');
      const msg = card.querySelector('[data-el="code-msg"]');
      const code = normJoinCode(input?.value);
      if (code.length < 3) {
        msg.className = "me-inv-code-msg err";
        msg.textContent = "3 caractères minimum (lettres ou chiffres).";
        return;
      }
      btn.disabled = true;
      const prev = btn.textContent;
      btn.textContent = "…";
      try {
        const { data, error } = await sb.rpc("set_my_join_code", {
          p_code: code,
        });
        if (error) {
          msg.className = "me-inv-code-msg err";
          if (/code_taken/i.test(error.message || "")) {
            msg.textContent = "Ce code est déjà pris, choisis-en un autre.";
          } else if (/invalid_code/i.test(error.message || "")) {
            msg.textContent = "Code invalide (3 à 16 lettres/chiffres).";
          } else if (/not_a_moniteur/i.test(error.message || "")) {
            msg.textContent = "Seul un moniteur peut définir un code.";
          } else {
            msg.textContent = error.message || "Erreur, réessaie.";
          }
          btn.disabled = false;
          btn.textContent = prev;
          return;
        }
        me.join_code = data || code;
        playNotify();
        track("invite_eleve.code_set");
        renderDisplay(me.join_code);
      } catch (err) {
        msg.className = "me-inv-code-msg err";
        msg.textContent = err?.message || "Erreur, réessaie.";
        btn.disabled = false;
        btn.textContent = prev;
      }
      return;
    }
  });
}
