import ControlPanel from '../ControlPanel/ControlPanel';
import StatusBadge from '../common/StatusBadge/StatusBadge';
import RunSummaryModal from '../RunSummaryModal/RunSummaryModal';
import TopNavigation from './TopNavigation';
import QuizOverlay from '../quiz/QuizOverlay';
import SettingsModal from '../modals/SettingsModal';
import LegendModal from '../modals/LegendModal';

const BASE_STATUS_KEY_ITEMS = [
  { tone: 'visited', label: 'Blue = checked nodes' },
  { tone: 'path', label: 'Yellow = final path' },
];

function getStatusKeyItems(simulationPhase, { isQuizMode, quizState }) {
  const keyItems = [...BASE_STATUS_KEY_ITEMS];

  if (quizState?.active || isQuizMode) {
    keyItems.push({ tone: 'candidate', label: 'Cyan glow = prediction choice' });
  }

  if (simulationPhase === 'paused' && !quizState?.active) {
    keyItems.push({ tone: 'next', label: 'Gold outline = next expansion' });
  }

  return keyItems;
}

function getStatusDescription(simulationPhase, { isQuizMode, isObstacleMode, quizState }) {
  if (quizState?.active) {
    return 'Prediction pause: click one glowing frontier node to choose what the algorithm should expand next.';
  }

  if (isObstacleMode) {
    return 'Obstacle mode: grey cells are walls. The algorithm cannot move through them.';
  }

  switch (simulationPhase) {
    case 'visited':
      return 'Searching: blue cells are nodes the algorithm has already checked and expanded.';
    case 'paused':
      return 'Paused: the frontier is frozen so you can inspect which node would be expanded next.';
    case 'path':
      return 'Path reveal: yellow cells trace the route returned from start to goal.';
    case 'done':
      return 'Run complete: blue shows the searched area, and yellow shows the final path if one was found.';
    case 'idle':
    default:
      return isQuizMode
        ? 'Ready: Pause-Prediction will stop at decision points and ask you to choose the next frontier node.'
        : 'Ready: choose an algorithm, add walls if you want, then start the visualization.';
  }
}

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
  onTogglePause,
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
  isLightMode,
  onThemeToggle,
}) {
  const statusDescription = getStatusDescription(simulationPhase, {
    isQuizMode,
    isObstacleMode,
    quizState,
  });
  const statusKeyItems = getStatusKeyItems(simulationPhase, { isQuizMode, quizState });

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
        isLightMode={isLightMode}
        onThemeToggle={onThemeToggle}
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
        isPaused={isPaused}
        isMazeGenerating={isMazeGenerating}
        isTimelineControlDisabled={!isVisualizing || isRaceMode || quizState.active}
        onTogglePause={onTogglePause}
        onRewind={() => jumpTimeline('backward')}
        onFastForward={() => jumpTimeline('forward')}
      />

      <StatusBadge
        className={`status-badge-${simulationPhase}`}
        label="Simulation State"
        value={simulationPhaseDisplay}
        description={statusDescription}
        keyItems={statusKeyItems}
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
