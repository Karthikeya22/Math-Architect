import type { VisualSpec } from "../../types.ts";
import { getPreferredVisualTypes } from "../../utils/standardVisualPreferences.ts";
import { normalizeVisualSpec, normalizeVisualTypeToken } from "../../utils/visualSpec.ts";
import { countDisplayStyle } from "../../utils/reconcileVisualFromStem.ts";
import { NAMED_MODELS } from "../visualSpecAnswerAlignment.ts";
import type { GenerateFn, QuestionFigureInput } from "./types.ts";

/**
 * Turn a finished question into an exact figure spec with one small model call.
 * The quiz model can only send a figure type, so before this the spec was guessed
 * from stem keywords and missed every new phrasing. Each type gets its own tiny
 * schema (one big optional schema degraded the quiz model, 2026-10-22).
 * Returns null whenever it is unsure; callers then fall back to the old path.
 */

const NUM = { type: "NUMBER" };
const INT = { type: "INTEGER" };
const STR = { type: "STRING" };
const list = (items: object) => ({ type: "ARRAY", items });

type Family = { fields: Record<string, object>; notes: string };

const FAMILIES: Record<string, Family> = {
  bar_chart: {
    fields: { title: STR, categories: list(STR), values: list(NUM), xLabel: STR, yLabel: STR, tickStep: NUM },
    notes: "categories and values: one bar (or row of pictures / tally marks) per item the question lists, same order and length. tickStep: the scale the question states (counts by 2s -> 2), else 0.",
  },
  table: {
    fields: { title: STR, columns: list(STR), rows: list(list(STR)) },
    notes: "columns: header row. rows: one row per item the question lists, each as long as columns.",
  },
  line_plot: {
    fields: { title: STR, min: NUM, max: NUM, tickStep: NUM, values: list(NUM), xLabel: STR },
    notes: "values: one entry per data point (a value with 3 dots appears 3 times). min/max: the axis range the question gives.",
  },
  area_model: {
    fields: { gridRows: INT, gridCols: INT, highlightRows: INT, highlightCols: INT },
    notes: "gridRows x gridCols: the equal rows and columns. highlightRows / highlightCols: how many rows / columns the question says are shaded or marked. For a product a/b x c/d: gridRows=b, highlightRows=a, gridCols=d, highlightCols=c.",
  },
  fraction_bar: {
    fields: { totalParts: INT, shadedParts: INT },
    notes: "One whole split into totalParts equal parts with shadedParts shaded, exactly as the question states.",
  },
  fraction_circle: {
    fields: { totalParts: INT, shadedParts: INT },
    notes: "One circle split into totalParts equal parts with shadedParts shaded, exactly as the question states.",
  },
  number_line: {
    fields: { min: NUM, max: NUM, tickStep: NUM, values: list(NUM) },
    notes: "min/max/tickStep: the line the question describes. values: only points the question itself places; never the answer it asks for.",
  },
};

/** Stem phrases that name a figure the families above can draw (checked before the quiz model's guess). */
const STEM_TYPES: Array<[RegExp, string[]]> = [
  // "product of 3/4 and 2/5" / "3/4 x 2/5": one strip can only show one factor.
  // Also "a 3/4 yard by 2/5 yard bed ... area?" (keyword in any order, two fractions).
  [/^(?=[\s\S]*\b(?:product|multiply|multiplied|area)\b)(?=(?:[\s\S]*?\d+\s*\/\s*\d+){2})|\d+\s*\/\s*\d+\s*(?:×|x|\*|times)\s*\d+\s*\/\s*\d+/, ["area_model"]],
  [/\bbar (?:graph|chart)\b|\bhistogram\b|\btally\b|\bpicture graph\b|\bpictograph\b|\beach (?:picture|symbol|icon)\b/, ["bar_chart"]],
  [/\b(?:line|dot) plot\b/, ["line_plot"]],
  [/\btable\b/, ["table"]],
  ...NAMED_MODELS.map(([, re, types]) => [re, types] as [RegExp, string[]]),
];

const chooseType = (input: QuestionFigureInput): string | null => {
  const allowed = getPreferredVisualTypes(input.standardCode);
  const usable = (type: string | undefined): type is string =>
    !!type && type in FAMILIES && (!allowed.length || allowed.includes(type as never));
  const stem = input.text.toLowerCase();
  const named = STEM_TYPES.filter(([re]) => re.test(stem)).flatMap(([, types]) => types);
  // A stem that names a figure decides; only if it names none do we trust the quiz model's guess.
  if (named.length) return named.find(usable) ?? null;
  const sent = normalizeVisualTypeToken(input.visualSpec?.visualType);
  return usable(sent) ? sent : null;
};

const buildPrompt = (input: QuestionFigureInput, type: string): string =>
  [
    `Describe the ${type.replace(/_/g, " ")} for this ${input.grade} math question as data.`,
    `Question: ${input.text}`,
    "Rules:",
    "- Use only numbers and names stated in the question. Never compute or add the answer.",
    `- ${FAMILIES[type].notes}`,
    `- fits: false if a ${type.replace(/_/g, " ")} cannot show what the question describes; do not approximate.`,
    "- Labels and title: short, from the question's own words (the title only if the question names one, e.g. \"titled Favorite Fruits\"); empty string if none.",
  ].join("\n");

export const extractFigureSpec = async (
  input: QuestionFigureInput,
  generate: GenerateFn,
  env: NodeJS.ProcessEnv = process.env,
): Promise<VisualSpec | null> => {
  if (String(env.FIGURE_SPEC_EXTRACT ?? "true").trim().toLowerCase() === "false") return null;
  const type = chooseType(input);
  if (!type) return null;
  const fields = FAMILIES[type].fields;
  try {
    const response = await generate({
      task: "figure_brief",
      contents: buildPrompt(input, type),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: { fits: { type: "BOOLEAN" }, ...fields },
          required: ["fits", ...Object.keys(fields)],
        },
      },
      metadata: { standardCode: input.standardCode, grade: input.grade, disableFallback: true, purpose: "figure_spec" },
    });
    const raw = response.text ? JSON.parse(response.text) : null;
    if (!raw || raw.fits !== true) return null;
    const { fits: _fits, ...spec } = raw;
    const style = type === "bar_chart" ? countDisplayStyle(input.text) : null;
    return normalizeVisualSpec({ visualType: type, ...spec, ...style });
  } catch {
    return null;
  }
};
