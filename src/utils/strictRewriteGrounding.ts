/** Composite key for strict rewrite-only grounding against question_materials rows. */
export const materialCompositeKey = (provider: string, providerItemId: string): string => {
  const prov = String(provider ?? "").trim().toUpperCase();
  const id = String(providerItemId ?? "").trim();
  return `${prov}::${id}`;
};

export const buildMaterialKeySet = (
  materials: { provider?: string; provider_item_id?: string }[]
): Set<string> => {
  const keys = new Set<string>();
  for (const row of materials) {
    keys.add(materialCompositeKey(String(row.provider ?? ""), String(row.provider_item_id ?? "")));
  }
  return keys;
};

export const enforceStrictRewriteGrounding = (
  sourcePolicy: string,
  materials: { provider?: string; provider_item_id?: string }[],
  questions: { sourceType?: string; providerItemId?: string; sourceProvider?: string }[]
): void => {
  if (sourcePolicy !== "strict_rewrite_only") return;
  if (!materials.length) return;
  const keys = buildMaterialKeySet(materials);
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const st = String(q.sourceType ?? "").toLowerCase();
    if (st === "novel") {
      throw new Error(
        `Rewrite Only mode: question ${i + 1} was marked novel. Regenerate the quiz or add matching item bank rows for this standard.`
      );
    }
    const pid = String(q.providerItemId ?? "").trim();
    const prov = String(q.sourceProvider ?? "").trim();
    if (!pid || pid.toLowerCase() === "n/a") {
      throw new Error(
        `Rewrite Only mode: question ${i + 1} is missing a providerItemId from the item bank. Regenerate or seed question_materials for this standard.`
      );
    }
    const composite = materialCompositeKey(prov, pid);
    if (!keys.has(composite)) {
      throw new Error(
        `Rewrite Only mode: question ${i + 1} cites "${composite}" but that id is not in the retrieved materials list. Regenerate the quiz.`
      );
    }
  }
};
