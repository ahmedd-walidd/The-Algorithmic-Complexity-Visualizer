import { useMemo } from 'react';
import Node from '../Node/Node';
import { createGrid, COLS } from '../../utils/gridHelpers';
import './Grid.css';

function Grid() {
  const grid = useMemo(() => createGrid(), []);

  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, 25px)` }}>
      {grid.map((row) =>
        row.map((node) => (
          <Node key={`${node.row}-${node.col}`} node={node} />
        ))
      )}
    </div>
  );
}

export default Grid;
