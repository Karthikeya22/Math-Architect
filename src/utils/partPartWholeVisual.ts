type QuestionVisualFields = {
  text?: string;
  visualIntent?: string;
  visualSpec?: { visualType?: string } | null;
  imagePrompt?: string;
};

export type PartPartWholeEquation = {
  partA: number;
  partB: number;
  total: number;
};

export const extractPartPartWholeFromText = (text: string): PartPartWholeEquation | null => {
  const match = String(text || '').match(/\b(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)\b/);
  if (!match) return null;
  const partA = Number(match[1]);
  const partB = Number(match[2]);
  const total = Number(match[3]);
  if (![partA, partB, total].every((value) => Number.isInteger(value) && value >= 0)) return null;
  if (partA + partB !== total) return null;
  return { partA, partB, total };
};

export const buildPartPartWholeImagePrompt = (
  question: QuestionVisualFields,
  grade: string,
): string | null => {
  const equation = extractPartPartWholeFromText(String(question.text || ''));
  if (!equation) return null;
  const { partA, partB, total } = equation;
  return [
    `Create a friendly ${grade} math part-part-whole diagram on a plain white background.`,
    `Top: exactly ${total} identical green circles with simple smile faces inside a dashed oval outline (the whole).`,
    `Bottom row: exactly ${partA} blue circles, an equals sign, then exactly ${partB} red circles (the two parts).`,
    `Use exactly those colors and counts. No digit labels, no extra objects, and do not show the answer to the subtraction question.`,
    `Question: ${String(question.text || '').trim()}`,
  ].join(' ');
};

export const questionPrefersGeneratedImage = (question: QuestionVisualFields): boolean =>
  extractPartPartWholeFromText(String(question.text || '')) !== null;

export const reconcilePartPartWholeFromStem = (question: QuestionVisualFields): void => {
  const equation = extractPartPartWholeFromText(String(question.text || ''));
  if (!equation) return;
  const prompt = buildPartPartWholeImagePrompt(question, 'elementary');
  if (!prompt) return;
  question.imagePrompt = prompt;
  delete question.visualSpec;
  if (!question.visualIntent) {
    question.visualIntent = 'Use the total bar and the two parts to think about the related subtraction fact.';
  }
};
