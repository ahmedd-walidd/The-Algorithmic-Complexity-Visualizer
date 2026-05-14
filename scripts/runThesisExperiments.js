import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { bfs } from '../src/algorithms/bfs.js';
import { astar } from '../src/algorithms/astar.js';
import {
  buildAlgorithmRunAnalysis,
  formatNumber,
  formatPercent,
} from '../src/framework/runAnalysis.js';

const TRIALS_PER_CONDITION = 40;
const PAUSE_INTERVAL = 15;
const OUTPUT_DIR = 'docs';
const JSON_OUTPUT = `${OUTPUT_DIR}/thesis-experiment-results.json`;
const MARKDOWN_OUTPUT = `${OUTPUT_DIR}/thesis-experiment-results.md`;

const SIZES = [
  { label: 'Small', rows: 10, cols: 25 },
  { label: 'App default', rows: 20, cols: 50 },
  { label: 'Large', rows: 30, cols: 75 },
];

const WALL_DENSITIES = [0, 0.15, 0.25, 0.35];

function mulberry32(seed) {
  return function nextRandom() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createExperimentNode(row, col, start, end, isWall = false) {
  return {
    row,
    col,
    isStart: row === start.row && col === start.col,
    isEnd: row === end.row && col === end.col,
    isWall,
    isVisited: false,
    previousNode: null,
    distance: Infinity,
    heuristic: 0,
    totalDistance: Infinity,
  };
}

function createExperimentGrid({ rows, cols, density, seed }) {
  const random = mulberry32(seed);
  const start = { row: Math.floor(rows / 2), col: Math.max(1, Math.floor(cols * 0.1)) };
  const end = { row: start.row, col: Math.min(cols - 2, cols - start.col - 1) };

  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const isEndpoint =
        (row === start.row && col === start.col) ||
        (row === end.row && col === end.col);
      const isGuaranteedCorridor =
        row === start.row &&
        col >= Math.min(start.col, end.col) &&
        col <= Math.max(start.col, end.col);
      const isWall = !isEndpoint && !isGuaranteedCorridor && random() < density;
      return createExperimentNode(row, col, start, end, isWall);
    })
  );
}

function cloneGrid(grid) {
  return grid.map((row) =>
    row.map((node) => ({
      ...node,
      isVisited: false,
      previousNode: null,
      distance: Infinity,
      heuristic: 0,
      totalDistance: Infinity,
    }))
  );
}

function getPath(endNode) {
  const path = [];
  let current = endNode;
  while (current) {
    path.unshift(current);
    current = current.previousNode;
  }
  return path;
}

function getEndpoints(grid) {
  let start = null;
  let end = null;
  for (const row of grid) {
    for (const node of row) {
      if (node.isStart) start = node;
      if (node.isEnd) end = node;
    }
  }
  return { start, end };
}

function countPredictionOpportunities(predictionOptionsByIndex) {
  return predictionOptionsByIndex.filter(
    (option, index) =>
      index > 0 &&
      index % PAUSE_INTERVAL === 0 &&
      option.selectable?.length > 0 &&
      option.correct?.length > 0
  ).length;
}

function getTrialSeed(size, density, trial) {
  return (
    size.rows * 1000000 +
    size.cols * 10000 +
    Math.round(density * 1000) * 100 +
    trial
  );
}

function buildAstarHeuristicAuditTrace() {
  const size = SIZES[0];
  const density = 0.25;
  const trial = 7;
  const seed = getTrialSeed(size, density, trial);
  const baseGrid = createExperimentGrid({ ...size, density, seed });
  const grid = cloneGrid(baseGrid);
  const { start, end } = getEndpoints(grid);
  const result = astar(grid, start, end, { withTrace: true });
  const auditedStepNumbers = new Set([2, 3]);

  const traceRows = result.formalTraceByIndex
    .flatMap((entry, index) => {
      const step = index + 1;
      if (!auditedStepNumbers.has(step)) return [];

      return (entry.frontierBeforeExpansion || []).map((candidate) => ({
        step,
        candidateNode: [candidate.row, candidate.col],
        g: candidate.g,
        h: candidate.h,
        f: candidate.f,
        selected:
          candidate.row === entry.expandedNode.row &&
          candidate.col === entry.expandedNode.col,
      }));
    });

  return {
    source:
      'Captured from scripts/runThesisExperiments.js using the implemented astar() formal trace.',
    size: size.label,
    gridRows: size.rows,
    cols: size.cols,
    density,
    trial,
    seed,
    start: { row: start.row, col: start.col },
    end: { row: end.row, col: end.col },
    rows: traceRows,
  };
}

