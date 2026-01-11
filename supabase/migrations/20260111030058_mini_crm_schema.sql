-- Workspaces
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz default now()
);

create table workspace_users (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',
  primary key (workspace_id, user_id)
);

-- Funil
create table stages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  position int not null
);

create table stage_required_fields (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid references stages(id) on delete cascade,
  field_type text not null, -- 'standard' | 'custom'
  field_key text not null   -- name, phone ou custom_field_id
);

-- Leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  stage_id uuid references stages(id),
  owner_id uuid references auth.users(id),
  name text,
  email text,
  phone text,
  company text,
  role text,
  source text,
  notes text,
  created_at timestamptz default now()
);

-- Campos customizados
create table custom_fields (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  type text not null -- text, number, select
);

create table lead_custom_values (
  lead_id uuid references leads(id) on delete cascade,
  field_id uuid references custom_fields(id) on delete cascade,
  value text,
  primary key (lead_id, field_id)
);

-- Campanhas
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  context text not null,
  prompt text not null,
  trigger_stage_id uuid references stages(id),
  active boolean default true
);

-- Mensagens geradas
create table generated_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete cascade,
  content text not null,
  status text default 'draft',
  created_at timestamptz default now()
);
