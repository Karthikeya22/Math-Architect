import { VisualSpec } from '../types';
import { buildCompareLengthImagePrompt } from './compareLengthVisual';
import { buildExactCountImagePrompt } from './exactCountVisual';
import { buildQuestionFocusedImagePrompt } from './questionFocusedImagePrompt';
import { buildPartPartWholeImagePrompt } from './partPartWholeVisual';
import { extractOrderedShapeNamesFromText } from './reconcileVisualFromStem';

type QuestionLike = {
  text?: string;
  options?: string[];
  correctAnswerIndex?: number;
  explanation?: string;
  visualIntent?: string;
  visualSpec?: VisualSpec | null;
};

const shapeLabel = (name: string): string => name.replace(/_/g, ' ');

export const buildVisualSpecScenePrompt = (spec: VisualSpec | null | undefined): string | null => {
  if (!spec?.visualType) return null;

  switch (spec.visualType) {
    case 'geometric_shape': {
      const shapes = Array.isArray(spec.shapes) ? spec.shapes.filter(Boolean) : [];
      if (shapes.length >= 2) {
        return `Draw exactly ${shapes.length} large simple polygons side by side on a plain white background: ${shapes
          .map((shape, index) => `${index + 1}) ${shapeLabel(shape)}`)
          .join('; ')}. No text, labels, or answer hints.`;
      }
      if (spec.shapeName) {
        return `Draw one large simple ${shapeLabel(spec.shapeName)} centered on a plain white background. No text, labels, or answer hints.`;
      }
      return null;
    }
    case 'fraction_bar':
      return `Draw one horizontal fraction bar divided into ${spec.totalParts} equal segments with exactly ${spec.shadedParts} segments shaded blue and the rest light gray. Plain white background. No numbers or labels.`;
    case 'fraction_circle':
      return `Draw one circle divided into ${spec.totalParts} equal sectors with exactly ${spec.shadedParts} sectors shaded blue. Plain white background. No numbers or labels.`;
    case 'ten_frame': {
      const filled = Array.isArray(spec.values)
        ? spec.values.filter((value) => Number(value) >= 1).length
        : 0;
      const ones = Number.isFinite(spec.onesCount) ? Number(spec.onesCount) : 0;
      const tens = Number.isFinite(spec.tensCount) ? Number(spec.tensCount) : 0;
      if (tens > 1) {
        return `Draw exactly ${tens} full ten-frames side by side (each with 10 blue dots) and exactly ${ones} extra blue ones dots labeled as ones. Plain white background. No digit labels.`;
      }
      return `Draw a ten-frame with exactly ${filled} blue dots in the frame${
        ones > 0 ? ` and ${ones} extra blue dots beside it` : ''
      }. Plain white background. No numbers or labels.`;
    }
    case 'array_model': {
      const rows = Number(spec.gridRows);
      const cols = Number(spec.gridCols);
      const rowColors = (spec.rowColors || []).map(String).filter(Boolean);
      if (Number.isInteger(rows) && Number.isInteger(cols) && rows > 0 && cols > 0) {
        const colorNote =
          rowColors.length >= 2
            ? ` Use solid ${rowColors[0]} blocks in the top row and solid ${rowColors[1]} blocks in the bottom row.`
            : '';
        return `Draw a ${rows} by ${cols} grid of equal blocks on a plain white background.${colorNote} No text or labels.`;
      }
      return null;
    }
    case 'number_line':
      return `Draw a clean number line from ${spec.min} to ${spec.max} with evenly spaced tick marks. Plain white background. No answer marks unless explicitly given in the question.`;
    case 'bar_model': {
      const labels = (spec.segmentLabels || []).map(String).filter(Boolean);
      if (!labels.length) return null;
      return `Draw a tape diagram with ${labels.length} adjacent segments labeled only by relative size, not answer values. Plain white background.`;
    }
    case 'clock_face':
      return `Draw an analog clock face with the hour hand at ${spec.hour} and the minute hand at ${spec.minute} minutes. Plain white background. No digital time.`;
    case 'coordinate_plane':
      return `Draw a coordinate plane from (${spec.xMin}, ${spec.yMin}) to (${spec.xMax}, ${spec.yMax}) with grid lines and only the points described in the question. Plain white background.`;
    case 'bar_chart':
      return `Draw a simple bar chart with categories ${(spec.categories || []).join(', ')} and bar heights matching the question data. Plain white background.`;
    case 'line_plot':
      return `Draw a line plot for ${spec.xLabel || 'the data set'} using the values described in the question. Plain white background.`;
    case 'table':
      return `Draw a clean table with columns ${(spec.columns || []).join(', ')} and the row values described in the question. Plain white background.`;
    case 'area_model': {
      const rows = Number(spec.gridRows);
      const cols = Number(spec.gridCols);
      if (Number.isInteger(rows) && Number.isInteger(cols) && rows > 0 && cols > 0) {
        return `Draw a ${rows} by ${cols} area model rectangle partitioned into equal cells on a plain white background. No answer totals.`;
      }
      return null;
    }
    default:
      return null;
  }
};

const buildGeometricStemPrompt = (question: QuestionLike): string | null => {
  const shapes = extractOrderedShapeNamesFromText(
    [question.text, ...(Array.isArray(question.options) ? question.options : []), question.visualIntent]
      .filter((part) => typeof part === 'string' && part.trim())
      .join(' '),
  );
  if (shapes.length >= 2) {
    return `Draw exactly ${shapes.length} large simple polygons side by side on a plain white background: ${shapes
      .map((shape, index) => `${index + 1}) ${shapeLabel(shape)}`)
      .join('; ')}. No text, labels, or answer hints.`;
  }
  if (shapes.length === 1) {
    return `Draw one large simple ${shapeLabel(shapes[0])} centered on a plain white background. No text, labels, or answer hints.`;
  }
  return null;
};

export const buildQuestionSceneImagePrompt = (question: QuestionLike, grade: string): string => {
  const partWholePrompt = buildPartPartWholeImagePrompt(question, grade);
  if (partWholePrompt) return partWholePrompt;

  const comparePrompt = buildCompareLengthImagePrompt(question);
  if (comparePrompt) return comparePrompt;

  const exactCountPrompt = buildExactCountImagePrompt(question, grade);
  if (exactCountPrompt) return exactCountPrompt;

  const specPrompt = buildVisualSpecScenePrompt(question.visualSpec);
  if (specPrompt) return specPrompt;

  const geometricPrompt = buildGeometricStemPrompt(question);
  if (geometricPrompt) return geometricPrompt;

  return buildQuestionFocusedImagePrompt(question, grade);
};
