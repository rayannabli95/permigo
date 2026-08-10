// LA PALETTE DE PERMIGO — source unique de vérité des couleurs du monde 3D.
//
// 📖 `docs/PERMIGO_GAME_ART_BIBLE.md` §3. Aucun hexadécimal ne s'écrit ailleurs
// que dans ce fichier : c'est la seule parade structurelle contre la dérive
// gris-beige-bleu qui a fait dire « les designs sont éclatés ».
//
// Deux lois de la bible sont encodées ici :
//   · AUCUN gris pur, AUCUN blanc pur, AUCUN noir pur. Tout a une teinte.
//   · Les véhicules NEUTRES sont désaturés, les PORTEURS d'une scène sont
//     saturés. C'est la couleur qui dit « ceci compte », pas un contour.

// ── Le monde ───────────────────────────────────────────────────────────

export const CIEL = {
  zenith: 0x6fa8e6,
  haut: 0x8fbde9,
  bas: 0xcfe0ee,
  horizon: 0xf3e7cf, // crème chaud : c'est lui qui teinte tous les reflets
  sol: 0xb9a894,
  brume: 0xe8ddc9, // la couleur du brouillard de distance
};

export const SOL = {
  bitume: 0x948b74, // gris CHAUD, jamais bleuté
  roulement: 0x7d7461, // les deux traces de pneus par voie
  marquage: 0xf6f0e0, // blanc cassé chaud, jamais #fff
  caniveau: 0x71684f,
  trottoir: 0xc9b8a2, // sable rosé
  bordure: 0xa4937d, // le chant vertical
  bordureHaut: 0xe6dcc6, // ⭐ le liseré : la face qui attrape le soleil
  terre: 0x9c8f7a,
};

// Six familles. Deux voisines ne partagent jamais la même (règle de rue).
// ⚠️ CALIBRÉES SUR LE RENDU, PAS SUR LE NUANCIER. Le premier essai utilisait
// des teintes franches (corail 0xe2795a, sauge 0x93a883) : à l'écran, sous un
// soleil à 2,2 et une saturation de 1,12, elles ressortaient rouge vif et vert
// pomme. La rue faisait Lego, exactement le risque « Fisher-Price » annoncé
// dans la bible. Une couleur de façade se choisit APRÈS le rendu : la chaîne
// (tone mapping ACES + exposition + étalonnage) sature toujours plus que le
// nuancier. Ces valeurs-ci sont désaturées d'environ un tiers.
export const FACADES = [
  0xdd937c, // corail
  0xdfb779, // ocre
  0xd7a7a2, // rose
  0xa3b596, // sauge
  0xecdfc6, // crème
  0xc88a7a, // brique
];

export const COMMERCES = [0x3f6f74, 0x8a4d68, 0x4a6b52]; // canard · prune · bouteille

export const VEGETATION = {
  ombre: 0x3e7d4f,
  calotte: 0x7cba6e, // la géométrie « côté soleil » de chaque arbre
  tronc: 0x8a6648,
};

export const MOBILIER = { bois: 0x8a6648, metal: 0x4b5568 };

export const VITRE = 0x6f8aa0;

// ── Les acteurs ────────────────────────────────────────────────────────

// Saturation ≤ 18 % : ils font la masse, jamais l'événement.
// ⚠️ L'écart de VALEUR compte plus que l'écart de teinte : cinq neutres tous
// à la même luminosité font une file de briques identiques. On étale donc du
// crème à l'ardoise.
// ⚠️ ASSOMBRIES APRÈS RENDU. Sous un soleil à 2,2, une carrosserie claire et
// lisse renvoie tellement de ciel que ses faces horizontales partent au blanc :
// six voitures de six teintes différentes ressortaient toutes blanches. Le
// nuancier doit viser la valeur qu'on veut À L'ÉCRAN, pas dans un aplat.
export const VEHICULES_NEUTRES = [
  0xb9b2a2, // crème
  0x9e988c, // pierre
  0x848f98, // brume
  0xa89d8a, // sable
  0x76808c, // ardoise
  0x8f8391, // lilas gris
];

