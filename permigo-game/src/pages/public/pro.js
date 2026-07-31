// ═══════════════════════════════════════════════════════════════
// Page publique B2B — PermiGo pour les auto-écoles + DEMANDE DE DEVIS
// URL : #/pro  (alias #/devis, #/auto-ecole)
//
// Cible : gérants d'auto-école & moniteurs indépendants (démarchage).
// Haut de page = accroche + bouton qui scrolle vers le formulaire en bas.
// Le formulaire insère dans la table `leads` (RLS : insert anon autorisé si
// email valide + ecole_nom non vide). ⚠️ Pas d'email auto (Resend non branché) :
// la demande atterrit dans Supabase → Rayan la consulte en base.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";

const TEL = "06 02 12 53 87";

const STYLE = `<style>
  .pro {
    --a:#6c63ff; --a-lt:#8e87ff; --a-dk:#4a3fc9;
    --gold:#ffce4d; --gold-dp:#e8a317;
    --ink:#f4f1ff; --ink-soft:#cdc8ec; --ink-mu:#a49dd6;
    --field:#221a4f; --field-line:#544a97;
    position:relative; min-height:100dvh; color:var(--ink);
    font-family:'Archivo', var(--fb), system-ui, sans-serif;
    -webkit-font-smoothing:antialiased;
    padding: max(28px, env(safe-area-inset-top)) 18px max(48px, calc(24px + env(safe-area-inset-bottom)));
    background:
      radial-gradient(120% 80% at 50% -10%, rgba(108,99,255,.30), transparent 55%),
      radial-gradient(130% 120% at 50% 115%, rgba(0,0,0,.55), transparent 60%),
      linear-gradient(165deg, #201748 0%, #191138 60%, #120c29 100%);
  }
  .pro-wrap { max-width: 560px; margin: 0 auto; }

  /* HERO */
  .pro-hero { text-align:center; padding: 26px 6px 8px; }
  .pro-logo { width:74px; height:74px; margin:0 auto 14px; display:block;
    filter: drop-shadow(0 4px 10px rgba(0,0,0,.5)) drop-shadow(0 0 18px rgba(88,204,2,.55)); }
  .pro-eyebrow { font:800 12px/1 'Archivo',var(--fb),sans-serif; letter-spacing:.18em;
    text-transform:uppercase; color:var(--a-lt); margin-bottom:14px; }
  .pro-h1 { font:800 34px/1.12 'Archivo',var(--fb),sans-serif; letter-spacing:-.01em;
    margin:0 0 12px; text-shadow:0 2px 0 rgba(0,0,0,.3); }
  .pro-h1 .hl { color:var(--a-lt); }
  .pro-lead { font:600 17px/1.5 'Archivo',var(--fb),sans-serif; color:var(--ink-soft);
    margin:0 auto 22px; max-width:420px; }
  .pro-cta { display:inline-flex; align-items:center; gap:8px; cursor:pointer;
    border:none; padding:16px 30px; border-radius:999px; color:#2a1c00;
    font:800 17px/1 'Archivo',var(--fb),sans-serif;
    background:linear-gradient(180deg,#ffe083,var(--gold) 55%,var(--gold-dp));
    box-shadow: inset 0 1.5px 0 rgba(255,255,255,.7), 0 6px 0 #b47a08, 0 12px 22px rgba(0,0,0,.4);
    transition: transform .12s, box-shadow .12s; }
  .pro-cta:active { transform: translateY(4px); box-shadow: inset 0 1.5px 0 rgba(255,255,255,.7), 0 2px 0 #b47a08, 0 6px 12px rgba(0,0,0,.4); }
  .pro-tel { display:block; margin-top:14px; font:700 14.5px/1.4 'Archivo',var(--fb),sans-serif; color:var(--ink-mu); }
  .pro-tel a { color:var(--ink); text-decoration:none; border-bottom:1.5px dotted var(--field-line); }

  /* POURQUOI */
  .pro-why { display:grid; gap:12px; margin:40px 0 8px; }
  .pro-card { display:flex; gap:13px; align-items:flex-start; padding:16px 16px;
    border-radius:18px; background:rgba(255,255,255,.045);
    box-shadow: inset 0 0 0 1.5px rgba(124,111,224,.28); }
  .pro-card .emo { font-size:26px; line-height:1; flex-shrink:0; }
  .pro-card b { display:block; font:800 16px/1.3 'Archivo',var(--fb),sans-serif; margin-bottom:3px; }
  .pro-card span { font:600 14px/1.45 'Archivo',var(--fb),sans-serif; color:var(--ink-soft); }

  /* FORMULAIRE */
  .pro-form { margin-top:40px; padding:26px 22px 24px; border-radius:26px;
    background:linear-gradient(180deg,#2c2260 0%,#241b52 60%,#1d1547 100%);
    box-shadow: inset 0 3px 0 rgba(255,255,255,.14), 0 12px 30px rgba(0,0,0,.45), 0 0 0 2px rgba(124,111,224,.3); }
  .pro-form-t { font:800 24px/1.15 'Archivo',var(--fb),sans-serif; text-align:center; margin:0 0 4px; }
  .pro-form-s { font:600 14px/1.45 'Archivo',var(--fb),sans-serif; color:var(--ink-soft); text-align:center; margin:0 0 22px; }
  .pro-q { margin-bottom:18px; }
  .pro-q > label { display:block; font:800 13.5px/1.3 'Archivo',var(--fb),sans-serif; margin:0 0 9px; color:var(--ink); }
  .pro-opts { display:flex; flex-wrap:wrap; gap:9px; }
  .pro-opt { cursor:pointer; padding:11px 16px; border-radius:13px;
    font:700 14.5px/1 'Archivo',var(--fb),sans-serif; color:var(--ink-soft);
    background:var(--field); border:2px solid transparent; box-shadow: inset 0 2px 6px rgba(0,0,0,.35);
    transition: all .12s; min-height:44px; display:inline-flex; align-items:center; }
  .pro-opt:active { transform: scale(.97); }
  .pro-opt.on { color:#fff; background:linear-gradient(180deg,var(--a-lt),var(--a) 60%,var(--a-dk));
    border-color:rgba(255,255,255,.4); box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 4px 12px rgba(108,99,255,.5); }
  .pro-input { width:100%; box-sizing:border-box; padding:14px 15px; border-radius:14px;
    background:var(--field); border:2px solid var(--field-line); color:var(--ink);
    font:600 16px/1.2 'Archivo',var(--fb),sans-serif; outline:none; transition:border-color .15s; }
  .pro-input::placeholder { color:var(--ink-mu); }
  .pro-input:focus { border-color:var(--gold); }
  .pro-input.error { border-color:#ff6b6b; }
  .pro-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media (max-width:420px){ .pro-grid2 { grid-template-columns:1fr; } }
  .pro-submit { width:100%; margin-top:8px; cursor:pointer; border:none; padding:17px; border-radius:16px;
    color:#2a1c00; font:800 18px/1 'Archivo',var(--fb),sans-serif;
    background:linear-gradient(180deg,#ffe083,var(--gold) 55%,var(--gold-dp));
    box-shadow: inset 0 1.5px 0 rgba(255,255,255,.7), 0 6px 0 #b47a08, 0 12px 20px rgba(0,0,0,.4);
    transition: transform .12s, opacity .15s; }
  .pro-submit:disabled { opacity:.5; cursor:not-allowed; }
  .pro-submit:not(:disabled):active { transform: translateY(3px); }
  .pro-legal { font:600 12px/1.5 'Archivo',var(--fb),sans-serif; color:var(--ink-mu); text-align:center; margin:14px 0 0; }

  /* MERCI */
  .pro-thanks { text-align:center; padding:20px 8px; }
  .pro-thanks .emo { font-size:56px; }
  .pro-thanks h2 { font:800 26px/1.2 'Archivo',var(--fb),sans-serif; margin:12px 0 8px; }
  .pro-thanks p { font:600 16px/1.5 'Archivo',var(--fb),sans-serif; color:var(--ink-soft); margin:0 0 6px; }
</style>`;

