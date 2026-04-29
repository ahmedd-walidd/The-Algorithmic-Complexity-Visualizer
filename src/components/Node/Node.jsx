import './Node.css';

function Node({ node, onMouseDown, onMouseEnter, onMouseUp, prefix = '' }) {
  const { row, col, isStart, isEnd, isWall } = node;

  let extraClass = '';
  if (isStart) extraClass = 'node-start';
  else if (isEnd) extraClass = 'node-end';
  else if (isWall) extraClass = 'node-wall';

  return (
    <div
      id={`${prefix}node-${row}-${col}`}
      className={`node ${extraClass}`}
      onMouseDown={(event) => onMouseDown(row, col, event)}
      onMouseEnter={() => onMouseEnter(row, col)}
      onMouseUp={() => onMouseUp()}
      onContextMenu={(event) => event.preventDefault()}
    />
  );
}

export default Node;
