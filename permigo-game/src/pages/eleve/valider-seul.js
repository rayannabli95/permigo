// ═══════════════════════════════════════════════════════════════
// Élève — CERTIFIER une compétence de son parcours (TOUS les élèves)
// Route #/valider-seul/{compId} — CTA posé dans la fiche compétence de
// parcours.js (openFiche).
//
// Pivot 17/07 (décision Rayan) : l'élève avance SEUL dans son parcours —
// rattaché ou solo, il a de toute façon un enseignant dans la voiture. Le
// moniteur ne valide plus rien d'obligatoire ; il observe (livret : badge
// distinct, policy #512). `validations` (écrite par l'enseignant) reste une
// confirmation optionnelle jamais écrasée.
//
// Flow :
//   1. Relire la fiche de la compétence (rappel condensé + lien fiche).
//   2. Quiz de validation (quiz-engine.js, questions post_validation DB).
//   3. Score ≥ 80% → question de certification UNIFIÉE : « Tu te sens
//      prêt·e à passer à la suite ? » — l'élève certifie ce qui s'est
//      passé en vraie leçon (crédibilité : il n'a aucun intérêt à tricher,
//      son moniteur voit ses certifications).
//   4. Oui → RPC self_validate_competence (correction SERVEUR, table
//      self_validations séparée de `validations`) + 25 volants
//      (claim_competence_reward, idempotent).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { toast } from "@/components/common/toast.js";
import { haptic } from "@/utils/haptic.js";
import { lancerQuiz } from "@/services/quiz-engine.js";
import { findSubComp, findCategory } from "@/data/remc.js";
import { getFiche } from "@/data/fiches-conduite.js";
import { burstConfetti } from "@/components/common/confetti.js";
import { refreshGemmes } from "@/utils/game-state.js";

const NB_QUESTIONS = 5; // plus que le quiz-récap (3) : la note ≥80% doit avoir du sens
const SEUIL = 80;

