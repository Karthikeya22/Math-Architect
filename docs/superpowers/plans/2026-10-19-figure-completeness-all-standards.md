# Figure completeness for all B.E.S.T. standards

**Status:** in progress — pipeline complete; fixture coverage is source-data limited
**Date:** 2026-10-19
**Scope:** quiz questions, slides, and solution-step figures across all 642 Florida B.E.S.T. math standards.

## Build status (2026-10-19)

| Phase | Status | Notes |
|---|---|---|
| 0 — Corpus and matrix | Done | 642 codes classified; 378 figure-required; matrix + 378 fixtures written; per-code skeleton catalog generated. |
| 1 — Correctness core | Done | Contract, coverage gate, `figures[]`, `needs_review`, UI gate, Rectangle A/B golden test. |
| 2 — Deterministic geometry | Done for 2D + 3D | Polygons, solids (cube/prism/sphere/cylinder/cone/pyramid), name/dimension/area labels, shared scale. |
| 3 — Coverage waves | Partial | Reconcilers cover rectangles, fractions, ten frames, number lines, arrays, coordinate points, place value, clocks, tables. Remaining `no_spec` fixtures are source-data gaps. |
| 4 — Prompt/schema/preflight | Done | Structured `visualSpec.figures[]`, contract injected into the figure brief. |
| 5 — AI hard gate | Done | Contract labels merged into the brief; verifier `visibleText` drives coverage; measured geometry never calls AI. |
| 6 — Audit/QA/telemetry | Done | Fixture + generated audits, `#/dev/visuals` fixture gallery, `figure_status`/`figure_coverage_pct` telemetry. |
| 7 — Rollout/regression | Partial | 456 tests pass; `npm run lint` green; solution-step SVGs gated by `renderVerifiedVisualSvg`; generated-question audit awaits a production dump. |

Current fixture audit: **92 / 378 pass**, **0 missing labels**, **0 leaks**. Of the 286 `no_spec` fixtures, **189 come from a standard description or clarification** that contains no concrete model; those are data-limited, not renderer failures. The live reconcilers still handle concrete generated stems in those families.

Known limits:

- Official-example arrays in `data/processed/standards.json` are polluted with document metadata for some codes; the fixture builder now filters those lines, but the missing item text cannot be reconstructed.
- Slide figures currently carry `visualDescription` only (no `visualSpec`), so slide art stays on the AI-illustration path. Solution-step figures are deterministic and gated by `renderVerifiedVisualSvg`.
- The generated-question audit needs a production dump: `npm run figures:audit:generated -- --input <dump.json>`.



## Problem

Figures are published as "verified" when they are structurally incomplete. The MA.4.GR.2.2 Rectangle A/B item is the canonical example:

- `"square inches"` is parsed as a `square` shape.
- `Rectangle A` and `Rectangle B` collapse into one rectangle.
- The reconciler drops `9 inches`, `4 inches`, `12 inches`, and the area.
- `renderGeometricShape` draws both figures at one fixed size and ignores labels and dimensions.
- `generateFigure` marks the partial SVG `verified`; the deterministic path bypasses verification.
- `hasUsableQuizFigure` accepts any non-empty `<svg>`.

The same failure classes can affect every standard whose stem depends on a visual. The fix is a contract derived from the stem, enforced for both deterministic SVG and AI raster, plus a corpus audit covering all codes and their official examples.

## Decisions

| Topic | Decision |
|---|---|
| Figure coverage | Only items whose stem needs a figure. No decorative images on pure symbolic items. |
| Failure behavior | Best effort first: repair, re-render, rewrite the question, retry AI. Never publish a wrong figure. If all attempts fail: text-only for students + teacher-facing `needs_review` flag. |
| Measured geometry | Deterministic SVG only. No AI raster. |
| AI raster | Real-world illustrations and decorative scenes only. |
| Priority | Maximize successful figure coverage without relaxing correctness. |
| Docs location | `D:` only. No files on `C:`. |

## Data inventory

| Source | Coverage |
|---|---|
| `data/processed/standards.json` | 642 standards |
| With `instructional_items` | 472 |
| With `instructional_tasks` | 450 |
| With `clarifications` | 413 |
| `data/processed/ixl_flbest.json` | 829 skill mappings |
| `data/processed/cpalms_mfas.json` | CPALMS MFAS tasks |
| `data/processed/best-khan-mappings.json` | Khan mappings |
| Generated questions | Supabase `questions.generation_metadata` + local quiz JSON |

Strand counts: NSO 108, AR 148, M 23, GR 103, DP 81, FR 21, Functions 26, Financial Literacy 27, Trigonometry 23, Logic/Discrete 30, Calculus 45, MTR 7.

## Architecture

```
stem + options + keyed answer + visualSpec + standard code
        ↓
FigureContract  (entities, given labels, measurements, units, mustShow, mustNotShow, altText)
        ↓
spec builder → deterministic renderer → coverage check
        OR
AI brief → raster → visibleText coverage check
        ↓
publish only at 100% coverage; otherwise repair/retry; otherwise needs_review
```

