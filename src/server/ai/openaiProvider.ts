import { buildOpenAiImagesGenerationsBody, imageMimeTypeForFormat } from "../openAiImageGeneration.ts";
import type { AiTask, GenerateRequest, GenerateResponse } from "./types.ts";

const normalizeSchemaTypeValue = (value: any): any => {
  if (typeof value === "string") return value.toLowerCase();
  if (Array.isArray(value)) return value.map((v) => (typeof v === "string" ? v.toLowerCase() : v));
  return value;
};

const toOpenAIStrictSchema = (node: any): any => {
  if (node === null || node === undefined) return node;
  if (typeof node !== "object") return node;
  // JSON Schema `enum` (and similar) are arrays; Object.entries(array) would produce invalid { "0": ... } objects.
  if (Array.isArray(node)) {
    return node.map((entry) =>
      entry !== null && typeof entry === "object" ? toOpenAIStrictSchema(entry) : entry
    );
  }

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
    } else if (key === "items" && value && typeof value === "object" && !Array.isArray(value)) {
      transformed.items = toOpenAIStrictSchema(value);
    } else if (key === "required" && Array.isArray(value)) {
      transformed.required = [...value];
    } else if (value && typeof value === "object") {
      transformed[key] = toOpenAIStrictSchema(value);
    } else {
      transformed[key] = value;
    }
  }

  // OpenAI strict mode requires every object to list all keys in `required` and forbid extras.
  // Optional source keys become nullable; `stripNullsDeep` removes those nulls from the response.
  if (transformed.type === "object") {
    const properties = transformed.properties || {};
    const propertyKeys = Object.keys(properties);
    const originallyRequired = new Set(Array.isArray(transformed.required) ? transformed.required : []);

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

export const stripNullsDeep = (value: any): any => {
  if (Array.isArray(value)) {
    return value.filter((entry) => entry !== null).map(stripNullsDeep);
  }
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry === null) continue;
      out[key] = stripNullsDeep(entry);
    }
    return out;
  }
  return value;
};

/** GPT-5 and o-series reasoning models only accept the default temperature. */
export const modelSupportsCustomTemperature = (model: string): boolean =>
  !/^(gpt-5|o\d)/i.test(String(model || "").trim());

const isReasoningModel = (model: string): boolean => !modelSupportsCustomTemperature(model);

const REASONING_EFFORT_BY_TASK: Record<AiTask, string> = {
  quiz: "low",
  analysis: "low",
  slides: "medium",
  image: "low",
  vision: "low",
  figure_brief: "low",
};

const resolveReasoningEffort = (task: AiTask, env: NodeJS.ProcessEnv = process.env): string => {
  const override = String(env[`OPENAI_REASONING_${task.toUpperCase()}`] || "").trim().toLowerCase();
  return ["none", "minimal", "low", "medium", "high"].includes(override)
    ? override
    : REASONING_EFFORT_BY_TASK[task];
};

const resolveBaseUrl = (env: NodeJS.ProcessEnv = process.env): string =>
  String(env.OPENAI_BASE_URL || "https://api.openai.com/v1").trim().replace(/\/+$/, "");

/** Converts Gemini-style `contents` (string or `{ parts }`) into OpenAI chat messages. */
export const buildOpenAIChatMessages = (contents: any): Array<{ role: "user"; content: any }> => {
  if (typeof contents === "string") return [{ role: "user", content: contents }];

  const parts: any[] = Array.isArray(contents?.parts)
    ? contents.parts
    : Array.isArray(contents)
      ? contents.flatMap((c: any) => (Array.isArray(c?.parts) ? c.parts : [c]))
      : [];

  if (parts.length === 0) {
    return [{ role: "user", content: JSON.stringify(contents ?? "") }];
  }

  const hasImage = parts.some((part) => part?.inlineData?.data);
  if (!hasImage) {
    const text = parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .filter(Boolean)
      .join("\n\n");
    return [{ role: "user", content: text }];
  }

  const content = parts
    .map((part) => {
      if (part?.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/png";
        return { type: "image_url", image_url: { url: `data:${mime};base64,${part.inlineData.data}` } };
      }
      if (typeof part?.text === "string" && part.text) return { type: "text", text: part.text };
      return null;
    })
    .filter(Boolean);
  return [{ role: "user", content }];
};

const RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const retryDelayMs = (res: Response, attempt: number): number => {
  const header = Number(res.headers.get("retry-after"));
  if (Number.isFinite(header) && header >= 0) return Math.min(header * 1000, 20_000);
  return Math.min(1500 * 2 ** attempt, 12_000);
};

const postJsonWithRetry = async (
  url: string,
  apiKey: string,
  body: unknown,
  label: string,
  maxAttempts = 3,
): Promise<any> => {
  let lastError = "";
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
    const errorBody = await res.text();
    lastError = `OpenAI ${label} error: ${res.status} ${errorBody}`;
    if (!RETRYABLE_STATUS.has(res.status) || attempt === maxAttempts - 1) break;
    await sleep(retryDelayMs(res, attempt));
  }
  throw new Error(lastError);
};

export const callOpenAIProvider = async (
  apiKey: string,
  req: GenerateRequest,
  model: string
): Promise<GenerateResponse> => {
  const baseUrl = resolveBaseUrl();

  if (req.task === "image") {
    const prompt =
      typeof req.contents === "string"
        ? req.contents
        : (req.contents?.parts || [])
            .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
            .filter(Boolean)
            .join("\n\n");
    const imageJson = await postJsonWithRetry(
      `${baseUrl}/images/generations`,
      apiKey,
      buildOpenAiImagesGenerationsBody(model, prompt, process.env, {
        aspectRatio: req.config?.imageConfig?.aspectRatio,
        size: req.config?.imageConfig?.size,
      }),
      "image",
    );
    const b64 = imageJson?.data?.[0]?.b64_json;
    const mimeType = imageMimeTypeForFormat(imageJson?.output_format);
    return {
      text: null,
      candidates: b64
        ? [{ content: { parts: [{ inlineData: { mimeType, data: b64 } }] } }]
        : [],
      provider: "openai",
      model,
      usage: imageJson?.usage,
    };
  }

  const body: any = {
    model,
    messages: buildOpenAIChatMessages(req.contents),
  };
  if (isReasoningModel(model)) {
    body.reasoning_effort = resolveReasoningEffort(req.task);
  } else {
    body.temperature = 0.2;
  }

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

  const chatJson = await postJsonWithRetry(`${baseUrl}/chat/completions`, apiKey, body, "text");
  let text: string | null = chatJson?.choices?.[0]?.message?.content || null;
  if (text && req.config?.responseSchema) {
    try {
      text = JSON.stringify(stripNullsDeep(JSON.parse(text)));
    } catch {
      // Leave unparseable text for the caller's validator to report.
    }
  }
  return {
    text,
    candidates: [],
    provider: "openai",
    model,
    usage: chatJson?.usage,
  };
};
