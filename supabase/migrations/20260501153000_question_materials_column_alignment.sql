-- Align existing question_materials table (if already present) with unified schema columns.

alter table if exists public.question_materials
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists is_active boolean not null default true,
  add column if not exists provider text,
  add column if not exists provider_item_id text,
  add column if not exists content_kind text,
  add column if not exists standard_code text,
  add column if not exists grade text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists url text,
  add column if not exists keywords jsonb,
  add column if not exists difficulty_hint text,
  add column if not exists metadata jsonb;

create unique index if not exists question_materials_provider_item_unique
  on public.question_materials (provider, provider_item_id);

create index if not exists question_materials_standard_grade_idx
  on public.question_materials (standard_code, grade);

create index if not exists question_materials_provider_standard_idx
  on public.question_materials (provider, standard_code);

create index if not exists question_materials_active_idx
  on public.question_materials (is_active);
