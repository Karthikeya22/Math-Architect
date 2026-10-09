import type { Difficulty, Question, QuizConfig, QuizResult } from '../types';

const difficultyScale: Array<Exclude<Difficulty, 'Mixed'>> = ['Easy', 'Medium', 'Hard'];

const clampDifficultyIndex = (index: number) => Math.max(0, Math.min(index, difficultyScale.length - 1));

const toDifficulty = (value: Difficulty | undefined): Exclude<Difficulty, 'Mixed'> => {
  if (value === 'Easy' || value === 'Medium' || value === 'Hard') return value;
  return 'Medium';
};

const shiftDifficulty = (
  current: Exclude<Difficulty, 'Mixed'>,
  delta: number
): Exclude<Difficulty, 'Mixed'> => {
  const nextIndex = clampDifficultyIndex(difficultyScale.indexOf(current) + delta);
  return difficultyScale[nextIndex];
};

export type AdaptiveDecision = {
  nextDifficulty: Exclude<Difficulty, 'Mixed'>;
  reason: string;
  changed: boolean;
};

const decideStaircase = (
  current: Exclude<Difficulty, 'Mixed'>,
  isCorrect: boolean
): AdaptiveDecision => {
  const nextDifficulty = shiftDifficulty(current, isCorrect ? 1 : -1);
  return {
    nextDifficulty,
    reason: isCorrect ? 'staircase_correct_raise' : 'staircase_incorrect_lower',
    changed: nextDifficulty !== current,
  };
};

const decideMasteryBlocks = (
  current: Exclude<Difficulty, 'Mixed'>,
  resultsWithCurrent: QuizResult[]
): AdaptiveDecision => {
  const recent = resultsWithCurrent.slice(-2);
  const streakCorrect = recent.length === 2 && recent.every((item) => item.isCorrect);
  const streakWrong = recent.length === 2 && recent.every((item) => !item.isCorrect);
  if (streakCorrect) {
    const nextDifficulty = shiftDifficulty(current, 1);
    return {
      nextDifficulty,
      reason: 'mastery_two_correct_raise',
      changed: nextDifficulty !== current,
    };
  }
  if (streakWrong) {
    const nextDifficulty = shiftDifficulty(current, -1);
    return {
      nextDifficulty,
      reason: 'mastery_two_wrong_lower',
      changed: nextDifficulty !== current,
    };
  }
  return {
    nextDifficulty: current,
    reason: 'mastery_hold',
    changed: false,
  };
};

const decideHybrid = (
  current: Exclude<Difficulty, 'Mixed'>,
  isCorrect: boolean,
  resultsWithCurrent: QuizResult[]
): AdaptiveDecision => {
  const totalAnswered = resultsWithCurrent.length;
  const recentWrong = resultsWithCurrent.slice(-2).every((item) => !item.isCorrect);

  if (isCorrect) {
    const raiseBy = totalAnswered <= 3 ? 1 : 0;
    const nextDifficulty = shiftDifficulty(current, raiseBy);
    return {
      nextDifficulty,
      reason: raiseBy ? 'hybrid_early_correct_raise' : 'hybrid_late_hold',
      changed: nextDifficulty !== current,
    };
  }

  if (recentWrong) {
    const nextDifficulty = shiftDifficulty(current, -1);
    return {
      nextDifficulty,
      reason: 'hybrid_repeated_miss_lower',
      changed: nextDifficulty !== current,
    };
  }

  return {
    nextDifficulty: current,
    reason: 'hybrid_single_miss_hold',
    changed: false,
  };
};

export const getAdaptiveDecision = (args: {
  config: QuizConfig;
  currentTargetDifficulty: Difficulty;
  latestIsCorrect: boolean;
  resultsWithCurrent: QuizResult[];
}): AdaptiveDecision => {
  const policy = args.config.adaptivePolicy ?? 'hybrid_guardrails';
  const current = toDifficulty(args.currentTargetDifficulty);
  if (policy === 'staircase_1up1down') return decideStaircase(current, args.latestIsCorrect);
  if (policy === 'mastery_blocks') return decideMasteryBlocks(current, args.resultsWithCurrent);
  return decideHybrid(current, args.latestIsCorrect, args.resultsWithCurrent);
};

export const selectNextQuestionIndex = (args: {
  questions: Question[];
  usedIndexes: Set<number>;
  targetDifficulty: Difficulty;
}): number | null => {
  const target = toDifficulty(args.targetDifficulty);
  const candidates = args.questions
    .map((question, idx) => ({ question, idx }))
    .filter(({ idx }) => !args.usedIndexes.has(idx));
  if (candidates.length === 0) return null;

  const exact = candidates.find(({ question }) => question.difficulty === target);
  if (exact) return exact.idx;

  const targetIndex = difficultyScale.indexOf(target);
  candidates.sort((a, b) => {
    const aIdx = difficultyScale.indexOf(toDifficulty(a.question.difficulty));
    const bIdx = difficultyScale.indexOf(toDifficulty(b.question.difficulty));
    return Math.abs(aIdx - targetIndex) - Math.abs(bIdx - targetIndex);
  });
  return candidates[0]?.idx ?? null;
};
