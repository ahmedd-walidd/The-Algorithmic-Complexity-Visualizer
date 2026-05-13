import ControlPanel from '../ControlPanel/ControlPanel';
import IconFab from '../common/IconFab/IconFab';
import StatusBadge from '../common/StatusBadge/StatusBadge';
import RunSummaryModal from '../RunSummaryModal/RunSummaryModal';
import GameHud from '../quiz/GameHud';
import QuizOverlay from '../quiz/QuizOverlay';
import SettingsModal from '../modals/SettingsModal';
import LegendModal from '../modals/LegendModal';

function AppChrome({
  algorithm,
  averageTriesPerQuestion,
  averageTryAccuracy,
  closeLegend,
  closeSettings,
  exportRows,
  handleClearBoard,
  handleClearPath,
  handleExportData,
  handleGenerateMaze,
  handleRaceModeToggle,
  handleVisualize,
  isLegendOpen,
  isMazeGenerating,
  isObstacleMode,
  isQuizMode,
  isRaceMode,
  isRunSummaryOpen,
  isSettingsOpen,
  isVisualizing,
  jumpTimeline,
  openLegend,
  openSettings,
  quizState,
  resetSettingsToDefaults,
  runSummary,
  runSummaryIsRaceMode,
  saveSettings,
  scorePopup,
  scoreState,
  setAlgorithm,
  setIsQuizMode,
  setIsObstacleMode,
  setIsRunSummaryOpen,
  setSettingsDraft,
  settingsDraft,
  simulationPhase,
  simulationPhaseDisplay,
  isPaused,
}) {
  return (
    <>
      <h1 className="app-title">
        <span className="app-title-top">The Algorithmic Complexity</span>
        <span className="app-title-bottom">Visualizer</span>
      </h1>

      <IconFab
        className="icon-fab--settings"
        onClick={openSettings}
        aria-haspopup="dialog"
        aria-expanded={isSettingsOpen}
        aria-label="Open settings"
        title="Open settings"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="icon-fab-icon">
          <path d="M19.14 12.94a7.43 7.43 0 0 0 .05-.94c0-.32-.02-.63-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.25 7.25 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42H9.28a.5.5 0 0 0-.5.42l-.36 2.54c-.58.22-1.12.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L1.88 7.84a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.62-.05.94s.02.63.05.94L2 13.52a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.72a.5.5 0 0 0 .5-.42l.36-2.54c.58-.22 1.12-.53 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.02-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
        </svg>
      </IconFab>

      <IconFab
        className="icon-fab--legend"
        onClick={openLegend}
        aria-haspopup="dialog"
        aria-expanded={isLegendOpen}
        aria-label="Open legend"
        title="Open legend"
      >
        ?
      </IconFab>

      <ControlPanel
        onGenerateMaze={handleGenerateMaze}
        onClearBoard={handleClearBoard}
        onClearPath={handleClearPath}
        algorithm={algorithm}
        onAlgorithmChange={setAlgorithm}
        isRaceMode={isRaceMode}
        onRaceModeToggle={handleRaceModeToggle}
        isQuizMode={isQuizMode}
        onQuizModeToggle={() => setIsQuizMode((value) => !value)}
        isObstacleMode={isObstacleMode}
        onObstacleModeToggle={() => setIsObstacleMode((value) => !value)}
        onVisualize={handleVisualize}
        isVisualizing={isVisualizing}
        isMazeGenerating={isMazeGenerating}
        isTimelineControlDisabled={!isVisualizing || isRaceMode || quizState.active}
        onRewind={() => jumpTimeline('backward')}
        onFastForward={() => jumpTimeline('forward')}
        onExportData={handleExportData}
        exportRowCount={exportRows.length}
      />

      <StatusBadge
        className={`status-badge-${simulationPhase}`}
        label="Simulation State"
        value={simulationPhaseDisplay}
      />

      <RunSummaryModal
        isOpen={isRunSummaryOpen}
        summary={runSummary}
        isRaceMode={runSummaryIsRaceMode}
        onClose={() => setIsRunSummaryOpen(false)}
      />

      {runSummary && simulationPhase === 'done' && !isRunSummaryOpen && (
        <button
          type="button"
          className="analysis-reopen-btn"
          onClick={() => setIsRunSummaryOpen(true)}
        >
          View Formal Result Analysis
        </button>
      )}

      {isObstacleMode && (
        <div className="board-tip" role="note" aria-live="polite">
          Hold left click and drag to paint obstacles. Start on a wall to erase while dragging. Press Esc to exit obstacle mode.
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        settingsDraft={settingsDraft}
        setSettingsDraft={setSettingsDraft}
        closeSettings={closeSettings}
        saveSettings={saveSettings}
        resetSettingsToDefaults={resetSettingsToDefaults}
      />

      <LegendModal isOpen={isLegendOpen} closeLegend={closeLegend} />

      {isQuizMode && (
        <GameHud
          scoreState={scoreState}
          scorePopup={scorePopup}
          averageTriesPerQuestion={averageTriesPerQuestion}
          averageTryAccuracy={averageTryAccuracy}
        />
      )}

      <QuizOverlay quizState={quizState} isPaused={isPaused} />
    </>
  );
}

export default AppChrome;
