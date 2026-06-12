// ═══════════════════════════════════════════════════════════════
// Service — Invitation élève
// Modal bottom-sheet : génère un lien token + best-effort email
// Factorisé pour être appelé depuis mes-eleves.js et aujourdhui.js
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { toast } from "@/components/common/toast.js";
import { enableSheetSwipe } from "@/utils/sheet-swipe.js";
import { esc } from "@/utils/escape.js";
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
  ov.style.cssText =
    "position:fixed;inset:0;z-index:9990;background:rgba(10,13,26,.55);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;";
  ov.innerHTML = `
    <style>
      @keyframes meInvSlide { from { transform:translateY(100%); } to { transform:translateY(0); } }
      @keyframes meInvFade  { from { opacity:0; } to { opacity:1; } }
      .me-inv-sheet {
        width:100%; max-width:520px;
        background:var(--su,#fff);
        border-radius:28px 28px 0 0;
        padding:8px 20px calc(28px + env(safe-area-inset-bottom,0px));
        animation: meInvSlide .3s cubic-bezier(.2,.7,.3,1);
        font-family:'Inter',sans-serif; color:var(--ink);
        box-shadow:0 -8px 32px rgba(10,13,26,.14);
      }
      .me-inv-grab {
        width:36px; height:4px; background:var(--bo);
        border-radius:2px; margin:8px auto 18px;
      }
      .me-inv-title {
        font:800 20px/1.2 'Plus Jakarta Sans',sans-serif;
        color:var(--ink); margin:0 0 4px; letter-spacing:-.02em;
      }
      .me-inv-sub {
        font:500 13px/1.5 'Inter',sans-serif; color:var(--mu,var(--mu3));
        margin:0 0 16px;
      }
      .me-inv-textarea {
        width:100%; min-height:110px; resize:vertical;
        padding:13px 14px; box-sizing:border-box;
        border:1.5px solid var(--bo); border-radius:14px;
        font:500 14px/1.55 'Inter',sans-serif; color:var(--ink);
        background:var(--bg,var(--su2));
        transition:border-color .15s, box-shadow .15s;
        font-family:inherit;
      }
      .me-inv-textarea:focus {
        outline:0; border-color:var(--a);
        box-shadow:0 0 0 3px color-mix(in srgb, var(--a) 12%, transparent);
      }
      .me-inv-counter {
        font:500 12px/1 'Inter',sans-serif; color:var(--mu2);
        margin:8px 0 18px; min-height:16px;
      }
      .me-inv-counter.ok { color:var(--grd); }
      .me-inv-actions { display:flex; gap:10px; }
      .me-inv-btn {
        flex:1; padding:15px; border-radius:14px;
        font:700 14px/1 'Plus Jakarta Sans',sans-serif;
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
        font:700 15px/1.3 'Plus Jakarta Sans',sans-serif;
        color:var(--grd); margin:0 0 16px;
        display:flex; align-items:center; gap:8px;
      }
      .me-inv-link-row {
        margin-bottom:14px; padding-bottom:14px;
        border-bottom:1px solid var(--bo2,#eef1f7);
      }
      .me-inv-link-row:last-of-type { border-bottom:0; }
      .me-inv-link-email {
        font:600 12px/1 'Inter',sans-serif; color:var(--mu,var(--mu3));
        text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px;
      }
      .me-inv-link-email.err { color:var(--rd); }
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
        color:var(--a); font:600 12px/1 'Inter',sans-serif;
        cursor:pointer; white-space:nowrap; transition:background .12s;
      }
      .me-inv-copy:active { background:color-mix(in srgb, var(--a) 20%, transparent); }
      .me-inv-copy.copied { background:rgba(16,185,129,.1); border-color:rgba(16,185,129,.2); color:var(--grd); }
      .me-inv-share-row { display:flex; gap:8px; margin-top:10px; }
      .me-inv-act {
        flex:1; padding:11px 8px; border-radius:11px; border:0; cursor:pointer;
        font:700 12.5px/1 'Plus Jakarta Sans',sans-serif; font-family:inherit;
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
        font:500 12px/1.4 'Inter',sans-serif; color:var(--rd);
        margin-top:4px;
      }
      .me-inv-close-btn {
        width:100%; margin-top:20px; padding:15px;
        border-radius:14px; border:0;
        background:var(--bg2,var(--bg4)); color:var(--ink);
        font:700 14px/1 'Plus Jakarta Sans',sans-serif;
        cursor:pointer; font-family:inherit;
        transition:background .12s;
      }
      .me-inv-close-btn:hover { background:var(--bo); }
    </style>
    <div class="me-inv-sheet">
      <div class="me-inv-grab"></div>
      <h2 class="me-inv-title">Inviter des élèves</h2>
      <p class="me-inv-sub">
        Colle une liste d'emails ou entre-les un par ligne.<br>
        Chaque élève sera rattaché à toi automatiquement.
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
    sheet.style.transition = "transform .25s cubic-bezier(.4,0,1,1)";
    sheet.style.transform = "translateY(100%)";
    ov.style.transition = "opacity .25s";
    ov.style.opacity = "0";
    setTimeout(() => ov.remove(), 260);
  };

  ov.addEventListener("click", (e) => {
    if (e.target === ov) close();
  });
  ov.querySelector("#me-inv-cancel").addEventListener("click", close);
  enableSheetSwipe(sheet, close, { overlay: ov });

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
      results.push({ email, link });

      try {
        await sb.functions.invoke("send-invitation-email", {
          body: {
            invitation_id: inv?.id,
            token: inv?.token ?? invToken,
            email,
            role: "eleve",
          },
        });
      } catch {
        /* silencieux */
      }
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
      ${results
        .map(
          (r) => `
        <div class="me-inv-link-row">
          <div class="me-inv-link-email ${r.error ? "err" : ""}">${esc(r.email)}</div>
          ${
            r.link
              ? `<div class="me-inv-link-input" title="${esc(r.link)}">${esc(r.link)}</div>
               <div class="me-inv-share-row">
                 <button class="me-inv-act share" type="button" data-link="${esc(r.link)}">Partager</button>
                 <a class="me-inv-act wa" href="https://wa.me/?text=${encodeURIComponent("Voici ton accès à PermiGo pour suivre ta progression au permis 🚗\n" + r.link)}" target="_blank" rel="noopener">WhatsApp</a>
                 <button class="me-inv-act copy2" type="button" data-link="${esc(r.link)}">Copier</button>
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
