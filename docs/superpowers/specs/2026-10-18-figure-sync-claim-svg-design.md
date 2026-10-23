# Figure sync: claim-locked SVG first — design

**Status:** approved (build in progress)  
**Date:** 2026-10-18  
**Sub-project:** A — figure sync only (not full-platform quality)

## Problem

Quiz figures can disagree with the stem and keyed answer because the primary path is figure-brief → AI raster → vision check. Diffusion cannot guarantee exact counts, equal parts, or labeled geometry. GeoGebra is present in the codebase as an optional side path but is not the product’s working figure system. Learning Commons Graphics Accuracy is wired but defaults to shadow, so it rarely changes what students see.

## Goals

1. Prefer a figure only when we are confident it matches the item (“accurate or omit”).
2. Drive stem-critical figures from a locked claim + deterministic `visualSpec` → SVG.
3. Use AI raster only for non-exact illustration, and only keep it when local verify + Learning Commons Graphics Accuracy both pass.
4. Include Learning Commons as an active gate on the AI path (not shadow-only).
5. Remove unused GeoGebra surface area from the figure product path.

## Non-goals

- Full platform polish (providers, remedial UX, studio redesign).
- New GeoGebra or “Colossus” integration (Colossus does not exist in this repo).
- Expanding every B.E.S.T. visual family in one pass (v1 covers families already expressible in `visualSpec` / exact-count helpers; more templates are follow-on).
- Changing Math Standards Alignment beyond what quiz generation already does (stays on generation; this spec owns **graphics**).

## Decisions

| Topic | Decision |
|-------|----------|
| Primary renderer | Existing `visualSpec` → `renderDeterministicVisualSvg` |
| AI raster | Last resort for `illustration` only; never the primary path for exact/countable claims |
| No confident match | Leave blank — item still usable without a figure |
| GeoGebra | Remove from figure product path (types, QuizTaker toggle, attach-on-generate, render API usage in quiz flow). Do not expand it. |
| Learning Commons | **Active on AI figures**; see LC section below |
| Skills for implementation | `domain-modeling` (ItemClaim), `tdd` / `test-driven-development`, `verification-before-completion`, then `writing-plans` → execute |

## Learning Commons — how it participates

LC does **not** replace SVG. It makes the “is this 100% matching?” call on **pixels**.

| Path | LC role | Mode |
|------|---------|------|
| Deterministic SVG | Trust claim + `visualSpec` validation. Optional shadow log of claim text only; **do not** require Graphics Accuracy to accept SVG. | SVG publish without LC raster gate |
| AI illustration fallback | Build claim via `composeGraphicsAccuracyClaim(stem, correctAnswer)` from locked `ItemClaim`. Run **Graphics Accuracy after** local `FIGURE_VERIFY`. Fail → retry; after attempts → **no figure**. | `LC_EVAL_MODE=fail` for this gate when keys are configured; if unconfigured, skip LC and still require local verify; if local verify fails → omit |
| Quiz text alignment | Existing Math Standards Alignment on generation stays as today (shadow/fail via env). Out of scope to redesign here, but figure claim must use the same keyed answer the aligner saw. | unchanged env |

**Why this simplifies the task:** LC’s Graphics Accuracy evaluator is purpose-built to derive an answer from the image and compare to the claim. We use that as the hard stop for AI pixels, while SVG correctness comes from construction. Shadow-only LC does not improve student-facing accuracy; fail-on-AI does.

**Silent UX:** No “Learning Commons” labels in the teacher UI. Telemetry may record `lcGraphicsPass` / issues server-side.

## Architecture

