import { describe, expect, it } from 'vitest';
import type { Question, QuizResult, Standard } from '../types';
import { buildAnalysisAttemptRows, buildQuestionDiagnostics } from './analysisDiagnostics';

const standard: Standard = {
  code: 'MA.8.AR.1.1',
  grade: 'Grade 8',
  description: 'Solve linear equations.',
  misconceptions: ['Students often combine unlike terms.'],
  tieredInstruction: ['Use inverse operations one step at a time.'],
  clarifications: ['Keep both sides balanced.'],
};

const questions: Question[] = [
  {
    id: 'q-1',
    text: 'Solve 2x + 4 = 10',
    options: ['x=2', 'x=3', 'x=4', 'x=5'],
    correctAnswerIndex: 1,
    explanation: 'Subtract 4 then divide by 2.',
    animationDescription: 'Balance scale',
    difficulty: 'Medium',
    feedbackGuidance: { misconceptionSignal: 'Combines unlike terms.' },
  },
  {
    id: 'q-2',
    text: 'Solve x/3 = 6',
    options: ['x=2', 'x=9', 'x=18', 'x=3'],
    correctAnswerIndex: 2,
    explanation: 'Multiply both sides by 3.',
    animationDescription: 'Inverse operation',
    difficulty: 'Hard',
  },
];

const results: QuizResult[] = [
  {
    questionIndex: 1,
    selectedOptionIndex: 1,
    isCorrect: false,
    timeTaken: 12,
    difficulty: 'Hard',
    questionId: 'q-2',
    adaptiveDecisionReason: 'hybrid_repeated_miss_lower',
  },
  {
    questionIndex: 0,
    selectedOptionIndex: 1,
    isCorrect: true,
    timeTaken: 9,
    difficulty: 'Medium',
    questionId: 'q-1',
  },
];

describe('analysisDiagnostics', () => {
  it('builds attempt rows in actual attempt order using questionIndex mapping', () => {
    const rows = buildAnalysisAttemptRows({
      standardCode: standard.code,
      questions,
      results,
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].questionId).toBe('q-2');
    expect(rows[0].attemptOrder).toBe(1);
    expect(rows[0].selectedOptionText).toBe('x=9');
    expect(rows[0].correctOptionText).toBe('x=18');
  });

  it('classifies incorrect response and assigns misconception evidence', () => {
    const rows = buildAnalysisAttemptRows({
      standardCode: standard.code,
      questions,
      results,
    });
    const diagnostics = buildQuestionDiagnostics({
      standard,
      attemptRows: rows,
    });
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics[0].misconception.length).toBeGreaterThan(0);
    expect(diagnostics[0].confidenceScore).toBeGreaterThan(0);
    expect(['standard', 'strand', 'adjacent_grade', 'inferred']).toContain(diagnostics[0].evidenceSource);
  });
});

