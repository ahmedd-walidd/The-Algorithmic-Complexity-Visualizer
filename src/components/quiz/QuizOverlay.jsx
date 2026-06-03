import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock3, Flame, Gauge, HelpCircle, MousePointer2, XCircle } from 'lucide-react';

function QuizOverlay({ quizState, isPaused }) {
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    if (!quizState?.active || quizState.awaitingContinue || !quizState.deadlineAt) return undefined;

    const intervalId = window.setInterval(() => {
      setNow(performance.now());
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [quizState?.active, quizState?.awaitingContinue, quizState?.deadlineAt]);

  const title = useMemo(() => {
    if (quizState?.feedbackType === 'correct') return quizState.lastScoring?.rank || 'Locked In';
    if (quizState?.feedbackType === 'incorrect') return 'Pressure Check';
    return isPaused ? 'Paused - Prediction Time' : `Prediction Round ${quizState?.challengeIndex || ''}`;
  }, [isPaused, quizState?.challengeIndex, quizState?.feedbackType, quizState?.lastScoring?.rank]);

  if (!quizState?.active) return null;

  const safeMessage = quizState.message?.replace(/^(Correct|Incorrect)[^a-zA-Z0-9]*/i, '') || '';
  const timeLimitSeconds = quizState.timeLimitSeconds || 0;
  const secondsRemaining = Math.max(0, ((quizState.deadlineAt || now) - now) / 1000);
  const timeRatio = timeLimitSeconds > 0 ? secondsRemaining / timeLimitSeconds : 0;
  const timerStyle = { '--timer-progress': `${Math.max(0, Math.min(1, timeRatio)) * 100}%` };
  const difficultyLabel = quizState.difficulty
    ? quizState.difficulty.charAt(0).toUpperCase() + quizState.difficulty.slice(1)
    : 'Medium';

  return (
    <div
      className={`quiz-overlay quiz-overlay-${quizState.feedbackType || 'question'} ${quizState.feedbackType !== 'question' ? 'quiz-shake' : ''}`}
    >
      <div className="quiz-header">
        {quizState.feedbackType === 'question' && <HelpCircle className="quiz-icon quiz-icon-question" />}
        {quizState.feedbackType === 'correct' && <CheckCircle className="quiz-icon quiz-icon-correct" />}
        {quizState.feedbackType === 'incorrect' && <XCircle className="quiz-icon quiz-icon-incorrect" />}
        <h2>{title}</h2>
      </div>

      <div className="quiz-challenge-strip" aria-label="Prediction challenge status">
        <span><Clock3 size={15} aria-hidden="true" /> {secondsRemaining.toFixed(1)}s</span>
        <span><MousePointer2 size={15} aria-hidden="true" /> {quizState.attemptCount || 0} tries</span>
        <span><Flame size={15} aria-hidden="true" /> {quizState.streak || 0} streak</span>
      </div>

      <div className={`quiz-difficulty quiz-difficulty-${quizState.difficulty || 'medium'}`}>
        <span><Gauge size={15} aria-hidden="true" /> {difficultyLabel}</span>
        {quizState.adaptationReason && <em>{quizState.adaptationReason}</em>}
      </div>

      <div className="quiz-timer-track" style={timerStyle} aria-hidden="true">
        <span />
      </div>

      <div className="quiz-body">
        <p>{safeMessage}</p>
      </div>

      {quizState.lastScoring && (
        <div className="quiz-score-breakdown" aria-label="Prediction score breakdown">
          <span>+{quizState.lastScoring.questionScore} score</span>
          <span>x{quizState.lastScoring.comboMultiplier.toFixed(2)} combo</span>
          <span>+{quizState.lastScoring.speedBonus} speed</span>
          <span>+{quizState.lastScoring.frontierBonus} frontier</span>
        </div>
      )}

      {quizState.awaitingContinue && (
        <button
          className={`quiz-continue-btn btn-${quizState.feedbackType || 'question'}`}
          type="button"
          onClick={() => quizState.continueFunc?.()}
          disabled={isPaused}
        >
          Continue Traversal
        </button>
      )}
    </div>
  );
}

export default QuizOverlay;
