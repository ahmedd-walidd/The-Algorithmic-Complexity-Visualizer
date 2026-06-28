function TraceEquation({ scores, algorithm = 'astar', animate = false }) {
  if (!scores) return null;

  const tokenClass = (variant) =>
    `trace-equation-token trace-equation-token-${variant}${animate ? ' trace-equation-animate' : ''}`;
  const valueClass = (variant) =>
    `trace-equation-value trace-equation-value-${variant}${animate ? ' trace-equation-animate' : ''}`;
  const equalsClass = `trace-equation-equals${animate ? ' trace-equation-animate' : ''}`;
  const delayStyle = (delay) => (animate ? { '--delay': `${delay}ms` } : undefined);

  if (algorithm === 'bfs') {
    return (
      <span className={`trace-equation${animate ? ' trace-equation-animated' : ''}`}>
        <span className={tokenClass('neutral')} style={delayStyle(0)}>depth(n)</span>
        <span className={equalsClass} style={delayStyle(80)}>=</span>
        <span className={tokenClass('path')} style={delayStyle(140)}>g(n)</span>
        <span className={equalsClass} style={delayStyle(200)}>=</span>
        <span className={valueClass('path')} style={delayStyle(260)}>{scores.g}</span>
      </span>
    );
  }

  return (
    <span className={`trace-equation${animate ? ' trace-equation-animated' : ''}`}>
      <span className={tokenClass('neutral')} style={delayStyle(0)}>f(n)</span>
      <span className={equalsClass} style={delayStyle(80)}>=</span>
      <span className={tokenClass('path')} style={delayStyle(140)}>g(n)</span>
      <span className={equalsClass} style={delayStyle(200)}>+</span>
      <span className={tokenClass('visited')} style={delayStyle(260)}>h(n)</span>
      <span className={equalsClass} style={delayStyle(320)}>=</span>
      <span className={valueClass('path')} style={delayStyle(380)}>{scores.g}</span>
      <span className={equalsClass} style={delayStyle(440)}>+</span>
      <span className={valueClass('visited')} style={delayStyle(500)}>{scores.h}</span>
      <span className={equalsClass} style={delayStyle(560)}>=</span>
      <span className={valueClass('neutral')} style={delayStyle(620)}>{scores.f}</span>
    </span>
  );
}

export default TraceEquation;
