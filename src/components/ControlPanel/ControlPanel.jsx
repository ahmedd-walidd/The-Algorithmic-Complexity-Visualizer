import ControlButton from '../common/ControlButton/ControlButton';
import ControlToggle from '../common/ControlToggle/ControlToggle';
import './ControlPanel.css';

function ControlPanel({
  onGenerateMaze,
  onClearBoard,
  onClearPath,
  algorithm,
  onAlgorithmChange,
  isRaceMode,
  onRaceModeToggle,
  isQuizMode,
  onQuizModeToggle,
  isObstacleMode,
  onObstacleModeToggle,
  onVisualize,
  isVisualizing,
  isTimelineControlDisabled,
  onRewind,
  onFastForward,
  onExportData,
  exportRowCount = 0,
}) {
  return (
    <div className="control-panel">
      {/* ── maze / board actions ── */}
      <div className="control-group">
        <ControlButton onClick={onGenerateMaze} disabled={isVisualizing}>
          Generate Maze
        </ControlButton>
        <ControlButton onClick={onClearBoard} disabled={isVisualizing}>
          Clear Board
        </ControlButton>
        <ControlButton onClick={onClearPath} disabled={isVisualizing}>
          Clear Path
        </ControlButton>
        <ControlButton
          variant="warning"
          active={isObstacleMode}
          onClick={onObstacleModeToggle}
          disabled={isVisualizing}
        >
          {isObstacleMode ? 'Exit Obstacle Mode' : 'Obstacle Mode'}
        </ControlButton>
        <ControlButton
          variant="success"
          onClick={onExportData}
          disabled={isVisualizing || exportRowCount === 0}
          title={
            exportRowCount === 0
              ? 'Run an algorithm before exporting data'
              : `Export ${exportRowCount} recorded result row${exportRowCount === 1 ? '' : 's'}`
          }
        >
          Data Export
        </ControlButton>
      </div>

      {/* ── algorithm choice + race toggle ── */}
      <div className="control-group">
        {!isRaceMode && (
          <div className="algorithm-buttons">
            <ControlButton
              active={algorithm === 'bfs'}
              onClick={() => onAlgorithmChange('bfs')}
              disabled={isVisualizing}
            >
              BFS
            </ControlButton>
            <ControlButton
              active={algorithm === 'astar'}
              onClick={() => onAlgorithmChange('astar')}
              disabled={isVisualizing}
            >
              A*
            </ControlButton>
          </div>
        )}

        <ControlToggle checked={isRaceMode} onChange={onRaceModeToggle} disabled={isVisualizing}>
          Race Mode
        </ControlToggle>
        
        {!isRaceMode && (
          <ControlToggle checked={isQuizMode} onChange={onQuizModeToggle} disabled={isVisualizing}>
            Pause-Prediction
          </ControlToggle>
        )}
      </div>

      {/* ── go button ── */}
      <div className="control-group">
        <div className="timeline-buttons" aria-label="Timeline controls">
          <ControlButton
            className="control-button--timeline"
            onClick={onRewind}
            disabled={isTimelineControlDisabled}
            aria-label="Rewind five animation steps"
            title="Rewind five steps"
          >
            &laquo;
          </ControlButton>
          <ControlButton
            className="control-button--timeline"
            onClick={onFastForward}
            disabled={isTimelineControlDisabled}
            aria-label="Fast-forward five animation steps"
            title="Fast-forward five steps"
          >
            &raquo;
          </ControlButton>
        </div>
        <ControlButton variant="primary" onClick={onVisualize} disabled={isVisualizing}>
          {isVisualizing
            ? 'Visualizing…'
            : isRaceMode
              ? 'Start Race!'
              : 'Visualize!'}
        </ControlButton>
      </div>
    </div>
  );
}

export default ControlPanel;
