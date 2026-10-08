# Studio UI redesign — Extend Studio across all screens

**Date:** 2026-10-08  
**Status:** Approved brief (awaiting implementation plan)  
**Product:** Florida B.E.S.T. Math Architect (`PRODUCT.md`)  
**Direction:** Extend incumbent studio system (pastel tokens, Manrope + Fraunces titles, indigo accent) to every surface. Not a marketing rebrand.

## 1. Goals

1. One visual language from Auth through Remedial slides (including loading, empty, error, disabled).
2. Teacher mid-prep scanability: primary actions and status obvious under time pressure.
3. WCAG 2.2 AA for contrast, focus, labels, keyboard, and `prefers-reduced-motion`.
4. Preserve workflow order: **setup → quiz → analysis → remedial**.

## 2. Non-goals

- Changing AI quiz / gap / slide generation logic or prompts.
- Inventing a new brand world (no cream+terracotta landing, no purple mesh marketing skin).
- Redesigning the unused legacy `StandardsGraph` / `ForceGraphTab` path (leave or soft-align later; not in Phase 1).
- Shipping a public redesign of `#/dev/visuals` beyond a thin studio chrome wrapper.

## 3. Visual system (source of truth)

### 3.1 Tokens (extend `src/index.css`)

Keep and document existing semantic CSS variables:

| Token role | Variables |
|------------|-----------|
| Surfaces | `--app-bg`, `--surface-bg`, `--surface-muted`, `--surface-soft` |
| Text | `--text-primary`, `--text-secondary` |
| Borders / elevation | `--border-soft`, `--border-strong`, `--shadow-soft`, `--shadow-card`, `--shadow-premium` |
| Accent | `--accent`, `--accent-soft`, `--accent-strong` |
| Semantics | `--success-soft`, `--warning-soft`, `--danger-soft` |
| Radius | `--radius-card` (~20px), `--radius-soft` (~14px); inputs/buttons ~12px |

**Rule:** Product screens use these tokens (or utility classes that map to them). Ban ad-hoc Tailwind palette stacks (`purple-50`, `blue-200`, `slate-600`, etc.) on Gap Analysis, Remedial Slides, Quiz adaptive banners, and Auth/app chrome.

Strand colors remain data-driven for **map nodes / connections only**. Filter chips default to monochrome studio chips; selected = `--text-primary` fill (same as grade/scope). Optional thin left border or map-only color swatch is allowed; filled rainbow default is retired.

### 3.2 Typography

| Role | Face | Notes |
|------|------|--------|
| UI / body / labels / data | Manrope | Fixed rem scale (~1.125–1.2 ratio); no fluid clamp on product chrome |
| Screen titles only | Fraunces | Auth H1, Studio H1, Quiz chapter moments, Analysis / Remedial titles — not buttons, chips, or table cells |
| Codes / mono | JetBrains Mono | Standard codes, tabular nums |

Minimum body text ~16px on mobile for primary reading; micro labels ≥12px (retire `text-[10px]` / `text-[11px]` where used for primary UI).

### 3.3 Components (shared vocabulary)

Reuse / harden existing classes; add only when missing:

- `app-btn-primary`, `app-btn-secondary`
- `app-input`, `app-card`, `app-card-soft`
- `studio-alert` (info / warning / danger variants via modifier)
- `coherence-atlas-chip` (+ `--active`) for filters
- `studio-hero` / `studio-kicker` / `studio-title` / `studio-lede` for page headers

**States required on interactive controls:** default, hover, focus-visible, active, disabled, loading (where async).

**Errors:** inline near fields or `studio-alert` banners. Replace `alert()` in `App.tsx` AI error path with in-app banner (and optional dismiss).

### 3.4 Motion

- Product transitions 150–250ms; transform/opacity only.
- Global reduce: CSS `@media (prefers-reduced-motion: reduce)` plus Motion `useReducedMotion()` (or equivalent) on Auth, App, Studio, Quiz entrances.
- No orchestrated “watch the page load” sequences beyond the existing loading step messaging.

### 3.5 Theme

Keep `data-theme="pastel"` as default for this redesign. Do not ship a theme switcher in Phase 1. Leave `neutral` tokens in CSS unused for now (future option documented only).

## 4. Screen contracts

### 4.1 Auth (`AuthScreen.tsx`)

- Preserve split layout (aside + card) at ≥960px; mobile = card with visible product name in card header or small brand row (fix current “name only on desktop aside” gap).
- Same button/input/alert vocabulary as app shell.
- Skip link retained.
- Copy: specific primary CTA (“Sign in” / “Create account”) preferred over generic “Continue” when trivial.

### 4.2 App shell (`App.tsx`)

- Sticky header with brand mark + short name, user chip, sign out (aria-labels kept).
- Add skip link to main content when authenticated.
- Telemetry notice uses `studio-alert` / warning tokens (already close).
- Loading view stays studio card + TypewriterLoading; gate motion under reduced-motion.

### 4.3 Assessment studio (`QuizGenerator`, `CoherenceMapControls`, `CoherenceMap`)

