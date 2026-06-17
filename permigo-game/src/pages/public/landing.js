// ═══════════════════════════════════════════════════════════════
// Landing / page de vente — visiteur non connecté
// Cible : MONITEUR INDÉPENDANT (école = porte discrète via le formulaire).
// Positionnement : "ton app à ton nom" + engagement élève + preuve/autorité.
// CTA principal : "Créer mon compte" → #/signup (self-serve 9,99€/mois).
// CTA secondaire : formulaire "qu'on te montre" → table public.leads (insert anon).
// Montée par main.js quand !me et hash racine.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { icon } from "@/utils/icons.js";

const BADGE = "/skins/avatars/permigo-badge-icon.png";

export function mount(root) {
  track("landing.view", {});

  root.innerHTML = `${STYLE}
  <div class="lp">

    <!-- ── Barre haute ── -->
    <header class="lp-nav">
      <a class="lp-brand" href="#/" aria-label="PermiGo">
        <img src="${BADGE}" alt="" class="lp-brand-badge" width="34" height="34" />
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
            Pour moniteurs indépendants · Bêta
          </div>
          <h1 class="lp-h1">
            Passer le permis en jouant n'a jamais été aussi simple.
          </h1>
          <p class="lp-lead">Tes élèves révisent entre les leçons, progressent plus vite, et tu prouves tes résultats. Ton outil, ta marque — sans dépendre d'une plateforme.</p>
          <div class="lp-hero-cta">
            <button class="lp-btn lp-btn-primary" data-go="signup" type="button">
              Créer mon compte · 9,99€/mois
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <a class="lp-btn lp-btn-ghost-hero" href="#lp-how">Comment ça marche</a>
          </div>
          <div class="lp-hero-chips">
            <span class="lp-chip">✓ À ta marque</span>
            <span class="lp-chip">✓ Sans installation</span>
            <span class="lp-chip">✓ Sans engagement</span>
          </div>
        </div>

        <!-- Visuel droit -->
        <div class="lp-hero-visual" aria-hidden="true">
          <img class="lp-mascot" src="/skins/mascot-hello.png" alt="" loading="lazy" decoding="async" width="120" height="120" />
          <div class="lp-phone">
            <div class="lp-phone-notch"></div>
            <div class="lp-phone-screen">
              <img src="${BADGE}" alt="" class="lp-phone-badge" width="54" height="54" />
              <div class="lp-phone-lvl">Niveau 4 · Maîtrise du véhicule</div>
              <div class="lp-phone-streak">${icon("flame", { size: 14 })} <strong>12</strong> jours de suite</div>
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
            <span class="lp-fcard-ico" style="color:#f59e0b">${icon("trophy", { size: 19 })}</span>
            <div><div class="lp-fcard-val">+89 XP</div><div class="lp-fcard-sub">Compétence acquise</div></div>
          </div>
          <div class="lp-fcard lp-fcard-2">
            <span class="lp-fcard-ico" style="color:#fb923c">${icon("flame", { size: 19 })}</span>
            <div><div class="lp-fcard-val">Streak actif</div><div class="lp-fcard-sub">12 jours d'affilée</div></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Showcase produit (élève / moniteur) ── -->
    <section class="lp-sec lp-show lp-rev" id="lp-show">
      <h2 class="lp-h2">Vois PermiGo en vrai</h2>
      <p class="lp-sub">Une app que tes élèves adorent, un outil qui te fait gagner du temps. Les deux faces de PermiGo.</p>

      <div class="lp-show-tabs" role="tablist">
        <button class="lp-show-tab is-active" data-tab="eleve" role="tab" aria-selected="true" type="button">Côté élève</button>
        <button class="lp-show-tab" data-tab="moniteur" role="tab" aria-selected="false" type="button">Côté moniteur</button>
      </div>

      <div class="lp-show-panel" data-panel="eleve">
        <div class="lp-show-strip">
          <figure class="lp-show-card">
            <div class="lp-show-phonewrap"><div class="lp-show-phone"><img src="/showcase/eleve-accueil.png" alt="Accueil élève : carte de permis, quêtes du jour, streak" loading="lazy" width="390" height="844" /></div><img class="lp-show-mascot" src="/skins/mascot-hello.png" alt="" aria-hidden="true" loading="lazy" width="58" height="58" /></div>
            <figcaption>
              <div class="lp-show-caphead"><span class="lp-show-step">1</span><strong>Son permis devient un jeu</strong></div>
              <span class="lp-show-desc">Carte de permis, quêtes du jour, streak quotidien : il revient s'entraîner tout seul.</span>
            </figcaption>
          </figure>
          <figure class="lp-show-card">
            <div class="lp-show-phonewrap"><div class="lp-show-phone"><img src="/showcase/eleve-parcours.png" alt="Parcours REMC gamifié, étape par étape" loading="lazy" width="390" height="844" /></div><img class="lp-show-mascot" src="/skins/mascot-hello.png" alt="" aria-hidden="true" loading="lazy" width="58" height="58" /></div>
            <figcaption>
              <div class="lp-show-caphead"><span class="lp-show-step">2</span><strong>Un parcours étape par étape</strong></div>
              <span class="lp-show-desc">Les 31 compétences du REMC en carte d'aventure. Il voit exactement où il en est.</span>
            </figcaption>
          </figure>
          <figure class="lp-show-card">
            <div class="lp-show-phonewrap"><div class="lp-show-phone"><img src="/showcase/eleve-examens.png" alt="Examens blancs chronométrés et entraînement par thème" loading="lazy" width="390" height="844" /></div><img class="lp-show-mascot" src="/skins/mascot-hello.png" alt="" aria-hidden="true" loading="lazy" width="58" height="58" /></div>
            <figcaption>
              <div class="lp-show-caphead"><span class="lp-show-step">3</span><strong>Il s'entraîne comme le jour J</strong></div>
              <span class="lp-show-desc">Examens blancs chronométrés et quiz par thème. Il arrive prêt à l'examen.</span>
            </figcaption>
          </figure>
        </div>
      </div>

      <div class="lp-show-panel" data-panel="moniteur" hidden>
        <div class="lp-show-strip">
          <figure class="lp-show-card">
            <div class="lp-show-phonewrap"><div class="lp-show-phone"><img src="/showcase/ens-valider.png" alt="Vue moniteur : valider une compétence, liste d'élèves" loading="lazy" width="390" height="844" /></div><img class="lp-show-mascot" src="/skins/mascot-hello.png" alt="" aria-hidden="true" loading="lazy" width="58" height="58" /></div>
            <figcaption>
              <div class="lp-show-caphead"><span class="lp-show-step">1</span><strong>Tu valides en 2 taps</strong></div>
              <span class="lp-show-desc">Tu ouvres l'élève, tu coches ce qu'il a réussi. Son livret se met à jour tout seul.</span>
            </figcaption>
          </figure>
          <figure class="lp-show-card">
            <div class="lp-show-phonewrap"><div class="lp-show-phone"><img src="/showcase/ens-livret.png" alt="Livret REMC numérique d'un élève, compétences acquises" loading="lazy" width="390" height="844" /></div><img class="lp-show-mascot" src="/skins/mascot-hello.png" alt="" aria-hidden="true" loading="lazy" width="58" height="58" /></div>
            <figcaption>
              <div class="lp-show-caphead"><span class="lp-show-step">2</span><strong>Le livret REMC, numérique</strong></div>
              <span class="lp-show-desc">Chaque compétence à jour en temps réel. Fini le papier perdu dans la voiture.</span>
            </figcaption>
          </figure>
          <figure class="lp-show-card">
            <div class="lp-show-phonewrap"><div class="lp-show-phone"><img src="/showcase/ens-classement.png" alt="Élèves classés par compétences acquises" loading="lazy" width="390" height="844" /></div><img class="lp-show-mascot" src="/skins/mascot-hello.png" alt="" aria-hidden="true" loading="lazy" width="58" height="58" /></div>
            <figcaption>
              <div class="lp-show-caphead"><span class="lp-show-step">3</span><strong>Tu vois qui est prêt</strong></div>
              <span class="lp-show-desc">Tes élèves classés par progression. Tu sais d'un coup d'œil qui présenter.</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- ── Problème ── -->
    <section class="lp-sec lp-problem lp-rev">
      <h2 class="lp-h2">Le permis se joue entre les leçons — et c'est là que tu perds tes élèves</h2>
      <div class="lp-cards3">
        <div class="lp-card"><div class="lp-card-ic">${icon("activity", { size: 26 })}</div><h3>Tes élèves décrochent</h3><p>Entre deux leçons, rien ne les fait réviser. Tu repars un peu à zéro à chaque séance.</p></div>
        <div class="lp-card"><div class="lp-card-ic">${icon("clipboard", { size: 26 })}</div><h3>Ton travail reste invisible</h3><p>Livret papier, aucune preuve de tes résultats : ta vraie valeur ne se voit nulle part.</p></div>
        <div class="lp-card"><div class="lp-card-ic">${icon("users", { size: 26 })}</div><h3>Tu dépends des plateformes</h3><p>Quand tu passes par elles, c'est leur marque, leurs élèves, leur commission. Pas la tienne.</p></div>
      </div>
    </section>

    <!-- ── Features ── -->
    <section class="lp-sec lp-features lp-rev">
      <h2 class="lp-h2">Ce que PermiGo te donne</h2>
      <div class="lp-feat">
        <div class="lp-feat-row">
          <div class="lp-feat-ic">${icon("award", { size: 28, strokeWidth: 1.5 })}</div>
          <div><h3>À ton nom, pas à celui d'une plateforme</h3><p>Ton app, ta marque, ta relation élève. Tu existes en ton nom propre — pas comme sous-traitant d'Ornikar ou d'une grosse structure.</p></div>
        </div>
        <div class="lp-feat-row">
          <div class="lp-feat-ic">${icon("map", { size: 28, strokeWidth: 1.5 })}</div>
          <div><h3>Tes élèves reviennent tout seuls</h3><p>Le programme officiel REMC transformé en parcours : quiz éclair, examens blancs, streaks quotidiens. Ils s'entraînent entre les leçons → progressent → abandonnent moins.</p></div>
        </div>
        <div class="lp-feat-row">
          <div class="lp-feat-ic">${icon("trophy", { size: 28, strokeWidth: 1.5 })}</div>
          <div><h3>La preuve qui remplit ton agenda</h3><p>Tu vois d'un coup d'œil qui est prêt à présenter. Tes résultats parlent pour toi : réputation → bouche-à-oreille → planning plein.</p></div>
        </div>
        <div class="lp-feat-row">
          <div class="lp-feat-ic">${icon("check-circle", { size: 28, strokeWidth: 1.5 })}</div>
          <div><h3>Validation en 2 taps</h3><p>Tu valides les compétences en séance. Le livret REMC numérique se met à jour tout seul — fini le papier perdu dans la voiture.</p></div>
        </div>
      </div>
    </section>

    <!-- ── Témoignages ── -->
    <section class="lp-sec lp-testi lp-rev">
      <h2 class="lp-h2">Ce que PermiGo change au quotidien</h2>
      <p class="lp-sub">Scénarios illustratifs<span class="lp-testi-note"> — exemples fictifs représentatifs des usages visés, la bêta est en cours</span>.</p>
      <div class="lp-testicards">
        <div class="lp-tc">
          <div class="lp-tc-stars">★★★★★</div>
          <p class="lp-tc-quote">« Mes élèves révisent enfin entre les leçons. Je perds moins de temps à re-expliquer, et l'app porte mon nom — pas celui d'une plateforme. »</p>
          <div class="lp-tc-author">
            <div class="lp-tc-av lp-tc-av-g">KB</div>
            <div>
              <div class="lp-tc-name">Karim, moniteur indépendant</div>
              <div class="lp-tc-role">Exemple illustratif</div>
            </div>
          </div>
        </div>
        <div class="lp-tc">
          <div class="lp-tc-stars">★★★★★</div>
          <p class="lp-tc-quote">« Valider les compétences en 2 taps, c'est ce dont j'avais besoin. Fini le livret papier que je perdais dans la voiture. Je vois qui est prêt en un coup d'œil. »</p>
          <div class="lp-tc-author">
            <div class="lp-tc-av lp-tc-av-b">SM</div>
            <div>
              <div class="lp-tc-name">Sophie, monitrice</div>
              <div class="lp-tc-role">Exemple illustratif</div>
            </div>
          </div>
        </div>
        <div class="lp-tc">
          <div class="lp-tc-stars">★★★★★</div>
          <p class="lp-tc-quote">« Mon streak c'est devenu un rituel. Chaque soir, 2 questions pour ne pas le perdre. Le jour de l'examen, j'étais prêt — et je l'ai eu du premier coup. »</p>
          <div class="lp-tc-author">
            <div class="lp-tc-av lp-tc-av-p">LT</div>
            <div>
              <div class="lp-tc-name">Lucas, élève</div>
              <div class="lp-tc-role">Exemple illustratif</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Comment ça marche ── -->
    <section class="lp-sec lp-how lp-rev" id="lp-how">
      <h2 class="lp-h2">Comment ça marche</h2>
      <div class="lp-steps">
        <div class="lp-step"><div class="lp-step-n">1</div><h3>Crée ton compte</h3><p>Deux minutes, à ton nom. Aucune installation.</p></div>
        <div class="lp-step"><div class="lp-step-n">2</div><h3>Invite tes élèves</h3><p>Un lien à partager, l'élève ajoute l'app à son écran d'accueil.</p></div>
        <div class="lp-step"><div class="lp-step-n">3</div><h3>Ils progressent, tu pilotes</h3><p>Ils s'entraînent entre les leçons, tu valides, tu vois qui est prêt.</p></div>
      </div>
    </section>

    <!-- ── Pricing ── -->
    <section class="lp-sec lp-pricing lp-rev" id="lp-pricing">
      <h2 class="lp-h2">Un seul tarif, tout compris</h2>
      <p class="lp-sub">Sans engagement. Résiliable en un clic, à tout moment.</p>
      <div class="lp-plans lp-plans-solo">
        <div class="lp-plan lp-plan-feat">
          <div class="lp-plan-tag">Moniteur indépendant</div>
          <div class="lp-plan-name">PermiGo</div>
          <div class="lp-plan-price">9,99<span>€ / mois</span></div>
          <div class="lp-plan-for">Tout l'outil, à ton nom. Élèves illimités.</div>
          <ul class="lp-plan-list">
            <li>Ton app à ta marque</li>
            <li>Parcours élève gamifié + quiz</li>
            <li>Examens blancs illimités</li>
            <li>Livret REMC + validation 2 taps</li>
            <li>Tableau « qui est prêt » + classements</li>
            <li>Élèves illimités</li>
          </ul>
          <button class="lp-btn lp-btn-primary lp-plan-cta" data-go="signup" type="button">Créer mon compte</button>
        </div>
      </div>
      <p class="lp-plan-team">Tu gères une auto-école avec plusieurs moniteurs ?
        <button class="lp-link-btn" data-scroll="lp-lead" type="button">Parle-nous d'une offre équipe</button>.</p>
    </section>

    <!-- ── FAQ ── -->
    <section class="lp-sec lp-faq lp-rev">
      <h2 class="lp-h2">Questions fréquentes</h2>
      <div class="lp-faq-list">
        <details class="lp-faq-item"><summary>C'est vraiment à ma marque ?</summary><p>Oui. L'app porte ton nom, tes élèves sont à toi, la relation reste entre vous. Aucune plateforme ne s'interpose et ne prend de commission.</p></details>
        <details class="lp-faq-item"><summary>Mes élèves doivent-ils télécharger quelque chose ?</summary><p>Non. PermiGo s'ouvre dans le navigateur et s'ajoute à l'écran d'accueil du téléphone comme une app, sans passer par un store.</p></details>
        <details class="lp-faq-item"><summary>Est-ce conforme au programme officiel ?</summary><p>Oui. Le parcours suit le référentiel REMC et ses 31 compétences (arrêté du 13/05/2013).</p></details>
        <details class="lp-faq-item"><summary>Y a-t-il un engagement ?</summary><p>Non. 9,99€/mois, sans engagement, résiliable en un clic à tout moment.</p></details>
        <details class="lp-faq-item"><summary>Je gère une auto-école avec plusieurs moniteurs ?</summary><p>Écris-nous via le formulaire ci-dessous : on te propose une offre adaptée à ton équipe.</p></details>
      </div>
    </section>

    <!-- ── Formulaire lead ── -->
    <section class="lp-sec lp-leadsec lp-rev" id="lp-lead">
      <div class="lp-lead-card">
        <h2 class="lp-h2">Envie qu'on te montre l'app en vrai ?</h2>
        <p class="lp-sub">Laisse ton nom et ton email : on te fait une démo de 30 secondes, sans engagement. (Auto-école : précise-le dans le message.)</p>
        <form class="lp-form" id="lp-form" novalidate>
          <div class="lp-field">
            <label for="lp-ecole">Ton nom (ou nom commercial) *</label>
            <input id="lp-ecole" name="ecole_nom" type="text" required autocomplete="name" />
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
            <label for="lp-msg">Un message (optionnel)</label>
            <textarea id="lp-msg" name="message" rows="3"></textarea>
          </div>
          <button class="lp-btn lp-btn-primary lp-form-submit" type="submit" id="lp-submit">Demander ma démo</button>
          <p class="lp-form-err" id="lp-form-err" hidden></p>
        </form>
        <div class="lp-form-ok" id="lp-form-ok" hidden>
          <div class="lp-ok-ic">✓</div>
          <h3>Bien reçu !</h3>
          <p>On revient vers vous très vite. Merci de votre intérêt pour PermiGo.</p>
        </div>
      </div>
    </section>

    <!-- ── Footer ── -->
    <footer class="lp-foot">
      <div class="lp-foot-brand"><img src="${BADGE}" alt="" width="22" height="22" loading="lazy" /> Permi<span class="g">Go</span></div>
      <div class="lp-foot-links">
        <a href="#/legal" id="lp-legal">Mentions légales</a>
        <button class="lp-foot-login" id="lp-login2" type="button">Se connecter</button>
      </div>
      <div class="lp-foot-copy">© ${new Date().getFullYear()} PermiGo</div>
    </footer>
  </div>`;

  // ── Reveal au scroll — IntersectionObserver ajoute .in une seule fois ──
  const reduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  const revEls = root.querySelectorAll(".lp-rev");
  if (reduced || !("IntersectionObserver" in window)) {
    revEls.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    revEls.forEach((el) => io.observe(el));
  }

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

  // ── Créer mon compte (self-serve 9,99€/mois) ──
  root.querySelectorAll('[data-go="signup"]').forEach((el) => {
    el.addEventListener("click", () => {
      track("landing.cta_signup", {});
      location.hash = "#/signup";
      location.reload();
    });
  });

  // ── Showcase tabs (côté élève / côté moniteur) ──
  const showTabs = root.querySelectorAll(".lp-show-tab");
  const showPanels = root.querySelectorAll(".lp-show-panel");
  showTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const key = tab.dataset.tab;
      showTabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      showPanels.forEach((p) => {
        p.hidden = p.dataset.panel !== key;
      });
      track("landing.showcase_tab", { tab: key });
    });
  });
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
    const nb_enseignants = null;

    if (!ecole_nom || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = "Renseigne au moins ton nom et un email valide.";
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
        source: "landing_moniteur",
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
        "Une erreur est survenue. Réessayez, ou écrivez-nous directement.";
      errEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Demander ma démo";
    }
  });
}

