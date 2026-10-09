import { randomUUID } from "node:crypto";

const MAX_VISUAL_CHARS = 120_000;

export const stripQuestionForStorage = (question: Record<string, unknown>): Record<string, unknown> => {
  const out = { ...question };
  if (out.generatedImageBase64) {
    out.generatedImageBase64 = null;
  }
  if (out.geogebraImageBase64) {
    out.geogebraImageBase64 = null;
  }
  if (typeof out.visual === "string" && out.visual.length > MAX_VISUAL_CHARS) {
    out.visual = null;
  }
  return out;
};

export const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const randomUserKey = () => `usr_${randomUUID().replace(/-/g, "")}`;