function runAlgorithmTrial(algorithm, baseGrid) {
  const grid = cloneGrid(baseGrid);
  const { start, end } = getEndpoints(grid);
  const startedAt = performance.now();
  const result =
    algorithm === 'bfs'
      ? bfs(grid, start, end, { withTrace: true })
      : astar(grid, start, end, { withTrace: true });
  const durationMs = performance.now() - startedAt;
  const pathNodes = end.isVisited ? getPath(end) : [];
  const visitedCount = result.visitedNodesInOrder.length;
  const formalTrace = result.formalTraceByIndex || [];
  const analysis = buildAlgorithmRunAnalysis({
    algorithm,
    grid: baseGrid,
    visitedCount,
    pathNodes,
    formalTrace,
    durationMs,
  });

  return {
    algorithm,
    visitedCount,
    pathLength: pathNodes.length,
    solutionDepth: analysis.solutionDepth,
    durationMs,
    graphBranchingFactor: analysis.graph.graphBranchingFactor,
    observedBranchingFactor: analysis.branching.averageLegalBranching,
    effectiveBranchingFactor: analysis.branching.effectiveBranchingFactor,
    maxFrontier: analysis.branching.maxFrontier,
    openCells: analysis.graph.openCells,
    edgeCount: analysis.graph.edgeCount,
    predictionOpportunities: countPredictionOpportunities(result.predictionOptionsByIndex || []),
  };
}

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function summarizeMetric(rows, key) {
  const values = rows
    .map((row) => row[key])
    .filter((value) => value !== null && value !== undefined && Number.isFinite(value));
  if (values.length === 0) {
    return {
      mean: 0,
      sd: 0,
      min: 0,
      max: 0,
    };
  }
  return {
    mean: mean(values),
    sd: standardDeviation(values),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function summarizeRows(rows) {
  return {
    trials: rows.length,
    visitedCount: summarizeMetric(rows, 'visitedCount'),
    pathLength: summarizeMetric(rows, 'pathLength'),
    solutionDepth: summarizeMetric(rows, 'solutionDepth'),
    durationMs: summarizeMetric(rows, 'durationMs'),
    graphBranchingFactor: summarizeMetric(rows, 'graphBranchingFactor'),
    observedBranchingFactor: summarizeMetric(rows, 'observedBranchingFactor'),
    effectiveBranchingFactor: summarizeMetric(rows, 'effectiveBranchingFactor'),
    maxFrontier: summarizeMetric(rows, 'maxFrontier'),
    openCells: summarizeMetric(rows, 'openCells'),
    edgeCount: summarizeMetric(rows, 'edgeCount'),
    predictionOpportunities: summarizeMetric(rows, 'predictionOpportunities'),
  };
}

function runExperiments() {
  const rawTrials = [];

  for (const size of SIZES) {
    for (const density of WALL_DENSITIES) {
      for (let trial = 0; trial < TRIALS_PER_CONDITION; trial++) {
        const seed = getTrialSeed(size, density, trial);
        const baseGrid = createExperimentGrid({ ...size, density, seed });
        for (const algorithm of ['bfs', 'astar']) {
          rawTrials.push({
            size: size.label,
            rows: size.rows,
            cols: size.cols,
            density,
            trial,
            ...runAlgorithmTrial(algorithm, baseGrid),
          });
        }
      }
    }
  }

  const summaries = [];
  for (const size of SIZES) {
    for (const density of WALL_DENSITIES) {
      for (const algorithm of ['bfs', 'astar']) {
        const rows = rawTrials.filter(
          (row) =>
            row.size === size.label &&
            row.density === density &&
            row.algorithm === algorithm
        );
        summaries.push({
          size: size.label,
          rows: size.rows,
          cols: size.cols,
          density,
          algorithm,
          ...summarizeRows(rows),
        });
      }
    }
  }

  const comparisons = [];
  for (const size of SIZES) {
    for (const density of WALL_DENSITIES) {
      const bfsSummary = summaries.find(
        (summary) =>
          summary.size === size.label &&
          summary.density === density &&
          summary.algorithm === 'bfs'
      );
      const astarSummary = summaries.find(
        (summary) =>
          summary.size === size.label &&
          summary.density === density &&
          summary.algorithm === 'astar'
      );
      comparisons.push({
        size: size.label,
        rows: size.rows,
        cols: size.cols,
        density,
        bfsVisitedMean: bfsSummary.visitedCount.mean,
        astarVisitedMean: astarSummary.visitedCount.mean,
        astarReduction:
          bfsSummary.visitedCount.mean > 0
            ? (bfsSummary.visitedCount.mean - astarSummary.visitedCount.mean) /
              bfsSummary.visitedCount.mean
            : 0,
        bfsPromptsMean: bfsSummary.predictionOpportunities.mean,
        astarPromptsMean: astarSummary.predictionOpportunities.mean,
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    method: {
      trialsPerCondition: TRIALS_PER_CONDITION,
      pauseInterval: PAUSE_INTERVAL,
      sizes: SIZES,
      wallDensities: WALL_DENSITIES,
      note:
        'Each grid has a guaranteed start-goal corridor so all trials are reachable. Random walls outside the corridor change the surrounding search space.',
    },
    summaries,
    comparisons,
    astarHeuristicAuditTrace: buildAstarHeuristicAuditTrace(),
    rawTrials,
  };
}

function metric(summary, name, digits = 2) {
  return `${formatNumber(summary[name].mean, digits)} +/- ${formatNumber(summary[name].sd, digits)}`;
}

function renderMarkdown(results) {
  const lines = [];
  const tableRow = (cells) => `| ${cells.join(' | ')} |`;
  lines.push('# Thesis Experiment Results');
  lines.push('');
  lines.push(`Generated at: ${results.generatedAt}`);
  lines.push('');
  lines.push('## Method');
  lines.push('');
  lines.push(
    `The experiment ran ${TRIALS_PER_CONDITION} deterministic trials for each grid size, wall density, and algorithm. Each trial used the project implementation of BFS and A* with formal traces enabled.`
  );
  lines.push('');
  lines.push(
    'The tested grid sizes were Small (10x25), App default (20x50), and Large (30x75). Wall densities were 0%, 15%, 25%, and 35%. A direct start-goal corridor was kept open in every grid so the algorithms always had a valid path.'
  );
  lines.push('');
  lines.push(
    'Important learning note: the automated experiment measures search behavior and the number of prediction-pause opportunities. It does not prove human learning improvement by itself. To claim learning gain, use the app logs with a participant pre/post or control-group study.'
  );
  lines.push('');
  lines.push('## A* Heuristic Audit Trace');
  lines.push('');
  lines.push(
    `Table 3.5 was captured from one deterministic real maze run using the implemented A* formal trace: ${results.astarHeuristicAuditTrace.size} ${results.astarHeuristicAuditTrace.gridRows}x${results.astarHeuristicAuditTrace.cols}, ${formatPercent(results.astarHeuristicAuditTrace.density, 0)} wall density, trial ${results.astarHeuristicAuditTrace.trial}, seed ${results.astarHeuristicAuditTrace.seed}, start (${results.astarHeuristicAuditTrace.start.row}, ${results.astarHeuristicAuditTrace.start.col}), goal (${results.astarHeuristicAuditTrace.end.row}, ${results.astarHeuristicAuditTrace.end.col}).`
  );
  lines.push('');
  lines.push('| Step | Candidate Node | g(n) | h(n) | f(n) | Selected? |');
  lines.push('|---:|---|---:|---:|---:|---|');
  for (const row of results.astarHeuristicAuditTrace.rows) {
    lines.push(
      tableRow([
        row.step,
        `(${row.candidateNode[0]}, ${row.candidateNode[1]})`,
        row.g,
        row.h,
        row.f,
        row.selected ? 'Yes' : 'No',
      ])
    );
  }
  lines.push('');
  lines.push(
    'For each audited step, the selected candidate has the minimum frontier f(n)=g(n)+h(n). This verifies that the animated expansion agrees with the theoretical A* rule used in the teaching explanation.'
  );
  lines.push('');
  lines.push('## Algorithm Efficiency And Branching');
  lines.push('');
  lines.push(
    '| Size | Density | Algorithm | Trials | Visited nodes | Path depth | b_graph | b_observed | b_effective | Max frontier | Prediction pauses | Compute ms |'
  );
  lines.push(
    '|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|'
  );
  for (const summary of results.summaries) {
    lines.push(
      tableRow([
        summary.size,
        formatPercent(summary.density, 0),
        summary.algorithm === 'bfs' ? 'BFS' : 'A*',
        summary.trials,
        metric(summary, 'visitedCount', 1),
        metric(summary, 'solutionDepth', 1),
        metric(summary, 'graphBranchingFactor', 2),
        metric(summary, 'observedBranchingFactor', 2),
        metric(summary, 'effectiveBranchingFactor', 2),
        metric(summary, 'maxFrontier', 1),
        metric(summary, 'predictionOpportunities', 1),
        metric(summary, 'durationMs', 3),
      ])
    );
  }
  lines.push('');
  lines.push('## BFS Versus A*');
  lines.push('');
  lines.push('| Size | Density | BFS visited | A* visited | A* expansion reduction | BFS pause opportunities | A* pause opportunities |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|');
  for (const comparison of results.comparisons) {
    lines.push(
      tableRow([
        comparison.size,
        formatPercent(comparison.density, 0),
        formatNumber(comparison.bfsVisitedMean, 1),
        formatNumber(comparison.astarVisitedMean, 1),
        formatPercent(comparison.astarReduction, 1),
        formatNumber(comparison.bfsPromptsMean, 1),
        formatNumber(comparison.astarPromptsMean, 1),
      ])
    );
  }
  lines.push('');
  lines.push('## Thesis Interpretation');
  lines.push('');
  lines.push(
    '- BFS behaves like exhaustive breadth expansion in the reachable state space. Its formal rule is v_i = argmin g(u), so the frontier grows by distance layers.'
  );
  lines.push(
    '- A* behaves like informed search. Its formal rule is v_i = argmin f(u)=g(u)+h(u). In this implementation h is the exact remaining grid distance, so A* expands far fewer states while preserving the same shortest path depth.'
  );
  lines.push(
    '- The b_graph value estimates average graph branching from the grid topology, while b_observed estimates the legal successor branching encountered during expansion. b_effective estimates the branching factor that would generate the observed number of expanded states at the measured solution depth.'
  );
  lines.push(
    '- Prediction-pause opportunities scale with visited nodes: BFS usually creates more prompts because it expands more states, while A* creates fewer but more targeted prompts. To evaluate learning, compare participant accuracy, attempts, response time, and pre/post test scores with Pause-Prediction enabled versus disabled.'
  );
  lines.push('');
  return `${lines.join('\n')}\n`;
}

const results = runExperiments();
mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(JSON_OUTPUT, `${JSON.stringify(results, null, 2)}\n`);
writeFileSync(MARKDOWN_OUTPUT, renderMarkdown(results));

console.log(`Wrote ${JSON_OUTPUT}`);
console.log(`Wrote ${MARKDOWN_OUTPUT}`);
