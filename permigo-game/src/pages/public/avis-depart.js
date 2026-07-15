// ═══════════════════════════════════════════════════════════════
// Page publique — Questionnaire de départ (#/avis-depart)
// Résiliation ou demande de remboursement : on collecte le POURQUOI
// (améliorer l'app > retenir de force). Insert → table churn_feedback.
// DA nuit-violet cohérente avec #/pass. Marche connecté ou invité.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { track } from "@/services/analytics.js";

const REASONS = [
  ["lent", "C'est trop lent / ça rame"],
  ["questions", "Pas assez de questions"],
  ["variete", "Pas assez varié"],
  ["cher", "Trop cher"],
  ["permis", "J'ai eu mon permis 🎉"],
  ["inutile", "Je n'utilise plus l'app"],
  ["autre", "Autre chose"],
];

const STYLE = `<style>
  .cf {
    min-height: 100dvh; font-family: 'Baloo 2', var(--fb), sans-serif;
    -webkit-font-smoothing: antialiased;
    --gold:#ffce4d;--in:#6c63ff;--in-lt:#8e87ff;--in-dp:#4a3fc9;--in-dk:#372fa3;
    color: #f4f1ff;
    background: linear-gradient(180deg, #1b1240 0%, #241a4d 50%, #170f38 100%);
    padding: calc(14px + env(safe-area-inset-top)) 18px calc(40px + env(safe-area-inset-bottom));
  }
  .cf * { box-sizing: border-box; }
  .cf-wrap { max-width: 440px; margin: 0 auto; }
  .cf-logo { display: block; width: 46px; height: 46px; margin: 6px 0 18px; filter: drop-shadow(0 4px 8px rgba(0,0,0,.5)); }
  .cf h1 { font: 800 26px/1.2 'Baloo 2', sans-serif; color: #f4f1ff; margin: 0 0 8px; text-shadow: 0 3px 0 rgba(12,7,32,.8); }
  .cf-sub { font: 600 14px/1.55 'Baloo 2', sans-serif; color: #aaa2d8; margin: 0 0 22px; }
  .cf-opt {
    display: flex; align-items: center; gap: 12px; cursor: pointer;
    background: rgba(255,255,255,.05); border: 1.5px solid rgba(255,255,255,.12);
    border-radius: 14px; padding: 13px 14px; margin-bottom: 9px;
    font: 700 14.5px/1.3 'Baloo 2', sans-serif; color: #cdc8ec;
    transition: border-color .15s ease, background .15s ease;
  }
  .cf-opt input { width: 20px; height: 20px; accent-color: var(--gold); flex: none; }
  .cf-opt:has(input:checked) { border-color: var(--gold); background: rgba(255,206,77,.08); color: #f4f1ff; }
  .cf textarea, .cf input[type="email"] {
    width: 100%; border: 0; border-radius: 14px; padding: 13px 14px; margin-top: 4px;
    font: 600 15px/1.4 'Baloo 2', sans-serif; color: #f4f1ff;
    background: rgba(0,0,0,.3); box-shadow: inset 0 2px 5px rgba(0,0,0,.4), inset 0 0 0 1.5px rgba(255,255,255,.14);
  }
  .cf textarea { min-height: 90px; resize: vertical; }
  .cf textarea::placeholder, .cf input::placeholder { color: #8b7fc4; }
  .cf-lbl { display: block; font: 700 12.5px/1 Inter, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #8b7fc4; margin: 18px 0 4px; }
  .cf-send {
    width: 100%; margin-top: 22px; border: 0; cursor: pointer; border-radius: 16px; padding: 16px;
    font: 800 16px/1 'Baloo 2', sans-serif; color: #fff; text-shadow: 0 1.5px 0 rgba(0,0,0,.3);
    background: linear-gradient(180deg, var(--in-lt), var(--in) 55%, var(--in-dp));
    box-shadow: inset 0 2.5px 0 rgba(255,255,255,.35), 0 5px 0 var(--in-dk), 0 9px 16px rgba(0,0,0,.35);
  }
  .cf-send[disabled] { opacity: .6; cursor: wait; }
  .cf-back { display: block; text-align: center; font: 700 13.5px 'Baloo 2', sans-serif; color: #aaa2d8; margin-top: 16px; }
  .cf-err { font: 700 13px/1.4 'Baloo 2', sans-serif; color: #ffb4a8; text-align: center; margin: 10px 0 0; display: none; }
  .cf-err.on { display: block; }
  .cf-done { text-align: center; padding-top: 60px; }
  .cf-done .emo { font-size: 52px; line-height: 1; }
  .cf-done h1 { margin-top: 14px; }
</style>`;

