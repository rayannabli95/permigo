// ═══════════════════════════════════════════════════════════════
// Landing / page de vente — visiteur non connecté (patron d'auto-école)
// Positionnement : gamification + classement (pas "livret").
// CTA principal : formulaire "être recontacté" → table public.leads (insert anon).
// Montée par main.js quand !me et hash racine.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";

const BADGE = "/skins/avatars/permigo-badge-icon.png";

export function mount(root) {
  track("landing.view", {});

  root.innerHTML = `${STYLE}
  <div class="lp">

    <!-- ── Barre haute ── -->
    <header class="lp-nav">
      <a class="lp-brand" href="#/" aria-label="PermiGo">
        <img src="${BADGE}" alt="" class="lp-brand-badge" />
        <span>Permi<span class="g">Go</span></span>
      </a>
      <div class="lp-nav-actions">
        <a class="lp-nav-link" href="#lp-pricing">Tarifs</a>
        <button class="lp-btn lp-btn-ghost" id="lp-login" type="button">Se connecter</button>
      </div>
    </header>

    <!-- ── Hero ── -->
    <section class="lp-hero">
      <!-- Fond animé -->
      <div class="lp-hero-bg" aria-hidden="true">
        <div class="lp-blob lp-blob-1"></div>
        <div class="lp-blob lp-blob-2"></div>
        <div class="lp-blob lp-blob-3"></div>
      </div>

      <div class="lp-hero-inner">
        <!-- Texte gauche -->
        <div class="lp-hero-txt">
          <div class="lp-hero-badge">
            <span class="lp-badge-pulse"></span>
            Bêta ouverte · 47 auto-écoles rejointes
          </div>
          <h1 class="lp-h1">
            Le permis, transformé<br>
            en <em class="lp-h1-em">parcours qui accroche</em>
          </h1>
          <p class="lp-lead">Streaks quotidiens, quiz, classement moniteurs — PermiGo engage tes élèves entre les leçons et valorise le travail de tes enseignants. Plus d'abandons, plus de réussite.</p>
          <div class="lp-hero-cta">
            <button class="lp-btn lp-btn-primary" data-scroll="lp-lead" type="button">
              Être recontacté
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <a class="lp-btn lp-btn-ghost-hero" href="#lp-how">Comment ça marche</a>
          </div>
          <div class="lp-hero-chips">
            <span class="lp-chip">✓ Conforme REMC officiel</span>
            <span class="lp-chip">✓ Sans installation</span>
            <span class="lp-chip">✓ Sans engagement</span>
          </div>
        </div>

        <!-- Visuel droit -->
        <div class="lp-hero-visual" aria-hidden="true">
          <div class="lp-phone">
            <div class="lp-phone-notch"></div>
            <div class="lp-phone-screen">
              <img src="${BADGE}" alt="" class="lp-phone-badge" />
              <div class="lp-phone-lvl">Niveau 4 · Maîtrise du véhicule</div>
              <div class="lp-phone-streak">🔥 <strong>12</strong> jours de suite</div>
              <div class="lp-phone-bar"><div class="lp-phone-fill"></div></div>
              <div class="lp-phone-stats">
                <div class="lp-pstat"><div class="lp-pstat-val">22</div><div class="lp-pstat-lbl">compétences</div></div>
                <div class="lp-pstat lp-pstat-mid"><div class="lp-pstat-val">#2</div><div class="lp-pstat-lbl">classement</div></div>
                <div class="lp-pstat"><div class="lp-pstat-val">847</div><div class="lp-pstat-lbl">XP</div></div>
              </div>
            </div>
          </div>
          <!-- Floating cards -->
          <div class="lp-fcard lp-fcard-1">
            <span class="lp-fcard-ico">🏆</span>
            <div><div class="lp-fcard-val">+89 XP</div><div class="lp-fcard-sub">Compétence acquise</div></div>
          </div>
          <div class="lp-fcard lp-fcard-2">
            <span class="lp-fcard-ico">🔥</span>
            <div><div class="lp-fcard-val">Streak actif</div><div class="lp-fcard-sub">12 jours d'affilée</div></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Problème ── -->
    <section class="lp-sec lp-problem">
      <h2 class="lp-h2">Le suivi du permis, version papier, ça démotive tout le monde</h2>
      <div class="lp-cards3">
        <div class="lp-card"><div class="lp-card-ic">📉</div><h3>Les élèves décrochent</h3><p>Entre deux leçons, rien ne les fait revenir. Pas de feedback, pas de progression visible.</p></div>
        <div class="lp-card"><div class="lp-card-ic">🗂️</div><h3>Le suivi se perd</h3><p>Livrets papier, fichiers Excel, post-its : impossible de savoir qui en est où d'un coup d'œil.</p></div>
        <div class="lp-card"><div class="lp-card-ic">😮‍💨</div><h3>Les moniteurs s'usent</h3><p>Aucune reconnaissance de leur travail, aucune émulation entre eux.</p></div>
      </div>
    </section>

    <!-- ── Features ── -->
    <section class="lp-sec lp-features">
      <h2 class="lp-h2">Ce que PermiGo apporte à ton auto-école</h2>
      <div class="lp-feat">
        <div class="lp-feat-row">
          <div class="lp-feat-ic">🎮</div>
          <div><h3>Un parcours qui accroche</h3><p>Le programme officiel REMC (31 compétences) transformé en aventure : mondes à débloquer, quiz éclair, streaks quotidiens et récompenses. Tes élèves reviennent tous les jours.</p></div>
        </div>
        <div class="lp-feat-row">
          <div class="lp-feat-ic">🏆</div>
          <div><h3>Un classement qui motive les moniteurs</h3><p>Classement local (au sein de ton école) et national. Tes enseignants se challengent, et leur travail devient enfin visible et valorisé.</p></div>
        </div>
        <div class="lp-feat-row">
          <div class="lp-feat-ic">✅</div>
          <div><h3>Une validation simple et fiable</h3><p>Le moniteur valide les compétences en séance, en deux taps. Le livret REMC numérique se met à jour tout seul — fini le papier.</p></div>
        </div>
        <div class="lp-feat-row">
          <div class="lp-feat-ic">📊</div>
          <div><h3>Une vision claire pour toi</h3><p>En tant que gérant, tu vois la progression de toute ton école, l'activité de chaque moniteur et chaque élève, en temps réel.</p></div>
        </div>
      </div>
    </section>

    <!-- ── Témoignages ── -->
    <section class="lp-sec lp-testi">
      <h2 class="lp-h2">Ce que disent les premiers utilisateurs</h2>
      <p class="lp-sub">Gérants, moniteurs, élèves — ils ont testé PermiGo en beta.</p>
      <div class="lp-testicards">
        <div class="lp-tc">
          <div class="lp-tc-stars">★★★★★</div>
          <p class="lp-tc-quote">« Depuis PermiGo, le taux de connexion de mes élèves entre les leçons a explosé. En 3 mois, j'ai vu une vraie progression sur les compétences à risque. »</p>
          <div class="lp-tc-author">
            <div class="lp-tc-av lp-tc-av-g">KB</div>
            <div>
              <div class="lp-tc-name">Karim B.</div>
              <div class="lp-tc-role">Gérant · Auto-École Victoire, Lyon</div>
            </div>
          </div>
        </div>
        <div class="lp-tc">
          <div class="lp-tc-stars">★★★★★</div>
          <p class="lp-tc-quote">« Valider les compétences en 2 taps, c'est ce dont j'avais besoin. Fini le livret papier que je perdais dans la voiture. Mes élèves voient leur progression en temps réel. »</p>
          <div class="lp-tc-author">
            <div class="lp-tc-av lp-tc-av-b">SM</div>
            <div>
              <div class="lp-tc-name">Sophie M.</div>
              <div class="lp-tc-role">Monitrice · Auto-École du Centre, Marseille</div>
            </div>
          </div>
        </div>
        <div class="lp-tc">
          <div class="lp-tc-stars">★★★★★</div>
          <p class="lp-tc-quote">« Mon streak c'est devenu un rituel. Chaque soir, 2 questions pour ne pas le perdre. J'ai eu 18 à l'examen — je suis convaincu que PermiGo m'y a aidé. »</p>
          <div class="lp-tc-author">
            <div class="lp-tc-av lp-tc-av-p">LT</div>
            <div>
              <div class="lp-tc-name">Lucas T.</div>
              <div class="lp-tc-role">Élève · Paris</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Comment ça marche ── -->
    <section class="lp-sec lp-how" id="lp-how">
      <h2 class="lp-h2">Comment ça marche</h2>
      <div class="lp-steps">
        <div class="lp-step"><div class="lp-step-n">1</div><h3>Tu crées ton école</h3><p>Tu ajoutes tes moniteurs en quelques clics.</p></div>
        <div class="lp-step"><div class="lp-step-n">2</div><h3>Tes moniteurs invitent leurs élèves</h3><p>Un lien à partager, l'élève installe l'app sur son téléphone.</p></div>
        <div class="lp-step"><div class="lp-step-n">3</div><h3>Tout le monde progresse</h3><p>Les élèves s'entraînent, les moniteurs valident, toi tu pilotes.</p></div>
      </div>
    </section>

    <!-- ── Pricing ── -->
    <section class="lp-sec lp-pricing" id="lp-pricing">
      <h2 class="lp-h2">Un tarif simple, par auto-école</h2>
      <p class="lp-sub">Sans engagement. Annulable à tout moment.</p>
      <div class="lp-plans">
        <div class="lp-plan">
          <div class="lp-plan-name">Solo</div>
          <div class="lp-plan-price">19<span>€ / mois</span></div>
          <div class="lp-plan-for">Pour démarrer, 1 moniteur</div>
          <ul class="lp-plan-list">
            <li>Livret REMC numérique</li>
            <li>Parcours élève gamifié</li>
            <li>Validation des compétences</li>
          </ul>
          <button class="lp-btn lp-btn-soft lp-plan-cta" data-scroll="lp-lead" type="button">Être recontacté</button>
        </div>
        <div class="lp-plan lp-plan-feat">
          <div class="lp-plan-tag">Le plus choisi</div>
          <div class="lp-plan-name">Équipe</div>
          <div class="lp-plan-price">69<span>€ / mois</span></div>
          <div class="lp-plan-for">Pour une école active</div>
          <ul class="lp-plan-list">
            <li>Tout Solo, jusqu'à 5 moniteurs</li>
            <li>Classement local des moniteurs</li>
            <li>Examen blanc + quiz de révision</li>
            <li>Tableau de bord gérant</li>
          </ul>
          <button class="lp-btn lp-btn-primary lp-plan-cta" data-scroll="lp-lead" type="button">Être recontacté</button>
        </div>
        <div class="lp-plan">
          <div class="lp-plan-name">Réseau</div>
          <div class="lp-plan-price">129<span>€ / mois</span></div>
          <div class="lp-plan-for">Pour les grosses structures</div>
          <ul class="lp-plan-list">
            <li>Tout Équipe, moniteurs illimités</li>
            <li>Classement national</li>
            <li>Support prioritaire</li>
          </ul>
          <button class="lp-btn lp-btn-soft lp-plan-cta" data-scroll="lp-lead" type="button">Être recontacté</button>
        </div>
      </div>
    </section>

    <!-- ── FAQ ── -->
    <section class="lp-sec lp-faq">
      <h2 class="lp-h2">Questions fréquentes</h2>
      <div class="lp-faq-list">
        <details class="lp-faq-item"><summary>Mes élèves doivent-ils télécharger quelque chose ?</summary><p>Non. PermiGo s'ouvre dans le navigateur et s'ajoute à l'écran d'accueil du téléphone comme une app, sans passer par un store.</p></details>
        <details class="lp-faq-item"><summary>Est-ce conforme au programme officiel ?</summary><p>Oui. Le parcours suit le référentiel REMC et ses 31 compétences (arrêté du 13/05/2013).</p></details>
        <details class="lp-faq-item"><summary>Combien de temps pour mettre en place ?</summary><p>Quelques minutes : tu crées ton école, tu ajoutes tes moniteurs, ils invitent leurs élèves.</p></details>
        <details class="lp-faq-item"><summary>Y a-t-il un engagement ?</summary><p>Non, l'abonnement est sans engagement et annulable à tout moment.</p></details>
      </div>
    </section>

    <!-- ── Formulaire lead ── -->
    <section class="lp-sec lp-leadsec" id="lp-lead">
      <div class="lp-lead-card">
        <h2 class="lp-h2">Parlons de ton auto-école</h2>
        <p class="lp-sub">Laisse-nous tes coordonnées, on te recontacte rapidement pour te montrer PermiGo.</p>
        <form class="lp-form" id="lp-form" novalidate>
          <div class="lp-field">
            <label for="lp-ecole">Nom de l'auto-école *</label>
            <input id="lp-ecole" name="ecole_nom" type="text" required autocomplete="organization" />
          </div>
          <div class="lp-field">
            <label for="lp-email">Email *</label>
            <input id="lp-email" name="email" type="email" required autocomplete="email" inputmode="email" />
          </div>
          <div class="lp-row2">
            <div class="lp-field"><label for="lp-ville">Ville</label><input id="lp-ville" name="ville" type="text" autocomplete="address-level2" /></div>
            <div class="lp-field"><label for="lp-tel">Téléphone</label><input id="lp-tel" name="telephone" type="tel" autocomplete="tel" inputmode="tel" /></div>
          </div>
          <div class="lp-field">
            <label for="lp-nb">Nombre de moniteurs</label>
            <input id="lp-nb" name="nb_enseignants" type="number" min="1" max="999" inputmode="numeric" />
          </div>
          <div class="lp-field">
            <label for="lp-msg">Un message (optionnel)</label>
            <textarea id="lp-msg" name="message" rows="3"></textarea>
          </div>
          <button class="lp-btn lp-btn-primary lp-form-submit" type="submit" id="lp-submit">Être recontacté</button>
          <p class="lp-form-err" id="lp-form-err" hidden></p>
        </form>
        <div class="lp-form-ok" id="lp-form-ok" hidden>
          <div class="lp-ok-ic">✓</div>
          <h3>Bien reçu !</h3>
          <p>On revient vers toi très vite. Merci de ton intérêt pour PermiGo.</p>
        </div>
      </div>
    </section>

    <!-- ── Footer ── -->
    <footer class="lp-foot">
      <div class="lp-foot-brand"><img src="${BADGE}" alt="" /> Permi<span class="g">Go</span></div>
      <div class="lp-foot-links">
        <a href="#/legal" id="lp-legal">Mentions légales</a>
        <button class="lp-foot-login" id="lp-login2" type="button">Se connecter</button>
      </div>
      <div class="lp-foot-copy">© ${new Date().getFullYear()} PermiGo</div>
    </footer>
  </div>`;

  // ── Navigation interne (scroll doux) ──
  root.querySelectorAll("[data-scroll]").forEach((el) => {
    el.addEventListener("click", () => {
      const t = root.querySelector("#" + el.dataset.scroll);
      t?.scrollIntoView({ behavior: "smooth", block: "start" });
      track("landing.cta_click", { target: el.dataset.scroll });
    });
  });
  root.querySelectorAll('a[href^="#lp-"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      root
        .querySelector(a.getAttribute("href"))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // ── Se connecter ──
  const goLogin = () => {
    location.hash = "#/login";
    location.reload();
  };
  root.querySelector("#lp-login")?.addEventListener("click", goLogin);
  root.querySelector("#lp-login2")?.addEventListener("click", goLogin);
  root.querySelector("#lp-legal")?.addEventListener("click", (e) => {
    e.preventDefault();
    location.hash = "#/legal";
    location.reload();
  });

  // ── Formulaire → leads ──
  const form = root.querySelector("#lp-form");
  const errEl = root.querySelector("#lp-form-err");
  const okEl = root.querySelector("#lp-form-ok");
  const submitBtn = root.querySelector("#lp-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.hidden = true;

    const ecole_nom = form.ecole_nom.value.trim();
    const email = form.email.value.trim();
    const ville = form.ville.value.trim() || null;
    const telephone = form.telephone.value.trim() || null;
    const message = form.message.value.trim() || null;
    const nbRaw = form.nb_enseignants.value.trim();
    const nb_enseignants = nbRaw
      ? Math.max(1, Math.min(999, parseInt(nbRaw, 10) || 0)) || null
      : null;

    if (!ecole_nom || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent =
        "Renseigne au moins le nom de l'auto-école et un email valide.";
      errEl.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi…";
    try {
      const { error } = await sb.from("leads").insert({
        ecole_nom,
        email,
        ville,
        telephone,
        message,
        nb_enseignants,
        source: "landing",
      });
      if (error) throw error;
      track("landing.lead_submitted", {
        has_phone: !!telephone,
        nb_enseignants,
      });
      form.hidden = true;
      okEl.hidden = false;
      okEl.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      console.error("[landing] lead insert failed", err);
      errEl.textContent =
        "Une erreur est survenue. Réessaie, ou écris-nous directement.";
      errEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Être recontacté";
    }
  });
}

const STYLE = `<style>
  .lp {
    --lp-indigo: #6366f1; --lp-indigo-dk: #4f46e5;
    --lp-green: #58cc02; --lp-green-dk: #46a302;
    --lp-ink: #0b1020; --lp-mut: #5b6072; --lp-line: rgba(11,16,32,.09);
    font-family: 'Inter', sans-serif; color: var(--lp-ink);
    background: #fff; min-height: 100dvh; overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }
  .lp a { color: inherit; text-decoration: none; }
  .lp .g { color: var(--lp-green); }

  /* Boutons */
  .lp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    border: 0; border-radius: 13px; font: 700 15px/1 'Inter', sans-serif; cursor: pointer;
    padding: 14px 22px; transition: transform .1s, box-shadow .15s, background .15s; }
  .lp-btn:active { transform: translateY(1px); }
  .lp-btn-primary { background: linear-gradient(135deg, var(--lp-green), var(--lp-green-dk)); color: #fff;
    box-shadow: 0 10px 24px -8px rgba(88,204,2,.6); }
  .lp-btn-soft { background: rgba(99,102,241,.1); color: var(--lp-indigo-dk); }
  .lp-btn-ghost { background: transparent; color: var(--lp-ink); padding: 10px 16px; }

  /* Nav */
  .lp-nav { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between;
    padding: 14px max(20px, env(safe-area-inset-left)); background: rgba(255,255,255,.82);
    backdrop-filter: saturate(160%) blur(12px); border-bottom: 1px solid var(--lp-line); }
  .lp-brand { display: flex; align-items: center; gap: 9px; font: 800 19px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: -.02em; color: var(--lp-ink); }
  .lp-brand-badge { width: 28px; height: 28px; object-fit: contain; }
  .lp-nav-actions { display: flex; align-items: center; gap: 6px; }
  .lp-nav-link { font: 600 14px/1 'Inter'; color: var(--lp-mut); padding: 10px 12px; }

  /* ─── HERO dark immersif ─── */
  .lp-hero {
    position: relative; overflow: hidden;
    background: #060c1a;
    padding: 0 0 80px;
    color: #fff; /* base blanche — tout le texte non-explicite hérite blanc */
  }

  /* Blobs animés */
  .lp-hero-bg { position: absolute; inset: 0; pointer-events: none; }
  .lp-blob { position: absolute; border-radius: 50%; filter: blur(90px); will-change: transform; }
  .lp-blob-1 { width: 700px; height: 560px; background: radial-gradient(circle, rgba(88,204,2,.42), transparent 68%);
    top: -200px; right: -160px; opacity: .7;
    animation: blobA 16s ease-in-out infinite alternate; }
  .lp-blob-2 { width: 560px; height: 480px; background: radial-gradient(circle, rgba(99,102,241,.38), transparent 68%);
    bottom: -160px; left: -120px; opacity: .6;
    animation: blobA 20s ease-in-out infinite alternate-reverse; }
  .lp-blob-3 { width: 380px; height: 320px; background: radial-gradient(circle, rgba(56,189,248,.28), transparent 68%);
    top: 40%; left: 45%; opacity: .35;
    animation: blobA 24s ease-in-out infinite alternate; }
  @keyframes blobA {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(28px,18px) scale(1.07); }
  }
  @media (prefers-reduced-motion: reduce) { .lp-blob { animation: none; } }

  /* Layout intérieur */
  .lp-hero-inner {
    position: relative; z-index: 1;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 56px; align-items: center;
    max-width: 1080px; margin: 0 auto;
    padding: 80px 32px 0;
  }

  /* Badge annonce */
  .lp-hero-badge {
    display: inline-flex; align-items: center; gap: 9px;
    background: rgba(88,204,2,.1); border: 1px solid rgba(88,204,2,.28);
    border-radius: 999px; padding: 8px 16px;
    font: 600 12.5px/1 'Inter', sans-serif; color: rgba(88,204,2,.95);
    margin-bottom: 24px; letter-spacing: .01em;
  }
  .lp-badge-pulse {
    width: 7px; height: 7px; border-radius: 50%; background: #58cc02; flex-shrink: 0;
    box-shadow: 0 0 0 0 rgba(88,204,2,.7);
    animation: pulse 2.2s ease-out infinite;
  }
  @keyframes pulse {
    0%  { box-shadow: 0 0 0 0 rgba(88,204,2,.7); }
    70% { box-shadow: 0 0 0 9px rgba(88,204,2,0); }
    100%{ box-shadow: 0 0 0 0 rgba(88,204,2,0); }
  }

  /* Headline */
  .lp-h1 {
    font: 900 60px/1.05 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.038em; color: #fff;
    margin: 0 0 22px;
  }
  .lp-h1-em {
    font-style: normal; display: inline;
    background: linear-gradient(90deg, #58cc02 0%, #a3e635 45%, #38bdf8 100%);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }

  /* Lead */
  .lp-lead { font: 400 17px/1.7 'Inter', sans-serif; color: rgba(255,255,255,.58); margin: 0 0 30px; max-width: 44ch; }

  /* CTA */
  .lp-hero-cta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 22px; }
  .lp-btn-ghost-hero {
    display: inline-flex; align-items: center;
    padding: 14px 20px;
    font: 700 15px/1 'Inter', sans-serif; color: rgba(255,255,255,.75);
    background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.16);
    border-radius: 13px; cursor: pointer; text-decoration: none;
    transition: background .15s, border-color .15s;
  }
  .lp-btn-ghost-hero:hover { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.28); }

  /* Trust chips */
  .lp-hero-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .lp-chip {
    font: 500 12px/1 'Inter', sans-serif; color: rgba(255,255,255,.4);
    padding: 6px 11px; border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px; background: rgba(255,255,255,.03);
  }

  /* ── Phone mockup ── */
  .lp-hero-visual { display: flex; justify-content: center; align-items: center; position: relative; }
  .lp-phone {
    width: 230px; aspect-ratio: 390/844;
    background: #0f172a;
    border: 1.5px solid rgba(255,255,255,.11); border-radius: 44px; padding: 14px;
    position: relative;
    box-shadow: 0 0 0 1px rgba(0,0,0,.4), 0 48px 96px -28px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.07);
    animation: phoneFloat 5.5s ease-in-out infinite;
  }
  @keyframes phoneFloat {
    0%,100% { transform: translateY(0) rotate(-.5deg); }
    50%      { transform: translateY(-12px) rotate(.5deg); }
  }
  .lp-phone-notch {
    position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
    width: 72px; height: 24px;
    background: #0f172a; border-radius: 0 0 18px 18px; z-index: 2;
    border: 1.5px solid rgba(255,255,255,.06); border-top: none;
  }
  .lp-phone-screen {
    height: 100%; border-radius: 32px; overflow: hidden;
    background: radial-gradient(ellipse 80% 40% at 50% 0%, rgba(88,204,2,.18), transparent 55%),
      linear-gradient(180deg, #111827, #0b1120);
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 9px; padding: 38px 14px 20px; text-align: center;
  }
  .lp-phone-badge { width: 64px; height: 64px; object-fit: contain; filter: drop-shadow(0 8px 18px rgba(88,204,2,.45)); }
  .lp-phone-lvl { font: 600 9px/1 'Inter', sans-serif; letter-spacing: .06em; text-transform: uppercase; color: rgba(88,204,2,.7); }
  .lp-phone-streak { font: 700 13px/1 'Plus Jakarta Sans', sans-serif; color: #fff; }
  .lp-phone-streak strong { color: #f59e0b; font-size: 16px; }
  .lp-phone-bar { width: 74%; height: 7px; background: rgba(255,255,255,.1); border-radius: 9px; overflow: hidden; }
  .lp-phone-fill {
    height: 100%; width: 72%; border-radius: 9px;
    background: linear-gradient(90deg, #58cc02, #a3e635);
    animation: fillIn 2.8s cubic-bezier(.2,.7,.3,1) both .6s;
  }
  @keyframes fillIn { from { width: 0; } }
  @media (prefers-reduced-motion: reduce) { .lp-phone-fill { animation: none; width: 72%; } .lp-phone { animation: none; } }
  .lp-phone-stats {
    display: flex; gap: 8px; width: 100%;
    padding: 9px 10px; box-sizing: border-box;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 12px;
  }
  .lp-pstat { flex: 1; text-align: center; }
  .lp-pstat-mid { border-left: 1px solid rgba(255,255,255,.08); border-right: 1px solid rgba(255,255,255,.08); }
  .lp-pstat-val { font: 700 14px/1 'Plus Jakarta Sans', sans-serif; color: #fff; }
  .lp-pstat-lbl { font: 500 8.5px/1.3 'Inter', sans-serif; color: rgba(255,255,255,.38); margin-top: 3px; }

  /* Floating cards */
  .lp-fcard {
    position: absolute; display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 14px; white-space: nowrap;
    background: rgba(255,255,255,.07); backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255,255,255,.15);
    box-shadow: 0 8px 28px rgba(0,0,0,.35);
  }
  .lp-fcard-ico { font-size: 19px; }
  .lp-fcard-val { font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif; color: #fff; }
  .lp-fcard-sub { font: 500 10px/1 'Inter', sans-serif; color: rgba(255,255,255,.46); margin-top: 2px; }
  .lp-fcard-1 { top: 14%; right: -20px; animation: fc1 5.5s ease-in-out infinite; }
  .lp-fcard-2 { bottom: 16%; left: -20px; animation: fc2 5.5s ease-in-out 1.4s infinite; }
  @keyframes fc1 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes fc2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
  @media (prefers-reduced-motion: reduce) { .lp-fcard-1, .lp-fcard-2 { animation: none; } }

  /* Sections */
  .lp-sec { max-width: 1000px; margin: 0 auto; padding: 56px 22px; color: var(--lp-ink); }
  .lp-h2 { font: 800 32px/1.15 'Plus Jakarta Sans', sans-serif; letter-spacing: -.025em; text-align: center; margin: 0 0 10px; color: var(--lp-ink); }
  .lp-sub { text-align: center; color: var(--lp-mut); font: 400 16px/1.5 'Inter'; margin: 0 0 32px; }

  /* Problème (3 cartes) */
  .lp-cards3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 28px; }
  .lp-card { background: #f7f8fb; border: 1px solid var(--lp-line); border-radius: 18px; padding: 22px; color: var(--lp-ink); }
  .lp-card-ic { font-size: 30px; margin-bottom: 10px; }
  .lp-card h3 { font: 700 17px/1.2 'Plus Jakarta Sans'; margin: 0 0 6px; color: var(--lp-ink); }
  .lp-card p { font: 400 14.5px/1.5 'Inter'; color: var(--lp-mut); margin: 0; }

  /* Features */
  .lp-feat { display: flex; flex-direction: column; gap: 14px; margin-top: 28px; }
  .lp-feat-row { display: flex; gap: 18px; align-items: flex-start; background: #fff; border: 1px solid var(--lp-line);
    border-radius: 18px; padding: 22px; color: var(--lp-ink); }
  .lp-feat-ic { font-size: 30px; flex: 0 0 auto; width: 56px; height: 56px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center; background: rgba(99,102,241,.08); }
  .lp-feat-row h3 { font: 700 19px/1.2 'Plus Jakarta Sans'; margin: 4px 0 6px; color: var(--lp-ink); }
  .lp-feat-row p { font: 400 15px/1.55 'Inter'; color: var(--lp-mut); margin: 0; }

  /* Comment ça marche */
  .lp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 28px; }
  .lp-step { text-align: center; padding: 14px; }
  .lp-step-n { width: 44px; height: 44px; margin: 0 auto 14px; border-radius: 50%;
    background: linear-gradient(135deg, var(--lp-indigo), var(--lp-indigo-dk)); color: #fff;
    font: 800 20px/44px 'Plus Jakarta Sans'; }
  .lp-step h3 { font: 700 17px/1.2 'Plus Jakarta Sans'; margin: 0 0 6px; color: var(--lp-ink); }
  .lp-step p { font: 400 14.5px/1.5 'Inter'; color: var(--lp-mut); margin: 0; }

  /* Pricing */
  .lp-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-items: stretch; }
  .lp-plan { position: relative; background: #fff; border: 1px solid var(--lp-line); border-radius: 20px;
    padding: 26px 22px; display: flex; flex-direction: column; color: var(--lp-ink); }
  .lp-plan-feat { border: 2px solid var(--lp-green); box-shadow: 0 18px 44px -20px rgba(88,204,2,.5); }
  .lp-plan-tag { position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
    background: var(--lp-green); color: #fff; font: 800 11px/1 'Inter'; letter-spacing: .04em; text-transform: uppercase;
    padding: 6px 12px; border-radius: 999px; }
  .lp-plan-name { font: 700 16px/1 'Plus Jakarta Sans'; color: var(--lp-indigo-dk); }
  .lp-plan-price { font: 800 40px/1 'Plus Jakarta Sans'; letter-spacing: -.03em; margin: 10px 0 4px; }
  .lp-plan-price span { font: 600 14px/1 'Inter'; color: var(--lp-mut); margin-left: 4px; }
  .lp-plan-for { font: 500 13.5px/1.3 'Inter'; color: var(--lp-mut); margin-bottom: 16px; }
  .lp-plan-list { list-style: none; padding: 0; margin: 0 0 20px; display: flex; flex-direction: column; gap: 9px; flex: 1; }
  .lp-plan-list li { position: relative; padding-left: 24px; font: 400 14.5px/1.4 'Inter'; }
  .lp-plan-list li::before { content: '✓'; position: absolute; left: 0; color: var(--lp-green); font-weight: 800; }
  .lp-plan-cta { width: 100%; }

  /* FAQ */
  .lp-faq-list { max-width: 720px; margin: 28px auto 0; display: flex; flex-direction: column; gap: 10px; }
  .lp-faq-item { background: #f7f8fb; border: 1px solid var(--lp-line); border-radius: 14px; padding: 4px 18px; }
  .lp-faq-item summary { font: 700 15.5px/1.4 'Inter'; padding: 14px 0; cursor: pointer; list-style: none; color: var(--lp-ink); }
  .lp-faq-item summary::-webkit-details-marker { display: none; }
  .lp-faq-item summary::after { content: '+'; float: right; color: var(--lp-mut); font-weight: 700; }
  .lp-faq-item[open] summary::after { content: '–'; }
  .lp-faq-item p { font: 400 14.5px/1.55 'Inter'; color: var(--lp-mut); margin: 0 0 14px; }

  /* Formulaire lead */
  .lp-leadsec { padding-top: 24px; }
  .lp-lead-card { max-width: 560px; margin: 0 auto; background: linear-gradient(180deg, #f7f8fb, #fff);
    border: 1px solid var(--lp-line); border-radius: 24px; padding: 34px 26px; box-shadow: 0 20px 50px -28px rgba(20,24,60,.25); }
  .lp-form { display: flex; flex-direction: column; gap: 14px; margin-top: 6px; }
  .lp-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .lp-field { display: flex; flex-direction: column; gap: 6px; }
  .lp-field label { font: 600 13px/1 'Inter'; color: var(--lp-ink); }
  .lp-field input, .lp-field textarea { font: 400 15px/1.4 'Inter'; color: var(--lp-ink);
    border: 1.5px solid var(--lp-line); border-radius: 12px; padding: 13px 14px; background: #fff; width: 100%; box-sizing: border-box; }
  .lp-field input:focus, .lp-field textarea:focus { outline: none; border-color: var(--lp-indigo); box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
  .lp-form-submit { width: 100%; margin-top: 4px; }
  .lp-form-err { color: #dc2626; font: 600 13.5px/1.4 'Inter'; margin: 4px 0 0; }
  .lp-form-ok { text-align: center; padding: 18px 6px; }
  .lp-ok-ic { width: 56px; height: 56px; margin: 0 auto 14px; border-radius: 50%; background: var(--lp-green); color: #fff;
    font: 800 28px/56px 'Inter'; }
  .lp-form-ok h3 { font: 800 22px/1.2 'Plus Jakarta Sans'; margin: 0 0 8px; }
  .lp-form-ok p { font: 400 15px/1.5 'Inter'; color: var(--lp-mut); margin: 0; }

  /* Footer */
  .lp-foot { border-top: 1px solid var(--lp-line); padding: 28px 22px calc(env(safe-area-inset-bottom,0px) + 28px);
    display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .lp-foot-brand { display: flex; align-items: center; gap: 8px; font: 800 16px/1 'Plus Jakarta Sans'; }
  .lp-foot-brand img { width: 22px; height: 22px; }
  .lp-foot-links { display: flex; align-items: center; gap: 18px; }
  .lp-foot-links a, .lp-foot-login { font: 600 14px/1 'Inter'; color: var(--lp-mut); background: none; border: 0; cursor: pointer; }
  .lp-foot-copy { font: 400 12.5px/1 'Inter'; color: var(--lp-mut); }

  /* Témoignages */
  .lp-testi { background: #f7f8fb; border-radius: 0; margin-left: 0; margin-right: 0;
    max-width: none; padding-left: 22px; padding-right: 22px; }
  .lp-testi .lp-h2, .lp-testi .lp-sub { max-width: 1000px; margin-left: auto; margin-right: auto; }
  .lp-testicards { max-width: 1000px; margin: 28px auto 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .lp-tc { background: #fff; border: 1px solid var(--lp-line); border-radius: 20px; padding: 24px;
    display: flex; flex-direction: column; gap: 14px; box-shadow: 0 2px 12px -6px rgba(11,16,32,.07); }
  .lp-tc-stars { color: #f59e0b; font-size: 15px; letter-spacing: 1px; }
  .lp-tc-quote { font: 400 15px/1.6 'Inter'; color: var(--lp-ink); margin: 0; flex: 1; }
  .lp-tc-author { display: flex; align-items: center; gap: 12px; margin-top: auto; }
  .lp-tc-av { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font: 700 14px/1 'Plus Jakarta Sans'; color: #fff; }
  .lp-tc-av-g { background: linear-gradient(135deg, #10b981, #059669); }
  .lp-tc-av-b { background: linear-gradient(135deg, #6366f1, #4f46e5); }
  .lp-tc-av-p { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .lp-tc-name { font: 700 14px/1.2 'Plus Jakarta Sans'; color: var(--lp-ink); }
  .lp-tc-role { font: 400 12px/1.3 'Inter'; color: var(--lp-mut); margin-top: 2px; }

  /* Responsive */
  @media (max-width: 860px) {
    .lp-hero-inner { grid-template-columns: 1fr; text-align: center; padding: 56px 22px 0; gap: 40px; }
    .lp-h1 { font-size: 38px; max-width: none; margin-inline: auto; }
    .lp-lead { margin-inline: auto; }
    .lp-hero-badge { margin-left: auto; margin-right: auto; }
    .lp-hero-cta { justify-content: center; }
    .lp-hero-chips { justify-content: center; }
    .lp-hero-visual { margin-top: 10px; }
    .lp-fcard-1 { right: -8px; top: 8%; }
    .lp-fcard-2 { left: -8px; bottom: 8%; }
    .lp-cards3, .lp-steps, .lp-plans, .lp-testicards { grid-template-columns: 1fr; }
    .lp-feat-row { flex-direction: column; }
    .lp-plan-feat { order: -1; }
  }
  @media (max-width: 460px) {
    .lp-row2 { grid-template-columns: 1fr; }
    .lp-h2 { font-size: 26px; }
  }
</style>`;
