import { Activity, Trophy, Target } from 'lucide-react';

function GameHud({ scoreState, scorePopup, averageTriesPerQuestion, averageTryAccuracy }) {
  return (
    <div className="game-hud" aria-label="Gamification score">
      <div className="hud-row">
        <span className="hud-label"><Activity className="hud-icon" /> TRIES AVG</span>
        <span className="hud-value">
          {scoreState.questionsAnswered > 0 ? averageTriesPerQuestion.toFixed(1) : '-.-'}
        </span>
      </div>
      <div className="hud-row">
        <span className="hud-label"><Trophy className="hud-icon" /> SCORE</span>
        <span className="hud-value-wrap">
          <span className="hud-value">
            {scoreState.totalScore.toString().padStart(6, '0')}
          </span>
          {scorePopup && (
            <span className="score-popup-floating score-popup-score">
              +{scorePopup.questionScore}
            </span>
          )}
        </span>
      </div>
      <div className="hud-row">
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
    </div>
  );
}

export default GameHud;
