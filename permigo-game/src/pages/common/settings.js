// ═══════════════════════════════════════════════════════════════
// Settings — préférences utilisateur (notifs, confidentialité, compte)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { enableSheetSwipe } from "@/utils/sheet-swipe.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { applyTheme, getTheme } from "@/utils/theme.js";
import { ACCENTS, getAccent, setAccent } from "@/utils/accent.js";
import { isSoundEnabled, setSoundEnabled, playBack } from "@/utils/sound.js";
import { optInPush, optOutPush, isPushEnabled } from "@/services/web-push.js";

const STYLE = `<style>
.st {
  max-width: 480px;
  margin: 0 auto;
  background: var(--bg);
  min-height: 100dvh;
  padding-bottom: 80px;
  font-family: 'Inter', sans-serif;
}
.st-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: var(--su);
  border-bottom: 1px solid var(--bo);
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 10;
}
.st-back {
  width: 36px; height: 36px;
  border-radius: 8px;
  border: 1px solid var(--bo);
  background: var(--su);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background .12s;
  color: var(--ink);
  font-family: inherit;
  padding: 0;
  position: relative;
}
/* Hit-area 44×44 sans grossir le visuel (cible tactile) */
.st-back::before { content: ''; position: absolute; inset: -4px; }
.st-back:hover { background: var(--bg); }
.st-page-title {
  font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -.02em;
}

.st-section {
  margin: 16px 16px 0;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 16px;
  overflow: hidden;
}
.st-section-label {
  padding: 12px 16px 6px;
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--mu2);
  background: var(--bg);
  border-bottom: 1px solid var(--bo2);
}
.st-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--bo2);
  gap: 12px;
  min-height: 52px;
}
.st-row:last-child { border-bottom: 0; }
.st-row-left { flex: 1; min-width: 0; }
.st-row-title {
  font: 600 14px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
}
.st-row-sub {
  font: 500 12px/1.3 'Inter', sans-serif;
  color: var(--mu);
  margin-top: 2px;
}
.st-row-action {
  flex-shrink: 0;
}

/* Toggle switch */
.st-tgl { position: relative; display: inline-block; width: 44px; height: 26px; cursor: pointer; }
.st-tgl input { display: none; }
.st-tgl-t { position: absolute; inset: 0; background: #d1d8ee; border-radius: 999px; transition: background .2s; }
.st-tgl-t::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.15); }
.st-tgl input:checked + .st-tgl-t { background: var(--a); }
.st-tgl input:checked + .st-tgl-t::after { transform: translateX(18px); }

/* Text button */
.st-btn-txt {
  font: 600 13px/1 'Inter', sans-serif;
  color: var(--a);
  background: none;
  border: none;
  cursor: pointer;
  padding: 16px 8px;
  margin: -10px -8px;
  font-family: inherit;
}
.st-btn-txt.danger { color: var(--rd); }

/* Input inline */
.st-inp {
  width: 100%;
  padding: 14px 12px;
  min-height: 44px;
  font: 500 14px/1 'Inter', sans-serif;
  color: var(--ink);
  background: var(--bg);
  border: 1.5px solid var(--bo);
  border-radius: 10px;
  transition: border-color .15s;
  font-family: inherit;
}
.st-inp:focus { outline: none; border-color: var(--a); }
.st-inp-row { padding: 10px 16px 14px; }
.st-save-btn {
  display: block;
  width: calc(100% - 32px);
  margin: 10px 16px 0;
  padding: 13px;
  min-height: 44px;
  background: var(--a);
  color: var(--a-ink);
  border: none;
  border-radius: 12px;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: background .15s;
  font-family: inherit;
}
.st-save-btn:hover { background: var(--adk); }
.st-save-btn:disabled { opacity: .5; cursor: default; }

/* Danger zone */
.st-danger { border-color: rgba(239,68,68,.2); }
.st-danger .st-section-label { color: var(--rd); background: rgba(239,68,68,.04); border-color: rgba(239,68,68,.12); }

/* Appearance chip */
.st-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1.5px solid var(--a);
  background: color-mix(in srgb, var(--a) 8%, transparent);
  font: 700 12px/1 'IBM Plex Mono', monospace;
  color: var(--a);
}

/* Delete modal overlay */
.st-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.5);
  backdrop-filter: blur(4px);
  z-index: 900;
  display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: env(safe-area-inset-bottom);
}
.st-modal-box {
  width: 100%;
  max-width: 480px;
  background: var(--su);
  border-radius: 24px 24px 0 0;
  padding: 24px 20px 32px;
}
.st-modal-handle {
  width: 36px; height: 4px;
  background: var(--bo);
  border-radius: 2px;
  margin: 0 auto 20px;
}
.st-modal-title {
  font: 800 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin-bottom: 8px;
}
.st-modal-body {
  font: 400 14px/1.6 'Inter', sans-serif;
  color: var(--mu);
  margin-bottom: 16px;
}
.st-modal-body strong { color: var(--ink); }
.st-modal-label {
  font: 600 12px/1 'Inter', sans-serif;
  color: var(--mu);
  margin-bottom: 6px;
}
.st-modal-inp {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg);
  border: 1.5px solid var(--bo);
  border-radius: 10px;
  font: 500 14px/1 'IBM Plex Mono', monospace;
  color: var(--ink);
  letter-spacing: .04em;
  transition: border-color .15s;
  box-sizing: border-box;
}
.st-modal-inp:focus { outline: none; border-color: var(--rd); }
.st-modal-actions { display: flex; gap: 10px; margin-top: 16px; }
.st-modal-cancel {
  flex: 1; padding: 14px;
  background: var(--bg); border: 1.5px solid var(--bo); border-radius: 12px;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif; color: var(--mu3);
  cursor: pointer; min-height: 48px; font-family: inherit;
  transition: background .12s;
}
.st-modal-cancel:active { background: var(--bg2); }
.st-modal-confirm {
  flex: 1; padding: 14px;
  background: var(--rd); border: none; border-radius: 12px;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif; color: #fff;
  cursor: pointer; min-height: 48px; font-family: inherit;
  transition: background .12s, opacity .12s;
}
.st-modal-confirm:disabled { opacity: .4; cursor: not-allowed; }
.st-modal-confirm:not(:disabled):active { background: var(--rdk); }
.st-dpo-note {
  font: 400 12px/1.5 'Inter', sans-serif;
  color: var(--mu2);
  text-align: center;
  margin-top: 12px;
}
.st-dpo-note a { color: var(--a); }

/* Theme segmented control */
.st-theme-seg {
  display: flex;
  gap: 3px;
  background: var(--bg2);
  border-radius: 10px;
  padding: 3px;
  width: 100%;
}
.st-theme-btn {
  flex: 1;
  padding: 7px 4px;
  border: none;
  border-radius: 7px;
  background: transparent;
  font: 600 12px/1 'Inter', sans-serif;
  color: var(--mu);
  cursor: pointer;
  transition: background .15s cubic-bezier(.23,1,.32,1), color .15s, box-shadow .15s;
  white-space: nowrap;
  min-height: 44px;
  font-family: inherit;
}
.st-theme-btn.active {
  background: var(--su);
  color: var(--a);
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
}
/* Accent color swatches */
.st-accent-row { display: flex; gap: 12px; flex-wrap: wrap; }
.st-accent-sw {
  width: 44px; height: 44px; border-radius: 50%;
  border: 0; cursor: pointer; padding: 0;
  background: var(--sw);
  box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--sw) 55%, transparent), inset 0 1.5px 0 rgba(255,255,255,.3);
  position: relative;
  transition: transform .12s cubic-bezier(.34,1.56,.64,1);
  -webkit-tap-highlight-color: transparent;
}
.st-accent-sw:active { transform: scale(.9); }
.st-accent-sw[aria-pressed="true"] { box-shadow: 0 0 0 3px var(--su), 0 0 0 5px var(--sw); }
.st-accent-sw[aria-pressed="true"]::after {
  content: ''; position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: center/16px no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E");
}
</style>`;