```
question (text, options, correctAnswerIndex, visualIntent, visualSpec?)
        ↓
   ItemClaim (locked, immutable for this item cycle)
        ↓
   classifyClaim → exact | geometric | illustration | none
        ↓
exact | geometric
        → ensure/repair visualSpec from claim
        → validateVisualSpec
        → renderDeterministicVisualSvg
        → success: attach SVG as figure; done
        → fail: treat as no confident deterministic figure → fall through
        ↓
illustration (or fall-through only if claim class allows illustration)
        → figure brief (mustShow/mustNot from claim)
        → AI image
        → local FIGURE_VERIFY
        → LC Graphics Accuracy (fail when configured)
        → success: attach raster; done
        → fail: omit figure
        ↓
none / exact without SVG / verify fail
        → status skipped|rejected, no image
```

## ItemClaim (domain)

Single source of truth for one item’s figure cycle:

- `stemText`
- `options` / `correctAnswerIndex` / `correctAnswerText`
- `grade`, `standardCode` (optional)
- `visualClass`: `exact` | `geometric` | `illustration` | `none`
- `visualSpec` (optional typed payload)
- `mustShow` / `mustNotShow` (derived for brief)
- `answerDependentCounts` (e.g. object counts implied by the keyed answer)

Rules:

- Figure brief and LC claim are derived from ItemClaim, not free rewrite of the stem.
- Explanation regeneration (if touched later) must use the same claim; this spec only requires figure path to consume it.

## Components / file seams

| Unit | Responsibility |
|------|----------------|
| `src/server/figures/itemClaim.ts` (new) | Build/normalize ItemClaim from question/slide input |
| `src/server/figures/classifyClaim.ts` (new) | Map claim → visual class using existing exact-count / visualSpec helpers |
| `src/server/figures/renderClaimSvg.ts` (new) | validate + `renderDeterministicVisualSvg`; return SVG string or null |
| `src/server/figures/generateFigure.ts` (modify) | Orchestrate: claim → SVG first → AI+LC only for illustration; omit otherwise |
| `src/server/lc/graphicsAccuracy.ts` | Keep; claim string always from ItemClaim for questions |
| Quiz generation attach path (`aiService` / figure routes) | Prefer SVG on question when `generateFigure` returns SVG; stop attaching GeoGebra |
| GeoGebra removal | Strip product usage: `geogebraImageBase64` UI toggle, quiz attach, dead feature flags in the figure path. Leave low-level `server/geogebraImageGeneration` only if still needed for a dedicated API; prefer deleting quiz-facing code in this pass |

## Error handling

- SVG render null / invalid spec → no deterministic figure (not an exception).
- AI generate throws / empty image → retry within `FIGURE_MAX_ATTEMPTS`, then omit.
- Local verify fail → retry with feedback, then omit.
- LC fail (fail mode) → retry with LC issues as feedback, then omit.
- LC unconfigured → do not pretend pass for AI: still require local verify; log that LC was skipped.

## Testing (TDD)

Seams to test first:

1. `buildItemClaim` — keyed answer and counts land in claim.
2. `classifyClaim` — exact vs illustration vs none.
3. `renderClaimSvg` — known ten-frame / fraction_bar / array fixtures render non-null SVG.
4. `generateFigure` — exact claim with valid spec never calls AI generate; returns SVG (or data-URL wrapper as product expects).
5. `generateFigure` — illustration path calls AI; LC fail → rejected/omit.
6. QuizTaker / `hasUsableQuizFigure` — no GeoGebra branch required for usable figure.

## Success criteria

- Exact countable items that already have/repair to a valid `visualSpec` ship SVG without calling the image model.
- AI figures that fail LC or local verify do not appear in the quiz.
- No GeoGebra toggle or `geogebraImageBase64` in the student quiz figure chrome.
- LC Graphics Accuracy is on the critical path for AI figures when keys exist (`fail` for that gate).

## Follow-ons (out of this spec)

- More SVG templates for uncovered B.E.S.T. families.
- Fail-mode Math Standards Alignment tuning.
- Explanation text regenerated from ItemClaim.
- Physical deletion of entire GeoGebra server package if unused after quiz-path removal.
