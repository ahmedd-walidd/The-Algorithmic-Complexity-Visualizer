import ControlPanel from '../ControlPanel/ControlPanel';
import StatusBadge from '../common/StatusBadge/StatusBadge';
import RunSummaryModal from '../RunSummaryModal/RunSummaryModal';
import TopNavigation from './TopNavigation';
import QuizOverlay from '../quiz/QuizOverlay';
import SettingsModal from '../modals/SettingsModal';
import LegendModal from '../modals/LegendModal';

function AppChrome({
  algorithm,
  averageTriesPerQuestion,
  averageTryAccuracy,
  closeLegend,
  closeSettings,
  currentRoute,
  exportRows,
  handleClearBoard,
  handleClearPath,
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
  onNavigate,
  onOpenFormalAnalysis,
  onOpenTruthTerm,
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
      <TopNavigation
        currentRoute={currentRoute}
        hasRunSummary={Boolean(runSummary)}
        onNavigate={onNavigate}
        onOpenFormalAnalysis={onOpenFormalAnalysis}
        onOpenLegend={openLegend}
        onOpenSettings={openSettings}
        isLegendOpen={isLegendOpen}
        isSettingsOpen={isSettingsOpen}
        isQuizMode={isQuizMode}
        scoreState={scoreState}
        scorePopup={scorePopup}
        averageTriesPerQuestion={averageTriesPerQuestion}
        averageTryAccuracy={averageTryAccuracy}
      />

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
        exportRows={exportRows}
        onOpenTruthTerm={onOpenTruthTerm}
      />

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

      <QuizOverlay quizState={quizState} isPaused={isPaused} />
    </>
  );
}

export default AppChrome;
