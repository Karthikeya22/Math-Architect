import { describe, expect, it } from "vitest";
import { getLcSkillPromptPack } from "./skills";

describe("getLcSkillPromptPack", () => {
  it("returns CFU pack for quiz prompts", () => {
    const pack = getLcSkillPromptPack("quiz");
    expect(pack).toMatch(/Item-writing constraints/i);
    expect(pack).toMatch(/learning component/i);
    expect(pack).not.toMatch(/Learning Commons/i);
  });

  it("returns differentiation + CFU for slides", () => {
    const pack = getLcSkillPromptPack("slides");
    expect(pack).toMatch(/diagnosed gaps/i);
    expect(pack).toMatch(/learning component/i);
    expect(pack).not.toMatch(/Learning Commons/i);
  });
});
