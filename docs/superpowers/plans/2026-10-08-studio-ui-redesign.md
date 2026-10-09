# Studio UI Redesign Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put every product screen (Auth, shell, Assessment studio, Quiz, Gap analysis, Remedial slides, and their small states) on one studio design system with WCAG AA behavior.

**Spec:** `docs/superpowers/specs/2026-10-08-studio-ui-redesign-design.md`

**Architecture:** Tokens and shared component classes live in `src/index.css`. Components swap raw Tailwind palette utilities (`text-slate-500`, `bg-purple-50`, ...) for studio classes and CSS variables. No new dependencies. AI/quiz logic untouched.

**Tech stack:** React 19, Vite, Tailwind v4 (`@tailwindcss/vite`), `motion/react`, lucide-react, Vitest.

**Hard constraint:** `RemedialSlides` `SlideLayout` is rasterized by `html2canvas@1.4.1` for PDF export. Slide styles must resolve to plain hex colors: no `color-mix()`, no `oklch`, no Tailwind default palette classes (Tailwind v4 defaults are oklch; only the hex overrides in `@theme` are safe).

---

## File map

| File | Responsibility | Change |
|------|----------------|--------|
| `src/index.css` | Tokens, shared classes, per-screen classes | Modify: semantic tokens, alert variants, badges, links, gap/slide/practice classes, reduced motion, selection/scrollbar, skip link, remove kicker styles |
| `src/App.tsx` | Shell, view switch, AI errors | Modify: skip link, `<main id>`, in-app error banner replaces `alert()`, reduced-motion on transitions, dev screens route |
| `src/components/AuthScreen.tsx` | Sign in / register / guest | Modify: mobile brand row, drop kicker, specific CTA labels, reduced motion |
| `src/components/QuizGenerator.tsx` | Studio page | Modify: drop kicker, sticky action bar (pin status + options + generate), remove negative margins |
| `src/components/CoherenceMapControls.tsx` | Filters | Modify: monochrome strand chips with swatch, remove header CTA/eyebrow |
| `src/components/StandardDropdown.tsx` | Pin picker | Modify: token menu + tooltip, keyboard-friendly options |
| `src/components/CoherenceMap.tsx` | Map | Modify: overlay scrim token |
| `src/components/QuizTaker.tsx` | Quiz | Modify: difficulty pills, adaptive note, microtype, figure toggle |
| `src/components/GapAnalysis.tsx` | Analysis | Rewrite markup onto studio classes |
| `src/components/StandardPracticeLinks.tsx` | Practice links | Modify: tokens |
| `src/components/RemedialSlides.tsx` | Slides + export | Modify: hex-safe slide classes, quieter toolbar, nav buttons |
| `src/dev/ScreensGalleryRoute.tsx` | Dev-only fixtures for Gap + Remedial | Create (DEV only, `#/dev/screens`) |

---

### Task 1: Foundation tokens and shared classes

**Files:** `src/index.css`

- [ ] Add semantic hex tokens to `@theme`: `--success-text #166534`, `--success-border #86efac`, `--warning-text #92400e`, `--warning-border #fcd34d`, `--danger-text #9f1239`, `--danger-border #fda4af`, `--info-soft #eef2ff`, `--info-text #3730a3`, `--info-border #c7d2fe`, `--accent-hover`.
- [ ] Add `.studio-alert--info|--warning|--danger|--success` modifiers; base stays warning for back-compat.
- [ ] Add `.app-badge` (+ `--accent|--success|--warning|--danger|--muted`), `.app-link`, `.app-section-head`, `.app-skip-link`.
- [ ] Theme browser surfaces: `::selection`, `caret-color`, scrollbar colors.
- [ ] Global `@media (prefers-reduced-motion: reduce)` collapsing transitions/animations.
- [ ] Remove `.studio-kicker`, `.auth-kicker` rules once markup no longer uses them.
- [ ] Verify: `npx vite build --mode development` compiles CSS.

### Task 2: App shell and errors

**Files:** `src/App.tsx`

