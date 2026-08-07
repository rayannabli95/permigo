#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// Garde-fou anti-récidive du bug "vieux compte qui persiste" (07-08/08/2026).
//
// Pourquoi ce script existe : `account-cache.js` centralise la purge des
// clés localStorage liées à un compte, mais RIEN n'empêchait avant qu'un
// développeur ajoute une nouvelle clé `localStorage.setItem(...)` ailleurs
// dans `src/` sans l'ajouter au registre — recréant exactement le bug
// corrigé. Ce script grep chaque `localStorage.setItem(...)` littéral de
// `src/`, résout la clé (chaîne directe, ou variable `const X = "..."`
// déclarée dans le même fichier — le pattern dominant du code), et échoue
// si elle n'est ni dans `ACCOUNT_SCOPED_KEYS`/`ACCOUNT_SCOPED_PREFIXES`
// (account-cache.js), ni dans `DEVICE_SETTING_ALLOWLIST` ci-dessous (un
// réglage d'appareil qui DOIT survivre au changement de compte : thème,
// langue, son, consentement cookies...).
//
// Lancé par `npm run lint`. Une clé non reconnue casse le lint : c'est
// voulu, choisir sciemment où elle va (compte ou appareil) fait partie du
// travail d'ajouter la clé, pas un oubli à rattraper plus tard.
// ═══════════════════════════════════════════════════════════════
import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import {
  ACCOUNT_SCOPED_KEYS,
  ACCOUNT_SCOPED_PREFIXES,
} from "../src/utils/account-cache.js";

// Réglages d'APPAREIL, jamais de compte : ils doivent survivre au
// changement de compte sur le même téléphone. Whitelist explicite plutôt
// qu'un test "tout ce qui n'est pas dans account-cache.js passe" — sinon
// une vraie fuite de compte se glisserait silencieusement dans cette liste.
const DEVICE_SETTING_ALLOWLIST = [
  "permigo-sound", // sound.js — son on/off
  "permigo-launched", // sound.js — jingle de lancement joué une fois/session
  "permigo-parcours-played", // sound.js — jingle parcours joué une fois/session
  "permigo_theme", // theme.js — thème clair/sombre
  "permigo_cookie_consent", // cookie-banner.js
  "permigo_quiz_muted", // speech.js — lecture vocale des questions
  "permigo-a2hs-next", // install-nudge.js — cadence du prompt "ajouter à l'écran d'accueil"
  "permigo-a2hs-off", // install-nudge.js — "ne plus jamais proposer"
  "permigo-a2hs-vm-next", // install-nudge.js — cadence du prompt "moment de valeur"
  "permigo-push-prime-next", // push-prime.js — cadence du nudge pré-permission push
  "permigo_lang", // lang.js — langue affichée sur cet appareil
  "permigo_lang_explicit", // lang.js / login.js — la langue a été choisie explicitement
  "permigo_lang_src", // lang.js — d'où vient la langue affichée (détectée vs choisie)
  "permigo-accent", // accent.js — couleur d'accent choisie
  "permigo-accent-migrated-violet", // accent.js — marqueur de migration one-shot
  "duel_lang", // duel.js — langue du mini-jeu duel
  "pv_lang", // pass.js — langue de la page publique (visiteur, avant tout compte)
  "permigo_parcours_theme", // parcours.js — thème clair/sombre de la vue (visuel, pas progression)
  "permigo-chunk-reload", // router.js — anti-boucle de reload technique
  "permigo-remember-email", // login.js — email mémorisé (pas une donnée de compte)
  // Clés posées directement par les tests e2e (tests/e2e/smoke.spec.js) pour
  // sauter les tutoriels au login : ce script ne scanne QUE src/, mais elles
  // restent listées ici pour rester correctes s'il scanne un jour tests/ aussi.
  "permigo-parcours-tuto-v1",
  "permigo-theory-tuto-v1",
  "pg-nav-intro-done",
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (extname(p) === ".js") out.push(p);
  }
  return out;
}

