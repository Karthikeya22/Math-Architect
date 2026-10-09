-- Khan Academy practice links aligned to Florida B.E.S.T. Math standards
-- (from processed CSV extract; not official FAST/CPALMS items)

create table if not exists public.standard_practice_links (
  id uuid primary key default gen_random_uuid(),
  set_id text not null default 'FL.BEST.Math',
  standard_id text not null,
  standard_description text,
  content_kind text not null default 'Exercise',
  content_title text not null,
  content_url text not null,
  source_generated_at timestamptz,
  created_at timestamptz not null default now(),
  constraint standard_practice_links_standard_url_unique unique (standard_id, content_url)
);

create index if not exists standard_practice_links_standard_id_idx
  on public.standard_practice_links (standard_id);

create index if not exists standard_practice_links_content_url_idx
  on public.standard_practice_links (content_url);

comment on table public.standard_practice_links is
  'Khan Academy exercise URLs mapped to B.E.S.T. standard codes; populated from data/processed/best-khan-mappings.json';
