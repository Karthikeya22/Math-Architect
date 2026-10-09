-- Persist AI-generated quizzes (metadata + per-question JSON) and optional attempt results

create table if not exists public.ai_quiz_generations (
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
  quiz_config jsonb not null,
  provider_metadata jsonb
);

create index if not exists ai_quiz_generations_standard_code_created_at_idx
  on public.ai_quiz_generations (standard_code, created_at desc);

create index if not exists ai_quiz_generations_strand_code_idx
  on public.ai_quiz_generations (strand_code);

create index if not exists ai_quiz_generations_user_id_created_at_idx
  on public.ai_quiz_generations (user_id, created_at desc);

create table if not exists public.ai_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.ai_quiz_generations (id) on delete cascade,
  question_index int not null,
  question jsonb not null,
  constraint ai_quiz_questions_generation_index_unique unique (generation_id, question_index)
);

create index if not exists ai_quiz_questions_generation_id_idx
  on public.ai_quiz_questions (generation_id);

create table if not exists public.ai_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.ai_quiz_generations (id) on delete cascade,
  completed_at timestamptz not null default now(),
  results jsonb not null,
  score int not null,
  total int not null
);

create index if not exists ai_quiz_attempts_generation_id_idx
  on public.ai_quiz_attempts (generation_id);

comment on table public.ai_quiz_generations is 'Header row for one AI-generated quiz; standard fields are snapshots at generation time.';
comment on table public.ai_quiz_questions is 'One row per generated question; question JSON omits large base64 image payloads by default.';
comment on table public.ai_quiz_attempts is 'Student responses for a logged generation (optional, one or more attempts per generation allowed).';
