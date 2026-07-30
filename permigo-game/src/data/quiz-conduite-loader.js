// Charge seulement la banque réellement utilisée par la route courante.
const QUIZ_LOADERS = {
  C1: () =>
    import("./fiches/monde-1.quiz.json").then((module) => module.default),
  C2: () =>
    import("./fiches/monde-2.quiz.json").then((module) => module.default),
  C3: () =>
    import("./fiches/monde-3.quiz.json").then((module) => module.default),
  C4: () =>
    import("./fiches/monde-4.quiz.json").then((module) => module.default),
};

const quizCache = new Map();

async function loadQuizMonde(prefix) {
  if (!QUIZ_LOADERS[prefix]) return [];
  if (!quizCache.has(prefix)) quizCache.set(prefix, QUIZ_LOADERS[prefix]());
  return quizCache.get(prefix);
}

export async function loadQuizByCode(code) {
  const questions = await loadQuizMonde(String(code || "").slice(0, 2));
  return questions.filter((question) => question.code === code);
}

export async function loadJeuFauteSession(n = 8) {
  const { default: jeuFaute } = await import("./jeu-faute.json");
  return [...jeuFaute]
    .sort(() => Math.random() - 0.5)
    .slice(0, n)
    .map((item) => ({
      q: item.scene,
      options: item.options,
      correct: item.faute_index,
      explication: item.explication,
      tags: item.tags,
    }));
}
