import assert from 'node:assert/strict';
import { bfs } from '../src/algorithms/bfs.js';
import { astar, calculateManhattanDistance } from '../src/algorithms/astar.js';
import { estimateEffectiveBranchingFactor } from '../src/framework/runAnalysis.js';

function makeNode(row, col, start, end, walls = new Set()) {
  return {
    row,
    col,
    isStart: row === start.row && col === start.col,
    isEnd: row === end.row && col === end.col,
    isWall: walls.has(`${row},${col}`),
    isVisited: false,
    previousNode: null,
    distance: Infinity,
    heuristic: 0,
    totalDistance: Infinity,
  };
}

function makeGrid(rows, cols, start, end, wallCoordinates = []) {
  const walls = new Set(wallCoordinates.map(([row, col]) => `${row},${col}`));
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => makeNode(row, col, start, end, walls))
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
      insertionOrder: undefined,
      frontierAtExpansion: undefined,
    }))
  );
}

function endpoints(grid) {
  let start = null;
  let end = null;

  for (const row of grid) {
    for (const node of row) {
      if (node.isStart) start = node;
      if (node.isEnd) end = node;
    }
  }

  assert.ok(start, 'grid must contain a start node');
  assert.ok(end, 'grid must contain an end node');
  return { start, end };
}

function reconstructPath(endNode) {
  const path = [];
  let current = endNode;

  while (current) {
    path.unshift(current);
    current = current.previousNode;
  }

  return path;
}

function run(algorithm, baseGrid) {
  const grid = cloneGrid(baseGrid);
  const { start, end } = endpoints(grid);
  const result = algorithm === 'bfs'
    ? bfs(grid, start, end, { withTrace: true })
    : astar(grid, start, end, { withTrace: true });

  const path = end.isVisited ? reconstructPath(end) : [];
  return { grid, start, end, result, path };
}

function assertPathStartsAndEnds(path, start, end, label) {
  assert.ok(path.length > 0, `${label} should return a path`);
  assert.deepEqual(
    { row: path[0].row, col: path[0].col },
    { row: start.row, col: start.col },
    `${label} path should start at the start node`
  );
  assert.deepEqual(
    { row: path.at(-1).row, col: path.at(-1).col },
    { row: end.row, col: end.col },
    `${label} path should end at the goal node`
  );
}

function assertBfsTraceIsSound(trace) {
  assert.ok(trace.length > 0, 'BFS should produce formal trace rows');

  for (const [index, step] of trace.entries()) {
    assert.equal(step.proofChecks?.equationHolds, true, `BFS equation check failed at trace row ${index}`);
    assert.equal(step.proofChecks?.queueDepthRuleHolds, true, `BFS queue-depth rule failed at trace row ${index}`);
    assert.equal(
      step.expandedScores.f,
      step.expandedScores.g + step.expandedScores.h,
      `BFS f=g+h mismatch at trace row ${index}`
    );
  }
}

function assertAstarTraceIsSound(trace) {
  assert.ok(trace.length > 0, 'A* should produce formal trace rows');

  for (const [index, step] of trace.entries()) {
    assert.equal(step.proofChecks?.equationHolds, true, `A* equation check failed at trace row ${index}`);
    assert.equal(step.proofChecks?.frontierMinRuleHolds, true, `A* minimum-f/tie-break rule failed at trace row ${index}`);
    assert.equal(step.heuristicType, 'manhattan', `A* heuristic type missing at trace row ${index}`);
    assert.equal(
      step.expandedScores.f,
      step.expandedScores.g + step.expandedScores.h,
      `A* f=g+h mismatch at trace row ${index}`
    );

    const frontier = step.frontierBeforeExpansion || [];
    const selected = step.expandedNode;
    const selectedFrontierEntry = frontier.find(
      (candidate) => candidate.row === selected.row && candidate.col === selected.col
    );

    assert.ok(selectedFrontierEntry, `A* selected node missing from frontier at trace row ${index}`);

    const minF = Math.min(...frontier.map((candidate) => candidate.f));
    const minHAmongMinF = Math.min(
      ...frontier.filter((candidate) => candidate.f === minF).map((candidate) => candidate.h)
    );
    const minInsertionAmongMinFAndH = Math.min(
      ...frontier
        .filter((candidate) => candidate.f === minF && candidate.h === minHAmongMinF)
        .map((candidate) => candidate.insertionOrder)
    );
    assert.equal(selectedFrontierEntry.f, minF, `A* selected node did not have minimum f at trace row ${index}`);
    assert.equal(
      selectedFrontierEntry.h,
      minHAmongMinF,
      `A* selected node did not satisfy lower-h tie-break at trace row ${index}`
    );
    assert.equal(
      selectedFrontierEntry.insertionOrder,
      minInsertionAmongMinFAndH,
      `A* selected node did not satisfy insertion-order tie-break at trace row ${index}`
    );
  }
}

