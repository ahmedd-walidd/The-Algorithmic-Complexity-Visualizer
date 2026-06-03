import { auditAStarDecision } from '../utils/heuristicAudit.js';

export function astar(grid, startNode, endNode, options = {}) {
  const { withTrace = false } = options;
  const visitedNodesInOrder = [];
  const openSet = new BinaryMinHeap(compareAStarNodes);
  const formalTraceByIndex = [];
  const heuristicAuditByIndex = [];
  const goalDistanceMap = computeGoalDistanceMap(grid, endNode);

  startNode.distance = 0;
  startNode.heuristic = goalDistanceMap[startNode.row][startNode.col];
  startNode.totalDistance = startNode.heuristic;
  openSet.push(startNode);

  while (!openSet.isEmpty()) {
    const selectedNode = openSet.peek();
    const frontierNodes = openSet.toArray();
    const auditStep = auditAStarDecision(
      visitedNodesInOrder.length + 1,
      frontierNodes,
      selectedNode
    );
    const currentFrontier = frontierNodes.map((q) => ({
      row: q.row,
      col: q.col,
      g: q.distance,
      h: q.heuristic,
      f: q.totalDistance,
    }));
    const frontierMinF = Math.min(...currentFrontier.map((n) => n.f));
    const frontierMinHAmongMinF = Math.min(
      ...currentFrontier.filter((n) => n.f === frontierMinF).map((n) => n.h)
    );
    const currentNode = openSet.pop();

    if (currentNode.isWall) continue;
    if (currentNode.isVisited) continue;

    currentNode.isVisited = true;
    currentNode.frontierAtExpansion = currentFrontier;
    visitedNodesInOrder.push(currentNode);
    heuristicAuditByIndex.push(auditStep);

    const attemptLogs = [];

    if (currentNode.row === endNode.row && currentNode.col === endNode.col) {
      if (withTrace) {
        formalTraceByIndex.push({
          algorithm: 'astar',
          expansionIndex: visitedNodesInOrder.length - 1,
          expandedNode: { row: currentNode.row, col: currentNode.col },
          expandedScores: {
            g: currentNode.distance,
            h: currentNode.heuristic,
            f: currentNode.totalDistance,
          },
          selectedBecause:
            'Chosen because it has minimum f on the frontier (tie-broken by minimum h).',
          frontierBeforeExpansion: currentFrontier,
          proofChecks: {
            frontierMinRuleHolds:
              currentNode.totalDistance === frontierMinF &&
              currentNode.heuristic === frontierMinHAmongMinF,
            equationHolds:
              currentNode.totalDistance ===
              currentNode.distance + currentNode.heuristic,
          },
          equation: `f(n)=g(n)+h(n)=${currentNode.distance}+${currentNode.heuristic}=${currentNode.totalDistance}`,
          attempts: attemptLogs,
          summary:
            'Goal node expanded. Termination is correct because A* expands nodes in non-decreasing best-known f.',
        });
      }
      break;
    }

    const neighbors = getDirectionalNeighbors(currentNode, grid);
    for (const neighbor of neighbors) {
      const tentativeG = currentNode.distance + 1;
      const previousG = neighbor.distance;
      const previousH = Number.isFinite(neighbor.heuristic)
        ? neighbor.heuristic
        : goalDistanceMap[neighbor.row][neighbor.col];
      const previousF = Number.isFinite(neighbor.totalDistance)
        ? neighbor.totalDistance
        : previousG + previousH;

      if (neighbor.isWall) {
        attemptLogs.push({
          to: { row: neighbor.row, col: neighbor.col },
          decision: 'rejected',
          reason: 'wall',
          equation: `blocked: f(n)=g(n)+h(n) is not evaluated for walls`,
        });
        continue;
      }

      if (neighbor.isVisited) {
        attemptLogs.push({
          to: { row: neighbor.row, col: neighbor.col },
          decision: 'rejected',
          reason: 'closed',
          equation: `rejected: node already closed with g=${neighbor.distance}, h=${neighbor.heuristic}, f=${neighbor.totalDistance}`,
        });
        continue;
      }

      if (tentativeG < neighbor.distance) {
        neighbor.distance = tentativeG;
        neighbor.heuristic = goalDistanceMap[neighbor.row][neighbor.col];
        neighbor.totalDistance = neighbor.distance + neighbor.heuristic;
        neighbor.previousNode = currentNode;

        const wasInOpenSet = openSet.has(neighbor);

        if (!wasInOpenSet) {
          openSet.push(neighbor);
        } else {
          openSet.update(neighbor);
        }

        attemptLogs.push({
          to: { row: neighbor.row, col: neighbor.col },
          decision: 'accepted',
          reason: wasInOpenSet ? 'relaxed' : 'discovered',
          scores: {
            gPrev: previousG,
            hPrev: previousH,
            fPrev: previousF,
            gNew: neighbor.distance,
            hNew: neighbor.heuristic,
            fNew: neighbor.totalDistance,
          },
          equation: `f(n)=g(n)+h(n)=${neighbor.distance}+${neighbor.heuristic}=${neighbor.totalDistance}`,
        });
      } else {
        attemptLogs.push({
          to: { row: neighbor.row, col: neighbor.col },
          decision: 'rejected',
          reason: 'not-better-g',
          scores: {
            gCandidate: tentativeG,
            gBestKnown: neighbor.distance,
            h: previousH,
            fCandidate: tentativeG + previousH,
            fBestKnown:
              Number.isFinite(neighbor.totalDistance)
                ? neighbor.totalDistance
                : neighbor.distance + previousH,
          },
          equation: `rejected: candidate g=${tentativeG} is not better than known g=${neighbor.distance}`,
        });
      }
    }

    if (withTrace) {
      formalTraceByIndex.push({
        algorithm: 'astar',
        expansionIndex: visitedNodesInOrder.length - 1,
        expandedNode: { row: currentNode.row, col: currentNode.col },
        expandedScores: {
          g: currentNode.distance,
          h: currentNode.heuristic,
          f: currentNode.totalDistance,
        },
        selectedBecause:
          'Chosen because it has minimum f on the frontier (tie-broken by minimum h).',
        frontierBeforeExpansion: currentFrontier,
        proofChecks: {
          frontierMinRuleHolds:
            currentNode.totalDistance === frontierMinF &&
            currentNode.heuristic === frontierMinHAmongMinF,
          equationHolds:
            currentNode.totalDistance === currentNode.distance + currentNode.heuristic,
        },
        equation: `f(n)=g(n)+h(n)=${currentNode.distance}+${currentNode.heuristic}=${currentNode.totalDistance}`,
        attempts: attemptLogs,
        summary:
          'All neighbors were tested. Accepted updates satisfy relaxation: g(new) = g(current) + 1 and f(new) = g(new) + h.',
      });
    }
  }

  if (!withTrace) return visitedNodesInOrder;

  // For quiz purposes: highlight the entire openSet as selectable.
  // The correct options are those with the lowest f-score in the current openSet.
  const predictionOptionsByIndex = formalTraceByIndex.map((entry) => {
    const frontier = (entry.frontierBeforeExpansion || []).map((n) => ({
      row: n.row,
      col: n.col,
    }));
    const minF = Math.min(...(entry.frontierBeforeExpansion || []).map((n) => n.f));
    const minH = Math.min(
      ...(entry.frontierBeforeExpansion || [])
        .filter((n) => n.f === minF)
        .map((n) => n.h)
    );

    const correctNodes = (entry.frontierBeforeExpansion || [])
      .filter((n) => n.f === minF && n.h === minH)
      .map((n) => ({ row: n.row, col: n.col }));

    return {
      selectable: frontier,
      correct: correctNodes,
    };
  });

  return { visitedNodesInOrder, predictionOptionsByIndex, formalTraceByIndex, heuristicAuditByIndex };
}

