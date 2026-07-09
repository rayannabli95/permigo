// ═══════════════════════════════════════════════════════════════
// Landing / page de vente — visiteur non connecté
// Cible : MONITEUR INDÉPENDANT (école = porte discrète via le formulaire).
// Positionnement : "ton app à ton nom" + engagement élève + preuve/autorité.
// CTA principal : "Créer mon compte" → #/creer-compte (self-serve 9,99€/mois).
// CTA secondaire : formulaire "qu'on te montre" → table public.leads (insert anon).
// Monté par main.js quand !me et hash racine.
// Cas particulier : un élève/moniteur déjà installé (PWA) dont la session a
// expiré retombe ici → redirection directe vers #/login (il n'est pas un
// prospect), et bandeau « Se reconnecter » pour l'historique navigateur.
// DA : hero nuit + halos, motif "ligne médiane" (pointillés route), sections
// claires alternées, interlude sombre « Une journée avec ». CTA plastique
// indigo (recette de l'app). Tout le CSS est scopé sous .lp en littéraux
// (aucun token thème → rendu identique quel que soit le mode OS).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { track } from "@/services/analytics.js";
import { icon } from "@/utils/icons.js";

const BADGE = "/skins/avatars/permigo-badge-icon.png";
const MASCOT = "/skins/mascot-hello.png";

