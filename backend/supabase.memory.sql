create extension if not exists vector;

create table if not exists public.nexo_memory_entries (
  id uuid primary key default gen_random_uuid(),
  layer text not null check (layer in ('short', 'long', 'project', 'conversation', 'code')),
  title text not null,
  content text not null,
  source text,
  tags text[] not null default '{}',
  embedding vector(64) not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nexo_memory_entries_layer_idx
  on public.nexo_memory_entries (layer);

create index if not exists nexo_memory_entries_embedding_idx
  on public.nexo_memory_entries
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

alter table public.nexo_memory_entries enable row level security;

create policy "Service role manages NEXO memory"
  on public.nexo_memory_entries
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.match_nexo_memory (
  query_embedding vector(64),
  match_layers text[] default null,
  match_count int default 8
)
returns table (
  id uuid,
  layer text,
  title text,
  content text,
  source text,
  tags text[],
  score float
)
language sql
stable
as $$
  select
    nexo_memory_entries.id,
    nexo_memory_entries.layer,
    nexo_memory_entries.title,
    nexo_memory_entries.content,
    nexo_memory_entries.source,
    nexo_memory_entries.tags,
    1 - (nexo_memory_entries.embedding <=> query_embedding) as score
  from public.nexo_memory_entries
  where match_layers is null or nexo_memory_entries.layer = any(match_layers)
  order by nexo_memory_entries.embedding <=> query_embedding
  limit match_count;
$$;
