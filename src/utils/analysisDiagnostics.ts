import { FLORIDA_STANDARDS } from '../constants';
import type { AnalysisAttemptRow, DiagnosticConfidenceLabel, Difficulty, Question, QuestionDiagnostic, QuizResult, Standard } from '../types';
import { parseStandardCodeMeta } from './parseStandardCode';

const LOW_TIME_SECONDS = 8;
const HIGH_TIME_SECONDS = 55;

const toDifficulty = (value: Difficulty | undefined): Difficulty =>
  value === 'Easy' || value === 'Medium' || value === 'Hard' ? value : 'Medium';

const toSourceType = (value: string | undefined): 'bank' | 'rewrite' | 'novel' | 'unknown' => {
  if (value === 'bank' || value === 'rewrite' || value === 'novel') return value;
  return 'unknown';
};

const cleanList = (items: string[] | undefined): string[] =>
  (items || []).map((item) => item.trim()).filter(Boolean);

const containsAny = (text: string, terms: string[]): boolean => {
  const lowered = text.toLowerCase();
  return terms.some((term) => lowered.includes(term));
};

const confidenceLabel = (score: number): DiagnosticConfidenceLabel => {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
};

export const buildAnalysisAttemptRows = (args: {
  standardCode: string;
  questions: Question[];
  results: QuizResult[];
}): AnalysisAttemptRow[] => {
  const strandMeta = parseStandardCodeMeta(args.standardCode);
  return args.results.map((result, idx) => {
    const questionByIndex = args.questions[result.questionIndex];
    const questionById =
      result.questionId != null
        ? args.questions.find((q) => q?.id === result.questionId)
        : undefined;
    const question = questionByIndex ?? questionById ?? args.questions[idx];
    const selectedOptionText =
      typeof result.selectedOptionIndex === 'number' && question?.options
        ? question.options[result.selectedOptionIndex] ?? 'Unknown Option'
        : 'Unknown Option';
    const correctOptionText =
      typeof question?.correctAnswerIndex === 'number' && question?.options
        ? question.options[question.correctAnswerIndex] ?? 'Unknown Option'
        : 'Unknown Option';
    return {
      attemptOrder: idx + 1,
      questionIndex: result.questionIndex,
      questionId: result.questionId || question?.id || `q-${idx + 1}`,
      standardCode: args.standardCode,
      strandCode: strandMeta.strandCode,
      selectedOptionIndex:
        typeof result.selectedOptionIndex === 'number' ? result.selectedOptionIndex : null,
      selectedOptionText,
      correctOptionText,
      isCorrect: Boolean(result.isCorrect),
      timeTakenSec: Number(result.timeTaken || 0),
      // Prefer the question's own difficulty when available (source-of-truth for what was shown).
      difficultyPresented: toDifficulty(question?.difficulty || result.difficulty),
      adaptiveDecisionReason: result.adaptiveDecisionReason || 'none',
      sourceType: toSourceType(result.sourceType || question?.sourceType),
      generatedByAi:
        typeof result.generatedByAi === 'boolean'
          ? result.generatedByAi
          : typeof question?.generatedByAi === 'boolean'
            ? question.generatedByAi
            : true,
      misconceptionSignal:
        result.feedbackUsed?.misconceptionSignal || question?.feedbackGuidance?.misconceptionSignal || '',
      strategyTip: result.feedbackUsed?.strategyTip || question?.feedbackGuidance?.strategyTip || '',
      tieredNextStep: result.feedbackUsed?.tieredNextStep || question?.feedbackGuidance?.tieredNextStep || '',
    };
  });
};

const strandFallbackMisconceptions = (standardCode: string, grade: string): string[] => {
  const parsed = parseStandardCodeMeta(standardCode);
  if (!parsed.strandCode) return [];
  return FLORIDA_STANDARDS
    .filter((item) => String(item.grade) === String(grade))
    .filter((item) => parseStandardCodeMeta(item.code).strandCode === parsed.strandCode)
    .flatMap((item) => item.misconceptions || [])
    .map((item) => item.trim())
    .filter(Boolean);
};

