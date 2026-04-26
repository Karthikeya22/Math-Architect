import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

type ProviderName = "gemini" | "openai";
type AiTask = "quiz" | "analysis" | "slides" | "image";

type GenerateRequest = {
  task: AiTask;
  model?: string;
  provider?: ProviderName | "auto";
  contents: any;
  config?: any;
  metadata?: Record<string, any>;
};

type GenerateResponse = {
  text: string | null;
  candidates: any[];
  provider: ProviderName;
  model: string;
  usage?: Record<string, any>;
};

const DEFAULT_MODELS: Record<AiTask, Record<ProviderName, string>> = {
  quiz: {
    gemini: process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview",
    openai: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
  },
  analysis: {
    gemini: process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview",
    openai: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
  },
  slides: {
    gemini: process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview",
    openai: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
  },
  image: {
    gemini: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image",
    openai: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
  },
};

const GENERIC_VISUAL_PHRASES = [
  "classroom scene",
  "math illustration",
  "educational image",
  "random",
  "generic",
  "children learning",
];

const isFallbackEnabled = () =>
  (process.env.AI_FALLBACK_ENABLED || "true").toLowerCase() === "true";

const getDefaultProviderForTask = (task: AiTask): ProviderName => {
  const byTask = {
    quiz: process.env.AI_PROVIDER_QUIZ,
    analysis: process.env.AI_PROVIDER_ANALYSIS,
    slides: process.env.AI_PROVIDER_SLIDES,
    image: process.env.AI_PROVIDER_IMAGES,
  }[task];
  if (byTask === "openai") return "openai";
  return "gemini";
};

const normalizeSchemaTypeValue = (value: any): any => {
  if (typeof value === "string") return value.toLowerCase();
  if (Array.isArray(value)) return value.map((v) => (typeof v === "string" ? v.toLowerCase() : v));
  return value;
};

const toOpenAIStrictSchema = (node: any): any => {
  if (!node || typeof node !== "object") return node;

  // Preserve primitives and recursively transform nested schemas.
  const transformed: any = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "type") {
      transformed.type = normalizeSchemaTypeValue(value);
    } else if (key === "properties" && value && typeof value === "object" && !Array.isArray(value)) {
      const properties: Record<string, any> = {};
      for (const [propKey, propSchema] of Object.entries(value as Record<string, any>)) {
        properties[propKey] = toOpenAIStrictSchema(propSchema);
      }
      transformed.properties = properties;
    } else if (key === "items" && value && typeof value === "object") {
      transformed.items = toOpenAIStrictSchema(value);
    } else if (key === "required" && Array.isArray(value)) {
      transformed.required = [...value];
    } else if (value && typeof value === "object") {
      transformed[key] = toOpenAIStrictSchema(value);
    } else {
      transformed[key] = value;
    }
  }

  // OpenAI strict mode requires object schemas to:
  // 1) include additionalProperties=false
  // 2) include required array listing every property key.
  if (transformed.type === "object") {
    const properties = transformed.properties || {};
    const propertyKeys = Object.keys(properties);
    const originallyRequired = new Set(Array.isArray(transformed.required) ? transformed.required : []);

    // For properties that were optional in source schema, make them nullable
    // so we can still include them in required for OpenAI strict validation.
    for (const key of propertyKeys) {
      if (!originallyRequired.has(key)) {
        properties[key] = {
          anyOf: [properties[key], { type: "null" }],
        };
      }
    }

    transformed.properties = properties;
    transformed.required = propertyKeys;
    transformed.additionalProperties = false;
  }

  return transformed;
};

const collectMeaningfulTokens = (text: string): string[] =>
  (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4)
    .slice(0, 40);

