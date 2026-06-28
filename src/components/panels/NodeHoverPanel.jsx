function NodeHoverPanel({
  hoveredFrontierNode,
  isPinned = false,
  activeHoverComparison,
  hoveredNodeDecision,
  renderTraceEquation,
}) {
  if (!activeHoverComparison || !hoveredFrontierNode) return null;

  return (
    <section
      className={`node-proof-hover-panel scanner-panel${isPinned ? ' node-proof-hover-panel-pinned' : ''}`}
      aria-live="polite"
    >
      <div className="scanner-panel-beam" aria-hidden="true" />
      <div className="scanner-panel-header">
        <span>Frontier Scan</span>
        <h2>Hovered Node Trace</h2>
      </div>

      <div className="trace-card scanner-trace-card">
        <div className="trace-node-banner">
          <span>{isPinned ? 'Pinned hovered node' : 'Hovered node'}</span>
          <strong>({hoveredFrontierNode.row}, {hoveredFrontierNode.col})</strong>
        </div>

        <div className="trace-equation-block">
          {renderTraceEquation(hoveredFrontierNode, {
            algorithm: activeHoverComparison.algorithm,
            animate: true,
          })}
        </div>

        <div className={`hover-decision-card hover-decision-${hoveredNodeDecision.tone}`}>
          <span>Decision</span>
          <strong>{hoveredNodeDecision.text}</strong>
        </div>

        {activeHoverComparison.algorithm === 'astar' ? (
          <div className="trace-score-grid">
            <div className="trace-score-chip trace-score-chip-path">
              <span>Depth g(n)</span>
              <strong>{hoveredFrontierNode.g}</strong>
            </div>
            <div className="trace-score-chip trace-score-chip-visited">
              <span>Heuristic h(n)</span>
              <strong>{hoveredFrontierNode.h}</strong>
            </div>
            <div className="trace-score-chip trace-score-chip-total">
              <span>Total f(n)</span>
              <strong>{hoveredFrontierNode.f}</strong>
            </div>
          </div>
        ) : (
          <div className="trace-score-grid">
            <div className="trace-score-chip trace-score-chip-path">
              <span>Depth g(n)</span>
              <strong>{hoveredFrontierNode.g}</strong>
            </div>
            <div className="trace-score-chip trace-score-chip-total">
              <span>BFS rule</span>
              <strong>Min depth first</strong>
            </div>
          </div>
        )}

        {activeHoverComparison.algorithm === 'astar' ? (
          <div className="trace-proof-list">
            <p>
              <strong>Frontier minimum:</strong> hovered f={hoveredFrontierNode.f}, minimum f={activeHoverComparison.minComparison?.minF ?? 'N/A'}
            </p>
            <p>
              <strong>Tie-break check:</strong> hovered h={hoveredFrontierNode.h}, minimum h among minimum-f nodes={activeHoverComparison.minComparison?.minHAmongMinF ?? 'N/A'}
            </p>
          </div>
        ) : (
          <div className="trace-proof-list">
            <p>
              <strong>Frontier depth check:</strong> hovered g={hoveredFrontierNode.g}, minimum g={activeHoverComparison.minComparison?.minG ?? 'N/A'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default NodeHoverPanel;
