const SCHEMA_DIMENSIONS = {
  bfs: [
    'Next node choice',
    'Distance from start',
    'Already visited nodes',
    'Path backtracking',
  ],
  astar: [
    'Next node choice',
    'Distance from start',
    'Estimated distance to goal',
    'Total priority score',
    'Better path updates',
  ],
};

function countWalls(grid) {
  return grid.reduce(
    (total, row) => total + row.filter((node) => node.isWall).length,
    0
  );
}

function formatNode(node) {
  if (!node) return 'None';
  return `(${node.row}, ${node.col})`;
}

function buildRetrievedDocuments(currentTrace) {
  if (!currentTrace) return [];

  const frontierSize = currentTrace.frontierBeforeExpansion?.length ?? 0;
  const attemptCount = currentTrace.attempts?.length ?? 0;

  return [
    {
      id: 'd_frontier',
      label: 'Frontier snapshot',
      value: `${frontierSize} candidate${frontierSize === 1 ? '' : 's'} before expansion`,
    },
    {
      id: 'd_equation',
      label: 'Scoring equation',
      value: currentTrace.equation,
    },
    {
      id: 'd_attempts',
      label: 'Neighbor audit',
      value: `${attemptCount} neighbor decision${attemptCount === 1 ? '' : 's'} with reasons`,
    },
  ];
}

function buildVerificationClaims(currentTrace) {
  if (!currentTrace) return [];

  const checks = currentTrace.proofChecks || {};

  return [
    {
      id: 'p_equation',
      proposition: 'Expanded score satisfies f(n)=g(n)+h(n)',
      source: 'd_equation',
      holds: Boolean(checks.equationHolds),
    },
    {
      id: 'p_neighbors',
      proposition: 'Every neighbor decision records an accepted or rejected reason',
      source: 'd_attempts',
      holds: (currentTrace.attempts || []).every(
        (attempt) => attempt.decision && attempt.reason && attempt.equation
      ),
    },
  ];
}

export function buildKnowledgeSpaceSnapshot({
  grid,
  algorithm,
  currentTrace,
  formalTrace,
  stats,
  isRaceMode,
}) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const totalCells = rows * cols;
  const wallCount = countWalls(grid);
  const openCells = totalCells - wallCount;
  const activeAlgorithm = currentTrace?.algorithm || algorithm;
  const schemaDimensions = SCHEMA_DIMENSIONS[activeAlgorithm] || SCHEMA_DIMENSIONS.bfs;
  const retrievedDocuments = buildRetrievedDocuments(currentTrace);
  const verificationClaims = buildVerificationClaims(currentTrace);
  const verifiedCount = verificationClaims.filter((claim) => claim.holds).length;
  const traceCount = formalTrace.length;

  return {
    title: 'K = (A, D, S)',
    artifactSet: [
      {
        symbol: 'a_board',
        label: 'Grid search artifact',
        value: `${rows}x${cols} board, ${openCells} open cells`,
      },
      {
        symbol: 'a_problem',
        label: 'Start-goal problem',
        value: `${activeAlgorithm.toUpperCase()} from fixed start to fixed goal`,
      },
      {
        symbol: 'a_walls',
        label: 'Obstacle configuration',
        value: `${wallCount} blocked cell${wallCount === 1 ? '' : 's'}`,
      },
    ],
    documentSet: [
      {
        symbol: 'd_trace',
        label: 'Formal trace store',
        value:
          traceCount > 0
            ? `${traceCount} expansion proof${traceCount === 1 ? '' : 's'}`
            : 'Run a single algorithm to populate trace documents',
      },
      {
        symbol: 'd_rules',
        label: 'Algorithm rule base',
        value:
          activeAlgorithm === 'astar'
            ? 'A* uses f=g+h and h tie-break'
            : 'BFS uses queue order and minimum g',
      },
      {
        symbol: 'd_output',
        label: 'Measured output',
        value: stats
          ? `${Object.keys(stats).map((key) => key.toUpperCase()).join('/')} result stored`
          : 'No completed result yet',
      },
    ],
    schemaSet: schemaDimensions.map((dimension, index) => ({
      symbol: `s_${index + 1}`,
      label: dimension,
    })),
    functions: [
      {
        name: 'Φ',
        label: 'Perception mapping',
        formula: 'Φ(UI_board) -> A union {empty}',
        value: `Discretizes the painted board into a ${activeAlgorithm.toUpperCase()} search artifact.`,
      },
      {
        name: 'R',
        label: 'Schema-guided retrieval',
        formula: 'R : (A x S) -> P(D)',
        value: currentTrace
          ? `Retrieves ${retrievedDocuments.length} trace document classes for step ${currentTrace.expansionIndex + 1}.`
          : 'Waiting for a trace step to retrieve frontier, equation, and neighbor evidence.',
      },
      {
        name: 'V',
        label: 'Verification constraint',
        formula: 'For all p in Y, exists d in D_rel such that d entails p',
        value:
          verificationClaims.length > 0
            ? `${verifiedCount}/${verificationClaims.length} current propositions are entailed.`
            : 'No propositions to verify until the trace starts.',
      },
    ],
    retrievalExpression: currentTrace
      ? `D_rel(step ${currentTrace.expansionIndex + 1}) = { frontier, equation, attempts }`
      : 'D_rel = empty until a single-algorithm run begins',
    activeStep: currentTrace
      ? {
          expandedNode: formatNode(currentTrace.expandedNode),
          rule: currentTrace.selectedBecause,
          summary: currentTrace.summary,
        }
      : null,
    retrievedDocuments,
    verificationClaims,
    isRaceMode,
  };
}
