export type ProviderName = "gemini" | "openai";
export type AiTask = "quiz" | "analysis" | "slides" | "image" | "vision" | "figure_brief";

export type GenerateRequest = {
  task: AiTask;
  model?: string;
  provider?: ProviderName | "auto";
  contents: any;
  config?: any;
  metadata?: Record<string, any>;
};

export type GenerateResponse = {
  text: string | null;
  candidates: any[];
  provider: ProviderName;
  model: string;
  usage?: Record<string, any>;
};
