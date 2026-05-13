import { PanelRightClose } from 'lucide-react';
import StatCard from '../common/StatCard/StatCard';

function SidePanel({
  sidePanelTab,
  setSidePanelTab,
  onClose,
  knowledgeSpaceSnapshot,
  isVisualizing,
  isPaused,
  traceNotice,
  currentTrace,
  formalTrace,
  renderTraceEquation,
  stats,
}) {
  return (
    <aside className="side-panel">
      <div className="side-panel-toolbar">
        <div className="side-panel-tabs" role="tablist" aria-label="Proof sidebar tabs">
          <button
            type="button"
            role="tab"
            aria-selected={sidePanelTab === 'manifesto'}
            className={`side-panel-tab ${sidePanelTab === 'manifesto' ? 'active' : ''}`}
            onClick={() => setSidePanelTab('manifesto')}
          >
            Manifesto
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sidePanelTab === 'trace'}
            className={`side-panel-tab ${sidePanelTab === 'trace' ? 'active' : ''}`}
            onClick={() => setSidePanelTab('trace')}
          >
            Mathematical Trace
          </button>
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
        className="knowledge-space-panel"
        role="tabpanel"
        aria-label="Manifesto framework"
        hidden={sidePanelTab !== 'manifesto'}
      >
        <div className="knowledge-panel-header">
          <h2>{knowledgeSpaceSnapshot.title}</h2>
        </div>

        <div className="knowledge-triplet" aria-label="Knowledge space tuple">
          <div className="knowledge-set-card">
            <span className="knowledge-set-symbol">A</span>
            <strong>Artifacts</strong>
            {knowledgeSpaceSnapshot.artifactSet.map((item) => (
              <p key={item.symbol}>
                <span>{item.symbol}</span> {item.label}: {item.value}
              </p>
            ))}
          </div>
          <div className="knowledge-set-card">
            <span className="knowledge-set-symbol">D</span>
            <strong>Documents</strong>
            {knowledgeSpaceSnapshot.documentSet.map((item) => (
              <p key={item.symbol}>
                <span>{item.symbol}</span> {item.label}: {item.value}
              </p>
            ))}
          </div>
          <div className="knowledge-set-card">
            <span className="knowledge-set-symbol">S</span>
            <strong>Schema</strong>
            <div className="schema-chip-list">
              {knowledgeSpaceSnapshot.schemaSet.map((item) => (
                <span key={item.symbol} className="schema-chip">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="knowledge-functions">
          {knowledgeSpaceSnapshot.functions.map((fn) => (
            <div key={fn.name} className="knowledge-function-row">
              <span className="knowledge-function-name">{fn.name}</span>
              <div>
                <strong>{fn.label}</strong>
                <code>{fn.formula}</code>
                <p>{fn.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="retrieval-box">
          <strong>D_rel</strong>
          <code>{knowledgeSpaceSnapshot.retrievalExpression}</code>
        </div>

        {knowledgeSpaceSnapshot.activeStep && (
          <div className="active-step-proof">
            <p>
              <strong>Current claim source:</strong>{' '}
              {knowledgeSpaceSnapshot.activeStep.expandedNode}
            </p>
            <p>{knowledgeSpaceSnapshot.activeStep.rule}</p>
          </div>
        )}

        <div className="verification-list" aria-label="Verification constraints">
          {knowledgeSpaceSnapshot.verificationClaims.length === 0 ? (
            <p className="verification-empty">
              Verification constraints appear when a trace step is available.
            </p>
          ) : (
            knowledgeSpaceSnapshot.verificationClaims.map((claim) => (
              <div
                key={claim.id}
                className={`verification-item ${claim.holds ? 'verified' : 'unverified'}`}
              >
                <span>{claim.holds ? 'entails' : 'missing'}</span>
                <p>{claim.proposition}</p>
                <small>source: {claim.source}</small>
              </div>
            ))
          )}
        </div>
      </section>

      <section
        className="formal-trace-panel"
        role="tabpanel"
        aria-label="Mathematical trace"
        hidden={sidePanelTab !== 'trace'}
      >
        <h2>Mathematical Trace</h2>

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
          <div className="trace-card">
            <p>
              <strong>Step:</strong> {currentTrace.expansionIndex + 1} / {formalTrace.length}
            </p>
            <p>
              <strong>Expanded:</strong> ({currentTrace.expandedNode.row}, {currentTrace.expandedNode.col})
            </p>
            <p>
              <strong>Equation:</strong>{' '}
              {renderTraceEquation(currentTrace.expandedScores, currentTrace.algorithm)}
            </p>
            <p>
              <strong>Rule:</strong> {currentTrace.selectedBecause}
            </p>

            <div className="attempt-list">
              {(currentTrace.attempts || []).slice(0, 4).map((attempt, idx) => (
                <div key={`${attempt.to.row}-${attempt.to.col}-${idx}`} className="attempt-item-mini">
                  <span>
                    <strong>Neighbor ({attempt.to.row}, {attempt.to.col}):</strong>{' '}
                    {attempt.decision.toUpperCase().substring(0, 10)}
                  </span>
                </div>
              ))}
              {(currentTrace.attempts || []).length > 4 && (
                <p className="more-attempts">...</p>
              )}
            </div>
          </div>
        )}
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
