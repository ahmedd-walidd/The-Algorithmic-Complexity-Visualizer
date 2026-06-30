import { useMemo } from 'react';
import MathExpr from '../common/MathExpr/MathExpr';

const clampStepIndex = (index, length) => {
  if (length <= 0) return -1;
  return Math.max(0, Math.min(length - 1, Number.isFinite(index) ? index : length - 1));
};

const formatScore = (value) => (Number.isFinite(value) ? value : '∞');

function HeuristicAuditPanel({
  auditSteps,
  currentStepIndex,
  isAvailable = true,
}) {
  const steps = auditSteps || [];
  const currentIndex = clampStepIndex(currentStepIndex, steps.length);
  const activeIndex = currentIndex;
  const activeStep = activeIndex >= 0 ? steps[activeIndex] : null;

  const sortedCandidates = useMemo(() => {
    if (!activeStep) return [];

    return [...activeStep.candidates].sort((a, b) => {
      if (a.selected !== b.selected) return a.selected ? -1 : 1;
      if (a.isMinimumF !== b.isMinimumF) return a.isMinimumF ? -1 : 1;
      return a.f - b.f || a.h - b.h || a.insertionOrder - b.insertionOrder || a.row - b.row || a.col - b.col;
    });
  }, [activeStep]);

  return (
    <section className="heuristic-audit-panel formal-trace-panel" aria-live="polite">
      {!isAvailable && (
        <p className="trace-empty">
          Heuristic Audit is available for A* because A* uses <MathExpr>f(n)=g(n)+h(n)</MathExpr>. BFS is audited by queue/depth order.
        </p>
      )}

      {isAvailable && !activeStep && (
        <p className="trace-empty">
          Run A* to inspect the frontier scores behind each selected node.
        </p>
      )}

      {isAvailable && activeStep && (
        <div className="heuristic-audit-table-wrap">
          <table className="heuristic-audit-table">
            <thead>
              <tr>
                <th>Node</th>
                <th><MathExpr>g(n)</MathExpr></th>
                <th>Manhattan heuristic <MathExpr>h(n)</MathExpr></th>
                <th><MathExpr>f(n)</MathExpr></th>
                <th>Minimum <MathExpr>f</MathExpr>?</th>
                <th>Tie-break <MathExpr>h</MathExpr>?</th>
                <th>Selected?</th>
              </tr>
            </thead>
            <tbody>
              {sortedCandidates.map((candidate) => (
                <tr
                  key={`${activeStep.step}-${candidate.row}-${candidate.col}`}
                  className={[
                    candidate.selected ? 'selected' : '',
                    candidate.isMinimumF ? 'minimum-f' : '',
                  ].join(' ').trim()}
                >
                  <td>{candidate.nodeLabel}</td>
                  <td>{formatScore(candidate.g)}</td>
                  <td>{formatScore(candidate.h)}</td>
                  <td>{formatScore(candidate.f)}</td>
                  <td>{candidate.isMinimumF ? 'Yes' : 'No'}</td>
                  <td>{candidate.isTieBreakMinimum ? 'Yes' : 'No'}</td>
                  <td>{candidate.selected ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default HeuristicAuditPanel;
