-- Backfill from legacy ai_quiz_* tables into current-schema tables.
-- Idempotent by natural uniqueness and explicit old-id metadata checks.

-- 1) sessions
insert into public.quiz_sessions (
  id,
  created_at,
  user_id,
  standard_code,
  strand_code,
  grade_token,
  standard_grade_label,
  standard_description,
  standard_clarifications,
  standard_examples,
  standard_purpose_and_strategies,
  standard_misconceptions,
  standard_tiered_instruction,
  quiz_config,
  provider_metadata,
  session_metadata,
  adaptive_enabled,
  adaptive_policy,
  source_policy,
  prompt_version
)
select
  g.id,
  g.created_at,
  g.user_id,
  g.standard_code,
  g.strand_code,
  g.grade_token,
  g.standard_grade_label,
  g.standard_description,
  g.standard_clarifications,
  g.standard_examples,
  g.standard_purpose_and_strategies,
  g.standard_misconceptions,
  g.standard_tiered_instruction,
  g.quiz_config,
  g.provider_metadata,
  coalesce(g.session_metadata, '{}'::jsonb) || jsonb_build_object('legacy_generation_id', g.id::text),
  coalesce(g.adaptive_enabled, false),
  g.adaptive_policy,
  g.source_policy,
  g.prompt_version
from public.ai_quiz_generations g
on conflict (id) do update
set
  user_id = excluded.user_id,
  standard_code = excluded.standard_code,
  strand_code = excluded.strand_code,
  grade_token = excluded.grade_token,
  standard_grade_label = excluded.standard_grade_label,
  standard_description = excluded.standard_description,
  standard_clarifications = excluded.standard_clarifications,
  standard_examples = excluded.standard_examples,
  standard_purpose_and_strategies = excluded.standard_purpose_and_strategies,
  standard_misconceptions = excluded.standard_misconceptions,
  standard_tiered_instruction = excluded.standard_tiered_instruction,
  quiz_config = excluded.quiz_config,
  provider_metadata = excluded.provider_metadata,
  session_metadata = excluded.session_metadata,
  adaptive_enabled = excluded.adaptive_enabled,
  adaptive_policy = excluded.adaptive_policy,
  source_policy = excluded.source_policy,
  prompt_version = excluded.prompt_version;

-- 2) questions
insert into public.questions (
  id,
  session_id,
  question_index,
  question,
  source_type,
  generated_by_ai,
  presented_difficulty,
  generation_metadata
)
select
  q.id,
  q.generation_id,
  q.question_index,
  q.question,
  coalesce(q.source_type, 'novel'),
  coalesce(q.generated_by_ai, true),
  q.presented_difficulty,
  coalesce(q.generation_metadata, '{}'::jsonb) || jsonb_build_object('legacy_question_id', q.id::text)
from public.ai_quiz_questions q
join public.quiz_sessions s on s.id = q.generation_id
on conflict (id) do update
set
  session_id = excluded.session_id,
  question_index = excluded.question_index,
  question = excluded.question,
  source_type = excluded.source_type,
  generated_by_ai = excluded.generated_by_ai,
  presented_difficulty = excluded.presented_difficulty,
  generation_metadata = excluded.generation_metadata;

-- 3) attempts
insert into public.question_attempts (
  id,
  session_id,
  completed_at,
  results,
  score,
  total,
  adaptive_enabled,
  adaptive_path,
  attempt_metadata
)
select
  a.id,
  a.generation_id,
  a.completed_at,
  a.results,
  a.score,
  a.total,
  coalesce(a.adaptive_enabled, false),
  a.adaptive_path,
  coalesce(a.attempt_metadata, '{}'::jsonb) || jsonb_build_object('legacy_attempt_id', a.id::text)
from public.ai_quiz_attempts a
join public.quiz_sessions s on s.id = a.generation_id
on conflict (id) do update
set
  session_id = excluded.session_id,
  completed_at = excluded.completed_at,
  results = excluded.results,
  score = excluded.score,
  total = excluded.total,
  adaptive_enabled = excluded.adaptive_enabled,
  adaptive_path = excluded.adaptive_path,
  attempt_metadata = excluded.attempt_metadata;
