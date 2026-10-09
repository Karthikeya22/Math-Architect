import { VisualSpec } from '../types';
import { applyQuestionVisualReconcilers } from './reconcileVisualFromStem';
import { normalizeTenFrameCells } from './reconcileMakeTenQuestion';
import {
  isDeterministicVisualSpecType,
  normalizeVisualSpec,
  normalizeVisualTypeToken,
  renderDeterministicVisualSvg,
} from './visualSpec';

export type QuestionVisualRecord = {
  text?: string;
  options?: string[];
  correctAnswerIndex?: number;
  visualSpec?: VisualSpec | null;
  imagePrompt?: string;
  visualIntent?: string;
  visual?: string;
};

export const prepareQuestionVisualFields = (question: QuestionVisualRecord): void => {
  applyQuestionVisualReconcilers(question);

  if (!question.visualSpec || typeof question.visualSpec !== 'object') return;

  const raw = question.visualSpec as unknown as Record<string, unknown>;
  const normalizedType = normalizeVisualTypeToken(raw.visualType);
  if (normalizedType) raw.visualType = normalizedType;

  if (raw.visualType === 'ten_frame' && Array.isArray(raw.values)) {
    raw.values = normalizeTenFrameCells(raw.values);
  }

  const normalized = normalizeVisualSpec(question.visualSpec);
  if (normalized) {
    question.visualSpec = normalized;
    return;
  }

  delete question.visualSpec;
};

export const renderPreparedDeterministicVisual = (question: QuestionVisualRecord): string | null => {
  prepareQuestionVisualFields(question);
  const spec = question.visualSpec;
  if (!spec || !isDeterministicVisualSpecType(spec.visualType)) return null;
  return renderDeterministicVisualSvg(spec);
};