function assertAstarAuditIsSound(auditSteps) {
  assert.ok(auditSteps.length > 0, 'A* should produce heuristic audit rows');

  for (const [index, step] of auditSteps.entries()) {
    assert.equal(step.heuristicType, 'manhattan', `A* audit heuristic type missing at row ${index}`);
    assert.equal(step.decisionValid, true, `A* audit decision invalid at row ${index}`);
    const selected = step.candidates.find((candidate) => candidate.selected);
    assert.ok(selected, `A* audit selected candidate missing at row ${index}`);
    assert.equal(selected.f, step.minimumF, `A* audit selected candidate lacks minimum f at row ${index}`);
    assert.equal(
      selected.h,
      step.minimumHAmongMinimumF,
      `A* audit selected candidate violates lower-h tie-break at row ${index}`
    );
    assert.equal(
      selected.insertionOrder,
      step.minimumInsertionOrderAmongTiedCandidates,
      `A* audit selected candidate violates insertion-order tie-break at row ${index}`
    );
    assert.equal(
      selected.isPriorityWinner,
      true,
      `A* audit selected candidate is not marked as the final priority winner at row ${index}`
    );
  }
}

function validateManhattanHeuristic() {
  const start = { row: 4, col: 1 };
  const end = { row: 0, col: 6 };
  const walls = [
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
  ];
  const baseGrid = makeGrid(6, 8, start, end, walls);
  const astarRun = run('astar', baseGrid);
  const bfsRun = run('bfs', baseGrid);

  assert.equal(
    calculateManhattanDistance(astarRun.start, astarRun.end),
    Math.abs(start.row - end.row) + Math.abs(start.col - end.col),
    'h(start) should equal Manhattan distance to the goal'
  );
  assert.equal(
    astarRun.start.heuristic,
    calculateManhattanDistance(astarRun.start, astarRun.end),
    'A* should store Manhattan h(start)'
  );
  assert.ok(
    bfsRun.path.length - 1 > astarRun.start.heuristic,
    'Manhattan h should ignore walls; this maze requires a longer route than h(start)'
  );
  assertAstarTraceIsSound(astarRun.result.formalTraceByIndex);
  assertAstarAuditIsSound(astarRun.result.heuristicAuditByIndex);
}

function validateStraightCorridor() {
  const start = { row: 2, col: 1 };
  const end = { row: 2, col: 5 };
  const baseGrid = makeGrid(5, 7, start, end);

  const bfsRun = run('bfs', baseGrid);
  const astarRun = run('astar', baseGrid);

  assertPathStartsAndEnds(bfsRun.path, bfsRun.start, bfsRun.end, 'BFS');
  assertPathStartsAndEnds(astarRun.path, astarRun.start, astarRun.end, 'A*');

  assert.equal(bfsRun.path.length, 5, 'BFS should find the direct 4-edge corridor path');
  assert.equal(astarRun.path.length, bfsRun.path.length, 'A* and BFS should return equal optimal path length');
  assert.ok(
    astarRun.result.visitedNodesInOrder.length <= bfsRun.result.visitedNodesInOrder.length,
    'Straight-corridor sanity check: A* should not expand more nodes than BFS with Manhattan h'
  );

  assertBfsTraceIsSound(bfsRun.result.formalTraceByIndex);
  assertAstarTraceIsSound(astarRun.result.formalTraceByIndex);
  assertAstarAuditIsSound(astarRun.result.heuristicAuditByIndex);
}