export const buildQuestionDiagnostics = (args: {
  standard: Standard;
  attemptRows: AnalysisAttemptRow[];
}): QuestionDiagnostic[] => {
  const standardMisconceptions = cleanList(args.standard.misconceptions);
  const strandMisconceptions = strandFallbackMisconceptions(args.standard.code, String(args.standard.grade));
  const tieredHints = cleanList(args.standard.tieredInstruction);
  const clarifications = cleanList(args.standard.clarifications);

  return args.attemptRows.map((row) => {
    if (row.isCorrect) {
      return {
        attemptOrder: row.attemptOrder,
        questionIndex: row.questionIndex,
        questionId: row.questionId,
        errorType: 'low_evidence',
        misconception: 'No error: student answered correctly.',
        misconceptionCandidates: [],
        evidenceSource: 'inferred',
        confidenceScore: 90,
        confidenceLabel: 'high',
        notes: 'Correct response; use this question as evidence of current understanding.',
      };
    }

    const evidenceTexts = [row.selectedOptionText, row.correctOptionText, row.misconceptionSignal].join(' ').toLowerCase();
    let errorType: QuestionDiagnostic['errorType'] = 'conceptual';
    if (containsAny(evidenceTexts, ['calculate', 'multiply', 'add', 'subtract', 'divide', 'decimal'])) {
      errorType = 'computational';
    } else if (containsAny(evidenceTexts, ['step', 'equation', 'solve', 'procedure', 'algorithm'])) {
      errorType = 'procedural';
    } else if (containsAny(evidenceTexts, ['graph', 'table', 'diagram', 'visual', 'model'])) {
      errorType = 'representation';
    } else if (containsAny(evidenceTexts, ['word', 'vocabulary', 'language', 'interpret'])) {
      errorType = 'language';
    }

    if (row.timeTakenSec < LOW_TIME_SECONDS && !row.misconceptionSignal) {
      errorType = 'low_evidence';
    }

    const misconceptionCandidates = [
      row.misconceptionSignal,
      ...standardMisconceptions,
      ...strandMisconceptions,
      ...tieredHints,
      ...clarifications,
    ].filter(Boolean);

    const misconception = misconceptionCandidates[0] || 'Likely misunderstanding requires more evidence.';
    const fromStandard = standardMisconceptions.includes(misconception) || row.misconceptionSignal.length > 0;
    const fromStrand = !fromStandard && strandMisconceptions.includes(misconception);
    const evidenceSource: QuestionDiagnostic['evidenceSource'] = fromStandard
      ? 'standard'
      : fromStrand
        ? 'strand'
        : misconceptionCandidates.length > 0
          ? 'adjacent_grade'
          : 'inferred';

    let score = 55;
    if (row.misconceptionSignal) score += 20;
    if (fromStandard) score += 15;
    if (row.timeTakenSec > HIGH_TIME_SECONDS) score += 5;
    if (errorType === 'low_evidence') score -= 20;
    score = Math.max(25, Math.min(95, score));

    return {
      attemptOrder: row.attemptOrder,
      questionIndex: row.questionIndex,
      questionId: row.questionId,
      errorType,
      misconception,
      misconceptionCandidates: misconceptionCandidates.slice(0, 3),
      evidenceSource,
      confidenceScore: score,
      confidenceLabel: confidenceLabel(score),
      notes:
        errorType === 'low_evidence'
          ? 'Response pattern suggests guessing or insufficient signal. Add targeted follow-up questions.'
          : `Mapped from ${evidenceSource} evidence with deterministic classification.`,
    };
  });
};

export const buildRoleAwareActions = (diagnostics: QuestionDiagnostic[]) => {
  const misses = diagnostics.filter((item) => !item.misconception.startsWith('No error'));
  const top = misses.slice(0, 3);
  const studentActions = top.map(
    (item, idx) =>
      `${idx + 1}. Review ${item.errorType} skill: ${item.misconception}.`
  );
  const teacherActions = top.map(
    (item, idx) =>
      `${idx + 1}. Reteach ${item.errorType} with evidence from Q${item.attemptOrder} (${item.confidenceLabel} confidence).`
  );
  const lowReliabilityCount = diagnostics.filter((item) => item.confidenceLabel === 'low').length;
  const reliabilityFlags =
    lowReliabilityCount > 0
      ? [`${lowReliabilityCount} response(s) have low-confidence diagnosis; collect more evidence.`]
      : [];
  return { studentActions, teacherActions, reliabilityFlags };
};

