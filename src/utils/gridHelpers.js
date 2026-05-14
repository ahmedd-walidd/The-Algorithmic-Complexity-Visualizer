const DEFAULT_GRID_CONFIG = {
  rows: 20,
  cols: 50,
};

const GRID_LIMITS = {
  minRows: 8,
  maxRows: 50,
  minCols: 12,
  maxCols: 80,
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

export function getRandomGridEndpoints(rows, cols) {
  const minDistance = Math.max(6, Math.floor(Math.min(rows, cols) * 0.45));
  const rowPadding = rows > 12 ? 2 : 1;
  const colPadding = cols > 16 ? 2 : 1;

  const randomNode = () => ({
    row: randInt(rowPadding, Math.max(rowPadding, rows - rowPadding - 1)),
    col: randInt(colPadding, Math.max(colPadding, cols - colPadding - 1)),
  });

  let start = randomNode();
  let end = randomNode();

  for (let attempt = 0; attempt < 80; attempt++) {
    end = randomNode();
    const distance = Math.abs(start.row - end.row) + Math.abs(start.col - end.col);
    if (distance >= minDistance) {
      return { start, end };
    }

    if (attempt % 12 === 11) {
      start = randomNode();
    }
  }

  return {
    start,
    end: {
      row: rows - start.row - 1,
      col: cols - start.col - 1,
    },
  };
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

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export { DEFAULT_GRID_CONFIG, GRID_LIMITS };