const STYLE = `<style>
.vs { max-width: 480px; margin: 0 auto; padding: 0 16px calc(110px + env(safe-area-inset-bottom));
  font-family: 'Inter', sans-serif; color: var(--ink); }
.vs-top { display:flex; align-items:center; gap:10px; padding:16px 0 8px; }
.vs-back { width:38px; height:38px; border-radius:11px; border:0; cursor:pointer;
  background: var(--su, #fff); color: var(--ink); font-size:20px; line-height:1;
  box-shadow: 0 1px 4px rgba(0,0,0,.08); flex-shrink:0; }
.vs-back:active { transform: scale(0.95); }
.vs-kick { font:700 11px/1 'Inter',sans-serif; letter-spacing:.1em; text-transform:uppercase; color:var(--a-txt,var(--a)); margin:0 0 2px; }
.vs-h1 { font:800 21px/1.2 'Plus Jakarta Sans',sans-serif; letter-spacing:-.02em; margin:0; }

.vs-card { background:var(--su,#fff); border:1px solid var(--bo); border-radius:20px; padding:18px; margin-top:16px; box-shadow:0 4px 18px -12px rgba(11,13,26,.25); }
.vs-warn { display:flex; gap:12px; align-items:flex-start; }
.vs-warn svg { color:var(--am,#f59e0b); flex-shrink:0; margin-top:2px; }
.vs-warn p { margin:0; font:500 13.5px/1.5 'Inter',sans-serif; color:var(--mu); }

.vs-hero { text-align:center; padding:6px 4px 4px; }
.vs-hero-med { margin:0 auto 10px; width:56px; height:56px; }
.vs-hero-cat { font:700 10px/1 'Inter',sans-serif; letter-spacing:.14em; text-transform:uppercase; color:var(--mu2); margin-bottom:6px; }
.vs-hero-ttl { font:800 19px/1.25 'Plus Jakarta Sans',sans-serif; margin:0 0 8px; }
.vs-hero-p { font:500 13.5px/1.55 'Inter',sans-serif; color:var(--mu); margin:0; }

.vs-steps { margin-top:18px; display:flex; flex-direction:column; gap:10px; }
.vs-step { display:flex; gap:12px; align-items:flex-start; background:var(--su,#fff); border:1px solid var(--bo); border-radius:16px; padding:14px; }
.vs-step-n { flex-shrink:0; width:26px; height:26px; border-radius:50%; background:var(--a); color:var(--a-ink);
  display:flex; align-items:center; justify-content:center; font:800 13px/1 'Plus Jakarta Sans',sans-serif; }
.vs-step-tx { flex:1; min-width:0; }
.vs-step-tx b { display:block; font:700 14px/1.3 'Plus Jakarta Sans',sans-serif; margin-bottom:2px; }
.vs-step-tx span { font:500 12.5px/1.5 'Inter',sans-serif; color:var(--mu); }
.vs-step-fiche { margin-top:10px; }
.vs-fiche-list { margin:8px 0 0; padding:0; list-style:none; display:flex; flex-direction:column; gap:7px; }
.vs-fiche-list li { display:flex; gap:8px; font:500 13px/1.45 'Inter',sans-serif; color:var(--ink); }
.vs-fiche-list b { flex-shrink:0; color:var(--a-txt,var(--a)); font:800 12px/1.5 'IBM Plex Mono',monospace; }
.vs-fiche-link { display:inline-flex; align-items:center; gap:6px; margin-top:10px; font:700 12.5px/1 'Inter',sans-serif; color:var(--a-txt,var(--a)); text-decoration:none; }

.vs-cta { width:100%; margin-top:20px; padding:17px; border:0; border-radius:16px; cursor:pointer;
  font:800 15.5px/1 'Plus Jakarta Sans',sans-serif; color:var(--a-ink);
  background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
  box-shadow: 0 8px 22px color-mix(in srgb, var(--a) 40%, transparent), inset 0 1.5px 0 rgba(255,255,255,.28);
  display:flex; align-items:center; justify-content:center; gap:9px;
  transition: transform .15s, opacity .15s; }
.vs-cta:disabled { opacity:.55; cursor:not-allowed; }
.vs-cta:not(:disabled):active { transform: scale(.98); }
.vs-hint { text-align:center; margin:10px 0 0; font:600 12px/1.5 'Inter',sans-serif; color:var(--mu2); }

.vs-already { display:flex; align-items:center; gap:12px; }
.vs-already-tx b { display:block; font:800 15px/1.3 'Plus Jakarta Sans',sans-serif; }
.vs-already-tx span { font:500 12.5px/1.5 'Inter',sans-serif; color:var(--mu); }

/* ── Écran résultat : DA Arène nuit-violet + or (célébration) ── */
.vsr { position:relative; min-height: calc(100dvh - 60px); padding: 30px 20px calc(120px + env(safe-area-inset-bottom));
  color:#f2f0fa; font-family:'Inter',sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;
  background:
    radial-gradient(120% 55% at 50% -5%, rgba(255,190,70,.12) 0%, transparent 55%),
    radial-gradient(120% 60% at 50% 22%, rgba(110,70,220,.24) 0%, transparent 62%),
    linear-gradient(180deg,#181241 0%,#0f0d24 58%,#0b0a1c 100%); }
.vsr-med { width:96px; height:96px; margin-bottom:16px; animation: vsrPop .5s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes vsrPop { from { opacity:0; transform:scale(.7); } to { opacity:1; transform:scale(1); } }
.vsr-kick { display:inline-flex; align-items:center; gap:6px; font:800 11px/1 'Inter',sans-serif; letter-spacing:.12em; text-transform:uppercase;
  color:#ffd76e; background:rgba(255,210,74,.12); border:1px solid rgba(255,210,74,.3); padding:6px 14px; border-radius:99px; margin-bottom:14px; }
.vsr-ttl { font:800 25px/1.2 'Baloo 2',cursive; margin:0 0 8px;
  background:linear-gradient(180deg,#ffe9b0,#f5b73d); -webkit-background-clip:text; background-clip:text; color:transparent; }
.vsr-p { font:500 14px/1.55 'Inter',sans-serif; color:#cabfef; margin:0 0 4px; max-width:320px; }
.vsr-score { font:800 13px/1 'Plus Jakarta Sans',sans-serif; color:#8ef0b0; margin:10px 0 0; }
.vsr-volants { display:inline-flex; align-items:center; gap:8px; margin:16px 0 0; padding:9px 16px; border-radius:99px;
  font:800 14px/1 'Plus Jakarta Sans',sans-serif; color:#ffd76e;
  background:rgba(255,210,74,.12); border:1px solid rgba(255,210,74,.3); }
.vsr-volants img { width:22px; height:22px; }
.vsr-cta { width:100%; max-width:340px; margin-top:26px; padding:16px; border:0; border-radius:14px; cursor:pointer;
  font:800 15px/1 'Plus Jakarta Sans',sans-serif; color:#4a2500;
  background:linear-gradient(180deg,#ffd76e,#f0a93f); box-shadow:0 6px 0 #b46a10, 0 12px 22px rgba(0,0,0,.4); }
.vsr-cta:active { transform:translateY(3px); box-shadow:0 3px 0 #b46a10, 0 7px 14px rgba(0,0,0,.4); }
.vsr-ghost { width:100%; max-width:340px; margin-top:10px; padding:14px; border:1.5px solid rgba(255,255,255,.35); background:transparent; color:#fff;
  border-radius:14px; cursor:pointer; font:700 13.5px/1 'Plus Jakarta Sans',sans-serif; }
.vsr-ghost:active { transform: scale(.98); }
.vsr.fail .vsr-kick { color:#ffb0b0; background:rgba(255,120,120,.1); border-color:rgba(255,120,120,.28); }
.vsr.fail .vsr-ttl { background:linear-gradient(180deg,#ffd0d0,#ff9c9c); -webkit-background-clip:text; background-clip:text; color:transparent; }

@media (prefers-reduced-motion: reduce) { .vsr-med { animation:none; } }
</style>`;

