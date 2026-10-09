const ALLOWED_SIZES = new Set(["1024x1024", "1536x1024", "1024x1536", "auto"]);

const ALLOWED_QUALITY = new Set(["low", "medium", "high", "auto"]);

const ALLOWED_FORMATS = new Set(["png", "jpeg", "webp"]);

const isGptImageModel = (model: string): boolean => /\bgpt-image\b/i.test(String(model || ""));

export type ImageSizeOptions = {
  /** Gemini-style ratio such as "16:9"; mapped to the closest OpenAI size. */
  aspectRatio?: string;
  size?: string;
};

const sizeForAspectRatio = (aspectRatio: string | undefined): string | null => {
  const match = /^\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*$/.exec(String(aspectRatio || ""));
  if (!match) return null;
  const ratio = Number(match[1]) / Number(match[2]);
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  if (ratio > 1.15) return "1536x1024";
  if (ratio < 0.87) return "1024x1536";
  return "1024x1024";
};

/**
 * Builds the JSON body for `POST /v1/images/generations`.
 * Size precedence: explicit size, then request aspect ratio, then `OPENAI_IMAGE_SIZE`, then 1024x1024.
 */
export const buildOpenAiImagesGenerationsBody = (
  model: string,
  prompt: string,
  env: NodeJS.ProcessEnv = process.env,
  options: ImageSizeOptions = {},
): Record<string, unknown> => {
  const rawEnvSize = String(env.OPENAI_IMAGE_SIZE || "").trim();
  const requestedSize = String(options.size || "").trim();
  const size = ALLOWED_SIZES.has(requestedSize)
    ? requestedSize
    : sizeForAspectRatio(options.aspectRatio) ||
      (ALLOWED_SIZES.has(rawEnvSize) ? rawEnvSize : "1024x1024");

  const body: Record<string, unknown> = {
    model,
    prompt,
    size,
  };

  if (isGptImageModel(model)) {
    const rawQuality = String(env.OPENAI_IMAGE_QUALITY || "medium").trim().toLowerCase();
    body.quality = ALLOWED_QUALITY.has(rawQuality) ? rawQuality : "medium";

    const rawFormat = String(env.OPENAI_IMAGE_FORMAT || "jpeg").trim().toLowerCase();
    const format = ALLOWED_FORMATS.has(rawFormat) ? rawFormat : "jpeg";
    body.output_format = format;
    if (format !== "png") {
      const compression = Number(env.OPENAI_IMAGE_COMPRESSION);
      body.output_compression =
        Number.isInteger(compression) && compression >= 0 && compression <= 100 ? compression : 85;
    }
  }

  return body;
};

export const imageMimeTypeForFormat = (format: unknown): string => {
  const f = String(format || "").toLowerCase();
  if (f === "jpeg" || f === "jpg") return "image/jpeg";
  if (f === "webp") return "image/webp";
  return "image/png";
};
