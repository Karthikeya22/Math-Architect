-- Add richer instructional context fields to standards for AI grounding.

alter table if exists public.standards
  add column if not exists clarifications jsonb,
  add column if not exists examples jsonb,
  add column if not exists purpose_and_strategies jsonb,
  add column if not exists misconceptions jsonb,
  add column if not exists tiered_instruction jsonb;

comment on column public.standards.clarifications is
  'Standard clarification statements used to constrain question generation.';
comment on column public.standards.examples is
  'Instructional examples or representative classroom tasks for the standard.';
comment on column public.standards.purpose_and_strategies is
  'Purpose and strategy guidance used for pedagogy-aware question scaffolding.';
comment on column public.standards.misconceptions is
  'Known misconceptions used to generate distractors and feedback.';
comment on column public.standards.tiered_instruction is
  'Tiered supports used to generate adaptive hint ladders.';