function catMedallion(ico, size = 40) {
  const RAMP = {
    "world-c1": "gold",
    "world-c2": "blue",
    "world-c3": "violet",
    "world-c4": "gold",
  };
  return medallion("bouclier", RAMP[ico] || "violet", { size });
}

function topBar(title) {
  return `<div class="vs-top">
      <button class="vs-back" aria-label="Retour">←</button>
      <div><p class="vs-kick">Validation autonome</p><h1 class="vs-h1" tabindex="-1">${esc(title)}</h1></div>
    </div>`;
}

function skeleton() {
  return `${STYLE}<div class="vs">${topBar("Chargement…")}</div>`;
}

function wireBack(root) {
  root
    .querySelector(".vs-back")
    ?.addEventListener("click", () => navigate("#/parcours"));
}

function notFoundScreen() {
  return `${STYLE}<div class="vs">
    ${topBar("Compétence introuvable")}
    <div class="vs-card vs-warn">
      ${icon("alert-circle", { size: 20 })}
      <p>Cette compétence n'existe pas. Retourne à ton parcours pour en choisir une.</p>
    </div>
  </div>`;
}

function blockedScreen(sub) {
  return `${STYLE}<div class="vs">
    ${topBar(sub?.n || "Compétence")}
    <div class="vs-card vs-warn">
      ${icon("alert-circle", { size: 20 })}
      <p>Ton moniteur a déjà validé cette compétence — rien à faire ici.</p>
    </div>
  </div>`;
}

