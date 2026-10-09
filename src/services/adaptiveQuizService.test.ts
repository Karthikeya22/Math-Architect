import { describe, expect, it } from 'vitest';
import { getAdaptiveDecision, selectNextQuestionIndex } from './adaptiveQuizService';
import type { Question, QuizConfig, QuizResult } from '../types';

const baseConfig: QuizConfig = {
  questionCount: 10,
  difficulty: 'Medium',
  mode: 'item-bank',
  questionTypes: { multipleChoice: true, trueFalse: false, fillInBlank: false },
  focusAreas: { wordProblems: true, visualQuestions: true, realWorld: false },
};

const mkResult = (isCorrect: boolean): QuizResult => ({
  questionIndex: 0,
  selectedOptionIndex: 0,
  isCorrect,
  timeTaken: 5,
  difficulty: 'Medium',
});

describe('adaptiveQuizService', () => {
  it('staircase policy raises on correct', () => {
    const decision = getAdaptiveDecision({
      config: { ...baseConfig, adaptivePolicy: 'staircase_1up1down' },
      currentTargetDifficulty: 'Medium',
      latestIsCorrect: true,
      resultsWithCurrent: [mkResult(true)],
    });
    expect(decision.nextDifficulty).toBe('Hard');
    expect(decision.reason).toContain('raise');
  });

  it('mastery policy lowers after two consecutive wrong answers', () => {
    const decision = getAdaptiveDecision({
      config: { ...baseConfig, adaptivePolicy: 'mastery_blocks' },
      currentTargetDifficulty: 'Medium',
      latestIsCorrect: false,
      resultsWithCurrent: [mkResult(false), mkResult(false)],
    });
    expect(decision.nextDifficulty).toBe('Easy');
    expect(decision.reason).toBe('mastery_two_wrong_lower');
  });

  it('hybrid policy raises early on correct answer', () => {
    const decision = getAdaptiveDecision({
      config: { ...baseConfig, adaptivePolicy: 'hybrid_guardrails' },
      currentTargetDifficulty: 'Easy',
      latestIsCorrect: true,
      resultsWithCurrent: [mkResult(true)],
    });
    expect(decision.nextDifficulty).toBe('Medium');
    expect(decision.changed).toBe(true);
  });

  it('selects nearest available difficulty when exact target missing', () => {
    const questions: Question[] = [
      {
        id: 'q1',
        text: 'Q1',
        options: ['a', 'b', 'c', 'd'],
        correctAnswerIndex: 0,
        explanation: 'x',
        animationDescription: 'x',
        difficulty: 'Easy',
      },
      {
        id: 'q2',
        text: 'Q2',
        options: ['a', 'b', 'c', 'd'],
        correctAnswerIndex: 0,
        explanation: 'x',
        animationDescription: 'x',
        difficulty: 'Hard',
      },
    ];
    const next = selectNextQuestionIndex({
      questions,
      usedIndexes: new Set<number>(),
      targetDifficulty: 'Medium',
    });
    expect(next).toBe(0);
  });
});
