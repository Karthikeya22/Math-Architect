type Schema = Record<string, any>;
type AiTask = "quiz" | "analysis" | "slides" | "image";
type AiProvider = "gemini" | "openai" | "auto";

type GeneratePayload = {
  task: AiTask;
  provider?: AiProvider;
  model?: string;
  contents: any;
  config?: any;
  metadata?: Record<string, any>;
};

const Type = {
  OBJECT: "OBJECT",
  STRING: "STRING",
  ARRAY: "ARRAY",
  INTEGER: "INTEGER",
} as const;

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    text: { type: Type.STRING },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Must contain exactly 4 options",
    },
    correctAnswerIndex: { type: Type.INTEGER, description: "0-3" },
    explanation: { type: Type.STRING },
    animationDescription: { type: Type.STRING },
    visualIntent: {
      type: Type.STRING,
      description:
        "Required when imagePrompt exists. State what learner should inspect in the image.",
    },
    imagePrompt: { type: Type.STRING, description: "Prompt for image generation." },
    difficulty: {
      type: Type.STRING,
      enum: ["Easy", "Medium", "Hard"],
      description: "The difficulty level of this specific question",
    },
  },
  required: [
    "id",
    "text",
    "options",
    "correctAnswerIndex",
    "explanation",
    "animationDescription",
    "difficulty",
  ],
};

const generateContentViaServer = async (payload: GeneratePayload) => {
  const res = await fetch("/api/genai/generate-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to call AI service.";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // Keep generic error message.
    }
    throw new Error(message);
  }

  return res.json();
};

export const generateQuiz = async (standard: any, config: any): Promise<any> => {
  const countToGenerate = config.questionCount;

  const prompt = `
    You are an expert K-12 Mathematics Standards curriculum designer.

    TARGET AUDIENCE: ${standard.grade} Student
    SUBJECT: Mathematics

    Create ${countToGenerate} multiple-choice question(s) for:
    Topic/Standard: ${standard.code}
    Description: ${standard.description}
    Additional Context: ${standard.clarifications?.join(" ") || ""}

    **CONFIGURATION:**
    - Difficulty: ${config.difficulty}
    - Count: ${countToGenerate}

    **CRITICAL CONSISTENCY RULES:**
    1. Option coherence: correct answer must be in options.
    2. Distractors should be plausible student mistakes.
    3. Grade-level safety and curriculum alignment are mandatory.

    **VISUAL RULES:**
    Visuals are optional. Add imagePrompt only if the visual is required to solve the question.
    If imagePrompt is included, you MUST include visualIntent explaining what exactly the student should observe.
    The imagePrompt must mention concrete entities from that question (numbers, objects, shapes, or units).
    Avoid generic scenes.

    Return JSON matching schema exactly.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      standardCode: { type: Type.STRING },
      questions: { type: Type.ARRAY, items: questionSchema },
    },
    required: ["standardCode", "questions"],
  };

  const response = await generateContentViaServer({
    task: "quiz",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
    metadata: {
      standardCode: standard.code,
      grade: standard.grade,
    },
  });

  if (!response.text) throw new Error("No response from AI");
  const parsed = JSON.parse(response.text);

  if (parsed.questions && parsed.questions.length > 0) {
    for (const question of parsed.questions) {
      if (!question.imagePrompt) continue;
      try {
        const imgResponse = await generateContentViaServer({
          task: "image",
          contents: { parts: [{ text: question.imagePrompt }] },
          config: { imageConfig: { aspectRatio: "16:9" } },
          metadata: { standardCode: standard.code },
        });

        const parts = imgResponse?.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            question.generatedImageBase64 = `data:${part.inlineData.mimeType || "image/jpeg"};base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (error) {
        console.error("Failed to generate image for prompt:", question.imagePrompt, error);
      }
    }
  }

  return {
    standardCode: parsed.standardCode,
    questions: parsed.questions,
    config,
  };
};

export const analyzeGaps = async (standard: any, questions: any[], results: any[]): Promise<any> => {
  const detailedAnalysis = questions
    .map((q: any, i: number) => {
      const r = results[i];
      return `Q${i + 1} [${q.difficulty}]: ${q.text}\n(Selected: ${q.options[r.selectedOptionIndex]}, Correct: ${r.isCorrect})`;
    })
    .join("\n");

  const prompt = `
    Analyze student performance for Florida Standard ${standard.code}.
    Grade Level: ${standard.grade}

    PERFORMANCE DATA:
    ${detailedAnalysis}

    Return JSON with:
    - identified gaps,
    - sub-skills,
    - confidence score,
    - summary.
  `;

  const gapSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      gapType: { type: Type.STRING, enum: ["Conceptual", "Procedural", "Computational", "Unknown"] },
      description: { type: Type.STRING },
      relatedQuestions: { type: Type.ARRAY, items: { type: Type.INTEGER } },
      misconception: { type: Type.STRING },
    },
    required: ["gapType", "description", "relatedQuestions"],
  };

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      standardCode: { type: Type.STRING },
      identifiedGaps: { type: Type.ARRAY, items: gapSchema },
      subSkills: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            correctCount: { type: Type.INTEGER },
            totalCount: { type: Type.INTEGER },
          },
        },
      },
      confidenceScore: { type: Type.INTEGER },
      summary: { type: Type.STRING },
    },
    required: ["standardCode", "identifiedGaps", "subSkills", "confidenceScore", "summary"],
  };

  const response = await generateContentViaServer({
    task: "analysis",
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema },
    metadata: {
      standardCode: standard.code,
      grade: standard.grade,
    },
  });

  if (!response.text) throw new Error("No response from AI");
  return JSON.parse(response.text);
};

export const generateRemedialSlides = async (standard: any, analysis: any): Promise<any> => {
  const prompt = `
    Create 5 remedial slides for Standard ${standard.code} (${standard.grade} Math).

    DIAGNOSIS:
    ${analysis.identifiedGaps.map((g: any) => `- ${g.description} (${g.misconception})`).join("\n")}

    Generate scaffolded, student-friendly teaching slides.
    Visuals are optional but must align with each slide objective and vocabulary when present.
  `;

  const slideSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      slideNumber: { type: Type.INTEGER },
      title: { type: Type.STRING },
      content: { type: Type.STRING },
      visualDescription: { type: Type.STRING },
      imagePrompt: { type: Type.STRING },
      vocabulary: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["slideNumber", "title", "content", "visualDescription", "vocabulary"],
  };

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: { slides: { type: Type.ARRAY, items: slideSchema } },
  };

  const response = await generateContentViaServer({
    task: "slides",
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema },
    metadata: {
      standardCode: standard.code,
      grade: standard.grade,
    },
  });

  if (!response.text) throw new Error("No response from AI");
  const parsedSlides = JSON.parse(response.text);

  if (parsedSlides.slides && parsedSlides.slides.length > 0) {
    for (const slide of parsedSlides.slides) {
      if (!slide.imagePrompt) continue;
      try {
        const imgResponse = await generateContentViaServer({
          task: "image",
          contents: { parts: [{ text: slide.imagePrompt }] },
          config: { imageConfig: { aspectRatio: "16:9" } },
          metadata: { standardCode: standard.code },
        });
        const parts = imgResponse?.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            slide.generatedImageBase64 = `data:${part.inlineData.mimeType || "image/jpeg"};base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (error) {
        console.error("Failed to generate image for slide prompt:", slide.imagePrompt, error);
      }
    }
  }

  return parsedSlides.slides;
};
