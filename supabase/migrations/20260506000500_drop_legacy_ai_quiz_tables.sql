-- Drop legacy ai_quiz_* tables now that runtime writes use:
--   quiz_sessions, questions, question_attempts
--
-- Safety notes:
-- - Drops are guarded with IF EXISTS.
-- - Child tables are dropped before parent table.
-- - We avoid CASCADE to prevent accidentally removing unrelated objects.

drop table if exists public.ai_quiz_attempts;
drop table if exists public.ai_quiz_questions;
drop table if exists public.ai_quiz_generations;
