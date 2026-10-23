# Florida B.E.S.T. Math Architect

Hybrid AI provider architecture for quiz generation, gap analysis, and remedial slides.

## Run Locally

Prerequisites:
- Node.js 20+

Steps:
1. Install dependencies:
   - `npm install`
2. Configure environment in `.env` (git-ignored; never commit secrets):
   - `OPENAI_API_KEY=<your_key>` (required for the default OpenAI-first stack)
   - `GEMINI_API_KEY=<your_key>` (optional; Gemini tasks + LC Graphics Accuracy)
   - `LEARNING_COMMONS_API_KEY=<your_key>` (optional; Knowledge Graph + Math Standards Alignment)
   - `ANTHROPIC_API_KEY=<your_key>` (optional; LC’s validated default for Math Standards Alignment)
3. Start dev server:
   - `npm run dev`
4. Open:
   - `http://localhost:3000`

## Provider Configuration

Default stack is **OpenAI-first** (quiz, analysis, slides, figures). Gemini remains selectable per task via env.

Text/image routing goes through `/api/genai/generate-content`. Quiz and slide figures go through `/api/figures/question` and `/api/figures/slide` (director brief → gpt-image → vision check → one retry).

Environment switches:
- `AI_PROVIDER_QUIZ=openai|gemini` (default `openai`)
- `AI_PROVIDER_ANALYSIS=openai|gemini`
- `AI_PROVIDER_SLIDES=openai|gemini`
- `AI_PROVIDER_IMAGES=openai|gemini`
- `AI_PROVIDER_VISION=openai|gemini`
- `AI_PROVIDER_FIGURE_BRIEF=openai|gemini`
- `AI_FALLBACK_ENABLED=true|false` (default `false`; no silent cross-provider fallback)

OpenAI models (per-task overrides win; otherwise family defaults):
- `OPENAI_QUIZ_MODEL=gpt-5.4`
- `OPENAI_ANALYSIS_MODEL=gpt-5.4-mini`
- `OPENAI_SLIDES_MODEL=gpt-5.5`
- `OPENAI_VISION_MODEL=gpt-5.4-mini`
- `OPENAI_FIGURE_BRIEF_MODEL=gpt-5.4-mini`
- `OPENAI_TEXT_MODEL` — fallback for text tasks without a per-task override
- `OPENAI_IMAGE_MODEL=gpt-image-2`
- `OPENAI_IMAGE_SIZE=1024x1024|1536x1024|1024x1536|auto` (aspect ratio `16:9` maps to `1536x1024`)
- `OPENAI_IMAGE_QUALITY=low|medium|high|auto` (default `medium`)
- `OPENAI_IMAGE_FORMAT=jpeg|png|webp` (default `jpeg`)
- `OPENAI_IMAGE_COMPRESSION=0–100` (default `85` for non-png)
- `OPENAI_BASE_URL` — optional custom OpenAI-compatible base URL

Figure pipeline:
- `FIGURE_VERIFY=true|false` (default `true`; vision check after each render)
- `FIGURE_MAX_ATTEMPTS=2` (render + one retry with verifier feedback)
- `VITE_FIGURE_TIMEOUT_MS` — client abort for each `/api/figures/*` call (default `300000`)
- `VITE_FIGURE_CONCURRENCY` — parallel figure calls while a quiz/deck generates (default `6`, max `16`)

Gemini (optional):
- `GEMINI_TEXT_MODEL=gemini-3-flash-preview`
- `GEMINI_IMAGE_MODEL=gemini-2.5-flash-image`

Behavior:
- Task provider is chosen from the env switches above.
- Quiz/slide JSON that fails schema is repaired when possible (slides) or retried once with stricter instructions.
- Cross-provider fallback only runs when `AI_FALLBACK_ENABLED=true`.

## Figure verification

Each question/slide figure is produced server-side:
1. A short illustration brief (`figure_brief`) lists what must / must not appear.
2. `gpt-image` renders a landscape figure from that brief (not from a pasted stem).
3. A vision model checks counts, labels, relationships, and answer leaks.
4. Optionally, Learning Commons Graphics Accuracy runs as a second raster check (see below).
5. On failure, one retry uses the verifier’s issues; on a second failure the client falls back to a deterministic SVG when available, otherwise shows no figure.

## Learning Commons (complement, not replace)

Open LC pieces reinforce Math Architect; they do **not** replace the Florida teacher loop or local B.E.S.T. corpus.

| Piece | Role |
| --- | --- |
| Knowledge Graph enrichment | `npm run lc:enrich` → `data/processed/` + `src/data/lc_math_learning_components.json` joined onto `MA.*` |
| Math Standards Alignment | Post-quiz gate (`aligned_count / total` learning components) |
| Graphics Accuracy | Second opinion after `FIGURE_VERIFY` for AI rasters |
| Agent Skills packs | Condensed CFU / differentiation constraints in quiz + remedial prompts |

Env flags:
- `LC_EVAL_MODE=off|shadow|fail` (default `shadow` — log only, never drop items)
- `LC_ALIGN_MIN_RATIO=0.5` (used only when `fail`)
- `LC_GRAPHICS_ENABLED=true|false` (default `true` when mode is not `off`)
- `LC_ALIGN_PROVIDER=anthropic|openai|gemini` (optional force; default prefers Anthropic → OpenAI → Gemini)
- `LC_ALIGN_MODEL=<model id>` (optional; used with OpenAI/Gemini override)

Math Standards Alignment LLM keys (need **one** of these besides the LC Platform key):
- Anthropic (validated default), or
- `OPENAI_API_KEY` via `modelOverride`, or
- `GEMINI_API_KEY` / `GOOGLE_API_KEY` via `modelOverride`  
Non-default providers may be less accurate per LC docs. Graphics Accuracy already uses Gemini/Google.

Setup:
1. Create a free Platform API key: https://docs.learningcommons.org/platform/using-the-platform/api-keys
2. Put `LEARNING_COMMONS_API_KEY` in `.env` plus OpenAI and/or Gemini (Anthropic optional)
3. `npm run lc:enrich` (optional `--limit=20` while testing)
4. `npm run lc:smoke` for a shadow alignment check

## Pipeline smoke

With `npm run dev` running and keys in `.env`:
- `npx tsx scripts/verify_openai_pipeline.ts after` — preflight + figure contact sheet under `smoke-output/after/`
- `RUN_IMAGE_SMOKE=1 SMOKE_OUT_DIR=after npx vitest run src/integration/gradeQuizImages.smoke.test.ts --testTimeout=600000`
- `RUN_SLIDES_SMOKE=1 SMOKE_OUT_DIR=after npx vitest run src/integration/remedialSlides.smoke.test.ts --testTimeout=900000`

## A/B Evaluation

Run benchmark comparison across providers:
- `npm run ab:evaluate`

Output report:
- `reports/ab-eval-latest.json`

The report includes:
- pass/fail by case/provider,
- schema compliance,
- visual relevance checks (quiz),
- average latency summary.

## Verification

- Type/build checks: `npm run lint`
- Build production bundle: `npm run build`
- Start production server: `npm run start`
