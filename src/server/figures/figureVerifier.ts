import type { FigureBrief, FigureInput, FigureVerdict, GenerateFn } from "./types.ts";

export const FIGURE_VERDICT_SCHEMA = {
  type: "OBJECT",
  properties: {
    observed: { type: "STRING" },
    visibleText: { type: "ARRAY", items: { type: "STRING" } },
    matchesBrief: { type: "BOOLEAN" },
    quantitiesCorrect: { type: "BOOLEAN" },
    relationshipsCorrect: { type: "BOOLEAN" },
    labelsCorrect: { type: "BOOLEAN" },
    revealsAnswer: { type: "BOOLEAN" },
    hasExtraOrGarbledText: { type: "BOOLEAN" },
    issues: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "observed",
    "visibleText",
    "matchesBrief",
    "quantitiesCorrect",
    "relationshipsCorrect",
    "labelsCorrect",
    "revealsAnswer",
    "hasExtraOrGarbledText",
    "issues",
  ],
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

export const buildVerifierPrompt = (input: FigureInput, brief: FigureBrief): string => {
  const context =
    input.kind === "question"
      ? [
          `Question: ${clean(input.text)}`,
          Array.isArray(input.options) && Number.isInteger(input.correctAnswerIndex)
            ? `Correct answer (must NOT be readable from the figure unless the student must count it): ${clean(
                input.options[Number(input.correctAnswerIndex)],
              )}`
            : "",
        ]
      : [`Slide title: ${clean(input.title)}`, input.visualDescription ? `Intended visual: ${clean(input.visualDescription)}` : ""];

  return [
    `You are a strict reviewer of figures for ${input.grade} math ${input.kind === "slide" ? "lesson slides" : "assessment questions"}.`,
    ...context,
    "The figure was supposed to show:",
    ...brief.mustShow.map((item) => `- ${item}`),
    brief.labels.length ? `Allowed text labels: ${brief.labels.map((l) => `"${l}"`).join(", ")}` : "Allowed text: none.",
    "",
    "First describe what is actually in the image in `observed`: count every object type one by one, describe partitions and shading, and for every marked angle, label or point say exactly where it sits (which line, which side of which line, between which lines, which segment). List every piece of visible text in `visibleText`.",
    "Then judge:",
    "- matchesBrief: every required element is present and nothing unrelated dominates the picture.",
    "- quantitiesCorrect: every count, partition and measurement is exactly as required (equal parts really equal).",
    "- relationshipsCorrect: every position and geometric relationship the question or brief requires is drawn exactly (for example alternate interior angles are between the parallel lines on opposite sides of the transversal; a segment label sits on that segment). Judge from the drawing, not from the labels.",
    "- labelsCorrect: required labels are present, correctly placed and spelled.",
    input.kind === "question"
      ? "- revealsAnswer: the figure states or shows the answer outright (a written answer value, a filled-in result, a marked choice)."
      : "- revealsAnswer: always false for lesson slides.",
    "- hasExtraOrGarbledText: there is text that is not in the allowed labels, or any text is misspelled or garbled.",
    "List each concrete problem in `issues` as a short fix instruction (empty when everything is right).",
  ]
    .filter(Boolean)
    .join("\n");
};

export const verdictFromRaw = (raw: any, kind: FigureInput["kind"]): FigureVerdict => {
  const issues = (Array.isArray(raw?.issues) ? raw.issues : []).map(clean).filter(Boolean);
  const checks: Array<[boolean, string]> = [
    [raw?.matchesBrief === true, "Figure does not match the required elements."],
    [raw?.quantitiesCorrect === true, "Counts, partitions or measurements are wrong."],
    [raw?.relationshipsCorrect === true, "Positions or geometric relationships are wrong."],
    [raw?.labelsCorrect === true, "Labels are missing, misplaced or misspelled."],
    [kind === "slide" || raw?.revealsAnswer === false, "Figure reveals the answer."],
    [raw?.hasExtraOrGarbledText === false, "Figure has extra or garbled text."],
  ];
  const failed = checks.filter(([ok]) => !ok).map(([, message]) => message);
  return {
    pass: failed.length === 0,
    issues: failed.length === 0 ? [] : issues.length ? issues : failed,
    observed: clean(raw?.observed),
  };
};

export const verifyFigure = async (args: {
  input: FigureInput;
  brief: FigureBrief;
  imageBase64: string;
  mimeType: string;
  generate: GenerateFn;
}): Promise<FigureVerdict> => {
  const response = await args.generate({
    task: "vision",
    contents: {
      parts: [
        { inlineData: { mimeType: args.mimeType, data: args.imageBase64 } },
        { text: buildVerifierPrompt(args.input, args.brief) },
      ],
    },
    config: { responseMimeType: "application/json", responseSchema: FIGURE_VERDICT_SCHEMA },
    metadata: { standardCode: args.input.standardCode, disableFallback: true },
  });
  if (!response.text) throw new Error("Figure verifier returned no text.");
  return verdictFromRaw(JSON.parse(response.text), args.input.kind);
};
