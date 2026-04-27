import { ROWS, COLS, START_ROW, START_COL, END_ROW, END_COL, createNode } from './gridHelpers';

export function generateMaze() {
  const newGrid = [];

  for (let row = 0; row < ROWS; row++) {
    const currentRow = [];
    for (let col = 0; col < COLS; col++) {
      currentRow.push({ ...createNode(row, col), isWall: true });
    }
    newGrid.push(currentRow);
  }

  // Pick one creative style each generation.
  const style = pickMazeStyle();

  if (style === 'classic') {
    carveThinMaze(newGrid, 1, 1);
    addLoops(newGrid, 0.08);
    widenPassages(newGrid, 0.14);
  }

  if (style === 'braided') {
    carveThinMaze(newGrid, 1, 1);
    addLoops(newGrid, 0.18);
    carveRooms(newGrid, 5, 3, 8, 3, 6);
    widenPassages(newGrid, 0.24);
  }

  if (style === 'chambers') {
    carveRooms(newGrid, 8, 4, 11, 3, 7);
    carveThinMaze(newGrid, 1, 1);
    addLoops(newGrid, 0.12);
    widenPassages(newGrid, 0.2);
  }

  newGrid[START_ROW][START_COL].isWall = false;
  newGrid[END_ROW][END_COL].isWall = false;
  ensureConnected(newGrid, START_ROW, START_COL);
  ensureConnected(newGrid, END_ROW, END_COL);
  ensurePathBetweenEndpoints(newGrid);

  return newGrid;
}

function pickMazeStyle() {
  const roll = Math.random();
  if (roll < 0.34) return 'classic';
  if (roll < 0.67) return 'braided';
  return 'chambers';
}

// ── recursive back-tracking (thin corridors) ────────────────
function carveThinMaze(grid, row, col) {
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
      newRow >= 0 &&
      newRow < ROWS &&
      newCol >= 0 &&
      newCol < COLS &&
      grid[newRow][newCol].isWall
    ) {
      grid[row + dr / 2][col + dc / 2].isWall = false;
      carveThinMaze(grid, newRow, newCol);
    }
  }
}

// Open additional wall cells where both sides already have passages.
function addLoops(grid, probability = 0.1) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!grid[row][col].isWall) continue;
      if (Math.random() > probability) continue;

      const openLeft = col > 0 && !grid[row][col - 1].isWall;
      const openRight = col < COLS - 1 && !grid[row][col + 1].isWall;
      const openUp = row > 0 && !grid[row - 1][col].isWall;
      const openDown = row < ROWS - 1 && !grid[row + 1][col].isWall;

      if ((openLeft && openRight) || (openUp && openDown)) {
        grid[row][col].isWall = false;
      }
    }
  }
}

// Create wider (2+ cell) corridors so mazes are not always 1-cell width.
function widenPassages(grid, probability = 0.18) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col].isWall) continue;
      if (Math.random() > probability) continue;

      const candidates = shuffle([
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ]);

      for (const [dr, dc] of candidates) {
        const nr = row + dr;
        const nc = col + dc;

        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        if (!grid[nr][nc].isWall) continue;

        grid[nr][nc].isWall = false;

        // occasional 2x2/2x3 style "chunk"
        if (Math.random() < 0.28) {
          const rr = nr + dr;
          const cc = nc + dc;
          if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) {
            grid[rr][cc].isWall = false;
          }
        }
        break;
      }
    }
  }
}

// Carve random rectangular rooms/chambers.
function carveRooms(grid, attempts, minW, maxW, minH, maxH) {
  for (let i = 0; i < attempts; i++) {
    const roomWidth = randInt(minW, maxW);
    const roomHeight = randInt(minH, maxH);

    const maxStartRow = Math.max(0, ROWS - roomHeight);
    const maxStartCol = Math.max(0, COLS - roomWidth);

    const startRow = randInt(0, maxStartRow);
    const startCol = randInt(0, maxStartCol);

    for (let r = startRow; r < startRow + roomHeight; r++) {
      for (let c = startCol; c < startCol + roomWidth; c++) {
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
          grid[r][c].isWall = false;
        }
      }
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
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
      grid[nr][nc].isWall = false;
      return;
    }
  }
}

function ensurePathBetweenEndpoints(grid) {
  if (hasPath(grid, START_ROW, START_COL, END_ROW, END_COL)) return;

  // Fallback: carve a simple L-shaped tunnel (random bend direction)
  if (Math.random() < 0.5) {
    carveHorizontal(grid, START_ROW, START_COL, END_COL);
    carveVertical(grid, START_COL, START_ROW, END_ROW);
  } else {
    carveVertical(grid, START_COL, START_ROW, END_ROW);
    carveHorizontal(grid, END_ROW, START_COL, END_COL);
  }
}

function hasPath(grid, sr, sc, tr, tc) {
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const queue = [[sr, sc]];
  visited[sr][sc] = true;

  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];

  while (queue.length) {
    const [row, col] = queue.shift();
    if (row === tr && col === tc) return true;

    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      if (visited[nr][nc] || grid[nr][nc].isWall) continue;
      visited[nr][nc] = true;
      queue.push([nr, nc]);
    }
  }

  return false;
}

function carveHorizontal(grid, row, fromCol, toCol) {
  const step = fromCol <= toCol ? 1 : -1;
  for (let col = fromCol; col !== toCol + step; col += step) {
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      grid[row][col].isWall = false;
    }
  }
}

function carveVertical(grid, col, fromRow, toRow) {
  const step = fromRow <= toRow ? 1 : -1;
  for (let row = fromRow; row !== toRow + step; row += step) {
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      grid[row][col].isWall = false;
    }
  }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
