const GAMIFICATION_WEIGHTS = {
  alpha: 0.9,
  beta: 0.1,
  maxQuestionScore: 100,
};

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
  return `Incorrect: this node has depth g=${clickedG}, but BFS expands minimum frontier depth first (h=0 -> f=g), so next must have g=${minG}.`;
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

  return `Correct: this node has minimum frontier depth g=${ruleMeta.minG}. In BFS, h=0 so f=g, therefore it is a valid next expansion. Press Continue.`;
}

export function calculateQuestionScore(attempts, responseTimeMs) {
  const accuracy = attempts > 0 ? 1 / attempts : 0;
  const responseSeconds = Math.max(responseTimeMs / 1000, 0);
  const responseComponent = 1 / (1 + responseSeconds);
  const rawScore =
    GAMIFICATION_WEIGHTS.alpha * accuracy + GAMIFICATION_WEIGHTS.beta * responseComponent;

  return {
    accuracy,
    responseSeconds,
    questionScore: Math.round(rawScore * GAMIFICATION_WEIGHTS.maxQuestionScore),
  };
}
