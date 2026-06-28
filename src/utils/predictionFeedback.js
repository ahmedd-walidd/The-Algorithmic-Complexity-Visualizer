const GAMIFICATION_WEIGHTS = {
  maxQuestionScore: 100,
  maxComboMultiplier: 2.5,
};

function getStreakMultiplier(streak = 0) {
  const multiplier = 1 + Math.min(Math.max(streak, 0), 6) * 0.25;
  return Math.min(multiplier, GAMIFICATION_WEIGHTS.maxComboMultiplier);
}

function getChallengeRank({ attempts = 0 }) {
  if (attempts === 1) return 'Perfect read';
  if (attempts === 2) return 'Recovered';
  return 'Solved by review';
}

export function buildWrongPredictionMessage(row, col, state) {
  const key = `${row}-${col}`;
  const clicked = state?.frontierByKey?.[key];
  const ruleMeta = state?.ruleMeta;

  if (!clicked || !ruleMeta) {
    return 'Incorrect. Formal rule: the next expansion must satisfy the algorithm ordering rule over the current frontier.';
  }

  if (ruleMeta.algorithm === 'astar') {
    const clickedF = clicked.f;
    const clickedH = clicked.h;
    const minF = ruleMeta.minF;
    const minH = ruleMeta.minHAmongMinF;

    if (clickedF > minF) {
      return `Incorrect: this node has f=${clickedF} (g+h=${clicked.g}+${clicked.h}), but A* must choose minimum frontier f=${minF}.`;
    }

    return `Incorrect: this node ties on f=${clickedF}, but its h=${clickedH} is larger than the minimum tie-break h=${minH}.`;
  }

  const clickedG = clicked.g;
  const minG = ruleMeta.minG;
  return `Incorrect: this node is at depth g=${clickedG}, but BFS takes the shallowest node currently in the frontier. The next expansion must have depth g=${minG}.`;
}

export function buildCorrectPredictionMessage(row, col, state) {
  const key = `${row}-${col}`;
  const clicked = state?.frontierByKey?.[key];
  const ruleMeta = state?.ruleMeta;

  if (!clicked || !ruleMeta) {
    return 'Correct. This node satisfies the algorithm ordering rule for the current frontier. Press Continue.';
  }

  if (ruleMeta.algorithm === 'astar') {
    return `Correct: this node has minimum frontier f=${ruleMeta.minF}, and tie-break minimum h=${ruleMeta.minHAmongMinF}. (g+h=${clicked.g}+${clicked.h}=${clicked.f}) Press Continue.`;
  }

  return `Correct: this node has the shallowest frontier depth, g=${ruleMeta.minG}, so it matches the BFS queue rule. Press Continue.`;
}

export function calculateQuestionScore(attempts, options = {}) {
  const {
    frontierSize = 0,
    streak = 0,
  } = options;
  const accuracy = attempts > 0 ? 1 / attempts : 0;
  const frontierBonus = Math.min(18, Math.max(0, frontierSize - 2) * 3);
  const baseScore = Math.round(GAMIFICATION_WEIGHTS.maxQuestionScore * accuracy);
  const comboMultiplier = attempts === 1 ? getStreakMultiplier(streak) : 1;
  const questionScore = Math.max(
    10,
    Math.round((baseScore + frontierBonus) * comboMultiplier)
  );

  return {
    accuracy,
    questionScore,
    frontierBonus,
    comboMultiplier,
    rank: getChallengeRank({ attempts }),
  };
}
