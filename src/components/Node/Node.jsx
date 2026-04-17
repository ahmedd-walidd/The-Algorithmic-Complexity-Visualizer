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
      onMouseDown={() => onMouseDown(row, col)}
      onMouseEnter={() => onMouseEnter(row, col)}
      onMouseUp={() => onMouseUp()}
    />
  );
}

export default Node;
