const ALGORITHM_META = {
  bfs: {
    displayName: 'BFS',
    scoringRule: 'depth(n)=g(n)',
    complexity:
      'Time O(|V| + |E|), memory O(|V|). On a 4-neighbor grid, |V| ≤ rows×cols and |E| ≤ 2×rows×cols − rows − cols, so BFS is O(rows×cols).',
  },
  astar: {
    displayName: 'A*',
    scoringRule: 'f(n)=g(n)+h_M(n), h_M(n)=|row(n)-row(goal)|+|col(n)-col(goal)|',
    complexity:
      'With a binary-heap priority queue, time is O((|V| + |E|) log |V|) and memory is O(|V|). Manhattan h_M is evaluated in O(1) per node. On a 4-neighbor grid this is O(rows x cols log(rows x cols)).',
  },
};

function getAlgorithmMeta(algorithm) {
  return ALGORITHM_META[algorithm] || ALGORITHM_META.bfs;
}

function formatNodeCoordinate(node) {
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

function formatPathPreview(pathCoordinates, edgeCount = 5) {
  if (!pathCoordinates || pathCoordinates.length === 0) return 'No path reached';
  if (pathCoordinates.length <= edgeCount * 2 + 1) {
    return pathCoordinates.join(' -> ');
  }

  const head = pathCoordinates.slice(0, edgeCount);
  const tail = pathCoordinates.slice(-edgeCount);
  return `${head.join(' -> ')} -> ... -> ${tail.join(' -> ')}`;
}

function countOpenCells(grid) {
  return grid.reduce(
    (total, row) => total + row.filter((node) => !node.isWall).length,
    0
  );
}

function countUndirectedEdges(grid) {
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

function analyzeTraceBranching(formalTrace = []) {
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

function buildGroundingUsage({ algorithm, grid, formalTrace, pathNodes, meta }) {
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
  const equationKind = algorithm === 'astar' ? 'scoring equations' : 'depth equations';
  const maxRetrievedDocumentsPerStep = formalTrace.length > 0 ? 3 : 0;
  const schemaDimensions =
    algorithm === 'astar'
        ? [
          'next node choice',
          'distance from start g',
          'Manhattan heuristic h_M',
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
        `A is the run artifact the learner just saw: a ${rows}x${cols} grid, ${openCells} searchable cells, ` +
        `${wallCells} wall cells, the fixed start/goal pair, and the ${pathNodes.length || 0}-node result path.`,
      cells: totalCells,
      openCells,
      wallCells,
      pathNodes: pathNodes.length || 0,
    },
    documents: {
      statement:
        `D is produced by the interface as the run unfolds: ${formalTrace.length} expansion trace documents, ` +
        `${formalTrace.length} ${equationKind}, and ${totalNeighborAudits} neighbor-audit records ` +
        `(${acceptedNeighborAudits} accepted, ${rejectedNeighborAudits} rejected). These are the records behind the audit panels and export rows.`,
      traceDocuments: formalTrace.length,
      equations: formalTrace.length,
      neighborAudits: totalNeighborAudits,
      acceptedNeighborAudits,
      rejectedNeighborAudits,
    },
    schema: {
      statement:
        `S reads each step through ${schemaDimensions.join(', ')}. That schema is why the visible trace can be checked against the ${meta.displayName} rule instead of treated as animation only.`,
      dimensions: schemaDimensions,
    },
    retrieval: {
      statement: finalTrace
        ? `For the final expansion, R(A,S) retrieved the frontier snapshot, equation, and neighbor audit used by the result modal. ` +
          `The last retrieved equation was ${finalTrace.equation}.`
        : 'No evidence subset was retrieved because this run produced no formal trace documents.',
      documentsPerExpansion: maxRetrievedDocumentsPerStep,
      finalEquation: finalTrace?.equation || null,
      finalFrontierSize: finalTrace?.frontierBeforeExpansion?.length || 0,
    },
    verification: {
      statement:
        `V checked whether the retrieved records entailed the displayed algorithm claims: ${equationChecks}/${formalTrace.length} equation checks held.`,
      equationChecks,
      totalChecks: formalTrace.length,
    },
  };
}

function countRuleChecks(algorithm, formalTrace) {
  const ruleKey = algorithm === 'astar' ? 'frontierMinRuleHolds' : 'queueDepthRuleHolds';
  return formalTrace.filter((step) => step.proofChecks?.[ruleKey]).length;
}

function buildFormalLedger({
  algorithm,
  openCells,
  edgeCount,
  wallCells,
  visitedCount,
  solutionDepth,
  goalReached,
  traceBranching,
  effectiveBranchingFactor,
  formalTrace,
  finalTrace,
}) {
  const graphBranchingFactor = openCells > 0 ? (2 * edgeCount) / openCells : 0;
  const equationChecks = formalTrace.filter((step) => step.proofChecks?.equationHolds).length;
  const ruleChecks = countRuleChecks(algorithm, formalTrace);
  const ruleFormula =
    algorithm === 'astar'
      ? 'n*ₜ ∈ argminₙ∈Fₜ(g(n)+h_M(n))'
      : 'n*ₜ ∈ argminₙ∈Fₜ depth(n)';
  const ruleEvidence =
    formalTrace.length > 0
      ? `${ruleChecks}/${formalTrace.length} recorded selection checks satisfied the ${algorithm === 'astar' ? 'minimum-f' : 'queue-depth'} rule.`
      : 'No selection-rule checks were recorded for this run.';
  const effectiveFormula =
    goalReached && Number.isFinite(effectiveBranchingFactor)
      ? `N = 1 + b* + (b*)² + ... + (b*)ᵈ; N=${visitedCount}, d=${solutionDepth}, solved b*=${formatNumber(effectiveBranchingFactor)}`
      : 'b* undefined because no solution depth was produced.';

  return [
    {
      label: 'Graph Construction',
      formula: `|V| = RC − |W| = ${openCells}; |E| = ${edgeCount}`,
      evidence: `${wallCells} wall cells were excluded, and every retained edge is a 4-neighbor unit-cost adjacency.`,
      status: openCells > 0 ? 'verified' : 'not-available',
    },
    {
      label: 'Graph Branching',
      formula: `b₍graph₎ = 2|E| / |V| = ${2 * edgeCount} / ${openCells} = ${formatNumber(graphBranchingFactor)}`,
      evidence: 'This is the mean degree of the mapped grid graph before algorithm-specific expansion order is applied.',
      status: openCells > 0 ? 'computed' : 'not-available',
    },
    {
      label: 'Observed Branching',
      formula: `b₍observed₎ = legal successors / N = ${traceBranching.legalSuccessors} / ${traceBranching.expansionCount || 0} = ${formatNumber(traceBranching.averageLegalBranching)}`,
      evidence: `${traceBranching.generatedAttempts} neighbor attempts were audited: ${traceBranching.legalSuccessors} legal, ${traceBranching.rejectedSuccessors} rejected.`,
      status: traceBranching.expansionCount > 0 ? 'computed' : 'not-available',
    },
    {
      label: 'Effective Branching',
      formula: effectiveFormula,
      evidence: goalReached
        ? 'The value is solved from the measured expansion count and returned path depth, so it is run-specific.'
        : 'The run did not reach the target, so effective branching cannot be derived from a solution depth.',
      status: goalReached ? 'computed' : 'not-available',
    },
    {
      label: 'Selection Rule',
      formula: ruleFormula,
      evidence: ruleEvidence,
      status: formalTrace.length > 0 && ruleChecks === formalTrace.length ? 'verified' : 'partial',
    },
    {
      label: 'Equation Trace',
      formula: finalTrace?.equation || 'No final equation recorded',
      evidence:
        formalTrace.length > 0
          ? `${equationChecks}/${formalTrace.length} trace equations satisfied ${
              algorithm === 'astar' ? 'f(n)=g(n)+h_M(n)' : 'depth(n)=g(n)'
            }.`
          : 'No equation trace was recorded.',
      status: formalTrace.length > 0 && equationChecks === formalTrace.length ? 'verified' : 'partial',
    },
  ];
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
  const grounding = buildGroundingUsage({
    algorithm,
    grid,
    formalTrace,
    pathNodes,
    meta,
  });
  const ledger = buildFormalLedger({
    algorithm,
    openCells,
    edgeCount,
    wallCells,
    visitedCount,
    solutionDepth,
    goalReached,
    traceBranching,
    effectiveBranchingFactor,
    formalTrace,
    finalTrace,
  });

  return {
    algorithm,
    heuristicType: algorithm === 'astar' ? 'manhattan' : 'none',
    displayName: meta.displayName,
    goalReached,
    visitedCount,
    pathLength: pathNodes.length,
    solutionDepth,
    durationMs,
    pathCoordinates,
    pathPreview: formatPathPreview(pathCoordinates),
    finalEquation: finalTrace?.equation || meta.scoringRule,
    grounding,
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
      ledger,
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
  };
}

function buildLearningAnalysis(scoreState, quizPromptInterval, isQuizMode) {
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
    bestStreak: scoreState?.bestStreak || 0,
    perfectAnswers: scoreState?.perfectAnswers || 0,
    averageFrontierBonus:
      answered > 0 ? (scoreState?.totalFrontierBonus || 0) / answered : 0,
    averageAccuracy:
      answered > 0 ? (scoreState?.totalAccuracyScore || 0) / answered : 0,
    averageAttempts:
      answered > 0 ? (scoreState?.totalAttempts || 0) / answered : 0,
    firstHalf,
    secondHalf,
    accuracyDelta,
    attemptsDelta,
    interpretation:
      answered === 0
        ? 'No prediction-pause response data was collected in this run.'
        : 'Prediction pauses measured active recall: higher accuracy and fewer attempts are evidence of better rule fluency during the run.',
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
          effectiveBranchingReduction:
            byAlgorithm.bfs.branching.effectiveBranchingFactor > 0
              ? (byAlgorithm.bfs.branching.effectiveBranchingFactor -
                  byAlgorithm.astar.branching.effectiveBranchingFactor) /
                byAlgorithm.bfs.branching.effectiveBranchingFactor
              : null,
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