const STYLE = `<style>
  .lp {
    --lp-indigo: #6366f1; --lp-indigo-dk: #4f46e5;
    --lp-green: var(--a); --lp-green-dk: var(--adk);
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
    padding: 14px 22px; min-height: 44px; transition: transform .1s, box-shadow .15s, background .15s; }
  .lp-btn:active { transform: translateY(1px); }
  /* Recette plastic de marque (cf. .pg-btn) — même CTA que login/app */
  .lp-btn-primary { background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%); color: var(--a-ink);
    box-shadow: 0 10px 24px -8px color-mix(in srgb, var(--a) 60%, transparent),
      0 1.5px 0 0 rgba(255,255,255,.28) inset,
      0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset; }
  .lp-btn-soft { background: rgba(99,102,241,.1); color: var(--lp-indigo-dk); }
  .lp-btn-ghost { background: transparent; color: var(--lp-ink); padding: 10px 16px; }

  /* Nav */
  .lp-nav { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between;
    padding: 14px max(20px, env(safe-area-inset-left)); background: rgba(255,255,255,.82);
    backdrop-filter: saturate(160%) blur(12px); border-bottom: 1px solid var(--lp-line); }
  .lp-brand { display: flex; align-items: center; gap: 9px; font: 800 19px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: -.02em; color: var(--lp-ink); padding: 8px 0; }
  .lp-brand-badge { width: 28px; height: 28px; object-fit: contain; }
  .lp-nav-actions { display: flex; align-items: center; gap: 6px; }
  .lp-nav-link { font: 600 14px/1 'Inter'; color: var(--lp-mut); padding: 15px 12px; }

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
  .lp-blob-1 { width: 700px; height: 560px; background: radial-gradient(circle, color-mix(in srgb, var(--a) 42%, transparent), transparent 68%);
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
    background: color-mix(in srgb, var(--a) 10%, transparent); border: 1px solid color-mix(in srgb, var(--a) 28%, transparent);
    border-radius: 999px; padding: 8px 16px;
    font: 600 12.5px/1 'Inter', sans-serif; color: color-mix(in srgb, var(--a) 95%, transparent);
    margin-bottom: 24px; letter-spacing: .01em;
  }
  .lp-badge-pulse {
    width: 7px; height: 7px; border-radius: 50%; background: var(--a); flex-shrink: 0;
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--a) 70%, transparent);
    animation: pulse 2.2s ease-out infinite;
  }
  @keyframes pulse {
    0%  { box-shadow: 0 0 0 0 color-mix(in srgb, var(--a) 70%, transparent); }
    70% { box-shadow: 0 0 0 9px color-mix(in srgb, var(--a) 0%, transparent); }
    100%{ box-shadow: 0 0 0 0 color-mix(in srgb, var(--a) 0%, transparent); }
  }

  /* Headline */
  .lp-h1 {
    font: 900 clamp(30px, 6vw, 46px)/1.1 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.03em; color: #fff;
    margin: 0 0 22px; text-wrap: balance;
  }
  .lp-h1-em {
    font-style: normal; display: inline;
    background: linear-gradient(90deg, var(--a) 0%, #a3e635 45%, #38bdf8 100%);
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
    background: radial-gradient(ellipse 80% 40% at 50% 0%, color-mix(in srgb, var(--a) 18%, transparent), transparent 55%),
      linear-gradient(180deg, #111827, #0b1120);
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 9px; padding: 38px 14px 20px; text-align: center;
  }
  .lp-phone-badge { width: 64px; height: 64px; object-fit: contain; filter: drop-shadow(0 8px 18px color-mix(in srgb, var(--a) 45%, transparent)); }
  .lp-phone-lvl { font: 600 9px/1 'Inter', sans-serif; letter-spacing: .06em; text-transform: uppercase; color: color-mix(in srgb, var(--a) 70%, transparent); }
  .lp-phone-streak { font: 700 13px/1 'Plus Jakarta Sans', sans-serif; color: #fff; display: inline-flex; align-items: center; gap: 5px; }
  .lp-phone-streak svg { color: #fb923c; }
  .lp-phone-streak strong { color: #f59e0b; font-size: 16px; }
  .lp-phone-bar { width: 74%; height: 7px; background: rgba(255,255,255,.1); border-radius: 9px; overflow: hidden; }
  .lp-phone-fill {
    height: 100%; width: 72%; border-radius: 9px;
    background: linear-gradient(90deg, var(--a), #a3e635);
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
  .lp-fcard-ico { display: inline-flex; align-items: center; }
  .lp-fcard-val { font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif; color: #fff; }
  .lp-fcard-sub { font: 500 10px/1 'Inter', sans-serif; color: rgba(255,255,255,.46); margin-top: 2px; }
  .lp-fcard-1 { top: 14%; right: -20px; animation: fc1 5.5s ease-in-out infinite; }
  .lp-fcard-2 { top: 40%; left: -20px; animation: fc2 5.5s ease-in-out 1.4s infinite; }
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
  .lp-card-ic { display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 13px; background: color-mix(in srgb, var(--lp-green) 11%, transparent); color: var(--lp-green); margin-bottom: 12px; }
  .lp-card h3 { font: 700 17px/1.2 'Plus Jakarta Sans'; margin: 0 0 6px; color: var(--lp-ink); }
  .lp-card p { font: 400 14.5px/1.5 'Inter'; color: var(--lp-mut); margin: 0; }

  /* Features */
  .lp-feat { display: flex; flex-direction: column; gap: 14px; margin-top: 28px; }
  .lp-feat-row { display: flex; gap: 18px; align-items: flex-start; background: #fff; border: 1px solid var(--lp-line);
    border-radius: 18px; padding: 22px; color: var(--lp-ink); }
  .lp-feat-ic { flex: 0 0 auto; width: 56px; height: 56px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center; background: rgba(99,102,241,.08); color: #6366f1; }
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
  .lp-plan-feat { border: 2px solid var(--lp-green); box-shadow: 0 18px 44px -20px color-mix(in srgb, var(--a) 50%, transparent); }
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
  /* Plan unique centré (cible moniteur indé) */
  .lp-plans-solo { grid-template-columns: minmax(0, 380px); justify-content: center; margin-top: 18px; }
  .lp-plans-solo .lp-plan-feat { order: 0; }
  .lp-plan-team { text-align: center; color: var(--lp-mut); font: 400 14px/1.6 'Inter'; margin: 22px auto 0; max-width: 520px; }
  .lp-link-btn { background: none; border: 0; padding: 0; cursor: pointer; color: var(--lp-indigo-dk);
    font: 600 14px/1.6 'Inter'; text-decoration: underline; text-underline-offset: 2px; }

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
  .lp-field input, .lp-field textarea { font: 400 16px/1.4 'Inter'; color: var(--lp-ink);
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
  .lp-foot-links a, .lp-foot-login { font: 600 14px/1 'Inter'; color: var(--lp-mut); background: none; border: 0; cursor: pointer; padding: 15px 4px; margin: -15px -4px; }
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

  /* ── Reveal au scroll (IntersectionObserver ajoute .in) ── */
  .lp-rev { opacity: 0; transform: translateY(22px); transition: opacity .65s cubic-bezier(.2,.7,.3,1), transform .65s cubic-bezier(.2,.7,.3,1); }
  .lp-rev.in { opacity: 1; transform: none; }
  /* Stagger des cartes à l'intérieur d'une section révélée */
  .lp-rev .lp-card, .lp-rev .lp-feat-row, .lp-rev .lp-tc, .lp-rev .lp-step, .lp-rev .lp-plan {
    opacity: 0; transform: translateY(14px);
    transition: opacity .55s cubic-bezier(.2,.7,.3,1), transform .55s cubic-bezier(.2,.7,.3,1),
                box-shadow .25s ease, border-color .25s ease; }
  .lp-rev.in .lp-card, .lp-rev.in .lp-feat-row, .lp-rev.in .lp-tc, .lp-rev.in .lp-step, .lp-rev.in .lp-plan { opacity: 1; transform: none; }
  .lp-rev.in > * > :nth-child(2), .lp-rev.in .lp-cards3 > :nth-child(2), .lp-rev.in .lp-feat > :nth-child(2),
  .lp-rev.in .lp-testicards > :nth-child(2), .lp-rev.in .lp-steps > :nth-child(2), .lp-rev.in .lp-plans > :nth-child(2) { transition-delay: .12s; }
  .lp-rev.in .lp-cards3 > :nth-child(3), .lp-rev.in .lp-feat > :nth-child(3),
  .lp-rev.in .lp-testicards > :nth-child(3), .lp-rev.in .lp-steps > :nth-child(3), .lp-rev.in .lp-plans > :nth-child(3) { transition-delay: .24s; }
  .lp-rev.in .lp-feat > :nth-child(4) { transition-delay: .36s; }

  /* ── Hover lift (desktop) ── */
  @media (hover: hover) and (pointer: fine) {
    .lp-card:hover, .lp-feat-row:hover, .lp-tc:hover, .lp-plan:hover {
      transform: translateY(-4px);
      box-shadow: 0 18px 40px -18px rgba(11,16,32,.18);
      border-color: rgba(11,16,32,.16);
    }
    .lp-plan-feat:hover { border-color: var(--lp-green); }
  }

  /* ── Mascotte hero ── */
  .lp-mascot {
    position: absolute; bottom: -14px; left: -34px; z-index: 2;
    width: 130px; height: 130px; object-fit: contain;
    filter: drop-shadow(0 16px 30px rgba(0,0,0,.45));
    animation: mascotIn .7s cubic-bezier(.34,1.56,.64,1) .5s both, mascotFloat 4.5s ease-in-out 1.2s infinite;
    pointer-events: none;
  }
  @keyframes mascotIn { from { opacity: 0; transform: scale(.5) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes mascotFloat { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(2deg); } }

  .lp-testi-note { font-size: .86em; color: var(--lp-mut); }

  @media (prefers-reduced-motion: reduce) {
    .lp-rev, .lp-rev .lp-card, .lp-rev .lp-feat-row, .lp-rev .lp-tc, .lp-rev .lp-step, .lp-rev .lp-plan {
      opacity: 1; transform: none; transition: none; }
    .lp-mascot { animation: none; }
    .lp-card:hover, .lp-feat-row:hover, .lp-tc:hover, .lp-plan:hover { transform: none; }
  }

  /* Responsive */
  @media (max-width: 860px) {
    .lp-hero-inner { grid-template-columns: 1fr; text-align: center; padding: 56px 22px 0; gap: 40px; }
    .lp-h1 { max-width: none; margin-inline: auto; }
    .lp-lead { margin-inline: auto; }
    .lp-hero-badge { margin-left: auto; margin-right: auto; }
    .lp-hero-cta { justify-content: center; }
    .lp-hero-chips { justify-content: center; }
    .lp-hero-visual { margin-top: 10px; }
    .lp-fcard-1 { right: -8px; top: 8%; }
    .lp-fcard-2 { left: -8px; top: 34%; bottom: auto; }
    .lp-mascot { width: 96px; height: 96px; left: 0; bottom: -10px; }
    .lp-cards3, .lp-steps, .lp-plans, .lp-testicards { grid-template-columns: 1fr; }
    .lp-feat-row { flex-direction: column; }
    .lp-plan-feat { order: -1; }
  }
  @media (max-width: 460px) {
    .lp-row2 { grid-template-columns: 1fr; }
    .lp-h2 { font-size: 26px; }
  }

  /* ── Showcase produit (élève / moniteur) ── */
  .lp-show { padding-top: 44px; }
  .lp-show-tabs { display: flex; width: fit-content; gap: 5px; padding: 6px; margin: 6px auto 34px;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(255,255,255,.72), rgba(240,242,248,.6));
    backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255,255,255,.85);
    box-shadow: 0 12px 34px -14px rgba(11,16,32,.28), inset 0 1px 0 rgba(255,255,255,.9); }
  .lp-show-tab { border: 0; background: transparent; cursor: pointer; border-radius: 999px;
    padding: 12px 24px; min-height: 44px; font: 700 14.5px/1 'Inter', sans-serif; color: var(--lp-mut);
    transition: color .25s, background .25s, box-shadow .25s, transform .1s; }
  .lp-show-tab:active { transform: translateY(1px); }
  .lp-show-tab.is-active { color: var(--lp-ink);
    background: linear-gradient(180deg, #fff, #f3f5fb);
    box-shadow: 0 6px 16px -6px rgba(11,16,32,.28), inset 0 1px 0 rgba(255,255,255,.95); }

  .lp-show-panel[hidden] { display: none; }
  .lp-show-panel { animation: lpShowFade .42s cubic-bezier(.2,.7,.3,1); }
  @keyframes lpShowFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

  .lp-show-strip { display: flex; gap: 22px; justify-content: center; align-items: flex-start; }
  .lp-show-card { width: 252px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; margin: 0; }
  .lp-show-phone { border-radius: 32px; padding: 7px; overflow: hidden;
    background: linear-gradient(160deg, #232c45, #0b1120); border: 1px solid rgba(255,255,255,.14);
    box-shadow: 0 32px 64px -30px rgba(8,12,28,.62), 0 2px 0 rgba(255,255,255,.08) inset;
    transition: transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s; }
  .lp-show-phone img { display: block; width: 100%; height: auto; border-radius: 25px; }
  .lp-show-phonewrap { position: relative; }
  .lp-show-mascot { position: absolute; left: -18px; bottom: -14px; z-index: 2;
    width: 58px; height: 58px; object-fit: contain; pointer-events: none;
    filter: drop-shadow(0 10px 18px rgba(0,0,0,.32));
    animation: mascotFloat 4.5s ease-in-out infinite; }
  .lp-show-card figcaption { display: flex; flex-direction: column; gap: 6px; padding: 0 4px; }
  .lp-show-caphead { display: flex; align-items: center; gap: 9px; }
  .lp-show-step { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; border-radius: 8px; background: color-mix(in srgb, var(--a) 15%, transparent);
    color: var(--adk); font: 800 12px/1 'Plus Jakarta Sans', sans-serif; }
  .lp-show-caphead strong { font: 700 16px/1.25 'Plus Jakarta Sans', sans-serif; color: var(--lp-ink); }
  .lp-show-desc { font: 400 13.5px/1.5 'Inter', sans-serif; color: var(--lp-mut); }

  /* Reveal + stagger des phones */
  .lp-rev .lp-show-card { opacity: 0; transform: translateY(18px);
    transition: opacity .6s cubic-bezier(.2,.7,.3,1), transform .6s cubic-bezier(.2,.7,.3,1); }
  .lp-rev.in .lp-show-card { opacity: 1; transform: none; }
  .lp-rev.in .lp-show-strip > :nth-child(2) { transition-delay: .1s; }
  .lp-rev.in .lp-show-strip > :nth-child(3) { transition-delay: .2s; }

  @media (hover: hover) and (pointer: fine) {
    .lp-show-card:hover .lp-show-phone { transform: translateY(-7px); box-shadow: 0 44px 78px -32px rgba(8,12,28,.7); }
  }
  @media (prefers-reduced-motion: reduce) {
    .lp-show-panel { animation: none; }
    .lp-rev .lp-show-card { opacity: 1; transform: none; transition: none; }
    .lp-show-card:hover .lp-show-phone { transform: none; }
    .lp-show-mascot { animation: none; }
  }

  /* Mobile : filmstrip horizontal scroll-snap */
  @media (max-width: 760px) {
    .lp-show-strip { justify-content: flex-start; overflow-x: auto; scroll-snap-type: x mandatory;
      margin: 0 -22px; padding: 4px 22px 14px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .lp-show-strip::-webkit-scrollbar { display: none; }
    .lp-show-card { scroll-snap-align: center; width: 76vw; max-width: 300px; }
  }
</style>`;