const validateQuizPayload = (payload: any): { ok: boolean; error?: string } => {
  if (!payload || !Array.isArray(payload.questions) || payload.questions.length === 0) {
    return { ok: false, error: "Quiz response missing questions array." };
  }

  for (const [index, question] of payload.questions.entries()) {
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      return { ok: false, error: `Question ${index + 1} must contain exactly 4 options.` };
    }
    if (
      typeof question.correctAnswerIndex !== "number" ||
      question.correctAnswerIndex < 0 ||
      question.correctAnswerIndex > 3
    ) {
      return { ok: false, error: `Question ${index + 1} has invalid correctAnswerIndex.` };
    }

    if (question.imagePrompt) {
      if (!question.visualIntent || typeof question.visualIntent !== "string") {
        return { ok: false, error: `Question ${index + 1} imagePrompt requires visualIntent.` };
      }
      const imagePromptLower = String(question.imagePrompt).toLowerCase();
      if (GENERIC_VISUAL_PHRASES.some((phrase) => imagePromptLower.includes(phrase))) {
        return { ok: false, error: `Question ${index + 1} has generic/off-topic image prompt.` };
      }

      const referenceText = `${question.text || ""} ${(question.options || []).join(" ")}`;
      const keywords = collectMeaningfulTokens(referenceText);
      const hasAlignedKeyword = keywords.some((token) => imagePromptLower.includes(token));
      if (!hasAlignedKeyword) {
        return { ok: false, error: `Question ${index + 1} imagePrompt is not aligned to question.` };
      }
    }
  }

  return { ok: true };
};

const validateSlidePayload = (payload: any): { ok: boolean; error?: string } => {
  if (!payload || !Array.isArray(payload.slides) || payload.slides.length === 0) {
    return { ok: false, error: "Slides response missing slides array." };
  }
  for (const [index, slide] of payload.slides.entries()) {
    if (slide.imagePrompt) {
      const contextText = `${slide.title || ""} ${slide.content || ""} ${(slide.vocabulary || []).join(" ")}`;
      const keywords = collectMeaningfulTokens(contextText);
      const imagePromptLower = String(slide.imagePrompt).toLowerCase();
      const hasAlignedKeyword = keywords.some((token) => imagePromptLower.includes(token));
      if (!hasAlignedKeyword) {
        return { ok: false, error: `Slide ${index + 1} imagePrompt is not aligned to slide objective.` };
      }
    }
  }
  return { ok: true };
};

const validateAnalysisPayload = (payload: any): { ok: boolean; error?: string } => {
  if (!payload?.standardCode || !Array.isArray(payload.identifiedGaps)) {
    return { ok: false, error: "Analysis response missing required fields." };
  }
  return { ok: true };
};

const validateStructuredText = (
  task: AiTask,
  text: string | null
): { ok: boolean; error?: string } => {
  if (task === "image") return { ok: true };
  if (!text) return { ok: false, error: "Empty text response from model." };
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Model did not return valid JSON." };
  }

  if (task === "quiz") return validateQuizPayload(parsed);
  if (task === "analysis") return validateAnalysisPayload(parsed);
  if (task === "slides") return validateSlidePayload(parsed);
  return { ok: true };
};

const createStricterContents = (originalContents: any, task: AiTask): any => {
  const strictTail =
    task === "quiz"
      ? "\n\nSTRICT MODE: Return valid JSON only. If imagePrompt is present for any question, include visualIntent and ensure imagePrompt references concrete entities from the same question."
      : "\n\nSTRICT MODE: Return valid JSON only matching schema exactly.";

  if (typeof originalContents === "string") {
    return `${originalContents}${strictTail}`;
  }
  if (originalContents?.parts && Array.isArray(originalContents.parts)) {
    return {
      ...originalContents,
      parts: [...originalContents.parts, { text: strictTail }],
    };
  }
  return originalContents;
};

const callGeminiProvider = async (
  apiKey: string,
  req: GenerateRequest,
  model: string
): Promise<GenerateResponse> => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: req.contents,
    config: req.config,
  });
  return {
    text: response.text ?? null,
    candidates: response.candidates ?? [],
    provider: "gemini",
    model,
  };
};

