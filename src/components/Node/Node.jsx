import './Node.css';

function Node({ node }) {
  const { isStart, isEnd } = node;

  let extraClass = '';
  if (isStart) extraClass = 'node-start';
  else if (isEnd) extraClass = 'node-end';

  return <div className={`node ${extraClass}`} />;
}

export default Node;
