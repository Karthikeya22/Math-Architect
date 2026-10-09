-- Optional link to a persisted quiz question row; bank rows leave null.
alter table if exists public.question_materials
  add column if not exists question_id uuid;

-- Required by many dashboards; bank rows use a generic type.
alter table if exists public.question_materials
  add column if not exists material_type text not null default 'reference_item';

comment on column public.question_materials.material_type is
  'Kind of material row, e.g. reference_item, attachment; seed scripts use reference_item for IXL/CPALMS bank items.';
