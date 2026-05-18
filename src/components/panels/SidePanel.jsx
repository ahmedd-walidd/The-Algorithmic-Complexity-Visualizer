import { PanelRightClose } from 'lucide-react';
import StatCard from '../common/StatCard/StatCard';
import HeuristicAuditPanel from './HeuristicAuditPanel';

function SidePanel({
  algorithm,
  onClose,
  isVisualizing,
  isPaused,
  traceNotice,
  currentTrace,
  formalTrace,
  heuristicAuditSteps,
  heuristicAuditStepIndex,
  renderTraceEquation,
  stats,
}) {
  return (
    <aside className="side-panel">
      <div className="side-panel-toolbar">
        <div className="side-panel-title">
          <span>Run Evidence</span>
          <strong>Trace And Audit</strong>
        </div>

        <button
          type="button"
          className="side-panel-close-btn"
          onClick={onClose}
          aria-label="Close proof side panel"
          title="Close panel"
        >
          <PanelRightClose size={18} strokeWidth={2.8} aria-hidden="true" />
        </button>
      </div>

      <section
        className="formal-trace-panel"
        aria-label="Mathematical trace"
      >
        <div className="scanner-panel-header">
          <span>Proof Scan</span>
          <h2>Mathematical Trace</h2>
        </div>

        {isVisualizing && (
          <p className="trace-hotkey">
            Press <strong>Space</strong> to {isPaused ? 'resume' : 'pause'}.
          </p>
        )}

        {traceNotice && <p className="trace-notice">{traceNotice}</p>}

        {!currentTrace && !traceNotice && (
          <p className="trace-empty">
            Run a single algorithm to see the formal proof trace.
          </p>
        )}

        {currentTrace && (
          <div className="trace-card scanner-trace-card">
            <div className="trace-node-banner">
              <span>Step {currentTrace.expansionIndex + 1} / {formalTrace.length}</span>
              <strong>({currentTrace.expandedNode.row}, {currentTrace.expandedNode.col})</strong>
            </div>

            <div className="trace-equation-block">
              {renderTraceEquation(currentTrace.expandedScores, { animate: true })}
            </div>

            <div className="trace-proof-list">
              <p>
                <strong>Rule:</strong> {currentTrace.selectedBecause}
              </p>
            </div>
          </div>
        )}
      </section>

      <section aria-label="A* heuristic audit">
        <HeuristicAuditPanel
          auditSteps={heuristicAuditSteps}
          currentStepIndex={heuristicAuditStepIndex}
          isRunning={isVisualizing && !isPaused}
          isAvailable={algorithm === 'astar'}
        />
      </section>

      {stats && (
        <div className="stats-sidebar">
          {Object.entries(stats).map(([key, { visited, path }]) => (
            <StatCard key={key} title={key === 'bfs' ? 'BFS' : 'A*'} className="stat-card-mini">
              <p>Visited: <strong>{visited}</strong></p>
              <p>Path: <strong>{path > 0 ? path : '—'}</strong></p>
            </StatCard>
          ))}
        </div>
      )}
    </aside>
  );
}

export default SidePanel;
