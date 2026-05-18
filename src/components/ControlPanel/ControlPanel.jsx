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
  isMazeGenerating = false,
  isTimelineControlDisabled,
  onRewind,
  onFastForward,
}) {
  const isBusy = isVisualizing || isMazeGenerating;

  return (
    <div className="control-panel">
      {/* ── maze / board actions ── */}
      <div className="control-group">
        <ControlButton onClick={onGenerateMaze} disabled={isBusy}>
          {isMazeGenerating ? 'Generating...' : 'Generate Maze'}
        </ControlButton>
        <ControlButton onClick={onClearBoard} disabled={isBusy}>
          Clear Board
        </ControlButton>
        <ControlButton onClick={onClearPath} disabled={isBusy}>
          Clear Path
        </ControlButton>
        <ControlButton
          variant="warning"
          active={isObstacleMode}
          onClick={onObstacleModeToggle}
          disabled={isBusy}
        >
          {isObstacleMode ? 'Exit Obstacle Mode' : 'Obstacle Mode'}
        </ControlButton>
      </div>

      {/* ── algorithm choice + race toggle ── */}
      <div className="control-group">
        {!isRaceMode && (
          <div className="algorithm-buttons">
            <ControlButton
              active={algorithm === 'bfs'}
              onClick={() => onAlgorithmChange('bfs')}
              disabled={isBusy}
            >
              BFS
            </ControlButton>
            <ControlButton
              active={algorithm === 'astar'}
              onClick={() => onAlgorithmChange('astar')}
              disabled={isBusy}
            >
              A*
            </ControlButton>
          </div>
        )}

        <ControlToggle checked={isRaceMode} onChange={onRaceModeToggle} disabled={isBusy}>
          Race Mode
        </ControlToggle>
        
        {!isRaceMode && (
          <ControlToggle checked={isQuizMode} onChange={onQuizModeToggle} disabled={isBusy}>
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
        <ControlButton variant="primary" onClick={onVisualize} disabled={isBusy}>
          {isMazeGenerating
            ? 'Generating...'
            : isVisualizing
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
