/**
 * Dev-only fixture screens for reviewing late-workflow UI without running the AI pipeline.
 *
 * Mounted at `#/dev/screens/analysis` and `#/dev/screens/remedial` only when `import.meta.env.DEV` is true.
 */
import React, { useState } from 'react';
import AuthScreen from '../components/AuthScreen';
import GapAnalysis from '../components/GapAnalysis';
import LoadingStage from '../components/LoadingStage';
import QuizGenerator from '../components/QuizGenerator';
import QuizTaker from '../components/QuizTaker';
import RemedialSlides from '../components/RemedialSlides';
import { renderDeterministicVisualSvg } from '../utils/visualSpec';
import { FIXTURE_DECK } from './remedialFixtures';
import {
  GapType,
  type AnalysisAttemptRow,
  type GapAnalysis as GapAnalysisType,
  type Quiz,
  type RemedialSlide,
} from '../types';

const STANDARD = 'MA.4.FR.2.2';

const attempt = (
  attemptOrder: number,
  difficultyPresented: AnalysisAttemptRow['difficultyPresented'],
  isCorrect: boolean,
  selected: string,
  correct: string,
): AnalysisAttemptRow => ({
  attemptOrder,
  questionIndex: attemptOrder - 1,
  questionId: `fixture-q${attemptOrder}`,
  standardCode: STANDARD,
  strandCode: 'FR',
  selectedOptionIndex: 0,
  selectedOptionText: selected,
  correctOptionText: correct,
  isCorrect,
  timeTakenSec: 30 + attemptOrder * 4,
  difficultyPresented,
  adaptiveDecisionReason: isCorrect ? 'correct_step_up' : 'incorrect_step_down',
  sourceType: 'rewrite',
  generatedByAi: true,
  misconceptionSignal: '',
  strategyTip: '',
  tieredNextStep: '',
});

const ANALYSIS: GapAnalysisType = {
  standardCode: STANDARD,
  confidenceScore: 78,
  summary:
    'The student adds fractions with like denominators correctly in simple cases but adds the denominators together when the fractions appear in a word problem. Mixed-number answers are often left unsimplified.',
  identifiedGaps: [
    {
      gapType: GapType.Conceptual,
      description: 'Treats the denominator as a count to combine rather than the size of each part.',
      relatedQuestions: [1, 3],
      misconception: '2/5 + 1/5 = 3/10 because you add the tops and the bottoms.',
    },
    {
      gapType: GapType.Procedural,
      description: 'Converts improper fractions to mixed numbers inconsistently.',
      relatedQuestions: [4],
    },
    {
      gapType: GapType.Computational,
      description: 'Small addition slips when numerators are larger than 10.',
      relatedQuestions: [5],
    },
  ],
  subSkills: [
    { name: 'Add like-denominator fractions', description: 'Sums with denominators up to 12', correctCount: 3, totalCount: 4 },
    { name: 'Word problems', description: 'Fractions in context', correctCount: 1, totalCount: 3 },
    { name: 'Mixed numbers', description: 'Convert and simplify', correctCount: 1, totalCount: 2 },
    { name: 'Number line models', description: 'Locate sums on a line', correctCount: 2, totalCount: 2 },
  ],
  attemptRows: [
    attempt(1, 'Medium', true, '3/5', '3/5'),
    attempt(2, 'Hard', false, '3/10', '3/5'),
    attempt(3, 'Medium', true, '5/8', '5/8'),
    attempt(4, 'Hard', false, '9/4', '2 1/4'),
    attempt(5, 'Medium', false, '13/12', '14/12'),
    attempt(6, 'Easy', true, '2/3', '2/3'),
  ],
  questionDiagnostics: [
    {
      attemptOrder: 2,
      questionIndex: 1,
      questionId: 'fixture-q2',
      errorType: 'conceptual',
      misconception: 'Adds denominators when combining parts of a whole.',
      misconceptionCandidates: [],
      evidenceSource: 'standard',
      confidenceScore: 86,
      confidenceLabel: 'high',
      notes: '',
    },
    {
      attemptOrder: 4,
      questionIndex: 3,
      questionId: 'fixture-q4',
      errorType: 'procedural',
      misconception: 'Leaves improper fractions unconverted.',
      misconceptionCandidates: [],
      evidenceSource: 'strand',
      confidenceScore: 64,
      confidenceLabel: 'medium',
      notes: '',
    },
  ],
  teacherActions: [
    'Reteach fraction addition with area models before moving to symbols.',
    'Pair word problems with a drawn model for the next two lessons.',
  ],
  studentActions: ['Draw a bar model before adding.', 'Check: did the size of the pieces change?'],
  reliabilityFlags: ['Only 6 questions answered. Confidence improves with 8 or more.'],
};

