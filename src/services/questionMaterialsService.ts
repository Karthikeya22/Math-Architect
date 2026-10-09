export type QuestionMaterial = {
  id: string;
  provider: string;
  provider_item_id: string;
  standard_code: string;
  grade: string | null;
  title: string;
  description: string | null;
  url: string;
  content_kind: string | null;
  keywords: string[];
  difficulty_hint: 'Easy' | 'Medium' | 'Hard' | null;
  metadata: Record<string, unknown> | null;
};

export type QuestionMaterialsResponse = {
  standardId: string;
  materials: QuestionMaterial[];
};

export const fetchQuestionMaterials = async (args: {
  standardCode: string;
  grade?: string;
  provider?: string;
  limit?: number;
}): Promise<QuestionMaterialsResponse> => {
  const params = new URLSearchParams();
  params.set('standard_id', args.standardCode);
  if (args.grade) params.set('grade', args.grade);
  if (args.provider) params.set('provider', args.provider);
  params.set('limit', String(args.limit ?? 50));

  const res = await fetch(`/api/question-materials?${params.toString()}`);
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`Question materials failed: ${res.status} ${bodyText}`);
  }
  try {
    return JSON.parse(bodyText) as QuestionMaterialsResponse;
  } catch {
    throw new Error('Question materials endpoint returned invalid JSON.');
  }
};
