-- Nexo V3 Supabase Schema

-- Enable vector extensions
create extension if not exists vector;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Clean-up existing tables if any
-- drop table if exists public.logs;
-- drop table if exists public.agents;
-- drop table if exists public.memories;
-- drop table if exists public.deployments;
-- drop table if exists public.messages;
-- drop table if exists public.files;
-- drop table if exists public.projects;
-- drop table if exists public.users;

-- =========================================================================
-- 1. USERS TABLE
-- =========================================================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for Users
alter table public.users enable row level security;

create policy "Users can read their own profiles"
  on public.users for select
  using (true);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- =========================================================================
-- 2. PROJECTS TABLE
-- =========================================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for Projects
alter table public.projects enable row level security;

create policy "Users can manage their own projects"
  on public.projects for all
  using (owner_id = auth.uid() or auth.role() = 'service_role');

-- =========================================================================
-- 3. FILES TABLE
-- =========================================================================
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  path text not null,
  content text not null default '',
  size integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, path)
);

-- RLS for Files
alter table public.files enable row level security;

create policy "Users can manage files of their projects"
  on public.files for all
  using (
    project_id in (select id from public.projects where owner_id = auth.uid()) 
    or auth.role() = 'service_role'
  );

-- =========================================================================
-- 4. MESSAGES TABLE
-- =========================================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid references public.users(id) on delete set null,
  role text not null check (role in ('user', 'assistant', 'system', 'model')),
  text text not null,
  created_at timestamptz not null default now()
);

-- RLS for Messages
alter table public.messages enable row level security;

create policy "Users can manage messages of their projects"
  on public.messages for all
  using (
    project_id in (select id from public.projects where owner_id = auth.uid())
    or auth.role() = 'service_role'
  );

-- =========================================================================
-- 5. DEPLOYMENTS TABLE
-- =========================================================================
create table if not exists public.deployments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider text not null check (provider in ('vercel', 'netlify', 'cloudflare', 'railway')),
  status text not null default 'pending' check (status in ('pending', 'building', 'active', 'failed')),
  url text,
  build_logs text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for Deployments
alter table public.deployments enable row level security;

create policy "Users can manage deployments of their projects"
  on public.deployments for all
  using (
    project_id in (select id from public.projects where owner_id = auth.uid())
    or auth.role() = 'service_role'
  );

-- =========================================================================
-- 6. MEMORIES TABLE (WITH VECTOR INTEGRATION)
-- =========================================================================
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  layer text not null check (layer in ('short', 'long', 'project', 'conversation', 'code')),
  title text not null,
  content text not null,
  source text,
  tags text[] not null default '{}',
  embedding vector(64) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for Memories
alter table public.memories enable row level security;

create policy "Users can manage their own memories"
  on public.memories for all
  using (user_id = auth.uid() or auth.role() = 'service_role');

-- Vector search index for cosine similarity
create index if not exists memories_embedding_idx
  on public.memories
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Match function for pgvector search
create or replace function public.match_memories (
  query_embedding vector(64),
  match_layers text[] default null,
  match_count int default 8,
  owner_user_id uuid default null
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
    memories.id,
    memories.layer,
    memories.title,
    memories.content,
    memories.source,
    memories.tags,
    1 - (memories.embedding <=> query_embedding) as score
  from public.memories
  where (owner_user_id is null or memories.user_id = owner_user_id)
    and (match_layers is null or memories.layer = any(match_layers))
  order by memories.embedding <=> query_embedding
  limit match_count;
$$;

-- =========================================================================
-- 7. AGENTS TABLE
-- =========================================================================
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'idle' check (status in ('idle', 'planning', 'working', 'speaking')),
  current_goal text,
  task_graph jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id)
);

-- RLS for Agents
alter table public.agents enable row level security;

create policy "Users can manage agents of their projects"
  on public.agents for all
  using (
    project_id in (select id from public.projects where owner_id = auth.uid())
    or auth.role() = 'service_role'
  );

-- =========================================================================
-- 8. LOGS TABLE
-- =========================================================================
create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source text not null check (source in ('runtime', 'terminal', 'agent', 'deploy')),
  level text not null default 'info' check (level in ('info', 'warn', 'error')),
  message text not null,
  created_at timestamptz not null default now()
);

-- RLS for Logs
alter table public.logs enable row level security;

create policy "Users can view logs of their projects"
  on public.logs for all
  using (
    project_id in (select id from public.projects where owner_id = auth.uid())
    or auth.role() = 'service_role'
  );

-- =========================================================================
-- AUTO-UPDATE UPDATED_AT TRIGGERS
-- =========================================================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_users_updated_at before update on public.users for each row execute function public.update_updated_at_column();
create trigger trigger_update_projects_updated_at before update on public.projects for each row execute function public.update_updated_at_column();
create trigger trigger_update_files_updated_at before update on public.files for each row execute function public.update_updated_at_column();
create trigger trigger_update_deployments_updated_at before update on public.deployments for each row execute function public.update_updated_at_column();
create trigger trigger_update_memories_updated_at before update on public.memories for each row execute function public.update_updated_at_column();
create trigger trigger_update_agents_updated_at before update on public.agents for each row execute function public.update_updated_at_column();

-- =========================================================================
-- 9. CONVERSATIONS TABLE
-- =========================================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null default 'New Conversation',
  model text not null,
  is_pinned boolean not null default false,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for Conversations
alter table public.conversations enable row level security;
create policy "Users can manage conversations of their projects"
  on public.conversations for all
  using (project_id in (select id from public.projects where owner_id = auth.uid()) or auth.role() = 'service_role');

-- Add conversation columns to Messages
alter table public.messages add column if not exists conversation_id uuid references public.conversations(id) on delete cascade;
alter table public.messages add column if not exists tokens_used integer default 0;
alter table public.messages add column if not exists has_attachments boolean default false;

-- =========================================================================
-- 10. ATTACHMENTS TABLE
-- =========================================================================
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_name text not null,
  file_size integer not null default 0,
  mime_type text,
  file_path text not null,
  created_at timestamptz not null default now()
);

-- RLS for Attachments
alter table public.attachments enable row level security;
create policy "Users can manage attachments of their messages"
  on public.attachments for all
  using (message_id in (select id from public.messages where conversation_id in (select id from public.conversations where project_id in (select id from public.projects where owner_id = auth.uid()))) or auth.role() = 'service_role');

-- =========================================================================
-- 11. CHAT_BRANCHES TABLE
-- =========================================================================
create table if not exists public.chat_branches (
  id uuid primary key default gen_random_uuid(),
  parent_conversation_id uuid not null references public.conversations(id) on delete cascade,
  forked_message_id uuid not null references public.messages(id) on delete cascade,
  branched_conversation_id uuid not null references public.conversations(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS for Chat Branches
alter table public.chat_branches enable row level security;
create policy "Users can manage chat branches"
  on public.chat_branches for all
  using (parent_conversation_id in (select id from public.conversations where project_id in (select id from public.projects where owner_id = auth.uid())) or auth.role() = 'service_role');

create trigger trigger_update_conversations_updated_at before update on public.conversations for each row execute function public.update_updated_at_column();
