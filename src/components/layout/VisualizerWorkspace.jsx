import Grid from '../Grid/Grid';
import RaceSection from '../race/RaceSection';
import NodeHoverPanel from '../panels/NodeHoverPanel';
import SidePanel from '../panels/SidePanel';
import EquationLinkOverlay from '../panels/EquationLinkOverlay';
import { PanelRightOpen } from 'lucide-react';

function VisualizerWorkspace({
  activeHoverComparison,
  algorithm,
  currentTrace,
  formalTrace,
  grid,
  handleMouseDown,
  handleMouseEnter,
  handleMouseUp,
  hoveredFrontierNode,
  isHoveredFrontierNodePinned,
  hoveredNodeDecision,
  hasOpenModal = false,
  isPaused,
  isSidePanelOpen,
  isMazeGenerating,
  isRaceMode,
  isVisualizing,
  heuristicAuditSteps,
  heuristicAuditStepIndex,
  raceResultComparison,
  raceAStarAuditIndex,
  renderTraceEquation,
  responsiveCellSize,
  rewindHoverTarget,
  setIsSidePanelOpen,
  simulationPhase,
  showEquationOverlay,
  start,
  end,
  stats,
  traceNotice,
}) {
  const shouldShowEquationOverlay =
    showEquationOverlay && !isRaceMode && isVisualizing && simulationPhase !== 'done';

  const equationAnchor = (() => {
    if (!shouldShowEquationOverlay) return null;

    if (hoveredFrontierNode && activeHoverComparison) {
      return {
        node: hoveredFrontierNode,
        scores: hoveredFrontierNode,
        algorithm: activeHoverComparison.algorithm,
        label: 'hover',
        animationKey: `hover-${hoveredFrontierNode.row}-${hoveredFrontierNode.col}-${hoveredFrontierNode.f}`,
      };
    }

    if (currentTrace?.expandedNode && currentTrace?.expandedScores) {
      return {
        node: currentTrace.expandedNode,
        scores: currentTrace.expandedScores,
        algorithm: currentTrace.algorithm,
        label: 'trace',
        animationKey: `trace-${currentTrace.expansionIndex}-${currentTrace.expandedScores.f}`,
      };
    }

    return null;
  })();

  return (
    <div className={`main-layout${!isSidePanelOpen ? ' side-panel-closed' : ''}`}>
      <div className="visualizer-container">
        {isRaceMode ? (
          <RaceSection
            grid={grid}
            handleMouseDown={handleMouseDown}
            handleMouseEnter={handleMouseEnter}
            handleMouseUp={handleMouseUp}
            responsiveCellSize={responsiveCellSize}
            stats={stats}
            raceResultComparison={raceResultComparison}
            heuristicAuditSteps={heuristicAuditSteps}
            currentAuditStepIndex={raceAStarAuditIndex}
            isVisualizing={isVisualizing}
            isMazeGenerating={isMazeGenerating}
          />
        ) : (
          <Grid
            grid={grid}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseUp={handleMouseUp}
            cellSize={responsiveCellSize}
            isLoading={isMazeGenerating}
            enableFloating={!hasOpenModal}
          />
        )}

        {shouldShowEquationOverlay && equationAnchor && (
          <EquationLinkOverlay
            anchor={equationAnchor.node}
            scores={equationAnchor.scores}
            algorithm={equationAnchor.algorithm}
            start={start}
            end={end}
            label={equationAnchor.label}
            animationKey={equationAnchor.animationKey}
          />
        )}

        {!isRaceMode && (
          <NodeHoverPanel
            hoveredFrontierNode={hoveredFrontierNode}
            isPinned={isHoveredFrontierNodePinned}
            activeHoverComparison={activeHoverComparison}
            hoveredNodeDecision={hoveredNodeDecision}
            renderTraceEquation={renderTraceEquation}
          />
        )}

        {!isRaceMode && rewindHoverTarget && (
          <section className="rewind-node-prompt" aria-live="polite">
            <span>Timeline Rewind</span>
            <strong>Click ({rewindHoverTarget.row}, {rewindHoverTarget.col})</strong>
            <p>Return the trace and audit to step {rewindHoverTarget.index + 1}.</p>
          </section>
        )}
      </div>

      {!isRaceMode && isSidePanelOpen && (
        <SidePanel
          algorithm={algorithm}
          onClose={() => setIsSidePanelOpen(false)}
          isVisualizing={isVisualizing}
          isPaused={isPaused}
          traceNotice={traceNotice}
          currentTrace={currentTrace}
          formalTrace={formalTrace}
          heuristicAuditSteps={heuristicAuditSteps}
          heuristicAuditStepIndex={heuristicAuditStepIndex}
          renderTraceEquation={renderTraceEquation}
          stats={stats}
        />
      )}

      {!isRaceMode && !isSidePanelOpen && (
        <button
          type="button"
          className="side-panel-open-btn"
          onClick={() => setIsSidePanelOpen(true)}
          aria-label="Open proof side panel"
          title="Open panel"
        >
          <PanelRightOpen size={18} strokeWidth={2.8} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default VisualizerWorkspace;
