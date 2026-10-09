import type { FigureBrief, FigureInput, GenerateFn } from "./types.ts";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export const FIGURE_BRIEF_SCHEMA = {
  type: "OBJECT",
  properties: {
    needsFigure: { type: "BOOLEAN" },
    skipReason: { type: "STRING" },
    figureType: { type: "STRING", enum: ["diagram", "illustration"] },
    subject: { type: "STRING" },
    mustShow: { type: "ARRAY", items: { type: "STRING" } },
    labels: { type: "ARRAY", items: { type: "STRING" } },
    layout: { type: "STRING" },
    mustNotShow: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["needsFigure", "skipReason", "figureType", "subject", "mustShow", "labels", "layout", "mustNotShow"],
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

const cleanList = (value: unknown, max: number): string[] =>
  (Array.isArray(value) ? value : [])
    .map(clean)
    .filter(Boolean)
    .slice(0, max);

const correctAnswerText = (input: Extract<FigureInput, { kind: "question" }>): string => {
  const index = Number(input.correctAnswerIndex);
  if (!Array.isArray(input.options) || !Number.isInteger(index)) return "";
  return clean(input.options[index]);
};

export const buildFigureBriefPrompt = (input: FigureInput): string => {
  if (input.kind === "slide") {
    return [
      `You are the illustration director for a ${input.grade} math remedial lesson slide.`,
      "Plan ONE teaching visual that a teacher can point at while explaining this slide.",
      "",
      `Slide title: ${clean(input.title)}`,
      input.keyPoints?.length ? `Slide points:\n${input.keyPoints.map((p) => `- ${clean(p)}`).join("\n")}` : "",
      input.visualDescription ? `What the visual should show: ${clean(input.visualDescription)}` : "",
      input.imagePrompt ? `Author's drawing note: ${clean(input.imagePrompt)}` : "",
      "",
      "Rules:",
      "- The math must be exactly right: equal parts must be equal, counts exact, number lines evenly spaced.",
      "- mustShow lists each concrete, drawable element with exact counts, partitions, shading and positions.",
      "- labels lists every piece of text allowed in the image, spelled exactly (short labels only, max 6). Use [] for no text.",
      "- Prefer one clear model (fraction strip, number line, array, area model, labeled diagram) over a busy scene.",
      "- mustNotShow lists distracting or wrong things to avoid (max 4).",
      "- needsFigure is true unless a visual would add nothing; then explain in skipReason.",
      "- figureType is \"diagram\" for math models and \"illustration\" for a real-world scene.",
    ]
      .filter((line) => line !== "")
      .join("\n");
  }

  const options = (input.options || [])
    .map((option, i) => `${OPTION_LETTERS[i] || i + 1}) ${clean(option)}`)
    .join("\n");
  const answer = correctAnswerText(input);

  return [
    `You are the illustration director for a ${input.grade} math assessment question.`,
    "Plan ONE figure that gives the student exactly the information the question provides, and nothing that answers it.",
    "",
    `Question: ${clean(input.text)}`,
    options ? `Answer choices:\n${options}` : "",
    answer ? `Correct answer (for your planning only): ${answer}` : "",
    input.visualIntent ? `What the student should look at: ${clean(input.visualIntent)}` : "",
    input.imagePrompt ? `Question author's drawing note (may be wrong; the question text wins): ${clean(input.imagePrompt)}` : "",
    "",
    "Rules:",
    "- mustShow lists each concrete, drawable element with exact counts, measurements, positions and colors taken from the question.",
    "- If the student must count, measure or read something from the figure, the figure must contain exactly that quantity (it is given data), drawn so it can be counted, but never write the total as a number.",
    "- labels lists every piece of text allowed in the image, spelled exactly as in the question (point names, given measurements, axis labels). Never include the answer. Use [] for no text.",
    "- mustNotShow always includes the correct answer value, option letters, the question sentence, and any equation with its result.",
    "- needsFigure is false when the question is pure symbolic computation or any faithful figure would give away the answer (for example a place-value chart already filled with the answer digits). Explain in skipReason.",
    "- figureType is \"diagram\" for geometry, graphs, number lines and math models; \"illustration\" for real-world objects and scenes.",
    "- layout is one sentence on composition for a wide landscape image.",
  ]
    .filter((line) => line !== "")
    .join("\n");
};

export const normalizeFigureBrief = (raw: any): FigureBrief => ({
  needsFigure: raw?.needsFigure !== false,
  skipReason: clean(raw?.skipReason),
  figureType: raw?.figureType === "illustration" ? "illustration" : "diagram",
  subject: clean(raw?.subject),
  mustShow: cleanList(raw?.mustShow, 10),
  labels: cleanList(raw?.labels, 8),
  layout: clean(raw?.layout),
  mustNotShow: cleanList(raw?.mustNotShow, 6),
});

export const requestFigureBrief = async (input: FigureInput, generate: GenerateFn): Promise<FigureBrief> => {
  const response = await generate({
    task: "figure_brief",
    contents: buildFigureBriefPrompt(input),
    config: { responseMimeType: "application/json", responseSchema: FIGURE_BRIEF_SCHEMA },
    metadata: { standardCode: input.standardCode, grade: input.grade, disableFallback: true },
  });
  if (!response.text) throw new Error("Figure brief returned no text.");
  const brief = normalizeFigureBrief(JSON.parse(response.text));
  if (brief.needsFigure && brief.mustShow.length === 0) {
    throw new Error("Figure brief has no drawable elements.");
  }
  return brief;
};

const STYLE_BY_TYPE: Record<FigureBrief["figureType"], string> = {
  diagram:
    "Clean, precise flat math diagram: crisp dark outlines, flat fills, accurate geometry and equal spacing, like a well-made textbook figure.",
  illustration:
    "Clear, friendly flat-vector illustration with simple shapes and solid colors, like a well-made textbook figure.",
};

export const composeFigureImagePrompt = (
  brief: FigureBrief,
  input: FigureInput,
  feedback: string[] = [],
): string => {
  const audience = input.kind === "slide" ? "lesson slide" : "assessment question";
  const textRule = brief.labels.length
    ? `Text in the image: only these labels, spelled exactly, in a clear sans-serif font: ${brief.labels
        .map((label) => `"${label}"`)
        .join(", ")}. No other words, numbers or letters.`
    : "Text in the image: none. No words, numbers or letters anywhere.";

  return [
    `Create one ${brief.figureType === "diagram" ? "math diagram" : "illustration"} for a ${input.grade} math ${audience}.`,
    brief.subject ? `Subject: ${brief.subject}` : "",
    `It must show:\n${brief.mustShow.map((item) => `- ${item}`).join("\n")}`,
    brief.layout ? `Layout: ${brief.layout}` : "",
    textRule,
    `Style: ${STYLE_BY_TYPE[brief.figureType]} Plain white background, high contrast, everything large enough to read from the back of a classroom, generous margins, nothing cropped.`,
    brief.mustNotShow.length ? `Leave out: ${brief.mustNotShow.join("; ")}.` : "",
    feedback.length
      ? `A reviewer rejected the previous version for these reasons. Fix every one:\n${feedback
          .map((issue) => `- ${issue}`)
          .join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
};
