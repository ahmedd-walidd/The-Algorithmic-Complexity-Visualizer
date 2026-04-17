const ROWS = 20;
const COLS = 50;

const START_ROW = 10;
const START_COL = 5;
const END_ROW = 10;
const END_COL = 45;

export function createNode(row, col) {
  return {
    row,
    col,
    isStart: row === START_ROW && col === START_COL,
    isEnd: row === END_ROW && col === END_COL,
    isWall: false,
    isVisited: false,
    previousNode: null,
    distance: Infinity,
    heuristic: 0,
    totalDistance: Infinity,
  };
}

export function createGrid() {
  const grid = [];

  for (let row = 0; row < ROWS; row++) {
    const currentRow = [];

    for (let col = 0; col < COLS; col++) {
      currentRow.push(createNode(row, col));
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

export { ROWS, COLS, START_ROW, START_COL, END_ROW, END_COL };
