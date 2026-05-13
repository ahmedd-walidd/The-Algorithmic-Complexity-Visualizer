import Grid from '../Grid/Grid';
import RaceSection from '../race/RaceSection';
import NodeHoverPanel from '../panels/NodeHoverPanel';
import SidePanel from '../panels/SidePanel';
import EquationLinkOverlay from '../panels/EquationLinkOverlay';

function VisualizerWorkspace({
  activeHoverComparison,
  currentTrace,
  formalTrace,
  grid,
  handleMouseDown,
  handleMouseEnter,
  handleMouseUp,
  hoveredFrontierNode,
  hoveredNodeDecision,
  isPaused,
  isRaceMode,
  isVisualizing,
  knowledgeSpaceSnapshot,
  raceResultComparison,
  renderTraceEquation,
  responsiveCellSize,
  setSidePanelTab,
  sidePanelTab,
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
    <div className="main-layout">
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
          />
        ) : (
          <Grid
            grid={grid}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseUp={handleMouseUp}
            cellSize={responsiveCellSize}
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
            activeHoverComparison={activeHoverComparison}
            hoveredNodeDecision={hoveredNodeDecision}
            renderTraceEquation={renderTraceEquation}
          />
        )}
      </div>

      {!isRaceMode && (
        <SidePanel
          sidePanelTab={sidePanelTab}
          setSidePanelTab={setSidePanelTab}
          knowledgeSpaceSnapshot={knowledgeSpaceSnapshot}
          isVisualizing={isVisualizing}
          isPaused={isPaused}
          traceNotice={traceNotice}
          currentTrace={currentTrace}
          formalTrace={formalTrace}
          renderTraceEquation={renderTraceEquation}
          stats={stats}
        />
      )}
    </div>
  );
}

export default VisualizerWorkspace;
