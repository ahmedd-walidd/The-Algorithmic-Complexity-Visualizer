import Grid from '../Grid/Grid';
import RaceSection from '../race/RaceSection';
import NodeHoverPanel from '../panels/NodeHoverPanel';
import SidePanel from '../panels/SidePanel';

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
  stats,
  traceNotice,
}) {
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
