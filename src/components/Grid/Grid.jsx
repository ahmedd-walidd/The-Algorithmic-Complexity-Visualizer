import Node from '../Node/Node';
import { COLS } from '../../utils/gridHelpers';
import './Grid.css';

function Grid({
  grid,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  prefix = '',
  label = '',
  cellSize = 25,
}) {
  const rowCount = grid.length;
  const xTickStep = cellSize < 18 ? 5 : 1;
  const yTickStep = cellSize < 18 ? 2 : 1;

  const columns = Array.from({ length: COLS }, (_, col) => col);
  const rows = Array.from({ length: rowCount }, (_, row) => row);

  return (
    <div className="grid-container">
      {label && <h2 className="grid-label">{label}</h2>}

      <div className="grid-with-axes" style={{ '--cell-size': `${cellSize}px` }}>
        <div className="axis-corner" aria-hidden="true">
          y\x
        </div>

        <div
          className="x-axis-labels"
          style={{
            gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`,
          }}
          aria-hidden="true"
        >
          {columns.map((col) => (
            <span key={`x-${col}`} className="axis-label x-label">
              {col % xTickStep === 0 ? col : ''}
            </span>
          ))}
        </div>

        <div
          className="y-axis-labels"
          style={{
            gridTemplateRows: `repeat(${rowCount}, ${cellSize}px)`,
          }}
          aria-hidden="true"
        >
          {rows.map((row) => (
            <span key={`y-${row}`} className="axis-label y-label">
              {row % yTickStep === 0 ? row : ''}
            </span>
          ))}
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`,
          }}
        >
          {grid.map((row) =>
            row.map((node) => (
              <Node
                key={`${node.row}-${node.col}`}
                node={node}
                onMouseDown={onMouseDown}
                onMouseEnter={onMouseEnter}
                onMouseUp={onMouseUp}
                prefix={prefix}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Grid;