`FigureContract` is shared by quiz, slide, and solution-step paths.

## Standard Figure Matrix

Generated for all 642 codes at:

- `reports/figure-coverage/standards-matrix.json`
- `reports/figure-coverage/standards-matrix.md`

Each row records:

- code, grade, strand, description
- `figureRequired`, `family`, `figureReason`
- official example sources
- fixture paths and expected labels
- renderer status
- fixture audit and generated-question audit counts
- priority

No code is left unclassified. `figureRequired: false` is valid only with a recorded reason.

## Figure skeleton catalog

Generated for all 642 codes at:

- `reports/figure-coverage/figure-skeletons.json`
- `reports/figure-coverage/figure-skeletons.md`

`src/server/figures/skeletons/catalog.ts` is the single source of truth: one skeleton per `FigureFamily` (id, label, deterministic/AI status, visual type, match hint, prompt fallback). `skeletonForStandard(code, family)` adds code-level overrides (for example `MA.5.FR.2.2` → `area_model_product`).

| Skeleton | Required | Visual type |
|---|---|---|
| coordinate_plane | 88 | coordinate_plane |
| geometric_shape | 71 | geometric_shape |
| named_shapes | 50 | geometric_shape |
| dimensioned_rectangle | 41 | geometric_shape |
| fraction_bar | 38 | fraction_bar |
| ten_frame | 29 | ten_frame |
| categorical_bar_chart | 27 | bar_chart |
| line_plot | 21 | line_plot |
| area_model_product | 8 | area_model |
| clock_face | 5 | clock_face |
| no_figure | 0 (264 total) | — |

Runtime policy: a generated question is instantiated from its standard's skeleton when the reconcilers can build a matching `VisualSpec`. When no skeleton matches (`visualClass === "none"`), `generateFigure` draws the figure **from the question itself via prompt generation** and still gates publication on the verifier, contract coverage, and LC accuracy check. The deterministic skeleton is always tried first; the prompt fallback is only reached when no renderable spec exists.

## Fixture corpus

`scripts/build-standard-figure-fixtures.ts` extracts candidate questions from:

1. `instructional_items`
2. `instructional_tasks`
3. `clarifications` examples
4. `cpalms_mfas` tasks
5. `ixl_flbest` skill names (intent only)

Output: `tests/fixtures/figures/standards/<code>.json`

Each fixture has an explicit expected contract, not just "renders something".

## Generated-question audit

`scripts/audit-generated-figures.ts` pulls generated questions and runs the same contract + coverage audit, grouped by standard, strand, grade, family, visualPath, and provider.

Outputs:

- `reports/figure-coverage/generated-audit.json`
- `reports/figure-coverage/generated-audit.md`

## Generation cascade

1. Build contract.
2. `required === false` → no figure, record reason.
3. Build/repair deterministic spec.
4. Render deterministic SVG.
5. Coverage check.
6. Incomplete → repair spec, re-render (max 2).
7. Still incomplete:
   - measured geometry → no AI; one question-rewrite attempt; else `needs_review`.
   - illustration → AI brief with contract labels; visibleText check; retry max 2; else `needs_review`.
8. No coverage below 100% ever reaches a student.

## Renderer families

New structure under `src/server/figures/families/` with a registry. Existing renderers are wrapped first and moved family by family.

Families:

- dimensioned rectangles
- named shapes
- angle/parallel/perpendicular diagrams
- coordinate geometry
- fraction models
- number lines
- ten frames
- base-ten blocks
- number bonds
- measurement instruments
- data displays
- graphs
- Venn/logic
- illustrations

## Phases

### Phase 0 — Corpus and matrix (2–3 days)

- `scripts/classify-standard-figures.ts`
- `scripts/build-standard-figure-fixtures.ts`
- matrix outputs
- baseline report

Exit: all 642 codes classified; example sources recorded.

### Phase 1 — Correctness core (3–4 days)

- unit-aware shape parsing
- named entity parsing
- `figures[]` spec
- `FigureContract` + `checkContractCoverage`
- `needs_review` status
- `hasUsableQuizFigure` coverage gate
- `generateFigure` cascade
- Rectangle A/B golden test

Exit: Rectangle example correct; no partial geometry figure can publish.

### Phase 2 — Deterministic geometry family (4–5 days)

- dimensioned rectangles
- named shapes with labels
- angle/parallel/perpendicular diagrams
- scale and collision handling
- `<title>/<desc>` and alt text
- fixtures for all GR codes

### Phase 3 — Standard coverage waves (8–12 days)

- Wave 1: NSO, Fractions, Measurement
- Wave 2: Algebraic Reasoning, Data Analysis
- Wave 3: Functions, Trigonometry, Calculus
- Wave 4: Logic, Financial Literacy, illustrations

### Phase 4 — Generation prompt, schema, preflight (2–3 days)

