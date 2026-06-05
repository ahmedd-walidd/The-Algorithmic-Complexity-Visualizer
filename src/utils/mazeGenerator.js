import { createNode } from './gridHelpers';

export function generateMaze({ rows, cols, start, end }) {
  const newGrid = [];

  for (let row = 0; row < rows; row++) {
    const currentRow = [];
    for (let col = 0; col < cols; col++) {
      currentRow.push({ ...createNode(row, col, start, end), isWall: true });
    }
    newGrid.push(currentRow);
  }

  const style = pickMazeStyle();

  if (style === 'classic') {
    carveThinMaze(newGrid, rows, cols, 1, 1);
    addLoops(newGrid, rows, cols, 0.08);
    widenPassages(newGrid, rows, cols, 0.14);
  }

  if (style === 'braided') {
    carveThinMaze(newGrid, rows, cols, 1, 1);
    addLoops(newGrid, rows, cols, 0.18);
    carveRooms(newGrid, rows, cols, 5, 3, 8, 3, 6);
    widenPassages(newGrid, rows, cols, 0.24);
  }

  if (style === 'chambers') {
    carveRooms(newGrid, rows, cols, 8, 4, 11, 3, 7);
    carveThinMaze(newGrid, rows, cols, 1, 1);
    addLoops(newGrid, rows, cols, 0.12);
    widenPassages(newGrid, rows, cols, 0.2);
  }

  newGrid[start.row][start.col].isWall = false;
  newGrid[end.row][end.col].isWall = false;
  ensureConnected(newGrid, rows, cols, start.row, start.col);
  ensureConnected(newGrid, rows, cols, end.row, end.col);
  ensurePathBetweenEndpoints(newGrid, rows, cols, start, end);

  return newGrid;
}

function pickMazeStyle() {
  const roll = Math.random();
  if (roll < 0.34) return 'classic';
  if (roll < 0.67) return 'braided';
  return 'chambers';
}

function carveThinMaze(grid, rows, cols, row, col) {
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
      newRow < rows &&
      newCol >= 0 &&
      newCol < cols &&
      grid[newRow][newCol].isWall
    ) {
      grid[row + dr / 2][col + dc / 2].isWall = false;
      carveThinMaze(grid, rows, cols, newRow, newCol);
    }
  }
}

function addLoops(grid, rows, cols, probability = 0.1) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!grid[row][col].isWall) continue;
      if (Math.random() > probability) continue;

      const openLeft = col > 0 && !grid[row][col - 1].isWall;
      const openRight = col < cols - 1 && !grid[row][col + 1].isWall;
      const openUp = row > 0 && !grid[row - 1][col].isWall;
      const openDown = row < rows - 1 && !grid[row + 1][col].isWall;

      if ((openLeft && openRight) || (openUp && openDown)) {
        grid[row][col].isWall = false;
      }
    }
  }
}

function widenPassages(grid, rows, cols, probability = 0.18) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
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

        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (!grid[nr][nc].isWall) continue;

        grid[nr][nc].isWall = false;

        if (Math.random() < 0.28) {
          const rr = nr + dr;
          const cc = nc + dc;
          if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
            grid[rr][cc].isWall = false;
          }
        }
        break;
      }
    }
  }
}

function carveRooms(grid, rows, cols, attempts, minW, maxW, minH, maxH) {
  for (let i = 0; i < attempts; i++) {
    const roomWidth = randInt(minW, maxW);
    const roomHeight = randInt(minH, maxH);

    const maxStartRow = Math.max(0, rows - roomHeight);
    const maxStartCol = Math.max(0, cols - roomWidth);

    const startRow = randInt(0, maxStartRow);
    const startCol = randInt(0, maxStartCol);

    for (let r = startRow; r < startRow + roomHeight; r++) {
      for (let c = startCol; c < startCol + roomWidth; c++) {
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          grid[r][c].isWall = false;
        }
      }
    }
  }
}

function ensureConnected(grid, rows, cols, row, col) {
  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];

  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].isWall) {
      return;
    }
  }

  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      grid[nr][nc].isWall = false;
      return;
    }
  }
}

function ensurePathBetweenEndpoints(grid, rows, cols, start, end) {
  if (hasPath(grid, rows, cols, start.row, start.col, end.row, end.col)) return;

  if (Math.random() < 0.5) {
    carveHorizontal(grid, start.row, start.col, end.col);
    carveVertical(grid, start.col, start.row, end.row);
  } else {
    carveVertical(grid, start.col, start.row, end.row);
    carveHorizontal(grid, end.row, start.col, end.col);
  }
}

function hasPath(grid, rows, cols, sr, sc, tr, tc) {
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const queue = [[sr, sc]];
  let head = 0;
  visited[sr][sc] = true;

  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];

  while (head < queue.length) {
    const [row, col] = queue[head++];
    if (row === tr && col === tc) return true;

    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited[nr][nc] || grid[nr][nc].isWall) continue;
      visited[nr][nc] = true;
      queue.push([nr, nc]);
    }
  }

  return false;
}

function carveHorizontal(grid, row, startCol, endCol) {
  const [from, to] = startCol < endCol ? [startCol, endCol] : [endCol, startCol];
  for (let col = from; col <= to; col++) {
    grid[row][col].isWall = false;
  }
}

function carveVertical(grid, col, startRow, endRow) {
  const [from, to] = startRow < endRow ? [startRow, endRow] : [endRow, startRow];
  for (let row = from; row <= to; row++) {
    grid[row][col].isWall = false;
  }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