- [ ] Add skip link + `<main id="main-content" tabIndex={-1}>`.
- [ ] Replace `alert(message)` in `handleApiError` with `appError` state rendered as `studio-alert studio-alert--danger` with Dismiss; env-tuning details only when `import.meta.env.DEV`.
- [ ] Gate view transitions with `useReducedMotion()`.
- [ ] Add DEV-only `#/dev/screens` lazy route.

### Task 3: Auth

**Files:** `src/components/AuthScreen.tsx`, `src/index.css`

- [ ] Mobile brand row inside card (hidden ≥960px where aside shows it).
- [ ] Remove kicker; CTA labels "Sign in" / "Create account".
- [ ] `useReducedMotion()` on card entrance.

### Task 4: Assessment studio

**Files:** `QuizGenerator.tsx`, `CoherenceMapControls.tsx`, `StandardDropdown.tsx`, `CoherenceMap.tsx`, `src/index.css`

- [ ] Remove kicker and the panel eyebrow; panel header becomes plain heading "Filters".
- [ ] Strand chips: neutral chip + 8px color swatch dot; active = studio active chip.
- [ ] Move Quiz options + Generate out of the filter header into `.studio-actionbar` (sticky bottom, inside studio column): left = pin status (code + short description or reason Generate is disabled), right = Quiz options toggle + Generate.
- [ ] Drop `-mx-* -my-5` negative margins on studio root.
- [ ] Dropdown: token menu (`.studio-menu`), tooltip uses `--text-primary` surface; options are `<button>` for keyboard.
- [ ] Map overlay scrim uses token.

### Task 5: Quiz

**Files:** `QuizTaker.tsx`, `src/index.css`

- [ ] `getDiffColor` returns `quiz-difficulty-pill--easy|medium|hard` classes defined with tokens.
- [ ] Adaptive note uses `studio-alert studio-alert--info`.
- [ ] Replace `text-[10px]`/`text-[11px]` and slate utilities with token classes (≥12px).
- [ ] Correct/incorrect icons use `--success-text` / `--danger-text`.

### Task 6: Gap analysis

**Files:** `GapAnalysis.tsx`, `StandardPracticeLinks.tsx`, `src/index.css`

- [ ] Left-aligned header (title + standard code badge), no centered hero.
- [ ] Summary row: reliability block (number + label + description, no ring gauge) beside performance summary.
- [ ] Journey, evidence, actions, skills, gaps use `app-card` + `.app-section-head`; badges via `.app-badge`.
- [ ] Gap type cards: `.gap-card--conceptual|procedural|computational` soft tints from tokens, no colored left border.
- [ ] Skill rows: score number + slim bar without heavy track.
- [ ] Remediation CTA: `app-btn-primary`, sticky-free, with disabled reason when no gaps.
- [ ] Practice links: `.app-link`, token select, token copy.

### Task 7: Remedial slides

**Files:** `RemedialSlides.tsx`, `src/index.css`

- [ ] `SlideLayout` uses `.slide-*` classes with hex-only values.
- [ ] Phase icons single accent color; phase label + step count in header.
- [ ] Toolbar: Home + Export group (PPTX, PDF) + fullscreen with `aria-label`; uiMessage via `studio-alert`.
- [ ] Prev/next as labeled circular buttons; "Start over" as `app-btn-secondary`.
- [ ] Verify PDF export still renders (manual, via dev screens route).

### Task 8: Dev screens route

**Files:** `src/dev/ScreensGalleryRoute.tsx`, `src/App.tsx`

- [ ] Fixture `GapAnalysis` + `RemedialSlides` data rendered under DEV-only `#/dev/screens`.

### Task 9: Verify

- [ ] `npx tsc --noEmit` shows no new errors in touched files (pre-existing VisualType errors excluded).
- [ ] `npm test` passes as before.
- [ ] Browser: Auth, studio, dev screens at 1440 and 390 widths.
- [ ] Impeccable detector once over changed files; fix mechanical findings.
- [ ] Commit.
