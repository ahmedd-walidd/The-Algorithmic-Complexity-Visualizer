import { buildPreviewPath } from './previewPath';

export function getSimulationPhaseDisplay(simulationPhase) {
  switch (simulationPhase) {
    case 'idle':
      return 'Idle';
    case 'paused':
      return 'Paused';
    case 'visited':
      return 'Traversing...';
    case 'path':
      return 'Showing Path...';
    case 'done':
      return 'Done';
    default:
      return 'Idle';
  }
}

export function getActiveHoverComparison({ isRaceMode, isPaused, pausedComparison, quizState }) {
  if (isRaceMode) return null;

  if (isPaused && pausedComparison) {
    return {
      algorithm: pausedComparison.algorithm,
      minComparison: pausedComparison.minComparison,
    };
  }

  if (quizState.active && quizState.ruleMeta) {
    return {
      algorithm: quizState.ruleMeta.algorithm,
      minComparison:
        quizState.ruleMeta.algorithm === 'astar'
          ? {
              minF: quizState.ruleMeta.minF,
              minHAmongMinF: quizState.ruleMeta.minHAmongMinF,
              minInsertionOrderAmongTiedCandidates:
                quizState.ruleMeta.minInsertionOrderAmongTiedCandidates,
            }
          : {
              minG: quizState.ruleMeta.minG,
            },
    };
  }

  return null;
}

export function getHoveredNodeDecision(hoveredFrontierNode, activeHoverComparison) {
  if (!hoveredFrontierNode || !activeHoverComparison) return { text: '', tone: '' };

  if (activeHoverComparison.algorithm === 'astar') {
    const minF = activeHoverComparison.minComparison?.minF;
    const minHAmongMinF = activeHoverComparison.minComparison?.minHAmongMinF;
    const minInsertionOrderAmongTiedCandidates =
      activeHoverComparison.minComparison?.minInsertionOrderAmongTiedCandidates;
    const hasMinF = hoveredFrontierNode.f === minF;
    const hasBestTieBreak = hoveredFrontierNode.h === minHAmongMinF;
    const hasBestInsertionOrder =
      hoveredFrontierNode.insertionOrder === minInsertionOrderAmongTiedCandidates;

    if (hasMinF && hasBestTieBreak && hasBestInsertionOrder) {
      return {
        text: 'Would be chosen next: minimum frontier f and lower Manhattan h.',
        tone: 'chosen',
      };
    }

    if (!hasMinF) {
      return {
        text: `Not chosen yet: f=${hoveredFrontierNode.f} is larger than frontier minimum f=${minF}.`,
        tone: 'not-chosen',
      };
    }

    if (hasBestTieBreak) {
      return {
        text: 'Not chosen yet: it ties on f and h with another frontier candidate.',
        tone: 'not-chosen',
      };
    }

    return {
      text: `Not chosen yet: ties on f=${hoveredFrontierNode.f}, but h=${hoveredFrontierNode.h} is larger than minimum tie-break h=${minHAmongMinF}.`,
      tone: 'not-chosen',
    };
  }

  const minG = activeHoverComparison.minComparison?.minG;
  if (hoveredFrontierNode.g === minG) {
    return {
      text: 'Would be chosen next: minimum frontier depth g (BFS queue rule).',
      tone: 'chosen',
    };
  }

  return {
    text: `Not chosen yet: depth g=${hoveredFrontierNode.g} is larger than frontier minimum g=${minG}.`,
    tone: 'not-chosen',
  };
}

export function getHoveredPreviewPaths({
  grid,
  hoveredFrontierNode,
  activeHoverComparison,
  start,
  end,
}) {
  if (!hoveredFrontierNode || !activeHoverComparison) {
    return {
      hoveredForwardPreviewPath: [],
      hoveredBackwardPreviewPath: [],
    };
  }

  const hoveredForwardPreviewPath =
    activeHoverComparison.algorithm === 'astar'
      ? buildPreviewPath(
          grid,
          { row: hoveredFrontierNode.row, col: hoveredFrontierNode.col },
          { row: end.row, col: end.col },
          activeHoverComparison.algorithm
        )
      : [];

  const hoveredBackwardPreviewPath = buildPreviewPath(
    grid,
    { row: start.row, col: start.col },
    { row: hoveredFrontierNode.row, col: hoveredFrontierNode.col },
    'bfs'
  );

  return {
    hoveredForwardPreviewPath,
    hoveredBackwardPreviewPath,
  };
}

