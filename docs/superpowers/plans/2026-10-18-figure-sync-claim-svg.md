# Figure sync (claim → SVG first) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route quiz figures through a locked ItemClaim: deterministic SVG first; AI raster only for illustration, gated by local verify + Learning Commons Graphics Accuracy (fail when configured); omit when not confident; remove GeoGebra from the quiz figure product path.

**Architecture:** `buildItemClaim` → `classifyClaim` → `renderClaimSvg` inside `generateFigure`; AI path only for `illustration`; quiz attach prefers `svg` on the result; strip GeoGebra from `aiService` / QuizTaker / `hasUsableQuizFigure`.

**Tech Stack:** TypeScript, Vitest, existing `visualSpec` / `prepareQuestionVisual`, `@learning-commons/evaluators` Graphics Accuracy.

## Global Constraints

- Accurate or omit — never publish a figure we know does not match.
- Exact/geometric without renderable SVG → no AI fallback.
- No “Learning Commons” labels in teacher UI.
- Do not expand GeoGebra; remove quiz-facing usage.

---

### Task 1: ItemClaim + classifyClaim + renderClaimSvg

**Files:**
- Create: `src/server/figures/itemClaim.ts`
- Create: `src/server/figures/itemClaim.test.ts`
- Create: `src/server/figures/classifyClaim.ts`
- Create: `src/server/figures/classifyClaim.test.ts`
- Create: `src/server/figures/renderClaimSvg.ts`
- Create: `src/server/figures/renderClaimSvg.test.ts`
- Modify: `src/server/figures/types.ts` (extend `QuestionFigureInput` with `visualSpec?;` extend `FigureResult` with `svg?: string; visualPath?: string`)

**Interfaces:**
- Produces: `ItemClaim`, `buildItemClaim(input)`, `classifyClaim(claim)`, `renderClaimSvg(claim)`

- [ ] **Step 1: Add types + buildItemClaim (TDD)**

```ts
export type VisualClass = 'exact' | 'geometric' | 'illustration' | 'none';

export type ItemClaim = {
  kind: 'question' | 'slide';
  grade: string;
  standardCode?: string;
  stemText: string;
  options: string[];
  correctAnswerIndex?: number;
  correctAnswerText?: string;
  visualIntent?: string;
  visualSpec?: import('../../types').VisualSpec | null;
  visualClass: VisualClass;
  mustShow: string[];
  mustNotShow: string[];
};
```

`buildItemClaim` from `FigureInput` (+ optional visualSpec on question). Derive `correctAnswerText` from options[index]. Default `visualClass` via `classifyClaim` after repair helpers mirror `prepareQuestionVisualFields` on a scratch record.

- [ ] **Step 2: classifyClaim** — if renderable deterministic spec → `exact` for countable/fraction/chart templates, `geometric` for `coordinate_plane` | `geometric_shape` | `shape_diagram`; if intent/description looks decorative and no deterministic spec → `illustration`; else `none`.

- [ ] **Step 3: renderClaimSvg** — run `validateQuestionVisualSpec`; if error return null; else `renderDeterministicVisualSvg`; return SVG string or null.

- [ ] **Step 4: Run tests** — `npx vitest run src/server/figures/itemClaim.test.ts src/server/figures/classifyClaim.test.ts src/server/figures/renderClaimSvg.test.ts`

---

### Task 2: Wire generateFigure (SVG first, AI only for illustration)

**Files:**
- Modify: `src/server/figures/generateFigure.ts`
- Modify: `src/server/figures/generateFigure.test.ts`
- Modify: `src/server/lc/graphicsAccuracy.ts` (optional `forceFail?: boolean` — when true and configured, treat as fail mode)
- Modify: `src/server/http/figureRoutes.ts` (pass `visualSpec` from body)

- [ ] **Step 1: Failing tests** — exact claim with ten_frame visualSpec never calls `task: 'image'`; returns `status: 'verified'`, `svg` set, `visualPath: 'deterministic_svg'`. Exact without SVG → `skipped` or `rejected` with no image and no AI. Illustration path still calls AI; with `forceFail` LC reject → no image.

- [ ] **Step 2: Implement orchestration** in `generateFigure`:
  1. `buildItemClaim`
  2. If class exact|geometric and `renderClaimSvg` → return verified with svg
  3. If class is not illustration → return skipped (no confident figure)
  4. Else existing brief → AI → verify → `checkLcGraphicsAccuracy({ ..., forceFail: true })`

- [ ] **Step 3: Run** `npx vitest run src/server/figures/generateFigure.test.ts src/server/lc/graphicsAccuracy.test.ts`

---

### Task 3: Quiz attach prefers SVG; stop GeoGebra

**Files:**
- Modify: `src/services/aiService.ts` — pass `visualSpec` in figure request; if `figure.svg` set `question.visual` and `visualPath`; remove `attachGeoGebraVisual`
- Modify: `src/services/aiServiceImageProvider.test.ts` — drop GeoGebra expectation; expect SVG-first behavior where mocked
- Modify: `src/components/QuizTaker.tsx` — remove geogebra toggle / branch
- Modify: `src/utils/hasUsableQuizFigure.ts` (+ test) — drop geogebra
- Modify: `src/types.ts` — deprecate/remove `geogebraImageBase64` from Question if safe

- [ ] **Step 1: Update attach path and tests**
- [ ] **Step 2: Strip QuizTaker GeoGebra UI**
- [ ] **Step 3: Run** `npx vitest run src/utils/hasUsableQuizFigure.test.ts src/services/aiServiceImageProvider.test.ts src/server/figures/`

---

### Task 4: Verification gate

- [ ] **Step 1:** `npx vitest run src/server/figures src/server/lc/graphicsAccuracy.test.ts src/utils/hasUsableQuizFigure.test.ts src/services/aiServiceImageProvider.test.ts`
- [ ] **Step 2:** Fix any regressions
- [ ] **Step 3:** Mark design status approved in spec header if still draft