function resolveConstStrings(source) {
  // `const NAME = "valeur";` ou `const NAME = 'valeur';` — le pattern quasi
  // exclusif de ce code base pour nommer une clé localStorage.
  const map = new Map();
  const re = /const\s+([A-Z_][A-Z0-9_]*)\s*=\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(source))) map.set(m[1], m[2]);
  return map;
}

function findSetItemKeys(source, constMap) {
  const found = []; // { raw, resolved, dynamic }
  const re = /localStorage\.setItem\(\s*([^,]+?)\s*,/g;
  let m;
  while ((m = re.exec(source))) {
    const raw = m[1].trim();
    if (/^["']/.test(raw)) {
      // Chaîne littérale directe.
      found.push({ raw, resolved: raw.slice(1, -1), dynamic: false });
    } else if (/^`/.test(raw)) {
      // Template literal : on ne garde que le préfixe statique avant le 1er ${.
      const staticPrefix = raw.slice(1).split("${")[0];
      found.push({ raw, resolved: staticPrefix, dynamic: true });
    } else if (/^[A-Z_][A-Z0-9_]*$/.test(raw) && constMap.has(raw)) {
      found.push({ raw, resolved: constMap.get(raw), dynamic: false });
    } else {
      // Expression non résolue statiquement (accès dynamique, concat
      // complexe...) : on ne peut pas la vérifier ici, on la signale en
      // avertissement plutôt que de faire échouer le build sur un faux positif.
      found.push({ raw, resolved: null, dynamic: false, unresolved: true });
    }
  }
  return found;
}

function main() {
  const srcDir = new URL("../src", import.meta.url).pathname;
  const files = walk(srcDir);
  const known = new Set([...ACCOUNT_SCOPED_KEYS, ...DEVICE_SETTING_ALLOWLIST]);
  const prefixes = ACCOUNT_SCOPED_PREFIXES;

  const missing = [];
  const unresolved = [];

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    if (!source.includes("localStorage.setItem")) continue;
    const constMap = resolveConstStrings(source);
    const rel = file.replace(srcDir, "src");
    for (const entry of findSetItemKeys(source, constMap)) {
      if (entry.unresolved) {
        unresolved.push({ file: rel, raw: entry.raw });
        continue;
      }
      const { resolved, dynamic } = entry;
      const isKnown = dynamic
        ? prefixes.some((p) => resolved.startsWith(p) || p.startsWith(resolved))
        : known.has(resolved) || prefixes.some((p) => resolved.startsWith(p));
      if (!isKnown) missing.push({ file: rel, key: resolved, dynamic });
    }
  }

  if (unresolved.length) {
    console.warn(
      `\n⚠️  ${unresolved.length} appel(s) localStorage.setItem() avec une clé non résolue statiquement (vérifie-les à la main) :`,
    );
    unresolved.forEach((u) => console.warn(`   ${u.file} — ${u.raw}`));
  }

  if (missing.length) {
    console.error(
      `\n❌ ${missing.length} clé(s) localStorage écrite(s) sans être déclarée(s) :\n`,
    );
    missing.forEach((m) =>
      console.error(`   "${m.key}"${m.dynamic ? " (préfixe dynamique)" : ""} — ${m.file}`),
    );
    console.error(
      `\nSi cette clé dépend d'UN COMPTE (progression, quota, préférence liée à un élève) :` +
        `\n  → ajoute-la à ACCOUNT_SCOPED_KEYS (ou ACCOUNT_SCOPED_PREFIXES si son nom varie) dans src/utils/account-cache.js.` +
        `\nSi c'est un réglage d'APPAREIL qui doit survivre au changement de compte (thème, langue, son...) :` +
        `\n  → ajoute-la à DEVICE_SETTING_ALLOWLIST dans scripts/check-account-cache.mjs.\n`,
    );
    process.exit(1);
  }

  console.log(
    `✅ account-cache : ${files.length} fichiers scannés, toutes les clés localStorage sont déclarées.`,
  );
}

main();
