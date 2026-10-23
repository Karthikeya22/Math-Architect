/** Condensed Learning Commons Agent Skills (Apache-2.0) for runtime prompts. */

const CFU = `- Scope items to one clear learning component / skill within the pinned standard.
- Prefer 1–3 formative probes over sprawling battery; each distractor should map to a documented misconception or prerequisite gap when possible.
- Use asset-based language: name the specific student thinking, never labels like "weak" or "behind".
- Keep stems grade-appropriate in length; numbers and representations must stay on-grade for the standard.
- Every option (including wrong ones) must be mathematically coherent as a choice a real student might reach.
- Do not invent curriculum publisher attributions in student-facing text.`;

const DIFFERENTIATE = `- Address diagnosed gaps with concrete next instructional moves (representation, sub-skill, or task type), not generic "reteach".
- Keep teacher talking points actionable: one question to ask the student and what a correct reply sounds like.
- When remedying misconceptions, show the wrong method beside the fix with correct math only.
- Prefer one model visual with exact quantities; never leak the try-it answer in the teaching picture.
- Write to the student at the stated grade reading level; short projected titles, denser notes for the teacher.`;

export const getLcSkillPromptPack = (kind: "quiz" | "slides"): string => {
  if (kind === "quiz") {
    return `\nItem-writing constraints (internal — never mention to students or teachers):\n${CFU}\n`;
  }
  return `\nRemediation constraints (internal — never mention to students or teachers):\n${DIFFERENTIATE}\n\n${CFU}\n`;
};
