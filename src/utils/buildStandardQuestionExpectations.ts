import type { VisualType } from '../types';
import { getPreferredVisualTypes } from './standardVisualPreferences';

const VISUAL_LABELS: Record<VisualType, string> = {
  none: 'No required figure',
  ten_frame: 'ten-frames',
  line_plot: 'line plots',
  table: 'tables',
  bar_chart: 'bar charts',
  fraction_bar: 'fraction bars',
  number_line: 'number lines',
  array_model: 'arrays',
  area_model: 'area models',
  fraction_circle: 'fraction circles',
  coordinate_plane: 'coordinate planes',
  geometric_shape: 'geometric figures',
  bar_model: 'bar models',
  clock_face: 'clock faces',
  shape_diagram: 'shape diagrams',
  scene_only: 'context scenes',
};

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const uniqueStrings = (values: string[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = normalizeText(value);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }
  return out;
};

const descriptionLead = (description?: string) => {
  const text = normalizeText(description || '');
  if (!text) return null;
  const sentence = text.split(/[.!?]/)[0]?.trim() || text;
  return sentence.length > 110 ? `${sentence.slice(0, 108)}…` : sentence;
};

const visualSummary = (standardCode: string) => {
  const labels = uniqueStrings(
    getPreferredVisualTypes(standardCode)
      .filter((type) => type !== 'none')
      .map((type) => VISUAL_LABELS[type] || type.replace(/_/g, ' ')),
  ).slice(0, 2);
  if (labels.length === 0) return null;
  return `May use ${labels.join(' or ')}`;
};

export type StandardQuestionExpectations = {
  highlights: string[];
};

export const buildStandardQuestionExpectations = (args: {
  standardCode: string;
  description?: string;
}): StandardQuestionExpectations => {
  const highlights = uniqueStrings(
    [
      descriptionLead(args.description),
      'Multiple-choice items aligned to this benchmark',
      visualSummary(args.standardCode),
    ].filter((item): item is string => Boolean(item)),
  ).slice(0, 3);

  return { highlights };
};
