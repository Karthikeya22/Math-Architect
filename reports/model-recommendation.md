# OpenAI-First Model Recommendation

Updated after the verified-figures / remedial-slides cutover (2026-10-08).

Earlier A/B runs in this folder that reported “OpenAI unavailable” are obsolete: the API key is valid, and the default stack is OpenAI for every task.

## Executive summary

| Task | Provider | Model | Notes |
|---|---|---|---|
| quiz | openai | `gpt-5.4` | Strict JSON quiz payloads |
| analysis | openai | `gpt-5.4-mini` | Gap analysis |
| slides | openai | `gpt-5.5` | Six-slide remedial blueprint + talking points |
| figure brief | openai | `gpt-5.4-mini` | Illustration director |
| vision | openai | `gpt-5.4-mini` | Figure verifier (sees the image) |
| image | openai | `gpt-image-2` | Landscape figures (`1536x1024` for 16:9) |

`AI_FALLBACK_ENABLED=false`. Gemini remains in the repo as an env-selectable alternate, not the default.

## Evidence (run 2)

Preflight (`scripts/verify_openai_pipeline.ts after-run2`):
- `GET /v1/models` → 137 models, including gpt-5.4 / gpt-5.5 / gpt-image-2
- Tiny completion on `gpt-5.4-mini` → ok (~1.4s)
- Low-quality `gpt-image-2` render → ok (~8s)

Figure samples (brief → image → vision, one retry):
- **4/6 verified** including exact-count stars and the ladder geometry item
- 2 rejected (place-value blocks, number-line tick precision) — client path falls back to SVG or no figure
- Rough cost for the sample set ≈ **$0.38** (planning estimate, not billing)

Quiz image smoke (`SMOKE_OUT_DIR=after-run2-quiz`):
- K, G3, G5, HS geometry: **7 verified**, **1 skipped** (place-value item where any faithful figure would leak the answer)

Remedial slides smoke + browser E2E on `MA.4.FR.2.1`:
- Six-slide blueprint with gap labels and teacher talking points
- Slide figures verified in parallel; failed figures become text-led layouts (no spinner)
- PDF/PPTX export buttons present; PPTX includes AI images and speaker notes

## Applied runtime configuration

Representative `.env` settings (do not commit `.env`):
- `AI_PROVIDER_*=openai`
- `AI_FALLBACK_ENABLED=false`
- `OPENAI_QUIZ_MODEL=gpt-5.4`
- `OPENAI_SLIDES_MODEL=gpt-5.5`
- `OPENAI_ANALYSIS_MODEL` / vision / figure_brief → `gpt-5.4-mini`
- `OPENAI_IMAGE_MODEL=gpt-image-2`
- `OPENAI_IMAGE_QUALITY=medium`
- `FIGURE_VERIFY=true`

## Decision gate

Exact-count and geometry items verified at an acceptable rate in run 2. **Do not** restore SVG-first for those types unless a later run shows a sustained low pass rate; ask before changing the policy.

## Rollout guidance

1. Keep OpenAI-first in local/prod until a deliberate provider A/B says otherwise.
2. Re-run `npx tsx scripts/verify_openai_pipeline.ts` after model or prompt changes.
3. Only set `AI_FALLBACK_ENABLED=true` after both providers pass the same gates.