function introScreen(sub, cat, already) {
  const fiche = getFiche(sub.c);
  const steps = (fiche?.methode || []).slice(0, 4);
  const ficheList = steps.length
    ? `<ul class="vs-fiche-list">${steps.map((s, i) => `<li><b>${String(i + 1).padStart(2, "0")}</b>${esc(s.replace(/^.{2,26}? [—–] /, ""))}</li>`).join("")}</ul>`
    : "";

  const alreadyBanner = already
    ? `<div class="vs-card vs-already">
        <div>${medallion("check", "violet", { size: 40 })}</div>
        <div class="vs-already-tx">
          <b>Déjà certifiée</b>
          <span>Quiz réussi à ${Math.round(already.score)}% le ${new Date(already.validated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}.</span>
        </div>
      </div>`
    : "";

  return `${STYLE}<div class="vs anim-slide-up">
    ${topBar(sub.n)}

    <div class="vs-card vs-hero">
      <div class="vs-hero-med">${catMedallion(cat?.ico, 56)}</div>
      <p class="vs-hero-cat">${esc(cat?.name || "")}</p>
      <h2 class="vs-hero-ttl">${esc(sub.n)}</h2>
      <p class="vs-hero-p">Ton moniteur te l'a validée en leçon, ou tu maîtrises déjà ce geste ? Prouve-le en 2 étapes.</p>
    </div>

    ${alreadyBanner}

    <div class="vs-steps">
      <div class="vs-step">
        <div class="vs-step-n">1</div>
        <div class="vs-step-tx">
          <b>Relis la méthode</b>
          <span>Un rappel rapide de ce qu'il faut maîtriser.</span>
          <div class="vs-step-fiche">${ficheList}</div>
          <a class="vs-fiche-link" href="#/revision-conduite/${esc(sub.c)}">${icon("book", { size: 14 })} Voir la fiche complète</a>
        </div>
      </div>
      <div class="vs-step">
        <div class="vs-step-n">2</div>
        <div class="vs-step-tx">
          <b>Le quiz de validation</b>
          <span>${NB_QUESTIONS} questions · il te faut au moins ${SEUIL}% pour valider.</span>
        </div>
      </div>
    </div>

    <button class="vs-cta" id="vs-start-quiz" type="button">${icon("zap", { size: 18 })} ${already ? "Repasser le quiz" : "Commencer le quiz de validation"}</button>
    <p class="vs-hint">Sois honnête avec toi-même — ce quiz ne remplace pas une vraie leçon de conduite.</p>
  </div>`;
}

function successScreen(sub, scorePct, volants = 0) {
  return `${STYLE}<div class="vsr anim-slide-up">
    <div class="vsr-med">${medallion("check", "violet", { size: 96 })}</div>
    <span class="vsr-kick">${icon("shield", { size: 13 })} Certifiée par toi</span>
    <h1 class="vsr-ttl">Compétence certifiée !</h1>
    <p class="vsr-p">« ${esc(sub.n)} » est maintenant acquise dans ton parcours.</p>
    <p class="vsr-score">Quiz réussi à ${scorePct}%</p>
    ${volants > 0 ? `<span class="vsr-volants"><img src="/skins/volant-coin.webp" alt=""> +${volants} volants</span>` : ""}
    <button class="vsr-cta" id="vs-cta-parcours" type="button">Voir mon parcours</button>
  </div>`;
}

function failScreen(sub, scorePct) {
  return `${STYLE}<div class="vsr fail anim-slide-up">
    <div class="vsr-med">${medallion("faute", "orange", { size: 96 })}</div>
    <span class="vsr-kick">${icon("x", { size: 13 })} Pas encore</span>
    <h1 class="vsr-ttl">Presque !</h1>
    <p class="vsr-p">${scorePct}% sur « ${esc(sub.n)} » — il te faut ${SEUIL}% pour valider. Relis la fiche et retente.</p>
    <button class="vsr-cta" id="vs-retry" type="button">Relire la fiche et retenter</button>
    <button class="vsr-ghost" id="vs-cta-parcours" type="button">Retour au parcours</button>
  </div>`;
}