// Saturation ≥ 55 % : un porteur de scène est TOUJOURS dans cette famille.
export const VEHICULES_PORTEURS = {
  rouge: 0xd5453c,
  jaune: 0xf0b02f,
  bleu: 0x3565c0,
  vert: 0x2f8f6b,
};

export const PEAU = [0xe8c39e, 0xc68e5f, 0x8a5a3b];

export const VETEMENTS = {
  adulte: [0xa9968a, 0x8c93a0, 0xb0a08c, 0x97a08f, 0xa3919c],
  adulteBas: 0x3a3654,
  // Un acteur de SCÈNE (l'homme qui descend de voiture) a le droit d'être
  // saturé : il fait partie de l'incident, pas du décor.
  acteur: 0xd5453c,
  // ⭐ Les enfants sont les êtres les plus saturés de la rue. C'est de la
  // pédagogie déguisée en direction artistique.
  enfant: [0xf0b02f, 0xd5453c, 0x38b6c9],
};

// ── Le gameplay ────────────────────────────────────────────────────────

export const OR = 0xf2b32c; // récompense UNIQUEMENT. Interdit partout ailleurs.
export const VIOLET = 0x7c5cd8; // la laque de la Cupra du joueur, et la guidance
export const NUIT = 0x1c1633; // notre « noir » : un violet très sombre
export const CREME = 0xf4f0ff; // notre « blanc »

export const OMBRE_HEMISPHERE = 0x8a76a8; // ⭐ signature Y : les ombres violettes

// ── Les outils ─────────────────────────────────────────────────────────

const versHsl = (hex) => {
  const r = ((hex >> 16) & 255) / 255;
  const v = ((hex >> 8) & 255) / 255;
  const b = (hex & 255) / 255;
  const mx = Math.max(r, v, b);
  const mn = Math.min(r, v, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h;
  if (mx === r) h = ((v - b) / d + (v < b ? 6 : 0)) / 6;
  else if (mx === v) h = ((b - r) / d + 2) / 6;
  else h = ((r - v) / d + 4) / 6;
  return [h, s, l];
};

const versHex = (h, s, l) => {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(Math.max(0, Math.min(1, v)) * 255);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
};

// ⭐ LE JITTER. Toute instance répétée (voiture garée, fenêtre, dalle, arbre)
// décale sa couleur. Coût nul, et c'est la moitié de la différence entre
// « des primitives » et « un monde ». Bible §5, outil 1.
export function jitter(hex, alea) {
  const [h, s, l] = versHsl(hex);
  return versHex(
    (h + (alea() - 0.5) * 0.017 + 1) % 1, // ±3° de teinte
    Math.max(0, Math.min(1, s * (1 + (alea() - 0.5) * 0.16))),
    Math.max(0, Math.min(1, l * (1 + (alea() - 0.5) * 0.08))), // ±4 %
  );
}

// ⭐ LE LISERÉ. Toute arête horizontale qui regarde le ciel porte une face
// plus claire. C'est le « trait de pinceau » qui dit qu'un humain a dessiné
// le volume. Bible §5, outil 2.
export function lisere(hex, force = 0.18) {
  const [h, s, l] = versHsl(hex);
  return versHex(h, s * 0.9, Math.min(1, l + force));
}

// L'inverse : le pied d'un mur, l'intérieur d'un passage de roue.
export function assombrir(hex, force = 0.18) {
  const [h, s, l] = versHsl(hex);
  return versHex(h, Math.min(1, s * 1.05), Math.max(0, l - force));
}

export const enCss = (hex) => `#${hex.toString(16).padStart(6, "0")}`;

// Un tirage reproductible dans une liste. 🔴 Jamais Math.random dans le monde :
// deux parties doivent être comparables (bible §2, loi 5).
export const piocher = (liste, alea) =>
  liste[Math.floor(alea() * liste.length) % liste.length];
