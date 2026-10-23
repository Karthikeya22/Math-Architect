import enrichment from "../data/lc_math_learning_components.json";

export type LcLearningComponent = {
  identifier: string;
  description: string;
};

type EnrichmentFile = {
  jurisdiction?: string;
  generatedAt?: string;
  standards?: Record<
    string,
    {
      learningComponents?: LcLearningComponent[];
    }
  >;
};

const file = enrichment as EnrichmentFile;

export const getLcEnrichmentMeta = () => ({
  jurisdiction: file.jurisdiction || "Florida",
  generatedAt: file.generatedAt || null,
});

export const getLcLearningComponentsForCode = (standardCode: string): LcLearningComponent[] => {
  const row = file.standards?.[standardCode] || file.standards?.[standardCode.trim()];
  return row?.learningComponents ?? [];
};

export const formatLcLearningComponentsForPrompt = (standardCode: string): string => {
  const components = getLcLearningComponentsForCode(standardCode);
  if (components.length === 0) return "";
  return components
    .slice(0, 8)
    .map((c, i) => `${i + 1}. ${c.description}`)
    .join("\n");
};