export async function mount(root, param) {
  const me = getCurUser();
  if (!me) return;

  const compId = param || null;
  const sub = compId ? findSubComp(compId) : null;
  const cat = compId ? findCategory(compId) : null;

  if (!compId || !sub || !cat) {
    root.innerHTML = notFoundScreen();
    wireBack(root);
    return;
  }

  track("page_view", {
    page: "valider_seul",
    role: me.role,
    competence_id: compId,
  });

  root.innerHTML = skeleton();

  // Garde-fou côté AFFICHAGE (la vraie garantie est côté RPC — jamais
  // confiance au client). Ouvert à TOUS les élèves depuis le pivot 17/07 ;
  // seul cas fermé : le moniteur a déjà validé (rien à certifier).
  const [valRes, selfRes] = await Promise.allSettled([
    sb
      .from("validations")
      .select("statut")
      .eq("eleve_id", me.id)
      .eq("competence_id", compId)
      .maybeSingle(),
    sb
      .from("self_validations")
      .select("score, validated_at")
      .eq("eleve_id", me.id)
      .eq("competence_id", compId)
      .maybeSingle(),
  ]);

  const acquisMoniteur =
    valRes.status === "fulfilled" && valRes.value.data?.statut === "acquis";
  const already =
    selfRes.status === "fulfilled" ? selfRes.value.data || null : null;

  if (acquisMoniteur) {
    root.innerHTML = blockedScreen(sub);
    wireBack(root);
    return;
  }

  root.innerHTML = introScreen(sub, cat, already);
  wireIntro(root, me, compId, sub, cat);
}

function wireIntro(root, me, compId, sub, cat) {
  wireBack(root);
  root.querySelector("#vs-start-quiz")?.addEventListener("click", async () => {
    const btn = root.querySelector("#vs-start-quiz");
    if (btn) btn.disabled = true;
    haptic("tap");
    track("valider_seul.quiz_start", { competence_id: compId });

    const launched = await lancerQuiz({
      competenceId: compId,
      type: "post_validation",
      nbQuestions: NB_QUESTIONS,
      onComplete: (score, total, answers) =>
        handleComplete(root, me, compId, sub, cat, score, total, answers),
    });

    if (launched === null) {
      if (btn) btn.disabled = false;
      toast(
        "Pas encore de questions sur cette compétence — réessaie plus tard.",
        "info",
      );
    }
  });
}

async function handleComplete(
  root,
  me,
  compId,
  sub,
  cat,
  score,
  total,
  answers,
) {
  const scorePct = Math.round((score / total) * 100);
  track("valider_seul.quiz_done", {
    competence_id: compId,
    score_pct: scorePct,
  });

  // Journalise la tentative — même RPC que le reste de l'app (quiz_attempts +
  // XP/quêtes déjà câblés dessus). Pour un élève sans moniteur, `validations`
  // n'a JAMAIS de ligne pré-existante pour cette compétence → la RPC renvoie
  // systématiquement reason:'no_competence_unlocked' SANS toucher
  // `validations` (garde-fou vérifié dans le code de la RPC). Best-effort :
  // une erreur ici ne doit jamais bloquer la validation autonome elle-même.
  try {
    await sb.rpc("submit_competence_quiz", {
      p_competence_id: compId,
      p_score: scorePct,
      p_type: "post_validation",
    });
  } catch (e) {
    console.warn("[valider-seul] submit_competence_quiz", e);
  }

  if (scorePct < SEUIL) {
    haptic("warning");
    root.innerHTML = failScreen(sub, scorePct);
    wireResult(root, me, compId, sub, cat);
    return;
  }

  // Quiz réussi → question de certification UNIFIÉE (décision Rayan 17/07,
  // même formulation pour tous : rattaché ou solo, la vraie leçon a eu lieu
  // en voiture). La compétence ne monte que si l'élève certifie.
  haptic("success");
  root.innerHTML = confirmScreen(sub, scorePct);
  wireBack(root);
  root.querySelector("#vs-certify")?.addEventListener("click", () => {
    const b = root.querySelector("#vs-certify");
    if (b) b.disabled = true;
    certify(root, me, compId, sub, cat, scorePct, answers);
  });
  root.querySelector("#vs-not-yet")?.addEventListener("click", () => {
    track("valider_seul.not_yet", { competence_id: compId });
    toast("Aucune pression — reviens quand tu le sens.", "info");
    navigate("#/parcours");
  });
}