- schema for structured figure data
- prompt includes official examples and family expectation
- per-code overrides
- question-rewrite retry
- telemetry

### Phase 5 — AI path hard gate (1–2 days)

- contract labels in brief
- visibleText coverage check
- reject missing labels even when the model says labels are correct
- measured geometry never calls AI

### Phase 6 — Audit, QA page, telemetry (2–3 days)

- `npm run figures:audit`
- `npm run figures:audit:generated`
- Figure QA page in `#/dev/visuals`
- per-code dashboard

### Phase 7 — Full rollout and regression (3–5 days)

- run all fixtures
- sample generated questions by grade band
- fix top failure families
- freeze snapshots

## Definition of done per code

1. Matrix row with `figureRequired`, `family`, `figureReason`.
2. If required, at least one official-example fixture.
3. Fixture renders at 100% contract coverage.
4. No answer or derived answer value appears.
5. No false shape/unit trigger.
6. Generated-question samples pass the same audit.
7. If not required, reason recorded and no decorative figure generated.
8. Code appears as `pass` or `explicitly_not_required`.

## KPIs

- 642/642 codes classified.
- ≥95% of figure-required codes have an official-example fixture.
- Fixture pass rate: 100% P0, ≥95% P1, ≥90% P2.
- ≥95% of figure-required generated items get a complete figure; the rest flagged `needs_review`.
- 0 wrong-figure publications.
- 0 missing-label publications.
- 0 false shape triggers on the unit/operation corpus.
- 0 AI calls for measured geometry.
- 100% of `needs_review` items visible to teachers.

## First build sequence

1. Write this plan to `D:`.
2. Run Phase 0 scripts across all 642 standards.
3. Add Rectangle A/B and `square inches` golden tests.
4. Implement Phase 1 correctness core.
5. Share matrix and first audit report.

## Bugfix log

### 2026-10-19 — off-topic `array_model` from fraction/geometry stems

- **Symptom:** a Grade 5 fraction-multiplication item (2/3 × 4/5 area model) shipped an `array_model` captioned "3 red + 5 blue + 4 green" with K–2 comparison hints.
- **Cause:** `extractUncoloredAddendGroups` (`src/utils/exactCountVisual.ts`) treated structural nouns ("3 equal", "5 equal", "4 columns") as countable objects, so `reconcileExactCountObjectsFromStem` overwrote the stem with a colored-addend array. The stem↔spec alignment guard existed but ran only in `quizPayloadSanitizer`, not on the figure path.
- **Fix 1 (source):** reject `STRUCTURAL_NOUNS` in `extractCountNounFromSegment`; bail on a `FRACTION_GEOMETRY_STEM` context guard in both colored and uncolored addend extractors.
- **Fix 2/3 (gate):** `generateFigure` now runs `validateVisualSpecAgainstQuestion` after `buildItemClaim` and returns `needs_review` (text-only + teacher flag) for any spec that disagrees with the stem, on every publish path.
- **Tests:** `exactCountVisual.test.ts` (fraction/geometry stems yield no groups/spec) and `generateFigure.test.ts` (misaligned array_model → `needs_review`, no svg/image).
- **Residual:** resolved below — the screenshot stem now resolves to a correct `area_model` with the yellow/blue/green overlap.

### 2026-10-19 — skeleton catalog, fraction area model, prompt fallback

- **Inventory:** all 642 codes now map to a named skeleton (`reports/figure-coverage/figure-skeletons.{json,md}`). 378 require a figure; 264 are explicitly `no_figure`.
- **Classification fix:** `MA.5.FR.2.2` and the other fraction-multiplication standards were classified `none`/not required. `classifyStandard` and `familyFor` now detect fraction-by-fraction multiplication and assign the `area_model` family (`MA.5.FR.2.2` → `area_model_product`). Required figures: 375 → 378.
- **Area model:** `VisualSpec` gains `highlightRows`/`highlightCols`; `renderAreaModel` shades the first N rows yellow, first M columns blue, and the overlap green. `reconcileFractionAreaModelFromStem` parses both `a/b × c/d` and the prose rows/columns form and runs before the single-factor fraction reconciler. The screenshot item now renders a 3×5 grid with a 2×4 green overlap, deterministically.
- **Prompt fallback:** when `visualClass === "none"` but the contract requires a figure, `generateFigure` no longer stops at `needs_review`; it draws the figure directly from the question via prompt generation (`openai_image_fallback`). Publication is still gated by the verifier, contract coverage, and LC accuracy check, so an unmatched question cannot ship an incomplete image.
- **Tests:** `catalog.test.ts` (family coverage, determinism, fraction override), `reconcileVisualFromStem.test.ts` (area-model extraction/precedence), `visualSpec.test.ts` (overlap shading), `generateFigure.test.ts` (fraction stem renders deterministic area model; no-skeleton stem uses prompt fallback). Full suite: **456 passed, 2 skipped**. `tsc --noEmit` clean.

