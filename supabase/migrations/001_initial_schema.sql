create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.monitored_entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  country text,
  status text not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  deleted_at timestamptz
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  connector_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  monitored_entity_id uuid references public.monitored_entities(id) on delete cascade,
  source_id uuid references public.sources(id),
  collected_at timestamptz not null,
  published_at timestamptz,
  title text not null,
  summary text,
  content text,
  url text,
  domain text,
  platform text,
  author_name text,
  author_handle text,
  author_url text,
  actor_type text,
  category text not null,
  subcategory text,
  verification_status text not null,
  sentiment text,
  provenance_type text not null,
  confidence_level text not null,
  risk_score integer not null check (risk_score between 0 and 100),
  risk_level text not null,
  threat_level integer not null check (threat_level between 1 and 5),
  physical_threat_score integer not null default 0,
  reach_value numeric,
  reach_type text not null default 'unavailable',
  engagement_value numeric,
  velocity_score integer not null default 0,
  coordination_level text not null default 'Não identificado',
  target text,
  location_exposure text,
  status text not null,
  owner_team text,
  assigned_to text,
  recommended_action text,
  analyst_notes text,
  next_action text,
  due_at timestamptz,
  indicators text[] not null default '{}',
  keywords text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  deleted_at timestamptz
);

create table if not exists public.incident_risk_factors (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade,
  reach integer not null check (reach between 0 and 100),
  velocity integer not null check (velocity between 0 and 100),
  source_influence integer not null check (source_influence between 0 and 100),
  damage_potential integer not null check (damage_potential between 0 and 100),
  persistence integer not null check (persistence between 0 and 100),
  coordination integer not null check (coordination between 0 and 100),
  press_proximity integer not null check (press_proximity between 0 and 100),
  physical_threat_factors jsonb not null default '{}'::jsonb,
  physical_threat_flags jsonb not null default '{}'::jsonb,
  override jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_status_history (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade,
  status text not null,
  changed_by uuid references public.users(id),
  justification text,
  created_at timestamptz not null default now()
);

create table if not exists public.actors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  handle text,
  url text,
  platform text,
  type text not null,
  description text,
  public_location text,
  created_at_public timestamptz,
  followers integer,
  followers_provenance text not null default 'NAO_DISPONIVEL',
  occurrence_count integer not null default 0,
  recurrence text,
  risk_score integer not null default 0,
  confidence_level text not null,
  last_activity timestamptz,
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  deleted_at timestamptz
);

create table if not exists public.actor_relationships (
  id uuid primary key default gen_random_uuid(),
  source_actor_id uuid references public.actors(id) on delete cascade,
  target_actor_id uuid references public.actors(id) on delete cascade,
  relationship_type text not null,
  confidence_level text not null,
  evidence_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.narratives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  central_message text,
  polarity text,
  volume integer not null default 0,
  growth integer not null default 0,
  velocity integer not null default 0,
  platforms text[] not null default '{}',
  top_sources text[] not null default '{}',
  top_amplifiers text[] not null default '{}',
  probable_origin text,
  risk_score integer not null default 0,
  confidence_level text not null,
  reached_audiences text[] not null default '{}',
  recommendation text,
  status text not null,
  provenance_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  deleted_at timestamptz
);

create table if not exists public.narrative_incidents (
  id uuid primary key default gen_random_uuid(),
  narrative_id uuid references public.narratives(id) on delete cascade,
  incident_id uuid references public.incidents(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (narrative_id, incident_id)
);

create table if not exists public.evidences (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade,
  type text not null,
  description text not null,
  file_path text,
  url text,
  file_hash text,
  collected_by uuid references public.users(id),
  collected_at timestamptz not null,
  source text,
  integrity text,
  observation text,
  confidence_level text not null,
  provenance_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.indicators (
  id uuid primary key default gen_random_uuid(),
  value text not null,
  type text not null,
  first_seen timestamptz,
  last_seen timestamptz,
  source text,
  confidence_level text not null,
  severity text not null,
  status text not null,
  observations text,
  tags text[] not null default '{}',
  provenance_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rule_key text not null unique,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  channels text[] not null default '{platform}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references public.alert_rules(id),
  incident_id uuid references public.incidents(id),
  title text not null,
  description text,
  severity text not null,
  status text not null default 'novo',
  provenance_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id),
  title text not null,
  owner_team text not null,
  due_at timestamptz,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  deleted_at timestamptz
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  deleted_at timestamptz
);

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  source_format text not null,
  total_rows integer not null,
  valid_rows integer not null,
  duplicate_rows integer not null,
  error_rows integer not null,
  imported_rows integer not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid references public.imports(id) on delete cascade,
  row_number integer not null,
  status text not null,
  raw_data jsonb not null,
  normalized_data jsonb,
  issue text,
  created_at timestamptz not null default now()
);

create table if not exists public.collector_runs (
  id uuid primary key default gen_random_uuid(),
  monitored_entity_id uuid references public.monitored_entities(id),
  connector_name text not null,
  params jsonb not null,
  status text not null,
  output_path text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error text
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  user_id uuid references public.users(id),
  previous_value text,
  new_value text,
  justification text,
  created_at timestamptz not null default now()
);

create table if not exists public.taxonomies (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.monitored_entities enable row level security;
alter table public.sources enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_risk_factors enable row level security;
alter table public.incident_status_history enable row level security;
alter table public.actors enable row level security;
alter table public.actor_relationships enable row level security;
alter table public.narratives enable row level security;
alter table public.narrative_incidents enable row level security;
alter table public.evidences enable row level security;
alter table public.indicators enable row level security;
alter table public.alert_rules enable row level security;
alter table public.alerts enable row level security;
alter table public.tasks enable row level security;
alter table public.reports enable row level security;
alter table public.imports enable row level security;
alter table public.import_rows enable row level security;
alter table public.collector_runs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.taxonomies enable row level security;
alter table public.tags enable row level security;

create policy "authenticated read users" on public.users for select to authenticated using (true);
create policy "authenticated read monitored entities" on public.monitored_entities for select to authenticated using (deleted_at is null);
create policy "authenticated read incidents" on public.incidents for select to authenticated using (deleted_at is null);
create policy "authenticated insert incidents" on public.incidents for insert to authenticated with check (true);
create policy "authenticated update incidents" on public.incidents for update to authenticated using (deleted_at is null);
create policy "authenticated read audit" on public.audit_logs for select to authenticated using (true);
create policy "authenticated insert audit" on public.audit_logs for insert to authenticated with check (true);
