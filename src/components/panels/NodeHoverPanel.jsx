function NodeHoverPanel({ hoveredFrontierNode, activeHoverComparison, hoveredNodeDecision, renderTraceEquation }) {
  if (!activeHoverComparison || !hoveredFrontierNode) return null;

  return (
    <section className="node-proof-hover-panel formal-trace-panel" aria-live="polite">
      <h2>Hovered Node Trace</h2>
      <div className="trace-card">
        <p>
          <strong>Hovered node:</strong> ({hoveredFrontierNode.row}, {hoveredFrontierNode.col})
        </p>
        <p>
          <strong>Equation for this node:</strong>{' '}
          {renderTraceEquation(hoveredFrontierNode, activeHoverComparison.algorithm)}
        </p>
        <p>
          <strong>Decision:</strong>{' '}
          <span className={`hover-decision hover-decision-${hoveredNodeDecision.tone}`}>
            {hoveredNodeDecision.text}
          </span>
        </p>

        {activeHoverComparison.algorithm === 'astar' ? (
          <>
            <p>
              <strong>Heuristic h(n):</strong>{' '}
              <span className="trace-inline-value trace-inline-value-visited">
                {hoveredFrontierNode.h}
              </span>
            </p>
            <p>
              <strong>Depth g(n):</strong>{' '}
              <span className="trace-inline-value trace-inline-value-path">
                {hoveredFrontierNode.g}
              </span>
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>Depth g(n):</strong>{' '}
              <span className="trace-inline-value trace-inline-value-path">
                {hoveredFrontierNode.g}
              </span>
            </p>
            <p>
              <strong>BFS rule:</strong> minimum frontier depth g is expanded first.
            </p>
          </>
        )}

        {activeHoverComparison.algorithm === 'astar' ? (
          <>
            <p>
              <strong>Chosen vs minimum frontier:</strong> hovered f={hoveredFrontierNode.f}, minimum f={activeHoverComparison.minComparison?.minF ?? 'N/A'}
            </p>
            <p>
              <strong>Tie-break check:</strong> hovered h={hoveredFrontierNode.h}, minimum h among minimum-f nodes={activeHoverComparison.minComparison?.minHAmongMinF ?? 'N/A'}
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>Chosen vs minimum frontier depth:</strong> hovered g={hoveredFrontierNode.g}, minimum g={activeHoverComparison.minComparison?.minG ?? 'N/A'}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default NodeHoverPanel;
