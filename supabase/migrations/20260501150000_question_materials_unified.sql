-- Unified external materials bank for IXL, CPALMS/MFAS, Khan, etc.

create table if not exists public.question_materials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,

  provider text not null,
  provider_item_id text not null,
  content_kind text,

  standard_code text not null,
  grade text,
  title text not null,
  description text,
  url text not null,
  keywords jsonb,
  difficulty_hint text,
  metadata jsonb
);

create unique index if not exists question_materials_provider_item_unique
  on public.question_materials (provider, provider_item_id);

create index if not exists question_materials_standard_grade_idx
  on public.question_materials (standard_code, grade);

create index if not exists question_materials_provider_standard_idx
  on public.question_materials (provider, standard_code);

create index if not exists question_materials_active_idx
  on public.question_materials (is_active);

comment on table public.question_materials is
  'Unified provider-backed question material bank used for retrieval-grounded AI generation.';

comment on column public.question_materials.provider is
  'Material provider: IXL, CPALMS_MFAS, KHAN, etc.';

comment on column public.question_materials.provider_item_id is
  'Provider-native identifier (IXL skill_id, CPALMS resource_id, etc.).';

comment on column public.question_materials.difficulty_hint is
  'Heuristic difficulty hint used for retrieval priors (Easy/Medium/Hard).';