// Tours relançables depuis les Réglages : flag localStorage à effacer + page
// hôte où le tour se redéclenche au mount. Pas d'entrée pour le gérant (pas
// de tour). [[guided-tour]]
const TOUR_CFG = {
  eleve: { key: "pg-tour-eleve-v1", route: "/" },
  enseignant: { key: "pg-tour-moniteur-v1", route: "/" },
};

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page_view", { page: "settings", role: me.role });

  // Load current profile prefs + RGPD preferences in parallel
  const [{ data: profile }, { data: myPrefs }] = await Promise.all([
    sb
      .from("profiles")
      .select(
        "prenom, notif_push, notif_email, show_in_ranking, dnd_start, dnd_end",
      )
      .eq("id", me.id)
      .maybeSingle(),
    sb.rpc("get_my_preferences"),
  ]);

  const prefs = {
    notifPush: profile?.notif_push ?? true,
    notifEmail: profile?.notif_email ?? true,
    showInRanking: profile?.show_in_ranking ?? false,
    dndStart: (profile?.dnd_start ?? "22:00:00").slice(0, 5),
    dndEnd: (profile?.dnd_end ?? "07:00:00").slice(0, 5),
    prenom: profile?.prenom ?? "",
    marketingOptin: myPrefs?.marketing_optin ?? false,
    theme:
      myPrefs?.theme === "light" ||
      myPrefs?.theme === "dark" ||
      myPrefs?.theme === "auto"
        ? myPrefs.theme
        : getTheme(),
  };

  render(root, me, prefs);
  wire(root, me, prefs);
}

