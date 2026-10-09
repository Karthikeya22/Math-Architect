# Quiz polish & professional typography — design

**Approved:** 2026-10-08 (verbal)

## Problem

1. Quiz stems/options sometimes show broken fraction math (`[/]`, empty `\frac{}{}`, incomplete braces).
2. Questions with failed/empty figure payloads can still feel broken when nothing useful renders.
3. Site type (especially quiz stems and loading) used Fraunces/Manrope and read less professional for classroom use.

## Decisions

- **Math:** Harden `normalizeQuizMathCopy` + KaTeX fallback via `toPlainMathText`; do not rewrite all generation prompts in this pass.
- **Figures:** Hide the figure aside entirely when there is no usable image/SVG (no empty chrome, no “unavailable” panel).
- **Type:** Clean editorial — Source Sans 3 for UI/questions/loading; Source Serif 4 only for brand/hero headlines.

## Non-goals

- Image retry/fallback pipeline
- Full visual redesign or spacing overhaul
- Dark-mode font variants

## Surfaces

| Area | Behavior |
|------|----------|
| Stems / options / hints | Normalized math → KaTeX; junk fractions become `\square` or plain `a/b` |
| Quiz figure aside | Shown only for usable `data:image/…` or real `<svg` markup |
| Loading typewriter | `--font-sans` |
| Quiz stem | `--font-sans` |
| Auth/studio/page titles | `--font-display` (Source Serif 4) |
