import ModalShell from '../common/ModalShell/ModalShell';
import { formatNumber, formatPercent } from '../../framework/runAnalysis';
import MathExpr, { MathFraction } from '../common/MathExpr/MathExpr';

function RunSummaryTerm({ id, children, onOpen }) {
  return (
    <button
      type="button"
      className="truth-term"
      onClick={() => onOpen?.(id)}
      title="Open in Truth Scanner"
    >
      {children}
    </button>
  );
}

const renderFormulaWithFractions = (formula) => {
  if (typeof formula !== 'string') return formula;

  const fractionRegex = /([^=]+?)\s\/\s([^=]+?)(?=\s=|$)/g;
  const nodes = [];
  let lastIndex = 0;
  let match;

  while ((match = fractionRegex.exec(formula)) !== null) {
    const [full, numerator, denominator] = match;
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(formula.slice(lastIndex, start));
    }

    nodes.push(
      <MathFraction
        key={`frac-${start}`}
        numerator={numerator.trim()}
        denominator={denominator.trim()}
      />
    );

    lastIndex = start + full.length;
  }

  if (nodes.length === 0) return formula;

  if (lastIndex < formula.length) {
    nodes.push(formula.slice(lastIndex));
  }

  return nodes;
};

function RunSummaryModal({
  isOpen,
  onClose,
  summary,
  isRaceMode,
  exportRows = [],
  onOpenTruthTerm,
}) {
  if (!isOpen || !summary) return null;

  const { analyses, comparison, learning } = summary;
  const bfsAnalysis = analyses.find((analysis) => analysis.algorithm === 'bfs');
  const astarAnalysis = analyses.find((analysis) => analysis.algorithm === 'astar');
  const termProps = { onOpen: onOpenTruthTerm };
  const latestTurn = exportRows.reduce(
    (max, row) => Math.max(max, Number(row.Turn) || 0),
    0
  );
  const latestRows = exportRows.filter((row) => Number(row.Turn) === latestTurn);

  const getMetricTone = (algorithm, metric) => {
    if (!comparison) return 'equal';

    const deltaMap = {
      visited: comparison.visitedDelta,
      pathDepth: comparison.pathDepthDelta,
      effectiveB: comparison.effectiveBranchingDelta,
      computeMs: comparison.durationDeltaMs,
      maxFrontier: comparison.maxFrontierDelta,
    };

    const delta = deltaMap[metric];
    if (!Number.isFinite(delta) || delta === 0) return 'equal';

    const astarBetter = delta > 0;
    if (algorithm === 'astar') {
      return astarBetter ? 'better' : 'higher';
    }
    return astarBetter ? 'higher' : 'better';
  };

  const raceCardTone = (delta) => {
    if (!Number.isFinite(delta) || delta === 0) return 'race-delta-card-equal';
    return delta > 0 ? 'race-delta-card-positive' : 'race-delta-card-warning';
  };

  const formatSigned = (value, digits = 2) => {
    if (!Number.isFinite(value)) return 'N/A';
    return formatNumber(Math.abs(value), digits);
  };

  const formatBranching = (value) => formatNumber(value, 2);

  const showRaceComparison = Boolean(isRaceMode && comparison);
  const ledgerTone = (status) => {
    if (status === 'verified' || status === 'supported') return 'verified';
    if (status === 'computed') return 'computed';
    if (status === 'partial') return 'partial';
    return 'muted';
  };

  return (
    <ModalShell
      className="modal-shell--run-summary"
      titleId="run-summary-title"
      kicker="Completed Run"
      title="Formal Result Analysis"
      onClose={onClose}
    >
      <section className="run-summary-section">
        <h3>Formal Model</h3>
        {analyses.map((analysis) => (
          <p key={`${analysis.algorithm}-formal-model`}>
            <strong>{analysis.displayName}:</strong> {analysis.formal.model}
          </p>
        ))}
        <p>
          This analysis is generated from the simulation that just finished. It uses the actual board,
          path, expansion trace, <RunSummaryTerm id="frontier" {...termProps}>frontier</RunSummaryTerm>
          {' '}documents, equations, and{' '}
          <RunSummaryTerm id="pause-prediction" {...termProps}>Pause-Prediction</RunSummaryTerm>
          {' '}responses collected during this run.
        </p>
        {comparison && (
          <p>
            A* expanded {comparison.astarVisited} nodes versus BFS expanding {comparison.bfsVisited} nodes.
            That is a {formatPercent(comparison.visitedReduction)} reduction in expanded states on this board.
            Both algorithms reported {comparison.pathLengthsEqual ? 'the same path length' : 'different path lengths'}.
          </p>
        )}
      </section>

      <section className="run-summary-section">
        <h3>Dynamic Proof Ledger</h3>
        <p>
          These checks are generated from this run's graph, trace, frontier documents, and returned path.
          They are not static Truth Scanner notes.
        </p>
        <div className="run-summary-ledger-grid">
          {analyses.map((analysis) => (
            <section key={`${analysis.algorithm}-ledger`} className="run-summary-ledger-card">
              <h4>{analysis.displayName}</h4>
              <div className="run-summary-proof-list">
                {analysis.formal.ledger.map((item) => (
                  <article
                    key={`${analysis.algorithm}-${item.label}`}
                    className={`run-summary-proof-item tone-${ledgerTone(item.status)}`}
                  >
                    <div className="run-summary-proof-heading">
                      <span>{item.label}</span>
                      <strong>{item.status}</strong>
                    </div>
                    <code>{renderFormulaWithFractions(item.formula)}</code>
                    <p>{item.evidence}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="run-summary-section">
        <h3>Branching Factor And Heuristic Effect</h3>
        <div className="run-summary-algorithms">
          {analyses.map((analysis) => (
            <section
              key={`${analysis.algorithm}-branching`}
              className={`run-summary-card ${isRaceMode ? `run-summary-card--${analysis.algorithm}` : ''}`}
            >
              <h3>{analysis.displayName}</h3>
              <div className="run-summary-metric-grid">
                <div className="run-summary-metric">
                    <span>
                      <RunSummaryTerm id="branching-factor" {...termProps}><MathExpr>b<sub>graph</sub></MathExpr></RunSummaryTerm>
                    </span>
                  <strong>{formatBranching(analysis.graph.graphBranchingFactor)}</strong>
                </div>
                <div className="run-summary-metric">
                    <span>
                      <RunSummaryTerm id="branching-factor" {...termProps}><MathExpr>b<sub>observed</sub></MathExpr></RunSummaryTerm>
                    </span>
                  <strong>{formatBranching(analysis.branching.averageLegalBranching)}</strong>
                </div>
                <div className="run-summary-metric">
                    <span>
                      <RunSummaryTerm id="effective-branching" {...termProps}><MathExpr>b<sub>effective</sub></MathExpr></RunSummaryTerm>
                    </span>
                  <strong>{formatBranching(analysis.branching.effectiveBranchingFactor)}</strong>
                </div>
              </div>
              <p>
                  <RunSummaryTerm id="branching-factor" {...termProps}><MathExpr>b<sub>graph</sub></MathExpr></RunSummaryTerm>
                  {' '}is the average branching implied by the grid topology.
                  {' '}<RunSummaryTerm id="branching-factor" {...termProps}><MathExpr>b<sub>observed</sub></MathExpr></RunSummaryTerm>
                  {' '}reports the legal successor branching seen in the trace.
                  {' '}<RunSummaryTerm id="effective-branching" {...termProps}><MathExpr>b<sub>effective</sub></MathExpr></RunSummaryTerm>
                  {' '}is the branching factor that would generate the observed expansions at the measured depth.
              </p>
            </section>
          ))}
        </div>
        {comparison && bfsAnalysis && astarAnalysis && Number.isFinite(comparison.effectiveBranchingReduction) && (
          <p>
              Heuristic impact: A* reduced{' '}
              <RunSummaryTerm id="effective-branching" {...termProps}>effective branching</RunSummaryTerm>
              {' '}from <MathExpr>b={formatBranching(bfsAnalysis.branching.effectiveBranchingFactor)}</MathExpr>
            {' '}to <MathExpr>b={formatBranching(astarAnalysis.branching.effectiveBranchingFactor)}</MathExpr>
            {' '}({formatPercent(comparison.effectiveBranchingReduction, 1)} reduction), which shrinks the
            effective search space on this maze.
          </p>
        )}
      </section>

      {showRaceComparison && (
        <section className="run-summary-section race-comparison-section">
          <h3>Race Mode Statistical Comparison</h3>
          <div className="race-delta-grid">
            <div className={`race-delta-card ${raceCardTone(comparison.visitedDelta)}`}>
              <span>Expanded-state difference</span>
              <strong>{comparison.visitedDelta}</strong>
              <p>A* expanded {formatPercent(comparison.visitedReduction)} fewer states.</p>
            </div>
            <div className={`race-delta-card ${raceCardTone(comparison.pathDepthDelta)}`}>
              <span>Path depth delta</span>
              <strong>{comparison.pathDepthDelta}</strong>
              <p>Lower depth indicates a shorter path.</p>
            </div>
            <div className={`race-delta-card ${raceCardTone(comparison.durationDeltaMs)}`}>
              <span>Compute time delta</span>
              <strong>{formatSigned(comparison.durationDeltaMs)}ms</strong>
              <p>{comparison.durationDeltaMs >= 0 ? 'A* computed faster.' : 'BFS computed faster.'}</p>
            </div>
            <div className="race-delta-card race-delta-card-info">
              <span><MathExpr>Effective b</MathExpr> difference</span>
              <strong>{formatSigned(comparison.effectiveBranchingDelta)}</strong>
              <p>Lower <MathExpr>b</MathExpr> means fewer expansions for the measured depth.</p>
            </div>
            <div className={`race-delta-card ${raceCardTone(comparison.maxFrontierDelta)}`}>
              <span>Max frontier delta</span>
              <strong>{comparison.maxFrontierDelta}</strong>
              <p>Smaller frontiers imply less memory pressure.</p>
            </div>
          </div>
        </section>
      )}

      <section className="run-summary-section">
        <h3>Manifesto Framework In This Run</h3>
        <div className="manifesto-run-grid">
          {analyses.map((analysis) => (
            <article key={`${analysis.algorithm}-manifesto`} className="manifesto-run-card">
              <h4>{analysis.displayName}</h4>
              <p><strong>A - Artifacts:</strong> {analysis.manifesto.artifacts.statement}</p>
              <p><strong>D - Documents:</strong> {analysis.manifesto.documents.statement}</p>
              <p><strong>S - Schema:</strong> {analysis.manifesto.schema.statement}</p>
              <p><strong>R - Retrieval:</strong> {analysis.manifesto.retrieval.statement}</p>
              <p><strong>V - Verification:</strong> {analysis.manifesto.verification.statement}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="run-summary-algorithms">
        {analyses.map((analysis) => (
          <section
            key={analysis.algorithm}
            className={`run-summary-card ${isRaceMode ? `run-summary-card--${analysis.algorithm}` : ''}`}
          >
            <h3>{analysis.displayName}</h3>
            <div className="run-summary-metric-grid">
              <div className={`run-summary-metric tone-${getMetricTone(analysis.algorithm, 'visited')}`}>
                <span>Visited</span>
                <strong>{analysis.visitedCount}</strong>
              </div>
              <div className={`run-summary-metric tone-${getMetricTone(analysis.algorithm, 'pathDepth')}`}>
                <span>Path depth</span>
                <strong>{analysis.solutionDepth ?? 'N/A'}</strong>
              </div>
              <div className={`run-summary-metric tone-${getMetricTone(analysis.algorithm, 'computeMs')}`}>
                <span>Compute ms</span>
                <strong>{formatNumber(analysis.durationMs)}</strong>
              </div>
              {isRaceMode && (
                <div className={`run-summary-metric tone-${getMetricTone(analysis.algorithm, 'maxFrontier')}`}>
                  <span>Max frontier</span>
                  <strong>{analysis.branching.maxFrontier}</strong>
                </div>
              )}
            </div>
            <div className="run-summary-formal-block">
              <p><strong>Equation:</strong> <code>{analysis.finalEquation}</code></p>
              <p><strong>Complexity:</strong> {analysis.formal.complexity}</p>
              <p><strong>Optimality:</strong> {analysis.formal.optimality}</p>
              <p><strong>Path:</strong> {analysis.pathPreview}</p>
            </div>
          </section>
        ))}
      </div>

      <section className="run-summary-section">
        <h3>Prediction-Pause Learning Signal</h3>
        {!learning.enabled && (
          <p>
            <RunSummaryTerm id="pause-prediction" {...termProps}>Pause-Prediction</RunSummaryTerm>
            {' '}was disabled, so this run collected no learner-response data.
          </p>
        )}
        {learning.enabled && learning.answered === 0 && (
          <p>{learning.interpretation}</p>
        )}
        {learning.enabled && learning.answered > 0 && (
          <>
            <div className="run-summary-metric-grid">
              <div className="run-summary-metric">
                <span>Prompts</span>
                <strong>{learning.answered}</strong>
              </div>
              <div className="run-summary-metric">
                <span>Accuracy</span>
                <strong>{formatPercent(learning.averageAccuracy, 0)}</strong>
              </div>
              <div className="run-summary-metric">
                <span>Avg attempts</span>
                <strong>{formatNumber(learning.averageAttempts)}</strong>
              </div>
              <div className="run-summary-metric">
                <span>Avg time</span>
                <strong>{formatNumber(learning.averageResponseSeconds)}s</strong>
              </div>
              <div className="run-summary-metric">
                <span>Best streak</span>
                <strong>{learning.bestStreak}</strong>
              </div>
              <div className="run-summary-metric">
                <span>Perfect reads</span>
                <strong>{learning.perfectAnswers}</strong>
              </div>
              <div className="run-summary-metric">
                <span>Avg speed bonus</span>
                <strong>{formatNumber(learning.averageSpeedBonus)}</strong>
              </div>
              <div className="run-summary-metric">
                <span>Avg frontier bonus</span>
                <strong>{formatNumber(learning.averageFrontierBonus)}</strong>
              </div>
            </div>
            <p>
              Early-to-late accuracy change: <strong>{formatPercent(learning.accuracyDelta)}</strong>.
              Attempts change: <strong>{formatNumber(learning.attemptsDelta)}</strong>.
            </p>
            <p className="run-summary-note">
              This is active-recall evidence from prediction pauses. A causal learning-gain claim still
              needs a pre/post or control-group study.
            </p>
          </>
        )}
      </section>

      <section className="run-summary-section">
        <h3>Run Data Table</h3>
        {latestRows.length === 0 && (
          <p>Run an algorithm to populate the formal data table.</p>
        )}
        {latestRows.length > 0 && (
          <div className="run-summary-table-wrap">
            <table className="run-summary-table">
              <thead>
                <tr>
                  <th>Turn</th>
                  <th>Mode</th>
                  <th>Algorithm</th>
                  <th>Nodes Visited</th>
                  <th>Path Length</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {latestRows.map((row) => (
                  <tr key={`${row.Turn}-${row.Algorithm}-${row.Timestamp}`}>
                    <td>{row.Turn}</td>
                    <td>{row.Mode}</td>
                    <td>{row.Algorithm}</td>
                    <td>{row['Nodes Visited']}</td>
                    <td>{row['Path Length']}</td>
                    <td>{row.Timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ModalShell>
  );
}

export default RunSummaryModal;