const NB_MON = ["1", "2 à 5", "6 à 10", "Plus de 10"];
const NB_ELV = ["Moins de 20", "20 à 50", "50 à 100", "Plus de 100"];
const RAISONS = [
  "Des élèves plus motivés",
  "Suivre leur engagement",
  "Gagner du temps en leçon",
  "Moderniser mon image",
  "Autre",
];

const nbMonToInt = (type, label) => {
  if (type === "independant") return 1;
  return { 1: 1, "2 à 5": 5, "6 à 10": 10, "Plus de 10": 15 }[label] ?? null;
};

const optsHtml = (name, list, multi) =>
  list
    .map(
      (l) =>
        `<button type="button" class="pro-opt" data-group="${name}" data-multi="${multi ? 1 : 0}" data-val="${escAttr(l)}">${esc(l)}</button>`,
    )
    .join("");

export async function mount(root) {
  track("pro.viewed", { from: "landing_b2b" });

  root.innerHTML = `${STYLE}
    <div class="pro">
      <div class="pro-wrap">
        <div class="pro-hero">
          <img class="pro-logo" src="/skins/avatars/permigo-badge-icon.png" alt="PermiGo" draggable="false"
               onerror="this.style.visibility='hidden'">
          <div class="pro-eyebrow">Pour les auto-écoles</div>
          <h1 class="pro-h1">Des élèves qui arrivent <span class="hl">préparés</span> à chaque leçon.</h1>
          <p class="pro-lead">PermiGo prépare vos élèves avant chaque heure de conduite et vous montre leur engagement. Pensé et créé par des enseignants.</p>
          <button class="pro-cta" id="pro-scroll">Demander un devis →</button>
          <span class="pro-tel">ou par téléphone : <a href="tel:+33602125387">${TEL}</a></span>
        </div>

        <div class="pro-why">
          <div class="pro-card"><span class="emo">🔥</span><div><b>Des élèves motivés</b><span>Ils travaillent leur conduite même entre deux leçons. Moins d'absences, plus de régularité.</span></div></div>
          <div class="pro-card"><span class="emo">👁️</span><div><b>Vous suivez leur engagement</b><span>D'un coup d'œil : qui avance, qui décroche. Vous gardez le lien.</span></div></div>
          <div class="pro-card"><span class="emo">⏱️</span><div><b>Un travail allégé</b><span>L'élève arrive préparé : vos leçons vont plus loin, plus vite.</span></div></div>
          <div class="pro-card"><span class="emo">✨</span><div><b>Une image moderne</b><span>Une auto-école qui rassure, engage et fidélise ses élèves.</span></div></div>
        </div>

        <div class="pro-form" id="devis-form">
          <h2 class="pro-form-t">Demandez votre devis</h2>
          <p class="pro-form-s">Gratuit et sans engagement. On vous recontacte vite.</p>

          <div class="pro-q">
            <label>Vous êtes…</label>
            <div class="pro-opts">${optsHtml("type", ["Auto-école", "Moniteur indépendant"], false)}</div>
          </div>

          <div class="pro-q" id="q-nbmon">
            <label>Combien de moniteurs ?</label>
            <div class="pro-opts">${optsHtml("nbmon", NB_MON, false)}</div>
          </div>

          <div class="pro-q">
            <label>Combien d'élèves environ ?</label>
            <div class="pro-opts">${optsHtml("nbelv", NB_ELV, false)}</div>
          </div>

          <div class="pro-q">
            <label>Pourquoi voulez-vous tester ? <span style="font-weight:600;color:var(--ink-mu)">(plusieurs choix)</span></label>
            <div class="pro-opts">${optsHtml("raison", RAISONS, true)}</div>
          </div>

          <div class="pro-q">
            <label for="pro-nom">Nom de l'auto-école (ou le vôtre)</label>
            <input class="pro-input" id="pro-nom" type="text" autocomplete="organization" placeholder="Ex : Auto-école du Centre, Karim Conduite…" />
          </div>

          <div class="pro-q pro-grid2">
            <div>
              <label for="pro-email" style="display:block;font:800 13.5px/1.3 'Archivo',var(--fb),sans-serif;margin:0 0 9px">Email</label>
              <input class="pro-input" id="pro-email" type="email" autocomplete="email" autocapitalize="off" placeholder="vous@exemple.fr" />
            </div>
            <div>
              <label for="pro-tel" style="display:block;font:800 13.5px/1.3 'Archivo',var(--fb),sans-serif;margin:0 0 9px">Téléphone <span style="font-weight:600;color:var(--ink-mu)">(optionnel)</span></label>
              <input class="pro-input" id="pro-tel" type="tel" autocomplete="tel" placeholder="06 …" />
            </div>
          </div>

          <div class="pro-q">
            <label for="pro-ville">Ville <span style="font-weight:600;color:var(--ink-mu)">(optionnel)</span></label>
            <input class="pro-input" id="pro-ville" type="text" autocomplete="address-level2" placeholder="Ex : Cergy" />
          </div>

          <button class="pro-submit" id="pro-submit" disabled>Envoyer ma demande</button>
          <p class="pro-legal">Vos coordonnées servent uniquement à vous recontacter. Aucun engagement.</p>
        </div>
      </div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const state = { type: "", nbmon: "", nbelv: "", raison: new Set() };

  // Bouton haut → scroll vers le formulaire
  $("#pro-scroll").addEventListener("click", () => {
    $("#devis-form").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => $("#pro-nom")?.focus(), 500);
  });

  const nomEl = $("#pro-nom");
  const emailEl = $("#pro-email");
  const telEl = $("#pro-tel");
  const villeEl = $("#pro-ville");
  const submitBtn = $("#pro-submit");
  const emailValid = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v || "").trim());

  const validate = () => {
    const ok =
      !!state.type &&
      nomEl.value.trim().length >= 2 &&
      emailValid(emailEl.value);
    submitBtn.disabled = !ok;
  };

  // Sélecteurs à boutons (single ou multi)
  root.querySelectorAll(".pro-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.dataset.group;
      const multi = btn.dataset.multi === "1";
      const val = btn.dataset.val;
      if (multi) {
        const on = btn.classList.toggle("on");
        if (on) state.raison.add(val);
        else state.raison.delete(val);
      } else {
        root
          .querySelectorAll(`.pro-opt[data-group="${group}"]`)
          .forEach((b) => b.classList.remove("on"));
        btn.classList.add("on");
        state[group] = val;
        // Indépendant → la question « nb moniteurs » n'a pas de sens (c'est 1)
        if (group === "type") {
          $("#q-nbmon").style.display =
            val === "Moniteur indépendant" ? "none" : "";
          state.type = val === "Moniteur indépendant" ? "independant" : "ecole";
        }
      }
      validate();
    });
  });

  [nomEl, emailEl].forEach((el) => el.addEventListener("input", validate));

  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi…";
    const { toast } = await import("@/components/common/toast.js");

    const nom = nomEl.value.trim();
    const email = emailEl.value.trim();
    const tel = telEl.value.trim();
    const ville = villeEl.value.trim();
    const typeLabel =
      state.type === "independant" ? "Moniteur indépendant" : "Auto-école";
    const raisons = [...state.raison];
    const message =
      `Type : ${typeLabel}` +
      (state.type === "ecole" ? ` · Moniteurs : ${state.nbmon || "—"}` : "") +
      ` · Élèves estimés : ${state.nbelv || "—"}` +
      ` · Raison(s) : ${raisons.length ? raisons.join(", ") : "—"}`;

    try {
      const { error } = await sb.from("leads").insert({
        ecole_nom: nom,
        email,
        telephone: tel || null,
        ville: ville || null,
        nb_enseignants: nbMonToInt(state.type, state.nbmon),
        source: "devis",
        message,
      });
      if (error) throw error;

      track("pro.devis_submitted", { type: state.type });
      $("#devis-form").innerHTML = `
        <div class="pro-thanks">
          <div class="emo">✅</div>
          <h2>Merci, ${esc(nom)} !</h2>
          <p>Votre demande est bien reçue. On vous recontacte très vite.</p>
          <p>Une question tout de suite ? <a href="tel:+33602125387" style="color:var(--gold);font-weight:800">${TEL}</a></p>
        </div>`;
      $("#devis-form").scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e) {
      console.error("[pro] devis insert failed", e);
      const msg = /rate|too many|limit/i.test(e?.message || "")
        ? "Trop de demandes d'un coup. Réessayez dans un instant, ou appelez-nous."
        : "Oups, l'envoi a échoué. Réessayez, ou appelez-nous au " + TEL + ".";
      toast(msg, "error", 4500);
      submitBtn.disabled = false;
      submitBtn.textContent = "Envoyer ma demande";
    }
  });
}
