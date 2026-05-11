function TraceEquation({ scores }) {
  if (!scores) return null;

  return (
    <span className="trace-equation">
      <span className="trace-equation-token trace-equation-token-neutral">f(n)</span>
      <span className="trace-equation-equals">=</span>
      <span className="trace-equation-token trace-equation-token-path">g(n)</span>
      <span className="trace-equation-equals">+</span>
      <span className="trace-equation-token trace-equation-token-visited">h(n)</span>
      <span className="trace-equation-equals">=</span>
      <span className="trace-equation-value trace-equation-value-path">{scores.g}</span>
      <span className="trace-equation-equals">+</span>
      <span className="trace-equation-value trace-equation-value-visited">{scores.h}</span>
      <span className="trace-equation-equals">=</span>
      <span className="trace-equation-value trace-equation-value-neutral">{scores.f}</span>
    </span>
  );
}

export default TraceEquation;
