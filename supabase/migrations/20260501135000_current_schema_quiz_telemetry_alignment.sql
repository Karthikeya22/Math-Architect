-- Align current product schema tables with adaptive/provenance telemetry.
-- This migration is additive and safe to run multiple times.

create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id text,
  standard_code text not null,
  strand_code text,
  grade_token text,
  standard_grade_label text not null,
  standard_description text not null,
  standard_clarifications jsonb,
  standard_examples jsonb,
  standard_purpose_and_strategies jsonb,
  standard_misconceptions jsonb,
  standard_tiered_instruction jsonb,
  quiz_config jsonb not null,
  provider_metadata jsonb,
  session_metadata jsonb,
  adaptive_enabled boolean not null default false,
  adaptive_policy text,
  source_policy text,
  prompt_version text
);

alter table if exists public.quiz_sessions
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists user_id text,
  add column if not exists standard_code text,
  add column if not exists strand_code text,
  add column if not exists grade_token text,
  add column if not exists standard_grade_label text,
  add column if not exists standard_description text,
  add column if not exists standard_clarifications jsonb,
  add column if not exists standard_examples jsonb,
  add column if not exists standard_purpose_and_strategies jsonb,
  add column if not exists standard_misconceptions jsonb,
  add column if not exists standard_tiered_instruction jsonb,
  add column if not exists quiz_config jsonb,
  add column if not exists provider_metadata jsonb,
  add column if not exists session_metadata jsonb,
  add column if not exists adaptive_enabled boolean not null default false,
  add column if not exists adaptive_policy text,
  add column if not exists source_policy text,
  add column if not exists prompt_version text;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  question_index int not null,
  question jsonb not null,
  source_type text not null default 'novel',
  generated_by_ai boolean not null default true,
  presented_difficulty text,
  generation_metadata jsonb,
  constraint questions_session_index_unique unique (session_id, question_index)
);

alter table if exists public.questions
  add column if not exists session_id uuid,
  add column if not exists question_index int,
  add column if not exists question jsonb,
  add column if not exists source_type text not null default 'novel',
  add column if not exists generated_by_ai boolean not null default true,
  add column if not exists presented_difficulty text,
  add column if not exists generation_metadata jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'questions'
      and column_name = 'session_id'
  ) then
    alter table public.questions
      alter column session_id set not null;
  end if;
exception
  when others then
    null;
end $$;

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  completed_at timestamptz not null default now(),
  results jsonb not null,
  score int not null,
  total int not null,
  adaptive_enabled boolean not null default false,
  adaptive_path jsonb,
  attempt_metadata jsonb
);

alter table if exists public.question_attempts
  add column if not exists session_id uuid,
  add column if not exists completed_at timestamptz not null default now(),
  add column if not exists results jsonb,
  add column if not exists score int,
  add column if not exists total int,
  add column if not exists adaptive_enabled boolean not null default false,
  add column if not exists adaptive_path jsonb,
  add column if not exists attempt_metadata jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'question_attempts'
      and column_name = 'session_id'
  ) then
    alter table public.question_attempts
      alter column session_id set not null;
  end if;
exception
  when others then
    null;
end $$;

create index if not exists quiz_sessions_standard_code_created_at_idx
  on public.quiz_sessions (standard_code, created_at desc);
create index if not exists quiz_sessions_user_id_created_at_idx
  on public.quiz_sessions (user_id, created_at desc);
create index if not exists quiz_sessions_adaptive_enabled_created_at_idx
  on public.quiz_sessions (adaptive_enabled, created_at desc);
create index if not exists questions_session_id_idx
  on public.questions (session_id);
create index if not exists questions_source_type_idx
  on public.questions (source_type);
create index if not exists question_attempts_session_id_idx
  on public.question_attempts (session_id);

comment on table public.quiz_sessions is
  'Session/header table for generated quizzes in current schema (cutover target).';
comment on table public.questions is
  'Per-question content rows linked to quiz_sessions.';
comment on table public.question_attempts is
  'Attempt/result rows linked to quiz_sessions.';

comment on column public.quiz_sessions.standard_clarifications is
  'Standard clarifications snapshot at quiz creation time.';
comment on column public.quiz_sessions.standard_purpose_and_strategies is
  'Pedagogical purpose/strategy hints used for generation.';
comment on column public.quiz_sessions.standard_misconceptions is
  'Known misconceptions used for distractors and feedback.';
comment on column public.quiz_sessions.standard_tiered_instruction is
  'Tiered support hints used for adaptive scaffolding.';
comment on column public.quiz_sessions.session_metadata is
  'Runtime telemetry at session scope (feature flags, timing, source policy details).';
comment on column public.questions.generation_metadata is
  'Question-level generation telemetry (prompt version, source policy, provider info).';
comment on column public.question_attempts.adaptive_path is
  'Difficulty transition path with reason codes over the attempt lifecycle.';
