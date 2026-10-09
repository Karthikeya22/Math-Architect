import { describe, expect, it } from "vitest";
import { GradeLevel } from "../types";
import { mapApiGradeToGradeLevel } from "./standardsService";

describe("mapApiGradeToGradeLevel", () => {
  it("maps Kindergarten variants", () => {
    expect(mapApiGradeToGradeLevel("Kindergarten")).toBe(GradeLevel.K);
    expect(mapApiGradeToGradeLevel("kindergarten")).toBe(GradeLevel.K);
    expect(mapApiGradeToGradeLevel("K")).toBe(GradeLevel.K);
    expect(mapApiGradeToGradeLevel("kg")).toBe(GradeLevel.K);
    expect(mapApiGradeToGradeLevel("Grade Kindergarten")).toBe(GradeLevel.K);
  });

  it("maps numeric and Grade N forms for 1–8", () => {
    expect(mapApiGradeToGradeLevel("1")).toBe(GradeLevel.G1);
    expect(mapApiGradeToGradeLevel("Grade 3")).toBe(GradeLevel.G3);
    expect(mapApiGradeToGradeLevel("grade 8")).toBe(GradeLevel.G8);
  });

  it("returns null for unsupported grades", () => {
    expect(mapApiGradeToGradeLevel("Grade 9")).toBeNull();
    expect(mapApiGradeToGradeLevel("")).toBeNull();
    expect(mapApiGradeToGradeLevel("Algebra")).toBeNull();
  });

  it("does not guess grade from arbitrary strings containing digits", () => {
    expect(mapApiGradeToGradeLevel("MA.4.NSO.1")).toBeNull();
    expect(mapApiGradeToGradeLevel("Grade Nine")).toBeNull();
  });
});
