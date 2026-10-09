-- App-facing users (not auth.users): stable user_key used in quiz_sessions.user_id, gap_analyses.user_id, etc.

create sequence if not exists public.app_guest_number_seq as int minvalue 1;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  user_key text not null unique,
  username text not null unique,
  full_name text not null default '',
  is_guest boolean not null default false,
  guest_number int unique,
  created_at timestamptz not null default now()
);

create index if not exists app_users_is_guest_idx on public.app_users (is_guest);

comment on table public.app_users is 'Application users and guests; user_key is written to quiz_sessions.user_id and related telemetry.';

-- Atomic guest creation (avoids duplicate guest_number under concurrency).
create or replace function public.create_guest_app_user()
returns table (
  id uuid,
  user_key text,
  guest_number int,
  username text,
  full_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
  uk text;
begin
  n := nextval('public.app_guest_number_seq')::int;
  uk := 'guest_' || lpad(n::text, 6, '0');
  return query
  insert into public.app_users (user_key, username, full_name, is_guest, guest_number)
  values (uk, uk, 'Guest #' || n::text, true, n)
  returning app_users.id, app_users.user_key, app_users.guest_number, app_users.username, app_users.full_name;
end;
$$;

comment on function public.create_guest_app_user() is 'Creates one guest row; returns id and user_key for the client session.';

grant execute on function public.create_guest_app_user() to service_role;
grant execute on function public.create_guest_app_user() to anon;
grant execute on function public.create_guest_app_user() to authenticated;

-- Remedial slides JSON persisted after gap analysis exists.
alter table if exists public.gap_analyses
  add column if not exists remediation_slides jsonb;

comment on column public.gap_analyses.remediation_slides is 'Serialized remedial slide deck after generateRemedialSlides.';

-- Lightweight activity stream (clicks, milestones); optional link to quiz session.
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  action text not null,
  metadata jsonb,
  quiz_session_id uuid references public.quiz_sessions (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_user_id_created_at_idx
  on public.activity_events (user_id, created_at desc);
create index if not exists activity_events_quiz_session_id_idx
  on public.activity_events (quiz_session_id);

comment on table public.activity_events is 'Client-reported UI actions and milestones for analytics.';
