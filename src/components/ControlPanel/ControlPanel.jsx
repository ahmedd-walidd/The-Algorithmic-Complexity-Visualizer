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
