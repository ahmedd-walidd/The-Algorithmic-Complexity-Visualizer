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
        <button onClick={onGenerateMaze} disabled={isVisualizing}>
          Generate Maze
        </button>
        <button onClick={onClearBoard} disabled={isVisualizing}>
          Clear Board
        </button>
        <button onClick={onClearPath} disabled={isVisualizing}>
          Clear Path
        </button>
        <button
          className={`obstacle-mode-btn ${isObstacleMode ? 'active' : ''}`}
          onClick={onObstacleModeToggle}
          disabled={isVisualizing}
        >
          {isObstacleMode ? 'Exit Obstacle Mode' : 'Obstacle Mode'}
        </button>
      </div>

      {/* ── algorithm choice + race toggle ── */}
      <div className="control-group">
        {!isRaceMode && (
          <div className="algorithm-buttons">
            <button
              className={`algorithm-btn ${algorithm === 'bfs' ? 'active' : ''}`}
              onClick={() => onAlgorithmChange('bfs')}
              disabled={isVisualizing}
            >
              BFS
            </button>
            <button
              className={`algorithm-btn ${algorithm === 'astar' ? 'active' : ''}`}
              onClick={() => onAlgorithmChange('astar')}
              disabled={isVisualizing}
            >
              A*
            </button>
          </div>
        )}

        <label className="race-toggle">
          <input
            type="checkbox"
            checked={isRaceMode}
            onChange={onRaceModeToggle}
            disabled={isVisualizing}
          />
          Race Mode
        </label>
        
        {!isRaceMode && (
          <label className="quiz-toggle">
            <input
              type="checkbox"
              checked={isQuizMode}
              onChange={onQuizModeToggle}
              disabled={isVisualizing}
            />
            Pause-Prediction
          </label>
        )}
      </div>

      {/* ── go button ── */}
      <div className="control-group">
        <button
          className="visualize-btn"
          onClick={onVisualize}
          disabled={isVisualizing}
        >
          {isVisualizing
            ? 'Visualizing…'
            : isRaceMode
              ? 'Start Race!'
              : 'Visualize!'}
        </button>
      </div>
    </div>
  );
}

export default ControlPanel;
