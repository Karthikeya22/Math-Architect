# Florida B.E.S.T. Math Architect

Hybrid AI provider architecture for quiz generation, gap analysis, and remedial slides.

## Run Locally

Prerequisites:
- Node.js 20+

Steps:
1. Install dependencies:
   - `npm install`
2. Configure environment in `.env`:
   - `GEMINI_API_KEY=<your_key>`
   - `OPENAI_API_KEY=<your_key>` (optional unless using OpenAI provider)
3. Start dev server:
   - `npm run dev`
4. Open:
   - `http://localhost:3000`

## Provider Configuration

The backend endpoint `/api/genai/generate-content` routes requests per task.

Environment switches:
- `AI_PROVIDER_QUIZ=gemini|openai`
- `AI_PROVIDER_ANALYSIS=gemini|openai`
- `AI_PROVIDER_SLIDES=gemini|openai`
- `AI_PROVIDER_IMAGES=gemini|openai`
- `AI_FALLBACK_ENABLED=true|false`

Model defaults:
- `GEMINI_TEXT_MODEL=gemini-3-flash-preview`
- `GEMINI_IMAGE_MODEL=gemini-2.5-flash-image`
- `OPENAI_TEXT_MODEL=gpt-4o-mini`
- `OPENAI_IMAGE_MODEL=gpt-image-1`

Behavior:
- Task provider is chosen from env vars above.
- If validation fails (JSON/schema/visual relevance), the backend retries once with stricter instructions.
- If still invalid and fallback is enabled, it retries on the alternate provider.

## Visual Relevance Guardrails

Question visuals are validated server-side:
- `imagePrompt` requires `visualIntent`.
- Prompt must contain concrete question entities (numbers/objects/units).
- Generic/off-topic prompts are rejected and regenerated.

Slide visuals are validated for instructional alignment:
- Prompt must align to slide title/content/vocabulary.

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
