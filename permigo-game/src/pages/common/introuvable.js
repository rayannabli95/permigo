// ═══════════════════════════════════════════════════════════════
// Page « introuvable » (404) — montée par le router quand le hash ne
// correspond à aucune route (#/route-bidon). Avant, une route inconnue
// retombait SANS UN MOT sur la landing (visiteur) ou l'accueil du rôle
// (connecté) — déroutant, l'utilisateur croyait à un bug.
// Le bouton renvoie sur #/ : le router y résout la home du rôle si
// connecté (map[role].default), la landing publique sinon.
// ═══════════════════════════════════════════════════════════════
import { track } from "@/services/analytics.js";

export function mount(root) {
  try {
    track("page_view", { page: "introuvable", hash: location.hash });
  } catch {
    /* analytics jamais bloquante */
  }
  root.innerHTML = `
  <style>
    .nf-wrap{min-height:70vh;display:flex;flex-direction:column;align-items:center;
      justify-content:center;text-align:center;
      padding:32px 24px calc(32px + env(safe-area-inset-bottom));}
    .nf-img{width:120px;height:120px;object-fit:contain;margin-bottom:16px;}
    .nf-title{font-size:22px;font-weight:800;color:var(--ink);margin:0 0 8px;}
    .nf-sub{font-size:15px;color:var(--mu);margin:0 0 24px;max-width:320px;}
    .nf-cta{display:inline-flex;align-items:center;justify-content:center;
      min-height:44px;padding:12px 28px;border-radius:14px;border:0;
      background:var(--a);color:var(--a-txt);font-size:16px;font-weight:700;
      text-decoration:none;cursor:pointer;}
  </style>
  <div class="nf-wrap">
    <img class="nf-img" src="/skins/mascot-wait.png" alt="" role="presentation"
         loading="lazy" onerror="this.style.display='none'" />
    <h1 class="nf-title">Cette page n'existe pas</h1>
    <p class="nf-sub">L'adresse a peut-être changé, ou il y a une faute de frappe dans le lien.</p>
    <a class="nf-cta" href="#/">Retour à l'accueil</a>
  </div>`;
}