function render(root, me, prefs) {
  root.innerHTML = `${STYLE}
<div class="st anim-slide-up">
  <div class="st-header">
    <button class="st-back" id="st-back" aria-label="Retour">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div class="st-page-title">Préférences</div>
  </div>

  <!-- NOTIFICATIONS -->
  <div class="st-section" style="margin-top:20px">
    <div class="st-section-label">Notifications</div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Notifications push</div>
        <div class="st-row-sub">Rappels et mises à jour dans le navigateur</div>
      </div>
      <div class="st-row-action">
        <label class="st-tgl" aria-label="Activer notifications push">
          <input type="checkbox" id="tgl-push" ${prefs.notifPush ? "checked" : ""}>
          <span class="st-tgl-t"></span>
        </label>
      </div>
    </div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Notifications email</div>
        <div class="st-row-sub">Résumé hebdomadaire par email</div>
      </div>
      <div class="st-row-action">
        <label class="st-tgl" aria-label="Activer notifications email">
          <input type="checkbox" id="tgl-email" ${prefs.notifEmail ? "checked" : ""}>
          <span class="st-tgl-t"></span>
        </label>
      </div>
    </div>
    <div class="st-row" style="flex-direction:column;align-items:flex-start;gap:8px">
      <div class="st-row-title">Ne pas déranger</div>
      <div style="display:flex;align-items:center;gap:8px;width:100%">
        <label style="font:500 12px/1 'Inter',sans-serif;color:var(--mu3);flex-shrink:0">De</label>
        <input class="st-inp" id="inp-dnd-start" type="time" value="${prefs.dndStart}" style="flex:1;padding:8px 10px">
        <label style="font:500 12px/1 'Inter',sans-serif;color:var(--mu3);flex-shrink:0">à</label>
        <input class="st-inp" id="inp-dnd-end" type="time" value="${prefs.dndEnd}" style="flex:1;padding:8px 10px">
        <button class="st-save-btn" id="btn-save-dnd" style="margin:0;width:auto;padding:8px 14px;font-size:12px">OK</button>
      </div>
    </div>
  </div>

  <!-- CONFIDENTIALITÉ -->
  <div class="st-section">
    <div class="st-section-label">Confidentialité</div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Classement national</div>
        <div class="st-row-sub">Apparaître dans les classements de ton école</div>
      </div>
      <div class="st-row-action">
        <label class="st-tgl" aria-label="Apparaître dans le classement">
          <input type="checkbox" id="tgl-ranking" ${prefs.showInRanking ? "checked" : ""}>
          <span class="st-tgl-t"></span>
        </label>
      </div>
    </div>
  </div>

  <!-- COMPTE -->
  <div class="st-section">
    <div class="st-section-label">Mon compte</div>
    <div class="st-row" style="flex-direction:column;align-items:flex-start;gap:8px">
      <div class="st-row-title">Prénom affiché</div>
      <div class="st-inp-row" style="padding:0;width:100%">
        <input class="st-inp" id="inp-prenom" type="text" value="${esc(prefs.prenom)}" maxlength="30" placeholder="Ton prénom" autocomplete="given-name">
      </div>
      <button class="st-save-btn" id="btn-save-prenom" style="margin:4px 0 0">Enregistrer</button>
    </div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Mot de passe</div>
        <div class="st-row-sub">Modifier via email de réinitialisation</div>
      </div>
      <div class="st-row-action">
        <button class="st-btn-txt" id="btn-reset-pwd">Modifier →</button>
      </div>
    </div>
  </div>

  <!-- APPARENCE -->
  <div class="st-section">
    <div class="st-section-label">Apparence</div>
    <div class="st-row" style="flex-direction:column;align-items:flex-start;gap:10px">
      <div>
        <div class="st-row-title">Thème</div>
        <div class="st-row-sub">Apparence de l'application</div>
      </div>
      <div class="st-theme-seg" id="theme-seg" role="group" aria-label="Choisir le thème">
        <button class="st-theme-btn ${prefs.theme === "light" ? "active" : ""}" data-theme="light" aria-pressed="${prefs.theme === "light"}">${icon("sun", { size: 16 })} Clair</button>
        <button class="st-theme-btn ${prefs.theme === "dark" ? "active" : ""}" data-theme="dark"  aria-pressed="${prefs.theme === "dark"}">${icon("moon", { size: 16 })} Sombre</button>
        <button class="st-theme-btn ${prefs.theme === "auto" ? "active" : ""}" data-theme="auto"  aria-pressed="${prefs.theme === "auto"}">Système</button>
      </div>
    </div>
    <div class="st-row" style="flex-direction:column;align-items:flex-start;gap:12px">
      <div>
        <div class="st-row-title">Couleur d'accent</div>
        <div class="st-row-sub">Le vert ne te plaît pas ? Choisis ta couleur.</div>
      </div>
      <div class="st-accent-row" id="accent-row" role="group" aria-label="Choisir la couleur d'accent">
        ${ACCENTS.map((p) => `<button class="st-accent-sw" type="button" data-accent="${p.id}" aria-pressed="${getAccent() === p.id}" aria-label="${esc(p.name)}" title="${esc(p.name)}" style="--sw:${p.a}"></button>`).join("")}
      </div>
    </div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Sons d'interface</div>
        <div class="st-row-sub">Retours sonores sur les actions et récompenses</div>
      </div>
      <div class="st-row-action">
        <label class="st-tgl" aria-label="Activer les sons d'interface">
          <input type="checkbox" id="tgl-sound" ${isSoundEnabled() ? "checked" : ""}>
          <span class="st-tgl-t"></span>
        </label>
      </div>
    </div>
  </div>

  ${
    TOUR_CFG[me.role]
      ? `<!-- AIDE -->
  <div class="st-section">
    <div class="st-section-label">Aide</div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Revoir le guide de démarrage</div>
        <div class="st-row-sub">Relance la visite guidée pas à pas</div>
      </div>
      <div class="st-row-action">
        <button class="st-btn-txt" id="btn-replay-tour">Relancer →</button>
      </div>
    </div>
  </div>`
      : ""
  }

  <!-- 🔐 MES DONNÉES (RGPD) -->
  <div class="st-section">
    <div class="st-section-label">${icon("lock", { size: 14 })} Mes données</div>

    <!-- Export -->
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Exporter mes données</div>
        <div class="st-row-sub">Télécharge un fichier JSON de toutes tes données</div>
      </div>
      <div class="st-row-action">
        <button class="st-btn-txt" id="btn-export-data">Exporter →</button>
      </div>
    </div>

    <!-- Marketing toggle -->
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Emails marketing</div>
        <div class="st-row-sub">Conseils, nouveautés et offres PermiGo</div>
      </div>
      <div class="st-row-action">
        <label class="st-tgl" aria-label="Recevoir les emails marketing">
          <input type="checkbox" id="tgl-marketing" ${prefs.marketingOptin ? "checked" : ""}>
          <span class="st-tgl-t"></span>
        </label>
      </div>
    </div>

    <!-- Legal links -->
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Politique de confidentialité</div>
      </div>
      <div class="st-row-action">
        <button class="st-btn-txt" id="btn-privacy">Lire →</button>
      </div>
    </div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Conditions générales d'utilisation</div>
      </div>
      <div class="st-row-action">
        <button class="st-btn-txt" id="btn-cgu">Lire →</button>
      </div>
    </div>
  </div>

  <!-- ZONE DANGER -->
  <div class="st-section st-danger">
    <div class="st-section-label">Zone critique</div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title" style="color:var(--rd)">Supprimer mon compte</div>
        <div class="st-row-sub">Irréversible — toutes tes données seront effacées</div>
      </div>
      <div class="st-row-action">
        <button class="st-btn-txt danger" id="btn-delete-account">Supprimer</button>
      </div>
    </div>
  </div>

</div>`;
}

