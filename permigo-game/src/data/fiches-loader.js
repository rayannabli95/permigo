// Charge uniquement le chapitre contenant la fiche demandée. Les imports
// littéraux permettent à Vite de produire quatre chunks séparés.
const LOADERS = {
  C1: () => import("./fiches/monde-1.json").then((module) => module.default),
  C2: () => import("./fiches/monde-2.json").then((module) => module.default),
  C3: () => import("./fiches/monde-3.json").then((module) => module.default),
  C4: () => import("./fiches/monde-4.json").then((module) => module.default),
};

const cache = new Map();

async function loadMonde(prefix) {
  if (!LOADERS[prefix]) return [];
  if (!cache.has(prefix)) cache.set(prefix, LOADERS[prefix]());
  return cache.get(prefix);
}

export async function loadFiche(code) {
  const fiches = await loadMonde(String(code || "").slice(0, 2));
  return fiches.find((fiche) => fiche.code === code) || null;
}