const callOpenAIProvider = async (
  apiKey: string,
  req: GenerateRequest,
  model: string
): Promise<GenerateResponse> => {
  if (req.task === "image") {
    const prompt =
      typeof req.contents === "string"
        ? req.contents
        : req.contents?.parts?.[0]?.text || "";
    const imageRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        size: "1536x1024",
      }),
    });
    if (!imageRes.ok) {
      const errorBody = await imageRes.text();
      throw new Error(`OpenAI image error: ${imageRes.status} ${errorBody}`);
    }
    const imageJson: any = await imageRes.json();
    const b64 = imageJson?.data?.[0]?.b64_json;
    return {
      text: null,
      candidates: b64
        ? [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: "image/png",
                      data: b64,
                    },
                  },
                ],
              },
            },
          ]
        : [],
      provider: "openai",
      model,
      usage: imageJson?.usage,
    };
  }

  const body: any = {
    model,
    messages: [
      {
        role: "user",
        content:
          typeof req.contents === "string"
            ? req.contents
            : JSON.stringify(req.contents),
      },
    ],
    temperature: 0.2,
  };

  if (req.config?.responseSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: `${req.task}_schema`,
        strict: true,
        schema: toOpenAIStrictSchema(req.config.responseSchema),
      },
    };
  }

  const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!chatRes.ok) {
    const errorBody = await chatRes.text();
    throw new Error(`OpenAI text error: ${chatRes.status} ${errorBody}`);
  }
  const chatJson: any = await chatRes.json();
  return {
    text: chatJson?.choices?.[0]?.message?.content || null,
    candidates: [],
    provider: "openai",
    model,
    usage: chatJson?.usage,
  };
};

const resolveProviderAndModel = (request: GenerateRequest): { provider: ProviderName; model: string } => {
  const provider =
    request.provider && request.provider !== "auto"
      ? request.provider
      : getDefaultProviderForTask(request.task);
  const model = request.model || DEFAULT_MODELS[request.task][provider];
  return { provider, model };
};

const runProvider = async (
  provider: ProviderName,
  request: GenerateRequest,
  model: string
): Promise<GenerateResponse> => {
  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not configured.");
    return callOpenAIProvider(key, request, model);
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  return callGeminiProvider(key, request, model);
};

const generateWithGuards = async (request: GenerateRequest): Promise<GenerateResponse> => {
  const { provider, model } = resolveProviderAndModel(request);
  const fallbackProvider: ProviderName = provider === "gemini" ? "openai" : "gemini";
  const fallbackEnabled = request.metadata?.disableFallback ? false : isFallbackEnabled();

  const attemptOnce = async (currentProvider: ProviderName, currentModel: string, withStrictRetry = true) => {
    const initial = await runProvider(currentProvider, request, currentModel);
    const validation = validateStructuredText(request.task, initial.text);
    if (validation.ok || request.task === "image") return initial;

    if (!withStrictRetry) {
      throw new Error(validation.error || "Validation failed.");
    }

    const strictReq: GenerateRequest = {
      ...request,
      contents: createStricterContents(request.contents, request.task),
    };
    const strictAttempt = await runProvider(currentProvider, strictReq, currentModel);
    const strictValidation = validateStructuredText(request.task, strictAttempt.text);
    if (!strictValidation.ok) {
      throw new Error(strictValidation.error || "Validation failed after strict retry.");
    }
    return strictAttempt;
  };

  try {
    return await attemptOnce(provider, model);
  } catch (primaryError) {
    if (!fallbackEnabled) throw primaryError;
    const fallbackModel = DEFAULT_MODELS[request.task][fallbackProvider];
    return attemptOnce(fallbackProvider, fallbackModel, false);
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;
  console.log("Provider router version: hybrid-v2");

  app.use(cors());
  app.use(express.json());

  app.post("/api/genai/generate-content", async (req, res) => {
    try {
      const request = (req.body ?? {}) as GenerateRequest;
      if (!request.task || !request.contents) {
        return res.status(400).json({ error: "Missing required fields: task and contents." });
      }
      const response = await generateWithGuards(request);
      return res.json(response);
    } catch (error: any) {
      console.error("Error in /api/genai/generate-content:", error);
      return res.status(500).json({
        error: error?.message || "Failed to generate content.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA Fallback: for any unhandled requests, serve index.html
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
