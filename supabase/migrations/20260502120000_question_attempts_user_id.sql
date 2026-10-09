-- Optional first-class user id on attempts (API also stores userId in attempt_metadata).
alter table if exists public.question_attempts
  add column if not exists user_id text;

create index if not exists question_attempts_user_id_idx
  on public.question_attempts (user_id);
