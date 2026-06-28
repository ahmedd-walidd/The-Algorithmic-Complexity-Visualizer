import { useMemo } from 'react';
import { CheckCircle, Flame, HelpCircle, MousePointer2, XCircle } from 'lucide-react';

function QuizOverlay({ quizState, isPaused }) {
  const title = useMemo(() => {
    if (quizState?.feedbackType === 'correct') return quizState.lastScoring?.rank || 'Locked In';
    if (quizState?.feedbackType === 'incorrect') return 'Pressure Check';
    return isPaused ? 'Paused Prediction' : `Prediction Round ${quizState?.challengeIndex || ''}`;
  }, [isPaused, quizState?.challengeIndex, quizState?.feedbackType, quizState?.lastScoring?.rank]);

  if (!quizState?.active) return null;

  const safeMessage = quizState.message?.replace(/^(Correct|Incorrect)[^a-zA-Z0-9]*/i, '') || '';

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
        <span><MousePointer2 size={15} aria-hidden="true" /> {quizState.attemptCount || 0} tries</span>
        <span><Flame size={15} aria-hidden="true" /> {quizState.streak || 0} streak</span>
      </div>

      <div className="quiz-body">
        <p>{safeMessage}</p>
      </div>

      {quizState.lastScoring && (
        <div className="quiz-score-breakdown" aria-label="Prediction score breakdown">
          <span>+{quizState.lastScoring.questionScore} score</span>
          <span>x{quizState.lastScoring.comboMultiplier.toFixed(2)} combo</span>
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
