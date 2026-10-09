# Quiz Polish & Professional Typography Implementation Plan

> **For agentic workers:** Use subagent-driven-development or executing-plans task-by-task.

**Goal:** Eliminate broken fraction text (`[/]`, empty/incomplete `\frac`), hide quiz figure chrome when no usable image exists, and make site type feel classroom-professional.

**Architecture:** Keep existing pipelines. Harden copy normalization before KaTeX; tighten `hasFigure` gating in QuizTaker; swap CSS font tokens only (no layout redesign).

**Tech Stack:** React, KaTeX, Vitest, Google Fonts (Source Sans 3 / Source Serif 4), existing `MathHtml` / quiz figure flow.

## Global Constraints

- No new image retry/fallback pipeline
- Do not show empty figure panels or “Figure unavailable” chrome
- Questions/loading/UI use sans; serif only for brand/hero headlines
- Prefer TDD for math-normalization cases

## Files

- `src/utils/normalizeQuizMathCopy.ts` + test — repair AI fraction junk
- `src/utils/renderRichMathHtml.ts` + test — KaTeX failure → plain math fallback
- `src/utils/hasUsableQuizFigure.ts` + test — usable figure gate
- `src/components/QuizTaker.tsx` — wire usable-figure gate
- `src/index.css` — font import + tokens; `.quiz-stem` → sans
- `src/components/TypewriterLoading.tsx` — loading uses sans

## Task 1: Math copy repairs (TDD)

- [x] Add failing tests for empty/incomplete frac and `[/]`
- [x] Implement repairs in `normalizeQuizMathCopy`
- [x] KaTeX failure → `toPlainMathText`
- [x] Vitest green

## Task 2: Hide unusable figures

- [x] `hasUsableQuizFigure` helper
- [x] Wire QuizTaker `hasFigure` / primary / GeoGebra gates

## Task 3: Typography tokens

- [x] Source Sans 3 + Source Serif 4 (+ JetBrains Mono)
- [x] Quiz stem + loading → sans; headlines keep display serif

## Task 4: Spec/plan docs + verify

- [x] Design + plan under `docs/superpowers/`
- [x] Vitest for math + figure helpers
