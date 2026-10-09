-- Expand AI quiz telemetry for adaptive sessions and provenance analytics.

alter table if exists public.ai_quiz_generations
  add column if not exists standard_purpose_and_strategies jsonb,
  add column if not exists standard_misconceptions jsonb,
  add column if not exists standard_tiered_instruction jsonb,
  add column if not exists adaptive_enabled boolean not null default false,
  add column if not exists adaptive_policy text,
  add column if not exists source_policy text,
  add column if not exists prompt_version text,
  add column if not exists session_metadata jsonb;

alter table if exists public.ai_quiz_questions
  add column if not exists source_type text not null default 'novel',
  add column if not exists generated_by_ai boolean not null default true,
  add column if not exists presented_difficulty text,
  add column if not exists generation_metadata jsonb;

alter table if exists public.ai_quiz_attempts
  add column if not exists adaptive_enabled boolean not null default false,
  add column if not exists adaptive_path jsonb,
  add column if not exists attempt_metadata jsonb;

create index if not exists ai_quiz_generations_adaptive_enabled_created_at_idx
  on public.ai_quiz_generations (adaptive_enabled, created_at desc);

create index if not exists ai_quiz_questions_source_type_idx
  on public.ai_quiz_questions (source_type);