function validateObstacleDetour() {
  const start = { row: 2, col: 0 };
  const end = { row: 2, col: 6 };
  const walls = [
    [2, 2],
    [2, 3],
    [2, 4],
    [1, 3],
    [3, 3],
  ];
  const baseGrid = makeGrid(5, 7, start, end, walls);

  const bfsRun = run('bfs', baseGrid);
  const astarRun = run('astar', baseGrid);

  assertPathStartsAndEnds(bfsRun.path, bfsRun.start, bfsRun.end, 'BFS');
  assertPathStartsAndEnds(astarRun.path, astarRun.start, astarRun.end, 'A*');

  assert.equal(
    astarRun.path.length,
    bfsRun.path.length,
    'A* should preserve BFS shortest-path length on the obstacle detour grid'
  );

  for (const node of astarRun.path) {
    assert.equal(node.isWall, false, `A* path should not pass through wall at (${node.row}, ${node.col})`);
  }

  assertBfsTraceIsSound(bfsRun.result.formalTraceByIndex);
  assertAstarTraceIsSound(astarRun.result.formalTraceByIndex);
  assertAstarAuditIsSound(astarRun.result.heuristicAuditByIndex);
}

function validateAstarExpandsBeyondPathOnly() {
  const start = { row: 2, col: 0 };
  const end = { row: 2, col: 6 };
  const walls = [
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
  ];
  const baseGrid = makeGrid(5, 7, start, end, walls);

  const bfsRun = run('bfs', baseGrid);
  const astarRun = run('astar', baseGrid);

  assertPathStartsAndEnds(astarRun.path, astarRun.start, astarRun.end, 'A*');
  assert.equal(
    astarRun.path.length,
    bfsRun.path.length,
    'A* should return the same optimal path length as BFS on the misleading-wall grid'
  );
  assert.ok(
    astarRun.result.visitedNodesInOrder.length > astarRun.path.length,
    'A* with Manhattan h should expand beyond only the d+1 path nodes in this misleading layout'
  );
  assertAstarTraceIsSound(astarRun.result.formalTraceByIndex);
  assertAstarAuditIsSound(astarRun.result.heuristicAuditByIndex);
}

function validateNoPathCase() {
  const start = { row: 1, col: 1 };
  const end = { row: 1, col: 3 };
  const walls = [
    [0, 2],
    [1, 2],
    [2, 2],
  ];
  const baseGrid = makeGrid(3, 5, start, end, walls);

  const bfsRun = run('bfs', baseGrid);
  const astarRun = run('astar', baseGrid);

  assert.equal(bfsRun.path.length, 0, 'BFS should return no path when the goal is unreachable');
  assert.equal(astarRun.path.length, 0, 'A* should return no path when the goal is unreachable');
  assertBfsTraceIsSound(bfsRun.result.formalTraceByIndex);

  // A* may expand only the reachable component. Its trace should still obey f=g+h and minimum-f selection.
  assertAstarTraceIsSound(astarRun.result.formalTraceByIndex);
}

function validateEffectiveBranchingFactor() {
  assert.equal(
    estimateEffectiveBranchingFactor(5, 4),
    1,
    'effective branching factor should be 1 when expandedNodes = solutionDepth + 1'
  );

  const value = estimateEffectiveBranchingFactor(205, 20);
  assert.ok(value > 1 && value < 2, 'effective branching factor for N=205,d=20 should be between 1 and 2');
}

function main() {
  validateStraightCorridor();
  validateManhattanHeuristic();
  validateObstacleDetour();
  validateAstarExpandsBeyondPathOnly();
  validateNoPathCase();
  validateEffectiveBranchingFactor();

  console.log('Algorithm validation passed: Manhattan A*, BFS shortest paths, f=g+h_M trace equations, minimum-f/lower-h/insertion-order audit, no-path handling, and effective branching factor are consistent.');
}

main();