export function mount(root) {
  // ── App installée (PWA) : ce n'est pas un prospect, c'est un retour.
  // On l'envoie directement se reconnecter au lieu de la page de vente.
  const standalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true;
  if (standalone) {
    track("landing.pwa_redirect", {});
    location.hash = "#/login";
    location.reload();
    return;
  }

  // ── Navigateur avec traces d'usage (session expirée, déconnexion…) :
  // on laisse la landing mais on affiche un raccourci « Se reconnecter ».
  let wasUser = false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (k.startsWith("sb-") || k.startsWith("pg-")) {
        wasUser = true;
        break;
      }
    }
  } catch {
    /* localStorage indisponible → visiteur classique */
  }

  track("landing.view", { returning: wasUser });

  root.innerHTML = `${STYLE}
  <div class="lp">

    ${
      wasUser
        ? `<div class="lp-reba">
             <span class="lp-reba-txt">Déjà sur PermiGo ? Reprends là où tu en étais.</span>
             <button class="lp-reba-btn" id="lp-reconnect" type="button">Se reconnecter</button>
           </div>`
        : ""
    }

    <!-- ── Barre haute (transparente sur le hero, verre au scroll) ── -->
    <header class="lp-nav" id="lp-navbar">
      <a class="lp-brand" href="#/" aria-label="PermiGo">
        <img src="${BADGE}" alt="" class="lp-brand-badge" width="28" height="28" />
        <span>Permi<span class="g">Go</span></span>
      </a>
      <div class="lp-nav-actions">
        <a class="lp-nav-link" href="#lp-pricing">Tarifs</a>
        <button class="lp-btn lp-btn-ghost" id="lp-login" type="button">Se connecter</button>
        <button class="lp-btn lp-btn-primary lp-nav-cta" data-go="signup" type="button">Créer mon compte</button>
      </div>
    </header>

    <!-- ── Hero nuit ── -->
    <section class="lp-hero">
      <div class="lp-hero-bg" aria-hidden="true">
        <div class="lp-blob lp-blob-1"></div>
        <div class="lp-blob lp-blob-2"></div>
        <div class="lp-blob lp-blob-3"></div>
        <svg class="lp-road" viewBox="0 0 1440 480" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-60,430 C280,330 520,470 780,380 C1020,296 1200,350 1500,220"
                fill="none" stroke="rgba(255,255,255,.14)" stroke-width="3"
                stroke-linecap="round" stroke-dasharray="16 22" pathLength="1000" />
        </svg>
      </div>

      <div class="lp-hero-inner">
        <div class="lp-hero-txt">
          <div class="lp-hero-badge">
            <span class="lp-badge-pulse"></span>
            Pour moniteurs indépendants
          </div>
          <h1 class="lp-h1">Tes élèves révisent entre les leçons. <em class="lp-h1-em">Tout seuls.</em></h1>
          <p class="lp-lead">PermiGo transforme le permis en jeu : quiz, série quotidienne, examens blancs. Tes élèves reviennent chaque jour — sur une app à ton nom, pas à celui d'une plateforme.</p>
          <div class="lp-hero-cta">
            <button class="lp-btn lp-btn-primary lp-btn-lg" data-go="signup" type="button">
              Créer mon compte · 9,99 €/mois
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button class="lp-btn-ghost-hero" data-scroll="lp-show" type="button">Voir l'app en action</button>
          </div>
          <div class="lp-hero-chips">
            <span class="lp-chip"><span aria-hidden="true">✓ </span>Sans engagement</span>
            <span class="lp-chip"><span aria-hidden="true">✓ </span>Élèves illimités</span>
            <span class="lp-chip"><span aria-hidden="true">✓ </span>Prêt en 2 minutes</span>
          </div>
        </div>

        <!-- Éventail 2 téléphones : les deux faces du produit -->
        <div class="lp-stage" aria-hidden="true">
          <div class="lp-ph lp-ph-back">
            <span class="lp-ph-tag lp-ph-tag-mon">Côté moniteur</span>
            <div class="lp-ph-frame"><img src="/showcase/ens-valider.png" alt="" width="390" height="844" decoding="async" /></div>
          </div>
          <div class="lp-ph lp-ph-front">
            <span class="lp-ph-tag lp-ph-tag-elv">Côté élève</span>
            <div class="lp-ph-frame"><img src="/showcase/eleve-accueil.png" alt="" width="390" height="844" fetchpriority="high" decoding="async" /></div>
          </div>
          <div class="lp-fcard lp-fcard-1">
            <span class="lp-fcard-ico lp-ico-ind">${icon("check-circle", { size: 18 })}</span>
            <div><div class="lp-fcard-val">3 élèves prêts</div><div class="lp-fcard-sub">à présenter à l'examen</div></div>
          </div>
          <div class="lp-fcard lp-fcard-2">
            <span class="lp-fcard-ico lp-ico-fla">${icon("flame", { size: 18 })}</span>
            <div><div class="lp-fcard-val">Série · 12 jours</div><div class="lp-fcard-sub">il révise chaque soir</div></div>
          </div>
          <img class="lp-mascot" src="${MASCOT}" alt="" loading="lazy" decoding="async" width="110" height="110" />
        </div>
      </div>

      <!-- Barre de confiance à cheval sur la couture -->
      <div class="lp-trust">
        <div class="lp-trust-it">${icon("shield", { size: 19 })}<span>Programme officiel REMC</span></div>
        <div class="lp-trust-it">${icon("zap", { size: 19 })}<span>Prêt en 2 minutes</span></div>
        <div class="lp-trust-it">${icon("check-circle", { size: 19 })}<span>Sans engagement, résiliable en un clic</span></div>
      </div>
      <div class="lp-nav-sentinel" id="lp-nav-sentinel"></div>
    </section>

    <!-- ── Showcase produit (élève / moniteur) ── -->
    <section class="lp-sec lp-show lp-rev" id="lp-show">
      <div class="lp-eyebrow">L'app, en vrai</div>
      <h2 class="lp-h2">Vois PermiGo en action</h2>
      <p class="lp-sub">Une app que tes élèves adorent. Un outil qui te fait gagner du temps.</p>

      <div class="lp-show-tabs" role="tablist" aria-label="Choisir le côté de l'app à montrer">
        <button class="lp-show-tab is-active" id="lp-tab-eleve" data-tab="eleve" role="tab" aria-selected="true" aria-controls="lp-panel-eleve" type="button">Côté élève</button>
        <button class="lp-show-tab" id="lp-tab-moniteur" data-tab="moniteur" role="tab" aria-selected="false" aria-controls="lp-panel-moniteur" tabindex="-1" type="button">Côté moniteur</button>
      </div>

      <div class="lp-show-panel" id="lp-panel-eleve" role="tabpanel" aria-labelledby="lp-tab-eleve" data-panel="eleve">
        <div class="lp-show-strip">
          <figure class="lp-show-card">
            <div class="lp-show-phone"><img src="/showcase/eleve-accueil.png" alt="Accueil élève : carte de permis, quêtes du jour, série" loading="lazy" width="390" height="844" /></div>
            <figcaption>
              <div class="lp-show-caphead"><span class="lp-show-step">1</span><strong>Son permis devient un jeu</strong></div>
              <span class="lp-show-desc">Carte de permis, quêtes du jour, série quotidienne : il revient s'entraîner tout seul.</span>
            </figcaption>
          </figure>
          <figure class="lp-show-card">
            <div class="lp-show-phone"><img src="/showcase/eleve-parcours.png" alt="Parcours de compétences en carte d'aventure, étape par étape" loading="lazy" width="390" height="844" /></div>
            <figcaption>
              <div class="lp-show-caphead"><span class="lp-show-step">2</span><strong>Un parcours étape par étape</strong></div>
              <span class="lp-show-desc">Tout le programme officiel en carte d'aventure. Il voit exactement où il en est.</span>
            </figcaption>
          </figure>
          <figure class="lp-show-card">
            <div class="lp-show-phone"><img src="/showcase/eleve-examens.png" alt="Examens blancs chronométrés et entraînement par thème" loading="lazy" width="390" height="844" /></div>
            <figcaption>
              <div class="lp-show-caphead"><span class="lp-show-step">3</span><strong>Il s'entraîne comme le jour J</strong></div>
              <span class="lp-show-desc">Examens blancs chronométrés et quiz par thème. Il arrive prêt à l'examen.</span>
            </figcaption>
          </figure>
        </div>
      </div>

      <div class="lp-show-panel" id="lp-panel-moniteur" role="tabpanel" aria-labelledby="lp-tab-moniteur" data-panel="moniteur" hidden>
        <div class="lp-show-strip">
          <figure class="lp-show-card">
            <div class="lp-show-phone"><img src="/showcase/ens-valider.png" alt="Vue moniteur : valider une compétence, liste d'élèves" loading="lazy" width="390" height="844" /></div>
            <figcaption>
              <div class="lp-show-caphead"><span class="lp-show-step">1</span><strong>Tu valides en 2 taps</strong></div>
              <span class="lp-show-desc">Tu ouvres l'élève, tu coches ce qu'il a réussi. Son livret se met à jour tout seul.</span>
            </figcaption>
          </figure>
          <figure class="lp-show-card">
            <div class="lp-show-phone"><img src="/showcase/ens-livret.png" alt="Livret numérique d'un élève, compétences acquises" loading="lazy" width="390" height="844" /></div>
            <figcaption>
              <div class="lp-show-caphead"><span class="lp-show-step">2</span><strong>Le livret, à jour tout seul</strong></div>
              <span class="lp-show-desc">Chaque compétence en temps réel. Fini le papier perdu dans la voiture.</span>
            </figcaption>
          </figure>
          <figure class="lp-show-card">
            <div class="lp-show-phone"><img src="/showcase/ens-classement.png" alt="Élèves classés par progression" loading="lazy" width="390" height="844" /></div>
            <figcaption>
              <div class="lp-show-caphead"><span class="lp-show-step">3</span><strong>Tu vois qui est prêt</strong></div>
              <span class="lp-show-desc">Tes élèves classés par progression. Tu sais d'un coup d'œil qui présenter.</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- ── Problème (éditorial numéroté) ── -->
    <section class="lp-sec lp-sec-paper lp-problem lp-rev">
      <div class="lp-sec-inner">
        <div class="lp-eyebrow">Le problème</div>
        <h2 class="lp-h2">Entre deux leçons, tout se perd.</h2>
        <div class="lp-prob-grid">
          <div class="lp-prob-it">
            <div class="lp-prob-n">01</div>
            <h3>Tes élèves décrochent</h3>
            <p>Rien ne les fait réviser après la leçon. À la suivante, tu repars de plus bas.</p>
          </div>
          <div class="lp-prob-it">
            <div class="lp-prob-n">02</div>
            <h3>Ton travail est invisible</h3>
            <p>Livret papier, résultats nulle part : ta vraie valeur ne se voit pas.</p>
          </div>
          <div class="lp-prob-it">
            <div class="lp-prob-n">03</div>
            <h3>Ta marque n'existe pas</h3>
            <p>Sur les plateformes, c'est leur nom, leurs élèves, leur commission.</p>
          </div>
        </div>
        <p class="lp-prob-kicker">PermiGo règle les trois. Voilà comment.</p>
      </div>
    </section>

    <!-- ── Ce que PermiGo te donne (bento) ── -->
    <section class="lp-sec lp-features lp-rev">
      <div class="lp-eyebrow">L'outil</div>
      <h2 class="lp-h2">Ce que PermiGo te donne</h2>
      <div class="lp-bento">
        <div class="lp-cell lp-cell-dark lp-cell-7">
          <div class="lp-brandmock" aria-hidden="true">
            <img src="${BADGE}" alt="" width="40" height="40" loading="lazy" />
            <div>
              <div class="lp-bm-name">Ton enseigne</div>
              <div class="lp-bm-sub">Ton app · Tes élèves</div>
            </div>
            <span class="lp-bm-pill">À ta marque</span>
          </div>
          <h3>Une app à ton nom</h3>
          <p>Tes élèves ouvrent ton app, avec ton enseigne. Tu existes en ton nom propre — pas comme sous-traitant d'une plateforme.</p>
        </div>
        <div class="lp-cell lp-cell-5">
          <div class="lp-serieviz" aria-hidden="true">
            <span class="lp-sv-flame">${icon("flame", { size: 22 })}</span>
            <span class="lp-sv-dot on"></span><span class="lp-sv-dot on"></span><span class="lp-sv-dot on"></span><span class="lp-sv-dot on"></span><span class="lp-sv-dot on"></span><span class="lp-sv-dot"></span><span class="lp-sv-dot"></span>
          </div>
          <h3>Tes élèves reviennent tout seuls</h3>
          <p>Quiz éclair, série quotidienne, examens blancs : ils s'entraînent entre les leçons, sans que tu pousses.</p>
        </div>
        <div class="lp-cell lp-cell-5">
          <div class="lp-pretviz" aria-hidden="true">
            <div class="lp-pv-row"><span class="lp-pv-bar" style="--w:92%"></span><span class="lp-pv-pill">Prêt</span></div>
            <div class="lp-pv-row"><span class="lp-pv-bar" style="--w:64%"></span></div>
            <div class="lp-pv-row"><span class="lp-pv-bar" style="--w:38%"></span></div>
          </div>
          <h3>La preuve qui remplit ton agenda</h3>
          <p>Tu vois qui est prêt à présenter. Tes résultats parlent pour toi : bouche-à-oreille, planning plein.</p>
        </div>
        <div class="lp-cell lp-cell-7">
          <div class="lp-valviz" aria-hidden="true">
            <div class="lp-vv-row"><span class="lp-vv-check">${icon("check", { size: 13 })}</span><span class="lp-vv-line" style="--w:62%"></span></div>
            <div class="lp-vv-row"><span class="lp-vv-check">${icon("check", { size: 13 })}</span><span class="lp-vv-line" style="--w:44%"></span></div>
          </div>
          <h3>Le livret à jour, en 2 taps</h3>
          <p>Tu valides en fin de séance, le livret numérique suit tout seul. Fini le papier perdu dans la voiture.</p>
        </div>
      </div>
    </section>

    <!-- ── Une journée avec PermiGo (interlude nuit) ── -->
    <section class="lp-day lp-rev">
      <div class="lp-sec-inner">
        <div class="lp-eyebrow lp-eyebrow-lt">Au quotidien</div>
        <h2 class="lp-h2 lp-h2-lt">Une journée avec PermiGo</h2>
        <div class="lp-day-grid">
          <div class="lp-day-card">
            <span class="lp-day-chip">${icon("sun", { size: 14 })} Le matin</span>
            <p>Tu ouvres l'app : tu sais qui a révisé, qui décroche, qui est prêt à présenter. Ta journée commence avec un coup d'avance.</p>
          </div>
          <div class="lp-day-card">
            <span class="lp-day-chip">${icon("car", { size: 14 })} Après la leçon</span>
            <p>Deux taps pour valider les compétences travaillées. Le livret est à jour avant même que ton élève rentre chez lui.</p>
          </div>
          <div class="lp-day-card">
            <span class="lp-day-chip lp-day-chip-elv">${icon("moon", { size: 14 })} Le soir</span>
            <p>Ton élève fait ses questions du jour pour garder sa série. Il progresse sans y penser — et arrive à l'examen vraiment prêt.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Comment ça marche ── -->
    <section class="lp-sec lp-how lp-rev" id="lp-how">
      <div class="lp-eyebrow">Trois étapes</div>
      <h2 class="lp-h2">Prêt en deux minutes</h2>
      <div class="lp-steps">
        <div class="lp-step"><div class="lp-step-n">1</div><h3>Crée ton compte</h3><p>À ton nom. Aucune installation, rien à configurer.</p></div>
        <div class="lp-step"><div class="lp-step-n">2</div><h3>Invite tes élèves</h3><p>Un lien à partager. L'app s'ajoute sur leur téléphone, sans passer par l'App Store ou Google Play.</p></div>
        <div class="lp-step"><div class="lp-step-n">3</div><h3>Ils s'entraînent, tu pilotes</h3><p>Ils révisent entre les leçons, tu valides, tu vois qui est prêt.</p></div>
      </div>
    </section>

    <!-- ── Pricing ── -->
    <section class="lp-sec lp-sec-paper lp-pricing lp-rev" id="lp-pricing">
      <div class="lp-sec-inner">
        <div class="lp-eyebrow">Le tarif</div>
        <h2 class="lp-h2">Un prix simple, tout compris</h2>
        <p class="lp-sub">Sans engagement. Résiliable en un clic, à tout moment.</p>
        <div class="lp-plan">
          <div class="lp-plan-tag">Prix de lancement</div>
          <div class="lp-plan-name">PermiGo</div>
          <div class="lp-plan-price">9,99&nbsp;<span>€/mois</span></div>
          <div class="lp-plan-for">Tout l'outil, à ton nom.</div>
          <ul class="lp-plan-list">
            <li>Élèves illimités</li>
            <li>App à ta marque</li>
            <li>Parcours façon jeu, quiz, examens blancs</li>
            <li>Livret numérique, validation en 2 taps</li>
            <li>« Qui est prêt » en un coup d'œil</li>
            <li>Sans engagement</li>
          </ul>
          <button class="lp-btn lp-btn-primary lp-btn-lg lp-plan-cta" data-go="signup" type="button">Créer mon compte</button>
        </div>
        <p class="lp-plan-team">Tu gères une auto-école avec plusieurs moniteurs ?
          <button class="lp-link-btn" data-scroll="lp-lead" type="button">Parle-nous de ton équipe</button>.</p>
      </div>
    </section>

    <!-- ── FAQ ── -->
    <section class="lp-sec lp-faq lp-rev">
      <div class="lp-eyebrow">Questions fréquentes</div>
      <h2 class="lp-h2">Tout ce qu'on nous demande</h2>
      <div class="lp-faq-list">
        <details class="lp-faq-item"><summary>C'est vraiment à ma marque ?</summary><p>Oui. L'app porte ton nom, tes élèves sont à toi, la relation reste entre vous. Aucune plateforme ne s'interpose et ne prend de commission.</p></details>
        <details class="lp-faq-item"><summary>Mes élèves doivent-ils télécharger quelque chose ?</summary><p>Non. PermiGo s'ouvre dans le navigateur et s'ajoute à l'écran d'accueil du téléphone comme une app, sans passer par l'App Store ou Google Play.</p></details>
        <details class="lp-faq-item"><summary>Est-ce conforme au programme officiel ?</summary><p>Oui. Le parcours suit le référentiel officiel REMC : les 4 compétences et les 30 objectifs du livret d'apprentissage, découpés en étapes claires pour l'élève.</p></details>
        <details class="lp-faq-item"><summary>Y a-t-il un engagement ?</summary><p>Non. 9,99 €/mois, sans engagement, résiliable en un clic à tout moment.</p></details>
        <details class="lp-faq-item"><summary>Combien d'élèves je peux inviter ?</summary><p>Autant que tu veux. Le tarif ne bouge pas, que tu aies 5 ou 50 élèves.</p></details>
        <details class="lp-faq-item"><summary>Et si je gère une auto-école avec plusieurs moniteurs ?</summary><p>Écris-nous via le formulaire ci-dessous : on te propose une offre adaptée à ton équipe.</p></details>
      </div>
    </section>

    <!-- ── Formulaire lead ── -->
    <section class="lp-sec lp-sec-paper lp-leadsec lp-rev" id="lp-lead">
      <div class="lp-lead-card">
        <h2 class="lp-h2">Envie qu'on te montre l'app en vrai ?</h2>
        <p class="lp-sub">Laisse ton nom et ton email : on te fait une démo rapide, sans engagement. (Auto-école : précise-le dans le message.)</p>
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
          <button class="lp-btn lp-btn-primary lp-btn-lg lp-form-submit" type="submit" id="lp-submit">Demander ma démo</button>
          <p class="lp-form-err" id="lp-form-err" role="alert" hidden></p>
        </form>
        <div class="lp-form-ok" id="lp-form-ok" tabindex="-1" hidden>
          <div class="lp-ok-ic" aria-hidden="true">✓</div>
          <h3>Bien reçu !</h3>
          <p>On revient vers toi très vite. Merci de ton intérêt pour PermiGo.</p>
        </div>
      </div>
    </section>

    <!-- ── Footer ── -->
    <footer class="lp-foot">
      <div class="lp-foot-brand"><img src="${BADGE}" alt="" width="22" height="22" loading="lazy" /> Permi<span class="g">Go</span></div>
      <div class="lp-foot-tag">L'outil du moniteur indépendant.</div>
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

  // ── Nav : transparente sur le hero, verre clair après ──
  const nav = root.querySelector("#lp-navbar");
  const sentinel = root.querySelector("#lp-nav-sentinel");
  if (nav && sentinel && "IntersectionObserver" in window) {
    // Bascule quand le bas du hero passe sous la nav (~68px), pas au bas du viewport
    const navIo = new IntersectionObserver(
      ([e]) => nav.classList.toggle("is-lit", e.boundingClientRect.top < 68),
      { rootMargin: "-68px 0px 0px 0px", threshold: 0 },
    );
    navIo.observe(sentinel);
  } else {
    nav?.classList.add("is-lit");
  }

  // ── Navigation interne (scroll doux, sauf reduced-motion) ──
  const scrollBehavior = reduced ? "auto" : "smooth";
  root.querySelectorAll("[data-scroll]").forEach((el) => {
    el.addEventListener("click", () => {
      const t = root.querySelector("#" + el.dataset.scroll);
      t?.scrollIntoView({ behavior: scrollBehavior, block: "start" });
      track("landing.cta_click", { target: el.dataset.scroll });
    });
  });
  root.querySelectorAll('a[href^="#lp-"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      root
        .querySelector(a.getAttribute("href"))
        ?.scrollIntoView({ behavior: scrollBehavior, block: "start" });
    });
  });

  // ── Se connecter ──
  const goLogin = () => {
    location.hash = "#/login";
    location.reload();
  };
  root.querySelector("#lp-login")?.addEventListener("click", goLogin);
  root.querySelector("#lp-login2")?.addEventListener("click", goLogin);
  root.querySelector("#lp-reconnect")?.addEventListener("click", () => {
    track("landing.reconnect_click", {});
    goLogin();
  });

  // ── Créer mon compte (self-serve moniteur 9,99€/mois) ──
  root.querySelectorAll('[data-go="signup"]').forEach((el) => {
    el.addEventListener("click", () => {
      track("landing.cta_signup", {});
      location.hash = "#/creer-compte";
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
        t.tabIndex = on ? 0 : -1;
      });
      showPanels.forEach((p) => {
        p.hidden = p.dataset.panel !== key;
      });
      track("landing.showcase_tab", { tab: key });
    });
  });
  // Flèches gauche/droite entre les onglets (pattern ARIA tabs)
  root.querySelector(".lp-show-tabs")?.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const arr = [...showTabs];
    const i = arr.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next =
      arr[(i + (e.key === "ArrowRight" ? 1 : arr.length - 1)) % arr.length];
    next.focus();
    next.click();
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
      okEl.scrollIntoView({ behavior: scrollBehavior, block: "center" });
      okEl.focus({ preventScroll: true });
    } catch (err) {
      console.error("[landing] lead insert failed", err);
      errEl.textContent =
        "Une erreur est survenue. Réessaie, ou écris-nous directement.";
      errEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Demander ma démo";
    }
  });
}

const STYLE = `<style>
  /* Landing seule : html/body ont overflow-x:hidden dans base.css, ce qui
     casse la nav sticky (conteneur de scroll implicite). clip = même effet
     visuel sans casser sticky. Rétabli automatiquement au démontage (le
     style vit dans #app). */
  html, body { overflow-x: clip; }

  /* Palette en littéraux, scopée .lp : rendu identique en light/dark OS. */
  .lp {
    --lpN: #05070f;          /* nuit profonde (hero, interlude, footer) */
    --lpN2: #0b1224;         /* nuit claire (dégradés, cellule sombre) */
    --lpInd: #4f46e5; --lpIndDk: #4038c9; --lpIndLt: #7c74ff;
    --lpVio: #6c63ff; --lpVioLt: #8e87ff;
    --lpInk: #0d1226; --lpMut: #545b70; --lpLine: rgba(13,18,38,.09);
    --lpPaper: #f6f7fb;
    font-family: 'Inter', sans-serif; color: var(--lpInk);
    background: #fff; min-height: 100dvh;
    /* clip (et pas hidden) : hidden créerait un conteneur de scroll qui casse la nav sticky */
    overflow-x: hidden; overflow-x: clip;
    -webkit-font-smoothing: antialiased;
  }
  .lp a { color: inherit; text-decoration: none; }
  .lp .g { color: var(--lpVioLt); }
  .lp button { touch-action: manipulation; }

  /* ── Bandeau reconnexion (utilisateur connu, session expirée) ── */
  .lp-reba { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap;
    padding: 8px max(16px, env(safe-area-inset-right)) 8px max(16px, env(safe-area-inset-left));
    background: linear-gradient(90deg, #16123f, #1c1650);
    border-bottom: 1px solid rgba(255,255,255,.08); }
  .lp-reba-txt { font: 500 13.5px/1.4 'Inter'; color: rgba(255,255,255,.82); }
  .lp-reba-btn { border: 0; cursor: pointer; border-radius: 11px; min-height: 44px; padding: 10px 18px;
    font: 700 13.5px/1 'Inter'; color: #fff;
    background: linear-gradient(to bottom, var(--lpIndLt), var(--lpInd) 55%, var(--lpIndDk));
    box-shadow: 0 6px 14px -6px rgba(79,70,229,.6), inset 0 1px 0 rgba(255,255,255,.3); }

  /* ── Boutons ── */
  .lp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    border: 0; border-radius: 13px; font: 700 15px/1 'Inter', sans-serif; cursor: pointer;
    padding: 13px 20px; min-height: 44px; transition: transform .12s, box-shadow .18s, filter .18s; }
  .lp-btn:active { transform: translateY(1px); }
  /* Recette plastique de marque (dégradé + liseré interne + ombre colorée), version indigo moniteur */
  .lp-btn-primary {
    background: linear-gradient(to bottom, var(--lpIndLt) 0%, #574ff2 48%, var(--lpIndDk) 100%);
    color: #fff;
    box-shadow: 0 12px 26px -10px rgba(79,70,229,.6),
      inset 0 1.5px 0 rgba(255,255,255,.32),
      inset 0 -2px 8px rgba(38,32,150,.5); }
  .lp-btn-primary:hover { filter: brightness(1.06); transform: translateY(-1px); }
  .lp-btn-primary:hover:active { transform: translateY(1px); }
  .lp-btn-lg { padding: 15px 24px; font-size: 15.5px; }
  .lp-btn-ghost { background: transparent; color: inherit; padding: 10px 14px; }

  /* ── Nav (transparente sur le hero → verre clair au scroll) ── */
  .lp-nav { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between;
    padding: 12px max(20px, env(safe-area-inset-right)) 12px max(20px, env(safe-area-inset-left)); color: #fff;
    background: transparent; border-bottom: 1px solid transparent;
    transition: background .3s, color .3s, border-color .3s, box-shadow .3s; }
  .lp-nav.is-lit { color: var(--lpInk); background: rgba(255,255,255,.85);
    backdrop-filter: saturate(160%) blur(14px); -webkit-backdrop-filter: saturate(160%) blur(14px);
    border-bottom-color: var(--lpLine); box-shadow: 0 8px 30px -18px rgba(13,18,38,.25); }
  .lp-nav.is-lit .g { color: var(--lpInd); }
  .lp-brand { display: flex; align-items: center; gap: 9px; font: 800 19px/1 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.02em; padding: 8px 0; }
  .lp-brand-badge { width: 28px; height: 28px; object-fit: contain; }
  .lp-nav-actions { display: flex; align-items: center; gap: 4px; }
  .lp-nav-link { font: 600 14px/1 'Inter'; opacity: .78; padding: 15px 12px; }
  .lp-nav-link:hover { opacity: 1; }
  .lp-nav-cta { padding: 11px 16px; font-size: 14px; margin-left: 6px; }
  .lp-nav-sentinel { position: absolute; bottom: 0; left: 0; width: 1px; height: 1px; }

  /* ── HERO nuit ── */
  .lp-hero { position: relative; overflow: visible; background: linear-gradient(180deg, var(--lpN) 0%, var(--lpN2) 100%);
    color: #fff; margin-top: -68px; padding-top: 68px; }
  .lp-hero-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .lp-blob { position: absolute; border-radius: 50%; filter: blur(90px); will-change: transform; }
  .lp-blob-1 { width: 680px; height: 540px; background: radial-gradient(circle, rgba(79,70,229,.5), transparent 68%);
    top: -180px; right: -140px; opacity: .75; animation: lpBlob 17s ease-in-out infinite alternate; }
  .lp-blob-2 { width: 540px; height: 470px; background: radial-gradient(circle, rgba(108,99,255,.4), transparent 68%);
    bottom: -150px; left: -130px; opacity: .6; animation: lpBlob 21s ease-in-out infinite alternate-reverse; }
  .lp-blob-3 { width: 360px; height: 300px; background: radial-gradient(circle, rgba(56,189,248,.26), transparent 68%);
    top: 42%; left: 46%; opacity: .35; animation: lpBlob 25s ease-in-out infinite alternate; }
  @keyframes lpBlob { from { transform: translate(0,0) scale(1); } to { transform: translate(26px,16px) scale(1.06); } }
  /* Petit écran : moins de flou GPU (batterie) et un halo de moins hors-champ */
  @media (max-width: 760px) {
    .lp-blob { filter: blur(60px); }
    .lp-blob-3 { display: none; }
  }

  /* Ligne médiane — motif signature */
  .lp-road { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 46%; }
  .lp-road path { animation: lpRoad 26s linear infinite; }
  @keyframes lpRoad { to { stroke-dashoffset: -380; } }

  .lp-hero-inner { position: relative; z-index: 1; display: grid; grid-template-columns: 1.04fr .96fr;
    gap: 48px; align-items: center; max-width: 1100px; margin: 0 auto; padding: 72px 32px 30px; }

  .lp-hero-badge { display: inline-flex; align-items: center; gap: 9px;
    background: rgba(124,116,255,.12); border: 1px solid rgba(124,116,255,.32);
    border-radius: 999px; padding: 8px 16px;
    font: 600 12.5px/1 'Inter', sans-serif; color: #c9c5ff;
    margin-bottom: 22px; letter-spacing: .01em; }
  .lp-badge-pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--lpVioLt); flex-shrink: 0;
    box-shadow: 0 0 0 0 rgba(142,135,255,.7); animation: lpPulse 2.2s ease-out infinite; }
  @keyframes lpPulse {
    0%  { box-shadow: 0 0 0 0 rgba(142,135,255,.7); }
    70% { box-shadow: 0 0 0 9px rgba(142,135,255,0); }
    100%{ box-shadow: 0 0 0 0 rgba(142,135,255,0); } }

  .lp-h1 { font: 800 clamp(33px, 5.6vw, 54px)/1.07 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.035em; color: #fff; margin: 0 0 20px; text-wrap: balance; }
  .lp-h1-em { font-style: normal;
    background: linear-gradient(92deg, var(--lpVioLt) 0%, #a5b4fc 55%, #7dd3fc 100%);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

  .lp-lead { font: 400 16.5px/1.7 'Inter', sans-serif; color: rgba(255,255,255,.6); margin: 0 0 28px; max-width: 46ch; }

  .lp-hero-cta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
  .lp-btn-ghost-hero { display: inline-flex; align-items: center; min-height: 44px;
    padding: 13px 20px; font: 700 15px/1 'Inter', sans-serif; color: rgba(255,255,255,.78);
    background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.16);
    border-radius: 13px; cursor: pointer; transition: background .15s, border-color .15s; }
  .lp-btn-ghost-hero:hover { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.3); }

  .lp-hero-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .lp-chip { font: 500 12px/1 'Inter', sans-serif; color: rgba(255,255,255,.62);
    padding: 7px 11px; border: 1px solid rgba(255,255,255,.1); border-radius: 8px; background: rgba(255,255,255,.03); }

  /* ── Éventail de téléphones ── */
  .lp-stage { position: relative; height: clamp(420px, 40vw, 540px); }
  .lp-ph { position: absolute; }
  .lp-ph-frame { border-radius: 40px; padding: 9px;
    background: linear-gradient(165deg, #2a3352, #0b1022 62%);
    border: 1px solid rgba(255,255,255,.15);
    box-shadow: 0 44px 90px -32px rgba(2,5,16,.9), inset 0 1px 0 rgba(255,255,255,.1); }
  .lp-ph-frame img { display: block; width: 100%; height: auto; border-radius: 32px; }
  .lp-ph-back { width: min(46%, 236px); left: 1%; top: 4%; transform: rotate(-7deg);
    animation: lpFloatB 6.5s ease-in-out infinite; }
  .lp-ph-front { width: min(50%, 258px); right: 2%; bottom: 2%; transform: rotate(4.5deg); z-index: 2;
    animation: lpFloatA 5.5s ease-in-out infinite; }
  @keyframes lpFloatA { 0%,100% { transform: rotate(4.5deg) translateY(0); } 50% { transform: rotate(4.5deg) translateY(-11px); } }
  @keyframes lpFloatB { 0%,100% { transform: rotate(-7deg) translateY(0); } 50% { transform: rotate(-7deg) translateY(9px); } }
  .lp-ph-tag { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); z-index: 3;
    white-space: nowrap; padding: 6px 13px; border-radius: 999px;
    font: 700 11.5px/1 'Inter', sans-serif; letter-spacing: .02em; color: #fff;
    box-shadow: 0 8px 20px -8px rgba(2,5,16,.8), inset 0 1px 0 rgba(255,255,255,.28); }
  .lp-ph-tag-mon { background: linear-gradient(to bottom, #6a62f0, var(--lpIndDk)); }
  .lp-ph-tag-elv { background: linear-gradient(to bottom, #8e87ff, #5a50e8); }

  .lp-fcard { position: absolute; z-index: 4; display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 14px; white-space: nowrap;
    background: rgba(13,18,38,.55); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255,255,255,.16); box-shadow: 0 10px 30px rgba(2,5,16,.5); }
  .lp-fcard-ico { display: inline-flex; align-items: center; }
  .lp-ico-ind { color: #a5b4fc; }
  .lp-ico-fla { color: #fb923c; }
  .lp-fcard-val { font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif; color: #fff; }
  .lp-fcard-sub { font: 500 10.5px/1.2 'Inter', sans-serif; color: rgba(255,255,255,.5); margin-top: 2px; }
  .lp-fcard-1 { top: 9%; left: -14px; animation: lpFc 5.5s ease-in-out infinite; }
  .lp-fcard-2 { bottom: 13%; right: -10px; animation: lpFc 5.5s ease-in-out 1.6s infinite; }
  @keyframes lpFc { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

  .lp-mascot { position: absolute; z-index: 5; bottom: -12px; left: 22%; width: 108px; height: 108px;
    object-fit: contain; pointer-events: none;
    filter: drop-shadow(0 16px 30px rgba(0,0,0,.5));
    animation: lpMascIn .7s cubic-bezier(.34,1.56,.64,1) .5s both, lpMascFloat 4.5s ease-in-out 1.2s infinite; }
  @keyframes lpMascIn { from { opacity: 0; transform: scale(.5) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes lpMascFloat { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-9px) rotate(2deg); } }

  /* ── Barre de confiance à cheval sur la couture ── */
  .lp-trust { position: relative; z-index: 6; display: flex; align-items: center; justify-content: center;
    gap: 8px 30px; flex-wrap: wrap; max-width: 860px; margin: 44px auto -34px; transform: translateY(-6px);
    padding: 17px 26px; background: #fff; border: 1px solid var(--lpLine); border-radius: 18px;
    box-shadow: 0 26px 60px -28px rgba(13,18,38,.35); }
  .lp-trust-it { display: inline-flex; align-items: center; gap: 9px;
    font: 600 13.5px/1.3 'Inter', sans-serif; color: var(--lpInk); }
  .lp-trust-it svg { color: var(--lpInd); flex-shrink: 0; }

  /* ── Sections ── */
  .lp-sec { max-width: 1020px; margin: 0 auto; padding: 76px 22px 64px; color: var(--lpInk); }
  .lp-sec-paper { max-width: none; background: var(--lpPaper); }
  .lp-sec-paper .lp-sec-inner { max-width: 1020px; margin: 0 auto; }
  .lp-eyebrow { display: flex; align-items: center; justify-content: center; gap: 12px;
    font: 700 12px/1 'Inter', sans-serif; letter-spacing: .14em; text-transform: uppercase;
    color: var(--lpInd); margin-bottom: 14px; }
  /* petit rappel du motif ligne médiane */
  .lp-eyebrow::before, .lp-eyebrow::after { content: ''; width: 26px; height: 0;
    border-top: 2px dashed rgba(79,70,229,.4); }
  .lp-eyebrow-lt { color: #a5b4fc; }
  .lp-eyebrow-lt::before, .lp-eyebrow-lt::after { border-top-color: rgba(165,180,252,.4); }
  .lp-h2 { font: 800 clamp(26px, 4vw, 37px)/1.14 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.028em; text-align: center; margin: 0 0 12px; color: var(--lpInk); text-wrap: balance; }
  .lp-h2-lt { color: #fff; }
  .lp-sub { text-align: center; color: var(--lpMut); font: 400 16px/1.6 'Inter'; margin: 0 auto 30px; max-width: 56ch; }

  /* ── Problème (éditorial numéroté) ── */
  .lp-problem { padding-bottom: 70px; }
  .lp-prob-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 38px; }
  .lp-prob-it { border-top: 2px solid var(--lpInk); padding-top: 18px; }
  .lp-prob-n { font: 800 30px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: -.03em;
    color: var(--lpInd); margin-bottom: 12px; }
  .lp-prob-it h3 { font: 700 18px/1.25 'Plus Jakarta Sans'; margin: 0 0 8px; color: var(--lpInk); }
  .lp-prob-it p { font: 400 15px/1.65 'Inter'; color: var(--lpMut); margin: 0; }
  .lp-prob-kicker { text-align: center; margin: 44px 0 0;
    font: 700 17px/1.4 'Plus Jakarta Sans', sans-serif; color: var(--lpInk); }

  /* ── Bento features ── */
  .lp-bento { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; margin-top: 34px; }
  .lp-cell { border-radius: 22px; padding: 26px; background: var(--lpPaper);
    border: 1px solid var(--lpLine); display: flex; flex-direction: column; }
  .lp-cell-7 { grid-column: span 7; }
  .lp-cell-5 { grid-column: span 5; }
  .lp-cell h3 { font: 700 19px/1.25 'Plus Jakarta Sans'; margin: 18px 0 7px; color: var(--lpInk); }
  .lp-cell p { font: 400 15px/1.65 'Inter'; color: var(--lpMut); margin: 0; }
  .lp-cell-dark { background: linear-gradient(160deg, #101732, var(--lpN2) 70%);
    border-color: rgba(255,255,255,.08); }
  .lp-cell-dark h3 { color: #fff; }
  .lp-cell-dark p { color: rgba(255,255,255,.6); }

  .lp-brandmock { display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
    border-radius: 16px; padding: 14px 16px; }
  .lp-brandmock img { width: 40px; height: 40px; object-fit: contain; }
  .lp-bm-name { font: 700 15px/1.2 'Plus Jakarta Sans'; color: #fff; }
  .lp-bm-sub { font: 500 11.5px/1.3 'Inter'; color: rgba(255,255,255,.5); margin-top: 2px; }
  .lp-bm-pill { margin-left: auto; padding: 6px 11px; border-radius: 999px; white-space: nowrap;
    font: 700 11px/1 'Inter'; color: #fff;
    background: linear-gradient(to bottom, var(--lpIndLt), var(--lpIndDk));
    box-shadow: inset 0 1px 0 rgba(255,255,255,.3); }

  .lp-serieviz { display: flex; align-items: center; gap: 7px; padding: 6px 0 2px; }
  .lp-sv-flame { color: #fb923c; display: inline-flex; margin-right: 4px; }
  .lp-sv-dot { width: 13px; height: 13px; border-radius: 50%; background: rgba(13,18,38,.1); }
  .lp-sv-dot.on { background: linear-gradient(to bottom, #fbbf24, #f59e0b); box-shadow: 0 2px 6px -1px rgba(245,158,11,.55); }

  .lp-pretviz { display: flex; flex-direction: column; gap: 9px; padding: 6px 0 2px; }
  .lp-pv-row { display: flex; align-items: center; gap: 10px; }
  .lp-pv-bar { height: 9px; width: var(--w); border-radius: 6px;
    background: linear-gradient(90deg, var(--lpIndLt), var(--lpInd)); opacity: .85; }
  .lp-pv-row:nth-child(2) .lp-pv-bar, .lp-pv-row:nth-child(3) .lp-pv-bar { opacity: .3; }
  .lp-pv-pill { font: 700 10.5px/1 'Inter'; color: #067647; background: rgba(16,185,129,.14);
    border: 1px solid rgba(16,185,129,.3); padding: 4px 8px; border-radius: 999px; }

  .lp-valviz { display: flex; flex-direction: column; gap: 9px; padding: 6px 0 2px; }
  .lp-vv-row { display: flex; align-items: center; gap: 10px; }
  .lp-vv-check { display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 50%; color: #fff; flex-shrink: 0;
    background: linear-gradient(to bottom, #34d399, #10b981); box-shadow: 0 2px 6px -1px rgba(16,185,129,.5); }
  .lp-vv-line { height: 9px; width: var(--w); border-radius: 6px; background: rgba(13,18,38,.12); }

  /* ── Une journée avec (interlude nuit) ── */
  .lp-day { background: linear-gradient(180deg, var(--lpN2), var(--lpN)); padding: 74px 22px 78px; }
  .lp-day .lp-sec-inner { max-width: 1020px; margin: 0 auto; }
  .lp-day-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 36px; }
  .lp-day-card { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
    border-radius: 20px; padding: 24px; }
  .lp-day-chip { display: inline-flex; align-items: center; gap: 7px; margin-bottom: 14px;
    padding: 7px 13px; border-radius: 999px; font: 700 12.5px/1 'Inter'; color: #c7d2fe;
    background: rgba(124,116,255,.14); border: 1px solid rgba(124,116,255,.3); }
  .lp-day-chip-elv { color: #d8d5ff; background: rgba(142,135,255,.16); border-color: rgba(142,135,255,.34); }
  .lp-day-card p { font: 400 15px/1.7 'Inter'; color: rgba(255,255,255,.66); margin: 0; }

  /* ── Comment ça marche ── */
  .lp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 38px; position: relative; }
  /* ligne médiane qui relie les étapes */
  .lp-steps::before { content: ''; position: absolute; top: 22px; left: 16%; right: 16%;
    border-top: 2px dashed rgba(79,70,229,.32); }
  .lp-step { text-align: center; padding: 0 14px; position: relative; }
  .lp-step-n { width: 44px; height: 44px; margin: 0 auto 16px; border-radius: 50%; position: relative; z-index: 1;
    background: linear-gradient(to bottom, var(--lpIndLt), var(--lpIndDk)); color: #fff;
    font: 800 19px/44px 'Plus Jakarta Sans';
    box-shadow: 0 10px 20px -8px rgba(79,70,229,.6), inset 0 1.5px 0 rgba(255,255,255,.32); }
  .lp-step h3 { font: 700 17px/1.25 'Plus Jakarta Sans'; margin: 0 0 6px; color: var(--lpInk); }
  .lp-step p { font: 400 14.5px/1.6 'Inter'; color: var(--lpMut); margin: 0; }

  /* ── Pricing ── */
  .lp-plan { position: relative; max-width: 380px; margin: 22px auto 0; background: #fff;
    border: 1.5px solid rgba(79,70,229,.35); border-radius: 24px; padding: 30px 26px 26px;
    display: flex; flex-direction: column;
    box-shadow: 0 24px 60px -24px rgba(79,70,229,.35); }
  .lp-plan-tag { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); white-space: nowrap;
    background: linear-gradient(to bottom, var(--lpIndLt), var(--lpIndDk)); color: #fff;
    font: 800 11px/1 'Inter'; letter-spacing: .05em; text-transform: uppercase;
    padding: 7px 14px; border-radius: 999px; box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 6px 14px -6px rgba(79,70,229,.6); }
  .lp-plan-name { font: 700 15px/1 'Plus Jakarta Sans'; color: var(--lpInd); }
  .lp-plan-price { font: 800 50px/1 'Plus Jakarta Sans'; letter-spacing: -.035em; margin: 12px 0 4px; color: var(--lpInk); }
  .lp-plan-price span { font: 600 14.5px/1 'Inter'; color: var(--lpMut); margin-left: 5px; letter-spacing: 0; }
  .lp-plan-for { font: 500 13.5px/1.3 'Inter'; color: var(--lpMut); margin-bottom: 18px; }
  .lp-plan-list { list-style: none; padding: 0; margin: 0 0 22px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .lp-plan-list li { position: relative; padding-left: 25px; font: 400 14.5px/1.45 'Inter'; color: var(--lpInk); }
  .lp-plan-list li::before { content: '✓'; content: '✓' / ''; position: absolute; left: 0; color: var(--lpInd); font-weight: 800; }
  .lp-plan-cta { width: 100%; }
  .lp-plan-team { text-align: center; color: var(--lpMut); font: 400 14px/1.6 'Inter'; margin: 24px auto 0; max-width: 520px; }
  .lp-link-btn { background: none; border: 0; padding: 0; cursor: pointer; color: var(--lpInd);
    font: 600 14px/1.6 'Inter'; text-decoration: underline; text-underline-offset: 2px; }

  /* ── FAQ ── */
  .lp-faq-list { max-width: 700px; margin: 30px auto 0; }
  .lp-faq-item { border-bottom: 1px solid var(--lpLine); }
  .lp-faq-item summary { font: 700 15.5px/1.45 'Inter'; padding: 17px 30px 17px 2px; cursor: pointer;
    list-style: none; color: var(--lpInk); position: relative; }
  .lp-faq-item summary::-webkit-details-marker { display: none; }
  .lp-faq-item summary:focus-visible { outline: 2px solid var(--lpInd); outline-offset: 2px; border-radius: 6px; }
  .lp-faq-item summary::after { content: '+'; position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
    color: var(--lpInd); font: 400 22px/1 'Inter'; transition: transform .25s; }
  .lp-faq-item[open] summary::after { transform: translateY(-50%) rotate(45deg); }
  .lp-faq-item p { font: 400 14.5px/1.65 'Inter'; color: var(--lpMut); margin: 0 0 17px; padding-right: 26px; }

  /* ── Formulaire lead ── */
  .lp-leadsec { padding-top: 66px; }
  .lp-lead-card { max-width: 560px; margin: 0 auto; background: #fff;
    border: 1px solid var(--lpLine); border-radius: 24px; padding: 36px 28px;
    box-shadow: 0 24px 60px -30px rgba(13,18,38,.28); }
  .lp-lead-card .lp-h2 { font-size: clamp(23px, 3.4vw, 29px); }
  .lp-form { display: flex; flex-direction: column; gap: 14px; margin-top: 6px; }
  /* indispensable : la règle display:flex ci-dessus écraserait l'attribut hidden */
  .lp-form[hidden] { display: none; }
  .lp-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .lp-field { display: flex; flex-direction: column; gap: 6px; }
  .lp-field label { font: 600 13px/1 'Inter'; color: var(--lpInk); }
  .lp-field input, .lp-field textarea { font: 400 16px/1.4 'Inter'; color: var(--lpInk);
    border: 1.5px solid var(--lpLine); border-radius: 12px; padding: 13px 14px; background: #fff;
    width: 100%; box-sizing: border-box; min-height: 44px; }
  .lp-field input:focus, .lp-field textarea:focus { outline: none; border-color: var(--lpInd);
    box-shadow: 0 0 0 3px rgba(79,70,229,.16); }
  .lp-form-submit { width: 100%; margin-top: 4px; }
  .lp-form-err { color: #dc2626; font: 600 13.5px/1.4 'Inter'; margin: 4px 0 0; }
  .lp-form-ok { text-align: center; padding: 18px 6px; }
  .lp-ok-ic { width: 56px; height: 56px; margin: 0 auto 14px; border-radius: 50%;
    background: linear-gradient(to bottom, #34d399, #10b981); color: #fff;
    font: 800 28px/56px 'Inter'; box-shadow: 0 10px 22px -8px rgba(16,185,129,.6), inset 0 1.5px 0 rgba(255,255,255,.35); }
  .lp-form-ok h3 { font: 800 22px/1.2 'Plus Jakarta Sans'; margin: 0 0 8px; color: var(--lpInk); }
  .lp-form-ok p { font: 400 15px/1.5 'Inter'; color: var(--lpMut); margin: 0; }

  /* ── Footer nuit ── */
  .lp-foot { background: var(--lpN); color: #fff;
    padding: 40px 22px calc(env(safe-area-inset-bottom,0px) + 36px);
    display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .lp-foot-brand { display: flex; align-items: center; gap: 8px; font: 800 17px/1 'Plus Jakarta Sans'; }
  .lp-foot-brand img { width: 22px; height: 22px; }
  .lp-foot-tag { font: 500 13px/1.4 'Inter'; color: rgba(255,255,255,.62); }
  .lp-foot-links { display: flex; align-items: center; gap: 18px; margin-top: 6px; }
  .lp-foot-links a, .lp-foot-login { font: 600 13.5px/1 'Inter'; color: rgba(255,255,255,.6);
    background: none; border: 0; cursor: pointer; padding: 16px 6px; margin: -12px -6px; }
  .lp-foot-links a:hover, .lp-foot-login:hover { color: #fff; }
  .lp-foot-copy { font: 400 12px/1 'Inter'; color: rgba(255,255,255,.55); }

  /* ── Reveal au scroll ── */
  .lp-rev { opacity: 0; transform: translateY(22px);
    transition: opacity .65s cubic-bezier(.2,.7,.3,1), transform .65s cubic-bezier(.2,.7,.3,1); }
  .lp-rev.in { opacity: 1; transform: none; }
  .lp-rev .lp-cell, .lp-rev .lp-prob-it, .lp-rev .lp-day-card, .lp-rev .lp-step, .lp-rev .lp-show-card {
    opacity: 0; transform: translateY(14px);
    transition: opacity .55s cubic-bezier(.2,.7,.3,1), transform .55s cubic-bezier(.2,.7,.3,1),
                box-shadow .25s ease, border-color .25s ease; }
  .lp-rev.in .lp-cell, .lp-rev.in .lp-prob-it, .lp-rev.in .lp-day-card, .lp-rev.in .lp-step, .lp-rev.in .lp-show-card {
    opacity: 1; transform: none; }
  .lp-rev.in .lp-bento > :nth-child(2), .lp-rev.in .lp-prob-grid > :nth-child(2),
  .lp-rev.in .lp-day-grid > :nth-child(2), .lp-rev.in .lp-steps > :nth-child(2),
  .lp-rev.in .lp-show-strip > :nth-child(2) { transition-delay: .1s; }
  .lp-rev.in .lp-bento > :nth-child(3), .lp-rev.in .lp-prob-grid > :nth-child(3),
  .lp-rev.in .lp-day-grid > :nth-child(3), .lp-rev.in .lp-steps > :nth-child(3),
  .lp-rev.in .lp-show-strip > :nth-child(3) { transition-delay: .2s; }
  .lp-rev.in .lp-bento > :nth-child(4) { transition-delay: .3s; }

  /* ── Hover lift (desktop pointeur fin) ── */
  @media (hover: hover) and (pointer: fine) {
    .lp-cell:hover, .lp-day-card:hover, .lp-plan:hover {
      transform: translateY(-4px); transition-delay: 0s !important;
      box-shadow: 0 20px 44px -20px rgba(13,18,38,.22); }
    .lp-cell-dark:hover { box-shadow: 0 20px 44px -18px rgba(2,5,16,.55); }
    .lp-show-card:hover .lp-show-phone { transform: translateY(-7px);
      box-shadow: 0 44px 78px -32px rgba(8,12,28,.7); }
  }

  /* ── Showcase ── */
  .lp-show { padding-top: 90px; }
  .lp-show-tabs { display: flex; width: fit-content; gap: 5px; padding: 5px; margin: 4px auto 36px;
    border-radius: 999px; background: var(--lpN2);
    box-shadow: 0 14px 34px -16px rgba(11,16,32,.45), inset 0 1px 0 rgba(255,255,255,.08); }
  .lp-show-tab { border: 0; background: transparent; cursor: pointer; border-radius: 999px;
    padding: 12px 24px; min-height: 44px; font: 700 14.5px/1 'Inter', sans-serif; color: rgba(255,255,255,.55);
    transition: color .25s, background .25s, box-shadow .25s, transform .1s; }
  .lp-show-tab:active { transform: translateY(1px); }
  .lp-show-tab.is-active { color: #fff;
    background: linear-gradient(to bottom, var(--lpIndLt), var(--lpIndDk));
    box-shadow: 0 6px 16px -6px rgba(79,70,229,.7), inset 0 1px 0 rgba(255,255,255,.28); }

  .lp-show-panel[hidden] { display: none; }
  .lp-show-panel { animation: lpShowFade .42s cubic-bezier(.2,.7,.3,1); }
  @keyframes lpShowFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

  .lp-show-strip { display: flex; gap: 22px; justify-content: center; align-items: flex-start; }
  .lp-show-card { width: 252px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; margin: 0; }
  .lp-show-phone { border-radius: 32px; padding: 7px; overflow: hidden;
    background: linear-gradient(160deg, #232c45, #0b1120); border: 1px solid rgba(255,255,255,.14);
    box-shadow: 0 32px 64px -30px rgba(8,12,28,.62), inset 0 2px 0 rgba(255,255,255,.08);
    transition: transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s; }
  .lp-show-phone img { display: block; width: 100%; height: auto; border-radius: 25px; }
  .lp-show-card figcaption { display: flex; flex-direction: column; gap: 6px; padding: 0 4px; }
  .lp-show-caphead { display: flex; align-items: center; gap: 9px; }
  .lp-show-step { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; border-radius: 8px; background: rgba(79,70,229,.13);
    color: var(--lpInd); font: 800 12px/1 'Plus Jakarta Sans', sans-serif; }
  .lp-show-caphead strong { font: 700 16px/1.25 'Plus Jakarta Sans', sans-serif; color: var(--lpInk); }
  .lp-show-desc { font: 400 13.5px/1.55 'Inter', sans-serif; color: var(--lpMut); }

  /* ── Reduced motion : tout figé, tout visible ── */
  @media (prefers-reduced-motion: reduce) {
    .lp-blob, .lp-road path, .lp-ph-back, .lp-ph-front, .lp-fcard-1, .lp-fcard-2,
    .lp-mascot, .lp-badge-pulse, .lp-show-panel { animation: none; }
    .lp-rev, .lp-rev .lp-cell, .lp-rev .lp-prob-it, .lp-rev .lp-day-card,
    .lp-rev .lp-step, .lp-rev .lp-show-card { opacity: 1; transform: none; transition: none; }
    .lp-ph-back { transform: rotate(-7deg); }
    .lp-ph-front { transform: rotate(4.5deg); }
    .lp-cell:hover, .lp-day-card:hover, .lp-plan:hover { transform: none; }
    .lp-show-card:hover .lp-show-phone { transform: none; }
  }

  /* ── Responsive ── */
  @media (max-width: 920px) {
    .lp-hero-inner { grid-template-columns: 1fr; text-align: center; padding: 52px 22px 8px; gap: 44px; }
    .lp-h1 { margin-inline: auto; }
    .lp-lead { margin-inline: auto; }
    .lp-hero-badge { margin-left: auto; margin-right: auto; }
    .lp-hero-cta, .lp-hero-chips { justify-content: center; }
    /* width explicite : enfants tous en absolu + marges auto → sinon largeur 0 */
    .lp-stage { width: min(100%, 430px); margin: 14px auto 0; height: clamp(380px, 104vw, 470px); }
    .lp-ph-back { left: 0; }
    .lp-ph-front { right: 0; }
    .lp-fcard-1 { left: -6px; top: 13%; }
    .lp-fcard-2 { right: -6px; bottom: 9%; }
    .lp-mascot { width: 88px; height: 88px; left: 16%; bottom: -8px; }
    .lp-trust { margin-inline: 18px; gap: 8px 22px; padding: 15px 18px; }
    .lp-nav-cta { display: none; }
    .lp-prob-grid, .lp-day-grid, .lp-steps { grid-template-columns: 1fr; }
    .lp-prob-grid { gap: 26px; }
    .lp-steps::before { display: none; }
    .lp-steps { gap: 30px; }
    .lp-bento { grid-template-columns: 1fr; }
    .lp-cell-7, .lp-cell-5 { grid-column: auto; }
  }
  @media (max-width: 460px) {
    .lp-row2 { grid-template-columns: 1fr; }
    .lp-trust { flex-direction: column; align-items: flex-start; gap: 10px; }
    .lp-btn-lg { width: 100%; }
    .lp-btn-ghost-hero { width: 100%; justify-content: center; }
  }

  /* Mobile/tablette : filmstrip horizontal scroll-snap (860px : en dessous,
     3 cartes × 252px + gaps = 800px ne tiennent plus sans rognage) */
  @media (max-width: 860px) {
    .lp-show-strip { justify-content: flex-start; overflow-x: auto; scroll-snap-type: x mandatory;
      margin: 0 -22px; padding: 4px 22px 14px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .lp-show-strip::-webkit-scrollbar { display: none; }
    .lp-show-card { scroll-snap-align: center; width: 76vw; max-width: 300px; }
  }
</style>`;