**Information order (first viewport intent):**

1. Short studio hero (kicker + title + one lede).
2. Map filters + pin standard (grade → strands muted → pin).
3. Coherence atlas map (pull earlier so it is not buried under a tall filter stack; compress filter header).
4. Primary generate action **after** pin readiness: sticky bottom bar or footer of filter panel once a standard is pinned; disable state must show short reason near the button.

**Filters:**

- Scope / grade: existing active chip pattern.
- Strands: monochrome chips; all-selected default may remain logically, but visually do not render seven saturated fills.
- Quiz options: keep disclosure; panel uses `coherence-atlas-panel` + option tiles (already aligned).

**Negative margins:** reduce or remove `-mx-*` fights with shell padding so edges align at breakpoints.

### 4.4 Quiz (`QuizTaker.tsx` + `quiz-*` CSS)

- Keep dedicated quiz layout (progress, options, walkthrough).
- Soften or document clay card as intentional **practice surface** variant of studio (same tokens, optional offset shadow).
- Adaptive / status banners: map to `--accent-soft` / `--warning-soft` / `--success-soft` — no `blue-50` Tailwind islands.
- Difficulty pills: token borders/text; bump tiny type to ≥12px.

### 4.5 Gap analysis (`GapAnalysis.tsx`)

- Full restyle onto studio tokens and `app-card` sections.
- Chapter title with Fraunces; section kickers with Manrope.
- Gap type cards: semantic soft backgrounds (conceptual / procedural / computational) using token mixes or a small set of CSS modifiers — not purple/orange/red Tailwind utilities.
- Primary CTA “Start remediation” = `app-btn-primary`.
- Practice links and diagnostics inherit the same card/alert language.

### 4.6 Remedial slides (`RemedialSlides.tsx`)

- Slide chrome, phase labels, and toolbars use studio tokens.
- Phase icons: one accent + semantic warning/success — not a rainbow Lucide color per phase.
- Export / PDF / PPTX / fullscreen: secondary buttons in a quieter toolbar (collapse overflow on mobile if needed).
- Preserve export functionality; visual only in this pass.

### 4.7 Small surfaces

| Surface | Contract |
|---------|----------|
| Empty pin / disabled Generate | Helper text adjacent to CTA; not only gray dead button |
| Standards load error | `studio-alert` |
| AI failure | In-app banner with recoverable copy (no env dump unless DEV) |
| Dev visual gallery | Optional thin header “Dev · Visual fixtures”; out of Phase 1 polish budget |

## 5. Architecture / implementation notes

- Prefer CSS class + token changes in `src/index.css` over new dependencies.
- Restyle Gap / Remedial by replacing utility color classes with studio classes; extract shared section header if duplication is high.
- Do not break `coherence-map` path sync behavior in this pass unless required for layout; functional routing is Phase B.
- Lucide remains the icon library (already in project); keep consistent stroke width (~1.75).

## 6. Accessibility checklist (must pass before calling Phase 1 done)

- [ ] Text/icon contrast AA on buttons, chips, alerts, strand map labels
- [ ] Visible `:focus-visible` on all interactive controls
- [ ] Icon-only buttons have `aria-label`
- [ ] Forms labeled (Auth already strong)
- [ ] Skip links: Auth + authenticated main
- [ ] `prefers-reduced-motion` honored for Motion + CSS transitions listed
- [ ] Touch targets ≥44px where primary actions sit on mobile

## 7. Verification

1. Manual browser pass: Auth → guest → studio (desktop + ~390px) → (optional) quiz if fixture available.
2. Visual check Gap + Remedial via temporary fixture or after one real generation (optional cost).
3. Run Impeccable detector on changed UI files once at finish:  
   `node <impeccable>/scripts/detect.mjs --json <changed targets>`
4. No requirement to fix pre-existing `npm run lint` VisualType errors in this UI pass unless touched files fail typecheck for new code.

## 8. Phased delivery (for the implementation plan)

| Phase | Deliverable |
|-------|-------------|
| P0 | Shared alerts + replace `alert()`; strand chip mute; studio layout order / sticky Generate |
| P1 | Gap Analysis token restyle; Quiz banner/microtype; shell skip link; Auth mobile brand |
| P2 | Remedial slides token restyle + quieter toolbar; reduced-motion pass; loading polish |
| P3 | Dev gallery chrome (optional); DOCUMENT.md / DESIGN.md extract from shipped CSS |

## 9. Open decisions (locked defaults)

| Question | Default |
|----------|---------|
| Clay quiz card | Keep as practice-surface variant with tokens |
| Theme switcher | Out of Phase 1 |
| Coherence URL / auth model changes | Out of Phase 1 (visual only) |
| Accessibility | WCAG AA |

## 10. References

- `PRODUCT.md` — product truth
- Audit conversation (2026-10-08) — Phase A visual findings
- Incumbent CSS: `src/index.css` (`app-*`, `auth-*`, `studio-*`, `coherence-atlas-*`, `quiz-*`)
