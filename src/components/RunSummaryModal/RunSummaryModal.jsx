import ModalShell from '../common/ModalShell/ModalShell';
import { formatNumber, formatPercent } from '../../framework/runAnalysis';

function RunSummaryModal({ isOpen, onClose, summary, isRaceMode }) {
  if (!isOpen || !summary) return null;

  const { analyses, comparison, learning } = summary;

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

  const showRaceComparison = Boolean(isRaceMode && comparison);

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
          path, expansion trace, frontier documents, equations, and prediction-pause responses collected
          during this run.
        </p>
        {comparison && (
          <p>
            A* expanded {comparison.astarVisited} nodes versus BFS expanding {comparison.bfsVisited} nodes.
            That is a {formatPercent(comparison.visitedReduction)} reduction in expanded states on this board.
            Both algorithms reported {comparison.pathLengthsEqual ? 'the same path length' : 'different path lengths'}.
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
              <span>Effective b difference</span>
              <strong>{formatSigned(comparison.effectiveBranchingDelta)}</strong>
              <p>Lower effective b means fewer expansions for the measured depth.</p>
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
          <p>Pause-Prediction was disabled, so this run collected no learner-response data.</p>
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
    </ModalShell>
  );
}

export default RunSummaryModal;
