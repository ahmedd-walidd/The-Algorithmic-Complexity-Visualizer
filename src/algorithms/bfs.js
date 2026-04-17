export function bfs(grid, startNode, endNode, options = {}) {
  const { withTrace = false } = options;
  const visitedNodesInOrder = [];
  const queue = [startNode];
  const formalTraceByIndex = [];

  startNode.isVisited = true;
  startNode.distance = 0;

  while (queue.length > 0) {
    const currentFrontier = queue.map((q) => ({
      row: q.row,
      col: q.col,
      g: q.distance,
      h: 0,
      f: q.distance,
    }));
    const frontierMinG = Math.min(...currentFrontier.map((n) => n.g));
    const currentNode = queue.shift();

    if (currentNode.isWall) continue;

    currentNode.frontierAtExpansion = currentFrontier;
    visitedNodesInOrder.push(currentNode);

    const attemptLogs = [];

    if (currentNode.row === endNode.row && currentNode.col === endNode.col) {
      if (withTrace) {
        formalTraceByIndex.push({
          algorithm: 'bfs',
          expansionIndex: visitedNodesInOrder.length - 1,
          expandedNode: { row: currentNode.row, col: currentNode.col },
          expandedScores: { g: currentNode.distance, h: 0, f: currentNode.distance },
          selectedBecause:
            'Chosen from queue front. BFS expands in non-decreasing depth g.',
          frontierBeforeExpansion: currentFrontier,
          proofChecks: {
            queueDepthRuleHolds: currentNode.distance === frontierMinG,
            equationHolds: currentNode.distance === currentNode.distance + 0,
          },
          equation: `f(n)=g(n)+h(n)=${currentNode.distance}+0=${currentNode.distance}`,
          attempts: attemptLogs,
          summary:
            'Goal node expanded. BFS optimality holds because first discovery of each node is at minimum depth.',
        });
      }
      break;
    }

    const neighbors = getDirectionalNeighbors(currentNode, grid);
    for (const neighbor of neighbors) {
      const candidateG = currentNode.distance + 1;

      if (neighbor.isWall) {
        attemptLogs.push({
          to: { row: neighbor.row, col: neighbor.col },
          decision: 'rejected',
          reason: 'wall',
          equation: 'blocked: wall nodes are never enqueued',
        });
        continue;
      }

      if (neighbor.isVisited) {
        attemptLogs.push({
          to: { row: neighbor.row, col: neighbor.col },
          decision: 'rejected',
          reason: 'visited',
          equation: `rejected: already discovered at g=${neighbor.distance}`,
        });
        continue;
      }

      neighbor.isVisited = true;
      neighbor.distance = candidateG;
      neighbor.previousNode = currentNode;
      queue.push(neighbor);

      attemptLogs.push({
        to: { row: neighbor.row, col: neighbor.col },
        decision: 'accepted',
        reason: 'discovered',
        scores: {
          gNew: candidateG,
          hNew: 0,
          fNew: candidateG,
        },
        equation: `f(n)=g(n)+h(n)=${candidateG}+0=${candidateG}`,
      });
    }

    if (withTrace) {
      formalTraceByIndex.push({
        algorithm: 'bfs',
        expansionIndex: visitedNodesInOrder.length - 1,
        expandedNode: { row: currentNode.row, col: currentNode.col },
        expandedScores: { g: currentNode.distance, h: 0, f: currentNode.distance },
        selectedBecause:
          'Chosen from queue front. BFS expands in non-decreasing depth g.',
        frontierBeforeExpansion: currentFrontier,
        proofChecks: {
          queueDepthRuleHolds: currentNode.distance === frontierMinG,
          equationHolds: currentNode.distance === currentNode.distance + 0,
        },
        equation: `f(n)=g(n)+h(n)=${currentNode.distance}+0=${currentNode.distance}`,
        attempts: attemptLogs,
        summary:
          'All neighbors were tested. Newly accepted nodes satisfy g_new = g_current + 1 and are appended to queue tail.',
      });
    }
  }

  if (!withTrace) return visitedNodesInOrder;

  // For quiz purposes: highlight the entire queue as selectable (the frontier).
  // The correct options are those with the current minimal distance.
  const predictionOptionsByIndex = formalTraceByIndex.map((entry) => {
    const frontier = (entry.frontierBeforeExpansion || []).map((n) => ({
      row: n.row,
      col: n.col,
    }));
    const minDepth = Math.min(...(entry.frontierBeforeExpansion || []).map((n) => n.g));

    const correctNodes = (entry.frontierBeforeExpansion || [])
      .filter((n) => n.g === minDepth)
      .map((n) => ({ row: n.row, col: n.col }));

    return {
      selectable: frontier,
      correct: correctNodes,
    };
  });

  return { visitedNodesInOrder, predictionOptionsByIndex, formalTraceByIndex };
}

function getDirectionalNeighbors(node, grid) {
  const neighbors = [];
  const { row, col } = node;

  if (row > 0) neighbors.push(grid[row - 1][col]); // Up
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]); // Down
  if (col > 0) neighbors.push(grid[row][col - 1]); // Left
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]); // Right

  return neighbors;
}
