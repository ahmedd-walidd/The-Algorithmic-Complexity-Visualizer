const ALGORITHM_META = {
  bfs: {
    displayName: 'BFS',
    scoringRule: 'h(n)=0, f(n)=g(n)',
    complexity:
      'Time O(|V| + |E|), memory O(|V|). On a 4-neighbor grid, |V| <= rows*cols and |E| <= 2*rows*cols - rows - cols, so BFS is O(rows*cols).',
    
    optimality:
      'BFS is optimal on this unweighted grid because the first time a node is discovered, its g value is the shortest distance from the start.',
  },
  astar: {
    displayName: 'A*',
    scoringRule: 'f(n)=g(n)+h(n)',
    complexity:
      'With a priority queue, time is O(|E| log |V|) and memory is O(|V|). This implementation sorts OPEN each expansion, giving O(sum |OPEN_i| log |OPEN_i| + |E|), worst-case O(|V|^2 log |V|).',
    
    optimality:
      'A* is optimal here because the heuristic is the exact remaining grid distance computed from the goal, so it is admissible and consistent.',
  },
};

export function getAlgorithmMeta(algorithm) {
  return ALGORITHM_META[algorithm] || ALGORITHM_META.bfs;
}

export function formatNodeCoordinate(node) {
  if (!node) return 'N/A';
  return `(${node.row}, ${node.col})`;
}

export function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
  return Number(value).toFixed(digits);
}

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
  return `${(Number(value) * 100).toFixed(digits)}%`;
}

export function formatPathPreview(pathCoordinates, edgeCount = 5) {
  if (!pathCoordinates || pathCoordinates.length === 0) return 'No path reached';
  if (pathCoordinates.length <= edgeCount * 2 + 1) {
    return pathCoordinates.join(' -> ');
  }

  const head = pathCoordinates.slice(0, edgeCount);
  const tail = pathCoordinates.slice(-edgeCount);
  return `${head.join(' -> ')} -> ... -> ${tail.join(' -> ')}`;
}

export function countOpenCells(grid) {
  return grid.reduce(
    (total, row) => total + row.filter((node) => !node.isWall).length,
    0
  );
}

export function countUndirectedEdges(grid) {
  let edges = 0;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col].isWall) continue;
      if (col + 1 < grid[row].length && !grid[row][col + 1].isWall) edges += 1;
      if (row + 1 < grid.length && !grid[row + 1][col].isWall) edges += 1;
    }
  }

  return edges;
}