function confirmScreen(sub, scorePct) {
  return `${STYLE}<div class="vsr anim-slide-up">
    <div class="vsr-med">${medallion("check", "violet", { size: 96 })}</div>
    <span class="vsr-kick">${icon("check", { size: 13 })} Quiz réussi à ${scorePct}%</span>
    <h1 class="vsr-ttl">Tu te sens prêt·e à passer à la suite ?</h1>
    <p class="vsr-p">En certifiant « ${esc(sub.n)} », tu confirmes que ce geste est acquis en vraie leçon. Ton enseignant peut voir tes certifications.</p>
    <button class="vsr-cta" id="vs-certify" type="button">Oui, je certifie ${icon("shield", { size: 16 })}</button>
    <button class="vsr-ghost" id="vs-not-yet" type="button">Pas encore</button>
  </div>`;
}

async function certify(root, me, compId, sub, cat, scorePct, answers) {
  try {
    // Le SERVEUR corrige : on envoie les réponses, pas un score déclaratif
    // (migration solo_hardening — l'ancienne signature p_score est supprimée).
    const { data, error } = await sb.rpc("self_validate_competence", {
      p_competence_id: compId,
      p_answers: answers || [],
    });
    if (error || data?.error) {
      console.warn(
        "[valider-seul] self_validate_competence",
        error || data?.error,
      );
      toast("Erreur lors de la validation — réessaie.", "error");
      root.innerHTML = failScreen(sub, scorePct);
      wireResult(root, me, compId, sub, cat);
      return;
    }
    // Le serveur peut recaler ce que le client croyait réussi (anti-triche).
    if (data?.passed === false) {
      haptic("warning");
      root.innerHTML = failScreen(sub, data.score ?? scorePct);
      wireResult(root, me, compId, sub, cat);
      return;
    }
    haptic("success");
    burstConfetti({ count: 120, power: 18 });
    track("valider_seul.validated", {
      competence_id: compId,
      score_pct: scorePct,
    });

    // +25 volants — même récompense qu'une validation moniteur (parité solo).
    // Claim SERVEUR idempotent : 1 seule fois par compétence, repasser le
    // quiz ne re-crédite pas. Best-effort : un refus (migration pas encore
    // appliquée, réseau) ne bloque jamais la validation elle-même.
    let volants = 0;
    try {
      const { data: claim } = await sb.rpc("claim_competence_reward", {
        p_competence_id: compId,
      });
      if (claim?.ok && !claim.already_claimed && (claim.granted ?? 0) > 0) {
        volants = claim.granted;
        // Aligne le cache local sur la vérité serveur + rafraîchit la
        // pastille du header (refreshGemmes émet déjà pg-gemmes-changed).
        await refreshGemmes();
      }
    } catch (e) {
      console.warn("[valider-seul] claim_competence_reward", e);
    }

    root.innerHTML = successScreen(sub, scorePct, volants);
    wireResult(root, me, compId, sub, cat);
  } catch (e) {
    console.warn("[valider-seul] self_validate_competence", e);
    toast("Erreur réseau — réessaie.", "error");
    root.innerHTML = failScreen(sub, scorePct);
    wireResult(root, me, compId, sub, cat);
  }
}

function wireResult(root, me, compId, sub, cat) {
  root
    .querySelector("#vs-cta-parcours")
    ?.addEventListener("click", () => navigate("#/parcours"));
  root.querySelector("#vs-retry")?.addEventListener("click", () => {
    root.innerHTML = introScreen(sub, cat, null);
    wireIntro(root, me, compId, sub, cat);
  });
}
