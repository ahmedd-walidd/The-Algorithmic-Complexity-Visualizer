import { Activity, Flame, Gauge, Target, Trophy, Zap } from 'lucide-react';

function GameHud({ scoreState, scorePopup, averageTriesPerQuestion, averageTryAccuracy }) {
  return (
    <div className="game-hud" aria-label="Pause-prediction challenge score">
      <div className="hud-row hud-row-score">
        <span className="hud-label"><Trophy className="hud-icon" /> SCORE</span>
        <span className="hud-value-wrap">
          <span className="hud-value hud-score">
            {scoreState.totalScore.toString().padStart(6, '0')}
          </span>
          {scorePopup && (
            <span className="score-popup-floating score-popup-score">
              +{scorePopup.questionScore}
            </span>
          )}
        </span>
      </div>

      <div className="hud-combo-bar" aria-label="Current combo multiplier">
        <span><Flame className="hud-icon" /> {scoreState.currentStreak} streak</span>
        <strong>x{(scoreState.comboMultiplier || 1).toFixed(2)}</strong>
      </div>

      <div className="hud-grid">
        <div className="hud-chip">
          <span className="hud-label"><Activity className="hud-icon" /> AVG TRIES</span>
          <span className="hud-value">
            {scoreState.questionsAnswered > 0 ? averageTriesPerQuestion.toFixed(1) : '-.-'}
          </span>
        </div>
        <div className="hud-chip">
          <span className="hud-label"><Target className="hud-icon" /> ACCURACY</span>
          <span className="hud-value-wrap">
            <span className="hud-value">
              {scoreState.questionsAnswered > 0 ? `${Math.round(averageTryAccuracy * 100)}%` : '--%'}
            </span>
            {scorePopup && (
              <span className="score-popup-floating score-popup-accuracy">
                {Math.round(scorePopup.accuracy * 100)}% in {scorePopup.responseSeconds.toFixed(1)}s
              </span>
            )}
          </span>
        </div>
        <div className="hud-chip">
          <span className="hud-label"><Zap className="hud-icon" /> PERFECT</span>
          <span className="hud-value">{scoreState.perfectAnswers}</span>
        </div>
        <div className="hud-chip">
          <span className="hud-label"><Gauge className="hud-icon" /> BEST</span>
          <span className="hud-value">{scoreState.bestStreak}</span>
        </div>
      </div>
    </div>
  );
}

export default GameHud;
