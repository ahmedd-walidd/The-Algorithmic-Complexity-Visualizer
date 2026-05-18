import { HelpCircle, Settings } from 'lucide-react';

function TopNavigation({
  currentRoute,
  hasRunSummary,
  onNavigate,
  onOpenFormalAnalysis,
  onOpenLegend,
  onOpenSettings,
  isLegendOpen,
  isSettingsOpen,
  isQuizMode,
  scoreState,
  scorePopup,
  averageTriesPerQuestion,
  averageTryAccuracy,
}) {
  const showScore = Boolean(isQuizMode && scoreState);
  const hasAnswers = Boolean(scoreState?.questionsAnswered > 0);
  const accuracyLabel = hasAnswers
    ? `${Math.round(averageTryAccuracy * 100)}%`
    : '--%';
  const avgTriesLabel = hasAnswers
    ? averageTriesPerQuestion.toFixed(1)
    : '-.-';

  return (
    <nav className="top-navigation" aria-label="Primary lab navigation">
      {showScore && (
        <div className="top-navigation-score" aria-label="Pause-prediction scoring">
          <div className="top-navigation-score-item">
            <span>Score</span>
            <strong>{scoreState.totalScore.toString().padStart(6, '0')}</strong>
            {scorePopup && (
              <em className="top-navigation-score-popup">+{scorePopup.questionScore}</em>
            )}
          </div>
          <div className="top-navigation-score-item">
            <span>Streak</span>
            <strong>{scoreState.currentStreak}</strong>
          </div>
          <div className="top-navigation-score-item">
            <span>Accuracy</span>
            <strong>{accuracyLabel}</strong>
          </div>
          <div className="top-navigation-score-item">
            <span>Avg tries</span>
            <strong>{avgTriesLabel}</strong>
          </div>
        </div>
      )}

      <div className="top-navigation-group top-navigation-group-tabs">
        <button
          type="button"
          className={`top-navigation-tab ${currentRoute === '/visualizer' ? 'active' : ''}`}
          onClick={() => onNavigate('/visualizer')}
        >
          Visualizer Lab
        </button>
        <button
          type="button"
          className={`top-navigation-tab ${currentRoute === '/truth-scanner' ? 'active' : ''}`}
          onClick={() => onNavigate('/truth-scanner')}
        >
          Truth Scanner
        </button>
        <button
          type="button"
          className="top-navigation-tab top-navigation-tab-analysis"
          onClick={onOpenFormalAnalysis}
          disabled={!hasRunSummary}
          title={
            hasRunSummary
              ? 'Open the latest run-specific Formal Result Analysis'
              : 'Run an algorithm to unlock Formal Result Analysis'
          }
        >
          Formal Results Analysis
        </button>
      </div>

      {(onOpenLegend || onOpenSettings) && (
        <div className="top-navigation-group top-navigation-group-actions">
          {onOpenLegend && (
            <button
              type="button"
              className="top-navigation-action"
              onClick={onOpenLegend}
              aria-haspopup="dialog"
              aria-expanded={Boolean(isLegendOpen)}
              aria-label="Open legend"
              title="Open legend"
            >
              <HelpCircle className="top-navigation-action-icon" aria-hidden="true" />
            </button>
          )}
          {onOpenSettings && (
            <button
              type="button"
              className="top-navigation-action"
              onClick={onOpenSettings}
              aria-haspopup="dialog"
              aria-expanded={Boolean(isSettingsOpen)}
              aria-label="Open settings"
              title="Open settings"
            >
              <Settings className="top-navigation-action-icon" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

export default TopNavigation;