export function estimateEffectiveBranchingFactor(expandedNodes, solutionDepth) {
  if (!Number.isFinite(expandedNodes) || !Number.isFinite(solutionDepth)) return null;
  if (expandedNodes <= 0 || solutionDepth < 0) return null;
  if (solutionDepth === 0) return expandedNodes <= 1 ? 0 : expandedNodes;
  if (expandedNodes <= solutionDepth + 1) return 1;

  let low = 1;
  let high = Math.max(2, expandedNodes);

  const expansionSum = (b) => {
    if (Math.abs(b - 1) < 1e-9) return solutionDepth + 1;
    return (b ** (solutionDepth + 1) - 1) / (b - 1);
  };

  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2;
    if (expansionSum(mid) < expandedNodes) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

export function analyzeTraceBranching(formalTrace = []) {
  const expansionCount = formalTrace.length;
  if (expansionCount === 0) {
    return {
      expansionCount: 0,
      generatedAttempts: 0,
      legalSuccessors: 0,
      acceptedSuccessors: 0,
      rejectedSuccessors: 0,
      averageGeneratedBranching: 0,
      averageLegalBranching: 0,
      averageAcceptedBranching: 0,
      maxFrontier: 0,
    };
  }

  const totals = formalTrace.reduce(
    (acc, step) => {
      const attempts = step.attempts || [];
      const legal = attempts.filter((attempt) => attempt.reason !== 'wall');
      const accepted = attempts.filter((attempt) => attempt.decision === 'accepted');
      const rejected = attempts.filter((attempt) => attempt.decision === 'rejected');

      acc.generatedAttempts += attempts.length;
      acc.legalSuccessors += legal.length;
      acc.acceptedSuccessors += accepted.length;
      acc.rejectedSuccessors += rejected.length;
      acc.maxFrontier = Math.max(acc.maxFrontier, step.frontierBeforeExpansion?.length || 0);
      return acc;
    },
    {
      generatedAttempts: 0,
      legalSuccessors: 0,
      acceptedSuccessors: 0,
      rejectedSuccessors: 0,
      maxFrontier: 0,
    }
  );

  return {
    expansionCount,
    ...totals,
    averageGeneratedBranching: totals.generatedAttempts / expansionCount,
    averageLegalBranching: totals.legalSuccessors / expansionCount,
    averageAcceptedBranching: totals.acceptedSuccessors / expansionCount,
  };
}

function buildManifestoUsage({ algorithm, grid, formalTrace, pathNodes, meta }) {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const totalCells = rows * cols;
  const openCells = countOpenCells(grid);
  const wallCells = totalCells - openCells;
  const finalTrace = formalTrace.length > 0 ? formalTrace[formalTrace.length - 1] : null;
  const totalNeighborAudits = formalTrace.reduce(
    (sum, step) => sum + (step.attempts?.length || 0),
    0
  );
  const acceptedNeighborAudits = formalTrace.reduce(
    (sum, step) =>
      sum + (step.attempts || []).filter((attempt) => attempt.decision === 'accepted').length,
    0
  );
  const rejectedNeighborAudits = totalNeighborAudits - acceptedNeighborAudits;
  const equationChecks = formalTrace.filter((step) => step.proofChecks?.equationHolds).length;
  
  const maxRetrievedDocumentsPerStep = formalTrace.length > 0 ? 3 : 0;
  const schemaDimensions =
    algorithm === 'astar'
      ? [
          'next node choice',
          'distance from start g',
          'estimated distance to goal h',
          'total priority f',
          'better path relaxation',
        ]
      : [
          'next node choice',
          'distance from start g',
          'already visited nodes',
          'path backtracking',
        ];

  return {
    artifacts: {
      statement:
        `A contained the ${rows}x${cols} grid, ${openCells} searchable cells, ${wallCells} wall cells, ` +
        `the fixed start/goal pair, and the ${pathNodes.length || 0}-node result path.`,
      cells: totalCells,
      openCells,
      wallCells,
      pathNodes: pathNodes.length || 0,
    },
    documents: {
      statement:
        `D was produced during the run: ${formalTrace.length} formal expansion documents, ` +
        `${formalTrace.length} scoring equations, and ${totalNeighborAudits} neighbor-audit records ` +
        `(${acceptedNeighborAudits} accepted, ${rejectedNeighborAudits} rejected).`,
      traceDocuments: formalTrace.length,
      equations: formalTrace.length,
      neighborAudits: totalNeighborAudits,
      acceptedNeighborAudits,
      rejectedNeighborAudits,
    },
    schema: {
      statement:
        `S interpreted each step using ${schemaDimensions.join(', ')}. This schema is why the visual trace can be compared to the formal ${meta.displayName} rule rather than treated as animation only.`,
      dimensions: schemaDimensions,
    },
    retrieval: {
      statement: finalTrace
        ? `For the final expansion, R(A,S) retrieved D_rel = {frontier snapshot, equation, neighbor audit}. ` +
          `The last retrieved equation was ${finalTrace.equation}.`
        : 'No D_rel was retrieved because this run produced no formal trace documents.',
      documentsPerExpansion: maxRetrievedDocumentsPerStep,
      finalEquation: finalTrace?.equation || null,
      finalFrontierSize: finalTrace?.frontierBeforeExpansion?.length || 0,
    },
    verification: {
      statement:
        `V checked whether the retrieved documents entailed the algorithm claims: ${equationChecks}/${formalTrace.length} equation checks held.`,
      equationChecks,
      totalChecks: formalTrace.length,
    },
  };
}

export function buildAlgorithmRunAnalysis({
  algorithm,
  grid,
  visitedCount,
  pathNodes = [],
  formalTrace = [],
  durationMs = null,
}) {
  const meta = getAlgorithmMeta(algorithm);
  const openCells = countOpenCells(grid);
  const edgeCount = countUndirectedEdges(grid);
  const graphBranchingFactor = openCells > 0 ? (2 * edgeCount) / openCells : 0;
  const pathCoordinates = pathNodes.map(formatNodeCoordinate);
  const goalReached = pathNodes.length > 0;
  const solutionDepth = goalReached ? pathNodes.length - 1 : null;
  const traceBranching = analyzeTraceBranching(formalTrace);
  const effectiveBranchingFactor = goalReached
    ? estimateEffectiveBranchingFactor(visitedCount, solutionDepth)
    : null;
  const finalTrace = formalTrace.length > 0 ? formalTrace[formalTrace.length - 1] : null;
  const startNode = grid.flat().find((node) => node.isStart);
  const endNode = grid.flat().find((node) => node.isEnd);
  const totalCells = grid.length * (grid[0]?.length || 0);
  const wallCells = totalCells - openCells;
  const startCoordinate = formatNodeCoordinate(startNode);
  const goalCoordinate = formatNodeCoordinate(endNode);
  const finalExpandedCoordinate = formatNodeCoordinate(finalTrace?.expandedNode);
  const dynamicFormalModel =
    `For this run, the visual board became a grid graph G=(V,E) with |V|=${openCells} non-wall cells and |E|=${edgeCount} undirected adjacency edges. ` +
    `The start state was s=${startCoordinate}, the target was t=${goalCoordinate}, and ${wallCells} cells were excluded from V as obstacles. ` +
    (goalReached
      ? `The returned path pi contained ${pathNodes.length} nodes, so its edge depth was d=${solutionDepth}. `
      : 'No valid pi was returned because the target was not reached. ') +
    `${meta.displayName} expanded ${visitedCount} states; its final expanded state was ${finalExpandedCoordinate}.`;
  const manifesto = buildManifestoUsage({
    algorithm,
    grid,
    formalTrace,
    pathNodes,
    meta,
  });

  return {
    algorithm,
    displayName: meta.displayName,
    goalReached,
    visitedCount,
    pathLength: pathNodes.length,
    solutionDepth,
    durationMs,
    pathCoordinates,
    pathPreview: formatPathPreview(pathCoordinates),
    finalEquation: finalTrace?.equation || meta.scoringRule,
    
    manifesto,
    graph: {
      rows: grid.length,
      cols: grid[0]?.length || 0,
      openCells,
      edgeCount,
      graphBranchingFactor,
    },
    branching: {
      ...traceBranching,
      effectiveBranchingFactor,
    },
    formal: {
      model: dynamicFormalModel,
      scoringRule: meta.scoringRule,
      complexity: meta.complexity,
      optimality: meta.optimality,
    },
  };
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarizeQuestionWindow(records) {
  return {
    count: records.length,
    accuracy: average(records.map((record) => record.accuracy)),
    attempts: average(records.map((record) => record.attempts)),
    responseSeconds: average(records.map((record) => record.responseSeconds)),
  };
}

export function buildLearningAnalysis(scoreState, quizPromptInterval, isQuizMode) {
  const questionHistory = scoreState?.questionHistory || [];
  const answered = scoreState?.questionsAnswered || 0;
  const midpoint = Math.ceil(questionHistory.length / 2);
  const firstHalf = summarizeQuestionWindow(questionHistory.slice(0, midpoint));
  const secondHalf = summarizeQuestionWindow(questionHistory.slice(midpoint));
  const accuracyDelta =
    firstHalf.count > 0 && secondHalf.count > 0
      ? secondHalf.accuracy - firstHalf.accuracy
      : null;
  const attemptsDelta =
    firstHalf.count > 0 && secondHalf.count > 0
      ? secondHalf.attempts - firstHalf.attempts
      : null;

  return {
    enabled: Boolean(isQuizMode),
    quizPromptInterval,
    answered,
    totalScore: scoreState?.totalScore || 0,
    averageAccuracy:
      answered > 0 ? (scoreState?.totalAccuracyScore || 0) / answered : 0,
    averageAttempts:
      answered > 0 ? (scoreState?.totalAttempts || 0) / answered : 0,
    averageResponseSeconds:
      answered > 0 ? (scoreState?.totalResponseTime || 0) / answered : 0,
    firstHalf,
    secondHalf,
    accuracyDelta,
    attemptsDelta,
    interpretation:
      answered === 0
        ? 'No prediction-pause response data was collected in this run.'
        : 'Prediction pauses measured active recall: higher accuracy, fewer attempts, and lower response time are evidence of better rule fluency during the run.',
  };
}

export function buildRunSummary({
  grid,
  runResults,
  scoreState,
  isQuizMode,
  quizPromptInterval,
}) {
  const analyses = Object.entries(runResults).map(([algorithm, result]) =>
    buildAlgorithmRunAnalysis({
      algorithm,
      grid,
      visitedCount: result.visited,
      pathNodes: result.pathNodes || [],
      formalTrace: result.formalTrace || [],
      durationMs: result.durationMs ?? null,
    })
  );

  const byAlgorithm = Object.fromEntries(
    analyses.map((analysis) => [analysis.algorithm, analysis])
  );
  const comparison =
    byAlgorithm.bfs && byAlgorithm.astar
      ? {
          visitedReduction:
            byAlgorithm.bfs.visitedCount > 0
              ? (byAlgorithm.bfs.visitedCount - byAlgorithm.astar.visitedCount) /
                byAlgorithm.bfs.visitedCount
              : 0,
          pathLengthsEqual:
            byAlgorithm.bfs.pathLength === byAlgorithm.astar.pathLength,
          bfsVisited: byAlgorithm.bfs.visitedCount,
          astarVisited: byAlgorithm.astar.visitedCount,
          visitedDelta: byAlgorithm.bfs.visitedCount - byAlgorithm.astar.visitedCount,
          pathDepthDelta:
            (byAlgorithm.bfs.solutionDepth ?? 0) - (byAlgorithm.astar.solutionDepth ?? 0),
          durationDeltaMs:
            (byAlgorithm.bfs.durationMs ?? 0) - (byAlgorithm.astar.durationMs ?? 0),
          effectiveBranchingDelta:
            (byAlgorithm.bfs.branching.effectiveBranchingFactor ?? 0) -
            (byAlgorithm.astar.branching.effectiveBranchingFactor ?? 0),
          maxFrontierDelta:
            byAlgorithm.bfs.branching.maxFrontier - byAlgorithm.astar.branching.maxFrontier,
        }
      : null;

  return {
    createdAt: new Date().toISOString(),
    analyses,
    comparison,
    learning: buildLearningAnalysis(scoreState, quizPromptInterval, isQuizMode),
  };
}
