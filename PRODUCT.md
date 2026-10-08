# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Florida classroom math teachers preparing or following up on practice (mid-prep or after class). Secondary audiences (instructional coaches, PLC leads) may use the same flow but are not the optimization target.

## Product Purpose

Florida B.E.S.T. Math Architect helps teachers pin a Florida B.E.S.T. math standard, generate an aligned quiz, diagnose learning gaps from results, and open short remedial slides, without leaving a single classroom workflow.

Success: a teacher can go from standard selection to usable practice and next-step remediation in one session, with visuals and copy that feel like one coherent product.

## Positioning

Standards-first assessment studio with a coherence map for browsing K–8 and 9–12 B.E.S.T. benchmarks, then AI-assisted quiz → gap analysis → remedial slides in one continuous path. Neighboring tools may offer item banks or graphs alone; this product owns the closed loop from pin → practice → diagnose → remediate.

## Operating Context

Authenticated web app (React + Vite + Express). Typical session: sign in or guest → Assessment studio (coherence filters + map + pin) → generate quiz → take quiz → gap analysis → remedial slides → return home. Teachers work under time pressure at a laptop or Chromebook; density and scanability matter more than marketing flourish.

## Capabilities and Constraints

- Confirmed flow order must remain: setup → quiz → analysis → remedial.
- Existing surfaces: Auth; Assessment studio / coherence atlas; Quiz taker; Gap analysis; Remedial slides; app shell; loading / error states; dev visual gallery (dev-only).
- Coherence map path URLs (`/coherence-map/...`), guest/register model, and AI generation behavior are not locked as immutable by the user for this redesign pass; workflow order is.
- Visual redesign goal: extend the existing studio design system across every screen (including small ones), not invent a separate marketing aesthetic for product screens.
- Open: whether coherence deep-links and auth UX get structural tweaks as part of visual work (allowed unless later constrained).

## Brand Commitments

- Product name: Florida B.E.S.T. Math Architect (short: Math Architect on narrow viewports).
- Voice: clear, teacher-facing, standards-aligned; no hype or gamification tone.
- Incumbent visual system to extend: pastel studio tokens in `src/index.css`, Fraunces + Manrope + JetBrains Mono, soft surfaces, restrained indigo accent family already in code. Redesign unifies outliers onto this system rather than replacing the brand wholesale.

## Evidence on Hand

- Live UI and CSS tokens in `src/index.css`, `src/App.tsx`, and screen components under `src/components/`.
- Standards / coherence data under `data/processed/` and graph JSON.
- No fabricated district testimonials, adoption stats, or pricing claims in product UI.

## Product Principles

1. Teacher-first speed: primary actions and status must be obvious under prep-time pressure.
2. One visual language from sign-in through remediation; no orphan Tailwind palettes mid-journey.
3. Standards and coherence stay discoverable without burying the Generate path.
4. Errors and loading stay in-product (inline / banners), not browser-native alerts where avoidable.
5. Accessibility is district-ready: WCAG AA as the bar for contrast, focus, labels, and keyboard use.

## Accessibility & Inclusion

WCAG 2.2 AA target for color contrast, visible focus, labeled controls, keyboard operability, and reduced-motion respect. Chosen for Florida classroom / district Chromebook contexts.
