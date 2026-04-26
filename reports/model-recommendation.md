# Cost-First Provider Recommendation

Generated from:
- `reports/benchmark-matrix.json`
- `reports/ab-eval-gemini.json`
- `reports/ab-eval-openai.json`
- `reports/ab-eval-comparison.json`

## Executive Summary

- Cost-first selection with quality gates chooses **Gemini** for all text tasks in the current environment.
- OpenAI benchmark runs failed at runtime because `OPENAI_API_KEY` resolves as empty in `.env`.
- Winner config has been applied as all-Gemini with fallback disabled to prevent cross-provider failures.

## Gate Results

### Gemini
- Total cases: 7
- Passes: 6
- Pass rate: 85.7%
- Schema pass rate: 85.7%
- Avg latency: 7046 ms
- Total estimated cost from usage telemetry: 0 (usage not returned in current Gemini response payload)

### OpenAI
- Total cases: 7
- Passes: 0
- Pass rate: 0%
- Failure reason: `OPENAI_API_KEY is not configured.` for all cases
- Avg latency: 48 ms (failed fast)

## Winner By Task

| Task | Winner | Model | Reason |
|---|---|---|---|
| quiz | gemini | gemini-3-flash-preview | Only provider passing quality/schema gates |
| analysis | gemini | gemini-3-flash-preview | Only provider passing quality/schema gates |
| slides | gemini | gemini-3-flash-preview | Only provider passing quality/schema gates |
| image | none (provisional) | n/a | No passing provider in isolated benchmark; OpenAI unavailable and evaluator expects JSON gates not ideal for raw image checks |

## Applied Runtime Configuration

Current selected settings in `.env`:
- `AI_PROVIDER_QUIZ=gemini`
- `AI_PROVIDER_ANALYSIS=gemini`
- `AI_PROVIDER_SLIDES=gemini`
- `AI_PROVIDER_IMAGES=gemini`
- `AI_FALLBACK_ENABLED=false`

## End-to-End Verification

Validated app flow in browser:
- Quiz generation: PASS
- Quiz completion to analysis: PASS
- Analysis rendering: PASS
- Remediation entry logic: PASS (button disabled when no gaps identified)

## Rollout Guidance

1. Keep all-Gemini in production until OpenAI key configuration is fixed and validated.
2. After key fix, rerun:
   - `npm run ab:evaluate -- --provider=gemini --suffix=gemini`
   - `npm run ab:evaluate -- --provider=openai --suffix=openai`
3. Recompute winners with cost-first rule and re-enable fallback only after both providers pass baseline gates.
4. For image benchmarking, use an image-specific quality check (binary image returned + human relevance check), not JSON schema gating.
