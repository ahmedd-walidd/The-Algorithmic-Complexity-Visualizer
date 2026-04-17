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
      </div>

      {/* ── algorithm choice + race toggle ── */}
      <div className="control-group">
        {!isRaceMode && (
          <select
            value={algorithm}
            onChange={(e) => onAlgorithmChange(e.target.value)}
            disabled={isVisualizing}
          >
            <option value="bfs">BFS</option>
            <option value="astar">A*</option>
          </select>
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
