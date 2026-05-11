import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';

function QuizOverlay({ quizState, isPaused }) {
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
        <h2>
          {quizState.feedbackType === 'question' && (isPaused ? 'Paused — Prediction Time!' : 'Prediction Time!')}
          {quizState.feedbackType === 'correct' && 'Brilliant!'}
          {quizState.feedbackType === 'incorrect' && 'Not Quite'}
        </h2>
      </div>
      <div className="quiz-body">
        <p>{safeMessage}</p>
      </div>
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
