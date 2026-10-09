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
   - `GEMINI_API_KEY=<your_key>` (optional; only if you switch a task to Gemini)
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
4. On failure, one retry uses the verifier’s issues; on a second failure the client falls back to a deterministic SVG when available, otherwise shows no figure.

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