function compareAStarNodes(a, b) {
  return (
    a.totalDistance - b.totalDistance ||
    a.heuristic - b.heuristic ||
    a.insertionOrder - b.insertionOrder
  );
}

class BinaryMinHeap {
  constructor(compare) {
    this.compare = compare;
    this.heap = [];
    this.indexByNode = new Map();
    this.nextInsertionOrder = 0;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  has(node) {
    return this.indexByNode.has(node);
  }

  peek() {
    return this.heap[0] ?? null;
  }

  push(node) {
    if (this.has(node)) {
      this.update(node);
      return;
    }

    node.insertionOrder = this.nextInsertionOrder;
    this.nextInsertionOrder += 1;
    this.heap.push(node);
    this.indexByNode.set(node, this.heap.length - 1);
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;

    const min = this.heap[0];
    const last = this.heap.pop();
    this.indexByNode.delete(min);

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.indexByNode.set(last, 0);
      this.sinkDown(0);
    }

    return min;
  }

  update(node) {
    const index = this.indexByNode.get(node);
    if (index === undefined) return;

    this.bubbleUp(index);
    this.sinkDown(this.indexByNode.get(node));
  }

  toArray() {
    return [...this.heap];
  }

  bubbleUp(startIndex) {
    let index = startIndex;

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break;

      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  sinkDown(startIndex) {
    let index = startIndex;

    while (true) {
      const leftIndex = index * 2 + 1;
      const rightIndex = index * 2 + 2;
      let smallestIndex = index;

      if (
        leftIndex < this.heap.length &&
        this.compare(this.heap[leftIndex], this.heap[smallestIndex]) < 0
      ) {
        smallestIndex = leftIndex;
      }

      if (
        rightIndex < this.heap.length &&
        this.compare(this.heap[rightIndex], this.heap[smallestIndex]) < 0
      ) {
        smallestIndex = rightIndex;
      }

      if (smallestIndex === index) break;

      this.swap(index, smallestIndex);
      index = smallestIndex;
    }
  }

  swap(a, b) {
    [this.heap[a], this.heap[b]] = [this.heap[b], this.heap[a]];
    this.indexByNode.set(this.heap[a], a);
    this.indexByNode.set(this.heap[b], b);
  }
}

function computeGoalDistanceMap(grid, endNode) {
  const rows = grid.length;
  const cols = grid[0].length;
  const distances = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const queue = [];

  if (endNode.isWall) return distances;

  distances[endNode.row][endNode.col] = 0;
  queue.push(endNode);

  while (queue.length > 0) {
    const current = queue.shift();
    const currentDistance = distances[current.row][current.col];
    const neighbors = getDirectionalNeighbors(current, grid);

    for (const neighbor of neighbors) {
      if (neighbor.isWall) continue;
      if (Number.isFinite(distances[neighbor.row][neighbor.col])) continue;

      distances[neighbor.row][neighbor.col] = currentDistance + 1;
      queue.push(neighbor);
    }
  }

  return distances;
}

function getDirectionalNeighbors(node, grid) {
  const neighbors = [];
  const { row, col } = node;

  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);

  return neighbors;
}
