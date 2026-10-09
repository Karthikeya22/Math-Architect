/**
 * Per-question visual sanitization for quiz payloads. Strips bad
 * `visualSpec` and bad `imagePrompt` fields in place, never throws,
 * returns the per-question warnings so callers can surface them in
 * telemetry. Soft-fail by design: a wrong picture should not invalidate
 * an otherwise correct question (and trigger the 30-50s retry chain in
 * generateWithGuards). Used by server.ts inside attemptOnce.
 */
import { validateQuestionVisualSpec } from './visualSpecValidation';
import { validateVisualSpecAgainstQuestion } from './visualSpecAnswerAlignment';
import { normalizeVisualTypeToken } from '../utils/visualSpec';
import { applyQuestionVisualReconcilers } from '../utils/reconcileVisualFromStem';
import { normalizeTenFrameCells } from '../utils/reconcileMakeTenQuestion';
import type { SolutionStep, VisualSpec } from '../types';
import { buildFigureHints, normalizeFigureHints, sanitizeFigureHints } from '../utils/buildFigureHints';
import { parseStandardCodeMeta } from '../utils/parseStandardCode';
import { getPreferredVisualPolicy } from '../utils/standardVisualPreferences';

const GENERIC_VISUAL_PHRASES = [
  'classroom',
  'students working',
  'school setting',
  'teacher explaining',
  'children playing',
  'desk with books',
];

export interface SanitizationResult {
  /** Tagged warnings of the form "Q1: <message>". */
  warnings: string[];
}

export const sanitizeQuizPayloadVisuals = (payload: unknown): SanitizationResult => {
  const warnings: string[] = [];
  if (!payload || typeof payload !== 'object') return { warnings };
  const p = payload as { standardCode?: string; questions?: unknown };
  if (!Array.isArray(p.questions)) return { warnings };

  const standardPolicy = getPreferredVisualPolicy(p.standardCode);
  const gradeToken = parseStandardCodeMeta(String(p.standardCode || '')).gradeToken;

  for (let index = 0; index < p.questions.length; index++) {
    const question = p.questions[index] as Record<string, unknown> | null;
    if (!question || typeof question !== 'object') continue;
    const perQ: string[] = [];

    applyQuestionVisualReconcilers(question);

    const hintVisualSpec =
      question.visualSpec && typeof question.visualSpec === 'object'
        ? ({ ...(question.visualSpec as VisualSpec) } as VisualSpec)
        : undefined;

    if (question.visualSpec && typeof question.visualSpec === 'object') {
      const vs = question.visualSpec as { visualType?: string; values?: unknown[] };
      const normalizedType = normalizeVisualTypeToken(vs.visualType);
      if (normalizedType) vs.visualType = normalizedType;
      if (vs.visualType === 'ten_frame' && Array.isArray(vs.values) && vs.values.length !== 10) {
        vs.values = normalizeTenFrameCells(vs.values);
      }
    }

    const schemaError = validateQuestionVisualSpec(question.visualSpec);
    if (schemaError) {
      perQ.push(`Schema: ${schemaError}`);
      delete question.visualSpec;
    } else {
      const semanticError = validateVisualSpecAgainstQuestion({
        text: String(question.text || ''),
        options: Array.isArray(question.options) ? question.options.map(String) : [],
        correctAnswerIndex: Number(question.correctAnswerIndex),
        visualSpec: question.visualSpec,
      });
      if (semanticError) {
        perQ.push(`Semantic: ${semanticError}`);
        delete question.visualSpec;
      }
    }

    if (standardPolicy.preferredTypes.length > 0) {
      if (standardPolicy.forbidGeminiFallback && question.imagePrompt) {
        perQ.push(`Policy: imagePrompt forbidden for standard ${p.standardCode}.`);
        question.imagePrompt = '';
      }
      const vs = question.visualSpec as { visualType?: string } | undefined;
      const visualType = vs && typeof vs === 'object' ? String(vs.visualType || '').trim() : '';
      if (
        visualType &&
        !standardPolicy.preferredTypes.includes(
          visualType as (typeof standardPolicy.preferredTypes)[number],
        )
      ) {
        perQ.push(`Policy: visualType "${visualType}" not allowed for standard ${p.standardCode}.`);
        delete question.visualSpec;
      }
    }

    if (question.imagePrompt) {
      if (!question.visualIntent || typeof question.visualIntent !== 'string') {
        perQ.push('imagePrompt missing visualIntent.');
        question.imagePrompt = '';
      } else {
        const imagePromptLower = String(question.imagePrompt).toLowerCase();
        if (GENERIC_VISUAL_PHRASES.some((phrase) => imagePromptLower.includes(phrase))) {
          perQ.push('Generic/off-topic image prompt.');
          question.imagePrompt = '';
        }
      }
    }

    const hintQuestion = {
      text: String(question.text || ''),
      visualSpec: hintVisualSpec ?? (question.visualSpec as VisualSpec | undefined),
      visualIntent: typeof question.visualIntent === 'string' ? question.visualIntent : undefined,
      options: Array.isArray(question.options) ? question.options.map(String) : [],
      correctAnswerIndex: Number(question.correctAnswerIndex),
    };
    const hasFigure =
      Boolean(hintQuestion.visualSpec) ||
      Boolean(question.imagePrompt) ||
      Boolean(question.visual) ||
      Boolean(question.generatedImageBase64);
    let figureHints = sanitizeFigureHints(normalizeFigureHints(question.figureHints), hintQuestion);
    if (hasFigure && figureHints.length === 0) {
      figureHints = buildFigureHints(hintQuestion, gradeToken);
    }
    if (figureHints.length > 0) {
      question.figureHints = figureHints;
    } else {
      delete question.figureHints;
    }

    if (Array.isArray(question.solutionSteps)) {
      const sanitizedSteps: SolutionStep[] = [];
      for (const rawStep of question.solutionSteps) {
        if (!rawStep || typeof rawStep !== 'object') continue;
        const step = rawStep as Record<string, unknown>;
        const title = String(step.title || '').trim();
        const body = String(step.body || '').trim();
        if (!title || !body) continue;
        const next: SolutionStep = { title, body };
        if (step.visualSpec && typeof step.visualSpec === 'object') {
          const stepSpec = { ...(step.visualSpec as VisualSpec) };
          const stepSchemaError = validateQuestionVisualSpec(stepSpec);
          if (stepSchemaError) {
            perQ.push(`solutionSteps visualSpec: ${stepSchemaError}`);
          } else {
            const stepSemanticError = validateVisualSpecAgainstQuestion({
              text: String(question.text || ''),
              options: Array.isArray(question.options) ? question.options.map(String) : [],
              correctAnswerIndex: Number(question.correctAnswerIndex),
              visualSpec: stepSpec,
            });
            if (stepSemanticError) {
              perQ.push(`solutionSteps visualSpec: ${stepSemanticError}`);
            } else {
              next.visualSpec = stepSpec;
            }
          }
        }
        sanitizedSteps.push(next);
      }
      if (sanitizedSteps.length >= 2) {
        question.solutionSteps = sanitizedSteps;
      } else {
        delete question.solutionSteps;
      }
    }

    if (perQ.length) {
      warnings.push(...perQ.map((w) => `Q${index + 1}: ${w}`));
      const existing = Array.isArray(question._sanitizationWarnings)
        ? (question._sanitizationWarnings as string[])
        : [];
      question._sanitizationWarnings = existing.concat(perQ);
    }
  }

  return { warnings };
};
