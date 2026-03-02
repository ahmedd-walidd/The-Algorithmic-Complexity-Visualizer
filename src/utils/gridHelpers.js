const ROWS = 20;
const COLS = 50;

const START_ROW = 10;
const START_COL = 5;
const END_ROW = 10;
const END_COL = 45;

export function createGrid() {
  const grid = [];

  for (let row = 0; row < ROWS; row++) {
    const currentRow = [];

    for (let col = 0; col < COLS; col++) {
      currentRow.push({
        row,
        col,
        isStart: row === START_ROW && col === START_COL,
        isEnd: row === END_ROW && col === END_COL,
      });
    }

    grid.push(currentRow);
  }

  return grid;
}

export { ROWS, COLS, START_ROW, START_COL, END_ROW, END_COL };