export async function mount(root) {
  const me = getCurUser();
  track("churn.view", { logged: !!me });

  root.innerHTML = `${STYLE}
  <div class="cf">
    <div class="cf-wrap">
      <img class="cf-logo" src="/icon-192.png" alt="PermiGo">
      <h1>Tu pars ? Aide-nous à comprendre.</h1>
      <p class="cf-sub">2 clics, 20 secondes. Chaque réponse améliore l'app pour les suivants — et si tu veux un remboursement (3 premiers jours), on le traite direct derrière.</p>

      <div id="cf-opts">
        ${REASONS.map(
          ([key, label]) => `
        <label class="cf-opt"><input type="checkbox" value="${key}"> ${label}</label>`,
        ).join("")}
      </div>

      <label class="cf-lbl" for="cf-details">Dis-nous en plus (optionnel)</label>
      <textarea id="cf-details" maxlength="2000" placeholder="Ce qui t'a manqué, ce qui t'a saoulé, ce qu'on doit changer…"></textarea>

      <label class="cf-lbl" for="cf-email">Ton email ${me ? "" : "(pour te répondre / te rembourser)"}</label>
      <input type="email" id="cf-email" maxlength="200" placeholder="ton@email.fr" value="${me?.email ? me.email.replace(/"/g, "&quot;") : ""}">

      <button class="cf-send" id="cf-send" type="button">Envoyer</button>
      <p class="cf-err" id="cf-err">L'envoi n'a pas marché. Réessaie dans quelques secondes.</p>
      <a class="cf-back" href="#/">← Retour</a>
    </div>
  </div>`;

  const err = root.querySelector("#cf-err");
  root.querySelector("#cf-send").addEventListener("click", async () => {
    const btn = root.querySelector("#cf-send");
    const reasons = [...root.querySelectorAll("#cf-opts input:checked")].map(
      (i) => i.value,
    );
    const details = root
      .querySelector("#cf-details")
      .value.trim()
      .slice(0, 2000);
    const email = root.querySelector("#cf-email").value.trim().slice(0, 200);
    if (!reasons.length && !details) {
      err.textContent = "Coche au moins une raison (ou écris-nous un mot).";
      err.classList.add("on");
      return;
    }
    err.classList.remove("on");
    btn.disabled = true;
    btn.textContent = "Envoi…";
    try {
      // user_id = id d'AUTH (FK auth.users), pas l'id de profil — piège connu.
      const {
        data: { user: authUser },
      } = await sb.auth.getUser();
      const { error } = await sb.from("churn_feedback").insert({
        reasons,
        details: details || null,
        email: email || null,
        user_id: authUser?.id ?? null,
      });
      if (error) throw error;
      track("churn.submit", {
        reasons: reasons.join(","),
        has_details: !!details,
      });
      root.querySelector(".cf-wrap").innerHTML = `
        <div class="cf-done">
          <div class="emo">🙏</div>
          <h1>Merci, c'est noté.</h1>
          <p class="cf-sub">Si tu as demandé un remboursement (3 premiers jours), il part sous 24 h.<br>Et si tu changes d'avis, ta place t'attend.</p>
          <a class="cf-back" href="#/">← Retour à l'accueil</a>
        </div>`;
    } catch (e) {
      console.error("[churn]", e);
      btn.disabled = false;
      btn.textContent = "Envoyer";
      err.textContent =
        "L'envoi n'a pas marché. Réessaie dans quelques secondes.";
      err.classList.add("on");
    }
  });
}
