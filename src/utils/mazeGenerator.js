import { ROWS, COLS, START_ROW, START_COL, END_ROW, END_COL, createNode } from './gridHelpers';

export function generateMaze() {
  // Build a fresh grid with every cell walled off
  const newGrid = [];

  for (let row = 0; row < ROWS; row++) {
    const currentRow = [];
    for (let col = 0; col < COLS; col++) {
      currentRow.push({ ...createNode(row, col), isWall: true });
    }
    newGrid.push(currentRow);
  }

  // Carve passages using recursive back-tracking (starting at 1,1)
  carve(newGrid, 1, 1);

  // Guarantee start & end are open and reachable
  newGrid[START_ROW][START_COL].isWall = false;
  newGrid[END_ROW][END_COL].isWall = false;
  ensureConnected(newGrid, START_ROW, START_COL);
  ensureConnected(newGrid, END_ROW, END_COL);

  return newGrid;
}

// ── recursive back-tracking ──────────────────────────────────
function carve(grid, row, col) {
  grid[row][col].isWall = false;

  const directions = shuffle([
    [0, 2],
    [0, -2],
    [2, 0],
    [-2, 0],
  ]);

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;

    if (
      newRow > 0 &&
      newRow < ROWS - 1 &&
      newCol > 0 &&
      newCol < COLS - 1 &&
      grid[newRow][newCol].isWall
    ) {
      grid[row + dr / 2][col + dc / 2].isWall = false;
      carve(grid, newRow, newCol);
    }
  }
}

function ensureConnected(grid, row, col) {
  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];

  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !grid[nr][nc].isWall) {
      return; // already reachable
    }
  }

  // not connected – open the first valid inner neighbour
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1) {
      grid[nr][nc].isWall = false;
      return;
    }
  }
}

// ── Fisher-Yates shuffle ─────────────────────────────────────
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
