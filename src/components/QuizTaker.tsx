import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, QuizResult, Difficulty } from '../types';
import { figureHintPanelTitle, resolveFigureHintsForQuestion } from '../utils/buildFigureHints';
import { buildStudentSolutionWalkthrough } from '../utils/buildStudentSolutionWalkthrough';
import { parseStandardCodeMeta } from '../utils/parseStandardCode';
import { processQuizSvg } from '../utils/processQuizSvg';
import { prefersDeterministicVisual } from '../utils/questionFocusedImagePrompt';
import {
  hasUsableImageDataUrl,
  hasUsableQuizFigure,
  hasUsableSvgMarkup,
} from '../utils/hasUsableQuizFigure';
import { MathHtml } from './MathHtml';
import StudentSolutionWalkthrough from './StudentSolutionWalkthrough';
import { MotionDiagram } from './motion-diagrams';
import { dbService } from '../services/dbService';
import { getAdaptiveDecision, selectNextQuestionIndex } from '../services/adaptiveQuizService';
import { CheckCircle, XCircle, ArrowRight, Hash, Image as ImageIcon, Gauge, LogOut } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface Props {
  quiz: Quiz;
  onComplete: (results: QuizResult[]) => void;
  onHome: () => void;
}

const QuizTaker: React.FC<Props> = ({ quiz, onComplete, onHome }) => {
  const adaptiveEnabled = Boolean(quiz.config.adaptiveEnabled);
  const initialTargetDifficulty = quiz.config.startDifficulty || (quiz.config.difficulty === 'Mixed' ? 'Medium' : quiz.config.difficulty);
  const initialQuestionIdx = selectNextQuestionIndex({
    questions: quiz.questions,
    usedIndexes: new Set<number>(),
    targetDifficulty: initialTargetDifficulty,
  }) ?? 0;
  const [askedQuestionIndexes, setAskedQuestionIndexes] = useState<number[]>([initialQuestionIdx]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [targetDifficulty, setTargetDifficulty] = useState<Difficulty>(initialTargetDifficulty);
  const [pendingAdaptiveDecision, setPendingAdaptiveDecision] = useState<{
    nextDifficulty: Difficulty;
    reason: string;
    changed: boolean;
  } | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  const [showFigure, setShowFigure] = useState(true);
  const [figureSource, setFigureSource] = useState<'primary' | 'geogebra'>('primary');

  const questionBank = quiz.questions;
  const activeQuestionIndex = adaptiveEnabled
    ? askedQuestionIndexes[currentQuestionIdx] ?? 0
    : currentQuestionIdx;
  const question = questionBank[activeQuestionIndex];

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentQuestionIdx]);

  useEffect(() => {
    if (!question) return;
    const isTableSvg =
      hasUsableSvgMarkup(question.visual) &&
      !hasUsableImageDataUrl(question.generatedImageBase64) &&
      question.visualSpec?.visualType === 'table';
    setShowFigure(!isTableSvg);
    setFigureSource('primary');
  }, [activeQuestionIndex, question?.generatedImageBase64, question?.visual, question?.visualSpec?.visualType, question]);

  const hasPrimaryFigure =
    hasUsableImageDataUrl(question?.generatedImageBase64) || hasUsableSvgMarkup(question?.visual);
  const hasGeoGebraFigure = hasUsableImageDataUrl(question?.geogebraImageBase64);
  const showFigureSourceToggle = hasPrimaryFigure && hasGeoGebraFigure;

  const handleSelect = (idx: number) => {
    if (showFeedback) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;

    const timeTaken = (Date.now() - startTime) / 1000;
    const isCorrect = selectedOption === question.correctAnswerIndex;

    const result: QuizResult = {
      questionIndex: activeQuestionIndex,
      selectedOptionIndex: selectedOption,
      isCorrect,
      timeTaken,
      difficulty: question.difficulty,
      questionId: question.id,
      sourceType: question.sourceType,
      generatedByAi: question.generatedByAi,
      feedbackUsed: question.feedbackGuidance,
    };

    const user = dbService.getCurrentUser();
    if (user) {
      dbService.logAction(user.id, 'QUESTION_ANSWER', {
        qId: question.id,
        correct: isCorrect,
        time: timeTaken,
      });
    }

    const newResults = [...results, result];
    if (adaptiveEnabled) {
      const decision = getAdaptiveDecision({
        config: quiz.config,
        currentTargetDifficulty: targetDifficulty,
        latestIsCorrect: isCorrect,
        resultsWithCurrent: newResults,
      });
      result.nextDifficulty = decision.nextDifficulty;
      result.adaptiveDecisionReason = decision.reason;
      result.difficultyChanged = decision.changed;
      setPendingAdaptiveDecision(decision);
    } else {
      setPendingAdaptiveDecision(null);
    }
    setResults(newResults);
    setShowFeedback(true);
  };

  const handleNext = () => {
    const maxQuestions = Math.min(quiz.config.questionCount, questionBank.length);
    const isLastQuestion = results.length >= maxQuestions;

    if (isLastQuestion) {
      onComplete(results);
    } else {
      if (adaptiveEnabled && pendingAdaptiveDecision) {
        const used = new Set<number>(askedQuestionIndexes);
        const nextQuestion = selectNextQuestionIndex({
          questions: questionBank,
          usedIndexes: used,
          targetDifficulty: pendingAdaptiveDecision.nextDifficulty,
        });
        const fallback = questionBank.findIndex((_, idx) => !used.has(idx));
        const nextIndex = nextQuestion ?? fallback;
        if (nextIndex === -1 || nextIndex == null) {
          onComplete(results);
          return;
        }
        setTargetDifficulty(pendingAdaptiveDecision.nextDifficulty);
        setAskedQuestionIndexes((prev) => [...prev, nextIndex]);
        setCurrentQuestionIdx((curr) => curr + 1);
      } else {
        setCurrentQuestionIdx((curr) => Math.min(curr + 1, questionBank.length - 1));
      }
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };

  const maxQuestionCount = Math.min(quiz.config.questionCount, questionBank.length);
  const progress = (results.length / maxQuestionCount) * 100;
  const reduceMotion = useReducedMotion();

  const difficultyPillClass = (d: Difficulty) => {
    switch (d) {
      case 'Easy':
        return 'quiz-difficulty-pill--easy';
      case 'Medium':
        return 'quiz-difficulty-pill--medium';
      case 'Hard':
        return 'quiz-difficulty-pill--hard';
      default:
        return '';
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (!question) return;

      if (event.key === 'Enter') {
        if (target && target.tagName === 'BUTTON') return;
        if (!showFeedback && selectedOption !== null) {
          event.preventDefault();
          handleSubmitAnswer();
        } else if (showFeedback) {
          event.preventDefault();
          handleNext();
        }
        return;
      }

      if (showFeedback) return;
      const key = event.key.toLowerCase();
      let idx = -1;
      if (/^[1-9]$/.test(key)) idx = Number(key) - 1;
      else if (/^[a-z]$/.test(key)) idx = key.charCodeAt(0) - 97;
      if (idx >= 0 && idx < question.options.length) {
        event.preventDefault();
        setSelectedOption(idx);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const hasFigure = hasUsableQuizFigure(question);
  const quizGradeToken = useMemo(
    () => parseStandardCodeMeta(quiz.standardCode).gradeToken,
    [quiz.standardCode],
  );
  const figureHints = useMemo(
    () => (question && hasFigure ? resolveFigureHintsForQuestion(question, quizGradeToken) : []),
    [hasFigure, question, quizGradeToken],
  );
  const figureHintTitle = useMemo(() => figureHintPanelTitle(quizGradeToken), [quizGradeToken]);

  const solutionSteps = useMemo(
    () => (question ? buildStudentSolutionWalkthrough(question) : []),
    [question],
  );

  const lastResult = results[results.length - 1];
  const feedbackIsCorrect = lastResult?.isCorrect ?? false;

  const adaptiveNote =
    adaptiveEnabled && pendingAdaptiveDecision && showFeedback ? (
      <div className="studio-alert studio-alert--info mt-4">
        Next question difficulty: <strong>{pendingAdaptiveDecision.nextDifficulty}</strong>{' '}
        <span>({pendingAdaptiveDecision.reason.replaceAll('_', ' ')})</span>
      </div>
    ) : null;

  if (!question) {
    return (
      <div className="max-w-xl mx-auto app-card p-8 sm:p-10" role="alert">
        <MotionDiagram name="Blank" width={180} className="-ml-2 mb-2" />
        <h1 className="app-page-title text-2xl">This question didn&apos;t load</h1>
        <p className="app-page-lede mt-2">
          End this practice to see results for the questions answered so far, then generate the quiz again.
        </p>
        <button type="button" onClick={() => onComplete(results)} className="mt-6 quiz-btn-check app-btn-primary">
          End practice
        </button>
      </div>
    );
  }

  const currentQ = Math.min(currentQuestionIdx + 1, maxQuestionCount);
  const progressPct = Math.round(progress);

  const getOptionStateClass = (idx: number): string => {
    if (!showFeedback) return selectedOption === idx ? 'quiz-option--selected' : '';
    if (idx === question.correctAnswerIndex) return 'quiz-option--correct';
    if (idx === selectedOption && idx !== question.correctAnswerIndex) return 'quiz-option--incorrect';
    return 'quiz-option--muted';
  };

  const useStructuredSvgPrimary = Boolean(
    question.visual && prefersDeterministicVisual(question),
  );

  const renderFigureContent = () => {
    if (figureSource === 'geogebra' && hasGeoGebraFigure) {
      return (
        <>
          <img src={question.geogebraImageBase64} alt="GeoGebra figure for this question" />
          <p className="quiz-figure-credit">GeoGebra, non-commercial educational use</p>
        </>
      );
    }
    if (useStructuredSvgPrimary) {
      return (
        <motion.div
          className="svg-visual-container flex items-center justify-center p-2"
          dangerouslySetInnerHTML={{ __html: processQuizSvg(question.visual || '') || '' }}
        />
      );
    }
    if (question.generatedImageBase64) {
      return <img src={question.generatedImageBase64} alt="Figure for this question" />;
    }
    if (hasGeoGebraFigure && !hasPrimaryFigure) {
      return <img src={question.geogebraImageBase64} alt="GeoGebra figure for this question" />;
    }
    return <div className="svg-visual-container flex items-center justify-center p-2" dangerouslySetInnerHTML={{ __html: processQuizSvg(question.visual || '') || '' }} />;
  };

  return (
    <div className="quiz-page">
      <div className="quiz-progress-header">
        <h1 className="quiz-progress-label">
          Question {currentQ} of {maxQuestionCount}
        </h1>
        <span className="quiz-progress-pct">{progressPct}% complete</span>
      </div>
      <div
        className="quiz-progress-track mb-3"
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={maxQuestionCount}
        aria-valuenow={results.length}
      >
        <div className="quiz-progress-fill" style={{ transform: `scaleX(${progress / 100})` }} />
      </div>

      <div className="quiz-card">
        <header className="quiz-toolbar">
          <div className="quiz-toolbar-meta">
            <button type="button" onClick={onHome} className="app-btn-secondary quiz-exit-btn shrink-0">
              <LogOut className="w-4 h-4" strokeWidth={1.75} aria-hidden />
              Exit quiz
            </button>
          </div>
          <div className="quiz-toolbar-badges">
            <span className={`quiz-difficulty-pill ${difficultyPillClass(question.difficulty)}`}>
              <Gauge className="w-3.5 h-3.5" aria-hidden />
              {question.difficulty}
            </span>
            <span className="quiz-standard-chip" title={quiz.standardCode} translate="no">
              <Hash className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="truncate">{quiz.standardCode}</span>
            </span>
          </div>
        </header>

        <div className="quiz-main-body">
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:items-stretch">
            <div
              className="quiz-question-pane"
              style={{ borderColor: 'var(--border-soft)' }}
            >
              <h2 className="quiz-stem" id="quiz-stem">
                <MathHtml text={question.text} className="block" />
              </h2>

              <motion.div
                key={`options-${activeQuestionIndex}`}
                className="quiz-options"
                role="group"
                aria-labelledby="quiz-stem"
                initial={reduceMotion ? false : 'hidden'}
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.04 } },
                  hidden: {},
                }}
              >
                {question.options.map((option, idx) => {
                  const isRight = showFeedback && idx === question.correctAnswerIndex;
                  const isWrongPick = showFeedback && idx === selectedOption && idx !== question.correctAnswerIndex;
                  return (
                    <motion.button
                      key={`${currentQuestionIdx}-${idx}`}
                      type="button"
                      variants={{
                        hidden: { opacity: 0, y: 4 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      onClick={() => handleSelect(idx)}
                      className={`quiz-option ${getOptionStateClass(idx)}`}
                      disabled={showFeedback}
                      aria-pressed={selectedOption === idx}
                    >
                      <span className="quiz-option-content">
                        <span className="quiz-option-badge" aria-hidden>{String.fromCharCode(65 + idx)}</span>
                        <MathHtml text={option} className="min-w-0 flex-1" />
                      </span>
                      {isRight && (
                        <span className="shrink-0 inline-flex items-center gap-1">
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 quiz-result-icon--ok" aria-hidden />
                          <span className="sr-only">Correct answer</span>
                        </span>
                      )}
                      {isWrongPick && (
                        <span className="shrink-0 inline-flex items-center gap-1">
                          <XCircle className="w-5 h-5 sm:w-6 sm:h-6 quiz-result-icon--bad" aria-hidden />
                          <span className="sr-only">Your answer</span>
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
              <p className="sr-only-live" role="status" aria-live="polite">
                {showFeedback ? (feedbackIsCorrect ? 'Correct.' : 'Not quite. The correct answer is highlighted.') : ''}
              </p>
            </div>

            {hasFigure && (
              <aside
                className="quiz-figure-aside"
                style={{ borderColor: 'var(--border-soft)' }}
                aria-label="Figure"
              >
                <div className="quiz-figure-inner">
                  <div className="quiz-figure-header">
                    <div className="quiz-figure-title">
                      <ImageIcon className="w-4 h-4" aria-hidden />
                      <span>Figure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {showFigureSourceToggle && (
                        <div className="quiz-segment-toggle" role="group" aria-label="Figure source">
                          <button
                            type="button"
                            onClick={() => setFigureSource('primary')}
                            aria-pressed={figureSource === 'primary'}
                          >
                            Standard
                          </button>
                          <button
                            type="button"
                            onClick={() => setFigureSource('geogebra')}
                            aria-pressed={figureSource === 'geogebra'}
                          >
                            GeoGebra
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowFigure((v) => !v)}
                        className="app-btn-secondary quiz-figure-toggle"
                        aria-expanded={showFigure}
                      >
                        {showFigure ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  {showFigure ? (
                    <>
                      <div className="quiz-figure-frame" key={`figure-${activeQuestionIndex}-${figureSource}`}>
                        {renderFigureContent()}
                      </div>
                      {figureHints.length > 0 && (
                        <div className="quiz-hints" aria-label={figureHintTitle}>
                          <p className="quiz-hints-title">{figureHintTitle}</p>
                          <ul className="quiz-hints-list">
                            {figureHints.map((hint, hintIdx) => (
                              <li key={`${activeQuestionIndex}-hint-${hintIdx}`}>
                                <MathHtml text={hint} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="quiz-figure-note">Figure hidden. Select Show to bring it back.</p>
                  )}
                </div>
              </aside>
            )}
          </div>

          <AnimatePresence>
            {showFeedback && (
              <motion.div
                key={`walkthrough-${activeQuestionIndex}`}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <StudentSolutionWalkthrough
                  question={question}
                  steps={solutionSteps}
                  isCorrect={feedbackIsCorrect}
                  selectedOptionIndex={selectedOption ?? -1}
                  adaptiveNote={adaptiveNote}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="quiz-footer">
          <p className="quiz-kbd-hint" aria-hidden>
            Press <kbd>A</kbd>–<kbd>{String.fromCharCode(64 + question.options.length)}</kbd> to choose,{' '}
            <kbd>Enter</kbd> to {showFeedback ? 'continue' : 'check'}
          </p>
          {!showFeedback ? (
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className="app-btn-primary quiz-btn-check"
            >
              Check answer
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="app-btn-primary quiz-btn-check inline-flex items-center justify-center gap-2"
            >
              {results.length >= maxQuestionCount ? 'See results' : 'Next question'}
              <ArrowRight className="w-5 h-5" aria-hidden />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default QuizTaker;


