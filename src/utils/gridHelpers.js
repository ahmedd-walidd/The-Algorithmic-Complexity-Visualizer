const DEFAULT_GRID_CONFIG = {
  rows: 20,
  cols: 50,
};

export function getGridEndpoints(rows, cols) {
  const start = {
    row: Math.floor(rows / 2),
    col: Math.max(1, Math.floor(cols * 0.1)),
  };
  const end = {
    row: start.row,
    col: Math.min(cols - 2, cols - start.col - 1),
  };

  return { start, end };
}

export function createNode(row, col, start, end) {
  return {
    row,
    col,
    isStart: Boolean(start && row === start.row && col === start.col),
    isEnd: Boolean(end && row === end.row && col === end.col),
    isWall: false,
    isVisited: false,
    previousNode: null,
    distance: Infinity,
    heuristic: 0,
    totalDistance: Infinity,
  };
}

export function createGrid({ rows, cols, start, end }) {
  const grid = [];

  for (let row = 0; row < rows; row++) {
    const currentRow = [];

    for (let col = 0; col < cols; col++) {
      currentRow.push(createNode(row, col, start, end));
    }

    grid.push(currentRow);
  }

  return grid;
}

export function clearPath(grid) {
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

export function cloneGrid(grid) {
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

export function getNodesInShortestPathOrder(endNode) {
  const path = [];
  let current = endNode;
  while (current !== null) {
    path.unshift(current);
    current = current.previousNode;
  }
  return path;
}

export { DEFAULT_GRID_CONFIG };