function wire(root, me, prefs) {
  root.querySelector("#st-back")?.addEventListener("click", () => {
    playBack();
    navigate("/");
  });

  // Toggle changes — save debounced
  const savePrefs = _debounce(async () => {
    const push = root.querySelector("#tgl-push")?.checked ?? prefs.notifPush;
    const email = root.querySelector("#tgl-email")?.checked ?? prefs.notifEmail;
    const ranking =
      root.querySelector("#tgl-ranking")?.checked ?? prefs.showInRanking;
    const { error } = await sb
      .from("profiles")
      .update({
        notif_push: push,
        notif_email: email,
        show_in_ranking: ranking,
      })
      .eq("id", me.id);
    if (!error) {
      track("settings.prefs_saved", {});
      toast("Préférences enregistrées", "success", 2000);
    }
  }, 800);

  // ── Notifications push : déclenche la VRAIE demande d'autorisation +
  //    l'abonnement (avant ce fix, le toggle ne faisait que sauver un flag,
  //    donc aucun ding ne pouvait arriver — surtout sur iPhone). ──
  const pushTgl = root.querySelector("#tgl-push");
  if (pushTgl) {
    // Reflète l'état RÉEL d'abonnement (pas juste la préférence DB).
    if ("Notification" in window) pushTgl.checked = isPushEnabled();
    pushTgl.addEventListener("change", async () => {
      if (pushTgl.checked) {
        if (!("Notification" in window)) {
          // iOS hors PWA : pas d'API notif tant que l'app n'est pas installée.
          pushTgl.checked = false;
          toast(
            "Installe d'abord PermiGo sur ton écran d'accueil pour activer les notifications.",
            "info",
            4500,
          );
          return;
        }
        // optInPush() appelle Notification.requestPermission() de façon
        // synchrone dans ce gestionnaire de clic → iOS accepte la demande.
        const granted = await optInPush();
        if (!granted) {
          pushTgl.checked = false;
          if (Notification.permission === "denied")
            toast(
              "Notifications bloquées — autorise-les dans les réglages du téléphone.",
              "error",
              4500,
            );
          return;
        }
        toast("Notifications activées ✓", "success", 2000);
      } else {
        await optOutPush();
      }
      savePrefs();
    });
  }
  root.querySelector("#tgl-email")?.addEventListener("change", savePrefs);
  root.querySelector("#tgl-ranking")?.addEventListener("change", savePrefs);

  // Save DND times
  root.querySelector("#btn-save-dnd")?.addEventListener("click", async () => {
    const start = root.querySelector("#inp-dnd-start")?.value;
    const end = root.querySelector("#inp-dnd-end")?.value;
    if (!start || !end) return;
    const { error } = await sb
      .from("profiles")
      .update({ dnd_start: start, dnd_end: end })
      .eq("id", me.id);
    if (!error) {
      toast("Plage Ne pas déranger enregistrée", "success", 2000);
      track("settings.dnd_saved", {});
    }
  });

  // Save prénom
  root
    .querySelector("#btn-save-prenom")
    ?.addEventListener("click", async () => {
      const val = root.querySelector("#inp-prenom")?.value?.trim();
      if (!val) {
        toast("Le prénom ne peut pas être vide", "error");
        return;
      }
      const btn = root.querySelector("#btn-save-prenom");
      btn.disabled = true;
      btn.textContent = "…";
      const { error } = await sb
        .from("profiles")
        .update({ prenom: val })
        .eq("id", me.id);
      btn.disabled = false;
      btn.textContent = "Enregistrer";
      if (error) {
        toast("Erreur de sauvegarde", "error");
        return;
      }
      toast(`Prénom mis à jour : ${esc(val)}`, "success");
      track("settings.prenom_updated", {});
    });

  // Reset password
  root.querySelector("#btn-reset-pwd")?.addEventListener("click", async () => {
    const email = me.email;
    if (!email) {
      toast("Email non disponible", "error");
      return;
    }
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/#/settings`,
    });
    if (error) {
      toast("Erreur d'envoi de l'email", "error");
      return;
    }
    toast("Email de réinitialisation envoyé !", "success", 5000);
    track("settings.pwd_reset_requested", {});
  });

  // Theme segmented control
  root.querySelector("#theme-seg")?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".st-theme-btn");
    if (!btn) return;
    const mode = btn.dataset.theme;
    root.querySelectorAll(".st-theme-btn").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    applyTheme(mode);
    track("settings.theme_changed", { theme: mode });
    try {
      await sb.rpc("set_my_preferences", { theme: mode });
    } catch (e) {
      console.error("[settings] theme save", e);
    }
  });

  // Couleur d'accent (localStorage + application live)
  root.querySelector("#accent-row")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".st-accent-sw");
    if (!btn) return;
    const id = btn.dataset.accent;
    root.querySelectorAll(".st-accent-sw").forEach((b) => {
      b.setAttribute("aria-pressed", String(b === btn));
    });
    setAccent(id);
    track("settings.accent_changed", { accent: id });
  });

  // Sound toggle (localStorage only, no DB write)
  root.querySelector("#tgl-sound")?.addEventListener("change", (e) => {
    setSoundEnabled(e.target.checked);
    track("settings.sound_toggled", { enabled: e.target.checked });
  });

  // Export mes données
  root
    .querySelector("#btn-export-data")
    ?.addEventListener("click", async () => {
      const btn = root.querySelector("#btn-export-data");
      btn.textContent = "…";
      btn.style.pointerEvents = "none";
      try {
        const { data, error } = await sb.rpc("export_my_data");
        if (error || data?.error) {
          toast(data?.error || "Export impossible", "error");
          return;
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `permigo-export-${date}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast("Téléchargement lancé", "success", 3000);
        track("rgpd.data_exported", {});
      } catch (e) {
        console.error("[settings] export", e);
        toast("Erreur lors de l'export", "error");
      } finally {
        btn.textContent = "Exporter →";
        btn.style.pointerEvents = "";
      }
    });

  // Marketing toggle
  root
    .querySelector("#tgl-marketing")
    ?.addEventListener("change", async (e) => {
      const val = e.target.checked;
      try {
        const { error } = await sb.rpc("set_my_preferences", {
          marketing_optin: val,
        });
        if (error) {
          toast("Erreur de sauvegarde", "error");
          return;
        }
        toast(
          val ? "Emails marketing activés" : "Emails marketing désactivés",
          "success",
          2000,
        );
        track("rgpd.marketing_optin_changed", { value: val });
      } catch {
        toast("Erreur de connexion", "error");
      }
    });

  // Legal links
  root
    .querySelector("#btn-privacy")
    ?.addEventListener("click", () => navigate("#/legal/privacy"));
  root
    .querySelector("#btn-cgu")
    ?.addEventListener("click", () => navigate("#/legal/cgu"));

  // Revoir le guide : on efface le flag puis on rejoint la page hôte —
  // le tour se redéclenche tout seul au mount.
  root.querySelector("#btn-replay-tour")?.addEventListener("click", () => {
    const cfg = TOUR_CFG[me.role];
    if (!cfg) return;
    try {
      localStorage.removeItem(cfg.key);
    } catch {
      /* stockage indispo */
    }
    track("settings.replay_tour", { role: me.role });
    navigate(cfg.route);
  });

  // Delete account — modal avec saisie de confirmation
  root.querySelector("#btn-delete-account")?.addEventListener("click", () => {
    _showDeleteModal(root, me);
  });
}

const CONFIRM_TEXT = "SUPPRIMER MON COMPTE";

function _showDeleteModal(root, me) {
  const overlay = document.createElement("div");
  overlay.className = "st-modal-overlay";
  overlay.innerHTML = `
<div class="st-modal-box" role="dialog" aria-modal="true" aria-labelledby="del-modal-title">
  <div class="st-modal-handle"></div>
  <div class="st-modal-title" id="del-modal-title">Supprimer mon compte</div>
  <div class="st-modal-body">
    Cette action est <strong>irréversible</strong>. Toutes tes données (progression, trophées, streak, XP) seront définitivement effacées.
    <br><br>Pour confirmer, tape exactement :<br><strong>${CONFIRM_TEXT}</strong>
  </div>
  <div class="st-modal-label">Confirmation</div>
  <input class="st-modal-inp" id="del-confirm-inp" type="text" placeholder="${CONFIRM_TEXT}" autocomplete="off" spellcheck="false">
  <div class="st-modal-actions">
    <button class="st-modal-cancel" id="del-cancel">Annuler</button>
    <button class="st-modal-confirm" id="del-confirm" disabled>Supprimer</button>
  </div>
  <p class="st-dpo-note">Pour l'effacement côté authentification, contacte <a href="mailto:dpo@permigo.fr">dpo@permigo.fr</a></p>
</div>`;

  document.body.appendChild(overlay);

  const inp = overlay.querySelector("#del-confirm-inp");
  const confirm = overlay.querySelector("#del-confirm");
  const cancel = overlay.querySelector("#del-cancel");

  inp.focus();
  inp.addEventListener("input", () => {
    confirm.disabled = inp.value !== CONFIRM_TEXT;
  });

  cancel.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  enableSheetSwipe(
    overlay.querySelector(".st-modal-box"),
    () => overlay.remove(),
    { overlay },
  );

  confirm.addEventListener("click", async () => {
    if (inp.value !== CONFIRM_TEXT) return;
    confirm.disabled = true;
    confirm.textContent = "…";
    track("account.delete_confirmed", {});
    try {
      const { data, error } = await sb.rpc("delete_my_account", {
        p_confirm_text: CONFIRM_TEXT,
      });
      if (error || data?.error) {
        toast(
          data?.error || "Suppression impossible — contacte dpo@permigo.fr",
          "error",
          6000,
        );
        overlay.remove();
        return;
      }
      overlay.remove();
      await sb.auth.signOut();
      location.hash = "#/";
      location.reload();
    } catch (e) {
      console.error("[settings] delete_account", e);
      toast("Erreur — contacte dpo@permigo.fr", "error", 6000);
      overlay.remove();
    }
  });
}

function _debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