export function getScoreAverages(scoreState) {
  if (scoreState.questionsAnswered <= 0) {
    return {
      averageTryAccuracy: 0,
      averageTriesPerQuestion: 0,
    };
  }

  return {
    averageTryAccuracy: scoreState.totalAccuracyScore / scoreState.questionsAnswered,
    averageTriesPerQuestion: scoreState.totalAttempts / scoreState.questionsAnswered,
  };
}

export function getRaceResultComparison({ isRaceMode, stats }) {
  if (!isRaceMode || !stats?.bfs || !stats?.astar) return null;

  const buildMetricComparison = (currentValue, otherValue) => {
    if (currentValue === otherValue) {
      return {
        tone: 'equal',
        note: `matches the other algorithm at ${currentValue}`,
      };
    }

    if (currentValue < otherValue) {
      return {
        tone: 'lower',
        note: `lower than the other algorithm (${otherValue})`,
      };
    }

    return {
      tone: 'higher',
      note: `higher than the other algorithm (${otherValue})`,
    };
  };

  return {
    bfs: {
      visited: buildMetricComparison(stats.bfs.visited, stats.astar.visited),
      path: buildMetricComparison(stats.bfs.path, stats.astar.path),
    },
    astar: {
      visited: buildMetricComparison(stats.astar.visited, stats.bfs.visited),
      path: buildMetricComparison(stats.astar.path, stats.bfs.path),
    },
  };
}

export function getNextTraversalComparison({ isRaceMode, run, formalTrace }) {
  if (isRaceMode) return null;
  if (run.phase !== 'visited') return null;

  const nextIndex = run.visitedIndex;
  const nextTrace = formalTrace[nextIndex];
  if (!nextTrace) return null;

  const frontier = nextTrace.frontierBeforeExpansion || [];
  if (frontier.length === 0) {
    return {
      stepIndex: nextIndex,
      chosenNode: nextTrace.expandedNode,
      chosenScores: nextTrace.expandedScores,
      frontierNodes: [],
      candidateNodes: [],
      minComparison: null,
      algorithm: nextTrace.algorithm,
    };
  }

  if (nextTrace.algorithm === 'astar') {
    const minF = Math.min(...frontier.map((node) => node.f));
    const minHAmongMinF = Math.min(
      ...frontier.filter((node) => node.f === minF).map((node) => node.h)
    );
    const minInsertionOrderAmongTiedCandidates = Math.min(
      ...frontier
        .filter((node) => node.f === minF && node.h === minHAmongMinF)
        .map((node) => node.insertionOrder)
    );
    const candidateNodes = frontier
      .filter(
        (node) =>
          node.f === minF &&
          node.h === minHAmongMinF &&
          node.insertionOrder === minInsertionOrderAmongTiedCandidates
      )
      .map((node) => ({
        row: node.row,
        col: node.col,
        g: node.g,
        h: node.h,
        f: node.f,
        insertionOrder: node.insertionOrder,
      }));

    return {
      stepIndex: nextIndex,
      chosenNode: nextTrace.expandedNode,
      chosenScores: nextTrace.expandedScores,
      frontierNodes: frontier.map((node) => ({
        row: node.row,
        col: node.col,
        g: node.g,
        h: node.h,
        f: node.f,
        insertionOrder: node.insertionOrder,
      })),
      candidateNodes,
      minComparison: {
        minF,
        minHAmongMinF,
        minInsertionOrderAmongTiedCandidates,
      },
      algorithm: nextTrace.algorithm,
    };
  }

  const minG = Math.min(...frontier.map((node) => node.g));
  const candidateNodes = frontier
    .filter((node) => node.g === minG)
    .map((node) => ({ row: node.row, col: node.col, g: node.g, h: 0, f: node.g }));

  return {
    stepIndex: nextIndex,
    chosenNode: nextTrace.expandedNode,
    chosenScores: nextTrace.expandedScores,
    frontierNodes: frontier.map((node) => ({
      row: node.row,
      col: node.col,
      g: node.g,
      h: 0,
      f: node.g,
    })),
    candidateNodes,
    minComparison: {
      minG,
    },
    algorithm: nextTrace.algorithm,
  };
}