const SLIDES: RemedialSlide[] = FIXTURE_DECK;

const QUIZ: Quiz = {
  standardCode: STANDARD,
  config: {
    questionCount: 3,
    difficulty: 'Mixed',
    mode: 'topic-based',
    questionTypes: { multipleChoice: true, trueFalse: false, fillInBlank: false },
    focusAreas: { wordProblems: true, visualQuestions: true, realWorld: false },
    adaptiveEnabled: true,
    startDifficulty: 'Medium',
  },
  questions: [
    {
      id: 'fixture-quiz-1',
      text: 'The bar is split into equal parts. What fraction of the bar is shaded?',
      options: ['3/5', '2/5', '3/2', '5/3'],
      correctAnswerIndex: 0,
      explanation: '3 of the 5 equal parts are shaded, so the fraction is 3/5.',
      animationDescription: '',
      difficulty: 'Medium',
      visual: renderDeterministicVisualSvg({ visualType: 'fraction_bar', totalParts: 5, shadedParts: 3 }) || '',
      figureHints: ['Count all the equal parts.', 'Count the shaded parts.'],
    },
    {
      id: 'fixture-quiz-2',
      text: 'What is $\\frac{2}{8} + \\frac{3}{8}$?',
      options: ['5/16', '5/8', '6/8', '1/8'],
      correctAnswerIndex: 1,
      explanation: 'Add the numerators and keep the denominator.',
      animationDescription: '',
      difficulty: 'Hard',
    },
    {
      id: 'fixture-quiz-3',
      text: 'Which sum equals 1 whole?',
      options: ['1/4 + 2/4', '2/4 + 2/4', '3/8 + 3/8'],
      correctAnswerIndex: 1,
      explanation: '2/4 + 2/4 = 4/4 = 1.',
      animationDescription: '',
      difficulty: 'Easy',
    },
  ],
};

const ScreensGalleryRoute: React.FC<{ route: string }> = ({ route }) => {
  const screen = route.replace('#/dev/screens', '').replace(/^\//, '') || 'analysis';
  const [loadingSlides, setLoadingSlides] = useState(false);
  const goHome = () => {
    window.location.hash = '#/dev/screens';
  };

  if (screen === 'auth') return <AuthScreen onLogin={goHome} />;

  return (
    <div className="app-shell app-shell-bg min-h-screen">
      <nav className="flex flex-wrap gap-3 px-4 py-3 text-sm" aria-label="Fixture screens">
        <a className="app-link" href="#/dev/screens/auth">Sign in</a>
        <a className="app-link" href="#/dev/screens/studio">Studio</a>
        <a className="app-link" href="#/dev/screens/quiz">Quiz</a>
        <a className="app-link" href="#/dev/screens/quiz-error">Quiz (error)</a>
        <a className="app-link" href="#/dev/screens/analysis">Analysis</a>
        <a className="app-link" href="#/dev/screens/analysis-empty">Analysis (no gaps)</a>
        <a className="app-link" href="#/dev/screens/remedial">Remedial</a>
        <a className="app-link" href="#/dev/screens/loading">Loading</a>
      </nav>
      <main className="px-4 pb-10 pt-2 sm:px-6">
        {screen === 'studio' && <QuizGenerator onGenerate={() => undefined} isLoading={false} />}
        {screen === 'quiz' && <QuizTaker quiz={QUIZ} onComplete={goHome} onHome={goHome} />}
        {screen === 'quiz-error' && (
          <QuizTaker quiz={{ ...QUIZ, questions: [] }} onComplete={goHome} onHome={goHome} />
        )}
        {screen === 'analysis' && (
          <GapAnalysis
            analysis={ANALYSIS}
            isLoadingSlides={loadingSlides}
            onStartRemediation={() => setLoadingSlides((v) => !v)}
          />
        )}
        {screen === 'analysis-empty' && (
          <GapAnalysis
            analysis={{ ...ANALYSIS, identifiedGaps: [], confidenceScore: 92, reliabilityFlags: [] }}
            isLoadingSlides={false}
            onStartRemediation={() => undefined}
          />
        )}
        {screen === 'remedial' && <RemedialSlides slides={SLIDES} onRestart={goHome} onHome={goHome} />}
        {screen === 'loading' && (
          <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            <LoadingStage
              message="Designing aligned assessment prompts…"
              steps={[
                { text: 'Reading your selected standard…' },
                { text: 'Designing aligned assessment prompts…' },
                { text: 'Calibrating question difficulty and flow…' },
              ]}
              stepIndex={1}
            />
            <LoadingStage
              message="Analyzing Performance & Identifying Gaps..."
              steps={[]}
              stepIndex={1}
            />
            <LoadingStage
              message="Creating Personalized Learning Slides..."
              steps={[]}
              stepIndex={2}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default ScreensGalleryRoute;
